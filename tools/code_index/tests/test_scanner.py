import tempfile
from pathlib import Path
import unittest

from tools.code_index.config import ScannerConfig
from tools.code_index.scanner.scanner import FileScanner


class TestFileScanner(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)

        # Criar arquivos de teste
        (self.root / "src").mkdir()
        (self.root / "src" / "app.ts").write_text("export const app = 1;", encoding="utf-8")
        (self.root / "src" / "component.tsx").write_text("export function Component() {}", encoding="utf-8")
        (self.root / "node_modules").mkdir()
        (self.root / "node_modules" / "pkg.js").write_text("console.log('ignored');", encoding="utf-8")
        (self.root / ".env").write_text("SECRET=12345", encoding="utf-8")

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_scan_includes_and_excludes(self):
        cfg = ScannerConfig(include=["src"], exclude=["node_modules", ".env"])
        scanner = FileScanner(self.root, cfg)
        scanned, skipped = scanner.scan()

        paths = [s.rel_path for s in scanned]
        self.assertIn("src/app.ts", paths)
        self.assertIn("src/component.tsx", paths)
        self.assertNotIn("node_modules/pkg.js", paths)
        self.assertNotIn(".env", paths)

    def test_hash_calculation(self):
        scanner = FileScanner(self.root)
        hash1 = scanner.compute_hash(b"hello world")
        hash2 = scanner.compute_hash(b"hello world")
        hash3 = scanner.compute_hash(b"different content")

        self.assertEqual(hash1, hash2)
        self.assertNotEqual(hash1, hash3)


if __name__ == "__main__":
    unittest.main()
