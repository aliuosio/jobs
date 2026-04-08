import logging
from typing import Any

from src.api.schemas import ConfidenceLevel
from src.services.field_classifier import (
    SemanticFieldType,
    extract_field_value_from_payload,
)

logger = logging.getLogger(__name__)


def calculate_confidence(avg_score: float, chunk_count: int) -> ConfidenceLevel:
    if chunk_count == 0:
        return ConfidenceLevel.NONE
    if avg_score >= 0.8:
        return ConfidenceLevel.HIGH
    if avg_score >= 0.5:
        return ConfidenceLevel.MEDIUM
    return ConfidenceLevel.LOW


def combine_confidence(
    retrieval_confidence: ConfidenceLevel,
    llm_confidence: ConfidenceLevel,
    field_value: str | None,
) -> ConfidenceLevel:
    confidence_order = [
        ConfidenceLevel.NONE,
        ConfidenceLevel.LOW,
        ConfidenceLevel.MEDIUM,
        ConfidenceLevel.HIGH,
    ]
    retrieval_idx = confidence_order.index(retrieval_confidence)
    llm_idx = confidence_order.index(llm_confidence)
    base_idx = max(retrieval_idx, llm_idx)
    if field_value:
        base_idx = min(base_idx + 1, 3)
    return confidence_order[base_idx]


def assemble_context(chunks: list[dict]) -> str:
    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        payload = chunk.get("payload", {})
        text = payload.get("text", "")
        if text:
            context_parts.append(f"[{i}] {text}")
    return "\n".join(context_parts)


def extract_direct_field_value(chunks: list[dict], field_type: SemanticFieldType) -> str | None:
    for chunk in chunks:
        payload = chunk.get("payload", {})
        if payload.get("profile") or any(
            k in payload for k in ["firstname", "lastname", "email", "city", "postcode", "street"]
        ):
            value = extract_field_value_from_payload(payload, field_type)
            if value:
                return value
    return None


# Re-export for backwards compatibility
__all__ = [
    "calculate_confidence",
    "combine_confidence",
    "assemble_context",
    "extract_direct_field_value",
]
