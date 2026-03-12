import type { GateConfig } from "../types/models.ts";

export function GateConfigTable({ gates }: { gates: GateConfig[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Gate</th>
          <th>Bill Field</th>
          <th>Auth Field</th>
          <th>Mode</th>
          <th>Weight</th>
          <th>Rules</th>
        </tr>
      </thead>
      <tbody>
        {gates.map((g) => (
          <tr key={g.gate_id}>
            <td>{g.gate_id}</td>
            <td style={{ fontFamily: "monospace" }}>{g.bill_field}</td>
            <td style={{ fontFamily: "monospace" }}>{g.auth_field}</td>
            <td>
              <span className={`gate-mode gate-${g.mode}`}>{g.mode}</span>
            </td>
            <td>{g.weight}</td>
            <td>
              <div className="rule-list">
                {g.rules
                  .sort((a, b) => b.priority - a.priority)
                  .map((r) => (
                    <span key={r.rule_id} className="rule-tag">
                      {r.rule_id} ({r.type}
                      {r.params
                        ? `, ${Object.entries(r.params)
                            .map(([k, v]) => `${k}=${v}`)
                            .join(", ")}`
                        : ""}
                      )
                    </span>
                  ))}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
