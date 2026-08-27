import tempfile
from pathlib import Path
import unittest

from tools.code_index.database.db import Database
from tools.code_index.chunker.chunker import CodeChunk
from tools.code_index.embeddings.local_fallback import LocalDeterministicEmbeddingProvider
from tools.code_index.retrieval.hybrid_search import HybridSearchEngine


class TestFtsAndVectorSearch(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp_dir.name) / "test.db"
        self.db = Database(self.db_path)
        self.db.init_schema("TestRepo", self.temp_dir.name)
        self.provider = LocalDeterministicEmbeddingProvider(dimension=768)
        self.engine = HybridSearchEngine(self.db, self.provider)

        # Inserir chunks de exemplo
        self.file_id = self.db.upsert_file("src/domain/security/rbac.ts", "typescript", 500, "hash123", 1000.0)

        c1 = CodeChunk(
            id="chunk_1",
            file_path="src/domain/security/rbac.ts",
            symbol_name="authorizePatientAccess",
            symbol_type="FUNCTION",
            start_line=10,
            end_line=45,
            content="export function authorizePatientAccess(params) { return { authorized: true }; }",
            search_text="Symbol: authorizePatientAccess\nType: FUNCTION\nDomain: SECURITY\nValidação de vínculo explícito entre profissional e paciente anti-IDOR",
            content_hash="h1",
            domain="SECURITY",
            language="typescript",
        )
        c2 = CodeChunk(
            id="chunk_2",
            file_path="src/domain/shift/shift.schema.ts",
            symbol_name="hasShiftOverlap",
            symbol_type="FUNCTION",
            start_line=50,
            end_line=80,
            content="export function hasShiftOverlap(shifts, candidate) { return false; }",
            search_text="Symbol: hasShiftOverlap\nType: FUNCTION\nDomain: SHIFT\nVerifica conflito e sobreposição de horários de plantões com médico responsável",
            content_hash="h2",
            domain="SHIFT",
            language="typescript",
        )

        vectors = self.provider.embed_batch([c1.search_text, c2.search_text])
        self.db.insert_chunks(self.file_id, [c1, c2], vectors, self.provider.model_name)

    def tearDown(self):
        try:
            self.db.close()
        except Exception:
            pass
        try:
            self.temp_dir.cleanup()
        except Exception:
            pass

    def test_fts_search_exact_match(self):
        fts_res = self.engine.fts_search("authorizePatientAccess")
        self.assertIn("chunk_1", fts_res)

    def test_vector_search_semantic(self):
        vec_res = self.engine.vector_search("verificar se o médico tem vínculo com o paciente")
        self.assertIn("chunk_1", vec_res)

    def test_hybrid_search(self):
        results = self.engine.search("onde está a regra de conflito de plantão", top_k=5)
        self.assertTrue(len(results) > 0)
        self.assertEqual(results[0].symbol_name, "hasShiftOverlap")


if __name__ == "__main__":
    unittest.main()
