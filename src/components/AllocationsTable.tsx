import { useMemo } from "react";
import type {
  Allocation,
  AllocationStatus,
  Authorization,
  ChargeLine,
} from "../types/models.ts";

interface Props {
  allocations: Allocation[];
  lines: ChargeLine[];
  auths: Authorization[];
  onStatusChange: (allocationId: string, status: AllocationStatus) => void;
  onDelete: (allocationId: string) => void;
  onUnitsChange: (allocationId: string, units: number) => void;
}

function AllocationRow({
  allocation,
  auth,
  onStatusChange,
  onDelete,
  onUnitsChange,
}: {
  allocation: Allocation;
  auth: Authorization | undefined;
  onStatusChange: (allocationId: string, status: AllocationStatus) => void;
  onDelete: (allocationId: string) => void;
  onUnitsChange: (allocationId: string, units: number) => void;
}) {
  return (
    <tr>
      <td>
        <span className={`status status-${allocation.status.toLowerCase()}`}>
          {allocation.status}
        </span>
      </td>
      <td>
        {auth ? (
          <div className="auth-detail">
            <span className="auth-id">{auth.auth_id}</span>
            <span className="detail-field">
              CPT <strong>{auth.cpt}</strong>
            </span>
            <span className="detail-field">
              {auth.start_date} to {auth.end_date}
            </span>
          </div>
        ) : (
          allocation.auth_id
        )}
      </td>
      <td>
        <input
          className="edit-input edit-input-num"
          type="number"
          min={0}
          value={allocation.units_allocated}
          onChange={(e) => onUnitsChange(allocation.allocation_id, Math.max(0, Number(e.target.value)))}
        />
      </td>
      <td>
        <div className="actions">
          <button
            className="btn btn-approve"
            disabled={allocation.status === "Approved"}
            onClick={() => onStatusChange(allocation.allocation_id, "Approved")}
          >
            Approve
          </button>
          <button
            className="btn btn-reject"
            disabled={allocation.status === "Rejected"}
            onClick={() => onStatusChange(allocation.allocation_id, "Rejected")}
          >
            Reject
          </button>
          <button
            className="btn btn-delete"
            onClick={() => onDelete(allocation.allocation_id)}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

function LineAllocGroup({
  line,
  allocations,
  auths,
  onStatusChange,
  onDelete,
  onUnitsChange,
}: {
  line: ChargeLine;
  allocations: Allocation[];
  auths: Authorization[];
  onStatusChange: (allocationId: string, status: AllocationStatus) => void;
  onDelete: (allocationId: string) => void;
  onUnitsChange: (allocationId: string, units: number) => void;
}) {
  const authMap = useMemo(() => {
    const m = new Map<string, Authorization>();
    for (const a of auths) m.set(a.auth_id, a);
    return m;
  }, [auths]);

  const totalAllocated = allocations.reduce(
    (s, a) => s + a.units_allocated,
    0
  );

  return (
    <div className="line-group">
      <div className="line-header">
        <div className="line-detail">
          <span className="line-id">{line.line_id}</span>
          <span className="detail-field">
            Provider <strong>{line.provider_id}</strong>
          </span>
          <span className="detail-field">
            CPT <strong>{line.cpt}</strong>
          </span>
          <span className="detail-field">
            {totalAllocated}/{line.units}u allocated
          </span>
          <span className="detail-field">DOS {line.dos}</span>
        </div>
        <span className="candidate-count">
          {allocations.length} allocation{allocations.length !== 1 ? "s" : ""}
        </span>
      </div>
      <table className="candidates-subtable">
        <thead>
          <tr>
            <th>Status</th>
            <th>Authorization</th>
            <th>Units</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {allocations.map((a) => (
            <AllocationRow
              key={a.allocation_id}
              allocation={a}
              auth={authMap.get(a.auth_id)}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              onUnitsChange={onUnitsChange}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AllocationsTable({
  allocations,
  lines,
  auths,
  onStatusChange,
  onDelete,
  onUnitsChange,
}: Props) {
  if (allocations.length === 0) {
    return (
      <p style={{ color: "#888" }}>
        No allocations yet. Go to Candidates and click Allocate.
      </p>
    );
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Allocation[]>();
    for (const a of allocations) {
      const arr = map.get(a.line_id) ?? [];
      arr.push(a);
      map.set(a.line_id, arr);
    }
    return map;
  }, [allocations]);

  const lineMap = useMemo(() => {
    const m = new Map<string, ChargeLine>();
    for (const l of lines) m.set(l.line_id, l);
    return m;
  }, [lines]);

  return (
    <div className="candidates-panel">
      {[...grouped.entries()].map(([lineId, lineAllocs]) => {
        const line = lineMap.get(lineId);
        if (!line) return null;
        return (
          <LineAllocGroup
            key={lineId}
            line={line}
            allocations={lineAllocs}
            auths={auths}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onUnitsChange={onUnitsChange}
          />
        );
      })}
    </div>
  );
}
