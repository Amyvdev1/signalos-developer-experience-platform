import type { RunInput } from "../shared/types.ts";
export function economics(input: RunInput, attempts: number) {
  const review = (input.reviewMinutes * input.hourlyRate) / 60,
    manual = (input.manualMinutes * input.hourlyRate) / 60;
  const total =
    input.toolCost === null
      ? null
      : attempts * input.toolCost +
        review +
        input.failureProbability * input.failureLoss;
  const savings = total === null ? null : manual - total;
  return {
    total,
    manual,
    savings,
    recommendation:
      savings === null
        ? "Measure missing tool costs before deciding"
        : savings <= 0
          ? "Do not automate yet"
          : "Partial automation with human approval",
    formula:
      "attempts × estimated tool cost + review minutes × hourly rate / 60 + failure probability × failure loss",
  };
}
