# Threat model

## Assets / actors

Local run snapshots, fixture payment state and exported evidence. The intended actor is one developer on a trusted local machine. A remote web page, malformed input, hostile contract text or stale tab must not silently mutate the investigation.

## Implemented controls

- Loopback binding plus Host/Origin checks reduce browser cross-site mutation exposure; JSON content type prevents simple form submissions.
- Zod validates arguments and scenario inputs; request size is capped. Known credential fields, private-key markers, non-synthetic Bearer strings and common GitHub token patterns are rejected before persistence.
- Idempotency conflicts reject changed payment amounts; replay namespaces are distinct.
- Approval hashes the parsed arguments and full policy snapshot; expiry and revision checks reject stale acceptance.
- HTML exports escape user text; SQL uses bound parameters; report download IDs are UUIDs rather than arbitrary paths.
- No remote fetch transport, shell execution, live model, payment provider or cloud secret is required.

## Residual risks / boundaries

There is no login, authenticated reviewer, tenant isolation or production RBAC. Anyone with local access can choose fixture roles, operate the console, modify SQLite or read reports. The intake detector is a narrow guard, not comprehensive secret discovery; avoid entering credentials or personal data. SQLite has no application encryption or external audit integrity anchor. Payload hashes are not tamper-evident signatures for the database. HMAC's fixture key is public by design.

The local server is not intended to be exposed through a reverse proxy. Production work requires identities, authenticated approvals, tenant boundaries, hardened secret management, storage encryption/retention, rate limits, monitoring, distributed execution, SSRF-resistant reference handling and a separate security review.
