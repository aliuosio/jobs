"""Integration tests for the /api/v1/search endpoint."""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, patch

from src.main import app
from src.api.schemas import SearchRequest, SearchResponse


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
def mock_embedder():
    mock = AsyncMock()
    mock.embed = AsyncMock(return_value=[0.1] * 1024)
    return mock


@pytest_asyncio.fixture
def mock_retriever():
    mock = AsyncMock()
    mock.search_with_reranking = AsyncMock(
        return_value=[
            {
                "score": 0.85,
                "vector_score": 0.88,
                "bm25_score": 0.72,
                "rerank_score": 0.90,
                "payload": {"text": "5 years Python, Django, FastAPI experience", "t": "resume"},
            },
            {
                "score": 0.78,
                "vector_score": 0.80,
                "bm25_score": 0.65,
                "payload": {"text": "Software development skills", "t": "skills"},
            },
        ]
    )
    mock.hybrid_search = AsyncMock(
        return_value=[
            {
                "score": 0.82,
                "vector_score": 0.85,
                "bm25_score": 0.70,
                "payload": {"text": "5 years Python, Django, FastAPI experience", "t": "resume"},
            },
        ]
    )
    return mock


class TestSearchEndpoint:
    @pytest.mark.asyncio
    async def test_search_basic_query(self, client, mock_embedder, mock_retriever):
        with (
            patch("src.services.embedder.embedder", mock_embedder),
            patch("src.services.retriever.retriever", mock_retriever),
        ):
            payload = {"query": "Python experience"}
            response = await client.post("/api/v1/search", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert "results" in data
            assert "query" in data
            assert "total_retrieved" in data
            assert data["query"] == "Python experience"

    @pytest.mark.asyncio
    async def test_search_returns_results(self, client, mock_embedder, mock_retriever):
        with (
            patch("src.services.embedder.embedder", mock_embedder),
            patch("src.services.retriever.retriever", mock_retriever),
        ):
            payload = {"query": "Python experience"}
            response = await client.post("/api/v1/search", json=payload)
            data = response.json()
            assert len(data["results"]) == 2
            assert data["results"][0]["content"] == "5 years Python, Django, FastAPI experience"
            assert "score" in data["results"][0]
            assert "source" in data["results"][0]

    @pytest.mark.asyncio
    async def test_search_score_breakdown_included(self, client, mock_embedder, mock_retriever):
        with (
            patch("src.services.embedder.embedder", mock_embedder),
            patch("src.services.retriever.retriever", mock_retriever),
        ):
            payload = {"query": "Python experience", "include_scores": True}
            response = await client.post("/api/v1/search", json=payload)
            data = response.json()
            assert "scores" in data["results"][0]
            assert data["results"][0]["scores"]["vector_score"] == 0.88
            assert data["results"][0]["scores"]["bm25_score"] == 0.72

    @pytest.mark.asyncio
    async def test_search_score_breakdown_excluded(self, client, mock_embedder, mock_retriever):
        with (
            patch("src.services.embedder.embedder", mock_embedder),
            patch("src.services.retriever.retriever", mock_retriever),
        ):
            payload = {"query": "Python experience", "include_scores": False}
            response = await client.post("/api/v1/search", json=payload)
            data = response.json()
            assert data["results"][0]["scores"] is None

    @pytest.mark.asyncio
    async def test_search_with_top_k(self, client, mock_embedder, mock_retriever):
        with (
            patch("src.services.embedder.embedder", mock_embedder),
            patch("src.services.retriever.retriever", mock_retriever),
        ):
            payload = {"query": "Python experience", "top_k": 1}
            response = await client.post("/api/v1/search", json=payload)
            data = response.json()
            assert data["total_retrieved"] >= 1
            assert len(data["results"]) >= 1

    @pytest.mark.asyncio
    async def test_search_with_reranking_enabled(self, client, mock_embedder, mock_retriever):
        with (
            patch("src.services.embedder.embedder", mock_embedder),
            patch("src.services.retriever.retriever", mock_retriever),
        ):
            payload = {"query": "Python experience", "use_reranking": True}
            response = await client.post("/api/v1/search", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert "results" in data
            assert len(data["results"]) > 0

    @pytest.mark.asyncio
    async def test_search_with_reranking_disabled(self, client, mock_embedder, mock_retriever):
        with (
            patch("src.services.embedder.embedder", mock_embedder),
            patch("src.services.retriever.retriever", mock_retriever),
        ):
            payload = {"query": "Python experience", "use_reranking": False}
            response = await client.post("/api/v1/search", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert "results" in data
            assert len(data["results"]) > 0

    @pytest.mark.asyncio
    async def test_search_with_hyde_toggle(self, client, mock_embedder, mock_retriever):
        with (
            patch("src.services.embedder.embedder", mock_embedder),
            patch("src.services.retriever.retriever", mock_retriever),
        ):
            payload = {"query": "Python experience", "use_hyde": True}
            response = await client.post("/api/v1/search", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert "results" in data


class TestSearchValidation:
    @pytest.mark.asyncio
    async def test_search_empty_query_rejected(self, client):
        payload = {"query": ""}
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_search_missing_query_rejected(self, client):
        payload = {}
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_search_query_too_long_rejected(self, client):
        payload = {"query": "x" * 501}
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_search_top_k_bounds(self, client):
        payload = {"query": "test", "top_k": 25}
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_search_top_k_zero_rejected(self, client):
        payload = {"query": "test", "top_k": 0}
        response = await client.post("/api/v1/search", json=payload)
        assert response.status_code == 422


class TestSearchSchema:
    def test_search_request_schema(self):
        request = SearchRequest(query="test query")
        assert request.query == "test query"
        assert request.use_hyde is True
        assert request.use_reranking is True
        assert request.top_k == 5
        assert request.include_scores is True
        assert request.generate is False

    def test_search_request_with_all_params(self):
        request = SearchRequest(
            query="Python skills",
            use_hyde=False,
            use_reranking=False,
            top_k=10,
            include_scores=False,
            generate=True,
        )
        assert request.top_k == 10
        assert request.use_hyde is False
        assert request.generate is True

    def test_search_response_schema(self):
        from src.api.schemas import SearchResult, SearchScores

        response = SearchResponse(
            results=[
                SearchResult(
                    content="Python developer",
                    score=0.85,
                    source="resume",
                    scores=SearchScores(
                        vector_score=0.88,
                        bm25_score=0.72,
                        rerank_score=0.90,
                    ),
                )
            ],
            query="Python",
            total_retrieved=1,
        )
        assert len(response.results) == 1
        assert response.total_retrieved == 1
