# CHANGELOG.md — Focus Deck

## Unreleased (audit & repair pass — 2026-11-15, `main`)

### Added
- Audit and delivery artifacts: `AUDIT_REPORT.md`, `FEATURE_MATRIX.md`, `BUG_REPORT.md`, `REPAIR_PLAN.md`, `ARCHITECTURE_REPORT.md`, `TEST_REPORT.md`, `SECURITY_REPORT.md`, `PERFORMANCE_REPORT.md`, `RELEASE_CHECKLIST.md`, `CHANGELOG.md`.
- Safer persistence helpers: schema-aware sanitization, recovery handling for corrupt state copies, pre-import backup helper; backup export metadata (schema/version/date) and import validation/confirmation in Settings.
- PWA/manifest hardening: `id`/`scope`, maskable icon purpose, `apple-touch-icon` link; fallback `public/vite.svg` retained.
- Service worker update notification hook in app registration (console info on new version installed).
- CSS improvements: `:focus-visible`, `prefers-reduced-motion` support, safe-area-aware layout spacing (top/bottom).
- Build/release workflow enhancements: optional signed release APK build path in `android-apk.yml` when keystore secrets provided; clearer artifact naming/notes.
- `package.json` scripts for Capacitor sync helpers and declared `@capacitor/*` devDependencies (lockfile refresh attempted).

### Changed
- Favicon/app icon references updated from missing `/vite.svg` to existing `/favicon.svg` in `index.html` (and rebuilt `dist`).
- Service worker replaced with versioned strategy: app-shell precache, navigation network-first with shell fallback (navigation only), same-origin asset caching with stale-while-revalidate behavior, no HTML substitution for failed asset/API requests, and old-cache cleanup.
- Settings backup UX: warnings about secrets in backups, safer import flow (validate, confirm replace, recovery copy), safer reset confirmation, dated/versioned export filename.

### Fixed
- **BUG-001 (corroborated):** Broken favicon reference to missing `/vite.svg`.
- **BUG-003 (partially/code-level):** Unsafe SW precache/fallback behavior for Vite hashed assets and non-navigation failures.
- **BUG-004 (partially/code-level):** Fragile load/import behavior; improved resilience and validation (runtime scenarios still require verification).

### Known limitations / not completed
- **Release readiness:** No verified signed release APK/AAB produced in this environment; Android project not committed; device/install/signature verification not executed.
- **Testing:** No automated tests; typecheck blocked by Termux platform package issue; lint tooling incomplete; no device/offline/e2e performance profiling executed.
- **Persistence:** No IndexedDB migration; large-data/quota behavior and full migration matrix unverified.
- **Accessibility/mobile:** Improvements applied but not comprehensively audited or device-tested.
- **Feature depth:** AI/RAG/citations, full document viewer/annotations/ingestion, real-time collaboration/sync, and other advanced spec items remain incomplete by design/scope.

### Verification
- `npm run build`: **PASS** (multiple runs during repairs).
- `npm run typecheck`: **FAIL in Termux env** (missing `@typescript/typescript-android-arm64`).
- Automated/runtime/device tests: **NOT EXECUTED**.
