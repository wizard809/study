# SECURITY_REPORT.md — Focus Deck

**Commit context:** audit/repair iterations on `main` (2026-11-15) | **Assessment type:** Static review (no dynamic pen-test, no dependency audit tooling executed)

## Summary
Focus Deck is a local-first client app with optional browser-direct AI provider calls. No server-side component is included in-repo. Key security/privacy considerations relate to local secret handling (API keys), backup contents, service worker behavior, input/rendering surfaces, and Android/WebView/release configuration managed largely outside the committed repo.

## Findings & observations

| ID | Severity | Area | Observation | Status / Recommendation |
|---|---|---|---|---|
| S1 | Medium | API keys & secrets | AI provider API keys and MCP settings are stored in local app state (`localStorage`) and included in backups by default. No hardcoded production secrets found in source/assets. | **Open (mitigated partially):** UI warnings added; consider explicit redaction option on export and/or secure storage strategies. Never commit keys/keystores. |
| S2 | Medium | Client-side provider calls | Tutor/assist features send prompts/data directly from browser to configured endpoints; subject to CORS, endpoint trust, and data exposure to chosen provider. | **Open:** Document privacy implications; users must trust/configure providers appropriately. No unintended telemetry added. |
| S3 | Low-Medium | Backup import/restore | Import replaces local state; malformed inputs previously risky. Validation/sanitization and recovery backup added. | **Improved:** Continue hardening (size limits, stricter schema/version checks) and test thoroughly. |
| S4 | Low-Medium | Service worker fetch handling | Prior SW could return HTML for failed asset requests; updated to navigation-only fallback and safer asset handling. | **Improved (code):** Requires runtime/offline verification to confirm no leakage/mis-caching issues. |
| S5 | Low | XSS/input handling | React rendering generally escapes content; some user content rendered in text/textarea contexts. No `dangerouslySetInnerHTML` observed in sampled audit. | **Monitor:** Maintain safe rendering practices; validate/limit imported data. |
| S6 | Low | External links/navigation | Resources may store/open URLs; ensure `rel="noreferrer"` and user awareness (present in places). | **Review:** Validate URL schemes where appropriate. |
| S7 | Info | Android/WebView/release | `android/` project not committed; Capacitor defaults and release hardening (network security config, cleartext, WebView settings, minify/signing) depend on generated config and CI secrets. | **Open/Unverified:** Verify generated Android manifest/Gradle settings and signed artifacts before release. |
| S8 | Info | Dependency vulnerabilities | No `npm audit`/SCA executed in this session. | **Open:** Run dependency audit and update as needed. |
| S9 | Info | Logging | No sensitive logging intentionally added; console info for SW update only. | **OK (observed).** |

## Privacy
- Data is stored locally by design; no analytics/tracking added. AI features may transmit user-provided content to third-party providers when configured by the user.

## Conclusion
No critical secret exposure in repository identified. Primary risks are **local key/backup handling**, **provider data sharing by design**, and **unverified Android/release/security posture**. Further hardening and verification required before production claims.
