# Global embedder instance
embedder = EmbedderService()
<replace_in_file>
<path>/home/krusty/projects/jobs/src/services/validation.py</path>
<diff>------- SEARCH
async def _check_embedding_dimensions_impl(internal_dns_passed: bool) -> CheckResult:
    """Check if embeddings are correct dimension using Z.ai API."""
    import os
    from openai import AsyncOpenAI
    
    start_time = time.monotonic()

    if not internal_dns_passed:
        duration_ms = int((time.monotonic() - start_time) * 1000)
        return CheckResult(
            name=CheckName.EMBEDDING_DIMENSIONS,
            status=CheckStatus.FAILED,
            message="Cannot verify embeddings: vector store unavailable",
            duration_ms=duration_ms,
            details={
                "skipped": True,
                "reason": "internal_dns check failed",
            },
        )

    try:
        zai_api_key = os.environ.get("ZAI_API_KEY", "")
        zai_base_url = os.environ.get("ZAI_BASE_URL", "https://api.z.ai/v1")
        expected_dimensions = int(os.environ.get("EMBEDDING_DIMENSION", "1536"))

        if not zai_api_key:
            duration_ms = int((time.monotonic() - start_time) * 1000)
            return CheckResult(
                name=CheckName.EMBEDDING_DIMENSIONS,
                status=CheckStatus.FAILED,
                message="ZAI_API_KEY environment variable is not set",
                duration_ms=duration_ms,
                details={
                    "error_type": "ConfigurationError",
                    "error_message": "ZAI_API_KEY not configured",
                },
            )

        client = AsyncOpenAI(
            api_key=zai_api_key,
            base_url=zai_base_url,
        )

        response = await client.embeddings.create(
            model="mistral-embed",
            input="test",
            dimensions=expected_dimensions,
        )
        vector = response.data[0].embedding
        actual_dimensions = len(vector)

        duration_ms = int((time.monotonic() - start_time) * 1000)

        if actual_dimensions == expected_dimensions:
            return CheckResult(
                name=CheckName.EMBEDDING_DIMENSIONS,
                status=CheckStatus.PASSED,
                message=f"Embeddings are {expected_dimensions}-dimensional",
                duration_ms=duration_ms,
                details={
                    "expected": expected_dimensions,
                    "actual": actual_dimensions,
                    "model": "mistral-embed",
                    "base_url": zai_base_url,
                },
            )
        else:
            return CheckResult(
                name=CheckName.EMBEDDING_DIMENSIONS,
                status=CheckStatus.FAILED,
                message=f"Embedding dimension mismatch: expected {expected_dimensions}, got {actual_dimensions}",
                duration_ms=duration_ms,
                details={
                    "expected": expected_dimensions,
                    "actual": actual_dimensions,
                    "model": "mistral-embed",
                },
            )
    except Exception as e:
        duration_ms = int((time.monotonic() - start_time) * 1000)
        return CheckResult(
            name=CheckName.EMBEDDING_DIMENSIONS,
            status=CheckStatus.FAILED,
            message=f"Failed to generate test embedding: {str(e)}",
            duration_ms=duration_ms,
            details={
                "error_type": type(e).__name__,
                "error_message": str(e),
            },
        )


# Global embedder instance
embedder = EmbedderService()
