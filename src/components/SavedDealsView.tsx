import { useDeals } from './DealContext';

const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const SavedDealsView = () => {
  const { savedRows, toggleFavorite, setNote } = useDeals();

  if (!savedRows.length) {
    return (
      <section className="panel p-8 text-center">
        <h2 className="text-2xl font-semibold">DealVault™ is empty</h2>
        <p className="mt-2 text-stone-600">Save opportunities from SignalMap™ to build your investment pipeline.</p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {savedRows.map(({ item, site, financials, dealScore }) => (
        <section key={site.id} className="panel p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{site.address}</h3>
              <p className="text-sm text-stone-600">{site.neighborhood} · {site.suggestedUse}</p>
            </div>
            <button className="text-xl" onClick={() => toggleFavorite(site.id)}>{item.favorite ? '★' : '☆'}</button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
            <p>Total Cost <span className="block font-semibold">{money(financials.totalProjectCost)}</span></p>
            <p>NOI <span className="block font-semibold">{money(financials.annualNOI)}</span></p>
            <p>Cash Flow <span className="block font-semibold">{money(financials.annualCashFlow)}</span></p>
            <p>DealScore™ <span className="block font-semibold">{dealScore.score}</span></p>
            <p>ROI <span className="block font-semibold">{financials.roiPct.toFixed(1)}%</span></p>
          </div>
          <textarea
            className="mt-3 w-full rounded-lg border p-2 text-sm"
            placeholder="Add investment notes..."
            value={item.note}
            onChange={(e) => setNote(site.id, e.target.value)}
          />
        </section>
      ))}
    </div>
  );
};
