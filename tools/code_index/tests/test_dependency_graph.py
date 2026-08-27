import tempfile
from pathlib import Path
import unittest

from tools.code_index.database.db import Database
from tools.code_index.parsers.base import ParsedSymbol
from tools.code_index.graph.dependency_graph import DependencyGraph


class TestDependencyGraph(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp_dir.name) / "test.db"
        self.db = Database(self.db_path)
        self.db.init_schema("TestRepo", self.temp_dir.name)
        self.graph = DependencyGraph(self.db)

        # Inserir arquivos e símbolos
        f1 = self.db.upsert_file("supabase/migrations/01.sql", "sql", 100, "h1", 1.0)
        s1 = ParsedSymbol(
            name="can_access_patient",
            qualified_name="supabase/migrations/01.sql:can_access_patient",
            symbol_type="RPC",
            start_line=1,
            end_line=30,
            content="CREATE FUNCTION can_access_patient ...",
            dependencies=[{"target_name": "patient_professional_assignments", "type": "READS_TABLE", "metadata": {}}],
        )
        s_map1 = self.db.insert_symbols(f1, [s1])
        self.db.insert_dependencies(s_map1["can_access_patient"], s1.dependencies)

        f2 = self.db.upsert_file("src/app/pep/page.tsx", "tsx", 100, "h2", 1.0)
        s2 = ParsedSymbol(
            name="PepPage",
            qualified_name="src/app/pep/page.tsx:PepPage",
            symbol_type="COMPONENT",
            start_line=1,
            end_line=50,
            content="export function PepPage() { ... }",
            dependencies=[{"target_name": "can_access_patient", "type": "USES_RPC", "metadata": {}}],
        )
        s_map2 = self.db.insert_symbols(f2, [s2])
        self.db.insert_dependencies(s_map2["PepPage"], s2.dependencies)

    def tearDown(self):
        try:
            self.db.close()
        except Exception:
            pass
        try:
            self.temp_dir.cleanup()
        except Exception:
            pass

    def test_get_dependencies(self):
        deps = self.graph.get_dependencies("can_access_patient")
        self.assertEqual(len(deps), 1)
        self.assertEqual(deps[0]["target_name"], "patient_professional_assignments")

    def test_get_references(self):
        refs = self.graph.get_references("can_access_patient")
        self.assertEqual(len(refs), 1)
        self.assertEqual(refs[0]["caller_name"], "PepPage")

    def test_analyze_impact(self):
        report = self.graph.analyze_impact("can_access_patient")
        self.assertEqual(len(report.direct_dependents), 1)
        self.assertEqual(report.direct_dependents[0]["caller_name"], "PepPage")
        self.assertEqual(len(report.affected_components), 1)


if __name__ == "__main__":
    unittest.main()
