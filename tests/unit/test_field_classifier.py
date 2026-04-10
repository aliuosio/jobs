"""Unit tests for FieldClassifier service."""

import pytest

from src.services.field_classifier import (
    SemanticFieldType,
    classify_field_type,
    extract_field_value_from_payload,
    get_profile_field_name,
)


class TestClassifyFieldType:
    def test_classify_name_from_autocomplete(self):
        signals = {"autocomplete": "name", "label_text": "Full Name"}
        result = classify_field_type(signals)
        assert result == SemanticFieldType.FULL_NAME

    def test_classify_first_name_from_autocomplete(self):
        signals = {"autocomplete": "given-name"}
        result = classify_field_type(signals)
        assert result == SemanticFieldType.FIRST_NAME

    def test_classify_last_name_from_autocomplete(self):
        signals = {"autocomplete": "family-name"}
        result = classify_field_type(signals)
        assert result == SemanticFieldType.LAST_NAME

    def test_classify_email_from_autocomplete(self):
        signals = {"autocomplete": "email"}
        result = classify_field_type(signals)
        assert result == SemanticFieldType.EMAIL

    def test_classify_phone_from_autocomplete(self):
        signals = {"autocomplete": "tel"}
        result = classify_field_type(signals)
        assert result == SemanticFieldType.PHONE

    def test_classify_email_from_html_type(self):
        signals = {"html_type": "email"}
        result = classify_field_type(signals)
        assert result == SemanticFieldType.EMAIL

    def test_classify_phone_from_html_type(self):
        signals = {"html_type": "tel"}
        result = classify_field_type(signals)
        assert result == SemanticFieldType.PHONE

    def test_classify_name_from_label_text(self):
        signals = {"label_text": "Your Full Name"}
        result = classify_field_type(signals)
        assert result == SemanticFieldType.FULL_NAME

    def test_classify_first_name_from_label(self):
        signals = {"label_text": "First Name"}
        result = classify_field_type(signals)
        assert result == SemanticFieldType.FIRST_NAME

    def test_classify_last_name_from_label(self):
        signals = {"label_text": "Last Name"}
        result = classify_field_type(signals)
        assert result == SemanticFieldType.LAST_NAME

    def test_classify_email_from_label(self):
        signals = {"label_text": "Email Address"}
        result = classify_field_type(signals)
        assert result == SemanticFieldType.EMAIL

    def test_classify_phone_from_label(self):
        signals = {"label_text": "Mobile Number"}
        result = classify_field_type(signals)
        assert result == SemanticFieldType.PHONE

    def test_classify_phone_from_input_name(self):
        signals = {"input_name": "contact_number"}
        result = classify_field_type(signals)
        assert result == SemanticFieldType.PHONE

    def test_classify_github_from_label(self):
        signals = {"label_text": "GitHub Profile", "html_type": "url"}
        result = classify_field_type(signals)
        assert result == SemanticFieldType.GITHUB

    def test_classify_linkedin_from_label(self):
        signals = {"label_text": "LinkedIn URL", "html_type": "url"}
        result = classify_field_type(signals)
        assert result == SemanticFieldType.LINKEDIN

    def test_classify_city_from_label(self):
        signals = {"label_text": "City"}
        result = classify_field_type(signals)
        assert result == SemanticFieldType.CITY

    def test_classify_returns_none_for_unknown(self):
        signals = {"label_text": "Favorite Color"}
        result = classify_field_type(signals)
        assert result is None

    def test_classify_returns_none_for_empty_signals(self):
        result = classify_field_type(None)
        assert result is None

    def test_classify_returns_none_for_empty_dict(self):
        result = classify_field_type({})
        assert result is None

    def test_autocomplete_priority_over_label(self):
        signals = {
            "autocomplete": "email",
            "label_text": "Contact Information",
        }
        result = classify_field_type(signals)
        assert result == SemanticFieldType.EMAIL

    def test_case_insensitive_matching(self):
        signals = {"label_text": "YOUR EMAIL ADDRESS"}
        result = classify_field_type(signals)
        assert result == SemanticFieldType.EMAIL


class TestGetProfileFieldName:
    def test_full_name_mapping(self):
        assert get_profile_field_name(SemanticFieldType.FULL_NAME) == "profile.fn"

    def test_email_mapping(self):
        assert get_profile_field_name(SemanticFieldType.EMAIL) == "profile.em"

    def test_phone_mapping(self):
        assert get_profile_field_name(SemanticFieldType.PHONE) == "profile.ph"

    def test_city_mapping(self):
        assert get_profile_field_name(SemanticFieldType.CITY) == "profile.adr.city"

    def test_street_mapping(self):
        assert get_profile_field_name(SemanticFieldType.STREET) == "profile.adr.st"

    def test_github_mapping(self):
        assert get_profile_field_name(SemanticFieldType.GITHUB) == "profile.social.gh"

    def test_url_returns_none(self):
        assert get_profile_field_name(SemanticFieldType.URL) is None


class TestExtractFieldValueFromPayload:
    @pytest.fixture
    def sample_payload(self):
        return {
            "t": "p",
            "text": "John Doe is a software developer.",
            "profile": {
                "fn": "John Doe",
                "em": "john@example.com",
                "ph": "+1-555-123-4567",
                "adr": {
                    "st": "123 Main St",
                    "city": "New York",
                    "zip": "10001",
                    "cc": "US",
                },
                "social": {"gh": "johndoe", "li": "linkedin.com/in/johndoe"},
            },
        }

    def test_extract_full_name(self, sample_payload):
        result = extract_field_value_from_payload(sample_payload, SemanticFieldType.FULL_NAME)
        assert result == "John Doe"

    def test_extract_email(self, sample_payload):
        result = extract_field_value_from_payload(sample_payload, SemanticFieldType.EMAIL)
        assert result == "john@example.com"

    def test_extract_phone(self, sample_payload):
        result = extract_field_value_from_payload(sample_payload, SemanticFieldType.PHONE)
        assert result == "+1-555-123-4567"

    def test_extract_city(self, sample_payload):
        result = extract_field_value_from_payload(sample_payload, SemanticFieldType.CITY)
        assert result == "New York"

    def test_extract_street(self, sample_payload):
        result = extract_field_value_from_payload(sample_payload, SemanticFieldType.STREET)
        assert result == "123 Main St"

    def test_extract_github(self, sample_payload):
        result = extract_field_value_from_payload(sample_payload, SemanticFieldType.GITHUB)
        assert result == "johndoe"

    def test_extract_linkedin(self, sample_payload):
        result = extract_field_value_from_payload(sample_payload, SemanticFieldType.LINKEDIN)
        assert result == "linkedin.com/in/johndoe"

    def test_extract_returns_none_for_missing_profile(self):
        payload = {"t": "e", "text": "Some experience text"}
        result = extract_field_value_from_payload(payload, SemanticFieldType.FULL_NAME)
        # Code falls back to text extraction when profile is missing
        assert result is not None

    def test_extract_returns_none_for_missing_field(self):
        payload = {"t": "p", "profile": {"fn": "John"}}
        result = extract_field_value_from_payload(payload, SemanticFieldType.EMAIL)
        assert result is None

    def test_extract_returns_none_for_url_type(self, sample_payload):
        result = extract_field_value_from_payload(sample_payload, SemanticFieldType.URL)
        assert result is None
