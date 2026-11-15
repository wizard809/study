# REPAIR_PLAN.md — Focus Deck

**Basis:** Phase 1/2 static audit (`4d7d601`, 2026-11-15). Goal: address verified defects in logical, testable increments without data loss or unnecessary rewrites.

## Guiding constraints
- Preserve existing user data (`fd_state_v4` and legacy keys) and working features.
- No secrets/keystores committed; no secret leakage in logs.
- No claiming success without executed evidence; stop before risky migrations without plan/tests.
- Prefer minimal, measurable refactors; avoid unnecessary dependencies.

## Prioritized plan

### P0 — Critical correctness & release blockers
1. **Favicon/branding assets (BUG-001, BUG-005 partial)**
   - Update `index.html` (+ rebuilt `dist`) to reference correct existing icon (e.g. `/favicon.svg`) and align manifest icons.
   - Add/verify appropriate icon set for PWA; ensure Capacitor/Android icon & splash generation path documented/configured (within CI-generated android project constraints) without committing secrets.
   - Tests: no broken icon requests, manifest/icon validity, visual check.
2. **Service worker & offline (BUG-003)**
   - Replace naive SW with build/version-aware strategy (precache app shell + hashed assets, navigation fallback only, runtime/cache rules that do not return HTML for asset/API failures), safe update/activation, cleanup old caches only.
   - Consider Vite PWA/plugin or a carefully implemented custom SW; keep behavior explicit and testable.
   - Tests: install, offline cold start, update, reconnect, cache cleanup behavior.
3. **Release build & signing readiness (BUG-002)**
   - Make Capacitor Android build reproducible (pin deps/scripts as appropriate), add release build workflow/config path using externalized signing material (env/secrets/CI secrets) and verification steps.
   - Do **not** generate/commit private keys; document required secrets and local/CI steps.
   - Tests: `assembleRelease`/bundle (where feasible), signature verification, install/launch smoke (device/emulator if available).

### P1 — Data integrity & safety
4. **Persistence hardening (BUG-004)**
   - Introduce explicit state/schema versioning and safe migrations from `fd_state_v4`/older keys.
   - Harden import: validate structure, size/shape checks, clear user confirmation, non-destructive handling on failure; warn/redact secrets in exports where appropriate.
   - Improve load resilience (avoid wiping to defaults on recoverable errors; surface recovery path).
   - Evaluate IndexedDB only with migration + backup + regression tests (separate, optional step).
   - Tests: round-trip backup/restore, malformed/partial/old data, migration, quota/large-data behavior.

### P2 — UX, accessibility, mobile
5. **Responsive/mobile & safe areas (BUG-007)** — add safe-area insets, touch target sizing, table/overflow handling, keyboard-aware tweaks; verify key screens.
6. **Accessibility & motion (BUG-006)** — `prefers-reduced-motion`, focus visibility/order, labels/roles/contrast fixes, reduce prompt/alert friction where feasible.
7. **PWA polish (BUG-005)** — icon/maskable set, manifest completeness, install/update UX messaging.

### P3 — Quality, performance, security
8. **Tooling/tests (BUG-008, BUG-009)** — add viable test stack (e.g. Vitest + RTL and/or Playwright as feasible), fix lint/typecheck setup for supported envs, incremental refactors/error boundaries/validation.
9. **Performance** — measure bundle/startup, code-split/lazy-load routes/components where beneficial.
10. **Security/privacy** — input/rendering hardening, dependency audit, backup/key handling guidance, no unsafe telemetry; review AI key exposure paths.

## Execution workflow per group
1. Implement minimal fix set → 2. Run targeted checks/tests → 3. Full regression/build → 4. Document in changelog/reports → 5. Proceed.

## Risk notes (stop/escalate)
- **Storage migration/IndexedDB:** risk of data loss — require backup path and tests before rollout.
- **Release signing:** must never commit credentials; CI/device verification may be environment-limited.
- **SW changes:** risk of stale/broken caches — needs careful versioning and update testing.

## Current readiness
Plan defined; **no repair code applied yet** in this phase. Prioritize P0 (BUG-001, BUG-003, BUG-002) first, subject to environment capabilities for Android signing/device verification.
