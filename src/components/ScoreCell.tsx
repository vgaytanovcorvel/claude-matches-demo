export function ScoreCell({ score }: { score: number }) {
  const cls =
    score >= 0.8 ? "score-high" : score >= 0.5 ? "score-mid" : "score-low";
  return <span className={`score ${cls}`}>{score.toFixed(3)}</span>;
}

export function VectorCell({ vector }: { vector: Record<string, number> }) {
  return (
    <div className="vector-cell">
      {Object.entries(vector).map(([key, val]) => {
        const color =
          val >= 0.8 ? "#4ade80" : val >= 0.5 ? "#facc15" : "#f87171";
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
