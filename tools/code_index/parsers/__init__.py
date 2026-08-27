from typing import List
from .base import BaseParser, ParsedFile, ParsedSymbol
from .ts_parser import TypeScriptParser
from .sql_parser import SqlParser
from .md_parser import MarkdownParser


def get_default_parsers() -> List[BaseParser]:
    return [
        TypeScriptParser(),
        SqlParser(),
        MarkdownParser(),
    ]


def parse_file(content: str, rel_path: str, language: str, parsers: List[BaseParser] = None) -> ParsedFile:
    parsers = parsers or get_default_parsers()
    for parser in parsers:
        if parser.can_parse(language, rel_path):
            return parser.parse(content, rel_path, language)
    
    # Fallback genérico para arquivos sem parser específico (ex: json, yaml)
    return ParsedFile(
        rel_path=rel_path,
        language=language,
        symbols=[
            ParsedSymbol(
                name=rel_path.split("/")[-1],
                qualified_name=rel_path,
                symbol_type="FILE",
                start_line=1,
                end_line=len(content.splitlines()),
                signature=f"File: {rel_path}",
                summary=f"Arquivo {rel_path}",
                content=content,
            )
        ],
        raw_content=content,
    )

