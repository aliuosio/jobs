# Message Contract: Extension Messaging

**Feature**: 003-form-filler-extension | **Date**: 2026-03-08

## Overview

This document defines the message passing contract between extension components: content scripts, background script, and popup.

---

## Message Architecture

```
┌─────────────┐     browser.runtime.sendMessage      ┌─────────────┐
│   Popup     │ ─────────────────────────────────▶  │  Background │
│  (popup.js) │ ◀─────────────────────────────────  │ (background)│
└─────────────┘     browser.runtime.onMessage       └──────┬──────┘
                                                          │
                                                          │ browser.tabs.sendMessage
                                                          ▼
                                                   ┌─────────────┐
                                                   │  Content    │
                                                   │ (content.js)│
                                                   └─────────────┘
```

---

## Popup → Background Messages

### FILL_FORM

Fill a single form field.

**Request:**
```json
{
  "type": "FILL_FORM",
  "data": {
    "label": "Years of Python experience",
    "context_hints": "Looking for backend experience",
    "field_id": "field_123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "field_id": "field_123",
  "value": "5 years of Python experience",
  "confidence": "high"
}
```

---

### FILL_ALL_FORMS

Fill all detected form fields.

**Request:**
```json
{
  "type": "FILL_ALL_FORMS",
  "data": {
    "tab_id": 123,
    "fields": [
      { "label": "Full name", "field_id": "field_1" },
      { "label": "Email address", "field_id": "field_2" }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    { "field_id": "field_1", "success": true, "value": "John Doe" },
    { "field_id": "field_2", "success": true, "value": "john@example.com" }
  ],
  "total": 2,
  "completed": 2,
  "failed": 0
}
```

---

### SCAN_PAGE

Scan current page for form fields.

**Request:**
```json
{
  "type": "SCAN_PAGE",
  "data": {
    "tab_id": 123
  }
}
```

**Response:**
```json
{
  "success": true,
  "field_count": 5,
  "fields": [
    {
      "id": "field_1",
      "label": "Full name",
      "type": "text",
      "confidence": "high",
      "is_fillable": true
    }
  ]
}
```

---

### GET_STATUS

Get extension status.

**Request:**
```json
{
  "type": "GET_STATUS"
}
```

**Response:**
```json
{
  "api_connected": true,
  "api_endpoint": "http://localhost:8000",
  "last_scan_time": 1709900000000,
  "version": "1.0.0"
}
```

---

## Background → Content Messages

### FILL_FIELD

Fill a specific field with a value.

**Request:**
```json
{
  "type": "FILL_FIELD",
  "data": {
    "field_id": "field_123",
    "value": "5 years of experience"
  }
}
```

**Response:**
```json
{
  "success": true,
  "field_id": "field_123"
}
```

---

### DETECT_FIELDS

Scan page for form fields.

**Request:**
```json
{
  "type": "DETECT_FIELDS"
}
```

**Response:**
```json
{
  "success": true,
  "fields": [
    {
      "id": "field_1",
      "label": "Full name",
      "type": "text",
      "selector": "#name-input",
      "is_fillable": true
    }
  ],
  "count": 1
}
```

---

## Content → Background Messages

### FIELD_FILLED

Notify that a field was filled.

**Request:**
```json
{
  "type": "FIELD_FILLED",
  "data": {
    "field_id": "field_123",
    "success": true,
    "value": "5 years"
  }
}
```

---

### FILL_ERROR

Notify of a fill error.

**Request:**
```json
{
  "type": "FILL_ERROR",
  "data": {
    "field_id": "field_123",
    "error": "Field is readonly",
    "error_code": "FIELD_NOT_FILLABLE"
  }
}
```

---

## Error Codes

| Code | Description | Recovery |
|------|-------------|----------|
| `API_UNAVAILABLE` | Backend API not responding | Check if backend is running |
| `API_ERROR` | API returned error response | Check API logs |
| `INVALID_RESPONSE` | Malformed API response | Check API response format |
| `FIELD_NOT_FOUND` | Field no longer exists | Re-scan page |
| `FIELD_NOT_FILLABLE` | Field is readonly/disabled | Skip field |
| `NO_FIELDS_DETECTED` | No form fields on page | Navigate to job application |
| `TAB_NOT_ACTIVE` | Tab is not active | Focus the target tab |
| `CONTENT_SCRIPT_NOT_LOADED` | Content script not ready | Wait and retry |

---

## Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "API_UNAVAILABLE",
    "message": "Cannot connect to http://localhost:8000",
    "details": "Network error: Connection refused"
  }
}
```

---

## Implementation Notes

### Message Handler Pattern

```javascript
// Background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'FILL_FORM':
      return handleFillForm(message.data);
    case 'SCAN_PAGE':
      return handleScanPage(message.data);
    default:
      return Promise.resolve({ 
        success: false, 
        error: { code: 'UNKNOWN_MESSAGE', message: `Unknown message type: ${message.type}` }
      });
  }
});
```

### Tab Message Pattern

```javascript
// Background to content
async function sendToContent(tabId, message) {
  try {
    const response = await browser.tabs.sendMessage(tabId, message);
    return response;
  } catch (error) {
    return { success: false, error: { code: 'CONTENT_SCRIPT_NOT_LOADED' } };
  }
}
```
