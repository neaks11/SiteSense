import { useMemo, useState } from 'react';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Papa from 'papaparse';
import { hotZones, sites } from '@/data/sites';
import { getAIRecommendation, getDefaultAssumptions, modelDeal, scoreDeal } from '@/lib/finance';
import type { BuildAssumptions, Filters, SiteRecord } from '@/lib/types';
import { useDeals } from './DealContext';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const defaultFilters: Filters = {
  minPrice: 0,
  maxPrice: 300000,
  minLotSqft: 2000,
  maxLotSqft: 6000,
  neighborhoods: [],
  zoning: [],
  ownership: [],
  minDealScore: 1,
  modularOnly: false,
  affordableOnly: false,
  maxTransitDistance: 1.2,
  minROI: -15,
};

export const DashboardView = () => {
  const [filters, setFilters] = useState(defaultFilters);
  const [selected, setSelected] = useState<SiteRecord>(sites[0]);
  const [showHotZones, setShowHotZones] = useState(true);
  const [assumptions, setAssumptions] = useState<BuildAssumptions>(getDefaultAssumptions(sites[0]));
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const { save, toggleFavorite, saved } = useDeals();

  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      const baseScore = scoreDeal(site).score;
      const roi = modelDeal(getDefaultAssumptions(site)).roiPct;
      return (
        site.landPrice >= filters.minPrice &&
        site.landPrice <= filters.maxPrice &&
        site.lotSqft >= filters.minLotSqft &&
        site.lotSqft <= filters.maxLotSqft &&
        (filters.neighborhoods.length === 0 || filters.neighborhoods.includes(site.neighborhood)) &&
        (filters.zoning.length === 0 || filters.zoning.includes(site.zoning)) &&
        (filters.ownership.length === 0 || filters.ownership.includes(site.ownershipType)) &&
        baseScore >= filters.minDealScore &&
        (!filters.modularOnly || site.modularFitScore >= 75) &&
        (!filters.affordableOnly || site.affordabilityScore >= 75) &&
        site.distanceToCTA <= filters.maxTransitDistance &&
        roi >= filters.minROI
      );
    });
  }, [filters]);

  const dealScore = scoreDeal(selected);
  const financials = modelDeal(assumptions);
  const ai = getAIRecommendation(dealScore.score, financials.roiPct, selected.distanceToCTA);

  const selectSite = (site: SiteRecord) => {
    setSelected(site);
    setAssumptions(getDefaultAssumptions(site));
  };

  const exportCSV = () => {
    const csv = Papa.unparse([
      {
        address: selected.address,
        neighborhood: selected.neighborhood,
        dealScore: dealScore.score,
        recommendation: ai.stance,
        totalProjectCost: financials.totalProjectCost,
        annualNOI: financials.annualNOI,
        annualCashFlow: financials.annualCashFlow,
        roiPct: financials.roiPct,
        notes: selected.notes,
      },
    ]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sitesense-${selected.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const neighborhoods = [...new Set(sites.map((s) => s.neighborhood))];

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr_460px]">
      <aside className="panel p-4">
        <h2 className="text-lg font-semibold">Smart Filters</h2>
        <p className="mb-3 text-sm text-stone-600">SignalMap™ opportunity controls.</p>
        <div className="space-y-3 text-sm">
          <label className="block">Min DealScore™: {filters.minDealScore}
            <input type="range" min={1} max={100} value={filters.minDealScore}
              onChange={(e) => setFilters((p) => ({ ...p, minDealScore: +e.target.value }))} className="w-full" />
          </label>
          <label className="block">Max Price: {fmt(filters.maxPrice)}
            <input type="range" min={50000} max={300000} step={5000} value={filters.maxPrice}
              onChange={(e) => setFilters((p) => ({ ...p, maxPrice: +e.target.value }))} className="w-full" />
          </label>
          <label className="block">Transit (mi): {filters.maxTransitDistance.toFixed(2)}
            <input type="range" min={0.15} max={1.2} step={0.05} value={filters.maxTransitDistance}
              onChange={(e) => setFilters((p) => ({ ...p, maxTransitDistance: +e.target.value }))} className="w-full" />
          </label>
          <select className="w-full rounded-lg border p-2" onChange={(e) => setFilters((p) => ({ ...p, neighborhoods: e.target.value ? [e.target.value] : [] }))}>
            <option value="">All neighborhoods</option>
            {neighborhoods.map((n) => <option key={n}>{n}</option>)}
          </select>
          <label className="flex items-center gap-2"><input type="checkbox" checked={filters.modularOnly} onChange={(e) => setFilters((p) => ({ ...p, modularOnly: e.target.checked }))} /> Modular-friendly only</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={filters.affordableOnly} onChange={(e) => setFilters((p) => ({ ...p, affordableOnly: e.target.checked }))} /> Affordable-fit only</label>
          <button onClick={() => setShowHotZones((v) => !v)} className="w-full rounded-lg bg-brand-700 px-3 py-2 text-white">Toggle HotZones™</button>
        </div>
      </aside>

      <section className="panel relative min-h-[760px] overflow-hidden">
        {import.meta.env.VITE_MAPBOX_TOKEN ? (
          <Map
            mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/light-v11"
            initialViewState={{ longitude: -87.6298, latitude: 41.8781, zoom: 10.2 }}
            style={{ width: '100%', height: '100%' }}
          >
            <NavigationControl position="top-right" />
            {filteredSites.map((site) => {
              const { score } = scoreDeal(site);
              return (
                <Marker key={site.id} longitude={site.longitude} latitude={site.latitude} onClick={() => selectSite(site)}>
                  <button onMouseEnter={() => setHoveredId(site.id)} onMouseLeave={() => setHoveredId(null)} className={`h-5 w-5 rounded-full border-2 border-white ${score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} />
                </Marker>
              );
            })}
            {hoveredId && (
              <Popup
                closeButton={false}
                longitude={sites.find((s) => s.id === hoveredId)!.longitude}
                latitude={sites.find((s) => s.id === hoveredId)!.latitude}
              >
                <div className="text-xs font-medium">{sites.find((s) => s.id === hoveredId)!.address}</div>
              </Popup>
            )}
          </Map>
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_40%_40%,#e5efe8_0,#f8faf7_55%)] p-8 text-center">
            <div>
              <h3 className="text-xl font-semibold">SignalMap™ Ready</h3>
              <p className="mt-2 max-w-md text-sm text-stone-600">Add <code>VITE_MAPBOX_TOKEN</code> to enable live Mapbox tiles. Pins and filtering logic are fully wired for Chicago opportunities.</p>
            </div>
          </div>
        )}
        <div className="absolute bottom-3 left-3 rounded-xl bg-white/90 p-3 text-xs shadow">
          <p className="font-semibold">Live Opportunities: {filteredSites.length}</p>
          <p className="text-stone-600">Heat logic: score + growth + transit</p>
        </div>
        {showHotZones && (
          <div className="absolute right-3 top-3 w-72 space-y-2">
            {hotZones.map((z) => (
              <div key={z.neighborhood} className="rounded-lg border bg-white/90 p-2 text-xs backdrop-blur">
                <div className="font-semibold">{z.neighborhood} · {z.category}</div>
                <div className="text-stone-600">Investor Attractiveness: {z.investorAttractiveness}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <aside className="space-y-4">
        <section className="panel p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Deal Detail Panel</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${dealScore.score >= 80 ? 'bg-emerald-100 text-emerald-700' : dealScore.score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>DealScore™ {dealScore.score}</span>
          </div>
          <p className="font-medium">{selected.address}</p>
          <p className="text-sm text-stone-600">{selected.neighborhood}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <p>Asking: <span className="font-semibold">{fmt(selected.landPrice)}</span></p>
            <p>Lot: <span className="font-semibold">{selected.lotSqft} sqft</span></p>
            <p>Zoning: <span className="font-semibold">{selected.zoning}</span></p>
            <p>CTA: <span className="font-semibold">{selected.distanceToCTA} mi</span></p>
            <p>Buildable: <span className="font-semibold">~{assumptions.numberOfUnits} units</span></p>
            <p>Best use: <span className="font-semibold">{selected.suggestedUse}</span></p>
          </div>
          <p className="mt-2 text-xs text-stone-600">{dealScore.explanation}</p>
          <p className="mt-2 rounded-lg bg-stone-100 p-2 text-xs">{selected.notes}</p>

          <div className="mt-3 flex gap-2">
            <button onClick={() => save(selected.id)} className="rounded-lg bg-brand-700 px-3 py-2 text-xs text-white">Save to DealVault™</button>
            <button onClick={() => toggleFavorite(selected.id)} className="rounded-lg border px-3 py-2 text-xs">{saved[selected.id]?.favorite ? '★ Favorited' : '☆ Favorite'}</button>
            <button onClick={exportCSV} className="rounded-lg border px-3 py-2 text-xs">Export CSV</button>
          </div>
        </section>

        <section className="panel p-4">
          <h3 className="text-lg font-semibold">BuildIQ™ Development Calculator</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {[
              ['landPurchasePrice', 'Land'], ['modularCostPerSqft', 'Build $/sqft'], ['numberOfUnits', 'Units'], ['avgUnitSize', 'Unit size'], ['monthlyRentPerUnit', 'Rent/unit'], ['vacancyRate', 'Vacancy %'],
            ].map(([key, label]) => (
              <label key={key} className="block">
                {label}
                <input
                  className="mt-1 w-full rounded border p-1"
                  type="number"
                  value={assumptions[key as keyof BuildAssumptions] as number}
                  onChange={(e) => setAssumptions((p) => ({ ...p, [key]: +e.target.value }))}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="panel p-4">
          <h3 className="text-lg font-semibold">ReturnLens™ ROI Summary</h3>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <p>Total Cost <span className="block font-semibold">{fmt(financials.totalProjectCost)}</span></p>
            <p>Stabilized Value <span className="block font-semibold">{fmt(financials.stabilizedValue)}</span></p>
            <p>Annual NOI <span className="block font-semibold">{fmt(financials.annualNOI)}</span></p>
            <p>Annual Cash Flow <span className="block font-semibold">{fmt(financials.annualCashFlow)}</span></p>
            <p>Projected ROI <span className="block font-semibold">{financials.roiPct.toFixed(1)}%</span></p>
            <p>Deal Spread <span className="block font-semibold">{fmt(financials.developmentSpread)}</span></p>
          </div>
          <div className="mt-3 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: 'Cost', value: financials.totalProjectCost }, { name: 'Value', value: financials.stabilizedValue }]}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis hide />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Bar dataKey="value" fill="#2e6a4a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-4 text-sm">
          <h3 className="font-semibold">Would SiteSense build here?</h3>
          <p className="mt-2 text-lg font-semibold text-brand-700">{ai.stance}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-stone-700">
            {ai.reasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
          <p className="mt-2 rounded-lg bg-brand-50 p-2 text-xs">Suggested path: {ai.path}</p>
          <button className="mt-3 rounded-lg border px-3 py-2 text-xs">Export PDF (Stub)</button>
        </section>
      </aside>
    </div>
  );
};
