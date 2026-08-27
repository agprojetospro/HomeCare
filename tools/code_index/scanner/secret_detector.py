import re
from pathlib import Path
from typing import Tuple

class SecretDetector:
    """Detecta arquivos que contêm credenciais, chaves privadas ou tokens sensíveis."""

    SECRET_FILENAME_PATTERNS = [
        re.compile(r"^\.env(\..+)?$", re.IGNORECASE),
        re.compile(r"^.*\.(pem|key|pkcs12|pfx|p12|kdbx)$", re.IGNORECASE),
        re.compile(r"^.*(id_rsa|id_ed25519|id_dsa).*$", re.IGNORECASE),
        re.compile(r"^.*(secret|credential|service-account).*\.(json|yaml|yml)$", re.IGNORECASE),
    ]

    SECRET_CONTENT_PATTERNS = [
        re.compile(r"-----BEGIN\s+(RSA|EC|DSA|OPENSSH|PGP|ENCRYPTED)?\s*PRIVATE\s+KEY-----", re.IGNORECASE),
        re.compile(r"(api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token|password|passwd)\s*[:=]\s*['\"][A-Za-z0-9_\-\.]{20,}['\"]", re.IGNORECASE),
        re.compile(r"ey[A-Za-z0-9_-]{15,}\.ey[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}", re.IGNORECASE), # JWT
        re.compile(r"ghp_[A-Za-z0-9]{36,}", re.IGNORECASE), # GitHub Token
        re.compile(r"supabase[_-]service[_-]role[_-]key\s*[:=]\s*['\"][^'\"]+['\"]", re.IGNORECASE),
    ]

    @classmethod
    def is_secret_file(cls, file_path: Path) -> Tuple[bool, str]:
        filename = file_path.name
        for pat in cls.SECRET_FILENAME_PATTERNS:
            if pat.match(filename):
                return True, f"Filename matches sensitive pattern '{pat.pattern}'"
        return False, ""

    @classmethod
    def contains_secrets(cls, content: str) -> Tuple[bool, str]:
        for pat in cls.SECRET_CONTENT_PATTERNS:
            if pat.search(content):
                return True, f"Content matches sensitive pattern '{pat.pattern}'"
        return False, ""

