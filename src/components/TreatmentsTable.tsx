import type { Allocation, Treatment } from "../types/models.ts";

interface Props {
  treatments: Treatment[];
  allocations: Allocation[];
  onTreatmentChange: (treatmentId: string, field: keyof Treatment, value: string | number) => void;
}

export function TreatmentsTable({ treatments, allocations, onTreatmentChange }: Props) {
  function allocated(treatmentId: string) {
    return allocations
      .filter((a) => a.treatment_id === treatmentId)
      .reduce((sum, a) => sum + a.units_allocated, 0);
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Treatment ID</th>
          <th>Provider</th>
          <th>CPT</th>
          <th>Units</th>
          <th>Allocated</th>
          <th>Remaining</th>
          <th>Start</th>
          <th>End</th>
        </tr>
      </thead>
      <tbody>
        {treatments.map((a) => {
          const alloc = allocated(a.treatment_id);
          const remaining = a.units_approved - alloc;
          return (
            <tr key={a.treatment_id}>
              <td>{a.treatment_id}</td>
              <td>
                <input
                  className="edit-input"
                  value={a.provider_id}
                  onChange={(e) => onTreatmentChange(a.treatment_id, "provider_id", e.target.value)}
                />
              </td>
              <td>
                <input
                  className="edit-input"
                  value={a.cpt}
                  onChange={(e) => onTreatmentChange(a.treatment_id, "cpt", e.target.value)}
                />
              </td>
              <td>
                <input
                  className="edit-input edit-input-num"
                  type="number"
                  min={0}
                  value={a.units_approved}
                  onChange={(e) => onTreatmentChange(a.treatment_id, "units_approved", Math.max(0, Number(e.target.value)))}
                />
              </td>
              <td>{alloc}</td>
              <td className={remaining === 0 ? "score-low" : ""}>
                {remaining}
              </td>
              <td>
                <input
                  className="edit-input"
                  type="date"
                  value={a.start_date}
                  onChange={(e) => onTreatmentChange(a.treatment_id, "start_date", e.target.value)}
                />
              </td>
              <td>
                <input
                  className="edit-input"
                  type="date"
                  value={a.end_date}
                  onChange={(e) => onTreatmentChange(a.treatment_id, "end_date", e.target.value)}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
