import re
from typing import List, Dict, Any, Optional
from tools.code_index.parsers.base import BaseParser, ParsedFile, ParsedSymbol


class MarkdownParser(BaseParser):
    """Parser para arquivos Markdown de documentação arquitetural e de requisitos."""

    def can_parse(self, language: str, path: str) -> bool:
        return language == "markdown" or path.endswith(".md")

    def _infer_domain(self, rel_path: str) -> str:
        p_lower = rel_path.lower()
        if "arquitetura" in p_lower:
            return "ARCHITECTURE"
        if "seguranca" in p_lower or "rbac" in p_lower or "identidade" in p_lower or "rls" in p_lower or "matriz" in p_lower:
            return "SECURITY"
        if "requisitos" in p_lower or "regras" in p_lower:
            return "REQUIREMENTS"
        if "modelo" in p_lower or "dados" in p_lower:
            return "DATABASE"
        if "teste" in p_lower:
            return "TESTS"
        if "organizacao" in p_lower or "localidades" in p_lower:
            return "ORGANIZATION"
        return "DOCS"

    def parse(self, content: str, rel_path: str, language: str) -> ParsedFile:
        parsed = ParsedFile(rel_path=rel_path, language="markdown", raw_content=content)
        lines = content.splitlines()
        domain = self._infer_domain(rel_path)

        heading_pattern = re.compile(r"^(#{1,4})\s+(.+)$")
        
        # Encontrar todas as posições de headings
        heading_indices = []
        for idx, line in enumerate(lines):
            line_str = line.strip()
            m = heading_pattern.match(line_str)
            if m:
                heading_indices.append((idx, m.group(2).strip()))

        if not heading_indices:
            # Sem headings, usar arquivo inteiro
            parsed.symbols.append(
                ParsedSymbol(
                    name=rel_path.split("/")[-1],
                    qualified_name=f"{rel_path}:doc",
                    symbol_type="DOCUMENT_SECTION",
                    start_line=1,
                    end_line=len(lines),
                    signature=f"Doc: {rel_path}",
                    language="markdown",
                    domain=domain,
                    summary=f"Documento {rel_path}",
                    content=content,
                )
            )
            return parsed

        for i, (h_idx, h_title) in enumerate(heading_indices):
            start_line = h_idx + 1
            if i + 1 < len(heading_indices):
                end_line = heading_indices[i + 1][0]
            else:
                end_line = len(lines)

            sec_content = "\n".join(lines[h_idx:end_line]).strip()

            parsed.symbols.append(
                ParsedSymbol(
                    name=h_title,
                    qualified_name=f"{rel_path}:{h_title}",
                    symbol_type="DOCUMENT_SECTION",
                    start_line=start_line,
                    end_line=end_line,
                    signature=f"Section: {h_title}",
                    language="markdown",
                    domain=domain,
                    summary=f"Seção '{h_title}' em {rel_path}",
                    content=sec_content,
                )
            )

        return parsed
