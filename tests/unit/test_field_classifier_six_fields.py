# Unit tests for six flat field extraction (firstname, lastname, email, city, postcode, street)

import pytest

from src.services.field_classifier import (
    SemanticFieldType,
    classify_field_type,
    extract_field_value_from_payload,
    get_profile_field_name,
)


class TestClassifySixFields:
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

    def test_classify_city_from_autocomplete(self):
        signals = {"autocomplete": "address-level2"}
        result = classify_field_type(signals)
        assert result == SemanticFieldType.CITY

    def test_classify_postcode_from_autocomplete(self):
        signals = {"autocomplete": "postal-code"}
        result = classify_field_type(signals)
        assert result in (SemanticFieldType.ZIP, SemanticFieldType.POSTCODE)

    def test_classify_street_from_autocomplete(self):
        signals = {"autocomplete": "street-address"}
        result = classify_field_type(signals)
        assert result == SemanticFieldType.STREET


class TestGetProfileFieldNameSixFields:
    def test_first_name_mapping(self):
        result = get_profile_field_name(SemanticFieldType.FIRST_NAME)
        assert result == "firstname"

    def test_last_name_mapping(self):
        result = get_profile_field_name(SemanticFieldType.LAST_NAME)
        assert result == "lastname"

    def test_email_mapping(self):
        result = get_profile_field_name(SemanticFieldType.EMAIL)
        assert result == "email"

    def test_city_mapping(self):
        result = get_profile_field_name(SemanticFieldType.CITY)
        assert result == "city"

    def test_street_mapping(self):
        result = get_profile_field_name(SemanticFieldType.STREET)
        assert result == "street"

    def test_postcode_mapping(self):
        result = get_profile_field_name(SemanticFieldType.POSTCODE)
        assert result == "postcode"


class TestExtractFlatFieldsFromPayload:
    @pytest.fixture
    def flat_payload(self):
        return {
            "firstname": "Osiozekha",
            "lastname": "Aliu",
            "email": "aliu@dev-hh.de",
            "city": "Hamburg",
            "postcode": "22399",
            "street": "Schleusentwiete 1",
        }

    def test_extract_firstname(self, flat_payload):
        result = extract_field_value_from_payload(
            flat_payload, SemanticFieldType.FIRST_NAME
        )
        assert result == "Osiozekha"

    def test_extract_lastname(self, flat_payload):
        result = extract_field_value_from_payload(
            flat_payload, SemanticFieldType.LAST_NAME
        )
        assert result == "Aliu"

    def test_extract_email(self, flat_payload):
        result = extract_field_value_from_payload(flat_payload, SemanticFieldType.EMAIL)
        assert result == "aliu@dev-hh.de"

    def test_extract_city(self, flat_payload):
        result = extract_field_value_from_payload(flat_payload, SemanticFieldType.CITY)
        assert result == "Hamburg"

    def test_extract_postcode(self, flat_payload):
        result = extract_field_value_from_payload(
            flat_payload, SemanticFieldType.POSTCODE
        )
        assert result == "22399"

    def test_extract_street(self, flat_payload):
        result = extract_field_value_from_payload(
            flat_payload, SemanticFieldType.STREET
        )
        assert result == "Schleusentwiete 1"


class TestBackwardCompatibility:
    @pytest.fixture
    def nested_payload(self):
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
            },
        }

    def test_extract_city_from_nested(self, nested_payload):
        result = extract_field_value_from_payload(
            nested_payload, SemanticFieldType.CITY
        )
        assert result == "New York"

    def test_extract_street_from_nested(self, nested_payload):
        result = extract_field_value_from_payload(
            nested_payload, SemanticFieldType.STREET
        )
        assert result == "123 Main St"

    def test_extract_zip_from_nested(self, nested_payload):
        result = extract_field_value_from_payload(nested_payload, SemanticFieldType.ZIP)
        assert result == "10001"


class TestFlatFieldPriority:
    @pytest.fixture
    def mixed_payload(self):
        return {
            "firstname": "FlatFirst",
            "lastname": "FlatLast",
            "email": "flat@email.com",
            "city": "FlatCity",
            "postcode": "FLAT99",
            "street": "Flat Street",
            "profile": {
                "fn": "Nested Full",
                "em": "nested@email.com",
                "adr": {
                    "city": "NestedCity",
                    "zip": "NESTED01",
                    "st": "Nested Street",
                },
            },
        }

    def test_flat_firstname_priority(self, mixed_payload):
        result = extract_field_value_from_payload(
            mixed_payload, SemanticFieldType.FIRST_NAME
        )
        assert result == "FlatFirst"

    def test_flat_city_priority(self, mixed_payload):
        result = extract_field_value_from_payload(mixed_payload, SemanticFieldType.CITY)
        assert result == "FlatCity"

    def test_flat_postcode_priority(self, mixed_payload):
        result = extract_field_value_from_payload(
            mixed_payload, SemanticFieldType.POSTCODE
        )
        assert result == "FLAT99"
