import { statusColor } from '@/lib/finance';
import type { DealTag, PipelineStatus } from '@/lib/types';
import { useDeals } from './DealContext';

const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const SavedDealsView = () => {
  const { savedRows, toggleFavorite, setTag, setNote, setStatus, addToPortfolio } = useDeals();

  if (!savedRows.length) {
    return (
      <section className="panel p-10 text-center">
        <h2 className="text-2xl font-semibold">No saved deals yet</h2>
        <p className="mt-2 text-stone-600">Use SignalMap™ to save opportunities, then build structured notes and pipeline stages here.</p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {savedRows.map(({ key, item, site, model, dealScore }) => (
        <section key={key} className="panel p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{site.address}</h3>
              <p className="text-sm text-stone-600">{site.neighborhood} · {site.suggestedUse}</p>
            </div>
            <button className="text-xl" onClick={() => toggleFavorite(key)}>{item.favorite ? '★' : '☆'}</button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
            <p>Total Cost <span className="block font-semibold">{money(model.totalProjectCost)}</span></p>
            <p>NOI <span className="block font-semibold">{money(model.annualNOI)}</span></p>
            <p>Cash Flow <span className="block font-semibold">{money(model.annualCashFlow)}</span></p>
            <p>DealScore™ <span className="block font-semibold">{dealScore.score}</span></p>
            <p>ROI <span className="block font-semibold">{model.roiPct.toFixed(1)}%</span></p>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-5">
            <textarea className="rounded-lg border p-2 text-sm" placeholder="Investment thesis" value={item.note.investmentThesis} onChange={(e) => setNote(key, { ...item.note, investmentThesis: e.target.value })} />
            <textarea className="rounded-lg border p-2 text-sm" placeholder="Risks" value={item.note.risks} onChange={(e) => setNote(key, { ...item.note, risks: e.target.value })} />
            <textarea className="rounded-lg border p-2 text-sm" placeholder="Next step" value={item.note.nextStep} onChange={(e) => setNote(key, { ...item.note, nextStep: e.target.value })} />
            <input className="rounded-lg border p-2 text-sm" placeholder="Contact status" value={item.note.contactStatus} onChange={(e) => setNote(key, { ...item.note, contactStatus: e.target.value })} />
            <input className="rounded-lg border p-2 text-sm" placeholder="Offer strategy" value={item.note.offerStrategy} onChange={(e) => setNote(key, { ...item.note, offerStrategy: e.target.value })} />
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <button className="rounded-lg border px-2 py-1 text-xs" onClick={() => addToPortfolio(key)}>Add to Portfolio</button>
            <select className="rounded-lg border p-2 text-sm" value={item.tag} onChange={(e) => setTag(key, e.target.value as DealTag)}>
              <option value="">No tag</option>
              <option>High Potential</option><option>Risky</option><option>Revisit</option><option>Hold for Later</option><option>Favorite Submarket</option>
            </select>
            <select className="rounded-lg border p-2 text-sm" value={item.status} onChange={(e) => setStatus(key, e.target.value as PipelineStatus)}>
              <option>New</option><option>Reviewing</option><option>Underwriting</option><option>Contacted</option><option>Offered</option><option>Dead</option><option>Closed</option>
            </select>
            <span className={`rounded-full px-3 py-2 text-xs ${statusColor(item.status)}`}>{item.status}</span>
          </div>
        </section>
      ))}
    </div>
  );
};
