import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch
from httpx import ASGITransport, AsyncClient

from src.main import app
from src.api.schemas import JobOfferWithProcess, ProcessUpdateRequest


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest_asyncio.fixture
async def mock_service():
    mock = AsyncMock()
    mock.update_job_offer_process = AsyncMock(
        return_value={
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
    )
    return mock


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
    async def test_update_returns_200_with_data(self, client, mock_service):
        with patch("src.services.job_offers.job_offers_service", mock_service):
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
    async def test_create_new_process_returns_200(self, client, mock_service):
        mock_service.update_job_offer_process = AsyncMock(
            return_value={
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
        )
        with patch("src.services.job_offers.job_offers_service", mock_service):
            response = await client.patch(
                "/job-offers/1/process",
                json={"applied": True},
            )
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_not_found_returns_404(self, client, mock_service):
        mock_service.update_job_offer_process = AsyncMock(return_value=None)
        with patch("src.services.job_offers.job_offers_service", mock_service):
            response = await client.patch(
                "/job-offers/99999/process",
                json={"applied": True},
            )
            assert response.status_code == 404
            assert response.json()["detail"] == "Job offer not found"

    @pytest.mark.asyncio
    async def test_partial_update_preserves_fields(self, client, mock_service):
        mock_service.update_job_offer_process = AsyncMock(
            return_value={
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
        )
        with patch("src.services.job_offers.job_offers_service", mock_service):
            response = await client.patch(
                "/job-offers/1/process",
                json={"research_email": True},
            )
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_empty_payload_returns_200(self, client, mock_service):
        mock_service.update_job_offer_process = AsyncMock(
            return_value={
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
        )
        with patch("src.services.job_offers.job_offers_service", mock_service):
            response = await client.patch(
                "/job-offers/1/process",
                json={},
            )
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_response_includes_complete_job_offer(self, client, mock_service):
        with patch("src.services.job_offers.job_offers_service", mock_service):
            response = await client.patch(
                "/job-offers/1/process",
                json={"research": True},
            )
            assert response.status_code == 200
            data = response.json()
            assert "id" in data
            assert "title" in data
            assert "url" in data
            assert "process" in data
            assert "job_offers_id" in data["process"]
            assert "research" in data["process"]
            assert "research_email" in data["process"]
            assert "applied" in data["process"]


class TestSchemaValidation:
    @pytest.mark.asyncio
    async def test_process_update_request_partial(self):
        req = ProcessUpdateRequest(research=True)
        assert req.research is True
        assert req.research_email is None
        assert req.applied is None

    @pytest.mark.asyncio
    async def test_process_update_request_full(self):
        req = ProcessUpdateRequest(
            research=True,
            research_email=False,
            applied=True,
        )
        assert req.research is True
        assert req.research_email is False
        assert req.applied is True

    @pytest.mark.asyncio
    async def test_process_update_request_empty(self):
        req = ProcessUpdateRequest()
        assert req.research is None
        assert req.research_email is None
        assert req.applied is None

    @pytest.mark.asyncio
    async def test_job_offer_with_process_schema(self):
        data = {
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
        job_offer = JobOfferWithProcess(**data)
        assert job_offer.id == 1
        assert job_offer.title == "Software Engineer"
        assert job_offer.process.research is True

    @pytest.mark.asyncio
    async def test_job_offer_without_process(self):
        data = {
            "id": 1,
            "title": "Software Engineer",
            "url": "https://example.com/job/1",
            "process": None,
        }
        job_offer = JobOfferWithProcess(**data)
        assert job_offer.id == 1
        assert job_offer.process is None
