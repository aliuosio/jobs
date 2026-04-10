import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import ASGITransport, AsyncClient

from src.main import app


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


class TestLetterStatusEndpoint:
    @pytest.mark.asyncio
    async def test_letter_status_returns_true_when_letter_exists(self, client):
        mock_service = AsyncMock()
        mock_service.check_letter_generated = AsyncMock(return_value=True)
        with patch("src.services.job_offers.job_offers_service", mock_service):
            response = await client.get("/job-offers/1/letter-status")
            assert response.status_code == 200
            data = response.json()
            assert data["letter_generated"] is True

    @pytest.mark.asyncio
    async def test_letter_status_returns_false_when_no_letter(self, client):
        mock_service = AsyncMock()
        mock_service.check_letter_generated = AsyncMock(return_value=False)
        with patch("src.services.job_offers.job_offers_service", mock_service):
            response = await client.get("/job-offers/1/letter-status")
            assert response.status_code == 200
            data = response.json()
            assert data["letter_generated"] is False

    @pytest.mark.asyncio
    async def test_letter_status_invalid_id_zero(self, client):
        response = await client.get("/job-offers/0/letter-status")
        assert response.status_code == 400
        assert "positive integer" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_letter_status_invalid_id_negative(self, client):
        response = await client.get("/job-offers/-1/letter-status")
        assert response.status_code in [400, 422]

    @pytest.mark.asyncio
    async def test_letter_status_database_error_returns_503(self, client):
        from asyncpg import PostgresError

        mock_service = AsyncMock()
        mock_service.check_letter_generated = AsyncMock(
            side_effect=PostgresError("Database connection failed")
        )
        with patch("src.services.job_offers.job_offers_service", mock_service):
            response = await client.get("/job-offers/1/letter-status")
            assert response.status_code == 503
            assert "Database temporarily unavailable" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_letter_status_unexpected_error_returns_500(self, client):
        mock_service = AsyncMock()
        mock_service.check_letter_generated = AsyncMock(
            side_effect=RuntimeError("Unexpected error")
        )
        with patch("src.services.job_offers.job_offers_service", mock_service):
            response = await client.get("/job-offers/1/letter-status")
            assert response.status_code == 500
            assert "Internal server error" in response.json()["detail"]
