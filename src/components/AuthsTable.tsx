import type { Allocation, Authorization } from "../types/models.ts";

interface Props {
  auths: Authorization[];
  allocations: Allocation[];
}

export function AuthsTable({ auths, allocations }: Props) {
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
              <td>{a.provider_id}</td>
              <td>{a.cpt}</td>
              <td>{a.units_authorized}</td>
              <td>{alloc}</td>
              <td className={remaining === 0 ? "score-low" : ""}>
                {remaining}
              </td>
              <td>{a.start_date}</td>
              <td>{a.end_date}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
