"""Integration tests for /fill-form endpoint with seeded data."""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, patch, MagicMock
from src.main import app
from src.api.schemas import AnswerRequest, AnswerResponse, ConfidenceLevel


@pytest_asyncio.fixture
async def mock_client():
    """Mock HTTP client for integration tests."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest_asyncio.fixture
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


class TestFillFormWithSeededData:
    """Integration tests for /fill-form endpoint with seeded flat-field data."""

    @pytest.mark.asyncio
    async def test_firstname_field(self, mock_client, seeded_payload):
        """Test firstname extraction from flat field."""
        mock_embed = MagicMock()
        mock_embed.embed = AsyncMock(return_value=[1.0] * 1024)
        mock_retriever = MagicMock()
        mock_retriever.search = AsyncMock(
            return_value=[{"score": 0.9, "payload": seeded_payload}]
        )
        mock_retriever.get_profile_chunk = AsyncMock(return_value=None)
        mock_gen = MagicMock()
        mock_gen.generate_answer = AsyncMock(return_value="Test answer")

        with patch("src.services.embedder.embedder", mock_embed):
            with patch("src.services.retriever.retriever", mock_retriever):
                with patch("src.services.generator.generator", mock_gen):
                    response = await mock_client.post(
                        "/fill-form",
                        json={
                            "label": "First Name",
                            "signals": {"autocomplete": "given-name"},
                        },
                    )
                    assert response.status_code == 200
                    data = response.json()
                    assert data["field_type"] == "first_name"
                    assert data["field_value"] == "Test"

    @pytest.mark.asyncio
    async def test_lastname_field(self, mock_client, seeded_payload):
        """Test lastname extraction from flat field."""
        mock_embed = MagicMock()
        mock_embed.embed = AsyncMock(return_value=[1.0] * 1024)
        mock_retriever = MagicMock()
        mock_retriever.search = AsyncMock(
            return_value=[{"score": 0.9, "payload": seeded_payload}]
        )
        mock_retriever.get_profile_chunk = AsyncMock(return_value=None)
        mock_gen = MagicMock()
        mock_gen.generate_answer = AsyncMock(return_value="Test answer")

        with patch("src.services.embedder.embedder", mock_embed):
            with patch("src.services.retriever.retriever", mock_retriever):
                with patch("src.services.generator.generator", mock_gen):
                    response = await mock_client.post(
                        "/fill-form",
                        json={
                            "label": "Last Name",
                            "signals": {"autocomplete": "family-name"},
                        },
                    )
                    assert response.status_code == 200
                    data = response.json()
                    assert data["field_type"] == "last_name"
                    assert data["field_value"] == "User"

    @pytest.mark.asyncio
    async def test_email_field(self, mock_client, seeded_payload):
        """Test email extraction from flat field."""
        mock_embed = MagicMock()
        mock_embed.embed = AsyncMock(return_value=[1.0] * 1024)
        mock_retriever = MagicMock()
        mock_retriever.search = AsyncMock(
            return_value=[{"score": 0.9, "payload": seeded_payload}]
        )
        mock_retriever.get_profile_chunk = AsyncMock(return_value=None)
        mock_gen = MagicMock()
        mock_gen.generate_answer = AsyncMock(return_value="Test answer")

        with patch("src.services.embedder.embedder", mock_embed):
            with patch("src.services.retriever.retriever", mock_retriever):
                with patch("src.services.generator.generator", mock_gen):
                    response = await mock_client.post(
                        "/fill-form",
                        json={"label": "Email", "signals": {"autocomplete": "email"}},
                    )
                    assert response.status_code == 200
                    data = response.json()
                    assert data["field_type"] == "email"
                    assert data["field_value"] == "test@example.com"

    @pytest.mark.asyncio
    async def test_city_field(self, mock_client, seeded_payload):
        """Test city extraction from flat field."""
        mock_embed = MagicMock()
        mock_embed.embed = AsyncMock(return_value=[1.0] * 1024)
        mock_retriever = MagicMock()
        mock_retriever.search = AsyncMock(
            return_value=[{"score": 0.9, "payload": seeded_payload}]
        )
        mock_retriever.get_profile_chunk = AsyncMock(return_value=None)
        mock_gen = MagicMock()
        mock_gen.generate_answer = AsyncMock(return_value="Test answer")

        with patch("src.services.embedder.embedder", mock_embed):
            with patch("src.services.retriever.retriever", mock_retriever):
                with patch("src.services.generator.generator", mock_gen):
                    response = await mock_client.post(
                        "/fill-form",
                        json={
                            "label": "City",
                            "signals": {"autocomplete": "address-level2"},
                        },
                    )
                    assert response.status_code == 200
                    data = response.json()
                    assert data["field_type"] == "city"
                    assert data["field_value"] == "Test City"

    @pytest.mark.asyncio
    async def test_postcode_field(self, mock_client, seeded_payload):
        """Test postcode extraction from flat field."""
        mock_embed = MagicMock()
        mock_embed.embed = AsyncMock(return_value=[1.0] * 1024)
        mock_retriever = MagicMock()
        mock_retriever.search = AsyncMock(
            return_value=[{"score": 0.9, "payload": seeded_payload}]
        )
        mock_retriever.get_profile_chunk = AsyncMock(return_value=None)
        mock_gen = MagicMock()
        mock_gen.generate_answer = AsyncMock(return_value="Test answer")

        with patch("src.services.embedder.embedder", mock_embed):
            with patch("src.services.retriever.retriever", mock_retriever):
                with patch("src.services.generator.generator", mock_gen):
                    response = await mock_client.post(
                        "/fill-form",
                        json={
                            "label": "Postcode",
                            "signals": {"autocomplete": "postal-code"},
                        },
                    )
                    assert response.status_code == 200
                    data = response.json()
                    assert data["field_type"] in ("postcode", "zip")
                    assert data["field_value"] == "12345"

    @pytest.mark.asyncio
    async def test_street_field(self, mock_client, seeded_payload):
        """Test street extraction from flat field."""
        mock_embed = MagicMock()
        mock_embed.embed = AsyncMock(return_value=[1.0] * 1024)
        mock_retriever = MagicMock()
        mock_retriever.search = AsyncMock(
            return_value=[{"score": 0.9, "payload": seeded_payload}]
        )
        mock_retriever.get_profile_chunk = AsyncMock(return_value=None)
        mock_gen = MagicMock()
        mock_gen.generate_answer = AsyncMock(return_value="Test answer")

        with patch("src.services.embedder.embedder", mock_embed):
            with patch("src.services.retriever.retriever", mock_retriever):
                with patch("src.services.generator.generator", mock_gen):
                    response = await mock_client.post(
                        "/fill-form",
                        json={
                            "label": "Street",
                            "signals": {"autocomplete": "street-address"},
                        },
                    )
                    assert response.status_code == 200
                    data = response.json()
                    assert data["field_type"] == "street"
                    assert data["field_value"] == "123 Test St"


class TestFillFormWithNestedData:
    """Test backward compatibility with nested profile structure."""

    @pytest_asyncio.fixture
    def nested_payload(self):
        """Sample nested payload structure."""
        return {
            "t": "p",
            "text": "John Doe | Software Engineer\nContact: New York | john@example.com",
            "profile": {
                "fn": "John Doe",
                "em": "john@example.com",
                "ph": "+1-555-123-4567",
                "adr": {
                    "st": "456 Nested St",
                    "city": "Nested City",
                    "zip": "99999",
                    "cc": "US",
                },
            },
        }

    @pytest.mark.asyncio
    async def test_nested_city(self, mock_client, nested_payload):
        """Test city extraction from nested structure."""
        mock_embed = MagicMock()
        mock_embed.embed = AsyncMock(return_value=[1.0] * 1024)
        mock_retriever = MagicMock()
        mock_retriever.search = AsyncMock(
            return_value=[{"score": 0.9, "payload": nested_payload}]
        )
        mock_retriever.get_profile_chunk = AsyncMock(return_value=nested_payload)
        mock_gen = MagicMock()
        mock_gen.generate_answer = AsyncMock(return_value="Test answer")

        with patch("src.services.embedder.embedder", mock_embed):
            with patch("src.services.retriever.retriever", mock_retriever):
                with patch("src.services.generator.generator", mock_gen):
                    response = await mock_client.post(
                        "/fill-form",
                        json={
                            "label": "City",
                            "signals": {"autocomplete": "address-level2"},
                        },
                    )
                    assert response.status_code == 200
                    data = response.json()
                    assert data["field_type"] == "city"
                    assert data["field_value"] == "Nested City"

    @pytest.mark.asyncio
    async def test_nested_street(self, mock_client, nested_payload):
        """Test street extraction from nested structure."""
        mock_embed = MagicMock()
        mock_embed.embed = AsyncMock(return_value=[1.0] * 1024)
        mock_retriever = MagicMock()
        mock_retriever.search = AsyncMock(
            return_value=[{"score": 0.9, "payload": nested_payload}]
        )
        mock_retriever.get_profile_chunk = AsyncMock(return_value=nested_payload)
        mock_gen = MagicMock()
        mock_gen.generate_answer = AsyncMock(return_value="Test answer")

        with patch("src.services.embedder.embedder", mock_embed):
            with patch("src.services.retriever.retriever", mock_retriever):
                with patch("src.services.generator.generator", mock_gen):
                    response = await mock_client.post(
                        "/fill-form",
                        json={
                            "label": "Street",
                            "signals": {"autocomplete": "street-address"},
                        },
                    )
                    assert response.status_code == 200
                    data = response.json()
                    assert data["field_type"] == "street"
                    assert data["field_value"] == "456 Nested St"


class TestFillFormErrorHandling:
    """Test error handling for missing fields and edge cases."""

    @pytest.mark.asyncio
    async def test_unknown_field(self, mock_client):
        """Test unknown field returns graceful response."""
        mock_embed = MagicMock()
        mock_embed.embed = AsyncMock(return_value=[1.0] * 1024)
        mock_retriever = MagicMock()
        mock_retriever.search = AsyncMock(return_value=[])
        mock_retriever.get_profile_chunk = AsyncMock(return_value=None)
        mock_gen = MagicMock()
        mock_gen.generate_answer = AsyncMock(return_value="No info")

        with patch("src.services.embedder.embedder", mock_embed):
            with patch("src.services.retriever.retriever", mock_retriever):
                with patch("src.services.generator.generator", mock_gen):
                    response = await mock_client.post(
                        "/fill-form",
                        json={"label": "Unknown Field"},
                    )
                    assert response.status_code == 200
                    data = response.json()
                    assert data["has_data"] is False
                    assert "answer" in data

    @pytest.mark.asyncio
    async def test_empty_signals(self, mock_client):
        """Test empty signals still works."""
        mock_embed = MagicMock()
        mock_embed.embed = AsyncMock(return_value=[1.0] * 1024)
        mock_retriever = MagicMock()
        mock_retriever.search = AsyncMock(return_value=[])
        mock_retriever.get_profile_chunk = AsyncMock(return_value=None)
        mock_gen = MagicMock()
        mock_gen.generate_answer = AsyncMock(return_value="No info")

        with patch("src.services.embedder.embedder", mock_embed):
            with patch("src.services.retriever.retriever", mock_retriever):
                with patch("src.services.generator.generator", mock_gen):
                    response = await mock_client.post(
                        "/fill-form",
                        json={"label": "First Name", "signals": {}},
                    )
                    assert response.status_code == 200
                    data = response.json()
                    assert "answer" in data
