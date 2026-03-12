import { describe, it, expect } from "vitest";
import { generateCandidates, evaluatePair } from "./matcher.ts";
import type {
  Authorization,
  ChargeLine,
  GateConfig,
} from "../types/models.ts";
import authorizations from "../data/authorizations.json";
import chargeLines from "../data/charge-lines.json";
import gateConfig from "../data/gate-config.json";

const auths = authorizations as Authorization[];
const lines = chargeLines as ChargeLine[];
const gates = gateConfig as GateConfig[];

describe("gate engine", () => {
  it("exact provider + exact CPT + DOS in range → score 1.0", () => {
    const line: ChargeLine = {
      line_id: "t1",
      provider_id: "prov_100",
      cpt: "99213",
      units: 2,
      dos: "2026-02-10",
    };
    const auth: Authorization = {
      auth_id: "a1",
      provider_id: "prov_100",
      cpt: "99213",
      units_authorized: 8,
      start_date: "2026-01-01",
      end_date: "2026-06-30",
    };
    const candidate = evaluatePair(line, auth, gates);
    expect(candidate).not.toBeNull();
    expect(candidate!.composite_score).toBe(1.0);
    expect(candidate!.vector.provider).toBe(1.0);
    expect(candidate!.vector.cpt).toBe(1.0);
    expect(candidate!.vector.dos).toBe(1.0);
  });

  it("different provider (required, score 0) → candidate with reduced composite", () => {
    const line: ChargeLine = {
      line_id: "t2",
      provider_id: "prov_999",
      cpt: "99213",
      units: 1,
      dos: "2026-02-10",
    };
    const auth: Authorization = {
      auth_id: "a1",
      provider_id: "prov_100",
      cpt: "99213",
      units_authorized: 8,
      start_date: "2026-01-01",
      end_date: "2026-06-30",
    };
    const candidate = evaluatePair(line, auth, gates);
    expect(candidate).not.toBeNull();
    expect(candidate!.vector.provider).toBe(0);
    expect(candidate!.composite_score).toBeLessThan(1.0);
  });

  it("required gate with missing value → no candidate", () => {
    const line: ChargeLine = {
      line_id: "t2b",
      provider_id: "",
      cpt: "99213",
      units: 1,
      dos: "2026-02-10",
    };
    const auth: Authorization = {
      auth_id: "a1",
      provider_id: "prov_100",
      cpt: "99213",
      units_authorized: 8,
      start_date: "2026-01-01",
      end_date: "2026-06-30",
    };
    const candidate = evaluatePair(line, auth, gates);
    expect(candidate).toBeNull();
  });

  it("CPT prefix match (99215 vs 99214) → fuzzy score < 1", () => {
    const line: ChargeLine = {
      line_id: "t3",
      provider_id: "prov_100",
      cpt: "99215",
      units: 1,
      dos: "2026-03-01",
    };
    const auth: Authorization = {
      auth_id: "a2",
      provider_id: "prov_100",
      cpt: "99214",
      units_authorized: 4,
      start_date: "2026-01-01",
      end_date: "2026-06-30",
    };
    const candidate = evaluatePair(line, auth, gates);
    expect(candidate).not.toBeNull();
    expect(candidate!.vector.cpt).toBeGreaterThan(0);
    expect(candidate!.vector.cpt).toBeLessThan(1.0);
    expect(candidate!.composite_score).toBeLessThan(1.0);
  });

  it("DOS outside auth window → reduced dos score", () => {
    const line: ChargeLine = {
      line_id: "t4",
      provider_id: "prov_200",
      cpt: "97110",
      units: 2,
      dos: "2026-05-15", // 15 days past end_date 2026-04-30
    };
    const auth: Authorization = {
      auth_id: "a3",
      provider_id: "prov_200",
      cpt: "97110",
      units_authorized: 12,
      start_date: "2026-02-01",
      end_date: "2026-04-30",
    };
    const candidate = evaluatePair(line, auth, gates);
    expect(candidate).not.toBeNull();
    expect(candidate!.vector.dos).toBeLessThan(1.0);
    expect(candidate!.vector.dos).toBeCloseTo(1.0 - 15 * 0.02, 2); // 0.70
  });

  it("generates candidates from mock data", () => {
    const candidates = generateCandidates(lines, auths, gates);
    expect(candidates.length).toBeGreaterThan(0);
    // sorted descending
    for (let i = 1; i < candidates.length; i++) {
      expect(candidates[i - 1].composite_score).toBeGreaterThanOrEqual(
        candidates[i].composite_score
      );
    }
  });

  it("optional gate missing → excluded, not penalized", () => {
    // Remove dos from line to simulate missing value
    const line: ChargeLine = {
      line_id: "t5",
      provider_id: "prov_100",
      cpt: "99213",
      units: 1,
      dos: "", // empty = missing
    };
    const auth: Authorization = {
      auth_id: "a1",
      provider_id: "prov_100",
      cpt: "99213",
      units_authorized: 8,
      start_date: "2026-01-01",
      end_date: "2026-06-30",
    };
    const candidate = evaluatePair(line, auth, gates);
    expect(candidate).not.toBeNull();
    // Only provider + cpt active, both exact → 1.0
    expect(candidate!.composite_score).toBe(1.0);
    expect(candidate!.vector.dos).toBeUndefined();
  });
});
