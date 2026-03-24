"""Integration tests for hybrid search functionality."""

import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from src.services.retriever import RetrieverService
from src.services.sparse_tokenizer import tokenize, compute_tf, detect_phrase
from src.config import settings


@pytest.mark.asyncio
class TestHybridSearchIntegration:
    async def test_hybrid_search_returns_combined_scores(self):
        retriever = RetrieverService()
        retriever.client = MagicMock()

        mock_point = MagicMock()
        mock_point.id = "test-id"
        mock_point.score = 0.9
        mock_point.payload = {"text": "python developer with fastapi experience"}

        mock_response = MagicMock()
        mock_response.points = [mock_point]
        retriever.client.query_points = AsyncMock(return_value=mock_response)

        results = await retriever.hybrid_search(
            query_text="python developer", dense_vector=[0.1] * 1024, k=5
        )

        assert len(results) == 1
        assert "vector_score" in results[0]
        assert "bm25_score" in results[0]
        assert results[0]["score"] > 0

    async def test_hybrid_search_short_query_uses_vector_only(self):
        retriever = RetrieverService()
        retriever.client = MagicMock()
        retriever.search = AsyncMock(return_value=[{"id": "1", "score": 0.9, "payload": {}}])

        results = await retriever.hybrid_search(query_text="ab", dense_vector=[0.1] * 1024, k=5)

        retriever.search.assert_called_once()

    async def test_hybrid_search_disabled_uses_vector(self):
        with patch.object(settings, "HYBRID_ENABLED", False):
            retriever = RetrieverService()
            retriever.client = MagicMock()
            retriever.search = AsyncMock(return_value=[{"id": "1", "score": 0.9, "payload": {}}])

            results = await retriever.hybrid_search(
                query_text="python developer", dense_vector=[0.1] * 1024, k=5
            )

            retriever.search.assert_called_once()

    async def test_hybrid_search_pure_vector_mode(self):
        with patch.object(settings, "HYBRID_VECTOR_WEIGHT", 1.0):
            retriever = RetrieverService()
            retriever.client = MagicMock()

            mock_point = MagicMock()
            mock_point.id = "test-id"
            mock_point.score = 0.9
            mock_point.payload = {"text": "python developer"}

            mock_response = MagicMock()
            mock_response.points = [mock_point]
            retriever.client.query_points = AsyncMock(return_value=mock_response)

            results = await retriever.hybrid_search(
                query_text="python developer", dense_vector=[0.1] * 1024, k=5
            )

            assert results[0]["score"] == 0.9
            assert "bm25_score" not in results[0]


class TestHybridScoring:
    def test_combined_score_with_weights(self):
        vector_weight = 0.7
        bm25_weight = 0.3
        vector_score = 0.8
        bm25_score = 0.5

        combined = vector_weight * vector_score + bm25_weight * bm25_score

        assert combined == pytest.approx(0.71, rel=0.01)

    def test_phrase_bonus_multiplier(self):
        phrase_weight = 0.1
        phrase_bonus = 2.0

        bonus = phrase_bonus * phrase_weight
        assert bonus == 0.2


class TestPhraseDetection:
    def test_exact_phrase_match_returns_2x(self):
        result = detect_phrase("project management", "5 years project management experience")
        assert result == 2.0

    def test_partial_phrase_match_returns_0_5x(self):
        result = detect_phrase("project management", "project skills and management experience")
        assert result == 0.5

    def test_no_match_returns_zero(self):
        result = detect_phrase("project management", "unrelated content")
        assert result == 0.0

    def test_single_word_returns_zero(self):
        result = detect_phrase("python", "python developer")
        assert result == 0.0
