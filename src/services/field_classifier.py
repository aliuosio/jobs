"""Field Classifier service for semantic field type detection.

Classifies form field requests based on signals (autocomplete, label_text,
input_name, html_type) to determine the semantic field type (e.g., full_name,
email, phone) for direct field value extraction from Qdrant payloads.
"""

import logging
import re
from enum import Enum
from typing import TYPE_CHECKING, Any

from src.api.schemas import ConfidenceLevel

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)


class SemanticFieldType(str, Enum):
    """Semantic field types that can be directly extracted from profile data."""

    FULL_NAME = "full_name"
    FIRST_NAME = "first_name"
    LAST_NAME = "last_name"
    EMAIL = "email"
    PHONE = "phone"
    BIRTHDATE = "birthdate"
    CITY = "city"
    STREET = "street"
    ZIP = "zip"
    POSTCODE = "postcode"
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
    r"\btelefon\b",  # German
]

BIRTHDATE_PATTERNS = [
    r"\bgeburtstag\b",
    r"\bgeburtsdatum\b",
    r"\bdate\s*of\s*birth\b",
    r"\bbirthday\b",
    r"\bdob\b",
    r"\bbirth\s*date\b",
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

# Additional patterns to detect postcode fields at payload top level
POSTCODE_PATTERNS = [
    r"\bpostcode\b",
    r"\bpostal\s*code\b",
    r"\bzip\s*code\b",
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
    "bday": SemanticFieldType.BIRTHDATE,
    "street-address": SemanticFieldType.STREET,
    "address-line1": SemanticFieldType.STREET,
    "address-level2": SemanticFieldType.CITY,
    "city": SemanticFieldType.CITY,
    "postal-code": SemanticFieldType.POSTCODE,
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


def _get_by_path(obj: Any, path: str) -> Any:
    """Navigate a dotted path within a dict and return the value if present."""
    if obj is None or not isinstance(obj, dict) or not path:
        return None
    parts = path.split(".")
    current: Any = obj
    for part in parts:
        if isinstance(current, dict) and part in current:
            current = current[part]
        else:
            return None
    return current


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

    if _matches_patterns(combined_text, BIRTHDATE_PATTERNS):
        logger.debug(f"Classified as birthdate from patterns in: {combined_text}")
        return SemanticFieldType.BIRTHDATE

    if _matches_patterns(combined_text, CITY_PATTERNS):
        logger.debug(f"Classified as city from patterns in: {combined_text}")
        return SemanticFieldType.CITY

    if _matches_patterns(combined_text, STREET_PATTERNS):
        logger.debug(f"Classified as street from patterns in: {combined_text}")
        return SemanticFieldType.STREET

    # POSTCODE detection before ZIP detection (to prefer postcode semantics)
    if _matches_patterns(combined_text, POSTCODE_PATTERNS):
        logger.debug(f"Classified as postcode from patterns in: {combined_text}")
        return SemanticFieldType.POSTCODE

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
        The profile field path (e.g., "profile.fn", "profile.em") or None.
    """
    mapping = {
        # Full name uses historic short flag from profile object
        SemanticFieldType.FULL_NAME: "profile.fn",
        # Personal data from nested profile structure (matches resume-import.md schema)
        SemanticFieldType.FIRST_NAME: "profile.fn",
        SemanticFieldType.LAST_NAME: "profile.fn",  # Extract from full name
        SemanticFieldType.EMAIL: "profile.em",
        SemanticFieldType.PHONE: "profile.ph",
        SemanticFieldType.BIRTHDATE: "profile.birthdate",  # May need text extraction fallback
        SemanticFieldType.CITY: "profile.adr.city",
        SemanticFieldType.STREET: "profile.adr.st",
        SemanticFieldType.ZIP: "profile.adr.zip",
        SemanticFieldType.POSTCODE: "profile.adr.zip",
        SemanticFieldType.COUNTRY: "profile.adr.cc",
        SemanticFieldType.GITHUB: "profile.social.gh",
        SemanticFieldType.LINKEDIN: "profile.social.li",
        SemanticFieldType.URL: None,
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
    # 0) Check for flat fields at root level first (priority)
    flat_field_mapping = {
        SemanticFieldType.FIRST_NAME: "firstname",
        SemanticFieldType.LAST_NAME: "lastname",
        SemanticFieldType.EMAIL: "email",
        SemanticFieldType.CITY: "city",
        SemanticFieldType.POSTCODE: "postcode",
        SemanticFieldType.ZIP: "postcode",
        SemanticFieldType.STREET: "street",
    }
    if field_type in flat_field_mapping:
        flat_key = flat_field_mapping[field_type]
        if flat_key in payload:
            return str(payload[flat_key])

    # 1) Try direct field access using the updated field mappings
    field_path = get_profile_field_name(field_type)
    if field_path:
        value = _get_by_path(payload, field_path)
        if value is not None:
            return str(value)

    # 2) Handle special cases for nested profile structure
    profile = payload.get("profile")
    if profile and isinstance(profile, dict):
        # ADDRESS fields commonly nested under profile.adr
        if field_type == SemanticFieldType.CITY:
            val = _get_by_path(profile, "adr.city")
        elif field_type == SemanticFieldType.STREET:
            val = _get_by_path(profile, "adr.st")
        elif field_type in (SemanticFieldType.ZIP, SemanticFieldType.POSTCODE):
            val = _get_by_path(profile, "adr.zip")
        elif field_type == SemanticFieldType.COUNTRY:
            val = _get_by_path(profile, "adr.cc")
        elif field_type == SemanticFieldType.GITHUB:
            val = _get_by_path(profile, "social.gh")
        elif field_type == SemanticFieldType.LINKEDIN:
            val = _get_by_path(profile, "social.li")
        elif field_type == SemanticFieldType.FIRST_NAME:
            full_name = _get_by_path(profile, "fn")
            if full_name:
                name_parts = full_name.strip().split()
                if len(name_parts) > 1:
                    return name_parts[0]
                return full_name
            val = payload.get("firstname")
        elif field_type == SemanticFieldType.EMAIL:
            val = _get_by_path(profile, "em")
        elif field_type == SemanticFieldType.PHONE:
            val = _get_by_path(profile, "ph")
        elif field_type == SemanticFieldType.LAST_NAME:
            full_name = _get_by_path(profile, "fn")
            if full_name:
                name_parts = full_name.strip().split()
                if len(name_parts) > 1:
                    return name_parts[-1]
                return full_name
            val = payload.get("lastname")
        else:
            val = None
        if val is not None:
            return str(val)

    # 3) Fallback to text extraction for remaining cases
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

    if field_type == SemanticFieldType.BIRTHDATE:
        return _extract_birthdate_from_text(text)

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

    # Enhanced name extraction patterns
    name_patterns = [
        r"^(?:Name:)?\s*([A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+)",  # "Name: John Doe" or "John Doe"
        r"^([A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+)",  # "John Doe" at start of line
        r"Contact:\s*([A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+)",  # "Contact: John Doe"
    ]

    for pattern in name_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            # Validate it looks like a name (2-4 words, no numbers)
            words = name.split()
            if 2 <= len(words) <= 4 and not any(c.isdigit() for c in name):
                return name

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


def _extract_birthdate_from_text(text: str) -> str | None:
    """Extract birthdate from text."""
    birthdate_patterns = [
        r"\b\d{1,2}[./]\d{1,2}[./]\d{2,4}\b",
        r"\b\d{4}-\d{2}-\d{2}\b",
        r"\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}\b",
    ]
    for pattern in birthdate_patterns:
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


class FormFillingService:
    """Service for form filling orchestration: confidence calculation, context assembly, and field extraction."""

    @staticmethod
    def calculate_confidence(avg_score: float, chunk_count: int) -> ConfidenceLevel:
        if chunk_count == 0:
            return ConfidenceLevel.NONE
        if avg_score >= 0.8:
            return ConfidenceLevel.HIGH
        if avg_score >= 0.5:
            return ConfidenceLevel.MEDIUM
        return ConfidenceLevel.LOW

    @staticmethod
    def combine_confidence(
        retrieval_confidence: ConfidenceLevel,
        llm_confidence: ConfidenceLevel,
        field_value: str | None,
    ) -> ConfidenceLevel:
        confidence_order = [
            ConfidenceLevel.NONE,
            ConfidenceLevel.LOW,
            ConfidenceLevel.MEDIUM,
            ConfidenceLevel.HIGH,
        ]
        retrieval_idx = confidence_order.index(retrieval_confidence)
        llm_idx = confidence_order.index(llm_confidence)
        base_idx = max(retrieval_idx, llm_idx)
        if field_value:
            base_idx = min(base_idx + 1, 3)
        return confidence_order[base_idx]

    @staticmethod
    def assemble_context(chunks: list[dict]) -> str:
        """Assemble context string from retrieved chunks."""
        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            payload = chunk.get("payload", {})
            text = payload.get("text", "")
            if text:
                context_parts.append(f"[{i}] {text}")
        return "\n".join(context_parts)

    @staticmethod
    def extract_direct_field_value(chunks: list[dict], field_type: SemanticFieldType) -> str | None:
        """Extract field value directly from chunks without LLM generation."""
        for chunk in chunks:
            payload = chunk.get("payload", {})
            if payload.get("profile") or any(
                k in payload for k in ["firstname", "lastname", "email", "city", "postcode", "street"]
            ):
                value = extract_field_value_from_payload(payload, field_type)
                if value:
                    return value
        return None


form_filling_service = FormFillingService()
classifier = type(
    "FieldClassifier",
    (),
    {
        "classify": staticmethod(classify_field_type),
        "extract_value": staticmethod(extract_field_value_from_payload),
    },
)()
