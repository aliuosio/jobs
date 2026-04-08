"""HyDE Generator service for hypothetical document embeddings."""

import logging

from openai import AsyncOpenAI

from src.config import settings
from src.utils.cache import query_cache

logger = logging.getLogger(__name__)

HYDE_SYSTEM_PROMPT = """You are a helpful assistant that generates hypothetical resume content to improve semantic search.

Generate a brief, plausible resume snippet that could answer the user's question.
Focus on the type of information that would be relevant.
Keep it to 2-3 sentences maximum.
Do NOT use specific names or real data - generate generic but realistic content."""

HYDE_SHORT_QUERY_PROMPT = """Generate a brief search query expansion for the following keywords.
Focus on common variations and related terms.
Return only the expanded query, nothing else."""


class HyDEGenerator:
    """Service for generating hypothetical documents to improve retrieval."""

    def __init__(self):
        self._client = None

    async def initialize(self) -> None:
        if self._client is not None:
            return
        self._client = AsyncOpenAI(
            api_key=settings.MISTRAL_API_KEY,
            base_url=settings.MISTRAL_BASE_URL,
        )
        logger.info("HyDEGenerator initialized")

    @property
    def client(self) -> AsyncOpenAI:
        if self._client is None:
            raise RuntimeError("HyDEGenerator not initialized. Call initialize() first.")
        return self._client

    def _is_short_query(self, query: str) -> bool:
        words = query.strip().split()
        return len(words) <= 2

    async def generate(self, query: str) -> str | None:
        if self._client is None:
            await self.initialize()

        if self._is_short_query(query):
            logger.info(f"Skipping HyDE for short query: {query}")
            return None

        cached = await query_cache.get_hyde(query)
        if cached:
            logger.info(f"HyDE cache hit for query: {query[:50]}...")
            return cached

        logger.info(f"Generating HyDE for query: {query[:50]}...")

        try:
            response = await self.client.chat.completions.create(
                model=settings.HYDE_MODEL,
                messages=[
                    {"role": "system", "content": HYDE_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Question: {query}"},
                ],
                max_tokens=settings.HYDE_MAX_TOKENS,
                temperature=settings.HYDE_TEMPERATURE,
            )

            draft = response.choices[0].message.content

            if not draft or len(draft.strip()) < 10:
                logger.warning("HyDE generated empty/invalid response")
                return None

            await query_cache.set_hyde(query, draft)
            logger.info(f"HyDE generated: {draft[:100]}...")
            return draft

        except Exception as e:
            logger.error(f"HyDE generation failed: {e}")
            return None

    async def generate_with_fallback(self, query: str) -> str:
        result = await self.generate(query)
        return result if result else query


hyde = HyDEGenerator()
