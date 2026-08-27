import hashlib
from dataclasses import dataclass
from typing import List, Optional
from tools.code_index.parsers.base import ParsedFile, ParsedSymbol


@dataclass
class CodeChunk:
    id: str
    file_path: str
    symbol_name: str
    symbol_type: str
    start_line: int
    end_line: int
    content: str
    search_text: str
    content_hash: str
    domain: Optional[str] = None
    language: str = "text"


class CodeChunker:
    """Transforma arquivos e símbolos em chunks semânticos enriquecidos."""

    MAX_CHUNK_LINES = 90
    OVERLAP_LINES = 15

    @classmethod
    def generate_search_text(
        cls,
        rel_path: str,
        symbol_name: str,
        symbol_type: str,
        domain: Optional[str],
        signature: Optional[str],
        summary: Optional[str],
        content: str,
    ) -> str:
        parts = [
            f"File: {rel_path}",
            f"Symbol: {symbol_name}",
            f"Type: {symbol_type}",
        ]
        if domain:
            parts.append(f"Domain: {domain}")
        if signature:
            parts.append(f"Signature: {signature}")
        if summary:
            parts.append(f"Summary: {summary}")

        parts.append("Content:")
        parts.append(content)
        return "\n".join(parts)

    @classmethod
    def chunk_file(cls, parsed_file: ParsedFile) -> List[CodeChunk]:
        chunks: List[CodeChunk] = []

        if not parsed_file.symbols:
            # Chunk de arquivo inteiro se nenhum símbolo foi extraído
            lines = parsed_file.raw_content.splitlines()
            total_lines = len(lines)
            content_hash = hashlib.sha256(parsed_file.raw_content.encode("utf-8")).hexdigest()
            search_text = cls.generate_search_text(
                rel_path=parsed_file.rel_path,
                symbol_name=parsed_file.rel_path.split("/")[-1],
                symbol_type="FILE",
                domain="GENERAL",
                signature=f"File: {parsed_file.rel_path}",
                summary=f"Arquivo completo {parsed_file.rel_path}",
                content=parsed_file.raw_content,
            )
            chunk_id = f"{parsed_file.rel_path}:1:{total_lines}"
            chunks.append(
                CodeChunk(
                    id=chunk_id,
                    file_path=parsed_file.rel_path,
                    symbol_name=parsed_file.rel_path.split("/")[-1],
                    symbol_type="FILE",
                    start_line=1,
                    end_line=total_lines,
                    content=parsed_file.raw_content,
                    search_text=search_text,
                    content_hash=content_hash,
                    domain="GENERAL",
                    language=parsed_file.language,
                )
            )
            return chunks

        for sym in parsed_file.symbols:
            sym_lines = sym.content.splitlines()
            num_lines = len(sym_lines)

            if num_lines <= cls.MAX_CHUNK_LINES:
                # Símbolo cabe em 1 chunk
                content_hash = hashlib.sha256(sym.content.encode("utf-8")).hexdigest()
                search_text = cls.generate_search_text(
                    rel_path=parsed_file.rel_path,
                    symbol_name=sym.name,
                    symbol_type=sym.symbol_type,
                    domain=sym.domain,
                    signature=sym.signature,
                    summary=sym.summary,
                    content=sym.content,
                )
                chunk_id = f"{parsed_file.rel_path}:{sym.name}:{sym.start_line}"
                chunks.append(
                    CodeChunk(
                        id=chunk_id,
                        file_path=parsed_file.rel_path,
                        symbol_name=sym.name,
                        symbol_type=sym.symbol_type,
                        start_line=sym.start_line,
                        end_line=sym.end_line,
                        content=sym.content,
                        search_text=search_text,
                        content_hash=content_hash,
                        domain=sym.domain,
                        language=parsed_file.language,
                    )
                )
            else:
                # Sub-chunking para símbolos muito grandes
                step = cls.MAX_CHUNK_LINES - cls.OVERLAP_LINES
                part_idx = 1
                for start_offset in range(0, num_lines, step):
                    end_offset = min(start_offset + cls.MAX_CHUNK_LINES, num_lines)
                    sub_content = "\n".join(sym_lines[start_offset:end_offset])
                    content_hash = hashlib.sha256(sub_content.encode("utf-8")).hexdigest()
                    
                    sub_start_line = sym.start_line + start_offset
                    sub_end_line = sym.start_line + end_offset - 1
                    
                    search_text = cls.generate_search_text(
                        rel_path=parsed_file.rel_path,
                        symbol_name=f"{sym.name} (Part {part_idx})",
                        symbol_type=sym.symbol_type,
                        domain=sym.domain,
                        signature=sym.signature,
                        summary=f"{sym.summary} - Parte {part_idx}",
                        content=sub_content,
                    )
                    chunk_id = f"{parsed_file.rel_path}:{sym.name}:{sub_start_line}_p{part_idx}"
                    chunks.append(
                        CodeChunk(
                            id=chunk_id,
                            file_path=parsed_file.rel_path,
                            symbol_name=sym.name,
                            symbol_type=sym.symbol_type,
                            start_line=sub_start_line,
                            end_line=sub_end_line,
                            content=sub_content,
                            search_text=search_text,
                            content_hash=content_hash,
                            domain=sym.domain,
                            language=parsed_file.language,
                        )
                    )
                    part_idx += 1
                    if end_offset >= num_lines:
                        break

        return chunks

