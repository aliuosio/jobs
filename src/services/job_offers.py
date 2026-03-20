"""Database service for job offers data retrieval from PostgreSQL."""

import logging
from typing import Any

import asyncpg

from src.config import settings

logger = logging.getLogger(__name__)


class JobOffersService:
    """Async PostgreSQL service for job offers data."""

    def __init__(self) -> None:
        self._pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        """Initialize database connection pool."""
        self._pool = await asyncpg.create_pool(
            settings.DATABASE_URL,
            min_size=1,
            max_size=settings.DATABASE_POOL_SIZE,
        )
        logger.info("Connected to PostgreSQL database 'n8n'")

    async def close(self) -> None:
        """Close database connection pool."""
        if self._pool:
            await self._pool.close()
            logger.info("Closed PostgreSQL connection pool")

    async def get_job_offers(
        self, limit: int | None = None, offset: int | None = None
    ) -> list[dict[str, Any]]:
        """Retrieve job offers with process data.

        Args:
            limit: Maximum number of records to return (None = all records).
            offset: Number of records to skip (None = start from beginning).

        Returns:
            List of job offer dictionaries with nested process data.

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
                "process": process_data
                if process_data["job_offers_id"] is not None
                else None,
            }
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


job_offers_service = JobOffersService()
