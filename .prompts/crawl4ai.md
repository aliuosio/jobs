# Crawl4AI LinkedIn Job Description - Optimized Payload

## Anti-Bot Detection Configuration

```json
{
  "urls": ["URL"],
  "extraction_config": {
    "type": "CssExtractionStrategy",
    "params": {
      "selector": [
        "div.jobs-description__content",
        "div.jobs-box__html-content",
        "div.jobs-description"
      ],
      "min_text_length": 200
    }
  },
  "browser_config": {
    "type": "BrowserConfig",
    "params": {
      "headless": true,
      "enable_stealth": true,
      "headers": {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Referer": "https://www.linkedin.com/jobs/",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Connection": "keep-alive",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      },
      "cookies": [
        {
          "name": "COOKIE_NAME",
          "value": "COOKIE_VALUE",
          "domain": "DOMAIN",
          "path": "/"
        },
        {
          "name": "JSESSIONID",
          "value": "JSESSIONID_CURRENT",
          "domain": "DOMAIN",
          "path": "/"
        }
      ],
      "viewport": {
        "width": 1920,
        "height": 900
      }
    }
  },
  "crawler_config": {
    "type": "CrawlerRunConfig",
    "params": {
      "wait_until": "domcontentloaded",
      "magic": true,
      "cache_mode": "bypass",
      "remove_overlay_elements": true,
      "word_count_threshold": 200,
       "actions": [
        {
          "type": "click",
          "selector": "button[aria-label*='See more'], button.jobs-description__footer-button"
        },
        {
          "type": "wait",
          "ms": 1000
        }
      ]
    }
  }
}
```

## Key Settings Explained

| Setting | Value | Purpose |
|---------|-------|---------|
| `headless` | `true` | Runs browser without visible window |
| `enable_stealth` | `true` | Patches `navigator.webdriver`, `chrome.runtime`, etc. |
| `magic` | `true` | Auto-scroll, auto-wait, better JS handling |
| `wait_until` | `domcontentloaded`
| `css_selector` | `.job-details-skill-match-status-list...` | Extract only job description block |

## Anti-Detection Args

| Arg | Purpose |
|-----|---------|
| `--disable-blink-features=AutomationControlled` | Hides automation flags |
| `--disable-gpu` | Disables GPU acceleration (detection vector) |
| `--no-sandbox` | Required for containerized environments |
| `--disable-infobars` | Hides "Chrome is being controlled" bar |
| `--window-size=1920,1080` | Standard desktop viewport |

## Headers Breakdown

- **Sec-Ch-Ua**: Chrome brand version header (required for modern Chrome)
- **Sec-Fetch-***: Fetch metadata (required for modern requests)
- **Accept-Encoding**: Includes `br` (brotli) and `zstd` (modern compression)

## Important Notes

1. **Cookie must be valid** - `ERR_TOO_MANY_REDIRECTS` usually means expired `li_at` cookie
2. **Get fresh cookie**: Log into LinkedIn → F12 → Application → Cookies → copy `li_at`
3. **css_selector** extracts only the job description block, not the full page

## Quick Test

To test if detection is working:
1. Set `headless: false` to see the browser
2. Watch if LinkedIn shows "Verify your identity" or redirects
3. If visible browser works but headless fails → detection issue
4. If both fail with redirect loop → cookie expired
