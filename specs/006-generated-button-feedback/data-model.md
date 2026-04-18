# Data Model: Generated Button Feedback

## Status

**Reusing existing data model** - No new entities needed.

## Existing Entities

### Job Link (from extension/popup/popup.js)

- `id`: number
- `title`: string
- `url`: string
- `description`: string (min 200 chars for generation)
- `cl_status`: 'none' | 'saving' | 'generating' | 'saved' | 'ready' | 'error'
- `cl_start_time`: timestamp (set when generation starts)
- `applied`: boolean
- `pending`: boolean

## UI State Mapping

| cl_status | Button Text | Badge Text | Disabled |
|-----------|-------------|-----------|----------|
| 'none' | Generate | No Desc | No (if desc >= 200 chars) |
| 'generating' | Generating... | MM:SS timer | Yes |
| 'ready' | Generated | Saved | Yes |
| 'error' | Generate | Error | No (retry) |

## Timer Format

- Format: Minutes:seconds (e.g., "1:23")
- Calculation: `(Date.now() - cl_start_time) / 1000` → minutes:seconds
- Update: Every 1000ms via setInterval
- Fallback: If cl_start_time missing → "Generating..."

## Changes Required

1. **Button rendering** (line 789): Add conditional for 'ready' status → show "Generated"
2. **Timer update**: Add setInterval loop to update timer display every second
3. **Badge text** (line 1091-1105): Change 'ready' display from "Saved" to "Generated"