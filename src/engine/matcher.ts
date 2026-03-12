import type {
  Authorization,
  ChargeLine,
  GateConfig,
  GateResult,
  MatchCandidate,
  MatchVector,
} from "../types/models.ts";
import { evaluateGate } from "./gate.ts";

let candidateCounter = 0;

function nextCandidateId(): string {
  candidateCounter++;
  return `match_${String(candidateCounter).padStart(3, "0")}`;
}

export function resetCandidateCounter(): void {
  candidateCounter = 0;
}

function computeComposite(
  gateResults: GateResult[],
  gates: GateConfig[]
): number | null {
  // If any required gate has missing values → no match
  for (const gate of gates) {
    if (gate.mode === "required") {
      const result = gateResults.find((r) => r.gate_id === gate.gate_id);
      if (!result || !result.present) return null;
    }
  }

  // Weighted average over active (present) gates only
  let weightSum = 0;
  let scoreSum = 0;
  for (const gate of gates) {
    const result = gateResults.find((r) => r.gate_id === gate.gate_id);
    if (result && result.present) {
      scoreSum += result.score * gate.weight;
      weightSum += gate.weight;
    }
  }

  if (weightSum === 0) return null;
  return scoreSum / weightSum;
}

export function evaluatePair(
  line: ChargeLine,
  auth: Authorization,
  gates: GateConfig[]
): MatchCandidate | null {
  const gateResults: GateResult[] = gates.map((gate) =>
    evaluateGate(gate, line, auth)
  );

  const composite = computeComposite(gateResults, gates);
  if (composite === null || composite === 0) return null;

  const vector: MatchVector = {};
  for (const r of gateResults) {
    if (r.present) {
      vector[r.gate_id] = r.score;
    }
  }

  return {
    candidate_id: nextCandidateId(),
    line_id: line.line_id,
    auth_id: auth.auth_id,
    vector,
    gate_details: gateResults,
    composite_score: Math.round(composite * 1000) / 1000,
    units_allocated: line.units, // default: suggest full line units
  };
}

export function generateCandidates(
  lines: ChargeLine[],
  auths: Authorization[],
  gates: GateConfig[]
): MatchCandidate[] {
  resetCandidateCounter();
  const candidates: MatchCandidate[] = [];

  for (const line of lines) {
    for (const auth of auths) {
      const candidate = evaluatePair(line, auth, gates);
      if (candidate) {
        candidates.push(candidate);
      }
    }
  }

  // Sort by composite score descending
  candidates.sort((a, b) => b.composite_score - a.composite_score);
  return candidates;
}
