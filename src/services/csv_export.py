import csv
import io
import logging
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)

CSV_COLUMNS = ["company", "email", "company_url", "title", "url", "posted"]


def generate_csv_filename() -> str:
    now = datetime.now(timezone.utc)
    return f"applied-jobs-{now.strftime('%Y-%m-%dT%H%M%S')}.csv"


def generate_csv_bytes(job_offers: list[dict[str, Any]]) -> bytes:
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    writer.writerow(CSV_COLUMNS)

    for offer in job_offers:
        row = [
            offer.get("company", ""),
            offer.get("email", ""),
            offer.get("company_url", ""),
            offer.get("title", ""),
            offer.get("url", ""),
            str(offer.get("posted", "")) if offer.get("posted") else "",
        ]
        writer.writerow(row)

    csv_content = output.getvalue()
    return "\ufeff".encode("utf-8") + csv_content.encode("utf-8")


__all__ = [
    "CSV_COLUMNS",
    "generate_csv_filename",
    "generate_csv_bytes",
]
