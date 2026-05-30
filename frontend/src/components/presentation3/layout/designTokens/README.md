# designTokens

Phase 1 introduces a namespace boundary for future typography, spacing, and color token systems.

## Phase 1 behavior

- `designTokens/index.js` re-exports everything from `layout/constants.js`
- `constants.js` remains the source of truth for slide geometry and role defaults
- No token migration, renaming, or behavioral change

## Future direction (Phase 5+)

Token scales (spacing, typography, color) will live here while geometry constants stay in `constants.js`. Existing imports of `constants.js` will continue to work via re-export aliases.
