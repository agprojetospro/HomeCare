import hashlib
import fnmatch
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple, Set

from tools.code_index.config import ScannerConfig
from tools.code_index.scanner.secret_detector import SecretDetector


@dataclass
class ScannedFile:
    rel_path: str
    abs_path: Path
    language: str
    size: int
    mtime: float
    content_hash: str


class FileScanner:
    """Escaneia o repositório, filtra arquivos ignorados e calcula hashes SHA256."""

    LANGUAGE_MAP = {
        ".ts": "typescript",
        ".tsx": "tsx",
        ".js": "javascript",
        ".jsx": "jsx",
        ".sql": "sql",
        ".md": "markdown",
        ".json": "json",
        ".yaml": "yaml",
        ".yml": "yaml",
        ".prisma": "prisma",
        ".py": "python",
    }

    def __init__(self, root_dir: Path, config: Optional[ScannerConfig] = None):
        self.root_dir = root_dir.resolve()
        self.config = config or ScannerConfig()

    def is_ignored(self, rel_path: str) -> bool:
        # Normalizar caminho para comparação com barras normais
        norm_path = rel_path.replace("\\", "/")
        parts = norm_path.split("/")

        for excl in self.config.exclude:
            excl_norm = excl.replace("\\", "/")
            if fnmatch.fnmatch(norm_path, excl_norm) or fnmatch.fnmatch(norm_path, f"*/{excl_norm}"):
                return True
            for part in parts:
                if fnmatch.fnmatch(part, excl_norm):
                    return True

        return False

    def is_included(self, rel_path: str) -> bool:
        norm_path = rel_path.replace("\\", "/")
        parts = norm_path.split("/")
        top_item = parts[0]

        for inc in self.config.include:
            inc_norm = inc.replace("\\", "/")
            if norm_path == inc_norm or norm_path.startswith(inc_norm + "/") or top_item == inc_norm:
                return True

        return False

    def detect_language(self, path: Path) -> str:
        ext = path.suffix.lower()
        return self.LANGUAGE_MAP.get(ext, "text")

    def compute_hash(self, content: bytes) -> str:
        return hashlib.sha256(content).hexdigest()

    def scan(self) -> Tuple[List[ScannedFile], List[str]]:
        scanned_files: List[ScannedFile] = []
        skipped_reasons: List[str] = []

        for path in self.root_dir.rglob("*"):
            if not path.is_file():
                continue

            rel_path = str(path.relative_to(self.root_dir))

            # 1. Checar se está ignorado
            if self.is_ignored(rel_path):
                continue

            # 2. Checar se pertence aos diretórios/arquivos incluídos
            if not self.is_included(rel_path):
                continue

            # 3. Checar extensão permitida
            ext = path.suffix.lower()
            if ext and ext not in self.config.extensions:
                continue

            # 4. Detector de arquivos secretos por nome
            is_secret, reason = SecretDetector.is_secret_file(path)
            if is_secret:
                skipped_reasons.append(f"Ignorado segredo: {rel_path} ({reason})")
                continue

            # 5. Ler conteúdo e calcular hash
            try:
                content_bytes = path.read_bytes()
                try:
                    text_content = content_bytes.decode("utf-8")
                    # Checar segredos no conteúdo
                    has_secret_content, c_reason = SecretDetector.contains_secrets(text_content)
                    if has_secret_content:
                        skipped_reasons.append(f"Ignorado conteúdo sensível: {rel_path} ({c_reason})")
                        continue
                except UnicodeDecodeError:
                    # Arquivo binário não indexável
                    continue

                stat = path.stat()
                file_hash = self.compute_hash(content_bytes)
                lang = self.detect_language(path)

                scanned_files.append(
                    ScannedFile(
                        rel_path=rel_path.replace("\\", "/"),
                        abs_path=path,
                        language=lang,
                        size=stat.st_size,
                        mtime=stat.st_mtime,
                        content_hash=file_hash,
                    )
                )
            except Exception as e:
                skipped_reasons.append(f"Erro ao ler {rel_path}: {e}")

        return scanned_files, skipped_reasons
