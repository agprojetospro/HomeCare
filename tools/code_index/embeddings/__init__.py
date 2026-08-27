from .base import EmbeddingProvider, pack_vector, unpack_vector, cosine_similarity
from .ollama import OllamaEmbeddingProvider
from .local_fallback import LocalDeterministicEmbeddingProvider


def get_embedding_provider(
    provider_type: str = "ollama",
    model: str = "nomic-embed-text",
    endpoint: str = "http://localhost:11434/api/embeddings",
    dimension: int = 768,
    fallback_to_local: bool = True,
) -> EmbeddingProvider:
    if provider_type.lower() == "ollama":
        ollama_prov = OllamaEmbeddingProvider(model=model, endpoint=endpoint, dimension=dimension)
        if ollama_prov.is_available():
            return ollama_prov
        elif fallback_to_local:
            return LocalDeterministicEmbeddingProvider(dimension=dimension)
        else:
            return ollama_prov

    return LocalDeterministicEmbeddingProvider(dimension=dimension)


__all__ = [
    "EmbeddingProvider",
    "OllamaEmbeddingProvider",
    "LocalDeterministicEmbeddingProvider",
    "get_embedding_provider",
    "pack_vector",
    "unpack_vector",
    "cosine_similarity",
]

