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


@pytest.fixture(autouse=True)
def setup_mocks():
    import src.services.embedder as embedder_module
    import src.services.retriever as retriever_module
    import src.services.generator as generator_module

    mock_embedder = MagicMock()
    mock_embedder.embed = AsyncMock(return_value=[0.1] * 1024)

    mock_retriever = MagicMock()
    mock_retriever.hybrid_search = AsyncMock(return_value=[])
    mock_retriever.get_profile_chunk = AsyncMock(return_value=None)
    mock_retriever.search_with_reranking = AsyncMock(return_value=[])

    mock_generator = MagicMock()
    mock_generator.generate_answer = AsyncMock(return_value="Generated answer")
    mock_generator.classify_and_extract = AsyncMock(
        return_value=MagicMock(answer="Generated answer", field_type=None, confidence="high")
    )

    original_embedder = embedder_module.embedder
    original_retriever = retriever_module.retriever
    original_generator = generator_module.generator

    embedder_module.embedder = mock_embedder
    retriever_module.retriever = mock_retriever
    generator_module.generator = mock_generator

    yield {
        "embedder": mock_embedder,
        "retriever": mock_retriever,
        "generator": mock_generator,
    }

    embedder_module.embedder = original_embedder
    retriever_module.retriever = original_retriever
    generator_module.generator = original_generator


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
    async def test_fill_form_returns_answer_structure(self, client, setup_mocks):
        payload = {"query": "Email Address", "generate": True}
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "generated_answer" in data
        assert "results" in data
        assert "confidence" in data

    @pytest.mark.asyncio
    async def test_fill_form_context_chunks_bounds(self, client, setup_mocks):
        payload = {"query": "Email", "generate": True}
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert len(data.get("results", [])) <= 5


class TestFillFormValidation:
    @pytest.mark.asyncio
    async def test_fill_form_label_required(self, client, setup_mocks):
        payload = {}
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_fill_form_label_min_length(self, client, setup_mocks):
        payload = {"query": ""}
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_fill_form_label_max_length(self, client, setup_mocks):
        payload = {"query": "x" * 1001}
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 422


class TestFillFormWithSignals:
    @pytest.mark.asyncio
    async def test_fill_form_with_email_signals(self, client, setup_mocks):
        payload = {
            "query": "Contact",
            "signals": {"autocomplete": "email", "html_type": "email"},
            "generate": True,
        }
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_fill_form_with_phone_signals(self, client, setup_mocks):
        payload = {
            "query": "Contact",
            "signals": {"autocomplete": "tel", "html_type": "tel"},
            "generate": True,
        }
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_fill_form_with_name_signals(self, client, setup_mocks):
        payload = {"query": "Applicant", "signals": {"autocomplete": "name"}, "generate": True}
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_fill_form_with_city_signals(self, client, setup_mocks):
        payload = {"query": "Location", "signals": {"autocomplete": "city"}, "generate": True}
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_fill_form_with_empty_signals(self, client, setup_mocks):
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
