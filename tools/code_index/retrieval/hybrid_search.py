import math
import re
from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Tuple

from tools.code_index.database.db import Database
from tools.code_index.embeddings.base import EmbeddingProvider, unpack_vector, cosine_similarity
from tools.code_index.config import SearchConfig


@dataclass
class SearchResult:
    rank: int
    file_path: str
    symbol_name: str
    symbol_type: str
    start_line: int
    end_line: int
    score: float
    vector_score: float
    fts_score: float
    snippet: str
    domain: Optional[str] = None
    signature: Optional[str] = None


class HybridSearchEngine:
    """Motor de busca híbrida combinando busca vetorial, FTS5 e metadados."""

    def __init__(
        self,
        db: Database,
        embedding_provider: EmbeddingProvider,
        config: Optional[SearchConfig] = None,
    ):
        self.db = db
        self.provider = embedding_provider
        self.config = config or SearchConfig()

    def _sanitize_fts_query(self, query: str) -> str:
        # Extrair palavras alfanuméricas para montar query FTS5 segura
        tokens = re.findall(r"[A-Za-z0-9_]+", query)
        if not tokens:
            return ""
        # Usar busca com operador OR / prefixo
        return " OR ".join(f'"{tok}"*' for tok in tokens)

    def fts_search(self, query: str, limit: int = 50) -> Dict[str, Tuple[float, Dict[str, Any]]]:
        fts_query = self._sanitize_fts_query(query)
        if not fts_query:
            return {}

        results: Dict[str, Tuple[float, Dict[str, Any]]] = {}
        cur = self.db.conn.cursor()

        try:
            sql = """
            SELECT 
                c.id as chunk_id,
                c.file_id,
                f.path as file_path,
                f.language,
                c.symbol_id as symbol_name,
                s.symbol_type,
                s.signature,
                s.domain,
                c.start_line,
                c.end_line,
                c.content,
                c.search_text,
                bm25(chunks_fts) as rank_score
            FROM chunks_fts
            JOIN chunks c ON c.id = chunks_fts.chunk_id
            JOIN files f ON f.id = c.file_id
            LEFT JOIN symbols s ON s.id = c.symbol_id OR (s.name = c.symbol_id AND s.file_id = c.file_id)
            WHERE chunks_fts MATCH ?
            ORDER BY rank_score ASC
            LIMIT ?;
            """
            cur.execute(sql, (fts_query, limit))
            rows = cur.fetchall()

            for row in rows:
                chunk_id = row["chunk_id"]
                # BM25 no sqlite é um número negativo (menor é melhor). Normalizar para [0, 1]
                raw_score = abs(float(row["rank_score"]))
                normalized_score = 1.0 / (1.0 + raw_score)

                results[chunk_id] = (normalized_score, dict(row))
        except Exception:
            # Fallback se FTS5 tiver erro de sintaxe
            pass

        return results

    def vector_search(self, query_text: str, limit: int = 50) -> Dict[str, Tuple[float, Dict[str, Any]]]:
        query_vec = self.provider.embed_text(query_text)
        results: Dict[str, Tuple[float, Dict[str, Any]]] = {}

        cur = self.db.conn.cursor()
        sql = """
        SELECT 
            c.id as chunk_id,
            c.file_id,
            f.path as file_path,
            f.language,
            c.symbol_id as symbol_name,
            s.symbol_type,
            s.signature,
            s.domain,
            c.start_line,
            c.end_line,
            c.content,
            c.search_text,
            c.vector_blob
        FROM chunks c
        JOIN files f ON f.id = c.file_id
        LEFT JOIN symbols s ON s.id = c.symbol_id OR (s.name = c.symbol_id AND s.file_id = c.file_id)
        WHERE c.vector_blob IS NOT NULL;
        """
        cur.execute(sql)
        rows = cur.fetchall()

        scores = []
        for row in rows:
            blob = row["vector_blob"]
            if not blob:
                continue
            chunk_vec = unpack_vector(blob)
            sim = cosine_similarity(query_vec, chunk_vec)
            if sim > 0.05:  # Filtro mínimo de relevância
                scores.append((row["chunk_id"], sim, dict(row)))

        # Ordenar por similaridade decrescente
        scores.sort(key=lambda x: x[1], reverse=True)

        for chunk_id, sim, row_dict in scores[:limit]:
            results[chunk_id] = (sim, row_dict)

        return results

    def search(
        self,
        query: str,
        top_k: int = 10,
        filter_type: Optional[str] = None,
        filter_lang: Optional[str] = None,
        filter_path: Optional[str] = None,
        filter_domain: Optional[str] = None,
    ) -> List[SearchResult]:
        fts_res = self.fts_search(query, limit=top_k * 3)
        vec_res = self.vector_search(query, limit=top_k * 3)

        all_chunk_ids = set(fts_res.keys()).union(set(vec_res.keys()))
        combined: List[Tuple[float, float, float, Dict[str, Any]]] = []

        v_w = self.config.vector_weight
        f_w = self.config.fts_weight
        m_w = self.config.metadata_weight

        for cid in all_chunk_ids:
            v_score, v_data = vec_res.get(cid, (0.0, None))
            f_score, f_data = fts_res.get(cid, (0.0, None))

            data = v_data or f_data
            if not data:
                continue

            # Aplicar filtros
            if filter_type and (data.get("symbol_type") or "").upper() != filter_type.upper():
                continue
            if filter_lang and (data.get("language") or "").lower() != filter_lang.lower():
                continue
            if filter_path and filter_path.lower() not in (data.get("file_path") or "").lower():
                continue
            if filter_domain and (data.get("domain") or "").upper() != filter_domain.upper():
                continue

            # Boost de metadados se o nome do símbolo coincidir com tokens da query
            sym_name = (data.get("symbol_name") or "").lower()
            query_lower = query.lower()
            meta_boost = 0.0
            if sym_name and sym_name in query_lower:
                meta_boost = 1.0
            elif any(w in sym_name for w in re.findall(r"[a-z0-9_]+", query_lower)):
                meta_boost = 0.5

            final_score = (v_score * v_w) + (f_score * f_w) + (meta_boost * m_w)
            combined.append((final_score, v_score, f_score, data))

        combined.sort(key=lambda x: x[0], reverse=True)

        final_results: List[SearchResult] = []
        for rank, (score, v_score, f_score, data) in enumerate(combined[:top_k], start=1):
            content_snippet = data.get("content", "")
            snippet_lines = content_snippet.splitlines()[:6]
            snippet = "\n".join(snippet_lines)
            if len(content_snippet.splitlines()) > 6:
                snippet += "\n..."

            final_results.append(
                SearchResult(
                    rank=rank,
                    file_path=data.get("file_path", ""),
                    symbol_name=data.get("symbol_name", ""),
                    symbol_type=data.get("symbol_type") or "CODE",
                    start_line=int(data.get("start_line", 1)),
                    end_line=int(data.get("end_line", 1)),
                    score=round(score, 4),
                    vector_score=round(v_score, 4),
                    fts_score=round(f_score, 4),
                    snippet=snippet,
                    domain=data.get("domain"),
                    signature=data.get("signature"),
                )
            )

        return final_results

