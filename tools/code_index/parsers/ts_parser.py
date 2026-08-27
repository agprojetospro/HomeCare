import re
from typing import List, Dict, Any, Optional
from tools.code_index.parsers.base import BaseParser, ParsedFile, ParsedSymbol


class TypeScriptParser(BaseParser):
    """Parser para arquivos TypeScript, TSX e JavaScript."""

    def can_parse(self, language: str, path: str) -> bool:
        return language in ("typescript", "tsx", "javascript", "jsx")

    def _infer_domain(self, rel_path: str) -> str:
        parts = rel_path.replace("\\", "/").split("/")
        if "patient" in rel_path.lower() or "paciente" in rel_path.lower():
            return "PATIENT"
        if "professional" in rel_path.lower() or "profissional" in rel_path.lower():
            return "PROFESSIONAL"
        if "triage" in rel_path.lower() or "triagem" in rel_path.lower():
            return "TRIAGE"
        if "shift" in rel_path.lower() or "escala" in rel_path.lower():
            return "SHIFT"
        if "pep" in rel_path.lower():
            return "PEP"
        if "security" in rel_path.lower() or "rbac" in rel_path.lower() or "auth" in rel_path.lower():
            return "SECURITY"
        if "audit" in rel_path.lower() or "auditoria" in rel_path.lower():
            return "AUDIT"
        if "unit" in rel_path.lower() or "unidade" in rel_path.lower() or "location" in rel_path.lower():
            return "ORGANIZATION"
        return "GENERAL"

    def parse(self, content: str, rel_path: str, language: str) -> ParsedFile:
        parsed = ParsedFile(rel_path=rel_path, language=language, raw_content=content)
        lines = content.splitlines()
        domain = self._infer_domain(rel_path)

        # 1. Extrair Imports
        import_pattern = re.compile(r"import\s+.*?from\s+['\"]([^'\"]+)['\"]", re.MULTILINE)
        for match in import_pattern.finditer(content):
            parsed.imports.append(match.group(1))

        # Regexes para linhas stripadas
        interface_pattern = re.compile(r"^(?:export\s+)?interface\s+([A-Za-z0-9_]+)")
        type_pattern = re.compile(r"^(?:export\s+)?type\s+([A-Za-z0-9_]+)\s*=")
        enum_pattern = re.compile(r"^(?:export\s+)?enum\s+([A-Za-z0-9_]+)")
        class_pattern = re.compile(r"^(?:export\s+)?(?:default\s+)?class\s+([A-Za-z0-9_]+)")
        func_pattern = re.compile(r"^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(")
        arrow_func_pattern = re.compile(r"^(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z0-9_]+|\()\s*(?::\s*[^{=]+)?\s*=>")
        test_pattern = re.compile(r"^(?:describe|it|test)\(['\"]([^'\"]+)['\"]")

        def find_block_end(start_line_idx: int) -> int:
            open_braces = 0
            found_first_brace = False
            for idx in range(start_line_idx, len(lines)):
                line = lines[idx]
                for char in line:
                    if char == "{":
                        open_braces += 1
                        found_first_brace = True
                    elif char == "}":
                        open_braces -= 1
                if found_first_brace and open_braces <= 0:
                    return idx + 1
            return min(start_line_idx + 25, len(lines))

        for i, line in enumerate(lines):
            line_str = line.strip()
            if not line_str or line_str.startswith("//") or line_str.startswith("/*") or line_str.startswith("*"):
                continue

            # Interfaces
            m = interface_pattern.match(line_str)
            if m:
                name = m.group(1)
                end_line = find_block_end(i)
                block_content = "\n".join(lines[i:end_line])
                parsed.symbols.append(
                    ParsedSymbol(
                        name=name,
                        qualified_name=f"{rel_path}:{name}",
                        symbol_type="INTERFACE",
                        start_line=i + 1,
                        end_line=end_line,
                        signature=line_str,
                        language=language,
                        domain=domain,
                        summary=f"Interface TypeScript {name}",
                        content=block_content,
                    )
                )
                continue

            # Types
            m = type_pattern.match(line_str)
            if m:
                name = m.group(1)
                end_line = min(i + 5, len(lines))
                block_content = "\n".join(lines[i:end_line])
                parsed.symbols.append(
                    ParsedSymbol(
                        name=name,
                        qualified_name=f"{rel_path}:{name}",
                        symbol_type="TYPE",
                        start_line=i + 1,
                        end_line=end_line,
                        signature=line_str,
                        language=language,
                        domain=domain,
                        summary=f"Definição de Tipo TypeScript {name}",
                        content=block_content,
                    )
                )
                continue

            # Enums
            m = enum_pattern.match(line_str)
            if m:
                name = m.group(1)
                end_line = find_block_end(i)
                block_content = "\n".join(lines[i:end_line])
                parsed.symbols.append(
                    ParsedSymbol(
                        name=name,
                        qualified_name=f"{rel_path}:{name}",
                        symbol_type="ENUM",
                        start_line=i + 1,
                        end_line=end_line,
                        signature=line_str,
                        language=language,
                        domain=domain,
                        summary=f"Enum TypeScript {name}",
                        content=block_content,
                    )
                )
                continue

            # Classes
            m = class_pattern.match(line_str)
            if m:
                name = m.group(1)
                end_line = find_block_end(i)
                block_content = "\n".join(lines[i:end_line])
                parsed.symbols.append(
                    ParsedSymbol(
                        name=name,
                        qualified_name=f"{rel_path}:{name}",
                        symbol_type="CLASS",
                        start_line=i + 1,
                        end_line=end_line,
                        signature=line_str,
                        language=language,
                        domain=domain,
                        summary=f"Classe {name}",
                        content=block_content,
                    )
                )
                continue

            # Funções / Componentes / Hooks
            m = func_pattern.match(line_str) or arrow_func_pattern.match(line_str)
            if m:
                name = m.group(1)
                params = m.group(2) if len(m.groups()) > 1 else ""
                end_line = find_block_end(i)
                block_content = "\n".join(lines[i:end_line])

                # Classificar se é Componente, Hook ou Função
                if name.startswith("use") and len(name) > 3 and name[3].isupper():
                    sym_type = "HOOK"
                elif name[0].isupper() or "page" in rel_path.lower() or "<" in block_content:
                    sym_type = "COMPONENT"
                else:
                    sym_type = "FUNCTION"

                # Extrair dependências deste bloco
                block_deps = []
                for tbl in set(re.findall(r"\.from\(['\"]([^'\"]+)['\"]\)", block_content)):
                    block_deps.append({"target_name": tbl, "type": "READS_TABLE", "metadata": {}})
                for rpc in set(re.findall(r"\.rpc\(['\"]([^'\"]+)['\"]", block_content)):
                    block_deps.append({"target_name": rpc, "type": "USES_RPC", "metadata": {}})
                for sc in set(re.findall(r"store\.([A-Za-z0-9_]+)\(", block_content)):
                    block_deps.append({"target_name": sc, "type": "CALLS", "metadata": {"target_type": "STORE"}})

                parsed.symbols.append(
                    ParsedSymbol(
                        name=name,
                        qualified_name=f"{rel_path}:{name}",
                        symbol_type=sym_type,
                        start_line=i + 1,
                        end_line=end_line,
                        signature=f"{name}({params.strip()})",
                        language=language,
                        domain=domain,
                        summary=f"{sym_type} {name} em {rel_path}",
                        content=block_content,
                        dependencies=block_deps,
                    )
                )
                continue

            # Testes
            m = test_pattern.match(line_str)
            if m:
                test_title = m.group(1)
                end_line = find_block_end(i)
                block_content = "\n".join(lines[i:end_line])
                parsed.symbols.append(
                    ParsedSymbol(
                        name=test_title[:60],
                        qualified_name=f"{rel_path}:test_{i+1}",
                        symbol_type="TEST",
                        start_line=i + 1,
                        end_line=end_line,
                        signature=f"test('{test_title}')",
                        language=language,
                        domain=domain,
                        summary=f"Caso de teste: {test_title}",
                        content=block_content,
                    )
                )

        return parsed

