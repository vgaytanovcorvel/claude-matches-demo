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
  allocatedUnits,
  onAllocate,
}: {
  candidate: MatchCandidate;
  auth: Authorization;
  lineAvail: number;
  authAvail: number;
  allocatedUnits: number | null;
  onAllocate: (candidate: MatchCandidate, units: number) => void;
}) {
  const hasAllocation = allocatedUnits !== null;
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
        <VectorCell vector={candidate.vector} />
      </td>
      <td>
        <div className="auth-detail">
          <span className="auth-id">{auth.auth_id}</span>
          <span className="detail-field">
            CPT <strong>{auth.cpt}</strong>
          </span>
          <span className="detail-field">
            {auth.units_authorized}u (<strong className="avail-highlight">{authAvail} avail</strong>)
          </span>
          <span className="detail-field">
            {auth.start_date} to {auth.end_date}
          </span>
        </div>
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
          <span style={{ color: "#666" }}>{hasAllocation ? allocatedUnits : "0"}</span>
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
      <td>
        {hasAllocation && <span className="pinned-icon" title="Allocated">&#x1F4CC;</span>}
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
  const allocMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of allocations) m.set(a.candidate_id, a.units_allocated);
    return m;
  }, [allocations]);
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
            {line.units}u (<strong className="avail-highlight">{lineAvail} remaining</strong>)
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
              <th>Vector</th>
              <th>Authorization</th>
              <th>Units</th>
              <th></th>
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
                  allocatedUnits={allocMap.get(c.candidate_id) ?? null}
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
