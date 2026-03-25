# Data Model: Fix LinkedIn Job Crawling in n8n Workflow

## Overview

This implementation modifies workflow configuration rather than data structures. No changes to database schema required.

## Existing Entities

### JobOffer (PostgreSQL - job_offers table)

| Field | Type | Description |
|-------|------|-------------|
| id | SERIAL | Primary key |
| url | VARCHAR(2048) | Job posting URL (LinkedIn, Indeed, Xing) |
| title | VARCHAR(500) | Job title |
| description | TEXT | Extracted job description (target of this fix) |
| company | VARCHAR(255) | Company name |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update |

### JobOfferProcess (PostgreSQL - job_offers_process table)

| Field | Type | Description |
|-------|------|-------------|
| job_offers_id | INTEGER | Foreign key to job_offers |
| research | BOOLEAN | Whether research (crawl) completed |
| processed_at | TIMESTAMP | Last processing timestamp |

## Workflow Configuration (Modified)

### Crawl4aiConfig (in workflow JSON)

| Parameter | Current Value | New Value | Purpose |
|-----------|--------------|-----------|---------|
| browser_config.enable_stealth | true | false | Prevents redirect loops |
| browser_config.magic | true | false | Reduces anti-bot triggers |
| crawler_config.wait_until | "networkidle" | "load" | Prevents timeout on redirects |
| crawler_config.delay_before_return_html | (none) | 2.0 | Allows page to settle |
| crawler_config.page_timeout | 60000 | 90000 | 90 second limit |
| crawler_config.proxy | (none) | (to be added) | Proxy rotation |

## State Transitions

### Job Research Status Flow

```
pending → (crawl starts) → in_progress
                           ↓
                    ┌──────┴──────┐
                    ↓              ↓
               completed       failed
                    ↓              ↓
                    └──────┬──────┘
                           ↓
                      (retry?) → in_progress
```

### Crawl Status Values

| Status | Meaning |
|--------|---------|
| pending | Not yet crawled |
| in_progress | Currently crawling |
| completed | Successfully extracted |
| failed | Error occurred |
| blocked | Detected as bot/CAPTCHA |

## No New Entities Required

This fix only modifies workflow configuration. No new database tables, fields, or entities needed.
