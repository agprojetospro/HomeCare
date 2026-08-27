from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional


@dataclass
class ParsedSymbol:
    name: str
    qualified_name: str
    symbol_type: str  # FUNCTION, COMPONENT, HOOK, TYPE, INTERFACE, ENUM, CLASS, TABLE, VIEW, FUNCTION_SQL, RPC, POLICY, TRIGGER, DOCUMENT_SECTION, TEST
    start_line: int
    end_line: int
    signature: Optional[str] = None
    language: str = "text"
    domain: Optional[str] = None
    summary: Optional[str] = None
    content: str = ""
    content_hash: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)
    dependencies: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class ParsedFile:
    rel_path: str
    language: str
    symbols: List[ParsedSymbol] = field(default_factory=list)
    imports: List[str] = field(default_factory=list)
    exports: List[str] = field(default_factory=list)
    raw_content: str = ""


class BaseParser(ABC):
    @abstractmethod
    def can_parse(self, language: str, path: str) -> bool:
        pass

    @abstractmethod
    def parse(self, content: str, rel_path: str, language: str) -> ParsedFile:
        pass
