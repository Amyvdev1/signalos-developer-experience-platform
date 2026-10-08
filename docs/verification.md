# Verification record

Verified locally on 2026-10-08 with Node 24.19.0:

- Strict TypeScript check: passed.
- 44 engine, offline-client, HTTP integration, persistence, policy and report tests: passed; zero failures, zero skipped.
- Production console build: passed (28 modules; JavaScript about 64.7 kB gzip).
- Chromium desktop 1440×1000 and mobile 390×844: investigation, explicit approval, persisted reload, all evidence views, Markdown download and stricter-policy replay passed without horizontal overflow or browser runtime errors.
- Four generated report formats: passed. Automated reports intentionally retain awaiting-approval status.
- npm dependency audit: zero reported vulnerabilities at verification time.

The local HTTP timeout occurs after the fixture writes its operation. Retry uses the same persisted key. This verifies the simulated recovery design; it does not test an external payment provider.

Cloud hosting, production identities, Docker, npm publication, real AI/model execution, external webhooks, load testing and real developer behavior were not evaluated.

The published GitHub Actions run is the independent repeatable verification record. Its report/screenshots are downloadable artifacts; it does not modify repository authorship.
