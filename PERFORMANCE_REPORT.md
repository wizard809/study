# PERFORMANCE_REPORT.md — Focus Deck

**Commit context:** audit/repair iterations on `main` (2026-11-15) | **Method:** Build output inspection only (no runtime profiling)

## Measured (build-time)
- **Production build:** `vite build` passes.
- **Main bundle (latest observed):** `dist/assets/index-BB9AP3DY.js` ~321.71 kB (gzip ~92.09 kB).
- **CSS:** `dist/assets/index-Bx1Q4kGe.css` ~6.51 kB (gzip ~2.16 kB).
- **HTML:** `dist/index.html` ~0.72 kB.
- **Modules transformed:** 19 (Vite report).
- **Build time (this environment):** ~0.5–1.6s observed.

## Not measured (required for full assessment)
- Startup time (cold/warm), time-to-interactive, and route/screen render latency on target Android devices.
- Runtime memory usage, storage I/O latency, and behavior with large datasets (many notes/cards/resources).
- Animation/frame performance and main-thread long tasks.
- Network behavior and AI request latency/error handling under real conditions.
- Service worker cache hit/miss and offline performance.

## Observations / risks
- Single monolithic JS bundle includes most UI/feature logic (`App.tsx`-centric); no route-level code splitting/lazy loading implemented.
- `localStorage` read/write of full state on changes may become costly with large data volumes.
- Visual effects (blur/transparency) and frequent re-renders are possible; not profiled.

## Recommendations
- Add runtime profiling (Lighthouse/device traces) on representative low/mid Android hardware.
- Introduce route/feature lazy loading and memoization where beneficial.
- Consider incremental persistence strategies and/or IndexedDB for large collections (with safe migration).
- Re-measure after structural or dependency changes.

## Conclusion
Build artifacts are within a moderate SPA range, but **performance is not validated at runtime**. Production readiness requires measured evidence on target devices.
