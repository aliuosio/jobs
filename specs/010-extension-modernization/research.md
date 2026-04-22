# Research: Extension Modernization

## Phase 0 Research Findings

### 1. React + Vite + Firefox Extension

**Decision**: Use `@crxjs/vite-plugin` with cross-browser manifest handling

**Rationale**: 
- `@crxjs/vite-plugin` is the gold standard for Chrome/Firefox extension development with Vite
- Supports HMR for development
- Uses web-ext for Firefox testing

**Alternatives considered**:
- WXT - Modern framework but adds abstraction overhead
- Plasmo - Popular but opinionated
- Manual Vite config - More work, less features

**Evidence**:
- https://github.com/crxjs/vite-extension-tools (CRXJS Vite plugin)
- Uses `{{chrome}}` and `{{firefox}}` prefixes in manifest.json for browser-specific fields
- web-ext CLI for Firefox testing: `web-ext run`, `web-ext build`

---

### 2. TanStack Query in Extensions

**Decision**: Configure TanStack Query with extension-specific environment overrides

**Rationale**:
- Background workers have `isServer` detection issues
- Need to use `environmentManager.setIsServer()` for proper detection
- Use chrome.storage.local for persistence

**Setup Pattern**:
```typescript
// Override server detection for extension workers
environmentManager.setIsServer(() => {
  return typeof window === 'undefined' && !('chrome' in globalThis);
});

// QueryClient with extension-appropriate settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 3,
      refetchIntervalInBackground: true,
    },
  },
});
```

**Evidence**:
- TanStack Query has service worker limitations due to `isServer` check
- Use `refetchIntervalInBackground: true` for background polling
- Message API for communication between extension parts

---

### 3. Tailwind CSS in Extensions

**Decision**: Use `@tailwindcss/vite` with safelist for dynamic classes

**Rationale**:
- Standard Tailwind setup with content paths
- Safelist required for manifest file class names
- Shadow DOM consideration for content scripts

**Evidence**:
- Use `@tailwindcss/vite` plugin in Vite config
- Safelist patterns for text colors, sizes, arbitrary values
- Content scripts inject styles via `<style>` tag in shadow DOM

**Configuration**:
```typescript
// tailwind.config.ts
{
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  safelist: [
    { pattern: /text-(xs|sm|base|lg|xl|2xl)/ },
    { pattern: /text-\[.*\]/ }, // arbitrary values
  ],
  darkMode: 'class',
}
```

---

### 4. Content Script Architecture

**Decision**: Use React with conditional shadow DOM

**Rationale**:
- Shadow DOM provides style encapsulation
- Prevents host page style conflicts
- Easier debugging in development

**Pattern**:
```typescript
import styles from '@/styles/index.css?inline'

const isProduction = process.env.NODE_ENV === 'production'

function inject(rootId: string) {
  const container = document.getElementById(rootId)
  const target = isProduction
    ? container.attachShadow({ mode: 'open' })
    : container
  
  // Styles only in production
  if (isProduction) {
    const style = document.createElement('style')
    style.textContent = styles
    target.appendChild(style)
  }
  
  render(<App />, target)
}
```

---

## Summary

| Decision | Choice | Rationale |
|----------|-------|----------|
| Vite Plugin | @crxjs/vite-plugin | Best Firefox/Chrome support, HMR |
| Data Fetching | TanStack Query | With environment override |
| Styling | Tailwind + @tailwindcss/vite | Standard, with safelist |
| Content Scripts | React + Shadow DOM | Style isolation |

All technical decisions resolved. Proceed to Phase 1.