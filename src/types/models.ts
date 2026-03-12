// --- Domain entities ---

export interface Treatment {
  treatment_id: string;
  provider_id: string;
  cpt: string;
  units_approved: number;
  start_date: string; // ISO date
  end_date: string;
}

export interface ChargeLine {
  line_id: string;
  provider_id: string;
  cpt: string;
  units: number;
  dos: string; // ISO date
}

// --- Matching engine ---

export type RuleType = "exact" | "prefix" | "date_in_range";

export interface Rule {
  rule_id: string;
  priority: number;
  type: RuleType;
  params?: Record<string, unknown>;
}

export interface RuleResult {
  matched: boolean;
  score: number;
}

export type GateMode = "required" | "optional";

export interface GateConfig {
  gate_id: string;
  bill_field: string;
  treatment_field: string; // comma-separated for multi-field (e.g. "start_date,end_date")
  mode: GateMode;
  weight: number;
  rules: Rule[];
}

export interface GateResult {
  gate_id: string;
  present: boolean;
  score: number;
  rule_used: string | null;
}

// --- Match output ---

export interface MatchVector {
  [gate_id: string]: number;
}

export interface MatchCandidate {
  candidate_id: string;
  line_id: string;
  treatment_id: string;
  vector: MatchVector;
  gate_details: GateResult[];
  composite_score: number;
  units_allocated: number;
}

// --- Allocation ---

export type AllocationStatus = "Pending" | "Approved" | "Rejected";

export interface Allocation {
  allocation_id: string;
  candidate_id: string;
  line_id: string;
  treatment_id: string;
  units_allocated: number;
  status: AllocationStatus;
}
