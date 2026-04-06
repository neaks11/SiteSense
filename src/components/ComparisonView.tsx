import { useDeals } from './DealContext';

const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const ComparisonView = () => {
  const { savedRows } = useDeals();

  return (
    <section className="panel overflow-hidden">
      <div className="border-b bg-stone-50 px-4 py-3">
        <h2 className="text-xl font-semibold">Opportunity Comparison</h2>
        <p className="text-sm text-stone-600">Compare underwriting outputs side-by-side.</p>
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
                <th className="px-4 py-3">Best Use</th>
              </tr>
            </thead>
            <tbody>
              {savedRows.map(({ site, financials, dealScore }) => (
                <tr key={site.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{site.address}</td>
                  <td className="px-4 py-3">{site.neighborhood}</td>
                  <td className="px-4 py-3">{money(financials.totalProjectCost)}</td>
                  <td className="px-4 py-3">{money(financials.annualNOI)}</td>
                  <td className="px-4 py-3">{money(financials.annualCashFlow)}</td>
                  <td className="px-4 py-3">{dealScore.score}</td>
                  <td className="px-4 py-3">{site.suggestedUse}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="p-6 text-sm text-stone-600">No saved deals yet. Save at least one opportunity to compare.</p>
      )}
    </section>
  );
};
