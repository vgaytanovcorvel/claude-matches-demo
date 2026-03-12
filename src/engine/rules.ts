import type { Rule, RuleResult } from "../types/models.ts";

function runExact(billValue: string, treatmentValue: string): RuleResult {
  return billValue === treatmentValue
    ? { matched: true, score: 1.0 }
    : { matched: false, score: 0 };
}

function runPrefix(
  billValue: string,
  treatmentValue: string,
  params: Record<string, unknown>
): RuleResult {
  const minLength = (params.min_length as number) ?? 3;
  let shared = 0;
  const limit = Math.min(billValue.length, treatmentValue.length);
  for (let i = 0; i < limit; i++) {
    if (billValue[i] === treatmentValue[i]) shared++;
    else break;
  }
  if (shared < minLength) {
    return { matched: false, score: 0 };
  }
  const maxLen = Math.max(billValue.length, treatmentValue.length);
  return { matched: true, score: shared / maxLen };
}

function runDateInRange(
  dos: string,
  rangeStr: string,
  params: Record<string, unknown>
): RuleResult {
  const decayPerDay = (params.decay_per_day as number) ?? 0.02;
  const maxDays = (params.max_days as number) ?? 30;

  const [startStr, endStr] = rangeStr.split(",");
  const dosMs = new Date(dos).getTime();
  const startMs = new Date(startStr).getTime();
  const endMs = new Date(endStr).getTime();
  const msPerDay = 86_400_000;

  if (dosMs >= startMs && dosMs <= endMs) {
    return { matched: true, score: 1.0 };
  }

  const daysOutside =
    dosMs < startMs
      ? (startMs - dosMs) / msPerDay
      : (dosMs - endMs) / msPerDay;

  if (daysOutside > maxDays) {
    return { matched: true, score: 0 };
  }

  return { matched: true, score: Math.max(0, 1.0 - daysOutside * decayPerDay) };
}

export function executeRule(
  rule: Rule,
  billValue: string,
  treatmentValue: string
): RuleResult {
  const params = rule.params ?? {};
  switch (rule.type) {
    case "exact":
      return runExact(billValue, treatmentValue);
    case "prefix":
      return runPrefix(billValue, treatmentValue, params);
    case "date_in_range":
      return runDateInRange(billValue, treatmentValue, params);
    default:
      return { matched: false, score: 0 };
  }
}
