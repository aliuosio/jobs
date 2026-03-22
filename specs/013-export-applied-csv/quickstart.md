# Quick Start: Export Applied Jobs as CSV

## Overview
This guide provides instructions for testing the CSV export feature for applied jobs.

## Prerequisites
- Docker and Docker Compose (backend running)
- Firefox browser with extension loaded
- `curl` or similar HTTP client for API testing

## Backend API Testing

### 1. Verify Backend Health
```bash
curl http://localhost:8000/health
```

### 2. Test JSON Response (Default)
```bash
curl http://localhost:8000/job-offers
```

### 3. Test CSV Export
```bash
curl -OJ http://localhost:8000/job-offers?format=csv
```
*Note: The `-O` flag saves the file with the server-provided filename.*
*Note: `-J` suppresses the filename from stdout when using `-O`.*

### 4. Test CSV Response Headers
```bash
curl -I http://localhost:8000/job-offers?format=csv
```

Expected output:
```
HTTP/1.1 200 OK
content-type: text/csv; charset=utf-8
content-disposition: attachment; filename="applied-jobs-2026-03-22T143052.csv"
```

### 5. Test Invalid Format Error
```bash
curl http://localhost:8000/job-offers?format=invalid
```

Expected response:
```json
{
  "detail": "Invalid format parameter. Must be 'json' or 'csv'."
}
```

### 6. View CSV Content
```bash
# Download and display CSV
curl -s http://localhost:8000/job-offers?format=csv | head -20

# Or save and open in Excel
curl -sO http://localhost:8000/job-offers?format=csv
open applied-jobs-*.csv  # macOS
```

## Extension Testing

### 1. Load Extension
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file from the `extension/` directory

### 2. Locate Export Button
1. Click the extension icon in the toolbar
2. Verify "Job Links" tab is active
3. Look for "Export Applied" button between:
   - "Show Applied" checkbox
   - "Refresh Jobs" button

### 3. Test Export Flow
1. Click "Export Applied" button
2. Verify button becomes disabled during download
3. Check browser downloads for CSV file with timestamped filename
4. Open CSV and verify:
   - Headers: `company,email,company_url,title,url,posted`
   - Only applied jobs are included
   - Data is correctly formatted for Excel

### 4. Test Button State During Export
1. Click "Export Applied"
2. Button should be visually disabled (grayed out)
3. Button re-enables after download completes or fails

## Manual Testing Scenarios

### Scenario 1: Normal Export
1. Backend API is running with job offers
2. Some jobs have `applied: true`
3. User clicks "Export Applied"
4. CSV downloads with all applied jobs
5. Filename contains current datetime

### Scenario 2: Empty Export (No Applied Jobs)
1. Backend API is running
2. No jobs have `applied: true`
3. User clicks "Export Applied"
4. CSV downloads with headers only (no data rows)

### Scenario 3: Special Characters
1. Backend has jobs with special characters in title:
   - Commas: "Software Engineer, Backend"
   - Quotes: 'CEO "The Best"'
   - Newlines in title
2. User exports to CSV
3. CSV file is valid (special chars properly escaped)
4. Excel displays characters correctly

### Scenario 4: API Unavailable
1. Stop backend: `docker-compose stop api-backend`
2. User clicks "Export Applied"
3. Extension shows appropriate error feedback
4. Restart backend: `docker-compose start api-backend`

## Troubleshooting

### CSV Not Downloading
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check API returns CSV: `curl -I http://localhost:8000/job-offers?format=csv`
3. Check extension console for errors

### CSV Opens as Garbled Text in Excel
1. Verify UTF-8 with BOM encoding
2. Open in a text editor first to check content
3. If garbled, the BOM may be missing

### Missing Applied Jobs in Export
1. Verify jobs have `applied: true` in database
2. Check API response for applied jobs: `curl http://localhost:8000/job-offers`
3. Verify CSV filter logic excludes non-applied jobs

### Filename Not Timestamped
1. Check Content-Disposition header from API
2. Verify backend generates filename with datetime
