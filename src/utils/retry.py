"""Retry utilities with exponential backoff.

Provides retry decorators for Qdrant and LLM operations using tenacity.
"""

from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

# Qdrant-related exceptions for retry
try:
    from qdrant_client.http.exceptions import (
        UnexpectedResponse as QdrantUnexpectedResponse,
    )
except ImportError:
    QdrantUnexpectedResponse = Exception

# OpenAI-related exceptions for retry
try:
    from openai import APIConnectionError, RateLimitError
except ImportError:
    APIConnectionError = Exception
    RateLimitError = Exception


def get_retry_qdrant(max_retries: int = 4, base_delay: float = 1.0):
    """Create retry decorator for Qdrant operations.

    Args:
        max_retries: Maximum number of retry attempts.
        base_delay: Base delay in seconds for exponential backoff.

    Returns:
        Retry decorator configured for Qdrant operations.
    """
    return retry(
        stop=stop_after_attempt(max_retries),
        wait=wait_exponential(multiplier=base_delay, min=1, max=8),
        retry=retry_if_exception_type(
            (APIConnectionError, QdrantUnexpectedResponse, ConnectionError)
        ),
        reraise=True,
    )


def get_retry_llm(max_retries: int = 4, base_delay: float = 1.0):
    """Create retry decorator for LLM operations.

    Args:
        max_retries: Maximum number of retry attempts.
        base_delay: Base delay in seconds for exponential backoff.

    Returns:
        Retry decorator configured for LLM operations.
    """
    return retry(
        stop=stop_after_attempt(max_retries),
        wait=wait_exponential(multiplier=base_delay, min=1, max=8),
        retry=retry_if_exception_type(
            (RateLimitError, APIConnectionError, ConnectionError)
        ),
        reraise=True,
    )


# Default retry decorators using settings defaults
retry_qdrant = get_retry_qdrant()
retry_llm = get_retry_llm()
