import unittest
from tools.code_index.parsers.base import ParsedFile, ParsedSymbol
from tools.code_index.chunker.chunker import CodeChunker


class TestCodeChunker(unittest.TestCase):
    def test_chunking_small_symbol(self):
        parsed = ParsedFile(
            rel_path="src/domain/patient.ts",
            language="typescript",
            symbols=[
                ParsedSymbol(
                    name="checkPatientDuplicate",
                    qualified_name="src/domain/patient.ts:checkPatientDuplicate",
                    symbol_type="FUNCTION",
                    start_line=10,
                    end_line=25,
                    signature="checkPatientDuplicate(existing, candidate)",
                    domain="PATIENT",
                    summary="Verifica duplicidade de paciente",
                    content="function checkPatientDuplicate() { return false; }",
                )
            ],
            raw_content="...",
        )
        chunks = CodeChunker.chunk_file(parsed)
        self.assertEqual(len(chunks), 1)
        self.assertIn("Symbol: checkPatientDuplicate", chunks[0].search_text)
        self.assertIn("Domain: PATIENT", chunks[0].search_text)
        self.assertEqual(chunks[0].start_line, 10)
        self.assertEqual(chunks[0].end_line, 25)

    def test_chunking_large_symbol_subchunking(self):
        # Símbolo com 150 linhas
        large_code = "\n".join([f"line_{i} = {i};" for i in range(150)])
        parsed = ParsedFile(
            rel_path="src/domain/large.ts",
            language="typescript",
            symbols=[
                ParsedSymbol(
                    name="largeFunction",
                    qualified_name="src/domain/large.ts:largeFunction",
                    symbol_type="FUNCTION",
                    start_line=1,
                    end_line=150,
                    content=large_code,
                )
            ],
        )
        chunks = CodeChunker.chunk_file(parsed)
        self.assertGreater(len(chunks), 1)
        self.assertIn("Part 1", chunks[0].search_text)
        self.assertIn("Part 2", chunks[1].search_text)


if __name__ == "__main__":
    unittest.main()

