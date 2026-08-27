import json
import urllib.request
import urllib.error
from typing import List, Optional
from tools.code_index.embeddings.base import EmbeddingProvider


class OllamaEmbeddingProvider(EmbeddingProvider):
    """Provedor de embeddings locais via Ollama API."""

    def __init__(
        self,
        model: str = "nomic-embed-text",
        endpoint: str = "http://localhost:11434/api/embeddings",
        dimension: int = 768,
        timeout_seconds: float = 10.0,
    ):
        self._model = model
        self._endpoint = endpoint
        self._dimension = dimension
        self._timeout = timeout_seconds

    @property
    def model_name(self) -> str:
        return f"ollama:{self._model}"

    @property
    def dimension(self) -> int:
        return self._dimension

    def is_available(self) -> bool:
        try:
            req = urllib.request.Request(
                self._endpoint.replace("/api/embeddings", "/api/tags"),
                method="GET",
            )
            with urllib.request.urlopen(req, timeout=2.0) as resp:
                return resp.status == 200
        except Exception:
            return False

    def embed_text(self, text: str) -> List[float]:
        payload = json.dumps({"model": self._model, "prompt": text}).encode("utf-8")
        req = urllib.request.Request(
            self._endpoint,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=self._timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                vec = data.get("embedding", [])
                if vec:
                    return vec
        except Exception as e:
            raise RuntimeError(f"Erro ao gerar embedding no Ollama ({self._endpoint}): {e}")

        raise RuntimeError("Ollama não retornou vetor de embedding válido.")

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        results = []
        for text in texts:
            results.append(self.embed_text(text))
        return results

