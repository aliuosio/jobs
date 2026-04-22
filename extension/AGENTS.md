# extension/

Modernized React extension (replacing extension-old/).

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| App | `src/App.tsx` | Main component |
| Components | `src/components/` | React UI components |
| Hooks | `src/hooks/` | TanStack Query hooks |
| Services | `src/services/` | API client |
| Background | `src/background/` | Browser background script |
| Types | `src/types/` | TypeScript definitions |

## ENTRY POINT

`src/main.tsx` - React app entry
`package.json` - Build config

## CONVENTIONS

- TypeScript + React (TSX)
- TanStack Query for server state
- Vite build
- ESLint (strict)
- Global provider pattern

## ANTI-PATTERNS

- No `as any` or `@ts-ignore`
- No type suppression

## NOTES

In migration from extension-old/ (legacy JS). See `extension-old/REFACTORING-PLAN.md`.