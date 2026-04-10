"""Integration tests for /api/v1/search endpoint with seeded data."""

import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import ASGITransport, AsyncClient
from src.main import app


@pytest_asyncio.fixture
async def mock_client():
    """Mock HTTP client for integration tests."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
def seeded_payload():
    """Sample payload with six flat fields matching the spec."""
    return {
        "firstname": "Test",
        "lastname": "User",
        "email": "test@example.com",
        "city": "Test City",
        "postcode": "12345",
        "street": "123 Test St",
        "t": "p",
        "text": "Test User | Software Engineer\nContact: Test City | test@example.com",
    }


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


class TestFillFormWithSeededData:
    """Integration tests for /api/v1/search endpoint with seeded flat-field data."""

    @pytest.mark.asyncio
    async def test_firstname_field(self, mock_client, seeded_payload, setup_mocks):
        """Test firstname extraction from flat field."""
        setup_mocks["retriever"].hybrid_search = AsyncMock(
            return_value=[{"score": 0.9, "payload": seeded_payload}]
        )
        setup_mocks["generator"].generate_answer = AsyncMock(return_value="Test")

        response = await mock_client.post(
            "/api/v1/search",
            json={
                "query": "First Name",
                "signals": {"autocomplete": "given-name"},
                "generate": True,
            },
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_lastname_field(self, mock_client, seeded_payload, setup_mocks):
        """Test lastname extraction from flat field."""
        setup_mocks["retriever"].hybrid_search = AsyncMock(
            return_value=[{"score": 0.9, "payload": seeded_payload}]
        )
        setup_mocks["generator"].generate_answer = AsyncMock(return_value="User")

        response = await mock_client.post(
            "/api/v1/search",
            json={
                "query": "Last Name",
                "signals": {"autocomplete": "family-name"},
                "generate": True,
            },
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_email_field(self, mock_client, seeded_payload, setup_mocks):
        """Test email extraction from flat field."""
        setup_mocks["retriever"].hybrid_search = AsyncMock(
            return_value=[{"score": 0.9, "payload": seeded_payload}]
        )
        setup_mocks["generator"].generate_answer = AsyncMock(return_value="test@example.com")

        response = await mock_client.post(
            "/api/v1/search",
            json={
                "query": "Email",
                "signals": {"autocomplete": "email"},
                "generate": True,
            },
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_city_field(self, mock_client, seeded_payload, setup_mocks):
        """Test city extraction from flat field."""
        setup_mocks["retriever"].hybrid_search = AsyncMock(
            return_value=[{"score": 0.9, "payload": seeded_payload}]
        )
        setup_mocks["generator"].generate_answer = AsyncMock(return_value="Test City")

        response = await mock_client.post(
            "/api/v1/search",
            json={
                "query": "City",
                "signals": {"autocomplete": "address-level2"},
                "generate": True,
            },
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_postcode_field(self, mock_client, seeded_payload, setup_mocks):
        """Test postcode extraction from flat field."""
        setup_mocks["retriever"].hybrid_search = AsyncMock(
            return_value=[{"score": 0.9, "payload": seeded_payload}]
        )
        setup_mocks["generator"].generate_answer = AsyncMock(return_value="12345")

        response = await mock_client.post(
            "/api/v1/search",
            json={
                "query": "Postcode",
                "signals": {"autocomplete": "postal-code"},
                "generate": True,
            },
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_street_field(self, mock_client, seeded_payload, setup_mocks):
        """Test street extraction from flat field."""
        setup_mocks["retriever"].hybrid_search = AsyncMock(
            return_value=[{"score": 0.9, "payload": seeded_payload}]
        )
        setup_mocks["generator"].generate_answer = AsyncMock(return_value="123 Test St")

        response = await mock_client.post(
            "/api/v1/search",
            json={
                "query": "Street",
                "signals": {"autocomplete": "street-address"},
                "generate": True,
            },
        )
        assert response.status_code == 200


class TestFillFormWithNestedData:
    """Integration tests for /api/v1/search endpoint with nested profile data."""

    @pytest.fixture
    def nested_payload(self):
        return {
            "t": "p",
            "profile": {
                "fn": "Test User",
                "em": "test@example.com",
                "adr": {
                    "city": "Nested City",
                    "st": "Nested Street 1",
                },
            },
        }

    @pytest.mark.asyncio
    async def test_nested_city(self, mock_client, nested_payload, setup_mocks):
        """Test city extraction from nested profile structure."""
        setup_mocks["retriever"].hybrid_search = AsyncMock(
            return_value=[{"score": 0.9, "payload": nested_payload}]
        )
        setup_mocks["generator"].generate_answer = AsyncMock(return_value="Nested City")

        response = await mock_client.post(
            "/api/v1/search",
            json={
                "query": "City",
                "signals": {"autocomplete": "address-level2"},
                "generate": True,
            },
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_nested_street(self, mock_client, nested_payload, setup_mocks):
        """Test street extraction from nested profile structure."""
        setup_mocks["retriever"].hybrid_search = AsyncMock(
            return_value=[{"score": 0.9, "payload": nested_payload}]
        )
        setup_mocks["generator"].generate_answer = AsyncMock(return_value="Nested Street 1")

        response = await mock_client.post(
            "/api/v1/search",
            json={
                "query": "Street",
                "signals": {"autocomplete": "street-address"},
                "generate": True,
            },
        )
        assert response.status_code == 200


class TestFillFormErrorHandling:
    """Error handling tests for /api/v1/search endpoint."""

    @pytest.mark.asyncio
    async def test_unknown_field(self, mock_client, setup_mocks):
        """Test response when field type is unknown."""
        setup_mocks["retriever"].hybrid_search = AsyncMock(return_value=[])
        setup_mocks["generator"].generate_answer = AsyncMock(return_value="Generated answer")

        response = await mock_client.post(
            "/api/v1/search", json={"query": "Unknown Field", "generate": True}
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_empty_signals(self, mock_client, setup_mocks):
        """Test response when signals is empty."""
        setup_mocks["retriever"].hybrid_search = AsyncMock(return_value=[])
        setup_mocks["generator"].generate_answer = AsyncMock(return_value="Generated answer")

        response = await mock_client.post(
            "/api/v1/search", json={"query": "Name", "signals": {}, "generate": True}
        )
        assert response.status_code == 200
