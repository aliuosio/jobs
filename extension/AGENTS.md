# extension/

Firefox/Chrome browser extension with Job Forms Helper and Job Links Manager.

## STRUCTURE

```
extension/
├── manifest.json     # Extension entry point
├── background/    # Background scripts
├── content/       # Content scripts (form detection)
├── popup/        # Popup UI
├── services/      # Extension services (API client)
├── tests/        # Extension tests
└── icons/       # Extension icons
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Manifest | `extension/manifest.json` | Entry point |
| Form detection | `extension/content/` | Signal extractor |
| Background | `extension/background/` | Event handlers |
| Popup UI | `extension/popup/` | User interface |
| Refactor plan | `extension/REFACTORING-PLAN.md` | ES Module conversion |

## CONVENTIONS

- ES Module conversion in progress (see REFACTORING-PLAN.md)
- No type suppression (`as any`, `@ts-ignore`)
- Legacy JS (pre-ES Module conversion)
- Load as temporary add-on in Firefox
- Backend communication via `browser.runtime.sendMessage`