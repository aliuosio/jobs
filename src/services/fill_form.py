"""Backwards compatibility re-exports from field_classifier FormFillingService."""

from src.services.field_classifier import (
    SemanticFieldType,
    classify_field_type,
    extract_field_value_from_payload,
    form_filling_service,
)

calculate_confidence = form_filling_service.calculate_confidence
combine_confidence = form_filling_service.combine_confidence
assemble_context = form_filling_service.assemble_context
extract_direct_field_value = form_filling_service.extract_direct_field_value

__all__ = [
    "calculate_confidence",
    "combine_confidence",
    "assemble_context",
    "extract_direct_field_value",
    "classify_field_type",
    "SemanticFieldType",
]