"""Field Classifier service for semantic field type detection.

Classifies form field requests based on signals (autocomplete, label_text,
input_name, html_type) to determine the semantic field type (e.g., full_name,
email, phone) for direct field value extraction from Qdrant payloads.
"""

import logging
import re
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class SemanticFieldType(str, Enum):
    """Semantic field types that can be directly extracted from profile data."""

    FULL_NAME = "full_name"
    FIRST_NAME = "first_name"
    LAST_NAME = "last_name"
    EMAIL = "email"
    PHONE = "phone"
    CITY = "city"
    STREET = "street"
    ZIP = "zip"
    COUNTRY = "country"
    GITHUB = "github"
    LINKEDIN = "linkedin"
    URL = "url"


# Signal patterns for field type classification
NAME_PATTERNS = [
    r"\bname\b",
    r"\bfull\s*name\b",
    r"\byour\s*name\b",
    r"\bapplicant\s*name\b",
]

FIRST_NAME_PATTERNS = [
    r"\bfirst\s*name\b",
    r"\bgiven\s*name\b",
    r"\bforename\b",
    r"\bchristian\s*name\b",
]

LAST_NAME_PATTERNS = [
    r"\blast\s*name\b",
    r"\bfamily\s*name\b",
    r"\bsurname\b",
]

EMAIL_PATTERNS = [
    r"\bemail\b",
    r"\be-?mail\s*address\b",
    r"\bcontact\s*email\b",
]

PHONE_PATTERNS = [
    r"\bphone\b",
    r"\btelephone\b",
    r"\bmobile\b",
    r"\bcell\b",
    r"\bcontact[\s_-]*number\b",
]

CITY_PATTERNS = [
    r"\bcity\b",
    r"\btown\b",
    r"\blocation\b",
]

STREET_PATTERNS = [
    r"\bstreet\b",
    r"\baddress\s*line\s*1\b",
    r"\bstreet\s*address\b",
]

ZIP_PATTERNS = [
    r"\bzip\b",
    r"\bpostal\b",
    r"\bpostcode\b",
]

GITHUB_PATTERNS = [
    r"\bgithub\b",
    r"\bgit\s*hub\b",
]

LINKEDIN_PATTERNS = [
    r"\blinkedin\b",
    r"\blinked\s*in\b",
]

# Autocomplete attribute mappings
AUTOCOMPLETE_MAP = {
    "name": SemanticFieldType.FULL_NAME,
    "given-name": SemanticFieldType.FIRST_NAME,
    "family-name": SemanticFieldType.LAST_NAME,
    "email": SemanticFieldType.EMAIL,
    "tel": SemanticFieldType.PHONE,
    "tel-national": SemanticFieldType.PHONE,
    "tel-international": SemanticFieldType.PHONE,
    "street-address": SemanticFieldType.STREET,
    "address-line1": SemanticFieldType.STREET,
    "city": SemanticFieldType.CITY,
    "postal-code": SemanticFieldType.ZIP,
    "country": SemanticFieldType.COUNTRY,
    "country-name": SemanticFieldType.COUNTRY,
    "url": SemanticFieldType.URL,
}


def _matches_patterns(text: str, patterns: list[str]) -> bool:
    """Check if text matches any of the patterns (case-insensitive)."""
    if not text:
        return False
    text_lower = text.lower()
    return any(re.search(p, text_lower) for p in patterns)


def classify_field_type(signals: dict[str, Any] | None) -> SemanticFieldType | None:
    """Classify the semantic field type based on signals.

    Args:
        signals: Dictionary containing field signals from the extension:
            - autocomplete: HTML autocomplete attribute
            - label_text: Label text content
            - input_name: Input name attribute
            - html_type: HTML input type (text, email, tel, url)

    Returns:
        SemanticFieldType if classification is confident, None otherwise.
    """
    if not signals:
        return None

    autocomplete = signals.get("autocomplete", "")
    label_text = signals.get("label_text", "")
    input_name = signals.get("input_name", "")
    html_type = signals.get("html_type", "")

    # Combine text signals for pattern matching, normalizing underscores
    combined_text = f"{label_text} {input_name}".replace("_", " ").strip()

    # 1. Check autocomplete attribute (highest priority - standardized)
    if autocomplete:
        autocomplete_lower = autocomplete.lower()
        if autocomplete_lower in AUTOCOMPLETE_MAP:
            field_type = AUTOCOMPLETE_MAP[autocomplete_lower]
            logger.debug(f"Classified as {field_type} from autocomplete={autocomplete}")
            return field_type

    # 2. Check html_type hint (high priority)
    if html_type == "email":
        logger.debug("Classified as email from html_type=email")
        return SemanticFieldType.EMAIL
    if html_type == "tel":
        logger.debug("Classified as phone from html_type=tel")
        return SemanticFieldType.PHONE
    if html_type == "url":
        # Check if it's a specific URL type
        if _matches_patterns(combined_text, GITHUB_PATTERNS):
            logger.debug("Classified as github from combined text patterns")
            return SemanticFieldType.GITHUB
        if _matches_patterns(combined_text, LINKEDIN_PATTERNS):
            logger.debug("Classified as linkedin from combined text patterns")
            return SemanticFieldType.LINKEDIN
        logger.debug("Classified as url from html_type=url")
        return SemanticFieldType.URL

    # 3. Check label and name patterns (medium priority)
    # Check name patterns first (most specific to least specific)
    if _matches_patterns(combined_text, FIRST_NAME_PATTERNS):
        logger.debug(f"Classified as first_name from patterns in: {combined_text}")
        return SemanticFieldType.FIRST_NAME

    if _matches_patterns(combined_text, LAST_NAME_PATTERNS):
        logger.debug(f"Classified as last_name from patterns in: {combined_text}")
        return SemanticFieldType.LAST_NAME

    if _matches_patterns(combined_text, NAME_PATTERNS):
        logger.debug(f"Classified as full_name from patterns in: {combined_text}")
        return SemanticFieldType.FULL_NAME

    if _matches_patterns(combined_text, EMAIL_PATTERNS):
        logger.debug(f"Classified as email from patterns in: {combined_text}")
        return SemanticFieldType.EMAIL

    if _matches_patterns(combined_text, PHONE_PATTERNS):
        logger.debug(f"Classified as phone from patterns in: {combined_text}")
        return SemanticFieldType.PHONE

    if _matches_patterns(combined_text, CITY_PATTERNS):
        logger.debug(f"Classified as city from patterns in: {combined_text}")
        return SemanticFieldType.CITY

    if _matches_patterns(combined_text, STREET_PATTERNS):
        logger.debug(f"Classified as street from patterns in: {combined_text}")
        return SemanticFieldType.STREET

    if _matches_patterns(combined_text, ZIP_PATTERNS):
        logger.debug(f"Classified as zip from patterns in: {combined_text}")
        return SemanticFieldType.ZIP

    if _matches_patterns(combined_text, GITHUB_PATTERNS):
        logger.debug(f"Classified as github from patterns in: {combined_text}")
        return SemanticFieldType.GITHUB

    if _matches_patterns(combined_text, LINKEDIN_PATTERNS):
        logger.debug(f"Classified as linkedin from patterns in: {combined_text}")
        return SemanticFieldType.LINKEDIN

    # No confident classification
    logger.debug(f"Could not classify field type from signals: {signals}")
    return None


def get_profile_field_name(field_type: SemanticFieldType) -> str | None:
    """Map SemanticFieldType to the corresponding profile field path.

    Args:
        field_type: The classified semantic field type.

    Returns:
        The profile field path (e.g., "fn", "em", "ph") or None.
    """
    mapping = {
        SemanticFieldType.FULL_NAME: "fn",
        SemanticFieldType.FIRST_NAME: "fn",  # Fall back to full name
        SemanticFieldType.LAST_NAME: "fn",  # Fall back to full name
        SemanticFieldType.EMAIL: "em",
        SemanticFieldType.PHONE: "ph",
        SemanticFieldType.CITY: "adr.city",
        SemanticFieldType.STREET: "adr.st",
        SemanticFieldType.ZIP: "adr.zip",
        SemanticFieldType.COUNTRY: "adr.cc",
        SemanticFieldType.GITHUB: "social.gh",
        SemanticFieldType.LINKEDIN: "social.li",
        SemanticFieldType.URL: None,  # No direct mapping, use RAG
    }
    return mapping.get(field_type)


def extract_field_value_from_payload(
    payload: dict[str, Any], field_type: SemanticFieldType
) -> str | None:
    """Extract the field value from a Qdrant payload based on field type.

    Args:
        payload: The Qdrant payload containing profile data or text chunks.
        field_type: The classified semantic field type.

    Returns:
        The extracted field value or None if not found.
    """
    profile = payload.get("profile")
    if profile:
        field_path = get_profile_field_name(field_type)
        if field_path:
            parts = field_path.split(".")
            value = profile
            for part in parts:
                if isinstance(value, dict):
                    value = value.get(part)
                else:
                    return None
            if value is not None:
                return str(value) if value else None

    text = payload.get("text", "")
    if not text:
        return None

    if field_type in (
        SemanticFieldType.FULL_NAME,
        SemanticFieldType.FIRST_NAME,
        SemanticFieldType.LAST_NAME,
    ):
        return _extract_name_from_text(text)

    if field_type == SemanticFieldType.EMAIL:
        return _extract_email_from_text(text)

    if field_type == SemanticFieldType.PHONE:
        return _extract_phone_from_text(text)

    if field_type == SemanticFieldType.GITHUB:
        return _extract_github_from_text(text)

    if field_type == SemanticFieldType.LINKEDIN:
        return _extract_linkedin_from_text(text)

    return None


def _extract_name_from_text(text: str) -> str | None:
    """Extract a person's name from text (first line often contains 'Name | Title')."""
    lines = text.strip().split("\n")
    if not lines:
        return None

    first_line = lines[0].strip()
    if "|" in first_line:
        name_part = first_line.split("|")[0].strip()
        if name_part and not any(c.isdigit() for c in name_part):
            words = name_part.split()
            if 2 <= len(words) <= 4:
                return name_part

    contact_match = re.search(r"Contact:\s*([^|]+)", text, re.IGNORECASE)
    if contact_match:
        location_part = contact_match.group(1).strip()
        if "|" in text[contact_match.end() :]:
            return None

    return None


def _extract_email_from_text(text: str) -> str | None:
    """Extract email address from text."""
    email_pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
    match = re.search(email_pattern, text)
    return match.group(0) if match else None


def _extract_phone_from_text(text: str) -> str | None:
    """Extract phone number from text."""
    phone_patterns = [
        r"\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}",
        r"\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}",
    ]
    for pattern in phone_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0)
    return None


def _extract_github_from_text(text: str) -> str | None:
    """Extract GitHub username/URL from text."""
    patterns = [
        r"github\.com/([a-zA-Z0-9_-]+)",
        r"github:\s*([a-zA-Z0-9_-]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)
    return None


def _extract_linkedin_from_text(text: str) -> str | None:
    """Extract LinkedIn URL from text."""
    pattern = r"linkedin\.com/in/([a-zA-Z0-9_-]+)"
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        return f"linkedin.com/in/{match.group(1)}"
    return None


# Global classifier instance
classifier = type(
    "FieldClassifier",
    (),
    {
        "classify": staticmethod(classify_field_type),
        "extract_value": staticmethod(extract_field_value_from_payload),
    },
)()
