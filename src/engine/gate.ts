import type {
  GateConfig,
  GateResult,
  Treatment,
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
  treatment: Treatment
): GateResult {
  const billValue = extractValue(
    line as unknown as Record<string, unknown>,
    gate.bill_field
  );
  const treatmentValue = extractValue(
    treatment as unknown as Record<string, unknown>,
    gate.treatment_field
  );

  // Presence check
  if (billValue == null || treatmentValue == null) {
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
    const result = executeRule(rule, billValue, treatmentValue);
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
