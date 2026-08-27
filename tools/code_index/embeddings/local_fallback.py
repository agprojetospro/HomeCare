import hashlib
import math
import re
from typing import List
from tools.code_index.embeddings.base import EmbeddingProvider


class LocalDeterministicEmbeddingProvider(EmbeddingProvider):
    """Provedor vetorial local determinístico de alta resolução para execução offline/testes."""

    def __init__(self, dimension: int = 768):
        self._dimension = dimension

    @property
    def model_name(self) -> str:
        return "local:deterministic-hashed-768"

    @property
    def dimension(self) -> int:
        return self._dimension

    def _tokenize(self, text: str) -> List[str]:
        # Extrair palavras, símbolos e camelCase
        words = re.findall(r"[A-Za-z0-9_]+", text.lower())
        tokens = []
        for w in words:
            tokens.append(w)
            # n-grams de caracteres de 3 a 5 para subpalavras
            if len(w) >= 4:
                for i in range(len(w) - 3):
                    tokens.append(w[i : i + 4])
        return tokens

    def embed_text(self, text: str) -> List[float]:
        vec = [0.0] * self._dimension
        tokens = self._tokenize(text)
        if not tokens:
            return vec

        for tok in tokens:
            # Hash estável SHA256 do token
            h = int(hashlib.sha256(tok.encode("utf-8")).hexdigest(), 16)
            idx = h % self._dimension
            sign = 1.0 if (h >> 16) % 2 == 0 else -1.0
            weight = 1.0 + math.log(1.0 + tokens.count(tok))
            vec[idx] += sign * weight

        # Normalização L2
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]

        return vec

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return [self.embed_text(t) for t in texts]

