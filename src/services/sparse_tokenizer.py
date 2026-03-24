import re
from typing import List


ENGLISH_STOPWORDS = frozenset(
    {
        "a",
        "an",
        "and",
        "are",
        "as",
        "at",
        "be",
        "by",
        "for",
        "from",
        "has",
        "he",
        "in",
        "is",
        "it",
        "its",
        "of",
        "on",
        "that",
        "the",
        "to",
        "was",
        "were",
        "will",
        "with",
    }
)


def tokenize(text: str) -> List[str]:
    text = text.lower()
    text = re.sub(r"[^\w\säöüßÄÖÜ]", " ", text)
    tokens = text.split()
    return [t for t in tokens if t and t not in ENGLISH_STOPWORDS]


def compute_tf(tokens: List[str]) -> dict[str, float]:
    if not tokens:
        return {}
    tf: dict[str, int] = {}
    for token in tokens:
        tf[token] = tf.get(token, 0) + 1
    max_tf = max(tf.values()) if tf else 1
    return {term: count / max_tf for term, count in tf.items()}


def generate_sparse_vector(text: str, vocabulary: dict[str, int]) -> tuple[List[int], List[float]]:
    tokens = tokenize(text)
    tf = compute_tf(tokens)
    indices: List[int] = []
    values: List[float] = []
    for term, tf_score in tf.items():
        if term in vocabulary:
            indices.append(vocabulary[term])
            idf = 1.0
            values.append(tf_score * idf)
    return indices, values


def detect_phrase(query: str, document: str) -> float:
    query_tokens = tokenize(query)
    doc_tokens = tokenize(document)
    if len(query_tokens) < 2 or not doc_tokens:
        return 0.0
    query_phrase = " ".join(query_tokens)
    doc_text = " ".join(doc_tokens)
    if query_phrase in doc_text:
        return 2.0
    partial_matches = sum(1 for q in query_tokens if q in doc_tokens)
    if partial_matches >= 2:
        return 0.5
    return 0.0
