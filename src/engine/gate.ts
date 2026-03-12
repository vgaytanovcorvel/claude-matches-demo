import type {
  GateConfig,
  GateResult,
  Authorization,
  ChargeLine,
} from "../types/models.ts";
import { executeRule } from "./rules.ts";

function extractValue(
  obj: Record<string, unknown>,
  fieldSpec: string
): string | null {
  // Multi-field (e.g. "start_date,end_date") → join with comma
  if (fieldSpec.includes(",")) {
    const parts = fieldSpec.split(",").map((f) => obj[f.trim()]);
    if (parts.some((p) => p == null || p === "")) return null;
    return parts.join(",");
  }
  const val = obj[fieldSpec];
  if (val == null || val === "") return null;
  return String(val);
}

export function evaluateGate(
  gate: GateConfig,
  line: ChargeLine,
  auth: Authorization
): GateResult {
  const billValue = extractValue(
    line as unknown as Record<string, unknown>,
    gate.bill_field
  );
  const authValue = extractValue(
    auth as unknown as Record<string, unknown>,
    gate.auth_field
  );

  // Presence check
  if (billValue == null || authValue == null) {
    return {
      gate_id: gate.gate_id,
      present: false,
      score: 0,
      rule_used: null,
    };
  }

  // Run rules in priority order (descending)
  const sorted = [...gate.rules].sort((a, b) => b.priority - a.priority);
  for (const rule of sorted) {
    const result = executeRule(rule, billValue, authValue);
    if (result.matched) {
      return {
        gate_id: gate.gate_id,
        present: true,
        score: result.score,
        rule_used: rule.rule_id,
      };
    }
  }

  // No rule matched
  return {
    gate_id: gate.gate_id,
    present: true,
    score: 0,
    rule_used: null,
  };
}
