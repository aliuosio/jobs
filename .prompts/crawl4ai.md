# Crawl4AI LinkedIn Job Description - Optimized Payload

## Anti-Bot Detection Configuration

```json
{
  "urls": [url],
  "browser_config": {
    "type": "BrowserConfig",
    "params": {
      "headless": true,
      "enable_stealth": true,
      "headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Sec-Ch-Ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"",
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": "\"Windows\"",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "Referer": "https://www.linkedin.com/"
      },
      "cookies": [
        {
          "name": cookie_name,
          "value": cookie_value,
          "domain": domain,
          "path": "/",
          "secure": true,
          "httpOnly": false,
          "sameSite": "None"
        }
      ],
      "extra_args": [
        "--headless=new",
        "--disable-features=IsolateOrigins",
        "--disable-features=site-per-process",
        "--disable-dev-shm-usage",
        "--disable-extensions",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ],
      "ignore_https_errors": true,
      "java_script_enabled": true,
      "viewport": {
        "width": 1920,
        "height": 1080
      }
    }
  },
"crawler_config": {
  "type": "CrawlerRunConfig",
  "params": {
    "magic": true,
    "cache_mode": "bypass",
    "wait_until": "domcontentloaded",
    "wait_for_timeout": 8000,
    "page_timeout": 45000,
    "remove_overlay_elements": true,
    "verbose": true,
    "word_count_threshold": 10,
    "exclude_external_links": true
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
| `wait_until` | `networkidle` | Wait for LinkedIn's XHR calls to finish |
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
