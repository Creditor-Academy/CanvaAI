# semanticIR

Phase 1 scaffolding for Semantic IR v2 — the narrative-oriented intermediate representation between AI output and the layout engine.

## Phase 1 scope

- Module boundary and barrel exports only
- No schema, validators, or runtime logic in this PR

## Non-goals (Phase 1)

- Semantic IR schema definitions (PR-3)
- Validators and normalizers (PR-3)
- Legacy ↔ IR adapters (PR-4)
- Feature flags (PR-2)
- Shadow pipeline hook in `aiLayoutService` (PR-5)
- Template migration or component composition

## Shadow-mode philosophy

Future phases will compute Semantic IR **in parallel** with the existing layout path. IR is observational first: validate, log, compare — never block generation.

When feature flags are enabled (PR-2+), the shadow layer runs alongside production code. On validation failure or adapter error, the system falls back to the legacy path silently.

## Layout engine remains sole geometry producer

`layoutEngine.js` → `layoutResolver.js` → `layoutTemplates.js` continue to assign all `x`, `y`, `width`, `height` values. Semantic IR must not carry absolute coordinates.

Dependency direction:

```
legacy layout system (production)
    ↓
semantic shadow layer (optional, flag-gated)
```

NOT:

```
semantic layer → layout engine internals
```
