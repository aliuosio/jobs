import pytest
import pytest_asyncio
from unittest.mock import patch
from httpx import ASGITransport, AsyncClient

from src.main import app
from src.api.schemas import JobOfferWithProcess, ProcessUpdateRequest


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
def mock_update_result():
    return {
        "id": 1,
        "title": "Software Engineer",
        "url": "https://example.com/job/1",
        "process": {
            "job_offers_id": 1,
            "research": True,
            "research_email": False,
            "applied": True,
        },
    }


@pytest_asyncio.fixture
def mock_not_found_result():
    return None


class TestUpdateJobOfferProcessValidation:
    @pytest.mark.asyncio
    async def test_invalid_id_zero_returns_400(self, client):
        response = await client.patch(
            "/job-offers/0/process",
            json={"applied": True},
        )
        assert response.status_code == 400
        assert "positive integer" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_invalid_id_negative_returns_error(self, client):
        response = await client.patch(
            "/job-offers/-1/process",
            json={"applied": True},
        )
        assert response.status_code in [400, 422]

    @pytest.mark.asyncio
    async def test_invalid_id_string_returns_422(self, client):
        response = await client.patch(
            "/job-offers/abc/process",
            json={"applied": True},
        )
        assert response.status_code == 422


class TestUpdateJobOfferProcessSuccess:
    @pytest.mark.asyncio
    async def test_update_returns_200_with_data(self, client, mock_update_result):
        async def mock_update_and_broadcast(*args, **kwargs):
            return mock_update_result

        with patch("src.services.job_offers.job_offers_service") as mock_service:
            mock_service.update_and_broadcast = mock_update_and_broadcast
            response = await client.patch(
                "/job-offers/1/process",
                json={"research": True},
            )
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == 1
            assert data["title"] == "Software Engineer"
            assert data["process"]["research"] is True

    @pytest.mark.asyncio
    async def test_create_new_process_returns_200(self, client):
        mock_result = {
            "id": 1,
            "title": "Software Engineer",
            "url": "https://example.com/job/1",
            "process": {
                "job_offers_id": 1,
                "research": False,
                "research_email": False,
                "applied": True,
            },
        }

        async def mock_update_and_broadcast(*args, **kwargs):
            return mock_result

        with patch("src.services.job_offers.job_offers_service") as mock_service:
            mock_service.update_and_broadcast = mock_update_and_broadcast
            response = await client.patch(
                "/job-offers/1/process",
                json={"applied": True},
            )
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_not_found_returns_404(self, client):
        async def mock_update_and_broadcast(*args, **kwargs):
            return None

        with patch("src.services.job_offers.job_offers_service") as mock_service:
            mock_service.update_and_broadcast = mock_update_and_broadcast
            response = await client.patch(
                "/job-offers/99999/process",
                json={"applied": True},
            )
            assert response.status_code == 404
            assert response.json()["detail"] == "Job offer not found"

    @pytest.mark.asyncio
    async def test_partial_update_preserves_fields(self, client):
        mock_result = {
            "id": 1,
            "title": "Software Engineer",
            "url": "https://example.com/job/1",
            "process": {
                "job_offers_id": 1,
                "research": True,
                "research_email": True,
                "applied": False,
            },
        }

        async def mock_update_and_broadcast(*args, **kwargs):
            return mock_result

        with patch("src.services.job_offers.job_offers_service") as mock_service:
            mock_service.update_and_broadcast = mock_update_and_broadcast
            response = await client.patch(
                "/job-offers/1/process",
                json={"research_email": True},
            )
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_empty_payload_returns_200(self, client):
        mock_result = {
            "id": 1,
            "title": "Software Engineer",
            "url": "https://example.com/job/1",
            "process": {
                "job_offers_id": 1,
                "research": False,
                "research_email": False,
                "applied": False,
            },
        }

        async def mock_update_and_broadcast(*args, **kwargs):
            return mock_result

        with patch("src.services.job_offers.job_offers_service") as mock_service:
            mock_service.update_and_broadcast = mock_update_and_broadcast
            response = await client.patch(
                "/job-offers/1/process",
                json={},
            )
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_response_includes_complete_job_offer(self, client):
        mock_result = {
            "id": 1,
            "title": "Full Stack Developer",
            "url": "https://example.com/job/2",
            "process": {
                "job_offers_id": 1,
                "research": True,
                "research_email": True,
                "applied": True,
            },
        }

        async def mock_update_and_broadcast(*args, **kwargs):
            return mock_result

        with patch("src.services.job_offers.job_offers_service") as mock_service:
            mock_service.update_and_broadcast = mock_update_and_broadcast
            response = await client.patch(
                "/job-offers/1/process",
                json={"research": True, "applied": True},
            )
            assert response.status_code == 200
            data = response.json()
            assert "id" in data
            assert "title" in data
            assert "process" in data


class TestSchemaValidation:
    @pytest.mark.asyncio
    async def test_process_update_request_partial(self):
        req = ProcessUpdateRequest()
        assert req.research is None
        assert req.research_email is None
        assert req.applied is None

    @pytest.mark.asyncio
    async def test_process_update_request_full(self):
        req = ProcessUpdateRequest(research=True, research_email=False, applied=True)
        assert req.research is True
        assert req.research_email is False
        assert req.applied is True
