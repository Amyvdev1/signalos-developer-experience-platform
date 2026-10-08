import { createHmac, timingSafeEqual, createHash } from "node:crypto";
export const demoSecret = "synthetic-hmac-fixture-not-a-credential";
export function sign(body: string, timestamp: number, secret = demoSecret) {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
}
export function verify(
  body: string,
  timestamp: number,
  signature: string,
  now: number,
  window = 300,
): boolean {
  if (
    !Number.isFinite(timestamp) ||
    Math.abs(now - timestamp) > window ||
    !/^[a-f0-9]{64}$/.test(signature)
  )
    return false;
  return timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(sign(body, timestamp), "hex"),
  );
}
export function payloadHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
export function eventOrder(
  events: { id: string; sequence: number; receivedAt: number }[],
) {
  const unique = new Map<
    string,
    { id: string; sequence: number; receivedAt: number }
  >();
  for (const e of events) {
    const prior = unique.get(e.id);
    if (prior && prior.sequence !== e.sequence)
      throw new Error("conflicting_event_id");
    if (!prior) unique.set(e.id, e);
  }
  return [...unique.values()].sort((a, b) => a.sequence - b.sequence);
}
