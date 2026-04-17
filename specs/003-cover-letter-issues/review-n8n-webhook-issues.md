# Review: n8n Webhook Issues - Job Application Writer

**Date**: 2026-04-18
**Status**: Issues Found

## Summary

The n8n "Job Application Writer" workflow webhook is receiving requests but failing to process them correctly. The webhook endpoint (`/webhook/writer`) responds to GET requests but has logic errors in the workflow that prevent proper cover letter generation.

## Issues Identified

### Issue 1: Workflow Ignores Input Parameter

**Problem**: The workflow queries ALL job offers without cover letters, ignoring the `job_offers_id` sent in the webhook request.

**Current behavior**:
```javascript
// Get Offers with Desc without Letter
// Query: SELECT * FROM job_offers jo 
// WHERE ... AND NOT EXISTS (SELECT 1 FROM job_applications ja WHERE ja.job_offers_id = jo.id)
```

This query returns ALL jobs without letters, not the specific job ID requested via webhook.

**Expected behavior**: The workflow should filter by `job_offers_id` from the incoming webhook request body.

### Issue 2: Webhook Returns Before Processing Complete

**Problem**: The webhook responds immediately ("No item to return was found") instead of waiting for AI processing to complete.

**Current behavior**:
- Webhook receives request
- Workflow starts processing
- Returns response immediately (empty or error)
- Background processing continues but client already received failure

**Expected behavior**: Configure webhook to wait for full workflow execution before returning response.

### Issue 3: "Unused Respond to Webhook Node" Error

**Problem**: Log shows: `"Unused Respond to Webhook node found in the workflow"`

**Root cause**: The workflow has both a webhook node and a "Respond to Webhook" node, but they're not properly connected in the execution flow.

---

## Fix Requirements (for n8n UI)

### Fix 1: Filter by job_offers_id

In the n8n workflow "Job Application Writer":

1. Add a **Set node** after Webhook to extract the input:
   ```
   job_offers_id: {{ $json.body.job_offers_id }}
   ```

2. Modify **Get Offers with Desc without Letter** query to use the parameter:
   ```sql
   SELECT * FROM job_offers jo 
   WHERE jo.id = $1
     AND (jo.email IS NOT NULL OR jo.description IS NOT NULL)
     AND LENGTH(jo.description) > 200
     AND NOT EXISTS (
       SELECT 1 FROM job_applications ja 
       WHERE ja.job_offers_id = jo.id
     );
   ```

   With query replacement: `{{ $json.job_offers_id }}`

### Fix 2: Configure Webhook Response Mode

In the Webhook node settings:
- **Response Mode**: Change from "on receive" to "last node" or "response"
- Ensure the final node (Save to database) connects properly to the webhook response

### Fix 3: Remove Unused Respond to Webhook

If the "Respond to Webhook" node is not needed, remove it from the workflow canvas.

---

## Test Verification

After fixes, verify:
1. `POST http://localhost:5678/webhook/writer` with `{"job_offers_id": 315}` triggers workflow for job 315 only
2. Response waits for completion and returns success/failure
3. No "Unused Respond to Webhook" errors in logs
4. Cover letter is saved to `job_applications.content` table