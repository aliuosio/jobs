"""Generator service for LLM-based answer generation.

Implements grounded answer generation with anti-hallucination prompts
(Constitution III compliance).
"""

import logging

from openai import AsyncOpenAI

from src.config import settings

logger = logging.getLogger(__name__)

# Anti-hallucination system prompt (Constitution III compliance)
SYSTEM_PROMPT = """You are a helpful assistant that answers questions about a job applicant's resume.

CRITICAL RULES:
1. ONLY use information from the provided context
2. If the context doesn't contain relevant information, say "I don't have information about that in the resume"
3. NEVER fabricate or infer experience not explicitly stated
4. Keep answers concise and factual
5. Do not add information not present in the context"""


class GeneratorService:
    """Service for generating answers using LLM.

    Uses OpenAI-compatible API to generate grounded answers based on
    retrieved context (Constitution III compliance).
    """

    def __init__(self):
        """Initialize generator with OpenAI-compatible client."""
        self.client = AsyncOpenAI(
            api_key=settings.ZAI_API_KEY,
            base_url=settings.ZAI_BASE_URL,
        )

    async def generate_answer(self, context: str, question: str) -> str:
        """Generate grounded answer based on context.

        Args:
            context: Retrieved context from vector store.
            question: User's question (form field label).

        Returns:
            Generated answer text grounded in context.

        Raises:
            APIError: If answer generation fails.
        """
        logger.info(f"Generating answer for question: {question}")

        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Context from resume:\n{context}\n\nQuestion: {question}",
                },
            ],
            temperature=0.3,  # Low temperature for factual responses
        )

        answer = (
            response.choices[0].message.content
            or "I don't have information about that in the resume."
        )
        logger.info(f"Generated answer: {answer[:100]}...")
        return answer


# Global generator instance
generator = GeneratorService()
