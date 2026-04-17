import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch
from httpx import ASGITransport, AsyncClient

from src.main import app


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


class TestDeleteJobOffer:
    @pytest.mark.asyncio
    async def test_delete_job_offer_success(self, client):
        mock_service = AsyncMock()
        mock_service.delete_job_offer = AsyncMock(return_value=True)
        with patch("src.services.job_offers.job_offers_service", mock_service):
            response = await client.delete("/job-offers/1")
            assert response.status_code == 204
            mock_service.delete_job_offer.assert_awaited_once_with(1)

    @pytest.mark.asyncio
    async def test_delete_job_offer_not_found(self, client):
        mock_service = AsyncMock()
        mock_service.delete_job_offer = AsyncMock(return_value=False)
        with patch("src.services.job_offers.job_offers_service", mock_service):
            response = await client.delete("/job-offers/99999")
            assert response.status_code == 404
            assert response.json()["detail"] == "Job offer not found"

    @pytest.mark.asyncio
    async def test_delete_job_offer_invalid_id_zero(self, client):
        response = await client.delete("/job-offers/0")
        assert response.status_code == 400
        assert "positive integer" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_delete_job_offer_invalid_id_negative(self, client):
        response = await client.delete("/job-offers/-1")
        assert response.status_code in [400, 422]

    @pytest.mark.asyncio
    async def test_delete_job_offer_method_not_allowed(self, client):
        response = await client.get("/job-offers/1")
        assert response.status_code == 405

    @pytest.mark.asyncio
    async def test_delete_job_offer_with_existing_process(self, client):
        mock_service = AsyncMock()
        mock_service.delete_job_offer = AsyncMock(return_value=True)
        with patch("src.services.job_offers.job_offers_service", mock_service):
            response = await client.delete("/job-offers/5")
            assert response.status_code == 204
            mock_service.delete_job_offer.assert_awaited_once_with(5)