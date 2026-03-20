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
    signals: dict | None = Field(
        default=None,
        description="Optional signals for semantic field classification (autocomplete, label_text, input_name, html_type)",
    )


class AnswerResponse(BaseModel):
    """Response payload containing generated answer and metadata."""

    answer: str = Field(description="Generated answer text grounded in resume context")
    has_data: bool = Field(description="Whether relevant context was found")
    confidence: ConfidenceLevel = Field(description="Confidence level of the answer")
    context_chunks: Annotated[
        int, Field(ge=0, le=5, description="Number of context chunks retrieved (0-5)")
    ]
    field_value: str | None = Field(
        default=None,
        description="Direct field value extracted from resume profile (e.g., name, email, phone)",
    )
    field_type: str | None = Field(
        default=None,
        description="Semantic field type if direct extraction was possible (e.g., 'full_name', 'email', 'phone')",
    )


class HealthResponse(BaseModel):
    status: str = "healthy"


class ErrorResponse(BaseModel):
    """Error response payload."""

    detail: str = Field(description="Error message")


class CheckStatus(str, Enum):
    """Status values for individual validation checks."""

    PASSED = "passed"
    FAILED = "failed"
    TIMEOUT = "timeout"


class ReportStatus(str, Enum):
    """Overall validation report status."""

    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"


class CheckName(str, Enum):
    """Names of validation checks."""

    INTERNAL_DNS = "internal_dns"
    EXTERNAL_ENDPOINT = "external_endpoint"
    URL_FORMAT = "url_format"
    EMBEDDING_DIMENSIONS = "embedding_dimensions"


class CheckResult(BaseModel):
    """Result of a single validation check."""

    name: CheckName = Field(description="Check identifier")
    status: CheckStatus = Field(description="Check result status")
    message: str = Field(description="Human-readable result or error details")
    duration_ms: Annotated[
        int, Field(ge=0, description="Execution time in milliseconds")
    ]
    details: dict | None = Field(default=None, description="Optional additional data")


class ValidationReport(BaseModel):
    """Complete validation response."""

    status: ReportStatus = Field(description="Overall validation status")
    timestamp: str = Field(description="ISO 8601 timestamp of validation run")
    total_duration_ms: Annotated[
        int, Field(ge=0, description="Total execution time in milliseconds")
    ]
    checks: Annotated[
        list[CheckResult], Field(min_length=1, description="Individual check results")
    ]


class JobOfferProcess(BaseModel):
    model_config = {"extra": "allow"}
    job_offers_id: int | None = None
    research: bool | None = None
    research_email: bool | None = None
    applied: bool | None = None


class JobOfferWithProcess(BaseModel):
    id: int = Field(description="Job offer primary key")
    title: str = Field(description="Job posting title")
    url: str = Field(description="URL to job posting")
    process: JobOfferProcess | None = Field(
        default=None, description="Processing metadata, null if no process record"
    )


class JobOffersListResponse(BaseModel):
    job_offers: list[JobOfferWithProcess] = Field(
        description="List of job offers with process data"
    )


class ProcessUpdateRequest(BaseModel):
    """Request payload for updating job offer process fields."""

    research: bool | None = Field(
        default=None, description="Whether job research has been completed"
    )
    research_email: bool | None = Field(
        default=None, description="Whether research email has been sent"
    )
    applied: bool | None = Field(
        default=None, description="Whether job application has been submitted"
    )
