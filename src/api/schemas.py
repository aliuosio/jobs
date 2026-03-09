"""Pydantic models for API request/response schemas.

Defines all data models for the RAG Backend API endpoints.
"""

from enum import Enum
from typing import Annotated

from pydantic import BaseModel, Field


class ConfidenceLevel(str, Enum):
    """Confidence levels for generated answers."""

    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    NONE = "none"


class AnswerRequest(BaseModel):
    """Request payload for form field answer generation."""

    label: Annotated[
        str, Field(min_length=1, max_length=1000, description="Form field label text")
    ]


class AnswerResponse(BaseModel):
    """Response payload containing generated answer and metadata."""

    answer: str = Field(description="Generated answer text grounded in resume context")
    has_data: bool = Field(description="Whether relevant context was found")
    confidence: ConfidenceLevel = Field(description="Confidence level of the answer")
    context_chunks: Annotated[
        int, Field(ge=0, le=5, description="Number of context chunks retrieved (0-5)")
    ]


class HealthResponse(BaseModel):
    """Service health check response."""

    status: str = "healthy"


class ErrorResponse(BaseModel):
    """Error response payload."""

    detail: str = Field(description="Error message")
