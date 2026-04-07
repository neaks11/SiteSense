import { useEffect, useMemo, useState } from 'react';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Papa from 'papaparse';
import { hotZones, sites } from '@/data/sites';
import {
  applyScenarioPreset,
  applyUnitMixTemplate,
  autoStrategyLabel,
  defaultWeights,
  getAIRecommendation,
  getConfidence,
  getCounterCase,
  getDealStory,
  getDefaultAssumptions,
  getRiskScore,
  modelDeal,
  scoreDeal,
} from '@/lib/finance';
import type { BuildAssumptions, DealScoreWeights, Filters, Persona, SiteRecord } from '@/lib/types';
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
  const [weights, setWeights] = useState<DealScoreWeights>(defaultWeights);
  const [sensitivityPct, setSensitivityPct] = useState(0);
  const [persona, setPersona] = useState<Persona>('Developer');
  const [showCounterCase, setShowCounterCase] = useState(false);
  const [pitchMode, setPitchMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { save, duplicate, toggleFavorite, saved, trackViewed, recentSites } = useDeals();

  useEffect(() => {
    trackViewed(selected.id);
  }, [selected.id, trackViewed]);

  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      const baseScore = scoreDeal(site, weights).score;
      const roi = modelDeal(getDefaultAssumptions(site), sensitivityPct).roiPct;
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
  }, [filters, sensitivityPct, weights]);

  const topDeals = useMemo(
    () => [...filteredSites].sort((a, b) => scoreDeal(b, weights).score - scoreDeal(a, weights).score).slice(0, 5),
    [filteredSites, weights],
  );

  const dealScore = scoreDeal(selected, weights);
  const financials = modelDeal(assumptions, sensitivityPct);
  const ai = getAIRecommendation(dealScore.score, financials.roiPct, selected.distanceToCTA, persona);
  const confidence = getConfidence(selected, sensitivityPct);
  const risk = getRiskScore(selected, financials.roiPct);
  const strategyLabel = autoStrategyLabel(assumptions, financials.roiPct);
  const story = getDealStory(selected, financials.roiPct, risk.score);
  const counterCase = getCounterCase(selected, financials.roiPct);

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
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="mb-3 flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 dark:border-stone-700 dark:bg-stone-900">
        <p className="text-sm font-semibold dark:text-stone-100">SignalMap™ Intelligence Lab</p>
        <div className="flex items-center gap-2">
          <button onClick={() => setPitchMode((v) => !v)} className="rounded-lg border px-3 py-1.5 text-xs dark:text-stone-100">Deal Pitch Mode</button>
          <button onClick={() => setDarkMode((v) => !v)} className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs text-white dark:bg-stone-100 dark:text-stone-900">{darkMode ? 'Light' : 'Dark'} Mode</button>
        </div>
      </div>

      {pitchMode ? (
        <section className="panel p-8 text-center">
          <p className="text-xs uppercase tracking-widest text-brand-700">Investor Pitch Snapshot</p>
          <h2 className="mt-2 text-3xl font-bold">{selected.address}</h2>
          <p className="mt-2 text-stone-600">{strategyLabel}</p>
          <div className="mt-5 grid grid-cols-2 gap-4 text-left md:grid-cols-4">
            <div><p className="text-xs text-stone-500">DealScore™</p><p className="text-2xl font-bold">{dealScore.score}</p></div>
            <div><p className="text-xs text-stone-500">Projected ROI</p><p className="text-2xl font-bold">{financials.roiPct.toFixed(1)}%</p></div>
            <div><p className="text-xs text-stone-500">Annual NOI</p><p className="text-2xl font-bold">{fmt(financials.annualNOI)}</p></div>
            <div><p className="text-xs text-stone-500">Spread</p><p className="text-2xl font-bold">{fmt(financials.developmentSpread)}</p></div>
          </div>
          <p className="mt-4 rounded-lg bg-stone-50 p-3 text-sm">{story}</p>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr_500px]">
          <aside className="panel h-fit space-y-4 p-4">
            <div>
              <h2 className="text-lg font-semibold">Smart Filters</h2>
              <p className="text-sm text-stone-600">SignalMap™ opportunity controls.</p>
            </div>

            <label className="block text-sm">Min DealScore™: {filters.minDealScore}
              <input type="range" min={1} max={100} value={filters.minDealScore}
                onChange={(e) => setFilters((p) => ({ ...p, minDealScore: +e.target.value }))} className="w-full" />
            </label>
            <label className="block text-sm">Max Price: {fmt(filters.maxPrice)}
              <input type="range" min={50000} max={300000} step={5000} value={filters.maxPrice}
                onChange={(e) => setFilters((p) => ({ ...p, maxPrice: +e.target.value }))} className="w-full" />
            </label>
            <label className="block text-sm">Sensitivity (Rent↑/Cost↓): {sensitivityPct}%
              <input type="range" min={-20} max={20} step={1} value={sensitivityPct}
                onChange={(e) => setSensitivityPct(+e.target.value)} className="w-full" />
            </label>
            <label className="block text-sm">Transit (mi): {filters.maxTransitDistance.toFixed(2)}
              <input type="range" min={0.15} max={1.2} step={0.05} value={filters.maxTransitDistance}
                onChange={(e) => setFilters((p) => ({ ...p, maxTransitDistance: +e.target.value }))} className="w-full" />
            </label>
            <select className="w-full rounded-lg border p-2 text-sm" onChange={(e) => setFilters((p) => ({ ...p, neighborhoods: e.target.value ? [e.target.value] : [] }))}>
              <option value="">All neighborhoods</option>
              {neighborhoods.map((n) => <option key={n}>{n}</option>)}
            </select>

            <div className="rounded-lg border p-3">
              <p className="mb-2 text-xs font-semibold uppercase text-stone-500">DealScore weight control</p>
              {(Object.keys(weights) as (keyof DealScoreWeights)[]).map((k) => (
                <label key={k} className="block text-xs">{k}: {weights[k]}
                  <input className="w-full" type="range" min={5} max={45} value={weights[k]} onChange={(e) => setWeights((p) => ({ ...p, [k]: +e.target.value }))} />
                </label>
              ))}
            </div>

            <div className="rounded-lg border p-3">
              <p className="mb-2 text-xs font-semibold uppercase text-stone-500">Top 5 deals right now</p>
              <ul className="space-y-1 text-xs">
                {topDeals.map((d) => <li key={d.id} className="cursor-pointer rounded p-1 hover:bg-stone-100" onClick={() => selectSite(d)}>{d.address} · {scoreDeal(d, weights).score}</li>)}
              </ul>
            </div>

            <button onClick={() => setShowHotZones((v) => !v)} className="w-full rounded-lg bg-brand-700 px-3 py-2 text-sm text-white">Toggle HotZones™</button>
          </aside>

          <section className="panel relative min-h-[860px] overflow-hidden">
            {import.meta.env.VITE_MAPBOX_TOKEN ? (
              <Map
                mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                mapStyle="mapbox://styles/mapbox/light-v11"
                initialViewState={{ longitude: -87.6298, latitude: 41.8781, zoom: 10.2 }}
                style={{ width: '100%', height: '100%' }}
              >
                <NavigationControl position="top-right" />
                {filteredSites.map((site) => {
                  const score = scoreDeal(site, weights).score;
                  return (
                    <Marker key={site.id} longitude={site.longitude} latitude={site.latitude} onClick={() => selectSite(site)}>
                      <button onMouseEnter={() => setHoveredId(site.id)} onMouseLeave={() => setHoveredId(null)} className={`h-5 w-5 rounded-full border-2 border-white ${score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} />
                    </Marker>
                  );
                })}
                {hoveredId && (
                  <Popup closeButton={false} longitude={sites.find((s) => s.id === hoveredId)!.longitude} latitude={sites.find((s) => s.id === hoveredId)!.latitude}>
                    <div className="text-xs">
                      <p className="font-semibold">{sites.find((s) => s.id === hoveredId)!.address}</p>
                      <p>Score {scoreDeal(sites.find((s) => s.id === hoveredId)!, weights).score}</p>
                      <p>{fmt(sites.find((s) => s.id === hoveredId)!.landPrice)}</p>
                    </div>
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

          <aside className="sticky top-3 space-y-4 self-start">
            <section className="panel p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Deal Detail Panel</h3>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${dealScore.score >= 80 ? 'bg-emerald-100 text-emerald-700' : dealScore.score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>DealScore™ {dealScore.score}</span>
              </div>
              <p className="font-medium">{selected.address}</p>
              <p className="text-sm text-stone-600">{selected.neighborhood} · Confidence: {confidence}</p>
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
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => save(selected.id)} className="rounded-lg bg-brand-700 px-3 py-2 text-xs text-white">Save</button>
                <button onClick={() => duplicate(selected.id)} className="rounded-lg border px-3 py-2 text-xs">Duplicate</button>
                <button onClick={() => toggleFavorite(selected.id)} className="rounded-lg border px-3 py-2 text-xs">{saved[selected.id]?.favorite ? '★' : '☆'}</button>
                <button onClick={exportCSV} className="rounded-lg border px-3 py-2 text-xs">CSV</button>
              </div>
              <button onClick={() => setShowCounterCase((v) => !v)} className="mt-2 text-xs text-brand-700">Why NOT build here?</button>
              {showCounterCase && <ul className="mt-1 list-disc pl-5 text-xs text-stone-600">{counterCase.map((r) => <li key={r}>{r}</li>)}</ul>}
            </section>

            <section className="panel p-4">
              <h3 className="text-lg font-semibold">BuildIQ™</h3>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {(['Conservative', 'Aggressive', 'Section 8 Strategy'] as const).map((s) => <button key={s} className="rounded-full border px-2 py-1" onClick={() => setAssumptions((p) => applyScenarioPreset(s, p))}>{s}</button>)}
                {(['3-flat Chicago', '6-unit multifamily', 'Townhomes'] as const).map((s) => <button key={s} className="rounded-full border px-2 py-1" onClick={() => setAssumptions((p) => applyUnitMixTemplate(s, p))}>{s}</button>)}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                {[['landPurchasePrice', 'Land'], ['modularCostPerSqft', 'Build $/sqft'], ['numberOfUnits', 'Units'], ['avgUnitSize', 'Unit size'], ['monthlyRentPerUnit', 'Rent/unit'], ['vacancyRate', 'Vacancy'], ['timelineMonths', 'Timeline mo']].map(([key, label]) => (
                  <label key={key}>{label}
                    <input className="mt-1 w-full rounded border p-1" type="number" value={assumptions[key as keyof BuildAssumptions] as number} onChange={(e) => setAssumptions((p) => ({ ...p, [key]: +e.target.value }))} />
                  </label>
                ))}
                <label>Exit
                  <select className="mt-1 w-full rounded border p-1" value={assumptions.exitStrategy} onChange={(e) => setAssumptions((p) => ({ ...p, exitStrategy: e.target.value as BuildAssumptions['exitStrategy'] }))}><option>Hold</option><option>Sell</option></select>
                </label>
                <label>Capital
                  <select className="mt-1 w-full rounded border p-1" value={assumptions.capitalType} onChange={(e) => setAssumptions((p) => ({ ...p, capitalType: e.target.value as BuildAssumptions['capitalType'] }))}><option>Financed</option><option>Cash</option></select>
                </label>
              </div>
            </section>

            <section className="panel p-4">
              <h3 className="text-lg font-semibold">ReturnLens™ + Risk</h3>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <p>Total Cost <span className="block font-semibold">{fmt(financials.totalProjectCost)}</span></p>
                <p>Stabilized Value <span className="block font-semibold">{fmt(financials.stabilizedValue)}</span></p>
                <p>NOI <span className="block font-semibold">{fmt(financials.annualNOI)}</span></p>
                <p>Cash Flow <span className="block font-semibold">{fmt(financials.annualCashFlow)}</span></p>
                <p>Cost/Unit <span className="block font-semibold">{fmt(financials.totalCostPerUnit)}</span></p>
                <p>Cost/Sqft <span className="block font-semibold">{fmt(financials.totalCostPerSqft)}</span></p>
                <p>Revenue/Unit <span className="block font-semibold">{fmt(financials.revenuePerUnit)}</span></p>
                <p>Carrying <span className="block font-semibold">{fmt(financials.carryingCost)}</span></p>
              </div>
              <div className="mt-2 rounded-lg bg-stone-100 p-2 text-xs">Risk Score: <span className="font-semibold">{risk.score}</span> | Permitting {Math.round(risk.permittingRisk)} · Overrun {Math.round(risk.costOverrunRisk)} · Rent {Math.round(risk.rentUncertainty)}</div>
              <div className="mt-3 h-32">
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
              <label className="mt-2 block text-xs">Strategy persona
                <select className="mt-1 w-full rounded border p-1" value={persona} onChange={(e) => setPersona(e.target.value as Persona)}>
                  <option>Beginner Investor</option><option>Developer</option><option>Cash Flow Buyer</option>
                </select>
              </label>
              <p className="mt-2 text-lg font-semibold text-brand-700">{ai.stance}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-stone-700">
                {ai.reasons.map((r) => <li key={r}>{r}</li>)}
              </ul>
              <p className="mt-2 rounded-lg bg-brand-50 p-2 text-xs">Auto strategy: {strategyLabel}</p>
              <p className="mt-2 rounded-lg bg-stone-100 p-2 text-xs">Deal story: {story}</p>
              <p className="mt-2 text-xs font-medium">What would a pro do? Lock contractor pricing, secure zoning counsel, and structure two exit paths within 30 days.</p>
              <button className="mt-3 rounded-lg border px-3 py-2 text-xs">Export PDF (Stub)</button>
            </section>

            {!!recentSites.length && (
              <section className="panel p-4 text-xs">
                <h3 className="font-semibold">Recently viewed</h3>
                <ul className="mt-2 space-y-1">
                  {recentSites.map((site) => <li key={site.id} className="cursor-pointer rounded p-1 hover:bg-stone-100" onClick={() => selectSite(site)}>{site.address}</li>)}
                </ul>
              </section>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};
