# AUDIT_REPORT.md — Focus Deck (`wizard809/study`)

**Application:** Focus Deck (`com.focusdeck.app`)  
**Repository:** `/data/data/com.termux/files/home/study`  
**Git commit:** `4d7d601` (main, clean working tree at audit start)  
**Audit date:** 2026-11-15  
**Audit type:** Static/codebase audit + local build verification (Termux/Android host). Runtime device, offline, Android install/signature, and full UX testing are **not fully executed** in this environment (see limitations).  
**Supplied APK:** A “final APK archive contains `app-debug.apk`” was referenced but **not found in this workspace**; direct comparison against that artifact is **UNABLE TO VERIFY**. Findings below incorporate the user-stated APK observations where corroborated by repo/build evidence.

## 1. Repository architecture
- **Stack:** React 19.1.0 + React DOM 19.1.0, TypeScript ~5.8.3, Vite 6.3.5 (`@vitejs/plugin-react`), Capacitor Android wrapper (config only in repo).
- **Entry:** `index.html` → `src/main.tsx` renders `App` (`src/App.tsx`, ~872 LOC, monolithic) and registers service worker `/sw.js` on load.
- **Navigation/state:** 15 client-side destinations defined in `src/lib/nav.tsx`, switched via React state in `App.tsx`; single persisted `AppState` via `src/lib/store.ts`.
- **Persistence:** `localStorage` key `fd_state_v4` (fallback read: `fd_state_v3`/`fd_state_v2`), backup export/import/reset in Settings. No IndexedDB, no backend sync.
- **PWA:** `public/manifest.webmanifest`, custom `public/sw.js`.
- **Android:** `capacitor.config.ts` (`appId com.focusdeck.app`, `webDir dist`, `androidScheme https`). **No committed `android/` project**; generated in CI. Capacitor packages not in `package.json`.
- **Build outputs:** `dist/` contains hashed JS/CSS, `index.html`, manifest, SW, `favicon.svg`, `icons.svg`.

## 2. Build & release pipeline
- **Scripts:** `dev`, `build` (`vite build`), `typecheck` (`tsc -b`), `lint` (`eslint .`, eslint not installed), `preview`.
- **CI (`.github/workflows/ci.yml`):** Node 22, install, `vite build`, upload `dist`.
- **APK CI (`.github/workflows/android-apk.yml`):** Node 22 + Java 21 + Android SDK 34, install, build web, ad-hoc install Capacitor deps, `cap add/sync`, **`./gradlew assembleDebug`**, upload `focus-deck-debug-apk` (debug). **No release build, no signing config, no signature verification.**
- **Baseline verification (this session):** `npm run build` **PASSED** (Vite, 19 modules, `dist/assets/index-DqN6F3Um.js` 319.48 kB / gzip 91.31 kB, CSS 6.04 kB). `npm run typecheck` **FAILED in this environment** due to missing `@typescript/typescript-android-arm64` platform package for TypeScript on Termux/Android (tooling/environment limitation; not evidence of source type errors).

## 3. Feature inventory (implemented in UI/state)
Destinations: Home, Planner, My Learning, Notes, Documents, AI Tutor, Flashcards, Mind Maps, Quiz Centre, Focus, Exams, Analytics, Study Groups, Resource Library, Settings.
- Local CRUD/planning/practice flows exist across most modules (timetable/tasks, subjects/chapters/topics, notes/tags/checklists/import-export, mind maps tree+export/import, flashcards with SM-2-style scheduling, quizzes with attempts/timed mode, exams/syllabus tracking, focus timer/sessions, resources/documents metadata & text import, local groups, analytics/goals, settings/backup/AI & MCP config).
- **AI:** Browser `fetch` to user-configured providers (OpenAI-compatible/Anthropic/Gemini/custom/Ollama) with fallbacks; conditional on config/CORS/network. No backend RAG/ingestion/citations.
- **Collaboration/sync:** Local entries only; no real-time/shared backend.
- **Documents:** Browser-side text import/preview for text formats; PDF/other handled as metadata/guidance (no full viewer/extraction/annotations pipeline).

## 4. Key confirmed findings (static evidence)
| ID | Sev | Finding | Evidence |
|---|---|---|---|
| F1 | High | Broken favicon reference (`/vite.svg`) | `index.html` and `dist/index.html` reference `/vite.svg`; `public/` and `dist/` contain `favicon.svg`/`icons.svg` but **no `vite.svg`** (only `src/assets/vite.svg`). Matches reported APK issue (unverified here). |
| F2 | High | Debug-only Android pipeline, no release/signing | APK workflow runs `assembleDebug` and uploads debug artifact; no release/signing/verification in repo; `android/` not committed; Capacitor deps not pinned in manifest. |
| F3 | High | Service worker caching/fallback defects | `sw.js` precaches only `/`, `/index.html`, `/manifest.webmanifest` (misses hashed assets), static cache name `focus-deck-v1`, `skipWaiting`+`clients.claim`, and on failed fetch returns cached `/index.html` for any GET (including JS/CSS/image/API failures). Update/offline correctness unverified at runtime. |
| F4 | Med-High | Persistence robustness gaps | `localStorage` `fd_state_v4` only; minimal schema migration/validation/corruption handling/size strategy; import replaces state+reload; backups may include stored API keys; no IndexedDB. |
| F5 | Med | Responsiveness/mobile polish gaps | Partial responsive CSS/media query; no evident safe-area handling, limited touch/accessibility hardening; runtime layout/keyboard behavior untested. |
| F6 | Med | Accessibility & motion gaps | No `prefers-reduced-motion` handling observed; focus/contrast/labels/touch targets not audited; prompt/alert-driven flows present. |
| F7 | Med | Test/tooling gaps | No automated tests; lint dependency missing; typecheck blocked by env/platform package issue; monolithic architecture. |
| F8 | Med | PWA/asset completeness | Manifest has single SVG icon only (no maskable/PNG set/explicit scope-id richness). Android launcher/adaptive/splash assets cannot be fully verified without committed/generated Android resources/APK. |
| F9 | Med | AI/privacy/config dependence | Client-side provider calls with locally stored keys; feature quality depends on config/CORS/network; no server-side protections/RAG/citations. |

## 5. Limitations
- No supplied `app-debug.apk` available for binary/manifest/signature comparison.
- No Android device/emulator runtime tests, no install/launch/offline/update verification on device.
- No automated test execution (none exist); no performance profiling; no dependency vulnerability scan executed.
- TypeScript program check not completed due to platform package limitation in this environment.

## 6. Conclusion (Phase 1/2 static)
**Status: NOT YET PRODUCTION READY.** Critical release/offline/asset and quality gaps remain (F1–F3, F2 release/signing, testing/verification absent). A staged repair, test, and verified release process is required before production claims.
