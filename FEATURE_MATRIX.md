# FEATURE_MATRIX.md — Focus Deck

Legend: **V** = Implemented and verified (evidence noted), **D** = Implemented but defective/risky, **P** = Partially implemented, **U** = UI placeholder/foundation only, **N** = Not implemented, **?** = Unable to verify (runtime/device/artifact not tested).

| # | Feature / Area | Status | Evidence (static/code/build) | Runtime/Device Verification | Notes |
|---|---|---:|---|---|---|
| 1 | App shell, branding, routing (15 modules) | D | `nav.tsx` 15 destinations; state-based navigation in `App.tsx`; build passes. Favicon ref broken (`/vite.svg` missing). | ? | Core shell present; asset/brand correctness needs fix & runtime check. |
| 2 | Dashboard / study overview (Home) | P | Home KPIs, tasks/schedule preview, goals/study-day signals, recommendations, quick links. | ? | Data-driven UI exists; correctness across edge cases untested. |
| 3 | AI Tutor | P | Chat UI + provider fetch (Ollama/OpenAI-compatible/Anthropic/Gemini/custom) with fallbacks; config in Settings. | ? | Works only when configured/CORS/network allow; no RAG/citations/ingestion; not a static mock, but environment-dependent. |
| 4 | Study planner & timetable | P | Weekly grid, add/edit/duplicate/delete/repeat events, generate plan, subject link/filter, print/export. | ? | CRUD flows implemented in code; drag/reschedule advanced UX limited. |
| 5 | Tasks & assignments | P | Task CRUD (priority/due/subject), pending/completed, integration with planner/home/exams workflows. | ? | No reminders/notifications backend; persistence behavior untested at scale. |
| 6 | Focus timer & study sessions | P | Timer start/pause/reset, session logging/history/stats, blocklist reminders. | ? | Session persistence/long-run behavior untested. |
| 7 | Notes | P | CRUD/search/tags, subject/chapter links, checklist tasks, text import, `.md` export, create flashcard, AI assist on text. | ? | Not a rich block editor with backlinks/version history (planned/limited). |
| 8 | Flashcards & revision scheduling | P | Decks/cards CRUD/edit/filter, SM-2-style scheduling (`reviewCard`), due review, generate from topics, create quiz from deck. | ? | Algorithm/basic flow present; full FSRS/advanced card types not implemented. |
| 9 | Quiz Centre | P | Quiz/question CRUD (MCQ), take/review, attempts, timed mode, generate from flashcards. | ? | Limited question types; simulation depth partial. |
| 10 | Timed quizzes | P | Timed attempt option/countdown/timeout handling in quiz flow. | ? | Behavior under edge cases not runtime-tested. |
| 11 | Mind maps | P | Multi-map tree editor (child/sibling/move/collapse/edit/delete), subject link, duplicate, JSON/outline export, JSON import. | ? | Not an advanced canvas/graph editor. |
| 12 | Resource Library | P | Resource CRUD/search/filter, type/subject/URL/notes, create note from resource. | ? | File/storage backend absent; metadata/content handling limited. |
| 13 | Documents | P | Entries + browser text import/preview for text formats, metadata for PDF/others, subject link, create note, AI summarize on provided text. | ? | No full viewer/extraction/annotations/storage/RAG-citations pipeline. |
| 14 | Study Groups | U | Local group create/list/remove with basic fields. | ? | No real-time collaboration, sharing, sync, or backend. |
| 15 | Progress tracking & analytics | P | Metrics, goals, progress/insights/gaps from local data. | ? | Estimates transparent; advanced charts/reports limited. |
| 16 | Settings | P | Profile/theme, backup export/import/reset, AI providers & MCP config storage. | ? | Import/validation robustness and key-handling risks need hardening. |
| 17 | Data backup & restoration | D/P | Export/import JSON and reset exist; import replaces storage and reloads with minimal validation/migration. | ? | Reliability/corruption/compatibility not fully verified (F4). |
| 18 | Data persistence (local) | D | `localStorage` `fd_state_v4` load/save/merge defaults; broad fallback on parse failure. | ? | Survives reload/restart in principle; corruption/size/migration safety limited (F4). |
| 19 | PWA manifest | D | `manifest.webmanifest` present (standalone, theme, single SVG icon). | ? | Icon set/scope/maskable/install UX incomplete (F8). |
| 20 | Service worker / offline | D | `sw.js` registered; caches 3 URLs, naive fetch fallback to index.html. | ? | Hashed assets/offline/update behavior likely defective (F3). |
| 21 | Android/Capacitor integration | D | `capacitor.config.ts` correct ids; APK workflow generates android & builds debug. | ? | No committed android project, debug-only, no release/signing verification (F2). |
| 22 | Automated tests | N | None found. | N/A | No unit/component/integration/e2e coverage. |
| 23 | Accessibility & reduced motion | ?/D | Basic semantic elements in places but no systematic audit; no `prefers-reduced-motion`. | ? | Requires remediation and testing (F6). |
| 24 | Performance optimization (measured) | ? | Vite production build succeeds; single main bundle (~319 kB JS). | ? | No profiling/lazy-loading audit completed (bundle size noted). |

**Summary:** Core learning/productivity modules are **present/partially implemented** with local-first behavior; several platform/reliability/release concerns are **defective/risky** and runtime verification remains largely pending.
