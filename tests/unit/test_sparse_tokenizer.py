import pytest
from src.services.sparse_tokenizer import (
    tokenize,
    compute_tf,
    generate_sparse_vector,
    detect_phrase,
)


class TestSparseTokenizer:
    def test_tokenize_basic(self):
        result = tokenize("Hello world test")
        assert result == ["hello", "world", "test"]

    def test_tokenize_removes_stopwords(self):
        result = tokenize("the and a world")
        assert result == ["world"]

    def test_tokenize_removes_punctuation(self):
        result = tokenize("hello, world! test.")
        assert result == ["hello", "world", "test"]

    def test_tokenize_german_umlauts(self):
        result = tokenize("Größe über Öffnung für Köln")
        assert "größe" in result
        assert "über" in result
        assert "öffnung" in result
        assert "köln" in result

    def test_tokenize_lowercase(self):
        result = tokenize("HELLO World")
        assert result == ["hello", "world"]

    def test_compute_tf_basic(self):
        tokens = ["a", "b", "a", "c", "a"]
        tf = compute_tf(tokens)
        assert tf["a"] == 1.0
        assert tf["b"] == pytest.approx(0.333, rel=0.01)
        assert tf["c"] == pytest.approx(0.333, rel=0.01)

    def test_compute_tf_empty(self):
        tf = compute_tf([])
        assert tf == {}

    def test_generate_sparse_vector(self):
        vocab = {"hello": 0, "world": 1, "test": 2}
        indices, values = generate_sparse_vector("hello world test hello", vocab)
        assert 0 in indices
        assert 1 in indices
        assert 2 in indices
        assert values[indices.index(0)] > values[indices.index(1)]

    def test_detect_phrase_exact_match(self):
        bonus = detect_phrase("project management", "I have project management experience")
        assert bonus == 2.0

    def test_detect_phrase_partial_match(self):
        bonus = detect_phrase("project management", "project skills and management experience")
        assert bonus == 0.5

    def test_detect_phrase_no_match(self):
        bonus = detect_phrase("project management", "nothing here")
        assert bonus == 0.0

    def test_detect_phrase_single_word(self):
        bonus = detect_phrase("project", "project experience")
        assert bonus == 0.0


class TestHybridScoring:
    def test_combined_score_calculation(self):
        vector_weight = 0.7
        bm25_weight = 0.3
        vector_score = 0.8
        bm25_score = 0.5
        combined = vector_weight * vector_score + bm25_weight * bm25_score
        assert combined == pytest.approx(0.71, rel=0.01)

    def test_phrase_bonus_integration(self):
        vector_weight = 0.7
        bm25_weight = 0.25
        phrase_weight = 0.05
        vector_score = 0.8
        bm25_score = 0.5
        phrase_bonus = 2.0 * phrase_weight
        combined = vector_weight * vector_score + bm25_weight * bm25_score + phrase_bonus
        assert combined == pytest.approx(0.785, rel=0.01)
