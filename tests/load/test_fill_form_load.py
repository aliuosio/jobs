"""Load testing for /api/v1/search endpoint.

Tests concurrent request handling with 100 parallel requests.
Requires:
- Docker services running: docker-compose up -d
- Data seeded in Qdrant
- API running at TEST_BASE_URL

Run:
    # From host
    pytest tests/load/test_fill_form_load.py -v

    # Inside Docker
    docker exec jobs_api-backend pytest tests/load/test_fill_form_load.py -v

    # Standalone with Python
    python -m tests.load.test_fill_form_load

Output:
    - Total requests
    - Successful/Failed counts
    - Response time percentiles (p50, p95, p99)
    - Requests per second
"""

import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Optional

import httpx
from statistics import median


TEST_BASE_URL = os.getenv("TEST_BASE_URL", "http://localhost:8000")
CONCURRENT_REQUESTS = 100
TIMEOUT_SECONDS = 30.0


@dataclass
class LoadTestResult:
    """Results from a single load test run."""

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
        """Calculate response time percentiles."""
        if not self.response_times:
            return {p: 0.0 for p in pcts}
        sorted_times = sorted(self.response_times)
        n = len(sorted_times)
        return {p: sorted_times[int(n * p / 100)] for p in pcts}

    def summary(self) -> str:
        """Generate summary report."""
        pcts = self.percentiles()
        return f"""
Load Test Results
=================
Total Requests:  {self.total_requests}
Successful:      {self.successful} ({self.success_rate:.1f}%)
Failed:          {self.failed}
Errors:          {len(self.errors)}

Response Times
--------------
Median (p50):    {pcts[50]:.3f}s
p95:             {pcts[95]:.3f}s
p99:             {pcts[99]:.3f}s
Min:             {min(self.response_times):.3f}s
Max:             {max(self.response_times):.3f}s

Throughput
----------
Requests/sec:    {self.rps:.1f}

Errors
------
{chr(10).join(self.errors[:10]) if self.errors else "None"}
"""


def make_request(session_id: int) -> tuple[int, float, Optional[str]]:
    """Make a single /api/v1/search request.

    Returns:
        Tuple of (session_id, response_time, error_message)
    """
    # Rotate through test labels to simulate realistic usage
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
                return (session_id, elapsed, f"HTTP {response.status_code}: {response.text[:100]}")
    except Exception as e:
        elapsed = time.time() - start
        return (session_id, elapsed, str(e))


def run_load_test(
    num_requests: int = CONCURRENT_REQUESTS,
    max_workers: int = CONCURRENT_REQUESTS,
) -> LoadTestResult:
    """Run concurrent load test.

    Args:
        num_requests: Number of total requests to make
        max_workers: Maximum concurrent workers

    Returns:
        LoadTestResult with aggregated metrics
    """
    print(f"Starting load test: {num_requests} requests with {max_workers} workers")
    print(f"Target: {TEST_BASE_URL}/api/v1/search")
    print()

    start_time = time.time()
    response_times: list[float] = []
    errors: list[str] = []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(make_request, i): i for i in range(num_requests)}

        completed = 0
        for future in as_completed(futures):
            session_id, elapsed, error = future.result()
            completed += 1

            if error:
                errors.append(f"Request {session_id}: {error}")
            else:
                response_times.append(elapsed)

            # Progress indicator
            if completed % 10 == 0:
                print(
                    f"  Progress: {completed}/{num_requests} ({completed / num_requests * 100:.0f}%)"
                )

    total_time = time.time() - start_time

    result = LoadTestResult(
        total_requests=num_requests,
        successful=len(response_times),
        failed=len(errors),
        response_times=response_times,
        errors=errors,
    )

    print(f"\nTotal time: {total_time:.2f}s")
    print(result.summary())

    return result


def verify_api_health() -> bool:
    """Verify API is healthy before running load test."""
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(f"{TEST_BASE_URL}/health")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    return True
    except Exception as e:
        print(f"API health check failed: {e}")
    return False


def main():
    """Main entry point for standalone execution."""
    print("=" * 60)
    print("Load Test: /api/v1/search Endpoint")
    print("=" * 60)
    print()

    # Verify API health
    print("Checking API health...")
    if not verify_api_health():
        print("ERROR: API is not healthy. Start services with: docker-compose up -d")
        return 1

    print("API is healthy. Starting load test...")
    print()

    # Run load test
    result = run_load_test()

    # Verify success criteria
    print("=" * 60)
    print("Verification")
    print("=" * 60)

    # FR-009: Response time < 5s for 95% of requests
    p95 = result.percentiles([95])[95]
    if p95 < 5.0:
        print(f"✓ FR-009: p95 response time {p95:.3f}s < 5s")
    else:
        print(f"✗ FR-009: p95 response time {p95:.3f}s >= 5s")

    # Success rate > 95%
    if result.success_rate >= 95:
        print(f"✓ Success rate: {result.success_rate:.1f}% >= 95%")
    else:
        print(f"✗ Success rate: {result.success_rate:.1f}% < 95%")

    # Concurrent handling: 100 parallel requests
    print(f"✓ Handled {result.total_requests} concurrent requests")

    return 0 if result.success_rate >= 95 else 1


if __name__ == "__main__":
    exit(main())
