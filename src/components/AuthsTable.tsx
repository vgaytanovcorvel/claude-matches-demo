import type { Allocation, Authorization } from "../types/models.ts";

interface Props {
  auths: Authorization[];
  allocations: Allocation[];
  onAuthChange: (authId: string, field: keyof Authorization, value: string | number) => void;
}

export function AuthsTable({ auths, allocations, onAuthChange }: Props) {
  function allocated(authId: string) {
    return allocations
      .filter((a) => a.auth_id === authId)
      .reduce((sum, a) => sum + a.units_allocated, 0);
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Auth ID</th>
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
        {auths.map((a) => {
          const alloc = allocated(a.auth_id);
          const remaining = a.units_authorized - alloc;
          return (
            <tr key={a.auth_id}>
              <td>{a.auth_id}</td>
              <td>
                <input
                  className="edit-input"
                  value={a.provider_id}
                  onChange={(e) => onAuthChange(a.auth_id, "provider_id", e.target.value)}
                />
              </td>
              <td>
                <input
                  className="edit-input"
                  value={a.cpt}
                  onChange={(e) => onAuthChange(a.auth_id, "cpt", e.target.value)}
                />
              </td>
              <td>
                <input
                  className="edit-input edit-input-num"
                  type="number"
                  min={0}
                  value={a.units_authorized}
                  onChange={(e) => onAuthChange(a.auth_id, "units_authorized", Math.max(0, Number(e.target.value)))}
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
                  onChange={(e) => onAuthChange(a.auth_id, "start_date", e.target.value)}
                />
              </td>
              <td>
                <input
                  className="edit-input"
                  type="date"
                  value={a.end_date}
                  onChange={(e) => onAuthChange(a.auth_id, "end_date", e.target.value)}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
