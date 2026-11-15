# ARCHITECTURE_REPORT.md — Focus Deck

**Commit:** `4d7d601`+ (audit/repair iterations, 2026-11-15) | **App:** Focus Deck (`com.focusdeck.app`)

## Overview
Focus Deck is a local-first, client-side learning/productivity SPA built with **React 19 + TypeScript + Vite 6**, packaged for Android via **Capacitor** configuration and distributed as a PWA-capable web build. The repository currently contains the web app, PWA assets, Capacitor config, and CI workflows; the native Android project is generated during CI/build rather than committed.

## Runtime architecture
- **Entry/render:** `index.html` → `src/main.tsx` mounts `src/App.tsx` into `#root` (React StrictMode) and registers `public/sw.js`.
- **UI composition:** Predominantly monolithic `App.tsx` containing navigation shell, command/search, and feature modules for 15 destinations (`src/lib/nav.tsx`). Styling via global CSS (`src/index.css`, `src/App.css`) with CSS variables.
- **Routing:** In-app state-driven destination switching (no URL router library).
- **State & domain model:** Single `AppState` tree (`src/types/index.ts`) covering subjects/chapters/topics, notes, timetable, mind maps, focus sessions, tasks, decks/flashcards, quizzes/attempts, exams/syllabus, resources, groups, blocklist, AI providers, MCP configs, settings/goals.
- **Persistence:** `src/lib/store.ts` — `localStorage` key `fd_state_v4` (legacy read fallbacks), load/save with sanitization/default-merge, corruption copy safeguard, backup import/export helpers (UI-level). No IndexedDB, no remote backend/sync.
- **AI integration:** Client-side `fetch` calls to user-configured providers (Ollama/OpenAI-compatible/Anthropic/Gemini/custom) for tutor/assist features; configuration stored locally. No server-side RAG/index/citations.
- **PWA/offline:** `public/manifest.webmanifest` + `public/sw.js` (versioned app-shell/navigation handling and same-origin asset caching strategy as updated in repairs; effectiveness requires runtime validation).
- **Android packaging:** `capacitor.config.ts` (`appId com.focusdeck.app`, `appName Focus Deck`, `webDir dist`, `androidScheme https`). `android/` generated via `cap add/sync` in CI.

## Build & release flow
- **Web:** `vite build` → `dist/` (hashed assets). CI uploads `dist`.
- **Android (CI):** web build → ensure Capacitor → `cap add/sync android` → `gradlew assembleDebug` (always) and optional signed `assembleRelease` when keystore secrets provided → upload artifacts.
- **Gaps:** No committed native project, release signing depends on external secrets (by design), reproducibility/tooling partially improved but not fully validated end-to-end on device.

## Key architectural risks / tradeoffs
- **Monolithic UI:** Large `App.tsx` increases regression/maintainability risk; limited modular boundaries and error isolation.
- **Client-only persistence:** `localStorage` simplicity vs size/quota/robustness limits; no multi-device sync or collaboration backend.
- **Offline strategy:** Custom SW must stay aligned with Vite output and update semantics; requires thorough runtime testing.
- **Security/privacy:** User API keys and data stored locally; backups may contain secrets; browser-direct provider calls subject to CORS/network constraints.
- **Testability:** Lack of automated tests and limited separation of concerns hinder safe refactoring.

## Recommended evolution (future)
- Modularize features/routes and introduce error boundaries + typed validation at boundaries.
- Add automated unit/integration/e2e tests and CI quality gates.
- Strengthen storage (versioned migrations; consider IndexedDB for large content) and export redaction options.
- Formalize PWA/Capacitor asset pipelines and verified release automation with device-level acceptance.
