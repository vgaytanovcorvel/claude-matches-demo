import type { Allocation, ChargeLine } from "../types/models.ts";

interface Props {
  lines: ChargeLine[];
  allocations: Allocation[];
}

export function LinesTable({ lines, allocations }: Props) {
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
              <td>{l.provider_id}</td>
              <td>{l.cpt}</td>
              <td>{l.units}</td>
              <td>{alloc}</td>
              <td className={remaining === 0 ? "score-low" : ""}>
                {remaining}
              </td>
              <td>{l.dos}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
