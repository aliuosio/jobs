"""Database service for job offers data retrieval from PostgreSQL."""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

import asyncpg

from src.config import settings
from src.services.csv_export import (
    CSV_COLUMNS,
    generate_csv_bytes,
    generate_csv_filename,
)

logger = logging.getLogger(__name__)


class JobOffersService:
    """Async PostgreSQL service for job offers data with SSE broadcast support."""

    def __init__(self) -> None:
        self._pool: asyncpg.Pool | None = None
        self._broadcast_queue: asyncio.Queue | None = None
        self._subscribers: list[asyncio.Queue] = []

    async def connect(self) -> None:
        """Initialize database connection pool and broadcast queue."""
        self._pool = await asyncpg.create_pool(
            settings.DATABASE_URL,
            min_size=1,
            max_size=settings.DATABASE_POOL_SIZE,
        )
        self._broadcast_queue = asyncio.Queue()
        self._subscribers = []
        logger.info("Connected to PostgreSQL database 'n8n'")

    async def subscribe(self) -> asyncio.Queue:
        """Subscribe to job offer updates.

        Returns:
            Queue that will receive job offer updates.
        """
        if self._broadcast_queue is None:
            raise RuntimeError("Service not connected")
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers.append(queue)
        logger.info(f"SSE client subscribed (total: {len(self._subscribers)})")
        return queue

    async def unsubscribe(self, queue: asyncio.Queue) -> None:
        """Unsubscribe from job offer updates.

        Args:
            queue: The queue to remove from subscribers.
        """
        if queue in self._subscribers:
            self._subscribers.remove(queue)
            logger.info(f"SSE client unsubscribed (total: {len(self._subscribers)})")

    async def broadcast(self, data: list[dict[str, Any]]) -> None:
        """Broadcast job offer data to all subscribers.

        Args:
            data: List of job offers with process data.
        """
        if not self._subscribers:
            return
        for queue in self._subscribers:
            try:
                queue.put_nowait(data)
            except asyncio.QueueFull:
                logger.warning("SSE queue full, dropping message")
        logger.debug(f"Broadcast to {len(self._subscribers)} subscribers")

    async def close(self) -> None:
        """Close database connection pool."""
        if self._pool:
            await self._pool.close()
            logger.info("Closed PostgreSQL connection pool")

    async def get_job_offers(
        self,
        limit: int | None = None,
        offset: int | None = None,
        include_description: bool = False,
    ) -> list[dict[str, Any]]:
        if not self._pool:
            raise RuntimeError("Database pool not initialized")

        query = """
            SELECT
                jo.id,
                jo.title,
                jo.url,
                jo.description,
                jop.id as process_id,
                jop.job_offers_id,
                jop.research,
                jop.research_email,
                jop.applied
            FROM job_offers jo
            LEFT JOIN job_offers_process jop ON jo.id = jop.job_offers_id
            ORDER BY jo.id ASC
        """

        if limit is not None:
            query += f" LIMIT {int(limit)}"
        if offset is not None:
            query += f" OFFSET {int(offset)}"

        async with self._pool.acquire() as conn:
            rows = await conn.fetch(query)

        result = []
        for row in rows:
            row_dict = dict(row)
            process_data = {
                "process_id": row_dict.pop("process_id"),
                "job_offers_id": row_dict.pop("job_offers_id"),
                "research": row_dict.pop("research"),
                "research_email": row_dict.pop("research_email"),
                "applied": row_dict.pop("applied"),
            }
            job_offer = {
                "id": row_dict.pop("id"),
                "title": row_dict.pop("title"),
                "url": row_dict.pop("url"),
            }
            if include_description:
                job_offer["description"] = row_dict.pop("description")
            else:
                row_dict.pop("description", None)
            job_offer["process"] = process_data if process_data["job_offers_id"] is not None else None
            result.append(job_offer)

        logger.info(f"Retrieved {len(result)} job offers")
        return result

    async def update_job_offer_process(
        self,
        job_offer_id: int,
        research: bool | None = None,
        research_email: bool | None = None,
        applied: bool | None = None,
    ) -> dict[str, Any] | None:
        """Update or create job offer process record with upsert behavior.

        Args:
            job_offer_id: The ID of the job offer to update.
            research: Whether job research has been completed (None = preserve existing).
            research_email: Whether research email has been sent (None = preserve existing).
            applied: Whether job application has been submitted (None = preserve existing).

        Returns:
            Updated job offer dict with process data, or None if job offer not found.

        Raises:
            RuntimeError: If database pool not initialized.
            asyncpg.PostgresError: Database query failure.
        """
        if not self._pool:
            raise RuntimeError("Database pool not initialized")

        async with self._pool.acquire() as conn:
            async with conn.transaction():
                job_exists = await conn.fetchrow(
                    "SELECT id FROM job_offers WHERE id = $1",
                    job_offer_id,
                )
                if not job_exists:
                    return None

                query = """
                    INSERT INTO job_offers_process (job_offers_id, research, research_email, applied)
                    VALUES ($1, COALESCE($2, false), COALESCE($3, false), COALESCE($4, false))
                    ON CONFLICT (job_offers_id) DO UPDATE SET
                        research = COALESCE($2, job_offers_process.research),
                        research_email = COALESCE($3, job_offers_process.research_email),
                        applied = COALESCE($4, job_offers_process.applied)
                    RETURNING id as process_id, job_offers_id, research, research_email, applied
                """
                process_row = await conn.fetchrow(
                    query,
                    job_offer_id,
                    research,
                    research_email,
                    applied,
                )

                job_row = await conn.fetchrow(
                    "SELECT id, title, url FROM job_offers WHERE id = $1",
                    job_offer_id,
                )

                return {
                    "id": job_row["id"],
                    "title": job_row["title"],
                    "url": job_row["url"],
                    "process": {
                        "job_offers_id": process_row["job_offers_id"],
                        "research": process_row["research"],
                        "research_email": process_row["research_email"],
                        "applied": process_row["applied"],
                    },
                }

    async def update_and_broadcast(
        self,
        job_offer_id: int,
        research: bool | None = None,
        research_email: bool | None = None,
        applied: bool | None = None,
    ) -> dict[str, Any] | None:
        """Update job offer process and broadcast to all SSE subscribers.

        Combines update and broadcast into atomic operation.
        """
        result = await self.update_job_offer_process(
            job_offer_id=job_offer_id,
            research=research,
            research_email=research_email,
            applied=applied,
        )
        if result:
            # Broadcast full state after any update
            all_offers = await self.get_job_offers(include_description=False)
            await self.broadcast(all_offers)
        return result

    async def update_job_offer_description(
        self,
        job_offer_id: int,
        description: str | None = None,
    ) -> dict[str, Any] | None:
        """Update job offer description field.

        Args:
            job_offer_id: The ID of the job offer to update.
            description: New description text (None = preserve existing).

        Returns:
            Updated job offer dict with description, or None if not found.

        Raises:
            RuntimeError: If database pool not initialized.
            asyncpg.PostgresError: Database query failure.
        """
        if not self._pool:
            raise RuntimeError("Database pool not initialized")

        async with self._pool.acquire() as conn:
            async with conn.transaction():
                job_exists = await conn.fetchrow(
                    "SELECT id, title, url, description FROM job_offers WHERE id = $1",
                    job_offer_id,
                )
                if not job_exists:
                    return None

                if description is not None:
                    await conn.execute(
                        "UPDATE job_offers SET description = $2 WHERE id = $1",
                        job_offer_id,
                        description,
                    )

                return {
                    "id": job_exists["id"],
                    "title": job_exists["title"],
                    "url": job_exists["url"],
                    "description": description
                    if description is not None
                    else job_exists["description"],
                    "process": None,
                }

    async def get_applied_jobs_for_csv(
        self,
    ) -> list[dict[str, Any]]:
        """Get all applied job offers formatted for CSV export.

        Returns:
            List of job offer dictionaries with company, email, company_url,
            title, url, and posted fields for CSV export.

        Raises:
            RuntimeError: If database pool not initialized.
            asyncpg.PostgresError: Database query failure.
        """
        if not self._pool:
            raise RuntimeError("Database pool not initialized")

        query = """
            SELECT
                jo.id,
                jo.title,
                jo.url,
                jo.company,
                jo.email,
                jo.company_url,
                jo.created_at
            FROM job_offers jo
            INNER JOIN job_offers_process jop ON jo.id = jop.job_offers_id
            WHERE jop.applied = true
            ORDER BY jo.id ASC
        """

        async with self._pool.acquire() as conn:
            rows = await conn.fetch(query)

        result = []
        for row in rows:
            result.append(
                {
                    "id": row["id"],
                    "title": row["title"],
                    "url": row["url"],
                    "company": row.get("company"),
                    "email": row.get("email"),
                    "company_url": row.get("company_url"),
                    "posted": row.get("created_at"),
                }
            )

        logger.info(f"Retrieved {len(result)} applied job offers for CSV export")
        return result

    async def check_letter_generated(self, job_offer_id: int) -> bool | None:
        """Check if a cover letter has been generated for a job offer.

        Args:
            job_offer_id: The ID of the job offer to check.

        Returns:
            True if a letter exists, False if no letter, None if job offer not found.
        """
        if not self._pool:
            raise RuntimeError("Database pool not initialized")

        async with self._pool.acquire() as conn:
            job_exists = await conn.fetchrow(
                "SELECT id FROM job_offers WHERE id = $1",
                job_offer_id,
            )
            if not job_exists:
                return None

            query = """
                SELECT content FROM job_applications
                WHERE job_offers_id = $1
                AND content IS NOT NULL
                AND content <> ''
                LIMIT 1
            """

            row = await conn.fetchrow(query, job_offer_id)

        return row is not None

    async def delete_job_offer(self, job_offer_id: int) -> bool:
        """Delete a job offer and its associated process data."""
        if not self._pool:
            raise RuntimeError("Database pool not initialized")

        async with self._pool.acquire() as conn:
            async with conn.transaction():
                job_exists = await conn.fetchrow(
                    "SELECT id FROM job_offers WHERE id = $1",
                    job_offer_id,
                )
                if not job_exists:
                    logger.warning(f"delete_job_offer: job_offer_id={job_offer_id} not found")
                    return False

                await conn.execute(
                    "DELETE FROM job_applications WHERE job_offers_id = $1",
                    job_offer_id,
                )

                await conn.execute(
                    "DELETE FROM job_offers_process WHERE job_offers_id = $1",
                    job_offer_id,
                )

                await conn.execute(
                    "DELETE FROM job_offers WHERE id = $1",
                    job_offer_id,
                )

        logger.info(f"Deleted job_offer_id={job_offer_id} and all related data")
        return True


job_offers_service = JobOffersService()
