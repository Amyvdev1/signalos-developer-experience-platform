import { z } from "zod";
export type Payment = { id: string; amount: number; duplicate: boolean };
const paymentResponse = z
  .object({
    id: z.string().min(1),
    amount: z.number().int().positive(),
    duplicate: z.boolean(),
  })
  .strict();
const errorResponse = z.object({ error: z.object({ code: z.string() }) });
export class PaymentClient {
  base: string;
  transport: typeof fetch;
  constructor(base: string, transport: typeof fetch = fetch) {
    const url = new URL(base);
    if (
      url.protocol !== "http:" ||
      !["127.0.0.1", "localhost"].includes(url.hostname)
    )
      throw new Error("SDK fixture transport is loopback only");
    this.base = url.origin;
    this.transport = transport;
  }
  async createPayment(
    amount: number,
    key: string,
    scenario = "happy",
    path = "/payments",
  ): Promise<{
    status: number;
    body: Payment | { error: { code: string } };
    requestId: string | null;
    traceId: string | null;
  }> {
    const response = await this.transport(this.base + "/api/fixture" + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer synthetic-demo",
        "Idempotency-Key": key,
        "X-Fixture-Scenario": scenario,
        "X-Trace-ID": key.split(":")[0],
      },
      body: JSON.stringify({ amount }),
      signal: AbortSignal.timeout(250),
    });
    const body: unknown = await response.json();
    return {
      status: response.status,
      requestId: response.headers.get("X-Request-ID"),
      traceId: response.headers.get("X-Trace-ID"),
      body:
        response.status === 201
          ? paymentResponse.parse(body)
          : errorResponse.parse(body),
    };
  }
}
