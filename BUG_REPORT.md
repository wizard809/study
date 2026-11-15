# BUG_REPORT.md — Focus Deck

**Commit:** `4d7d601` | **Date:** 2026-11-15 | **Method:** Static audit + local build (no device runtime).  
Severity: **Critical / High / Medium / Low / Info**. Status: **Open** unless noted.

## Confirmed / high-confidence issues

### BUG-001 — Broken favicon reference (`/vite.svg`)
- **Severity:** High (correctness/UX; corroborates reported APK finding)
- **Status:** Open
- **Component:** `index.html`, `dist/index.html`, `public/` assets
- **Observed:** Favicon link points to `/vite.svg`, but `vite.svg` is absent from `public/` and `dist/` (`public/dist` contain `favicon.svg`, `icons.svg`; `src/assets/vite.svg` exists but not served at root).
- **Impact:** Broken favicon request; inconsistent branding in browser/PWA. Android launcher/adaptive/splash correctness cannot be confirmed without generated resources/APK.
- **Repro (static):** Inspect `index.html:5` and `dist/index.html:5`; list `public/` and `dist/`.
- **Suggested fix:** Point favicon/manifest icons to existing correct asset(s) and ensure required icon set (incl. Android resources in build pipeline).
- **Test required:** Browser/PWA icon load, no 404 for icon, Android icon/splash after build.

### BUG-002 — Debug-only Android build; no verified release/signing
- **Severity:** High (release readiness)
- **Status:** Open
- **Component:** `.github/workflows/android-apk.yml`, Capacitor/Android config (ephemeral), `package.json`
- **Observed:** Workflow runs `assembleDebug` and uploads debug APK; no `assembleRelease`/bundle, no signing configuration in repo, no signature verification. `android/` not committed; `@capacitor/*` not pinned in manifest (installed ad-hoc).
- **Impact:** Cannot claim production/release-ready artifact; reproducibility and signing posture unclear.
- **Suggested fix:** Add reproducible Capacitor/Android config, release build path with secure signing (keystore/material outside git, no secrets in logs), and verification steps; document process.
- **Test required:** Successful release build, `apksigner`/install/launch verification (on supported device/emulator).

### BUG-003 — Service worker precache and fetch fallback unsafe for Vite/SPA
- **Severity:** High (offline/update reliability)
- **Status:** Open
- **Component:** `public/sw.js`, `dist/sw.js`, registration in `src/main.tsx`
- **Observed:** Precache list `['/', '/index.html', '/manifest.webmanifest']` excludes hashed JS/CSS assets; cache `focus-deck-v1` not tied to build; `skipWaiting`/`clients.claim` without update coordination; catch-all fallback returns `/index.html` for failed GETs (can serve HTML for missing JS/CSS/image/API).
- **Impact:** Offline launch likely fails to load app shell assets; risk of broken/mixed versions and incorrect responses on failures.
- **Suggested fix:** Versioned/build-aware precache or runtime caching strategy appropriate for Vite hashed assets; correct fallback (navigation-only), safe update flow, cleanup of old app caches without deleting user data.
- **Test required:** First install, offline cold launch, update to new build, recovery after reconnect, no HTML-for-script responses.

### BUG-004 — Persistence validation/migration and backup safety gaps
- **Severity:** Medium-High (data integrity/privacy)
- **Status:** Open
- **Component:** `src/lib/store.ts`, Settings backup/import/reset, storage model
- **Observed:** Single `localStorage` blob (`fd_state_v4`) with permissive merge/defaults and try/catch-to-default on parse error; limited schema validation/migration/versioning; import writes and reloads without robust validation/compat checks; backups include locally stored API keys/MCP config; no size/quota strategy, no IndexedDB.
- **Impact:** Risk of silent data loss/corruption on bad imports or schema drift; accidental secret exposure via shared backups; large data may hit storage limits.
- **Suggested fix:** Versioned schema + migrations, strict-ish import validation & user-confirmed merge/replace, redaction/warnings for secrets, quota/size handling, consider IndexedDB for large content (with migration plan and tests) — without deleting existing user data.
- **Test required:** Reload/restart persistence, corrupted/old/oversized import handling, migration from prior keys, export/import round-trip.

### BUG-005 — PWA/branding asset completeness
- **Severity:** Medium
- **Status:** Open
- **Component:** `public/manifest.webmanifest`, icons/assets, Android resources (generated)
- **Observed:** Manifest defines single SVG icon (`/favicon.svg`); no maskable/PNG size set or richer metadata. Android launcher/adaptive/splash assets not auditable in-repo.
- **Impact:** Inconsistent install/home-screen appearance across platforms; store/launcher readiness uncertain.
- **Test required:** Install prompt/icon display, Android generated mipmap/adaptive/splash verification.

### BUG-006 — Accessibility and motion support not implemented/verified
- **Severity:** Medium
- **Status:** Open
- **Component:** Global CSS/components (`index.css`, `App.css`, `App.tsx`)
- **Observed:** No `prefers-reduced-motion` media handling found; focus indicators, contrast, ARIA/labels, touch target sizing, keyboard flows not systematically ensured (prompt/alert usage present).
- **Impact:** Reduced usability for keyboard/screen-reader/low-motion users; potential accessibility failures.
- **Test required:** Keyboard-only nav, focus visibility, reduced-motion behavior, contrast/touch-target checks.

### BUG-007 — Mobile/responsive and safe-area handling incomplete
- **Severity:** Medium
- **Status:** Open
- **Component:** Layout/CSS (`App.css`), tables/dialog-like UI
- **Observed:** Basic responsive breakpoint exists; no evident safe-area insets, limited handling for on-screen keyboard/small screens/long content.
- **Impact:** Layout/interaction issues on notched devices, landscape, or small screens.
- **Test required:** Narrow/large Android viewports, portrait/landscape, keyboard, safe areas.

### BUG-008 — Tooling, lint, and typecheck reproducibility issues
- **Severity:** Medium (engineering quality)
- **Status:** Open
- **Component:** `package.json`, dev environment
- **Observed:** `lint` script requires eslint but eslint not in deps; `typecheck` (`tsc -b`) fails in this Termux/Android environment due to missing `@typescript/typescript-android-arm64` (env/platform-specific). No tests.
- **Impact:** Reduced confidence in refactors; CI quality gates limited.
- **Test required:** Working lint/typecheck in supported dev/CI envs; add tests.

### BUG-009 — Monolithic UI architecture and limited runtime safeguards
- **Severity:** Low-Medium
- **Status:** Open
- **Component:** `src/App.tsx` and app structure
- **Observed:** Large single-file UI, sparse error boundaries/defensive runtime validation for user/imported data.
- **Impact:** Harder maintenance; higher regression risk.

## Reported but not directly verifiable here
- **RPT-001:** Supplied `app-debug.apk` contains `/vite.svg` reference and missing `assets/public/vite.svg` — **consistent with BUG-001** but APK artifact not available for confirmation.
- **RPT-002:** Supplied APK is debug-named/not release-ready — **consistent with BUG-002**; signature/install not verified.

## Unresolved/high-risk items (summary)
Release signing/verified artifact, offline correctness, persistence migration/validation, accessibility/mobile compliance, and automated/regression/device testing remain open. **Overall: NOT YET PRODUCTION READY.**
