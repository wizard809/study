# RELEASE_CHECKLIST.md — Focus Deck

**Status:** NOT YET PRODUCTION READY (as of 2026-11-15, commit in-progress audit/repairs). Use this checklist before any production/release claim.

## Preconditions
- [ ] All critical/high defects in `BUG_REPORT.md` resolved or formally accepted with mitigation.
- [ ] `FEATURE_MATRIX.md` and `TEST_REPORT.md` updated with executed evidence.
- [ ] Data migration/persistence changes validated with backup/restore and no user-data loss.
- [ ] No secrets/keystores committed; CI secrets configured only in secure store.

## Build & signing
- [ ] Web build passes: `npm run build`.
- [ ] Typecheck/lint pass in supported CI/dev environment (note: Termux Android env may lack TS platform package).
- [ ] Capacitor sync succeeds: `npx cap sync android`.
- [ ] **Debug APK** builds and installs/launches on supported device(s): `./gradlew assembleDebug`.
- [ ] **Release APK/AAB** builds with proper signing configuration (keystore provided via secure CI secrets or local secure storage, never committed).
- [ ] APK signature verified (e.g. `apksigner verify --verbose <apk>`).
- [ ] Versioning (`versionCode`/`versionName`, app version) reviewed and incremented as required.

## Functional verification (minimum)
- [ ] Fresh install and first launch.
- [ ] Core flows: create/edit/delete/persist study data across modules.
- [ ] Close/reopen app and browser reload preserve data.
- [ ] Backup export and restore round-trip successful (including validation of malformed/older backups).
- [ ] Offline launch and navigation behave correctly (no HTML served for failed asset/API requests).
- [ ] Online recovery after offline use.
- [ ] Update to newer build preserves user data and service worker updates cleanly.
- [ ] Invalid/corrupted data and recoverable errors handled safely.

## Quality gates
- [ ] Responsive layout tested on narrow/large screens, portrait/landscape, keyboard visible, safe areas.
- [ ] Accessibility checks: focus visibility, labels, contrast, touch targets, reduced-motion behavior.
- [ ] Performance sanity: startup and key interactions acceptable on ordinary Android devices; bundle reviewed.
- [ ] Security/privacy: no exposed secrets in repo/logs/assets, dependency review, backup/key handling warnings, no unintended data exfiltration.

## CI / artifacts
- [ ] `android-apk.yml` debug artifact produced successfully.
- [ ] Release artifact produced only when signing secrets configured (or via secure manual process) and verified.
- [ ] Reports updated: `AUDIT_REPORT.md`, `FEATURE_MATRIX.md`, `BUG_REPORT.md`, `TEST_REPORT.md`, `SECURITY_REPORT.md`, `PERFORMANCE_REPORT.md`, `RELEASE_CHECKLIST.md`, `CHANGELOG.md`, `ARCHITECTURE_REPORT.md`.

## Final decision
- [ ] **GO:** all criteria met with evidence.
- [ ] **NO-GO:** document unmet criteria, risks, and required actions (current expected state until full verification completed).
