import { useDeals } from './DealContext';

const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const SharePacketView = () => {
  const { shareDealKey, savedRows, decisionSnapshots } = useDeals();
  const row = savedRows.find((r) => r.key === shareDealKey || r.site.id === shareDealKey) ?? savedRows[0];

  if (!row) {
    return <section className="panel p-8 text-center">No deal available for share packet yet.</section>;
  }

  const history = decisionSnapshots.filter((s) => s.key === row.key || s.key === row.site.id).slice(0, 6);

  return (
    <section className="panel p-6">
      <p className="text-xs uppercase tracking-wide text-brand-700">SiteSense Investor Packet</p>
      <h2 className="mt-1 text-2xl font-semibold">{row.site.address}</h2>
      <p className="text-sm text-stone-600">{row.site.neighborhood} · {row.site.suggestedUse}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded border p-3"><p className="text-xs text-stone-500">DealScore™</p><p className="text-xl font-semibold">{row.dealScore.score}</p></div>
        <div className="rounded border p-3"><p className="text-xs text-stone-500">Total Cost</p><p className="text-xl font-semibold">{money(row.model.totalProjectCost)}</p></div>
        <div className="rounded border p-3"><p className="text-xs text-stone-500">Annual NOI</p><p className="text-xl font-semibold">{money(row.model.annualNOI)}</p></div>
        <div className="rounded border p-3"><p className="text-xs text-stone-500">ROI</p><p className="text-xl font-semibold">{row.model.roiPct.toFixed(1)}%</p></div>
      </div>

      <div className="mt-4 rounded-lg border bg-stone-50 p-3 text-sm">
        <p className="font-semibold">Scenario confidence band</p>
        <p className="mt-1">NOI band and value band are visible on dashboard; use this packet as the final export-ready summary route.</p>
      </div>

      <div className="mt-4">
        <p className="font-semibold">Decision Replay</p>
        {history.length ? (
          <ul className="mt-2 space-y-1 text-xs">
            {history.map((h) => (
              <li key={h.id} className="rounded border p-2">
                {new Date(h.timestamp).toLocaleString()} · Score {h.score} · ROI {h.roi.toFixed(1)}% · Risk {h.risk} · {h.recommendation}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-stone-500">No snapshots yet. Capture from dashboard to build replay history.</p>
        )}
      </div>

      <button className="mt-4 rounded-lg border px-3 py-2 text-xs" onClick={() => window.print()}>Print / Save as PDF</button>
    </section>
  );
};
