import tempfile
from pathlib import Path
import unittest

from tools.code_index.config import ScannerConfig
from tools.code_index.database.db import Database
from tools.code_index.scanner.scanner import FileScanner
from tools.code_index.parsers import parse_file
from tools.code_index.chunker.chunker import CodeChunker
from tools.code_index.embeddings.local_fallback import LocalDeterministicEmbeddingProvider


class TestIncrementalIndexing(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        self.db_path = self.root / ".index.db"
        self.db = Database(self.db_path)
        self.db.init_schema("FixtureRepo", str(self.root))
        self.provider = LocalDeterministicEmbeddingProvider(dimension=768)

        # Criar fixture de arquivos
        (self.root / "src").mkdir()
        (self.root / "src" / "file1.ts").write_text("export function funcA() { return 1; }", encoding="utf-8")
        (self.root / "src" / "file2.ts").write_text("export function funcB() { return 2; }", encoding="utf-8")

    def tearDown(self):
        try:
            self.db.close()
        except Exception:
            pass
        try:
            self.temp_dir.cleanup()
        except Exception:
            pass

    def run_indexer(self) -> dict:
        scanner = FileScanner(self.root, ScannerConfig(include=["src"]))
        scanned, _ = scanner.scan()

        active_db_files = {f["path"]: f for f in self.db.get_all_active_files()}
        current_paths = {sf.rel_path for sf in scanned}

        stats = {"added": 0, "changed": 0, "unchanged": 0, "deleted": 0}

        # 1. Removidos
        for old_path, old_row in active_db_files.items():
            if old_path not in current_paths:
                self.db.delete_file_records(old_row["id"])
                stats["deleted"] += 1

        # 2. Novos / Modificados
        for sf in scanned:
            existing = active_db_files.get(sf.rel_path)
            is_new = existing is None
            is_changed = existing and existing["content_hash"] != sf.content_hash

            if not is_new and not is_changed:
                stats["unchanged"] += 1
                continue

            content = sf.abs_path.read_text(encoding="utf-8")
            parsed = parse_file(content, sf.rel_path, sf.language)
            chunks = CodeChunker.chunk_file(parsed)

            file_id = self.db.upsert_file(sf.rel_path, sf.language, sf.size, sf.content_hash, sf.mtime)
            self.db.insert_symbols(file_id, parsed.symbols)
            vectors = self.provider.embed_batch([c.search_text for c in chunks])
            self.db.insert_chunks(file_id, chunks, vectors, self.provider.model_name)

            if is_new:
                stats["added"] += 1
            else:
                stats["changed"] += 1

        return stats

    def test_full_lifecycle(self):
        # 1. Primeira indexação (2 novos)
        s1 = self.run_indexer()
        self.assertEqual(s1["added"], 2)
        self.assertEqual(s1["unchanged"], 0)

        # 2. Segunda execução sem alterações (2 inalterados)
        s2 = self.run_indexer()
        self.assertEqual(s2["added"], 0)
        self.assertEqual(s2["unchanged"], 2)

        # 3. Alterar 1 arquivo (1 alterado, 1 inalterado)
        (self.root / "src" / "file1.ts").write_text("export function funcA_Updated() { return 99; }", encoding="utf-8")
        s3 = self.run_indexer()
        self.assertEqual(s3["changed"], 1)
        self.assertEqual(s3["unchanged"], 1)

        # 4. Deletar 1 arquivo (1 deletado, 1 inalterado)
        (self.root / "src" / "file2.ts").unlink()
        s4 = self.run_indexer()
        self.assertEqual(s4["deleted"], 1)
        self.assertEqual(s4["unchanged"], 1)


if __name__ == "__main__":
    unittest.main()
