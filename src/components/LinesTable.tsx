import type { Allocation, ChargeLine } from "../types/models.ts";

interface Props {
  lines: ChargeLine[];
  allocations: Allocation[];
  onLineChange: (lineId: string, field: keyof ChargeLine, value: string | number) => void;
}

export function LinesTable({ lines, allocations, onLineChange }: Props) {
  function allocated(lineId: string) {
    return allocations
      .filter((a) => a.line_id === lineId)
      .reduce((sum, a) => sum + a.units_allocated, 0);
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Line ID</th>
          <th>Provider</th>
          <th>CPT</th>
          <th>Units</th>
          <th>Allocated</th>
          <th>Remaining</th>
          <th>DOS</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((l) => {
          const alloc = allocated(l.line_id);
          const remaining = l.units - alloc;
          return (
            <tr key={l.line_id}>
              <td>{l.line_id}</td>
              <td>
                <input
                  className="edit-input"
                  value={l.provider_id}
                  onChange={(e) => onLineChange(l.line_id, "provider_id", e.target.value)}
                />
              </td>
              <td>
                <input
                  className="edit-input"
                  value={l.cpt}
                  onChange={(e) => onLineChange(l.line_id, "cpt", e.target.value)}
                />
              </td>
              <td>
                <input
                  className="edit-input edit-input-num"
                  type="number"
                  min={0}
                  value={l.units}
                  onChange={(e) => onLineChange(l.line_id, "units", Math.max(0, Number(e.target.value)))}
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
                  value={l.dos}
                  onChange={(e) => onLineChange(l.line_id, "dos", e.target.value)}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
