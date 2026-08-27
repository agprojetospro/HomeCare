from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Set
import sqlite3

from tools.code_index.database.db import Database


@dataclass
class ImpactReport:
    target: str
    target_type: str
    direct_dependencies: List[Dict[str, Any]] = field(default_factory=list)
    direct_dependents: List[Dict[str, Any]] = field(default_factory=list)
    indirect_dependents: List[Dict[str, Any]] = field(default_factory=list)
    affected_tests: List[Dict[str, Any]] = field(default_factory=list)
    affected_policies: List[Dict[str, Any]] = field(default_factory=list)
    affected_components: List[Dict[str, Any]] = field(default_factory=list)
    affected_rpcs: List[Dict[str, Any]] = field(default_factory=list)


class DependencyGraph:
    """Gerenciador do Grafo de Dependências e Análise de Impacto."""

    def __init__(self, db: Database):
        self.db = db

    def get_symbol(self, name_or_qualified: str) -> Optional[Dict[str, Any]]:
        cur = self.db.conn.cursor()
        cur.execute(
            """
            SELECT s.*, f.path as file_path
            FROM symbols s
            JOIN files f ON f.id = s.file_id
            WHERE s.name = ? OR s.qualified_name = ?
            LIMIT 1;
            """,
            (name_or_qualified, name_or_qualified),
        )
        row = cur.fetchone()
        return dict(row) if row else None

    def get_dependencies(self, symbol_name: str) -> List[Dict[str, Any]]:
        """Retorna os símbolos e entidades dos quais este símbolo depende (Outgoing edges)."""
        cur = self.db.conn.cursor()
        cur.execute(
            """
            SELECT d.target_name, d.dependency_type, d.metadata_json,
                   ts.symbol_type as target_type, tf.path as target_file
            FROM symbols s
            JOIN dependencies d ON d.source_symbol_id = s.id
            LEFT JOIN symbols ts ON ts.id = d.target_symbol_id OR ts.name = d.target_name
            LEFT JOIN files tf ON tf.id = ts.file_id
            WHERE s.name = ?;
            """,
            (symbol_name,),
        )
        return [dict(row) for row in cur.fetchall()]

    def get_references(self, target_name: str) -> List[Dict[str, Any]]:
        """Retorna quem chama ou referencia este símbolo/tabela/RPC (Incoming edges)."""
        cur = self.db.conn.cursor()
        cur.execute(
            """
            SELECT s.name as caller_name, s.symbol_type, s.start_line, s.end_line,
                   f.path as file_path, d.dependency_type
            FROM dependencies d
            JOIN symbols s ON s.id = d.source_symbol_id
            JOIN files f ON f.id = s.file_id
            WHERE d.target_name = ? OR d.target_symbol_id = (SELECT id FROM symbols WHERE name = ? LIMIT 1);
            """,
            (target_name, target_name),
        )
        return [dict(row) for row in cur.fetchall()]

    def analyze_impact(self, target: str) -> ImpactReport:
        sym = self.get_symbol(target)
        target_type = sym["symbol_type"] if sym else "UNKNOWN"

        report = ImpactReport(target=target, target_type=target_type)

        # 1. Dependências diretas (o que ele chama)
        report.direct_dependencies = self.get_dependencies(target)

        # 2. Dependentes diretos (quem o chama)
        direct_refs = self.get_references(target)
        report.direct_dependents = direct_refs

        # 3. Dependentes indiretos (recursivo até 2 níveis)
        visited = {target}
        for d in direct_refs:
            visited.add(d["caller_name"])

        indirect_list = []
        for d in direct_refs:
            sub_refs = self.get_references(d["caller_name"])
            for sr in sub_refs:
                if sr["caller_name"] not in visited:
                    visited.add(sr["caller_name"])
                    indirect_list.append(sr)

        report.indirect_dependents = indirect_list

        # 4. Categorizar afetados
        all_dependents = report.direct_dependents + report.indirect_dependents
        for dep in all_dependents:
            stype = dep.get("symbol_type", "")
            if stype == "TEST":
                report.affected_tests.append(dep)
            elif stype == "POLICY":
                report.affected_policies.append(dep)
            elif stype in ("COMPONENT", "HOOK"):
                report.affected_components.append(dep)
            elif stype in ("RPC", "FUNCTION_SQL"):
                report.affected_rpcs.append(dep)

        return report
