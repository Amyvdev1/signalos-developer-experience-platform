# Local API guide

The server binds to 127.0.0.1:4320. All mutations require application/json; external Origins are rejected. No cloud credentials are used.

| Route | Purpose |
|---|---|
| GET /api/health | Local mode and readiness |
| GET /api/workspace | Default investigation, policy and up to 100 most recent run snapshots |
| POST /api/runs | Validated RunInput; creates an investigation |
| POST /api/runs/:id/approval | {revision: integer, accepted: boolean}; bound, expiring confirmation |
| POST /api/runs/:id/replay | {policyMode: "original" or "stricter"}; creates a separate run |
| GET /api/export?id=UUID&format=markdown | Export json, markdown, html or csv |
| POST /api/fixture/payments | Internal synthetic payment HTTP surface; fixed synthetic-demo Bearer, Idempotency-Key and JSON amount |

RunInput is defined in packages/shared/types.ts and validated in apps/api/runner.ts. Missing/invalid input returns 400, wrong content type 415, oversized body 413, unknown records 404, stale revision or conflicting idempotency key 409. Expected failures have an error.code envelope. Responses carry request and trace IDs in headers; reliability evidence retains the returned correlation IDs.

The fixture is always available in this local-only application; there is no production mode or real payment integration. Demo roles are inputs, not identities. The docs example only contacts the configured local fixture.

Use npm run report to exercise a complete investigation and export the artifacts without pretending to grant human approval.
