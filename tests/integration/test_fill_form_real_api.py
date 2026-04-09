"""Real API integration tests for /api/v1/search endpoint.

These tests call the live FastAPI backend at http://localhost:8000/api/v1/search
using actual Qdrant and Mistral services. No mocks.

Prerequisites:
- Docker services running: docker-compose up -d
- Data seeded: docker exec jobs_api-backend python /app/scripts/ingest_profile.py

Run from host:
    pytest tests/integration/test_fill_form_real_api.py -v

Run inside Docker:
    docker exec jobs_api-backend pytest tests/integration/test_fill_form_real_api.py -v
"""

import os
import pytest
import pytest_asyncio
import httpx


# Use environment variable or default to localhost
# Inside Docker, use http://api-backend:8000
# From host, use http://localhost:8000
TEST_BASE_URL = os.getenv("TEST_BASE_URL", "http://localhost:8000")

# Expected values from PROFILE_DATA in scripts/ingest_profile.py
EXPECTED_VALUES = {
    "firstname": "Osiozekha",
    "lastname": "Aliu",
    "email": "aliu@dev-hh.de",
    "phone": "+49 177 639 40 82",
    "birthdate": "28.06.1976",
    "city": "Hamburg",
    "postcode": "22399",
    "street": "Schleusentwiete 1",
}

# Test cases for all 8 fields
FIELD_TEST_CASES = [
    {
        "field": "firstname",
        "label": "First Name",
        "signals": {"autocomplete": "given-name"},
        "expected_field_type": "first_name",
    },
    {
        "field": "lastname",
        "label": "Last Name",
        "signals": {"autocomplete": "family-name"},
        "expected_field_type": "last_name",
    },
    {
        "field": "email",
        "label": "Email",
        "signals": {"autocomplete": "email"},
        "expected_field_type": "email",
    },
    {
        "field": "phone",
        "label": "Phone",
        "signals": {"autocomplete": "tel"},
        "expected_field_type": "phone",
    },
    {
        "field": "birthdate",
        "label": "Birthdate",
        "signals": {"autocomplete": "bday"},
        "expected_field_type": "birthdate",
    },
    {
        "field": "city",
        "label": "City",
        "signals": {"autocomplete": "address-level2"},
        "expected_field_type": "city",
    },
    {
        "field": "postcode",
        "label": "Postcode",
        "signals": {"autocomplete": "postal-code"},
        "expected_field_type": "postcode",
    },
    {
        "field": "street",
        "label": "Street",
        "signals": {"autocomplete": "street-address"},
        "expected_field_type": "street",
    },
]


@pytest_asyncio.fixture
async def real_client():
    """HTTP client for real API calls."""
    async with httpx.AsyncClient(base_url=TEST_BASE_URL, timeout=30.0) as client:
        yield client


class TestFillFormRealAPI:
    """Real API tests for /api/v1/search endpoint - no mocks."""

    @pytest.mark.asyncio
    async def test_health_check(self, real_client):
        """Verify API is healthy before running tests."""
        response = await real_client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "test_case", FIELD_TEST_CASES, ids=[tc["field"] for tc in FIELD_TEST_CASES]
    )
    async def test_field_extraction(self, real_client, test_case):
        """Test extraction of all 6 fields via real API."""
        field = test_case["field"]
        label = test_case["label"]
        signals = test_case["signals"]
        expected_value = EXPECTED_VALUES[field]
        expected_type = test_case["expected_field_type"]

        response = await real_client.post(
            "/api/v1/search",
            json={"query": label, "signals": signals, "generate": True},
        )

        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"

        data = response.json()

        # Verify response structure
        assert "generated_answer" in data, "Response missing 'generated_answer' field"
        assert "results" in data, "Response missing 'results' field"
        assert "confidence" in data, "Response missing 'confidence' field"

        # Verify we got data
        assert len(data["results"]) > 0, f"API returned no results for {field}"

        # Verify field extraction
        assert data.get("field_type") == expected_type, (
            f"Expected field_type={expected_type}, got {data.get('field_type')}"
        )
        assert data.get("field_value") == expected_value, (
            f"Expected field_value={expected_value}, got {data.get('field_value')}"
        )

    @pytest.mark.asyncio
    async def test_firstname_with_various_labels(self, real_client):
        """Test firstname extraction with various label variations."""
        labels = ["First Name", "Given Name", "Vorname", "Name"]

        for label in labels:
            response = await real_client.post(
                "/api/v1/search",
                json={"query": label, "signals": {"autocomplete": "given-name"}, "generate": True},
            )
            assert response.status_code == 200
            data = response.json()
            assert "generated_answer" in data

    @pytest.mark.asyncio
    async def test_email_validation(self, real_client):
        """Test that extracted email is valid format."""
        response = await real_client.post(
            "/api/v1/search",
            json={"query": "Email", "signals": {"autocomplete": "email"}, "generate": True},
        )
        assert response.status_code == 200
        data = response.json()

        if data.get("field_value"):
            email = data["field_value"]
            assert "@" in email, f"Invalid email format: {email}"
            assert "." in email.split("@")[1], f"Invalid email domain: {email}"

    @pytest.mark.asyncio
    async def test_email_validation(self, real_client):
        """Test that extracted email is valid format."""
        response = await real_client.post(
            "/api/v1/search",
            json={"query": "Email", "signals": {"autocomplete": "email"}, "generate": True},
        )
        assert response.status_code == 200
        data = response.json()

        if data.get("field_value"):
            email = data["field_value"]
            assert "@" in email, f"Invalid email format: {email}"
            assert "." in email.split("@")[1], f"Invalid email domain: {email}"

    @pytest.mark.asyncio
    async def test_postcode_format(self, real_client):
        """Test that extracted postcode matches expected format."""
        response = await real_client.post(
            "/api/v1/search",
            json={
                "query": "Postcode",
                "signals": {"autocomplete": "postal-code"},
                "generate": True,
            },
        )
        assert response.status_code == 200
        data = response.json()

        if data.get("field_value"):
            postcode = data["field_value"]
            assert len(postcode) == 5, f"Expected 5-digit postcode, got: {postcode}"
            assert postcode.isdigit(), f"Postcode should be digits only: {postcode}"

    @pytest.mark.asyncio
    async def test_phone_format(self, real_client):
        """Test that extracted phone matches expected format."""
        response = await real_client.post(
            "/api/v1/search",
            json={"query": "Phone", "signals": {"autocomplete": "tel"}, "generate": True},
        )
        assert response.status_code == 200
        data = response.json()

        if data.get("field_value"):
            phone = data["field_value"]
            assert "+" in phone or phone.startswith("0"), f"Invalid phone format: {phone}"

    @pytest.mark.asyncio
    async def test_birthdate_format(self, real_client):
        """Test that extracted birthdate matches expected format."""
        response = await real_client.post(
            "/api/v1/search",
            json={"query": "Birthdate", "signals": {"autocomplete": "bday"}, "generate": True},
        )
        assert response.status_code == 200
        data = response.json()

        if data.get("field_value"):
            birthdate = data["field_value"]
            assert "." in birthdate or "-" in birthdate, f"Invalid birthdate format: {birthdate}"

    @pytest.mark.asyncio
    async def test_response_latency(self, real_client):
        """Test that API responds within acceptable time."""
        import time

        start = time.time()
        response = await real_client.post(
            "/api/v1/search",
            json={
                "query": "First Name",
                "signals": {"autocomplete": "given-name"},
                "generate": True,
            },
        )
        elapsed = time.time() - start

        assert response.status_code == 200
        assert elapsed < 10.0, f"API too slow: {elapsed:.2f}s"


class TestFillFormRealAPIEdgeCases:
    """Edge case tests for real API."""

    @pytest.mark.asyncio
    async def test_unknown_field_label(self, real_client):
        """Test handling of unknown field labels."""
        response = await real_client.post(
            "/api/v1/search",
            json={"query": "Favorite Color", "generate": True},
        )
        assert response.status_code == 200
        data = response.json()
        assert "generated_answer" in data

    @pytest.mark.asyncio
    async def test_empty_signals(self, real_client):
        """Test handling of empty signals."""
        response = await real_client.post(
            "/api/v1/search",
            json={"query": "First Name", "signals": {}, "generate": True},
        )
        assert response.status_code == 200
        data = response.json()
        assert "generated_answer" in data

    @pytest.mark.asyncio
    async def test_missing_query(self, real_client):
        """Test handling of missing query."""
        response = await real_client.post(
            "/api/v1/search",
            json={"signals": {"autocomplete": "given-name"}, "generate": True},
        )
        assert response.status_code in [200, 422]
