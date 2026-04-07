import type { SiteRecord } from '@/lib/types';

export const TopDealsPanel = ({ deals, onSelect }: { deals: { site: SiteRecord; score: number }[]; onSelect: (s: SiteRecord) => void }) => (
  <div className="rounded-lg border p-3">
    <p className="mb-2 text-xs font-semibold uppercase text-stone-500">Top 5 deals</p>
    <ul className="space-y-1 text-xs">
      {deals.map((d) => <li key={d.site.id} className="cursor-pointer rounded p-1 hover:bg-stone-100" onClick={() => onSelect(d.site)}>{d.site.address} · {d.score}</li>)}
    </ul>
  </div>
);
