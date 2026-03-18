"""Configuration validation service.

Provides validation checks for:
- Internal DNS resolution (Qdrant)
- External endpoint accessibility
- URL format validation
- Embedding dimension verification
"""

import asyncio
import time
from datetime import datetime, timezone

import httpx

from src.api.schemas import (
    CheckName,
    CheckResult,
    CheckStatus,
    ReportStatus,
    ValidationReport,
)

CHECK_TIMEOUT_SECONDS = 10.0


async def run_check(
    check_func: callable,
    name: CheckName,
    timeout: float = CHECK_TIMEOUT_SECONDS,
) -> CheckResult:
    """Run a validation check with timeout handling.

    Args:
        check_func: Async function that performs the check.
        name: Name of the check for the result.
        timeout: Maximum time in seconds for the check.

    Returns:
        CheckResult with status, message, and duration.
    """
    start_time = time.monotonic()
    try:
        result = await asyncio.wait_for(check_func(), timeout=timeout)
        return result
    except asyncio.TimeoutError:
        duration_ms = int((time.monotonic() - start_time) * 1000)
        return CheckResult(
            name=name,
            status=CheckStatus.TIMEOUT,
            message=f"Check timed out after {timeout} seconds",
            duration_ms=duration_ms,
            details={"timeout_seconds": timeout},
        )
    except Exception as e:
        duration_ms = int((time.monotonic() - start_time) * 1000)
        return CheckResult(
            name=name,
            status=CheckStatus.FAILED,
            message=f"Unexpected error: {str(e)}",
            duration_ms=duration_ms,
            details={"error_type": type(e).__name__},
        )


def aggregate_results(
    checks: list[CheckResult], total_duration_ms: int
) -> ValidationReport:
    """Build ValidationReport from list of CheckResults.

    Args:
        checks: List of individual check results.
        total_duration_ms: Total execution time in milliseconds.

    Returns:
        ValidationReport with overall status.
    """
    all_passed = all(c.status == CheckStatus.PASSED for c in checks)
    status = ReportStatus.HEALTHY if all_passed else ReportStatus.UNHEALTHY

    return ValidationReport(
        status=status,
        timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3]
        + "Z",
        total_duration_ms=total_duration_ms,
        checks=checks,
    )


async def _check_internal_dns_impl() -> CheckResult:
    """Check if backend can reach Qdrant via Docker internal DNS."""
    from src.config import settings

    hostname = settings.QDRANT_URL.split("//")[1].split(":")[0]
    port = int(settings.QDRANT_URL.split(":")[2].split("/")[0])
    url = f"http://{hostname}:{port}/"

    start_time = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=CHECK_TIMEOUT_SECONDS) as client:
            response = await client.get(url)
            duration_ms = int((time.monotonic() - start_time) * 1000)

            if response.status_code == 200:
                return CheckResult(
                    name=CheckName.INTERNAL_DNS,
                    status=CheckStatus.PASSED,
                    message=f"Successfully connected to {hostname}:{port}",
                    duration_ms=duration_ms,
                    details=None,
                )
            else:
                return CheckResult(
                    name=CheckName.INTERNAL_DNS,
                    status=CheckStatus.FAILED,
                    message=f"HTTP error {response.status_code} from {hostname}:{port}",
                    duration_ms=duration_ms,
                    details={
                        "hostname": hostname,
                        "port": port,
                        "error_type": "http_error",
                        "http_status": response.status_code,
                    },
                )
    except httpx.ConnectError as e:
        duration_ms = int((time.monotonic() - start_time) * 1000)
        error_type = "connection_refused"
        if "dns" in str(e).lower() or "name" in str(e).lower():
            error_type = "dns_failure"
        return CheckResult(
            name=CheckName.INTERNAL_DNS,
            status=CheckStatus.FAILED,
            message=f"Failed to connect to {hostname}:{port}: {error_type}",
            duration_ms=duration_ms,
            details={
                "hostname": hostname,
                "port": port,
                "error_type": error_type,
            },
        )
    except Exception as e:
        duration_ms = int((time.monotonic() - start_time) * 1000)
        return CheckResult(
            name=CheckName.INTERNAL_DNS,
            status=CheckStatus.FAILED,
            message=f"Failed to connect to {hostname}:{port}: {str(e)}",
            duration_ms=duration_ms,
            details={
                "hostname": hostname,
                "port": port,
                "error_type": type(e).__name__,
            },
        )


async def _check_external_endpoint_impl() -> CheckResult:
    """Check if external clients can reach backend via localhost."""
    url = "http://localhost:8000/health"

    start_time = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=CHECK_TIMEOUT_SECONDS) as client:
            response = await client.get(url)
            duration_ms = int((time.monotonic() - start_time) * 1000)

            if response.status_code == 200:
                return CheckResult(
                    name=CheckName.EXTERNAL_ENDPOINT,
                    status=CheckStatus.PASSED,
                    message="localhost:8000/health is reachable",
                    duration_ms=duration_ms,
                    details=None,
                )
            else:
                return CheckResult(
                    name=CheckName.EXTERNAL_ENDPOINT,
                    status=CheckStatus.FAILED,
                    message=f"HTTP error {response.status_code} from localhost:8000/health",
                    duration_ms=duration_ms,
                    details={
                        "url": url,
                        "error_type": "http_error",
                        "http_status": response.status_code,
                    },
                )
    except httpx.ConnectError:
        duration_ms = int((time.monotonic() - start_time) * 1000)
        return CheckResult(
            name=CheckName.EXTERNAL_ENDPOINT,
            status=CheckStatus.FAILED,
            message="Cannot connect to localhost:8000/health",
            duration_ms=duration_ms,
            details={
                "url": url,
                "error_type": "connection_refused",
                "http_status": None,
            },
        )
    except Exception as e:
        duration_ms = int((time.monotonic() - start_time) * 1000)
        return CheckResult(
            name=CheckName.EXTERNAL_ENDPOINT,
            status=CheckStatus.FAILED,
            message=f"Failed to reach localhost:8000/health: {str(e)}",
            duration_ms=duration_ms,
            details={
                "url": url,
                "error_type": type(e).__name__,
                "http_status": None,
            },
        )


async def _check_url_format_impl() -> CheckResult:
    """Check if inference API base URL has correct format (no path duplication)."""
    import os

    start_time = time.monotonic()
    base_url = os.environ.get("ZAI_BASE_URL", "")

    if not base_url:
        duration_ms = int((time.monotonic() - start_time) * 1000)
        return CheckResult(
            name=CheckName.URL_FORMAT,
            status=CheckStatus.FAILED,
            message="ZAI_BASE_URL environment variable is not set",
            duration_ms=duration_ms,
            details={"base_url": "", "issue": "Environment variable not set"},
        )

    normalized_url = base_url.rstrip("/")

    # Check for duplicated path segments (e.g., /v1/v1)
    parts = normalized_url.split("/")
    issue = None
    recommendation = None

    for i in range(len(parts) - 1):
        if parts[i] == parts[i + 1] and parts[i]:
            issue = f"Duplicated path segment: /{parts[i]}/{parts[i + 1]}"
            recommendation = f"Remove the duplicated /{parts[i]} from the URL"
            break

    # Also check for trailing /v1 which may cause issues when client appends /v1
    if not issue and normalized_url.endswith("/v1"):
        issue = "Trailing /v1 may cause duplication with /v1 path"
        recommendation = f"Use {normalized_url[:-3]} instead"

    duration_ms = int((time.monotonic() - start_time) * 1000)

    if issue:
        return CheckResult(
            name=CheckName.URL_FORMAT,
            status=CheckStatus.FAILED,
            message=f"URL format issue: {issue}",
            duration_ms=duration_ms,
            details={
                "base_url": base_url,
                "normalized_url": normalized_url,
                "issue": issue,
                "recommendation": recommendation,
            },
        )

    return CheckResult(
        name=CheckName.URL_FORMAT,
        status=CheckStatus.PASSED,
        message="Base URL format is correct",
        duration_ms=duration_ms,
        details={"normalized_url": normalized_url},
    )


async def _check_embedding_dimensions_impl(internal_dns_passed: bool) -> CheckResult:
    """Check if embeddings are correct dimension using Mistral API."""
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
        mistral_api_key = os.environ.get("MISTRAL_API_KEY", "")
        mistral_base_url = os.environ.get(
            "MISTRAL_BASE_URL", "https://api.mistral.ai/v1"
        )
        # mistral-embed uses 1024 dimensions
        expected_dimensions = int(os.environ.get("EMBEDDING_DIMENSION", "1024"))

        if not mistral_api_key:
            duration_ms = int((time.monotonic() - start_time) * 1000)
            return CheckResult(
                name=CheckName.EMBEDDING_DIMENSIONS,
                status=CheckStatus.FAILED,
                message="MISTRAL_API_KEY environment variable is not set",
                duration_ms=duration_ms,
                details={
                    "error_type": "ConfigurationError",
                    "error_message": "MISTRAL_API_KEY not configured",
                },
            )

        client = AsyncOpenAI(
            api_key=mistral_api_key,
            base_url=mistral_base_url,
        )

        response = await client.embeddings.create(
            model="mistral-embed",
            input="test",
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
                    "base_url": mistral_base_url,
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


async def run_all_checks() -> ValidationReport:
    """Run all validation checks and return aggregated report.

    Execution order:
    1. internal_dns - runs first, no dependencies
    2. external_endpoint - parallel with url_format
    3. url_format - parallel with external_endpoint
    4. embedding_dimensions - depends on internal_dns success

    Returns:
        ValidationReport with all check results.
    """
    start_time = time.monotonic()
    checks: list[CheckResult] = []

    internal_dns_result = await run_check(
        _check_internal_dns_impl, CheckName.INTERNAL_DNS
    )
    checks.append(internal_dns_result)
    internal_dns_passed = internal_dns_result.status == CheckStatus.PASSED

    external_task = run_check(
        _check_external_endpoint_impl, CheckName.EXTERNAL_ENDPOINT
    )
    url_format_task = run_check(_check_url_format_impl, CheckName.URL_FORMAT)

    external_result, url_format_result = await asyncio.gather(
        external_task, url_format_task
    )
    checks.extend([external_result, url_format_result])

    async def embedding_check():
        return await _check_embedding_dimensions_impl(internal_dns_passed)

    embedding_result = await run_check(embedding_check, CheckName.EMBEDDING_DIMENSIONS)
    checks.append(embedding_result)

    total_duration_ms = int((time.monotonic() - start_time) * 1000)
    return aggregate_results(checks, total_duration_ms)
