"""API routes for RAG Backend.

Defines all endpoints for the form-filling RAG pipeline.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import router

# Configure logging (FR-010 compliance)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan for service connections."""
    from src.services.retriever import retriever
    from src.services.job_offers import job_offers_service

    logger.info("Starting RAG Backend API...")

    await retriever.connect()
    logger.info("Connected to Qdrant")

    await job_offers_service.connect()
    logger.info("Connected to PostgreSQL")

    yield

    await job_offers_service.close()
    await retriever.close()
    logger.info("Shutting down RAG Backend API...")


# Create FastAPI application
app = FastAPI(
    title="RAG Backend API",
    description="FastAPI backend implementing a RAG pipeline for job form filling",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS (Constitution IV compliance)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["moz-extension://*", "http://localhost", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)
