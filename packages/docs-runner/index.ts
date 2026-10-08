import { PaymentClient } from "../sdk-launchpad/index.ts";
export async function checkQuickstart(
  base: string,
  path: string,
  runId: string,
) {
  const client = new PaymentClient(base);
  const result = await client.createPayment(1, `${runId}:docs`, "happy", path);
  return {
    status: result.status,
    expected: 201,
    path,
    passed: result.status === 201,
    nextAction:
      result.status === 201
        ? "Example matches the local payment fixture"
        : "Replace the stale endpoint with /payments. Re-run the fixture example.",
  };
}
