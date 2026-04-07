export const RiskAnalysisCard = ({ risk }: { risk: { score: number; buckets: Record<string, string> } }) => (
  <section className="panel p-4 text-sm">
    <h3 className="font-semibold">Risk Analysis</h3>
    <p className="mt-1 text-xs">Risk score: <span className="font-semibold">{risk.score}/100</span></p>
    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
      {Object.entries(risk.buckets).map(([key, value]) => <p key={key} className="rounded bg-stone-100 p-2">{key}: <span className="font-semibold">{value}</span></p>)}
    </div>
  </section>
);
