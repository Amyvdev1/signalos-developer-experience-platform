# Code tour

1. `fixtures/apis/payment.ts`: weak/repaired payment contracts, policy snapshot and default investigation.
2. `packages/contract-engine/index.ts`: supported readiness rules and shallow breaking-change comparison.
3. `packages/reliability-lab/index.ts`: HMAC, payload hashes, duplicate event conflict and logical ordering.
4. `packages/evidence-ledger/migration.sql` and `index.ts`: persisted idempotency, transactional evidence and revisions.
5. `packages/agent-policy/index.ts`: strict tool schema, explicit denial reasons and approval binding.
6. `apps/api/runner.ts`: stitches the investigation together, records provenance and pauses for approval.
7. `apps/api/main.ts`: validated local API and delayed-response payment fixture.
8. `packages/sdk-launchpad`, `docs-runner`, `economics-engine`, `report-renderer`: small modules with honest scope.
9. `apps/console/main.tsx`: interactive configuration, investigation views, approval and replay.
10. `tests/` and `e2e/verify.ts`: failure and recovery behavior through public engine/API/UI boundaries.
