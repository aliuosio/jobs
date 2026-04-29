"""API route handlers for RAG Backend."""

import asyncio
import json
import logging
import time

from fastapi import APIRouter, HTTPException, Query, Request
from starlette.responses import Response, StreamingResponse

from src.api.schemas import (
    ConfidenceLevel,
    ErrorResponse,
    HealthResponse,
    JobOfferUpdateRequest,
    JobOfferWithProcess,
    JobOffersListResponse,
    ProcessUpdateRequest,
    SearchRequest,
    SearchResponse,
    SearchResult,
    SearchScores,
    ValidationReport,
)
from src.services.field_classifier import (
    SemanticFieldType,
    classify_field_type,
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
    "/api/v1/search",
    response_model=SearchResponse,
    responses={
        422: {"model": ErrorResponse, "description": "Validation error"},
        503: {"model": ErrorResponse, "description": "Service unavailable"},
    },
    tags=["search"],
)
async def search_resume(search_req: SearchRequest) -> SearchResponse:
    """Search resume data with configurable retrieval enhancements.

    Provides access to the full RAG retrieval pipeline including:
    - Hybrid search (vector + BM25)
    - HyDE (Hypothetical Document Embeddings)
    - Cross-encoder and LLM rubric reranking
    """
    from src.services.retrieval_pipeline import pipeline

    try:
        return await pipeline.search(search_req)
    except (ConnectionError, RuntimeError) as e:
        if "not connected" in str(e).lower():
            logger.error("[search] connection_error: Qdrant not connected")
            raise HTTPException(status_code=503, detail="Service temporarily unavailable")
        raise
    except Exception as e:
        logger.error(f"[search] unexpected_error: {e}", exc_info=True)
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


@router.patch(
    "/job-offers/{job_offer_id}",
    response_model=JobOfferWithProcess,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid job offer ID"},
        404: {"model": ErrorResponse, "description": "Job offer not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
        503: {"model": ErrorResponse, "description": "Database unavailable"},
    },
    tags=["job-offers"],
)
async def update_job_offer(
    job_offer_id: int,
    update_request: JobOfferUpdateRequest,
) -> JobOfferWithProcess:
    """Update job offer fields (e.g., description) with partial update behavior.

    Only provided fields are modified. Supports updating description for cover letter generation.
    """
    from asyncpg import PostgresError

    from src.services.job_offers import job_offers_service

    if job_offer_id <= 0:
        raise HTTPException(status_code=400, detail="Job offer ID must be a positive integer")

    logger.info(
        f"[job-offers] updating job_offer_id={job_offer_id} "
        f"description={'provided' if update_request.description is not None else 'not provided'}"
    )

    try:
        result = await job_offers_service.update_job_offer_description(
            job_offer_id=job_offer_id,
            description=update_request.description,
        )

        if result is None:
            logger.warning(f"[job-offers] not_found job_offer_id={job_offer_id}")
            raise HTTPException(status_code=404, detail="Job offer not found")

        logger.info(f"[job-offers] success job_offer_id={job_offer_id}")
        return JobOfferWithProcess(**result)

    except PostgresError as e:
        logger.error(f"[job-offers] database_error: {e}")
        raise HTTPException(status_code=503, detail="Database temporarily unavailable")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[job-offers] unexpected_error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete(
    "/job-offers/{job_offer_id}",
    status_code=204,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid job offer ID"},
        404: {"model": ErrorResponse, "description": "Job offer not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
        503: {"model": ErrorResponse, "description": "Database unavailable"},
    },
    tags=["job-offers"],
)
async def delete_job_offer(job_offer_id: int) -> None:
    """Delete a job offer and its associated process data."""
    from asyncpg import PostgresError

    from src.services.job_offers import job_offers_service

    if job_offer_id <= 0:
        raise HTTPException(status_code=400, detail="Job offer ID must be a positive integer")

    logger.info(f"[job-offers] deleting job_offer_id={job_offer_id}")

    try:
        deleted = await job_offers_service.delete_job_offer(job_offer_id)

        if not deleted:
            logger.warning(f"[job-offers] not_found job_offer_id={job_offer_id}")
            raise HTTPException(status_code=404, detail="Job offer not found")

        logger.info(f"[job-offers] deleted job_offer_id={job_offer_id}")

    except PostgresError as e:
        logger.error(f"[job-offers] database_error: {e}")
        raise HTTPException(status_code=503, detail="Database temporarily unavailable")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[job-offers] unexpected_error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get(
    "/job-offers/{job_offer_id}/letter-status",
    response_model=dict,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid job offer ID"},
        404: {"model": ErrorResponse, "description": "Job offer not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
        503: {"model": ErrorResponse, "description": "Database unavailable"},
    },
    tags=["job-offers"],
)
async def get_letter_status(job_offer_id: int) -> dict:
    from asyncpg import PostgresError

    from src.services.job_offers import job_offers_service

    if job_offer_id <= 0:
        raise HTTPException(status_code=400, detail="Job offer ID must be a positive integer")

    logger.info(f"[letter-status] checking job_offer_id={job_offer_id}")

    try:
        letter_generated = await job_offers_service.check_letter_generated(job_offer_id)

        if letter_generated is None:
            logger.warning(f"[letter-status] not_found job_offer_id={job_offer_id}")
            raise HTTPException(status_code=404, detail="Job offer not found")

        logger.info(
            f"[letter-status] success job_offer_id={job_offer_id} letter_generated={letter_generated}"
        )
        return {"letter_generated": letter_generated}

    except PostgresError as e:
        logger.error(f"[letter-status] database_error: {e}")
        raise HTTPException(status_code=503, detail="Database temporarily unavailable")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[letter-status] unexpected_error: {e}", exc_info=True)
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
            initial_data = await job_offers_service.get_job_offers(include_description=False)
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
