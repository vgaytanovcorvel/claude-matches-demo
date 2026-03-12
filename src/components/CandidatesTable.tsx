import { useState, useMemo, useEffect } from "react";
import type {
  Allocation,
  Authorization,
  ChargeLine,
  MatchCandidate,
} from "../types/models.ts";
import { ScoreCell, VectorCell } from "./ScoreCell.tsx";

interface Props {
  candidates: MatchCandidate[];
  lines: ChargeLine[];
  auths: Authorization[];
  allocations: Allocation[];
  lineRemaining: (lineId: string) => number;
  authRemaining: (authId: string) => number;
  onAllocate: (candidate: MatchCandidate, units: number) => void;
}

function CandidateRow({
  candidate,
  auth,
  lineAvail,
  authAvail,
  hasAllocation,
  onAllocate,
}: {
  candidate: MatchCandidate;
  auth: Authorization;
  lineAvail: number;
  authAvail: number;
  hasAllocation: boolean;
  onAllocate: (candidate: MatchCandidate, units: number) => void;
}) {
  const maxUnits = Math.min(lineAvail, authAvail);
  const [units, setUnits] = useState(maxUnits);

  useEffect(() => {
    setUnits((prev) => Math.min(prev, maxUnits) || maxUnits);
  }, [maxUnits]);

  const canAllocate =
    !hasAllocation && maxUnits > 0 && units > 0 && units <= maxUnits;

  return (
    <tr className="candidate-row">
      <td>
        <ScoreCell score={candidate.composite_score} />
      </td>
      <td>
        <div className="auth-detail">
          <span className="auth-id">{auth.auth_id}</span>
          <span className="detail-field">
            CPT <strong>{auth.cpt}</strong>
          </span>
          <span className="detail-field">
            {auth.units_authorized}u ({authAvail} avail)
          </span>
          <span className="detail-field">
            {auth.start_date} to {auth.end_date}
          </span>
        </div>
      </td>
      <td>
        <VectorCell vector={candidate.vector} />
      </td>
      <td>
        {maxUnits > 0 && !hasAllocation ? (
          <input
            type="number"
            className="units-input"
            min={1}
            max={maxUnits}
            value={units}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v)) setUnits(Math.max(1, Math.min(v, maxUnits)));
            }}
          />
        ) : (
          <span style={{ color: "#666" }}>{hasAllocation ? "-" : "0"}</span>
        )}
      </td>
      <td>
        <button
          className="btn"
          disabled={!canAllocate}
          onClick={() => onAllocate(candidate, units)}
        >
          {hasAllocation ? "Allocated" : "Allocate"}
        </button>
      </td>
    </tr>
  );
}

function LineGroup({
  line,
  candidates,
  auths,
  allocations,
  lineRemaining,
  authRemaining,
  onAllocate,
}: {
  line: ChargeLine;
  candidates: MatchCandidate[];
  auths: Authorization[];
  allocations: Allocation[];
  lineRemaining: (lineId: string) => number;
  authRemaining: (authId: string) => number;
  onAllocate: (candidate: MatchCandidate, units: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const allocated = new Set(allocations.map((a) => a.candidate_id));
  const authMap = useMemo(() => {
    const m = new Map<string, Authorization>();
    for (const a of auths) m.set(a.auth_id, a);
    return m;
  }, [auths]);

  const lineAvail = lineRemaining(line.line_id);

  return (
    <div className="line-group">
      <div className="line-header" onClick={() => setExpanded(!expanded)}>
        <span className="expand-icon">{expanded ? "\u25BC" : "\u25B6"}</span>
        <div className="line-detail">
          <span className="line-id">{line.line_id}</span>
          <span className="detail-field">
            Provider <strong>{line.provider_id}</strong>
          </span>
          <span className="detail-field">
            CPT <strong>{line.cpt}</strong>
          </span>
          <span className="detail-field">
            {line.units}u ({lineAvail} remaining)
          </span>
          <span className="detail-field">DOS {line.dos}</span>
        </div>
        <span className="candidate-count">
          {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
        </span>
      </div>
      {expanded && (
        <table className="candidates-subtable">
          <thead>
            <tr>
              <th>Score</th>
              <th>Authorization</th>
              <th>Vector</th>
              <th>Units</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => {
              const auth = authMap.get(c.auth_id);
              if (!auth) return null;
              return (
                <CandidateRow
                  key={c.candidate_id}
                  candidate={c}
                  auth={auth}
                  lineAvail={lineAvail}
                  authAvail={authRemaining(c.auth_id)}
                  hasAllocation={allocated.has(c.candidate_id)}
                  onAllocate={onAllocate}
                />
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function CandidatesTable({
  candidates,
  lines,
  auths,
  allocations,
  lineRemaining,
  authRemaining,
  onAllocate,
}: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, MatchCandidate[]>();
    for (const c of candidates) {
      const arr = map.get(c.line_id) ?? [];
      arr.push(c);
      map.set(c.line_id, arr);
    }
    return map;
  }, [candidates]);

  return (
    <div className="candidates-panel">
      {lines.map((line) => {
        const lineCandidates = grouped.get(line.line_id) ?? [];
        return (
          <LineGroup
            key={line.line_id}
            line={line}
            candidates={lineCandidates}
            auths={auths}
            allocations={allocations}
            lineRemaining={lineRemaining}
            authRemaining={authRemaining}
            onAllocate={onAllocate}
          />
        );
      })}
    </div>
  );
}
