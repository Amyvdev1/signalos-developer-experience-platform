# Five-minute walkthrough

Start with the README commands. Run the default timeout investigation. In **Contract**, identify the missing 429 schema and retry guidance. In **Reliability**, inspect the first deadline failure and successful retry; the duplicate-protection result shows one persisted operation. The stale quickstart creates a separate 404 evidence item.

Open **Agent controls**. `billing-agent` plus `payments:create` passes role/scope checks, but the financial side effect remains awaiting confirmation. Return to the approval panel and reject; zero agent operations are created. Start a new investigation and approve. Refresh: the completed run survives.

Compare the stricter policy: the $125 amount exceeds its $50 limit and is denied. Select the original run in history; its completed state and original policy are unchanged.

For economics, mark tool price unknown before a new investigation. Total cost and savings read Unknown; the system asks for measurement. Try zero manual baseline or high failure loss to get a no-automation recommendation.

Export Markdown and HTML; compare provenance and limitations with the console. Run `npm test` and `npm run test:e2e` to repeat the behavior from source.
