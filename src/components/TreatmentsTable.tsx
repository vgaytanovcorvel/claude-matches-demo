import { useMemo } from "react";
import type { Allocation, ChargeLine, Treatment } from "../types/models.ts";

interface Props {
  treatments: Treatment[];
  allocations: Allocation[];
  lines: ChargeLine[];
  onTreatmentChange: (treatmentId: string, field: keyof Treatment, value: string | number) => void;
}

function TreatmentCard({
  treatment,
  treatmentAllocs,
  lineMap,
  onTreatmentChange,
}: {
  treatment: Treatment;
  treatmentAllocs: Allocation[];
  lineMap: Map<string, ChargeLine>;
  onTreatmentChange: (treatmentId: string, field: keyof Treatment, value: string | number) => void;
}) {
  const totalAllocated = treatmentAllocs.reduce((s, a) => s + a.units_allocated, 0);
  const remaining = treatment.units_approved - totalAllocated;

  return (
    <div className="line-group">
      <div className="line-header treatment-card-header">
        <div className="line-detail">
          <span className="treatment-id">{treatment.treatment_id}</span>
          <span className="detail-field">
            Provider{" "}
            <input
              className="edit-input edit-input-inline"
              value={treatment.provider_id}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onTreatmentChange(treatment.treatment_id, "provider_id", e.target.value)}
            />
          </span>
          <span className="detail-field">
            CPT{" "}
            <input
              className="edit-input edit-input-inline"
              value={treatment.cpt}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onTreatmentChange(treatment.treatment_id, "cpt", e.target.value)}
            />
          </span>
          <span className="detail-field">
            <input
              className="edit-input edit-input-num"
              type="number"
              min={0}
              value={treatment.units_approved}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onTreatmentChange(treatment.treatment_id, "units_approved", Math.max(0, Number(e.target.value)))}
            />
            units approved
          </span>
          <span className="detail-field">
            <strong className={remaining === 0 ? "score-low" : "avail-highlight"}>{remaining} remaining</strong>
          </span>
        </div>
        <div className="treatment-dates">
          <input
            className="edit-input"
            type="date"
            value={treatment.start_date}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onTreatmentChange(treatment.treatment_id, "start_date", e.target.value)}
          />
          <span className="detail-field">to</span>
          <input
            className="edit-input"
            type="date"
            value={treatment.end_date}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onTreatmentChange(treatment.treatment_id, "end_date", e.target.value)}
          />
        </div>
      </div>
      {treatmentAllocs.length > 0 ? (
        <table className="candidates-subtable treatment-alloc-table">
          <thead>
            <tr>
              <th>Line</th>
              <th>CPT</th>
              <th>DOS</th>
              <th>Units Allocated</th>
            </tr>
          </thead>
          <tbody>
            {treatmentAllocs.map((a) => {
              const line = lineMap.get(a.line_id);
              return (
                <tr key={a.allocation_id}>
                  <td><span className="line-id">{a.line_id}</span></td>
                  <td>{line?.cpt ?? "—"}</td>
                  <td>{line?.dos ?? "—"}</td>
                  <td>{a.units_allocated}</td>
                </tr>
              );
            })}
            <tr className="alloc-summary-row">
              <td colSpan={3}>Total</td>
              <td><strong>{totalAllocated}</strong></td>
            </tr>
          </tbody>
        </table>
      ) : (
        <div className="no-allocs">No lines allocated yet</div>
      )}
    </div>
  );
}

export function TreatmentsTable({ treatments, allocations, lines, onTreatmentChange }: Props) {
  const lineMap = useMemo(() => {
    const m = new Map<string, ChargeLine>();
    for (const l of lines) m.set(l.line_id, l);
    return m;
  }, [lines]);

  const allocsByTreatment = useMemo(() => {
    const m = new Map<string, Allocation[]>();
    for (const a of allocations) {
      const arr = m.get(a.treatment_id) ?? [];
      arr.push(a);
      m.set(a.treatment_id, arr);
    }
    return m;
  }, [allocations]);

  return (
    <div className="candidates-panel">
      {treatments.map((t) => (
        <TreatmentCard
          key={t.treatment_id}
          treatment={t}
          treatmentAllocs={allocsByTreatment.get(t.treatment_id) ?? []}
          lineMap={lineMap}
          onTreatmentChange={onTreatmentChange}
        />
      ))}
    </div>
  );
}
