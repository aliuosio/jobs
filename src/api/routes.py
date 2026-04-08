"""API route handlers for RAG Backend."""

import asyncio
import json
import logging
import time

from fastapi import APIRouter, HTTPException, Query, Request
from starlette.responses import Response, StreamingResponse

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
)
from src.services.fill_form import (
    calculate_confidence,
    combine_confidence,
    assemble_context,
    extract_direct_field_value,
)

logger = logging.getLogger(__name__)

router = APIRouter()


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
        embed_start = time.time()
        query_vector = await embedder.embed(label)
        embed_latency_ms = (time.time() - embed_start) * 1000
        logger.info(f"[fill-form] embedding_latency_ms={embed_latency_ms:.1f}")

        retrieval_start = time.time()

        # Use enhanced search if any retrieval enhancements are enabled
        from src.config import settings

        use_enhanced_search = (
            settings.HYDE_ENABLED
            or settings.EMBEDDING_RERANK_ENABLED
            or settings.LLM_RERANK_ENABLED
            or settings.MMR_ENABLED
        )

        if use_enhanced_search:
            chunks = await retriever.search_with_reranking(label, query_vector)
        else:
            chunks = await retriever.hybrid_search(label, query_vector)

        retrieval_latency_ms = (time.time() - retrieval_start) * 1000
        chunk_count = len(chunks)
        logger.info(
            f"[fill-form] retrieval_latency_ms={retrieval_latency_ms:.1f} chunks={chunk_count}"
        )

        search_chunks = chunk_count

        # CRITICAL: Include profile chunk for direct field extraction (FR-001, FR-002)
        try:
            profile_chunk = await retriever.get_profile_chunk()
            if profile_chunk:
                chunks.insert(0, profile_chunk)
                logger.info(f"[fill-form] profile_chunk_included")
        except Exception as e:
            logger.error(f"[fill-form] profile_chunk_fetch_failed: {e}")
            raise HTTPException(status_code=503, detail="Service temporarily unavailable")

        # FR-003: Try direct extraction for known field types before LLM classification
        if signals:
            field_type = classify_field_type(signals)
            if field_type:
                field_value = extract_direct_field_value(chunks, field_type)
                if field_value:
                    # Direct extraction succeeded - return early with HIGH confidence (FR-004)
                    logger.info(
                        f"[fill-form] direct_extraction_success field_type={field_type.value} "
                        f"field_value={field_value[:20]}..."
                    )
                    return AnswerResponse(
                        answer=field_value,
                        has_data=True,
                        confidence=ConfidenceLevel.HIGH,
                        context_chunks=search_chunks,
                        field_value=field_value,
                        field_type=field_type.value,
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
        retrieval_confidence = calculate_confidence(avg_score, chunk_count)
        context = assemble_context(chunks)

        gen_start = time.time()
        classification = await generator.classify_and_extract(
            context=context,
            label=label,
            signals=signals,
        )
        gen_latency_ms = (time.time() - gen_start) * 1000
        logger.info(f"[fill-form] generation_latency_ms={gen_latency_ms:.1f}")

        llm_confidence_str = classification.confidence.lower()
        if llm_confidence_str == "high":
            llm_confidence = ConfidenceLevel.HIGH
        elif llm_confidence_str == "medium":
            llm_confidence = ConfidenceLevel.MEDIUM
        elif llm_confidence_str == "low":
            llm_confidence = ConfidenceLevel.LOW
        else:
            llm_confidence = ConfidenceLevel.NONE

        confidence = combine_confidence(
            retrieval_confidence, llm_confidence, classification.field_value
        )

        has_data = (
            classification.field_value is not None
            or classification.answer != "I don't have information about that in the resume."
        )

        total_latency_ms = (time.time() - request_start) * 1000
        logger.info(
            f"[fill-form] request_complete total_latency_ms={total_latency_ms:.1f} "
            f"embed_ms={embed_latency_ms:.1f} retrieval_ms={retrieval_latency_ms:.1f} "
            f"gen_ms={gen_latency_ms:.1f} chunks={chunk_count} "
            f"retrieval_conf={retrieval_confidence.value} llm_conf={llm_confidence.value} "
            f"combined_conf={confidence.value} field_type={classification.field_type}"
        )

        return AnswerResponse(
            answer=classification.answer,
            has_data=has_data,
            confidence=confidence,
            context_chunks=search_chunks,
            field_value=classification.field_value,
            field_type=classification.field_type,
        )

    except ConnectionError as e:
        logger.error(f"[fill-form] connection_error: {e}")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")

    except Exception as e:
        logger.error(f"[fill-form] unexpected_error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get(
    "/job-offers",
    response_model=None,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid format parameter"},
        503: {"model": ErrorResponse, "description": "Database unavailable"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
    tags=["job-offers"],
)
async def get_job_offers(
    limit: int | None = None,
    offset: int | None = None,
    format: str | None = Query(default=None, description="Response format: 'json' or 'csv'"),
) -> JobOffersListResponse | Response:  # type: ignore[valid-type]
    """Retrieve job offers with processing metadata.

    Supports optional format parameter to return CSV export of applied jobs.
    """
    from asyncpg import PostgresError

    from src.services.job_offers import (
        generate_csv_bytes,
        generate_csv_filename,
        job_offers_service,
    )

    # Handle format parameter validation
    if format is not None:
        format = format.lower().strip()
        if format not in ("json", "csv"):
            raise HTTPException(
                status_code=400,
                detail="Invalid format parameter. Must be 'json' or 'csv'.",
            )

    try:
        if format == "csv":
            # Return CSV export of applied jobs only
            applied_jobs = await job_offers_service.get_applied_jobs_for_csv()
            csv_bytes = generate_csv_bytes(applied_jobs)
            filename = generate_csv_filename()
            logger.info(
                f"[job-offers] CSV export: {len(applied_jobs)} applied jobs, filename={filename}"
            )
            return Response(
                content=csv_bytes,
                media_type="text/csv; charset=utf-8",
                headers={
                    "Content-Disposition": f'attachment; filename="{filename}"',
                },
            )

        # Default: return JSON
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
