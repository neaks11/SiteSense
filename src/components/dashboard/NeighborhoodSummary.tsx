export const NeighborhoodSummary = ({ rows }: { rows: { neighborhood: string; avgScore: number; avgPrice: number; dominant: string; risk: string }[] }) => (
  <section className="panel p-4 text-xs">
    <h3 className="font-semibold">Neighborhood Summary</h3>
    <div className="mt-2 grid gap-2 md:grid-cols-2">
      {rows.map((r) => <div key={r.neighborhood} className="rounded border p-2"><p className="font-semibold">{r.neighborhood}</p><p>Avg score {r.avgScore}</p><p>Avg price ${Math.round(r.avgPrice).toLocaleString()}</p><p>{r.dominant} · {r.risk} risk</p></div>)}
    </div>
  </section>
);
