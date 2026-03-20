"""End-to-end tests for /fill-form endpoint with Qdrant integration.

These tests verify the complete flow from form field request to answer generation,
using the actual Qdrant instance and Mistral API.
"""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from src.main import app


@pytest_asyncio.fixture
async def client():
    """Create async test client for end-to-end testing."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


class TestFillFormEndToEnd:
    """End-to-end tests for the six core form fields."""

    @pytest.mark.asyncio
    async def test_fill_form_firstname_e2e(self, client):
        """Test firstname extraction end-to-end."""
        payload = {
            "label": "First Name",
            "signals": {"autocomplete": "given-name", "html_type": "text"},
        }
        response = await client.post("/fill-form", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["has_data"] is True
        assert data["field_type"] == "first_name"
        assert data["field_value"] is not None
        assert len(data["field_value"]) > 0

    @pytest.mark.asyncio
    async def test_fill_form_lastname_e2e(self, client):
        """Test lastname extraction end-to-end."""
        payload = {
            "label": "Last Name",
            "signals": {"autocomplete": "family-name", "html_type": "text"},
        }
        response = await client.post("/fill-form", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["has_data"] is True
        assert data["field_type"] == "last_name"
        assert data["field_value"] is not None

    @pytest.mark.asyncio
    async def test_fill_form_email_e2e(self, client):
        """Test email extraction end-to-end."""
        payload = {
            "label": "Email Address",
            "signals": {"autocomplete": "email", "html_type": "email"},
        }
        response = await client.post("/fill-form", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["has_data"] is True
        assert data["field_type"] == "email"
        assert data["field_value"] is not None
        assert "@" in data["field_value"]

    @pytest.mark.asyncio
    async def test_fill_form_city_e2e(self, client):
        """Test city extraction end-to-end."""
        payload = {
            "label": "City",
            "signals": {"autocomplete": "address-level2", "html_type": "text"},
        }
        response = await client.post("/fill-form", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["has_data"] is True
        assert data["field_type"] == "city"
        assert data["field_value"] is not None

    @pytest.mark.asyncio
    async def test_fill_form_postcode_e2e(self, client):
        """Test postcode extraction end-to-end."""
        payload = {
            "label": "Postcode",
            "signals": {"autocomplete": "postal-code", "html_type": "text"},
        }
        response = await client.post("/fill-form", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["has_data"] is True
        assert data["field_type"] in ("zip", "postcode")
        assert data["field_value"] is not None

    @pytest.mark.asyncio
    async def test_fill_form_street_e2e(self, client):
        """Test street extraction end-to-end."""
        payload = {
            "label": "Street Address",
            "signals": {"autocomplete": "street-address", "html_type": "text"},
        }
        response = await client.post("/fill-form", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["has_data"] is True
        assert data["field_type"] == "street"
        assert data["field_value"] is not None


class TestFillFormResponseStructure:
    """Test response structure for all six fields."""

    @pytest.mark.asyncio
    async def test_response_has_all_required_fields(self, client):
        """Verify response contains all required fields."""
        payload = {"label": "First Name", "signals": {"autocomplete": "given-name"}}
        response = await client.post("/fill-form", json=payload)

        assert response.status_code == 200
        data = response.json()

        # Required fields
        assert "answer" in data
        assert "has_data" in data
        assert "confidence" in data
        assert "context_chunks" in data

        # Optional fields (present when field_type is detected)
        assert "field_value" in data
        assert "field_type" in data

    @pytest.mark.asyncio
    async def test_confidence_levels_are_valid(self, client):
        """Verify confidence is one of the valid levels."""
        valid_levels = {"high", "medium", "low", "none"}

        for label in ["First Name", "Email", "City"]:
            payload = {"label": label}
            response = await client.post("/fill-form", json=payload)

            assert response.status_code == 200
            data = response.json()
            assert data["confidence"] in valid_levels

    @pytest.mark.asyncio
    async def test_context_chunks_in_bounds(self, client):
        """Verify context_chunks is between 0 and 5."""
        payload = {"label": "First Name", "signals": {"autocomplete": "given-name"}}
        response = await client.post("/fill-form", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert 0 <= data["context_chunks"] <= 5


class TestFillFormLatency:
    """Test latency requirements for the /fill-form endpoint."""

    @pytest.mark.asyncio
    async def test_firstname_latency_under_threshold(self, client):
        """Verify firstname extraction completes within acceptable time."""
        import time

        payload = {"label": "First Name", "signals": {"autocomplete": "given-name"}}

        start = time.time()
        response = await client.post("/fill-form", json=payload)
        elapsed_ms = (time.time() - start) * 1000

        assert response.status_code == 200
        # Threshold: 5000ms (5 seconds) for E2E with external API calls
        assert elapsed_ms < 5000, (
            f"Response took {elapsed_ms:.0f}ms (threshold: 5000ms)"
        )

    @pytest.mark.asyncio
    async def test_email_latency_under_threshold(self, client):
        """Verify email extraction completes within acceptable time."""
        import time

        payload = {"label": "Email", "signals": {"autocomplete": "email"}}

        start = time.time()
        response = await client.post("/fill-form", json=payload)
        elapsed_ms = (time.time() - start) * 1000

        assert response.status_code == 200
        assert elapsed_ms < 5000, (
            f"Response took {elapsed_ms:.0f}ms (threshold: 5000ms)"
        )


class TestFillFormNegativeCases:
    """Test negative and edge cases."""

    @pytest.mark.asyncio
    async def test_unknown_field_returns_answer(self, client):
        """Verify unknown field still returns an answer via RAG."""
        payload = {"label": "Favorite Programming Language"}
        response = await client.post("/fill-form", json=payload)

        assert response.status_code == 200
        data = response.json()
        # May or may not have data, but should not error
        assert "answer" in data
        assert "has_data" in data

    @pytest.mark.asyncio
    async def test_empty_signals_still_works(self, client):
        """Verify empty signals dict is handled gracefully."""
        payload = {"label": "First Name", "signals": {}}
        response = await client.post("/fill-form", json=payload)

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_no_signals_still_works(self, client):
        """Verify missing signals is handled gracefully."""
        payload = {"label": "First Name"}
        response = await client.post("/fill-form", json=payload)

        assert response.status_code == 200
