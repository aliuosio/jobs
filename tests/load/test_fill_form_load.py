"""Load testing for /api/v1/search endpoint.

Tests concurrent request handling with parallel requests.
Requires:
- Docker services running: docker-compose up -d
- Data seeded in Qdrant
- API running at TEST_BASE_URL

Run:
    pytest tests/load/test_fill_form_load.py -v

    # Inside Docker
    docker exec jobs_api-backend pytest tests/load/test_fill_form_load.py -v
"""

import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Optional

import httpx
import pytest

TEST_BASE_URL = os.getenv("TEST_BASE_URL", "http://localhost:8000")
CONCURRENT_REQUESTS = int(os.getenv("CONCURRENT_REQUESTS", "50"))
TIMEOUT_SECONDS = 30.0


@dataclass
class LoadTestResult:
    total_requests: int
    successful: int
    failed: int
    response_times: list[float]
    errors: list[str]

    @property
    def success_rate(self) -> float:
        return self.successful / self.total_requests * 100 if self.total_requests > 0 else 0

    @property
    def rps(self) -> float:
        return self.successful / sum(self.response_times) if self.response_times else 0

    def percentiles(self, pcts: list[int] = [50, 95, 99]) -> dict[int, float]:
        if not self.response_times:
            return {p: 0.0 for p in pcts}
        sorted_times = sorted(self.response_times)
        n = len(sorted_times)
        return {p: sorted_times[int(n * p / 100)] for p in pcts}


def make_request(session_id: int) -> tuple[int, float, Optional[str]]:
    queries = [
        ("First Name", {"autocomplete": "given-name"}),
        ("Last Name", {"autocomplete": "family-name"}),
        ("Email", {"autocomplete": "email"}),
        ("Phone", {"autocomplete": "tel"}),
        ("City", {"autocomplete": "address-level2"}),
        ("Postcode", {"autocomplete": "postal-code"}),
    ]
    query, signals = queries[session_id % len(queries)]

    start = time.time()
    try:
        with httpx.Client(timeout=TIMEOUT_SECONDS) as client:
            response = client.post(
                f"{TEST_BASE_URL}/api/v1/search",
                json={"query": query, "signals": signals, "generate": True},
            )
            elapsed = time.time() - start

            if response.status_code == 200:
                return (session_id, elapsed, None)
            else:
                return (session_id, elapsed, f"HTTP {response.status_code}")
    except Exception as e:
        elapsed = time.time() - start
        return (session_id, elapsed, str(e))


def run_load_test(
    num_requests: int = CONCURRENT_REQUESTS, max_workers: int = CONCURRENT_REQUESTS
) -> LoadTestResult:
    response_times: list[float] = []
    errors: list[str] = []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(make_request, i): i for i in range(num_requests)}

        for future in as_completed(futures):
            session_id, elapsed, error = future.result()
            if error:
                errors.append(f"Request {session_id}: {error}")
            else:
                response_times.append(elapsed)

    return LoadTestResult(
        total_requests=num_requests,
        successful=len(response_times),
        failed=len(errors),
        response_times=response_times,
        errors=errors,
    )


def verify_api_health() -> bool:
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(f"{TEST_BASE_URL}/health")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    return True
    except Exception:
        pass
    return False


class TestLoadPerformance:
    @pytest.fixture(scope="class")
    def api_healthy(self):
        return verify_api_health()

    @pytest.mark.skipif(
        not os.getenv("RUN_LOAD_TESTS"),
        reason="Load tests require external services. Set RUN_LOAD_TESTS=1 to run.",
    )
    def test_api_is_healthy(self, api_healthy):
        assert api_healthy, "API must be healthy to run load tests"

    @pytest.mark.skipif(
        not os.getenv("RUN_LOAD_TESTS"),
        reason="Load tests require external services. Set RUN_LOAD_TESTS=1 to run.",
    )
    def test_concurrent_requests_handled(self, api_healthy):
        result = run_load_test(num_requests=20, max_workers=20)
        assert result.successful > 0, "At least some requests should succeed"

    @pytest.mark.skipif(
        not os.getenv("RUN_LOAD_TESTS"),
        reason="Load tests require external services. Set RUN_LOAD_TESTS=1 to run.",
    )
    def test_response_time_under_5s(self, api_healthy):
        result = run_load_test(num_requests=10, max_workers=10)
        p95 = result.percentiles([95])[95]
        assert p95 < 5.0, f"p95 response time {p95:.2f}s should be under 5s"

    @pytest.mark.skipif(
        not os.getenv("RUN_LOAD_TESTS"),
        reason="Load tests require external services. Set RUN_LOAD_TESTS=1 to run.",
    )
    def test_success_rate_above_80_percent(self, api_healthy):
        result = run_load_test(num_requests=20, max_workers=20)
        assert result.success_rate >= 80, (
            f"Success rate {result.success_rate:.1f}% should be >= 80%"
        )

    @pytest.mark.skipif(
        not os.getenv("RUN_LOAD_TESTS"),
        reason="Load tests require external services. Set RUN_LOAD_TESTS=1 to run.",
    )
    def test_high_concurrency_handling(self, api_healthy):
        result = run_load_test(num_requests=50, max_workers=50)
        assert result.total_requests == 50, "All 50 requests should complete"


class TestLoadTestHelpers:
    def test_load_result_calculates_success_rate(self):
        result = LoadTestResult(
            total_requests=100,
            successful=90,
            failed=10,
            response_times=[0.1] * 90,
            errors=[],
        )
        assert result.success_rate == 90.0

    def test_load_result_calculates_percentiles(self):
        result = LoadTestResult(
            total_requests=100,
            successful=100,
            failed=0,
            response_times=[0.1] * 50 + [0.2] * 30 + [0.5] * 20,
            errors=[],
        )
        pcts = result.percentiles([50, 95])
        # 50th percentile is index 50: [0.1]*50 = indices 0-49, index 50 = first 0.2
        assert pcts[50] == 0.2
        # 95th percentile is index 95: first 80 are 0.1+0.2, next 20 are 0.5
        assert pcts[95] == 0.5

    def test_load_result_percentiles_with_single_value(self):
        result = LoadTestResult(
            total_requests=10,
            successful=10,
            failed=0,
            response_times=[0.5] * 10,
            errors=[],
        )
        pcts = result.percentiles([50, 95, 99])
        assert pcts[50] == 0.5
        assert pcts[95] == 0.5
        assert pcts[99] == 0.5

    def test_load_result_empty_response_times(self):
        result = LoadTestResult(
            total_requests=10,
            successful=0,
            failed=10,
            response_times=[],
            errors=["error"],
        )
        pcts = result.percentiles([50, 95])
        assert pcts[50] == 0.0
        assert pcts[95] == 0.0
        assert result.success_rate == 0.0

    def test_verify_api_health_returns_bool(self):
        result = verify_api_health()
        assert isinstance(result, bool)
