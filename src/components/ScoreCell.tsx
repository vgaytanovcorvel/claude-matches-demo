function scoreClass(val: number): string {
  return val >= 0.999 ? "score-perfect" : val >= 0.5 ? "score-mid" : "score-low";
}

function scoreBarColor(val: number): string {
  return val >= 0.999 ? "#4A7A5B" : val >= 0.5 ? "#A68D52" : "#B25555";
}

function vectorTooltip(vector: Record<string, number>): string {
  const values = Object.values(vector);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const pct = Math.round(avg * 100);
  const parts = Object.entries(vector).map(([key, val]) => {
    if (val >= 0.999) return `${key} is identical`;
    if (val >= 0.5) return `${key} is close but not perfect`;
    return `${key} is a weak match`;
  });
  return `${pct}% Match: ${parts.join("; ")}.`;
}

export function ScoreCell({ score, vector }: { score: number; vector?: Record<string, number> }) {
  const tooltip = score < 0.5 && vector ? vectorTooltip(vector) : undefined;
  return (
    <span className={`score ${scoreClass(score)}`} title={tooltip}>
      {score.toFixed(3)}
    </span>
  );
}

export function VectorCell({ vector }: { vector: Record<string, number> }) {
  return (
    <div className="vector-cell" title={vectorTooltip(vector)}>
      {Object.entries(vector).map(([key, val]) => {
        const color = scoreBarColor(val);
        return (
          <div key={key} className="vector-bar">
            <span className="vector-label">{key}</span>
            <div className="vector-fill-bg">
              <div
                className="vector-fill"
                style={{ width: `${val * 100}%`, background: color }}
              />
            </div>
            <span className="score" style={{ fontSize: "0.7rem", color }}>
              {val.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
