# Quickstart: Job Applied Status Toggle

How to test the feature once implemented.

## Prerequisites

1. Backend running: `docker-compose up -d`
2. Extension loaded in Firefox

## Manual Testing

### 1. Load Extension

1. Open Firefox → `about:debugging#/runtime/this-firefox`
2. Click **"This Firefox"** → **"Load Temporary Add-on..."**
3. Select any file from `extension/` directory (e.g., `extension/manifest.json`)
4. Extension icon appears in toolbar

### 2. Open Popup

Click the extension icon in the toolbar. Verify:
- Job Links section shows 3-5 skeleton rows (shimmer animation)
- Skeletons fade in to real job list within 2 seconds

### 3. Verify Applied Icons

Look at the job links list:
- **Green icon** (left of title) = applied job
- **Red icon** (left of title) = not applied job
- No job should show a different color

### 4. Toggle Applied Status

Find a job with a red icon:
1. Click the red icon on the left
2. Icon turns green immediately (optimistic update)
3. Wait 10 seconds — icon stays green (API succeeded)

Find a job with a green icon:
1. Click the green icon
2. Icon turns red immediately
3. Wait 10 seconds — icon stays red

### 5. Toggle Failure & Revert

To test revert behavior (requires backend to be reachable):
- Toggle a job's icon
- If API fails: icon reverts to original color + error message appears below job list

### 6. Rapid Click Debounce

Click the same job's icon 5 times rapidly:
- Only the first click should trigger an API call
- Icon should reflect only the first toggle direction
- Subsequent clicks should be ignored while `pending = true`

### 7. Job Title Link

Click the job title (not the icon):
- Opens job URL in a new tab

### 8. Error State (API Down)

Stop the backend:
```bash
docker-compose stop api-backend
```
Open the popup:
- Error banner appears in job links section: "Failed to load jobs"
- Retry button is visible
- Form filling still works (other section of popup)

Restart the backend:
```bash
docker-compose start api-backend
```
Click Retry:
- Job links load successfully

## Test Checklist

- [ ] Skeleton placeholders show on popup open
- [ ] Job list loads within 2 seconds
- [ ] Applied jobs show green icon
- [ ] Not-applied jobs show red icon
- [ ] Click green icon → turns red immediately
- [ ] Click red icon → turns green immediately
- [ ] Toggle persists after API success
- [ ] Toggle reverts on API failure
- [ ] Rapid clicks are debounced (pending state)
- [ ] Job title opens URL in new tab
- [ ] Error banner + retry works when API down
- [ ] Form filling works independently of job links
