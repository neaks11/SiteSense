import { useDeals } from './DealContext';

const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const PortfolioView = () => {
  const { savedRows, portfolioRows, addToPortfolio, removeFromPortfolio, portfolioConfig, setPortfolioConfig } = useDeals();

  const totalCost = portfolioRows.reduce((sum, row) => sum + row.model.totalProjectCost, 0);
  const avgRisk = portfolioRows.length
    ? portfolioRows.reduce((sum, row) => sum + Math.max(0, 100 - row.dealScore.score), 0) / portfolioRows.length
    : 0;
  const avgROI = portfolioRows.length ? portfolioRows.reduce((sum, row) => sum + row.model.roiPct, 0) / portfolioRows.length : 0;

  const allocator = [...savedRows]
    .sort((a, b) => b.model.roiPct - (100 - b.dealScore.score) - (a.model.roiPct - (100 - a.dealScore.score)))
    .slice(0, 6)
    .filter((row) => row.model.totalProjectCost <= portfolioConfig.budget * 0.45);

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <aside className="panel h-fit p-4 text-sm">
        <h2 className="text-lg font-semibold">Portfolio Constructor</h2>
        <label className="mt-3 block text-xs">Budget: {money(portfolioConfig.budget)}
          <input className="w-full" type="range" min={300000} max={4000000} step={50000} value={portfolioConfig.budget} onChange={(e) => setPortfolioConfig({ ...portfolioConfig, budget: +e.target.value })} />
        </label>
        <label className="mt-2 block text-xs">Max Risk: {portfolioConfig.maxRisk}
          <input className="w-full" type="range" min={25} max={90} value={portfolioConfig.maxRisk} onChange={(e) => setPortfolioConfig({ ...portfolioConfig, maxRisk: +e.target.value })} />
        </label>
        <label className="mt-2 block text-xs">Target Hold Mix: {portfolioConfig.targetHoldPct}%
          <input className="w-full" type="range" min={20} max={90} value={portfolioConfig.targetHoldPct} onChange={(e) => setPortfolioConfig({ ...portfolioConfig, targetHoldPct: +e.target.value })} />
        </label>

        <div className="mt-4 rounded-lg border bg-stone-50 p-3 text-xs">
          <p>Total selected cost: <span className="font-semibold">{money(totalCost)}</span></p>
          <p>Remaining budget: <span className="font-semibold">{money(portfolioConfig.budget - totalCost)}</span></p>
          <p>Blended ROI: <span className="font-semibold">{avgROI.toFixed(1)}%</span></p>
          <p>Blended risk proxy: <span className="font-semibold">{avgRisk.toFixed(0)}/100</span></p>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase text-stone-500">Allocator assistant</p>
          <p className="mt-1 text-xs text-stone-600">Suggested bundle based on return minus risk penalty.</p>
          <ul className="mt-2 space-y-1 text-xs">
            {allocator.map((row) => (
              <li key={row.key} className="rounded border p-2">
                <p className="font-medium">{row.site.address}</p>
                <p>ROI {row.model.roiPct.toFixed(1)}% · Score {row.dealScore.score}</p>
                <button className="mt-1 rounded border px-2 py-1" onClick={() => addToPortfolio(row.key)}>Add</button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="panel p-4">
        <h2 className="text-lg font-semibold">Portfolio Board</h2>
        {!portfolioRows.length ? (
          <p className="mt-3 text-sm text-stone-600">No deals in portfolio yet. Add from allocator or DealVault.</p>
        ) : (
          <div className="mt-3 overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-stone-500">
                <tr>
                  <th className="px-2 py-2">Address</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Cost</th>
                  <th className="px-2 py-2">NOI</th>
                  <th className="px-2 py-2">ROI</th>
                  <th className="px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {portfolioRows.map((row) => (
                  <tr key={row.key} className="border-t">
                    <td className="px-2 py-2">{row.site.address}</td>
                    <td className="px-2 py-2">{row.item.status}</td>
                    <td className="px-2 py-2">{money(row.model.totalProjectCost)}</td>
                    <td className="px-2 py-2">{money(row.model.annualNOI)}</td>
                    <td className="px-2 py-2">{row.model.roiPct.toFixed(1)}%</td>
                    <td className="px-2 py-2"><button className="rounded border px-2 py-1 text-xs" onClick={() => removeFromPortfolio(row.key)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
