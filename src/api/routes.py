"""API route handlers for RAG Backend.

Implements all endpoints defined in contracts/openapi.yaml.
"""

import logging

from fastapi import APIRouter, HTTPException, Request

from src.api.schemas import (
    AnswerRequest,
    AnswerResponse,
    ConfidenceLevel,
    ErrorResponse,
    HealthResponse,
    ValidationReport,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def _calculate_confidence(avg_score: float, chunk_count: int) -> ConfidenceLevel:
    """Calculate confidence level based on average similarity score.

    Args:
        avg_score: Average similarity score of retrieved chunks.
        chunk_count: Number of chunks retrieved.

    Returns:
        ConfidenceLevel enum value.
    """
    if chunk_count == 0:
        return ConfidenceLevel.NONE
    if avg_score >= 0.8:
        return ConfidenceLevel.HIGH
    if avg_score >= 0.5:
        return ConfidenceLevel.MEDIUM
    return ConfidenceLevel.LOW


def _assemble_context(chunks: list[dict]) -> str:
    """Assemble context string from retrieved chunks.

    Args:
        chunks: List of retrieved chunks with payload.

    Returns:
        Formatted context string for LLM prompt.
    """
    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        payload = chunk.get("payload", {})
        text = payload.get("text", "")
        if text:
            context_parts.append(f"[{i}] {text}")
    return "\n".join(context_parts)


@router.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check() -> HealthResponse:
    """Health check endpoint for monitoring and Docker health checks.

    Returns:
        HealthResponse: Service health status.
    """
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
    """Generate answer for form field based on resume data.

    Implements full RAG pipeline:
    1. Validate request payload size
    2. Generate embedding for form label
    3. Retrieve relevant context from Qdrant
    4. Generate grounded answer using LLM
    5. Calculate confidence level

    Args:
        request: FastAPI request object for payload size validation.
        answer_request: Form field label to generate answer for.

    Returns:
        AnswerResponse: Generated answer with confidence metadata.

    Raises:
        HTTPException: 413 if payload exceeds 10KB, 500/503 for service errors.
    """
    from src.services.embedder import embedder
    from src.services.generator import generator
    from src.services.retriever import retriever

    # Validate payload size (10KB limit per spec)
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 10240:
        logger.warning(f"Request payload too large: {content_length} bytes")
        raise HTTPException(
            status_code=413, detail="Request payload exceeds 10KB limit"
        )

    label = answer_request.label
    logger.info(f"Received form fill request: {label}")

    try:
        # Step 1: Generate embedding for the query
        query_vector = await embedder.embed(label)

        # Step 2: Retrieve relevant context from Qdrant
        chunks = await retriever.search(query_vector)
        chunk_count = len(chunks)

        # Handle no context found
        if chunk_count == 0:
            logger.info("No relevant context found")
            return AnswerResponse(
                answer="I don't have information about that in the resume.",
                has_data=False,
                confidence=ConfidenceLevel.NONE,
                context_chunks=0,
            )

        # Step 3: Calculate confidence based on average score
        avg_score = sum(c.get("score", 0) for c in chunks) / chunk_count
        confidence = _calculate_confidence(avg_score, chunk_count)
        logger.info(
            f"Retrieved {chunk_count} chunks with avg score {avg_score:.3f}, confidence: {confidence}"
        )

        # Step 4: Assemble context and generate answer
        context = _assemble_context(chunks)
        answer = await generator.generate_answer(context, label)

        return AnswerResponse(
            answer=answer,
            has_data=True,
            confidence=confidence,
            context_chunks=chunk_count,
        )

    except ConnectionError as e:
        logger.error(f"Connection error: {e}")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")

    except Exception as e:
        logger.error(f"Unexpected error processing request: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
