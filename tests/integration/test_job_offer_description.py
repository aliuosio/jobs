import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import ASGITransport, AsyncClient

from src.main import app
from src.api.schemas import JobOfferUpdateRequest, JobOfferWithProcess


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


class TestJobOfferDescriptionField:
    @pytest.mark.asyncio
    async def test_job_offer_update_request_schema_with_description(self):
        req = JobOfferUpdateRequest(description="Test job description")
        assert req.description == "Test job description"

    @pytest.mark.asyncio
    async def test_job_offer_update_request_schema_without_description(self):
        req = JobOfferUpdateRequest()
        assert req.description is None

    @pytest.mark.asyncio
    async def test_job_offer_with_process_schema_includes_description(self):
        data = {
            "id": 1,
            "title": "Software Engineer",
            "url": "https://example.com/job/1",
            "description": "Job description text",
            "process": None,
        }
        job_offer = JobOfferWithProcess(**data)
        assert job_offer.id == 1
        assert job_offer.description == "Job description text"


class TestUpdateJobOfferDescription:
    @pytest.mark.asyncio
    async def test_update_description_success(self, client):
        mock_service = AsyncMock()
        mock_service.update_job_offer_description = AsyncMock(
            return_value={
                "id": 1,
                "title": "Software Engineer",
                "url": "https://example.com/job/1",
                "description": "Updated description",
                "process": None,
            }
        )
        with patch("src.services.job_offers.job_offers_service", mock_service):
            response = await client.patch(
                "/job-offers/1",
                json={"description": "Updated description"},
            )
            assert response.status_code == 200
            data = response.json()
            assert data["description"] == "Updated description"

    @pytest.mark.asyncio
    async def test_update_description_not_found(self, client):
        mock_service = AsyncMock()
        mock_service.update_job_offer_description = AsyncMock(return_value=None)
        with patch("src.services.job_offers.job_offers_service", mock_service):
            response = await client.patch(
                "/job-offers/99999",
                json={"description": "Test"},
            )
            assert response.status_code == 404
            assert response.json()["detail"] == "Job offer not found"

    @pytest.mark.asyncio
    async def test_update_description_invalid_id_zero(self, client):
        response = await client.patch(
            "/job-offers/0",
            json={"description": "Test"},
        )
        assert response.status_code == 400
        assert "positive integer" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_update_description_invalid_id_negative(self, client):
        response = await client.patch(
            "/job-offers/-1",
            json={"description": "Test"},
        )
        assert response.status_code in [400, 422]

    @pytest.mark.asyncio
    async def test_update_description_partial_empty_payload(self, client):
        mock_service = AsyncMock()
        mock_service.update_job_offer_description = AsyncMock(
            return_value={
                "id": 1,
                "title": "Software Engineer",
                "url": "https://example.com/job/1",
                "description": None,
                "process": None,
            }
        )
        with patch("src.services.job_offers.job_offers_service", mock_service):
            response = await client.patch(
                "/job-offers/1",
                json={},
            )
            assert response.status_code == 200


class TestJobOffersEndpointReturnsDescription:
    @pytest.mark.asyncio
    async def test_get_job_offers_includes_description(self, client):
        mock_service = AsyncMock()
        mock_service.get_job_offers = AsyncMock(
            return_value=[
                {
                    "id": 1,
                    "title": "Engineer",
                    "url": "https://example.com/1",
                    "description": "First job desc",
                    "process": None,
                },
                {
                    "id": 2,
                    "title": "Developer",
                    "url": "https://example.com/2",
                    "description": "Second job desc",
                    "process": None,
                },
            ]
        )
        with patch("src.services.job_offers.job_offers_service", mock_service):
            response = await client.get("/job-offers")
            assert response.status_code == 200
            data = response.json()
            assert "job_offers" in data
            assert len(data["job_offers"]) == 2
            assert data["job_offers"][0]["description"] == "First job desc"
            assert data["job_offers"][1]["description"] == "Second job desc"
