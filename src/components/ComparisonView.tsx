import { useDeals } from './DealContext';

const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const ComparisonView = () => {
  const { savedRows } = useDeals();

  return (
    <section className="panel overflow-hidden">
      <div className="border-b bg-stone-50 px-4 py-3">
        <h2 className="text-xl font-semibold">Scenario Comparison</h2>
        <p className="text-sm text-stone-600">Compare multiple saved opportunities and scenario versions side-by-side.</p>
      </div>
      {savedRows.length ? (
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white text-left text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Neighborhood</th>
                <th className="px-4 py-3">Total Cost</th>
                <th className="px-4 py-3">NOI</th>
                <th className="px-4 py-3">Cash Flow</th>
                <th className="px-4 py-3">DealScore™</th>
                <th className="px-4 py-3">ROI</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tag</th>
                <th className="px-4 py-3">Scenario</th>
              </tr>
            </thead>
            <tbody>
              {savedRows.map(({ key, item, site, model, dealScore }) => (
                <tr key={key} className="border-t">
                  <td className="px-4 py-3 font-medium">{site.address}</td>
                  <td className="px-4 py-3">{site.neighborhood}</td>
                  <td className="px-4 py-3">{money(model.totalProjectCost)}</td>
                  <td className="px-4 py-3">{money(model.annualNOI)}</td>
                  <td className="px-4 py-3">{money(model.annualCashFlow)}</td>
                  <td className="px-4 py-3">{dealScore.score}</td>
                  <td className="px-4 py-3">{model.roiPct.toFixed(1)}%</td>
                  <td className="px-4 py-3">{item.status}</td>
                  <td className="px-4 py-3">{item.tag || '—'}</td>
                  <td className="px-4 py-3">{item.scenarioLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="p-6 text-sm text-stone-600">No comparisons yet. Save a few deals (and duplicates) to compare scenarios.</p>
      )}
    </section>
  );
};
