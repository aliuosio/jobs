# Data Model: Form QA Field Testing

**Date**: 2026-03-19
**feature**: 001-form-qa-field-testing

## Overview

This document defines the data entities and validation rules for the six core form fields: firstname, lastname, email, city, postcode, and street.

## Core Entities

### Resume_data

Represents the user's resume information stored in Qdrant.

**Fields**:
- `firstname` (string, required): User's first name
- `lastname` (string, required): User's last name
- `email` (string, required): User's email address
- `city` (string, required): User's city
- `postcode` (string, required): User's postal code
- `street` (string, required): User's street address

**Validation Rules**:
- `firstname`: Non-empty string, 1-50 characters
- `lastname`: Non-empty string, 1-50 characters
- `email`: Valid email format (regex: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
- `city`: Non-empty string, 1-100 characters
- `postcode`: Alphanumeric with spaces and hyphens (regex: `^[A-Za-z0-9 \\-]+$`)
- `street`: Non-empty string, 1-200 characters

### field_classification

Represents semantic field type detection based on form signals.

**Fields**:
- `field_type` (enum): Detected field type (first_name, last_name, email, city, zip, street)
- `signals` (object): Form field signals
  - `autocomplete` (string, optional): HTML autocomplete attribute
  - `html_type` (string, optional): HTML input type
  - `input_name` (string, optional): HTML input name attribute
  - `label_text` (string, optional): Visible label text

### api_response

Represents the response from the /fill-form endpoint.

**Fields**:
- `answer` (string): Generated answer text
- `has_data` (boolean): Whether data was found
- `confidence` (enum): Confidence level (high, medium, low)
- `context_chunks` (integer): Number of relevant context pieces
- `field_value` (string, optional): Extracted field value
- `field_type` (string, optional): Detected field type

## Validation Schemas

### email_validation
```python
pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
```

### postcode_validation
```python
pattern = r'^[A-Za-z0-9 \\-]+$'
```

## State Transitions

### field_detection_flow
1. Receive form field label and signals
2. Classify field type using signals
3. Query Qdrant for matching resume data
4. Extract field value from payload
5. Return API response

### error_states
- **missing_data**: No resume data in Qdrant → return fallback message
- **invalid_email**: Email doesn't match pattern → return validation error
- **invalid_postcode**: Postcode doesn't match pattern → return validation error
- **ambiguous_field**: Multiple possible field types → use semantic search to determine most likely

## Data Flow

```
UI Form Input
      ↓
Field Classification (signals → field_type)
      ↓
Embedding Generation (label → vector)
      ↓
Qdrant Search (vector → context chunks)
      ↓
Field Extraction (payload → field_value)
      ↓
Answer Generation (context → answer)
      ↓
API Response
```
