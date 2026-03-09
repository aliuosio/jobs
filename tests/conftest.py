"""Pytest configuration and fixtures for RAG Backend tests.

Provides async test client and mock fixtures for testing.
"""

import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app


@pytest.fixture
async def client():
    """Create async test client for API testing.

    Yields:
        AsyncClient: Configured test client.
    """
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
