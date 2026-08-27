import struct
import math
from abc import ABC, abstractmethod
from typing import List


class EmbeddingProvider(ABC):
    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        pass

    @abstractmethod
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        pass

    @property
    @abstractmethod
    def dimension(self) -> int:
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        pass


def pack_vector(vector: List[float]) -> bytes:
    """Converte lista de floats em bytes float32 para armazenamento eficiente em SQLite BLOB."""
    return struct.pack(f"{len(vector)}f", *vector)


def unpack_vector(blob: bytes) -> List[float]:
    """Converte bytes float32 de volta para lista de floats."""
    count = len(blob) // 4
    return list(struct.unpack(f"{count}f", blob))


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Calcula a similaridade de cosseno entre dois vetores normalizados."""
    if len(v1) != len(v2) or not v1:
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 == 0.0 or norm2 == 0.0:
        return 0.0
    return dot / (norm1 * norm2)

