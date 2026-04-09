import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, MagicMock

from src.main import app
from src.api.schemas import (
    AnswerRequest,
    AnswerResponse,
    ConfidenceLevel,
    HealthResponse,
)
from src.services.field_classifier import (
    SemanticFieldType,
    classify_field_type,
)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
def mock_embedder():
    mock = AsyncMock(spec=AsyncOpenAI)
    mock_client = AsyncMock()
    mock_client.embed = AsyncMock(return_value=[0.1] * 1024)
    return mock_client


@pytest_asyncio.fixture
def mock_retriever():
    mock = AsyncMock()
    mock.search = AsyncMock(
        return_value=[
            {"score": 0.85, "payload": {"text": "John Doe | Software Developer"}},
            {"score": 0.82, "payload": {"text": "Email: john@example.com"}},
        ]
    )
    mock.get_profile_chunk = AsyncMock(return_value=None)
    return mock


@pytest_asyncio.fixture
def mock_generator():
    mock = AsyncMock()
    mock.generate_answer = AsyncMock(return_value="John Doe is a software developer.")
    return mock


class TestHealthEndpoint:
    @pytest.mark.asyncio
    async def test_health_returns_healthy(self, client):
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    @pytest.mark.asyncio
    async def test_health_response_model(self, client):
        response = await client.get("/health")
        data = response.json()
        HealthResponse(**data)


class TestValidateEndpoint:
    @pytest.mark.asyncio
    async def test_validate_returns_report(self, client):
        response = await client.get("/validate")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "timestamp" in data
        assert "checks" in data
        assert isinstance(data["checks"], list)

    @pytest.mark.asyncio
    async def test_validate_check_structure(self, client):
        response = await client.get("/validate")
        data = response.json()
        for check in data["checks"]:
            assert "name" in check
            assert "status" in check
            assert "message" in check
            assert "duration_ms" in check


class TestFillFormContract:
    @pytest.mark.asyncio
    async def test_fill_form_returns_answer_structure(self, client):
        payload = {"query": "Email Address", "generate": True}
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "generated_answer" in data
        assert "results" in data
        assert "confidence" in data
        assert data["confidence"] in ["high", "medium", "low", "none"]

    @pytest.mark.asyncio
    async def test_fill_form_context_chunks_bounds(self, client):
        payload = {"query": "Email", "generate": True}
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert len(data.get("results", [])) <= 5


class TestFillFormValidation:
    @pytest.mark.asyncio
    async def test_fill_form_label_required(self, client):
        payload = {}
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_fill_form_label_min_length(self, client):
        payload = {"query": ""}
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_fill_form_label_max_length(self, client):
        payload = {"query": "x" * 1001}
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 422


class TestFillFormWithSignals:
    @pytest.mark.asyncio
    async def test_fill_form_with_email_signals(self, client):
        payload = {
            "query": "Contact",
            "signals": {"autocomplete": "email", "html_type": "email"},
            "generate": True,
        }
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_fill_form_with_phone_signals(self, client):
        payload = {
            "query": "Contact",
            "signals": {"autocomplete": "tel", "html_type": "tel"},
            "generate": True,
        }
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_fill_form_with_name_signals(self, client):
        payload = {"query": "Applicant", "signals": {"autocomplete": "name"}, "generate": True}
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_fill_form_with_city_signals(self, client):
        payload = {"query": "Location", "signals": {"autocomplete": "city"}, "generate": True}
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_fill_form_with_empty_signals(self, client):
        payload = {"query": "Email", "signals": {}, "generate": True}
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 200


class TestFieldClassifierIntegration:
    @pytest.mark.asyncio
    async def test_classify_email_from_signals(self, client):
        signals = {"autocomplete": "email"}
        result = classify_field_type(signals)
        assert result == SemanticFieldType.EMAIL

    @pytest.mark.asyncio
    async def test_classify_phone_from_signals(self, client):
        signals = {"html_type": "tel"}
        result = classify_field_type(signals)
        assert result == SemanticFieldType.PHONE

    @pytest.mark.asyncio
    async def test_classify_name_from_signals(self, client):
        signals = {"autocomplete": "name"}
        result = classify_field_type(signals)
        assert result == SemanticFieldType.FULL_NAME

    @pytest.mark.asyncio
    async def test_classify_returns_none_for_unknown(self, client):
        signals = {"label_text": "Favorite Color"}
        result = classify_field_type(signals)
        assert result is None
