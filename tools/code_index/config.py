from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Dict, Any, Optional
import os

try:
    import yaml
except ImportError:
    yaml = None


@dataclass
class EmbeddingConfig:
    provider: str = "ollama"
    model: str = "nomic-embed-text"
    endpoint: str = "http://localhost:11434/api/embeddings"
    dimension: int = 768
    batch_size: int = 32
    fallback_to_local: bool = True


@dataclass
class SearchConfig:
    vector_weight: float = 0.55
    fts_weight: float = 0.35
    metadata_weight: float = 0.10
    top_k: int = 10


@dataclass
class ScannerConfig:
    include: List[str] = field(default_factory=lambda: ["src", "supabase", "tests", "docs", "AGENTS.md", "README.md", "package.json"])
    exclude: List[str] = field(default_factory=lambda: [
        "node_modules", "dist", "build", "coverage", ".git", ".cache", ".next",
        ".homecare-index", ".vercel", "*.db", "*.db-journal", "*.pem", "*.key",
        "*.env", "*.env.*"
    ])
    extensions: List[str] = field(default_factory=lambda: [
        ".ts", ".tsx", ".js", ".jsx", ".sql", ".md", ".json", ".yaml", ".yml", ".prisma"
    ])


@dataclass
class AppConfig:
    project_name: str = "HomeCare"
    project_root: Path = field(default_factory=lambda: Path.cwd())
    index_db_path: Path = field(default_factory=lambda: Path.cwd() / ".homecare-index" / "index.db")
    log_path: Path = field(default_factory=lambda: Path.cwd() / ".homecare-index" / "logs" / "index.log")
    embedding: EmbeddingConfig = field(default_factory=EmbeddingConfig)
    search: SearchConfig = field(default_factory=SearchConfig)
    scanner: ScannerConfig = field(default_factory=ScannerConfig)


def load_config(config_path: Optional[Path] = None, project_root: Optional[Path] = None) -> AppConfig:
    root = project_root or Path.cwd()
    cfg_file = config_path or (root / "code-index.yaml")
    
    config = AppConfig(project_root=root)
    config.index_db_path = root / ".homecare-index" / "index.db"
    config.log_path = root / ".homecare-index" / "logs" / "index.log"
    
    if cfg_file.exists() and yaml:
        try:
            with open(cfg_file, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f) or {}
                
            proj = data.get("project", {})
            config.project_name = proj.get("name", config.project_name)
            
            idx = data.get("index", {})
            if "path" in idx:
                config.index_db_path = root / idx["path"]
            if "log_path" in idx:
                config.log_path = root / idx["log_path"]
                
            emb = data.get("embedding", {})
            config.embedding = EmbeddingConfig(
                provider=emb.get("provider", "ollama"),
                model=emb.get("model", "nomic-embed-text"),
                endpoint=emb.get("endpoint", "http://localhost:11434/api/embeddings"),
                dimension=int(emb.get("dimension", 768)),
                batch_size=int(emb.get("batch_size", 32)),
                fallback_to_local=bool(emb.get("fallback_to_local", True)),
            )
            
            srch = data.get("search", {})
            config.search = SearchConfig(
                vector_weight=float(srch.get("vector_weight", 0.55)),
                fts_weight=float(srch.get("fts_weight", 0.35)),
                metadata_weight=float(srch.get("metadata_weight", 0.10)),
                top_k=int(srch.get("top_k", 10)),
            )
            
            sc = data.get("scanner", {})
            config.scanner = ScannerConfig(
                include=sc.get("include", config.scanner.include),
                exclude=sc.get("exclude", config.scanner.exclude),
                extensions=sc.get("extensions", config.scanner.extensions),
            )
        except Exception:
            pass
            
    return config
