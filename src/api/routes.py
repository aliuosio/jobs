"""API route handlers for RAG Backend."""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Request

from src.api.schemas import (
    AnswerRequest,
    AnswerResponse,
    ConfidenceLevel,
    ErrorResponse,
    HealthResponse,
    ValidationReport,
)
from src.services.field_classifier import (
    SemanticFieldType,
    classify_field_type,
    extract_field_value_from_payload,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def _calculate_confidence(avg_score: float, chunk_count: int) -> ConfidenceLevel:
    if chunk_count == 0:
        return ConfidenceLevel.NONE
    if avg_score >= 0.8:
        return ConfidenceLevel.HIGH
    if avg_score >= 0.5:
        return ConfidenceLevel.MEDIUM
    return ConfidenceLevel.LOW


def _assemble_context(chunks: list[dict]) -> str:
    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        payload = chunk.get("payload", {})
        text = payload.get("text", "")
        if text:
            context_parts.append(f"[{i}] {text}")
    return "\n".join(context_parts)


def _extract_direct_field_value(
    chunks: list[dict], field_type: SemanticFieldType
) -> str | None:
    for chunk in chunks:
        payload = chunk.get("payload", {})
        if payload.get("profile"):
            value = extract_field_value_from_payload(payload, field_type)
            if value:
                return value
    return None


@router.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check() -> HealthResponse:
    return HealthResponse(status="healthy")


@router.get("/validate", response_model=ValidationReport, tags=["validation"])
async def validate_configuration() -> ValidationReport:
    from src.services.validation import run_all_checks

    return await run_all_checks()


@router.post(
    "/fill-form",
    response_model=AnswerResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request"},
        413: {"model": ErrorResponse, "description": "Payload too large"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
        503: {"model": ErrorResponse, "description": "Service unavailable"},
    },
    tags=["form-filling"],
)
async def fill_form(request: Request, answer_request: AnswerRequest) -> AnswerResponse:
    from src.services.embedder import embedder
    from src.services.generator import generator
    from src.services.retriever import retriever

    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 10240:
        logger.warning(f"Request payload too large: {content_length} bytes")
        raise HTTPException(
            status_code=413, detail="Request payload exceeds 10KB limit"
        )

    label = answer_request.label
    signals = answer_request.signals
    logger.info(f"Received form fill request: {label}, signals: {signals}")

    try:
        query_vector = await embedder.embed(label)
        chunks = await retriever.search(query_vector)
        chunk_count = len(chunks)

        if chunk_count == 0:
            logger.info("No relevant context found")
            return AnswerResponse(
                answer="I don't have information about that in the resume.",
                has_data=False,
                confidence=ConfidenceLevel.NONE,
                context_chunks=0,
            )

        avg_score = sum(c.get("score", 0) for c in chunks) / chunk_count
        confidence = _calculate_confidence(avg_score, chunk_count)
        logger.info(
            f"Retrieved {chunk_count} chunks with avg score {avg_score:.3f}, confidence: {confidence}"
        )

        field_type = classify_field_type(signals)
        field_value = None
        field_type_str = None

        if field_type:
            field_value = _extract_direct_field_value(chunks, field_type)
            if not field_value:
                profile_chunk = await retriever.get_profile_chunk()
                if profile_chunk:
                    chunks.insert(0, profile_chunk)
                    field_value = _extract_direct_field_value(
                        [profile_chunk], field_type
                    )
            if field_value:
                field_type_str = field_type.value
                logger.info(f"Direct extraction: {field_type_str}={field_value}")

        context = _assemble_context(chunks)
        answer = await generator.generate_answer(context, label)

        return AnswerResponse(
            answer=answer,
            has_data=True,
            confidence=confidence,
            context_chunks=chunk_count,
            field_value=field_value,
            field_type=field_type_str,
        )

    except ConnectionError as e:
        logger.error(f"Connection error: {e}")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")

    except Exception as e:
        logger.error(f"Unexpected error processing request: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
