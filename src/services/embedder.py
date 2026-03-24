import logging

from openai import AsyncOpenAI

from src.config import settings
from src.services.sparse_tokenizer import tokenize, compute_tf

logger = logging.getLogger(__name__)

SIMPLE_VOCAB: dict[str, int] = {}


class EmbedderService:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.MISTRAL_API_KEY,
            base_url=settings.MISTRAL_BASE_URL,
        )

    async def embed(self, text: str) -> list[float]:
        logger.info(f"Generating embedding for text: {text[:50]}...")

        response = await self.client.embeddings.create(
            model=settings.MISTRAL_EMBEDDING_MODEL,
            input=text,
        )

        vector = response.data[0].embedding
        logger.info(f"Generated {len(vector)}-dimensional embedding")
        return vector

    def generate_sparse_vector(self, text: str) -> tuple[list[int], list[float]]:
        tokens = tokenize(text)
        tf = compute_tf(tokens)
        global SIMPLE_VOCAB
        for term in tf:
            if term not in SIMPLE_VOCAB:
                SIMPLE_VOCAB[term] = len(SIMPLE_VOCAB)
        indices = []
        values = []
        for term, tf_score in tf.items():
            if term in SIMPLE_VOCAB:
                indices.append(SIMPLE_VOCAB[term])
                values.append(tf_score)
        return indices, values


embedder = EmbedderService()
