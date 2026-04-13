"""Generator service for LLM-based answer generation.

Implements grounded answer generation with anti-hallucination prompts
(Constitution III compliance).
"""

import json
import logging
from dataclasses import dataclass
from typing import Any

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

# System prompt for structured JSON output (LLM-based classification)
CLASSIFICATION_SYSTEM_PROMPT = """You are a resume field classifier that extracts structured data from form field labels and resume context.

TASK:
1. Classify the semantic field type from the form field label
2. Extract or generate the appropriate value from resume context
3. Return structured JSON with your analysis

CRITICAL RULES:
1. ONLY extract values explicitly present in the context
2. NEVER fabricate or infer values not in the context
3. For unknown fields, return "unknown" as field_type and generate a contextual answer
4. Be precise with field types - use the standard types listed below
5. Return valid JSON only - no explanations outside the JSON structure
6. For simple field types (first_name, last_name, email, phone, city, street, postcode), return ONLY the raw value in the "answer" field - DO NOT add any explanatory text, phrases, or sentences. Example: return "aliu@dev-hh.de" not "The email address is aliu@dev-hh.de"

FIELD TYPES (use these exact values when applicable):
- first_name, last_name, full_name, email, phone, birthdate
- city, street, zip, postcode, country
- github, linkedin, url
- education, experience, skills, summary
- unknown (when field type cannot be determined)

Return this exact JSON structure:
{
  "field_type": "type_here",
  "field_value": "extracted_value_or_null",
  "confidence": "high|medium|low",
  "answer": "generated_answer_text"
}

IMPORTANT: For first_name, last_name, email, phone, city, street, postcode - the answer must be the raw value only, never add extra text."""


@dataclass
class ClassificationResult:
    field_type: str | None
    field_value: str | None
    confidence: str
    answer: str


class GeneratorService:
    """Service for generating answers using LLM.

    Uses Mistral API to generate grounded answers based on
    retrieved context (Constitution III compliance).
    """

    def __init__(self):
        """Initialize generator with Mistral API client."""
        self.client = AsyncOpenAI(
            api_key=settings.MISTRAL_API_KEY,
            base_url=settings.MISTRAL_BASE_URL,
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
            model="mistral-small-latest",
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

    async def classify_and_extract(
        self,
        context: str,
        label: str,
        signals: dict[str, Any] | None = None,
    ) -> ClassificationResult:
        logger.info(f"Classifying field for label: {label}")

        signals_str = ""
        if signals:
            signals_str = f"\n\nForm field signals:\n{json.dumps(signals, indent=2)}"

        response = await self.client.chat.completions.create(
            model="mistral-small-latest",
            messages=[
                {"role": "system", "content": CLASSIFICATION_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Resume context:\n{context}{signals_str}\n\nForm field label: {label}",
                },
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )

        content = response.choices[0].message.content or "{}"

        try:
            parsed = json.loads(content)
            field_type = parsed.get("field_type")
            field_value = parsed.get("field_value")
            confidence = parsed.get("confidence", "medium")
            answer = parsed.get("answer", "I don't have information about that in the resume.")

            if field_value == "null" or field_value == "":
                field_value = None

            logger.info(f"Classification result: type={field_type}, confidence={confidence}")
            return ClassificationResult(
                field_type=field_type,
                field_value=field_value,
                confidence=confidence,
                answer=answer,
            )
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse LLM response as JSON: {content[:200]}")
            return ClassificationResult(
                field_type=None,
                field_value=None,
                confidence="low",
                answer="I don't have information about that in the resume.",
            )


# Global generator instance
generator = GeneratorService()
