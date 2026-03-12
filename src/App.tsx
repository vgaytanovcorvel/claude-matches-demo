import { useState, useMemo, useCallback } from "react";
import type {
  Allocation,
  Treatment,
  ChargeLine,
  GateConfig,
  MatchCandidate,
} from "./types/models.ts";
import { generateCandidates } from "./engine/index.ts";
import treatmentData from "./data/treatments.json";
import lineData from "./data/charge-lines.json";
import gateConfig from "./data/gate-config.json";
import { LinesTable } from "./components/LinesTable.tsx";
import { TreatmentsTable } from "./components/TreatmentsTable.tsx";
import { CandidatesTable } from "./components/CandidatesTable.tsx";
import { AllocationsTable } from "./components/AllocationsTable.tsx";
import { GateConfigTable } from "./components/GateConfigTable.tsx";
import "./App.css";

const initialTreatments = treatmentData as Treatment[];
const initialLines = lineData as ChargeLine[];
const gates = gateConfig as GateConfig[];

type Tab = "lines" | "treatments" | "candidates" | "allocations" | "gates";

const tabs: { key: Tab; label: string }[] = [
  { key: "lines", label: "Lines" },
  { key: "treatments", label: "Treatments" },
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

/** Sum of units allocated (non-deleted) for a given treatment */
function unitsAllocatedForTreatment(
  allocations: Allocation[],
  treatmentId: string
): number {
  return allocations
    .filter((a) => a.treatment_id === treatmentId)
    .reduce((sum, a) => sum + a.units_allocated, 0);
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("candidates");
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [lines, setLines] = useState<ChargeLine[]>(initialLines);
  const [treatments, setTreatments] = useState<Treatment[]>(initialTreatments);

  const candidates = useMemo(
    () => generateCandidates(lines, treatments, gates),
    [lines, treatments]
  );

  const lineRemaining = useCallback(
    (lineId: string) => {
      const line = lines.find((l) => l.line_id === lineId);
      if (!line) return 0;
      return line.units - unitsAllocatedForLine(allocations, lineId);
    },
    [allocations, lines]
  );

  const treatmentRemaining = useCallback(
    (treatmentId: string) => {
      const treatment = treatments.find((a) => a.treatment_id === treatmentId);
      if (!treatment) return 0;
      return treatment.units_approved - unitsAllocatedForTreatment(allocations, treatmentId);
    },
    [allocations, treatments]
  );

  const handleLineChange = (lineId: string, field: keyof ChargeLine, value: string | number) => {
    setLines((prev) =>
      prev.map((l) => (l.line_id === lineId ? { ...l, [field]: value } : l))
    );
  };

  const handleTreatmentChange = (treatmentId: string, field: keyof Treatment, value: string | number) => {
    setTreatments((prev) =>
      prev.map((a) => (a.treatment_id === treatmentId ? { ...a, [field]: value } : a))
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
        treatment_id: candidate.treatment_id,
        units_allocated: units,
        status: "Pending",
      },
    ]);
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
        {activeTab === "treatments" && (
          <TreatmentsTable treatments={treatments} allocations={allocations} lines={lines} onTreatmentChange={handleTreatmentChange} />
        )}
        {activeTab === "candidates" && (
          <CandidatesTable
            candidates={candidates}
            lines={lines}
            treatments={treatments}
            allocations={allocations}
            lineRemaining={lineRemaining}
            treatmentRemaining={treatmentRemaining}
            onAllocate={handleAllocate}
          />
        )}
        {activeTab === "allocations" && (
          <AllocationsTable
            allocations={allocations}
            lines={lines}
            treatments={treatments}
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
