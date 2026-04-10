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
        assert result == "profile.fn"

    def test_last_name_mapping(self):
        result = get_profile_field_name(SemanticFieldType.LAST_NAME)
        assert result == "profile.fn"

    def test_email_mapping(self):
        result = get_profile_field_name(SemanticFieldType.EMAIL)
        assert result == "profile.em"

    def test_city_mapping(self):
        result = get_profile_field_name(SemanticFieldType.CITY)
        assert result == "profile.adr.city"

    def test_street_mapping(self):
        result = get_profile_field_name(SemanticFieldType.STREET)
        assert result == "profile.adr.st"

    def test_postcode_mapping(self):
        result = get_profile_field_name(SemanticFieldType.POSTCODE)
        assert result == "profile.adr.zip"


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
            "text": "Experienced software developer",
        }

    @pytest.fixture
    def nested_payload(self):
        return {
            "t": "p",
            "profile": {
                "fn": "Osiozekha Aliu",
                "em": "aliu@dev-hh.de",
                "adr": {
                    "city": "NestedCity",
                    "st": "Nested Street 1",
                    "zip": "NESTED01",
                },
            },
        }

    def test_extract_firstname(self, flat_payload):
        result = extract_field_value_from_payload(flat_payload, SemanticFieldType.FIRST_NAME)
        assert result == "Osiozekha"

    def test_extract_lastname(self, flat_payload):
        result = extract_field_value_from_payload(flat_payload, SemanticFieldType.LAST_NAME)
        assert result == "Aliu"

    def test_extract_email(self, flat_payload):
        result = extract_field_value_from_payload(flat_payload, SemanticFieldType.EMAIL)
        assert result == "aliu@dev-hh.de"

    def test_extract_city(self, flat_payload):
        result = extract_field_value_from_payload(flat_payload, SemanticFieldType.CITY)
        assert result == "Hamburg"

    def test_extract_postcode(self, flat_payload):
        result = extract_field_value_from_payload(flat_payload, SemanticFieldType.POSTCODE)
        assert result == "22399"

    def test_extract_street(self, flat_payload):
        result = extract_field_value_from_payload(flat_payload, SemanticFieldType.STREET)
        assert result == "Schleusentwiete 1"


class TestFlatFieldPriority:
    @pytest.fixture
    def mixed_payload(self):
        return {
            "firstname": "FlatFirst",
            "lastname": "FlatLast",
            "email": "flat@email.com",
            "city": "FlatCity",
            "postcode": "FLAT99",
            "street": "Flat Street 1",
            "t": "p",
            "profile": {
                "fn": "NestedFirst NestedLast",
                "em": "nested@email.com",
                "adr": {
                    "city": "NestedCity",
                    "st": "Nested Street 1",
                    "zip": "NESTED01",
                },
            },
        }

    def test_flat_firstname_priority(self, mixed_payload):
        result = extract_field_value_from_payload(mixed_payload, SemanticFieldType.FIRST_NAME)
        assert result == "FlatFirst"

    def test_flat_lastname_priority(self, mixed_payload):
        result = extract_field_value_from_payload(mixed_payload, SemanticFieldType.LAST_NAME)
        assert result == "FlatLast"

    def test_flat_email_priority(self, mixed_payload):
        result = extract_field_value_from_payload(mixed_payload, SemanticFieldType.EMAIL)
        assert result == "flat@email.com"

    def test_flat_city_priority(self, mixed_payload):
        result = extract_field_value_from_payload(mixed_payload, SemanticFieldType.CITY)
        assert result == "FlatCity"

    def test_flat_postcode_priority(self, mixed_payload):
        result = extract_field_value_from_payload(mixed_payload, SemanticFieldType.POSTCODE)
        assert result == "FLAT99"

    def test_flat_street_priority(self, mixed_payload):
        result = extract_field_value_from_payload(mixed_payload, SemanticFieldType.STREET)
        assert result == "Flat Street 1"
