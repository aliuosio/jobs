"""End-to-end tests for /api/v1/search endpoint with Qdrant integration.

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
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


class TestFillFormEndToEnd:
    """End-to-end tests for the six core form fields."""

    @pytest.mark.asyncio
    async def test_fill_form_firstname_e2e(self, client):
        """Test firstname extraction end-to-end."""
        payload = {
            "query": "First Name",
            "signals": {"autocomplete": "given-name", "html_type": "text"},
            "generate": True,
        }
        response = await client.post("/api/v1/search", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert len(data.get("results", [])) > 0
        assert data["field_type"] == "first_name"
        assert data["field_value"] is not None
        assert len(data["field_value"]) > 0

    @pytest.mark.asyncio
    async def test_fill_form_lastname_e2e(self, client):
        """Test lastname extraction end-to-end."""
        payload = {
            "query": "Last Name",
            "signals": {"autocomplete": "family-name", "html_type": "text"},
            "generate": True,
        }
        response = await client.post("/api/v1/search", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert len(data.get("results", [])) > 0
        assert data["field_type"] == "last_name"
        assert data["field_value"] is not None

    @pytest.mark.asyncio
    async def test_fill_form_email_e2e(self, client):
        """Test email extraction end-to-end."""
        payload = {
            "query": "Email Address",
            "signals": {"autocomplete": "email", "html_type": "email"},
            "generate": True,
        }
        response = await client.post("/api/v1/search", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert len(data.get("results", [])) > 0
        assert data["field_type"] == "email"
        assert data["field_value"] is not None
        assert "@" in data["field_value"]

    @pytest.mark.asyncio
    async def test_fill_form_city_e2e(self, client):
        """Test city extraction end-to-end."""
        payload = {
            "query": "City",
            "signals": {"autocomplete": "address-level2", "html_type": "text"},
            "generate": True,
        }
        response = await client.post("/api/v1/search", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert len(data.get("results", [])) > 0
        assert data["field_type"] == "city"
        assert data["field_value"] is not None

    @pytest.mark.asyncio
    async def test_fill_form_postcode_e2e(self, client):
        """Test postcode extraction end-to-end."""
        payload = {
            "query": "Postcode",
            "signals": {"autocomplete": "postal-code", "html_type": "text"},
            "generate": True,
        }
        response = await client.post("/api/v1/search", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert len(data.get("results", [])) > 0
        assert data["field_type"] in ("zip", "postcode")
        assert data["field_value"] is not None

    @pytest.mark.asyncio
    async def test_fill_form_street_e2e(self, client):
        """Test street extraction end-to-end."""
        payload = {
            "query": "Street Address",
            "signals": {"autocomplete": "street-address", "html_type": "text"},
            "generate": True,
        }
        response = await client.post("/api/v1/search", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert len(data.get("results", [])) > 0
        assert data["field_type"] == "street"
        assert data["field_value"] is not None


class TestFillFormResponseStructure:
    """Test response structure for all six fields."""

    @pytest.mark.asyncio
    async def test_response_has_all_required_fields(self, client):
        """Verify response contains all required fields."""
        payload = {
            "query": "First Name",
            "signals": {"autocomplete": "given-name"},
            "generate": True,
        }
        response = await client.post("/api/v1/search", json=payload)

        assert response.status_code == 200
        data = response.json()

        assert "generated_answer" in data
        assert "results" in data
        assert "confidence" in data

        assert "field_value" in data
        assert "field_type" in data

    @pytest.mark.asyncio
    async def test_confidence_levels_are_valid(self, client):
        """Verify confidence is one of the valid levels."""
        valid_levels = {"high", "medium", "low", "none"}

        for label in ["First Name", "Email", "City"]:
            payload = {"query": label, "generate": True}
            response = await client.post("/api/v1/search", json=payload)

            assert response.status_code == 200
            data = response.json()
            assert data["confidence"] in valid_levels

    @pytest.mark.asyncio
    async def test_results_count_in_bounds(self, client):
        """Verify results count is between 0 and 5."""
        payload = {
            "query": "First Name",
            "signals": {"autocomplete": "given-name"},
            "generate": True,
        }
        response = await client.post("/api/v1/search", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert len(data.get("results", [])) <= 5


class TestFillFormLatency:
    """Test latency requirements for the /api/v1/search endpoint."""

    @pytest.mark.asyncio
    async def test_firstname_latency_under_threshold(self, client):
        """Verify firstname extraction completes within acceptable time."""
        import time

        payload = {
            "query": "First Name",
            "signals": {"autocomplete": "given-name"},
            "generate": True,
        }

        start = time.time()
        response = await client.post("/api/v1/search", json=payload)
        elapsed_ms = (time.time() - start) * 1000

        assert response.status_code == 200
        assert elapsed_ms < 5000, f"Response took {elapsed_ms:.0f}ms (threshold: 5000ms)"

    @pytest.mark.asyncio
    async def test_email_latency_under_threshold(self, client):
        """Verify email extraction completes within acceptable time."""
        import time

        payload = {"query": "Email", "signals": {"autocomplete": "email"}, "generate": True}

        start = time.time()
        response = await client.post("/api/v1/search", json=payload)
        elapsed_ms = (time.time() - start) * 1000

        assert response.status_code == 200
        assert elapsed_ms < 5000, f"Response took {elapsed_ms:.0f}ms (threshold: 5000ms)"


class TestFillFormNegativeCases:
    """Test negative and edge cases."""

    @pytest.mark.asyncio
    async def test_unknown_field_returns_answer(self, client):
        """Verify unknown field still returns an answer via RAG."""
        payload = {"query": "Favorite Programming Language", "generate": True}
        response = await client.post("/api/v1/search", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert "generated_answer" in data
        assert "results" in data

    @pytest.mark.asyncio
    async def test_empty_signals_still_works(self, client):
        """Verify empty signals dict is handled gracefully."""
        payload = {"query": "First Name", "signals": {}, "generate": True}
        response = await client.post("/api/v1/search", json=payload)

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_no_signals_still_works(self, client):
        """Verify missing signals is handled gracefully."""
        payload = {"query": "First Name", "generate": True}
        response = await client.post("/api/v1/search", json=payload)

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
            "query": "Last Name",
            "signals": {"autocomplete": "family-name", "html_type": "text"},
            "generate": True,
        }
        response = await client.post("/api/v1/search", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert len(data.get("results", [])) > 0
        assert data["field_type"] == "last_name"
        assert data["field_value"] is not None

    @pytest.mark.asyncio
    async def test_fill_form_email_e2e(self, client):
        """Test email extraction end-to-end."""
        payload = {
            "query": "Email Address",
            "signals": {"autocomplete": "email", "html_type": "email"},
            "generate": True,
        }
        response = await client.post("/api/v1/search", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert len(data.get("results", [])) > 0
        assert data["field_type"] == "email"
        assert data["field_value"] is not None
        assert "@" in data["field_value"]

    @pytest.mark.asyncio
    async def test_fill_form_city_e2e(self, client):
        """Test city extraction end-to-end."""
        payload = {
            "query": "City",
            "signals": {"autocomplete": "address-level2", "html_type": "text"},
            "generate": True,
        }
        response = await client.post("/api/v1/search", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert len(data.get("results", [])) > 0
        assert data["field_type"] == "city"
        assert data["field_value"] is not None

    @pytest.mark.asyncio
    async def test_fill_form_postcode_e2e(self, client):
        """Test postcode extraction end-to-end."""
        payload = {
            "query": "Postcode",
            "signals": {"autocomplete": "postal-code", "html_type": "text"},
            "generate": True,
        }
        response = await client.post("/api/v1/search", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert len(data.get("results", [])) > 0
        assert data["field_type"] in ("zip", "postcode")
        assert data["field_value"] is not None

    @pytest.mark.asyncio
    async def test_fill_form_street_e2e(self, client):
        """Test street extraction end-to-end."""
        payload = {
            "query": "Street Address",
            "signals": {"autocomplete": "street-address", "html_type": "text"},
            "generate": True,
        }
        response = await client.post("/api/v1/search", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert len(data.get("results", [])) > 0
        assert data["field_type"] == "street"
        assert data["field_value"] is not None


class TestFillFormResponseStructure:
    """Test response structure for all six fields."""

    @pytest.mark.asyncio
    async def test_response_has_all_required_fields(self, client):
        """Verify response contains all required fields."""
        payload = {
            "query": "First Name",
            "signals": {"autocomplete": "given-name"},
            "generate": True,
        }
        response = await client.post("/api/v1/search", json=payload)

        assert response.status_code == 200
        data = response.json()

        assert "generated_answer" in data
        assert "results" in data
        assert "confidence" in data

        assert "field_value" in data
        assert "field_type" in data

    @pytest.mark.asyncio
    async def test_confidence_levels_are_valid(self, client):
        """Verify confidence is one of the valid levels."""
        valid_levels = {"high", "medium", "low", "none"}

        for label in ["First Name", "Email", "City"]:
            payload = {"query": label, "generate": True}
            response = await client.post("/api/v1/search", json=payload)

            assert response.status_code == 200
            data = response.json()
            assert data["confidence"] in valid_levels

    @pytest.mark.asyncio
    async def test_results_count_in_bounds(self, client):
        """Verify results count is between 0 and 5."""
        payload = {
            "query": "First Name",
            "signals": {"autocomplete": "given-name"},
            "generate": True,
        }
        response = await client.post("/api/v1/search", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert len(data.get("results", [])) <= 5


class TestFillFormLatency:
    """Test latency requirements for the /api/v1/search endpoint."""

    @pytest.mark.asyncio
    async def test_firstname_latency_under_threshold(self, client):
        """Verify firstname extraction completes within acceptable time."""
        import time

        payload = {
            "query": "First Name",
            "signals": {"autocomplete": "given-name"},
            "generate": True,
        }

        start = time.time()
        response = await client.post("/api/v1/search", json=payload)
        elapsed_ms = (time.time() - start) * 1000

        assert response.status_code == 200
        assert elapsed_ms < 5000, f"Response took {elapsed_ms:.0f}ms (threshold: 5000ms)"

    @pytest.mark.asyncio
    async def test_email_latency_under_threshold(self, client):
        """Verify email extraction completes within acceptable time."""
        import time

        payload = {"query": "Email", "signals": {"autocomplete": "email"}, "generate": True}

        start = time.time()
        response = await client.post("/api/v1/search", json=payload)
        elapsed_ms = (time.time() - start) * 1000

        assert response.status_code == 200
        assert elapsed_ms < 5000, f"Response took {elapsed_ms:.0f}ms (threshold: 5000ms)"


class TestFillFormNegativeCases:
    """Test negative and edge cases."""

    @pytest.mark.asyncio
    async def test_unknown_field_returns_answer(self, client):
        """Verify unknown field still returns an answer via RAG."""
        payload = {"query": "Favorite Programming Language", "generate": True}
        response = await client.post("/api/v1/search", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert "generated_answer" in data
        assert "results" in data

    @pytest.mark.asyncio
    async def test_empty_signals_still_works(self, client):
        """Verify empty signals dict is handled gracefully."""
        payload = {"query": "First Name", "signals": {}, "generate": True}
        response = await client.post("/api/v1/search", json=payload)

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_no_signals_still_works(self, client):
        """Verify missing signals is handled gracefully."""
        payload = {"query": "First Name", "generate": True}
        response = await client.post("/api/v1/search", json=payload)

        assert response.status_code == 200
