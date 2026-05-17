# Tooling Configuration

## lean-ctx Compression Format

<!-- lean-ctx-compression -->

```
OUTPUT STYLE: expert-terse

- Telegraph format: subject-verb-object, drop articles/prepositions
- Symbolic vocabulary: → cause, ∵ because, ∴ therefore, ⊕ add, ⊖ remove, Δ change, ≈ similar, ≠ different, ∈ in/member, ∅ empty/none, ✓ ok, ✗ fail
- Code blocks: untouched (never compress code syntax)
- Each line: max 80 chars
- Zero narration, zero filler
- BUDGET: ≤100 tokens per non-code response
```

## Global `.clinerules/`

Located at `/home/krusty/Documents/Cline/Rules`:

- **Cleanup.md**: Integrity check, scope adherence, edge case handling, readability, refinement loop, final output verification
- **Global.md**: DRY (3+ occurrences), YAGNI, KISS, SOLID, decision hygiene (ADR for architectural changes)
- **MCP-Servers.md**: Brave Search, Context7, Firecrawl, Sequential Thinking, Memory — available tools and capabilities