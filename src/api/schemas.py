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

    label: Annotated[str, Field(min_length=1, max_length=1000, description="Form field label text")]
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
    duration_ms: Annotated[int, Field(ge=0, description="Execution time in milliseconds")]
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
    url: str | None = Field(default=None, description="URL to job posting")
    description: str | None = Field(default=None, description="Job description text")
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


class JobOfferUpdateRequest(BaseModel):
    """Request payload for updating job offer fields (e.g., description)."""

    description: str | None = Field(
        default=None, description="Job description text for cover letter generation"
    )


class SparseVector(BaseModel):
    indices: list[int] = Field(description="Token IDs from vocabulary")
    values: list[float] = Field(description="BM25-weighted values")


class HybridWeights(BaseModel):
    vector_weight: float = Field(default=0.7, description="Weight for dense vector similarity")
    bm25_weight: float = Field(default=0.3, description="Weight for BM25 score")
    phrase_bonus_weight: float = Field(default=0.1, description="Weight for phrase bonus")


class SearchRequest(BaseModel):
    """Request payload for resume search."""

    query: Annotated[str, Field(min_length=1, max_length=500, description="Search query text")]
    use_hyde: bool = Field(
        default=True,
        description="Enable HyDE (Hypothetical Document Embeddings) for improved retrieval",
    )
    use_reranking: bool = Field(
        default=True, description="Enable reranking (cross-encoder + LLM rubric)"
    )
    top_k: Annotated[int, Field(default=5, ge=1, le=20, description="Number of results to return")]
    include_scores: bool = Field(
        default=True, description="Include detailed score breakdown in results"
    )
    generate: bool = Field(default=False, description="Generate an answer using LLM")
    signals: dict | None = Field(
        default=None,
        description="Optional signals for semantic field classification (autocomplete, html_type, label_text, input_name)",
    )


class SearchScores(BaseModel):
    """Score breakdown for a search result."""

    vector_score: float | None = Field(default=None, description="Dense vector similarity score")
    bm25_score: float | None = Field(default=None, description="BM25 keyword match score")
    rerank_score: float | None = Field(
        default=None, description="Reranking score (cross-encoder/LLM)"
    )


class SearchResult(BaseModel):
    """Single search result."""

    content: str = Field(description="Resume content chunk text")
    score: float = Field(description="Combined relevance score")
    source: str = Field(
        default="resume", description="Source of the content (profile, resume, skills)"
    )
    scores: SearchScores | None = Field(
        default=None, description="Detailed score breakdown (when include_scores=true)"
    )


class SearchResponse(BaseModel):
    """Response payload for resume search."""

    results: list[SearchResult] = Field(description="List of search results ranked by relevance")
    query: str = Field(description="Echo of the original search query")
    total_retrieved: int = Field(description="Number of results returned")
    generated_answer: str | None = Field(
        default=None, description="LLM-generated answer (when generate=true)"
    )
    confidence: ConfidenceLevel | None = Field(
        default=None, description="Confidence level of generated answer"
    )
    field_type: str | None = Field(
        default=None, description="Detected field type (e.g., email, phone, name)"
    )
