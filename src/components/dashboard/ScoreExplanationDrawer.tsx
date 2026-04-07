export const ScoreExplanationDrawer = ({ components }: { components: Record<string, number> }) => (
  <details className="rounded-lg border p-3 text-xs">
    <summary className="cursor-pointer font-semibold">Score Explanation</summary>
    <ul className="mt-2 space-y-1">
      {Object.entries(components).map(([k, v]) => <li key={k}>{k}: {Math.round(v)}</li>)}
    </ul>
  </details>
);
