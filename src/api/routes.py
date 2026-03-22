"""API route handlers for RAG Backend."""

import asyncio
import json
import logging
import time
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from starlette.responses import StreamingResponse

from src.api.schemas import (
    AnswerRequest,
    AnswerResponse,
    ConfidenceLevel,
    ErrorResponse,
    HealthResponse,
    JobOfferWithProcess,
    JobOffersListResponse,
    ProcessUpdateRequest,
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


def _extract_direct_field_value(chunks: list[dict], field_type: SemanticFieldType) -> str | None:
    for chunk in chunks:
        payload = chunk.get("payload", {})
        if payload.get("profile") or any(
            k in payload for k in ["firstname", "lastname", "email", "city", "postcode", "street"]
        ):
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

    request_start = time.time()

    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 10240:
        logger.warning(f"Request payload too large: {content_length} bytes")
        raise HTTPException(status_code=413, detail="Request payload exceeds 10KB limit")

    label = answer_request.label
    signals = answer_request.signals
    logger.info(f"[fill-form] label={label!r} signals={signals}")

    try:
        # Embedding latency
        embed_start = time.time()
        query_vector = await embedder.embed(label)
        embed_latency_ms = (time.time() - embed_start) * 1000
        logger.info(f"[fill-form] embedding_latency_ms={embed_latency_ms:.1f}")

        # Retrieval latency
        retrieval_start = time.time()
        chunks = await retriever.search(query_vector)
        retrieval_latency_ms = (time.time() - retrieval_start) * 1000
        chunk_count = len(chunks)
        logger.info(
            f"[fill-form] retrieval_latency_ms={retrieval_latency_ms:.1f} chunks={chunk_count}"
        )

        if chunk_count == 0:
            logger.info("[fill-form] no_chunks_found")
            return AnswerResponse(
                answer="I don't have information about that in the resume.",
                has_data=False,
                confidence=ConfidenceLevel.NONE,
                context_chunks=0,
            )

        avg_score = sum(c.get("score", 0) for c in chunks) / chunk_count
        confidence = _calculate_confidence(avg_score, chunk_count)
        logger.info(
            f"[fill-form] retrieval_stats avg_score={avg_score:.3f} confidence={confidence.value}"
        )

        # Field classification latency
        classify_start = time.time()
        field_type = classify_field_type(signals)
        classify_latency_ms = (time.time() - classify_start) * 1000
        logger.info(
            f"[fill-form] classify_latency_ms={classify_latency_ms:.1f} field_type={field_type}"
        )

        field_value = None
        field_type_str = None

        if field_type:
            extraction_start = time.time()
            field_value = _extract_direct_field_value(chunks, field_type)
            if not field_value:
                profile_chunk = await retriever.get_profile_chunk()
                if profile_chunk:
                    chunks.insert(0, profile_chunk)
                    field_value = _extract_direct_field_value([profile_chunk], field_type)
            extraction_latency_ms = (time.time() - extraction_start) * 1000

            if field_value:
                field_type_str = field_type.value
                logger.info(
                    f"[fill-form] field_extraction field_type={field_type_str} "
                    f"value={field_value!r} extraction_latency_ms={extraction_latency_ms:.1f}"
                )
            else:
                logger.info(
                    f"[fill-form] field_extraction_failed field_type={field_type.value} "
                    f"extraction_latency_ms={extraction_latency_ms:.1f}"
                )

        context = _assemble_context(chunks)

        # Generation latency
        gen_start = time.time()
        answer = await generator.generate_answer(context, label)
        gen_latency_ms = (time.time() - gen_start) * 1000
        logger.info(f"[fill-form] generation_latency_ms={gen_latency_ms:.1f}")

        total_latency_ms = (time.time() - request_start) * 1000
        logger.info(
            f"[fill-form] request_complete total_latency_ms={total_latency_ms:.1f} "
            f"embed_ms={embed_latency_ms:.1f} retrieval_ms={retrieval_latency_ms:.1f} "
            f"classify_ms={classify_latency_ms:.1f} gen_ms={gen_latency_ms:.1f} "
            f"chunks={chunk_count} confidence={confidence.value}"
        )

        return AnswerResponse(
            answer=answer,
            has_data=True,
            confidence=confidence,
            context_chunks=chunk_count,
            field_value=field_value,
            field_type=field_type_str,
        )

    except ConnectionError as e:
        logger.error(f"[fill-form] connection_error: {e}")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")

    except Exception as e:
        logger.error(f"[fill-form] unexpected_error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get(
    "/job-offers",
    response_model=JobOffersListResponse,
    responses={
        503: {"model": ErrorResponse, "description": "Database unavailable"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
    tags=["job-offers"],
)
async def get_job_offers(
    limit: int | None = None, offset: int | None = None
) -> JobOffersListResponse:
    """Retrieve job offers with processing metadata."""
    from asyncpg import PostgresError

    from src.services.job_offers import job_offers_service

    try:
        offers = await job_offers_service.get_job_offers(limit=limit, offset=offset)
        return JobOffersListResponse(job_offers=[JobOfferWithProcess(**o) for o in offers])
    except PostgresError as e:
        logger.error(f"[job-offers] database_error: {e}")
        raise HTTPException(status_code=503, detail="Database temporarily unavailable")
    except Exception as e:
        logger.error(f"[job-offers] unexpected_error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch(
    "/job-offers/{job_offer_id}/process",
    response_model=JobOfferWithProcess,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid job offer ID"},
        404: {"model": ErrorResponse, "description": "Job offer not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
        503: {"model": ErrorResponse, "description": "Database unavailable"},
    },
    tags=["job-offers"],
)
async def update_job_offer_process(
    job_offer_id: int,
    update_request: ProcessUpdateRequest,
) -> JobOfferWithProcess:
    """Update job offer processing metadata with upsert behavior.

    Creates a new process record if one doesn't exist.
    Supports partial updates - only provided fields are modified.
    """
    from asyncpg import PostgresError

    from src.services.job_offers import job_offers_service

    if job_offer_id <= 0:
        raise HTTPException(status_code=400, detail="Job offer ID must be a positive integer")

    logger.info(
        f"[job-offers-process] updating job_offer_id={job_offer_id} "
        f"research={update_request.research} "
        f"research_email={update_request.research_email} "
        f"applied={update_request.applied}"
    )

    try:
        result = await job_offers_service.update_and_broadcast(
            job_offer_id=job_offer_id,
            research=update_request.research,
            research_email=update_request.research_email,
            applied=update_request.applied,
        )

        if result is None:
            logger.warning(f"[job-offers-process] not_found job_offer_id={job_offer_id}")
            raise HTTPException(status_code=404, detail="Job offer not found")

        logger.info(f"[job-offers-process] success job_offer_id={job_offer_id}")
        return JobOfferWithProcess(**result)

    except PostgresError as e:
        logger.error(f"[job-offers-process] database_error: {e}")
        raise HTTPException(status_code=503, detail="Database temporarily unavailable")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[job-offers-process] unexpected_error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get(
    "/api/v1/stream",
    tags=["job-offers"],
)
async def stream_job_offers():
    """Server-Sent Events endpoint for real-time job offer updates.

    Streams the complete list of job offers with process data to clients.
    Broadcasts updates whenever any job offer process data changes.
    """
    from src.services.job_offers import job_offers_service

    async def event_generator():
        # Subscribe to updates
        queue = await job_offers_service.subscribe()

        try:
            # Send initial state immediately
            initial_data = await job_offers_service.get_all_job_offers_for_broadcast()
            yield f"data: {json.dumps(initial_data)}\n\n"

            # Keep connection alive with periodic heartbeat
            heartbeat_interval = 30  # seconds
            last_heartbeat = time.time()

            while True:
                try:
                    # Wait for updates with timeout for heartbeat
                    data = await asyncio.wait_for(queue.get(), timeout=1.0)

                    # Send SSE message
                    yield f"data: {json.dumps(data)}\n\n"
                    last_heartbeat = time.time()

                except asyncio.TimeoutError:
                    # Send heartbeat comment to keep connection alive
                    current_time = time.time()
                    if current_time - last_heartbeat >= heartbeat_interval:
                        yield f": heartbeat\n\n"
                        last_heartbeat = current_time

        except asyncio.CancelledError:
            logger.info("[stream] Client disconnected")
        finally:
            # Unsubscribe on disconnect
            await job_offers_service.unsubscribe(queue)
            logger.info("[stream] Client unsubscribed")

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
