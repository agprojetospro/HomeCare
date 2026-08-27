import sqlite3
import json
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime

from tools.code_index.parsers.base import ParsedSymbol
from tools.code_index.chunker.chunker import CodeChunk
from tools.code_index.embeddings.base import pack_vector


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS repositories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  root_path TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  repository_id TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL,
  size INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  mtime REAL NOT NULL,
  indexed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS symbols (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  qualified_name TEXT NOT NULL,
  symbol_type TEXT NOT NULL,
  signature TEXT,
  start_line INTEGER NOT NULL,
  end_line INTEGER NOT NULL,
  language TEXT NOT NULL,
  domain TEXT,
  summary TEXT,
  content_hash TEXT NOT NULL,
  metadata_json TEXT DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  symbol_id TEXT,
  start_line INTEGER NOT NULL,
  end_line INTEGER NOT NULL,
  content TEXT NOT NULL,
  search_text TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  embedding_model TEXT,
  vector_blob BLOB,
  indexed_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
  chunk_id UNINDEXED,
  symbol_name,
  file_path,
  search_text,
  content
);

CREATE TABLE IF NOT EXISTS dependencies (
  id TEXT PRIMARY KEY,
  source_symbol_id TEXT NOT NULL REFERENCES symbols(id) ON DELETE CASCADE,
  target_name TEXT NOT NULL,
  target_symbol_id TEXT,
  dependency_type TEXT NOT NULL,
  metadata_json TEXT DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS index_runs (
  id TEXT PRIMARY KEY,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  branch TEXT,
  commit_sha TEXT,
  files_scanned INTEGER DEFAULT 0,
  files_added INTEGER DEFAULT 0,
  files_changed INTEGER DEFAULT 0,
  files_deleted INTEGER DEFAULT 0,
  chunks_generated INTEGER DEFAULT 0,
  embeddings_generated INTEGER DEFAULT 0,
  status TEXT DEFAULT 'RUNNING',
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);
CREATE INDEX IF NOT EXISTS idx_symbols_name ON symbols(name);
CREATE INDEX IF NOT EXISTS idx_symbols_file ON symbols(file_id);
CREATE INDEX IF NOT EXISTS idx_symbols_type ON symbols(symbol_type);
CREATE INDEX IF NOT EXISTS idx_chunks_file ON chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_chunks_symbol ON chunks(symbol_id);
CREATE INDEX IF NOT EXISTS idx_deps_source ON dependencies(source_symbol_id);
CREATE INDEX IF NOT EXISTS idx_deps_target ON dependencies(target_name);
"""


class Database:
    """Gerenciador do banco SQLite local de metadados, FTS5 e vetores."""

    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(self.db_path))
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA foreign_keys = ON;")
        self.conn.execute("PRAGMA journal_mode = WAL;")

    def init_schema(self, repo_name: str = "HomeCare", repo_root: str = "."):
        with self.conn:
            self.conn.executescript(SCHEMA_SQL)
            self.conn.execute(
                "INSERT OR IGNORE INTO repositories (id, name, root_path) VALUES (?, ?, ?);",
                ("repo_homecare", repo_name, repo_root),
            )

    def close(self):
        self.conn.close()

    def get_file_by_path(self, rel_path: str) -> Optional[sqlite3.Row]:
        cur = self.conn.cursor()
        cur.execute("SELECT * FROM files WHERE path = ? AND status = 'ACTIVE';", (rel_path,))
        return cur.fetchone()

    def get_all_active_files(self) -> List[sqlite3.Row]:
        cur = self.conn.cursor()
        cur.execute("SELECT * FROM files WHERE status = 'ACTIVE';")
        return cur.fetchall()

    def delete_file_records(self, file_id: str):
        """Remove chunks, símbolos e dependências do arquivo deletado."""
        with self.conn:
            # Obter chunks para remover do FTS5
            cur = self.conn.cursor()
            cur.execute("SELECT id FROM chunks WHERE file_id = ?;", (file_id,))
            chunk_ids = [row["id"] for row in cur.fetchall()]
            for cid in chunk_ids:
                self.conn.execute("DELETE FROM chunks_fts WHERE chunk_id = ?;", (cid,))

            self.conn.execute("DELETE FROM chunks WHERE file_id = ?;", (file_id,))
            self.conn.execute("DELETE FROM symbols WHERE file_id = ?;", (file_id,))
            self.conn.execute("DELETE FROM files WHERE id = ?;", (file_id,))

    def upsert_file(
        self,
        rel_path: str,
        language: str,
        size: int,
        content_hash: str,
        mtime: float,
        repository_id: str = "repo_homecare",
    ) -> str:
        cur = self.conn.cursor()
        cur.execute("SELECT id FROM files WHERE path = ?;", (rel_path,))
        row = cur.fetchone()
        
        file_id = row["id"] if row else f"file_{content_hash[:16]}"

        with self.conn:
            if row:
                # Limpar símbolos e chunks antigos antes de reindexar
                self.delete_file_records(file_id)

            self.conn.execute(
                """
                INSERT INTO files (id, repository_id, path, language, size, content_hash, mtime, indexed_at, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'ACTIVE');
                """,
                (file_id, repository_id, rel_path, language, size, content_hash, mtime),
            )
        return file_id

    def insert_symbols(self, file_id: str, symbols: List[ParsedSymbol]) -> Dict[str, str]:
        """Insere símbolos e retorna mapa {symbol_name: symbol_id}."""
        symbol_id_map = {}
        with self.conn:
            for s in symbols:
                c_hash = s.content_hash or hashlib.sha256(s.content.encode("utf-8")).hexdigest()
                sym_id = f"sym_{c_hash[:12]}_{s.start_line}"
                symbol_id_map[s.name] = sym_id
                self.conn.execute(
                    """
                    INSERT OR REPLACE INTO symbols (
                        id, file_id, name, qualified_name, symbol_type, signature,
                        start_line, end_line, language, domain, summary, content_hash, metadata_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                    """,
                    (
                        sym_id,
                        file_id,
                        s.name,
                        s.qualified_name,
                        s.symbol_type,
                        s.signature,
                        s.start_line,
                        s.end_line,
                        getattr(s, "language", "text") or "text",
                        s.domain,
                        s.summary,
                        c_hash,
                        json.dumps(s.metadata or {}),
                    ),
                )
        return symbol_id_map

    def insert_chunks(
        self,
        file_id: str,
        chunks: List[CodeChunk],
        vectors: Optional[List[List[float]]] = None,
        model_name: str = "ollama",
    ):
        with self.conn:
            for i, chunk in enumerate(chunks):
                vec_blob = pack_vector(vectors[i]) if (vectors and i < len(vectors)) else None
                self.conn.execute(
                    """
                    INSERT OR REPLACE INTO chunks (
                        id, file_id, symbol_id, start_line, end_line,
                        content, search_text, content_hash, embedding_model, vector_blob
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                    """,
                    (
                        chunk.id,
                        file_id,
                        chunk.symbol_name,
                        chunk.start_line,
                        chunk.end_line,
                        chunk.content,
                        chunk.search_text,
                        chunk.content_hash,
                        model_name,
                        vec_blob,
                    ),
                )
                # Inserir no FTS5
                self.conn.execute(
                    """
                    INSERT INTO chunks_fts (chunk_id, symbol_name, file_path, search_text, content)
                    VALUES (?, ?, ?, ?, ?);
                    """,
                    (
                        chunk.id,
                        chunk.symbol_name,
                        chunk.file_path,
                        chunk.search_text,
                        chunk.content,
                    ),
                )

    def insert_dependencies(self, symbol_id: str, dependencies: List[Dict[str, Any]]):
        with self.conn:
            for dep in dependencies:
                target_name = dep.get("target_name", "")
                dep_type = dep.get("type", "REFERENCES")
                dep_id = f"dep_{symbol_id}_{target_name}_{dep_type}"
                self.conn.execute(
                    """
                    INSERT OR REPLACE INTO dependencies (id, source_symbol_id, target_name, dependency_type, metadata_json)
                    VALUES (?, ?, ?, ?, ?);
                    """,
                    (dep_id, symbol_id, target_name, dep_type, json.dumps(dep.get("metadata", {}))),
                )

    def start_index_run(self, branch: Optional[str] = None, commit_sha: Optional[str] = None) -> str:
        run_id = f"run_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        with self.conn:
            self.conn.execute(
                """
                INSERT INTO index_runs (id, started_at, branch, commit_sha, status)
                VALUES (?, CURRENT_TIMESTAMP, ?, ?, 'RUNNING');
                """,
                (run_id, branch, commit_sha),
            )
        return run_id

    def finish_index_run(
        self,
        run_id: str,
        scanned: int,
        added: int,
        changed: int,
        deleted: int,
        chunks: int,
        embeddings: int,
        status: str = "SUCCESS",
        error: Optional[str] = None,
    ):
        with self.conn:
            self.conn.execute(
                """
                UPDATE index_runs
                SET completed_at = CURRENT_TIMESTAMP,
                    files_scanned = ?,
                    files_added = ?,
                    files_changed = ?,
                    files_deleted = ?,
                    chunks_generated = ?,
                    embeddings_generated = ?,
                    status = ?,
                    error = ?
                WHERE id = ?;
                """,
                (scanned, added, changed, deleted, chunks, embeddings, status, error, run_id),
            )

    def get_status_summary(self) -> Dict[str, Any]:
        cur = self.conn.cursor()
        files_count = cur.execute("SELECT COUNT(*) FROM files WHERE status = 'ACTIVE';").fetchone()[0]
        symbols_count = cur.execute("SELECT COUNT(*) FROM symbols;").fetchone()[0]
        chunks_count = cur.execute("SELECT COUNT(*) FROM chunks;").fetchone()[0]
        vectors_count = cur.execute("SELECT COUNT(*) FROM chunks WHERE vector_blob IS NOT NULL;").fetchone()[0]
        deps_count = cur.execute("SELECT COUNT(*) FROM dependencies;").fetchone()[0]
        last_run = cur.execute("SELECT * FROM index_runs ORDER BY started_at DESC LIMIT 1;").fetchone()

        return {
            "db_path": str(self.db_path),
            "files_indexed": files_count,
            "symbols_count": symbols_count,
            "chunks_count": chunks_count,
            "vectors_count": vectors_count,
            "dependencies_count": deps_count,
            "last_run": dict(last_run) if last_run else None,
        }
