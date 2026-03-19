import { useState, useMemo, useEffect } from "react";
import type {
  Allocation,
  Treatment,
  ChargeLine,
  MatchCandidate,
} from "../types/models.ts";
import { ScoreCell, VectorCell } from "./ScoreCell.tsx";

interface Props {
  candidates: MatchCandidate[];
  lines: ChargeLine[];
  treatments: Treatment[];
  allocations: Allocation[];
  lineRemaining: (lineId: string) => number;
  treatmentRemaining: (treatmentId: string) => number;
  onAllocate: (candidate: MatchCandidate, units: number) => void;
  onDeleteAllocation: (allocationId: string) => void;
}

function CandidateRow({
  candidate,
  treatment,
  lineAvail,
  treatmentAvail,
  allocation,
  onAllocate,
  onDeleteAllocation,
}: {
  candidate: MatchCandidate;
  treatment: Treatment;
  lineAvail: number;
  treatmentAvail: number;
  allocation: Allocation | null;
  onAllocate: (candidate: MatchCandidate, units: number) => void;
  onDeleteAllocation: (allocationId: string) => void;
}) {
  const hasAllocation = allocation !== null;
  const allocatedUnits = allocation?.units_allocated ?? null;
  const maxUnits = Math.min(lineAvail, treatmentAvail);
  const [units, setUnits] = useState(maxUnits);

  useEffect(() => {
    setUnits((prev) => Math.min(prev, maxUnits) || maxUnits);
  }, [maxUnits]);

  const canAllocate =
    !hasAllocation && maxUnits > 0 && units > 0 && units <= maxUnits;

  return (
    <tr className={`candidate-row${candidate.composite_score < 0.5 ? " low-confidence" : ""}`}>
      <td>
        <ScoreCell score={candidate.composite_score} vector={candidate.vector} />
      </td>
      <td>
        <VectorCell vector={candidate.vector} />
      </td>
      <td>
        <div className="treatment-detail">
          <span className="treatment-id">{treatment.treatment_id}</span>
          <span className="detail-field">
            CPT <strong>{treatment.cpt}</strong>
          </span>
          <span className="detail-field">
            {treatment.units_approved} units (<strong className="avail-highlight">{treatmentAvail} avail</strong>)
          </span>
          <span className="detail-field">
            {treatment.start_date} to {treatment.end_date}
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
        {hasAllocation && (
          <button
            className="pinned-icon btn-icon"
            title="Remove allocation"
            onClick={() => onDeleteAllocation(allocation!.allocation_id)}
          >
            &#x1F4CC;
          </button>
        )}
      </td>
    </tr>
  );
}

function LineGroup({
  line,
  candidates,
  treatments,
  allocations,
  lineRemaining,
  treatmentRemaining,
  onAllocate,
  onDeleteAllocation,
  hideLC,
}: {
  line: ChargeLine;
  candidates: MatchCandidate[];
  treatments: Treatment[];
  allocations: Allocation[];
  lineRemaining: (lineId: string) => number;
  treatmentRemaining: (treatmentId: string) => number;
  onAllocate: (candidate: MatchCandidate, units: number) => void;
  onDeleteAllocation: (allocationId: string) => void;
  hideLC: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const allocMap = useMemo(() => {
    const m = new Map<string, Allocation>();
    for (const a of allocations) m.set(a.candidate_id, a);
    return m;
  }, [allocations]);
  const treatmentMap = useMemo(() => {
    const m = new Map<string, Treatment>();
    for (const a of treatments) m.set(a.treatment_id, a);
    return m;
  }, [treatments]);

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
            {line.units} units (<strong className="avail-highlight">{lineAvail} remaining</strong>)
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
              <th>Matching Elements</th>
              <th>Treatment</th>
              <th>Units</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {candidates.filter((c) => !hideLC || c.composite_score >= 0.5).map((c) => {
              const treatment = treatmentMap.get(c.treatment_id);
              if (!treatment) return null;
              return (
                <CandidateRow
                  key={`${c.candidate_id}-${allocMap.has(c.candidate_id)}`}
                  candidate={c}
                  treatment={treatment}
                  lineAvail={lineAvail}
                  treatmentAvail={treatmentRemaining(c.treatment_id)}
                  allocation={allocMap.get(c.candidate_id) ?? null}
                  onAllocate={onAllocate}
                  onDeleteAllocation={onDeleteAllocation}
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
  treatments,
  allocations,
  lineRemaining,
  treatmentRemaining,
  onAllocate,
  onDeleteAllocation,
}: Props) {
  const [showLC, setShowLC] = useState(false);

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
      <div className="candidates-filter-bar">
        <label>
          <input
            type="checkbox"
            checked={showLC}
            onChange={(e) => setShowLC(e.target.checked)}
          />
          Show low-confidence matches (&lt;0.500)
        </label>
      </div>
      {lines.map((line) => {
        const lineCandidates = grouped.get(line.line_id) ?? [];
        return (
          <LineGroup
            key={line.line_id}
            line={line}
            candidates={lineCandidates}
            treatments={treatments}
            allocations={allocations}
            lineRemaining={lineRemaining}
            treatmentRemaining={treatmentRemaining}
            onAllocate={onAllocate}
            onDeleteAllocation={onDeleteAllocation}
            hideLC={!showLC}
          />
        );
      })}
    </div>
  );
}
