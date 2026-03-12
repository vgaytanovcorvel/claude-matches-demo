import { useState, useMemo, useCallback } from "react";
import type {
  Allocation,
  AllocationStatus,
  Authorization,
  ChargeLine,
  GateConfig,
  MatchCandidate,
} from "./types/models.ts";
import { generateCandidates } from "./engine/index.ts";
import authData from "./data/authorizations.json";
import lineData from "./data/charge-lines.json";
import gateConfig from "./data/gate-config.json";
import { LinesTable } from "./components/LinesTable.tsx";
import { AuthsTable } from "./components/AuthsTable.tsx";
import { CandidatesTable } from "./components/CandidatesTable.tsx";
import { AllocationsTable } from "./components/AllocationsTable.tsx";
import { GateConfigTable } from "./components/GateConfigTable.tsx";
import "./App.css";

const initialAuths = authData as Authorization[];
const initialLines = lineData as ChargeLine[];
const gates = gateConfig as GateConfig[];

type Tab = "lines" | "auths" | "candidates" | "allocations" | "gates";

const tabs: { key: Tab; label: string }[] = [
  { key: "lines", label: "Charge Lines" },
  { key: "auths", label: "Authorizations" },
  { key: "candidates", label: "Candidates" },
  { key: "allocations", label: "Allocations" },
  { key: "gates", label: "Gate Config" },
];

let allocCounter = 0;

function nextAllocId() {
  allocCounter++;
  return `alloc_${String(allocCounter).padStart(3, "0")}`;
}

/** Sum of units allocated (non-deleted) for a given line */
function unitsAllocatedForLine(
  allocations: Allocation[],
  lineId: string
): number {
  return allocations
    .filter((a) => a.line_id === lineId)
    .reduce((sum, a) => sum + a.units_allocated, 0);
}

/** Sum of units allocated (non-deleted) for a given auth */
function unitsAllocatedForAuth(
  allocations: Allocation[],
  authId: string
): number {
  return allocations
    .filter((a) => a.auth_id === authId)
    .reduce((sum, a) => sum + a.units_allocated, 0);
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("candidates");
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [lines, setLines] = useState<ChargeLine[]>(initialLines);
  const [auths, setAuths] = useState<Authorization[]>(initialAuths);

  const candidates = useMemo(
    () => generateCandidates(lines, auths, gates),
    [lines, auths]
  );

  const lineRemaining = useCallback(
    (lineId: string) => {
      const line = lines.find((l) => l.line_id === lineId);
      if (!line) return 0;
      return line.units - unitsAllocatedForLine(allocations, lineId);
    },
    [allocations, lines]
  );

  const authRemaining = useCallback(
    (authId: string) => {
      const auth = auths.find((a) => a.auth_id === authId);
      if (!auth) return 0;
      return auth.units_authorized - unitsAllocatedForAuth(allocations, authId);
    },
    [allocations, auths]
  );

  const handleLineChange = (lineId: string, field: keyof ChargeLine, value: string | number) => {
    setLines((prev) =>
      prev.map((l) => (l.line_id === lineId ? { ...l, [field]: value } : l))
    );
  };

  const handleAuthChange = (authId: string, field: keyof Authorization, value: string | number) => {
    setAuths((prev) =>
      prev.map((a) => (a.auth_id === authId ? { ...a, [field]: value } : a))
    );
  };

  const handleAllocUnitsChange = (allocationId: string, units: number) => {
    setAllocations((prev) =>
      prev.map((a) =>
        a.allocation_id === allocationId ? { ...a, units_allocated: units } : a
      )
    );
  };

  const handleAllocate = (candidate: MatchCandidate, units: number) => {
    setAllocations((prev) => [
      ...prev,
      {
        allocation_id: nextAllocId(),
        candidate_id: candidate.candidate_id,
        line_id: candidate.line_id,
        auth_id: candidate.auth_id,
        units_allocated: units,
        status: "Pending",
      },
    ]);
  };

  const handleStatusChange = (
    allocationId: string,
    status: AllocationStatus
  ) => {
    setAllocations((prev) =>
      prev.map((a) =>
        a.allocation_id === allocationId ? { ...a, status } : a
      )
    );
  };

  const handleDelete = (allocationId: string) => {
    setAllocations((prev) =>
      prev.filter((a) => a.allocation_id !== allocationId)
    );
  };

  return (
    <div className="app">
      <h1>Medical Claims Matching</h1>
      <nav className="tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
            {t.key === "allocations" && allocations.length > 0 && (
              <span className="badge">{allocations.length}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="panel">
        {activeTab === "lines" && (
          <LinesTable lines={lines} allocations={allocations} onLineChange={handleLineChange} />
        )}
        {activeTab === "auths" && (
          <AuthsTable auths={auths} allocations={allocations} onAuthChange={handleAuthChange} />
        )}
        {activeTab === "candidates" && (
          <CandidatesTable
            candidates={candidates}
            lines={lines}
            auths={auths}
            allocations={allocations}
            lineRemaining={lineRemaining}
            authRemaining={authRemaining}
            onAllocate={handleAllocate}
          />
        )}
        {activeTab === "allocations" && (
          <AllocationsTable
            allocations={allocations}
            lines={lines}
            auths={auths}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onUnitsChange={handleAllocUnitsChange}
          />
        )}
        {activeTab === "gates" && (
          <GateConfigTable gates={gates} />
        )}
      </div>
    </div>
  );
}

export default App;
