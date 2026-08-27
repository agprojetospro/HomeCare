import re
from typing import List, Dict, Any, Optional
from tools.code_index.parsers.base import BaseParser, ParsedFile, ParsedSymbol


class SqlParser(BaseParser):
    """Parser para arquivos SQL, Migrações Supabase, PostgreSQL, RLS Policies e Triggers."""

    def can_parse(self, language: str, path: str) -> bool:
        return language == "sql" or path.endswith(".sql")

    def _infer_domain(self, name: str, rel_path: str) -> str:
        name_lower = name.lower()
        if "patient" in name_lower or "paciente" in name_lower:
            return "PATIENT"
        if "professional" in name_lower or "credential" in name_lower:
            return "PROFESSIONAL"
        if "triage" in name_lower or "triagem" in name_lower:
            return "TRIAGE"
        if "shift" in name_lower or "escala" in name_lower:
            return "SHIFT"
        if "evolution" in name_lower or "vital" in name_lower or "prescription" in name_lower or "procedure" in name_lower or "exam" in name_lower or "clinical" in name_lower:
            return "PEP"
        if "security" in name_lower or "rbac" in name_lower or "auth" in name_lower or "permission" in name_lower:
            return "SECURITY"
        if "audit" in name_lower:
            return "AUDIT"
        if "organization" in name_lower or "unit" in name_lower or "region" in name_lower or "area" in name_lower:
            return "ORGANIZATION"
        return "DATABASE"

    def parse(self, content: str, rel_path: str, language: str) -> ParsedFile:
        parsed = ParsedFile(rel_path=rel_path, language="sql", raw_content=content)
        lines = content.splitlines()

        # Regexes para statements SQL
        # 1. CREATE TABLE
        create_table_regex = re.compile(
            r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_\.\"]+)\s*\(",
            re.IGNORECASE,
        )

        # 2. CREATE VIEW
        create_view_regex = re.compile(
            r"CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+([a-zA-Z0-9_\.\"]+)\s+AS",
            re.IGNORECASE,
        )

        # 3. CREATE FUNCTION / RPC
        create_func_regex = re.compile(
            r"CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([a-zA-Z0-9_\.\"]+)\s*\((.*?)\)\s*RETURNS\s+([a-zA-Z0-9_\[\]]+)",
            re.IGNORECASE | re.DOTALL,
        )

        # 4. CREATE TRIGGER
        create_trigger_regex = re.compile(
            r"CREATE\s+TRIGGER\s+([a-zA-Z0-9_\.\"]+)\s+(BEFORE|AFTER|INSTEAD\s+OF)\s+(INSERT|UPDATE|DELETE|TRUNCATE(?:\s+OR\s+(?:INSERT|UPDATE|DELETE))*)\s+ON\s+([a-zA-Z0-9_\.\"]+)\s+.*?EXECUTE\s+(?:PROCEDURE|FUNCTION)\s+([a-zA-Z0-9_\.\"]+)\s*\(",
            re.IGNORECASE | re.DOTALL,
        )

        # 5. CREATE POLICY
        create_policy_regex = re.compile(
            r"CREATE\s+POLICY\s+[\"']?([^\"'\n]+)[\"']?\s+ON\s+([a-zA-Z0-9_\.\"]+)(?:\s+FOR\s+([A-Z]+))?(?:\s+TO\s+([a-zA-Z0-9_,\s]+))?\s+USING\s*\((.*?)\)(?:\s+WITH\s+CHECK\s*\((.*?)\))?;",
            re.IGNORECASE | re.DOTALL,
        )

        # Helper para encontrar o número da linha a partir do offset
        def get_line_number(offset: int) -> int:
            return content.count("\n", 0, offset) + 1

        # 1. Extrair Tabelas
        for m in create_table_regex.finditer(content):
            table_name = m.group(1).replace('"', '').strip()
            start_line = get_line_number(m.start())
            # Achar fim da tabela
            end_idx = content.find(");", m.end())
            end_line = get_line_number(end_idx) if end_idx != -1 else start_line + 10
            block = content[m.start():end_idx + 2] if end_idx != -1 else content[m.start():m.start()+200]

            domain = self._infer_domain(table_name, rel_path)
            parsed.symbols.append(
                ParsedSymbol(
                    name=table_name,
                    qualified_name=f"{rel_path}:{table_name}",
                    symbol_type="TABLE",
                    start_line=start_line,
                    end_line=end_line,
                    signature=f"CREATE TABLE {table_name}",
                    language="sql",
                    domain=domain,
                    summary=f"Tabela de banco de dados {table_name}",
                    content=block,
                )
            )

        # 2. Extrair Funções SQL / RPCs
        for m in create_func_regex.finditer(content):
            func_name = m.group(1).replace('"', '').strip()
            args = m.group(2).strip().replace("\n", " ")
            returns = m.group(3).strip()
            start_line = get_line_number(m.start())
            end_idx = content.find("$$ LANGUAGE", m.end())
            if end_idx != -1:
                end_idx = content.find(";", end_idx)
            end_line = get_line_number(end_idx) if end_idx != -1 else start_line + 20
            block = content[m.start():end_idx + 1] if end_idx != -1 else content[m.start():m.start()+300]

            is_security_definer = "SECURITY DEFINER" in block.upper()
            domain = self._infer_domain(func_name, rel_path)

            # Dependências da função
            deps = []
            for t_match in re.findall(r"(?:FROM|JOIN|INTO|UPDATE)\s+([a-zA-Z0-9_]+)", block, re.IGNORECASE):
                t_lower = t_match.lower()
                if t_lower not in ("select", "where", "set", "values", "as"):
                    deps.append({"target_name": t_match, "type": "READS_TABLE", "metadata": {}})

            for f_match in re.findall(r"([a-zA-Z0-9_]+)\s*\(", block):
                if f_match != func_name and f_match.lower() not in ("select", "coalesce", "exists", "count", "now", "nullif"):
                    deps.append({"target_name": f_match, "type": "CALLS", "metadata": {}})

            parsed.symbols.append(
                ParsedSymbol(
                    name=func_name,
                    qualified_name=f"{rel_path}:{func_name}",
                    symbol_type="FUNCTION_SQL" if not is_security_definer else "RPC",
                    start_line=start_line,
                    end_line=end_line,
                    signature=f"{func_name}({args}) RETURNS {returns}",
                    language="sql",
                    domain=domain,
                    summary=f"Função SQL {'(SECURITY DEFINER)' if is_security_definer else ''} {func_name}",
                    content=block,
                    metadata={"security_definer": is_security_definer, "returns": returns},
                    dependencies=deps,
                )
            )

        # 3. Extrair Triggers
        for m in create_trigger_regex.finditer(content):
            trigger_name = m.group(1).replace('"', '').strip()
            timing = m.group(2).strip()
            event = m.group(3).strip()
            target_table = m.group(4).replace('"', '').strip()
            target_func = m.group(5).replace('"', '').strip()

            start_line = get_line_number(m.start())
            end_idx = content.find(";", m.end())
            end_line = get_line_number(end_idx) if end_idx != -1 else start_line + 3
            block = content[m.start():end_idx + 1] if end_idx != -1 else content[m.start():m.end()]

            domain = self._infer_domain(target_table, rel_path)
            deps = [
                {"target_name": target_table, "type": "REFERENCES", "metadata": {"role": "TABLE"}},
                {"target_name": target_func, "type": "CALLS", "metadata": {"role": "TRIGGER_FUNCTION"}},
            ]

            parsed.symbols.append(
                ParsedSymbol(
                    name=trigger_name,
                    qualified_name=f"{rel_path}:{trigger_name}",
                    symbol_type="TRIGGER",
                    start_line=start_line,
                    end_line=end_line,
                    signature=f"CREATE TRIGGER {trigger_name} {timing} {event} ON {target_table}",
                    language="sql",
                    domain=domain,
                    summary=f"Trigger {timing} {event} na tabela {target_table} acionando {target_func}()",
                    content=block,
                    metadata={"table": target_table, "function": target_func, "event": event, "timing": timing},
                    dependencies=deps,
                )
            )

        # 4. Extrair Policies RLS
        for m in create_policy_regex.finditer(content):
            policy_name = m.group(1).strip()
            target_table = m.group(2).replace('"', '').strip()
            operation = m.group(3).strip() if m.group(3) else "ALL"
            using_clause = m.group(5).strip() if m.group(5) else ""

            start_line = get_line_number(m.start())
            end_line = get_line_number(m.end())
            block = m.group(0)
            domain = self._infer_domain(target_table, rel_path)

            deps = [{"target_name": target_table, "type": "REFERENCES", "metadata": {"role": "PROTECTED_TABLE"}}]
            # Achar chamadas de funções na policy (ex: can_access_patient, current_organization_id)
            for fn in re.findall(r"([a-zA-Z0-9_]+)\s*\(", using_clause):
                if fn.lower() not in ("select", "auth", "exists", "and", "or", "in"):
                    deps.append({"target_name": fn, "type": "CALLS", "metadata": {"role": "RLS_HELPER"}})

            parsed.symbols.append(
                ParsedSymbol(
                    name=policy_name,
                    qualified_name=f"{rel_path}:{policy_name}",
                    symbol_type="POLICY",
                    start_line=start_line,
                    end_line=end_line,
                    signature=f"POLICY \"{policy_name}\" ON {target_table} FOR {operation}",
                    language="sql",
                    domain=domain,
                    summary=f"Política de RLS para {operation} na tabela {target_table}",
                    content=block,
                    metadata={"table": target_table, "operation": operation, "using": using_clause},
                    dependencies=deps,
                )
            )

        return parsed
