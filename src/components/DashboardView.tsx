import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Papa from 'papaparse';
import { hotZones, sites } from '@/data/sites';
import {
  defaultSensitivity,
  dealStory,
  getConfidence,
  getConfidenceBands,
  getDefaultAssumptions,
  getRecommendation,
  getRiskBreakdown,
  getWhyNot,
  modelDeal,
  personaWeights,
  scoreDeal,
  statusColor,
  unitMixTemplates,
  warningBanners,
} from '@/lib/finance';
import type { BuildAssumptions, Filters, PipelineStatus, SavedView, Sensitivity, SiteRecord } from '@/lib/types';
import { useDeals } from './DealContext';
import { CostBreakdownCard } from './dashboard/CostBreakdownCard';
import { DealPitchView } from './dashboard/DealPitchView';
import { DealScoreWeightsCard } from './dashboard/DealScoreWeights';
import { DeltaMetric } from './dashboard/DeltaMetric';
import { ICMemoCard } from './dashboard/ICMemoCard';
import { FilterPresets } from './dashboard/FilterPresets';
import { GuidedChecklist } from './dashboard/GuidedChecklist';
import { LayoutToggle } from './dashboard/LayoutToggle';
import { LocalActivityFeed } from './dashboard/LocalActivityFeed';
import { NeighborhoodSummary } from './dashboard/NeighborhoodSummary';
import { OpportunityFunnel } from './dashboard/OpportunityFunnel';
import { RecommendationHistory } from './dashboard/RecommendationHistory';
import { RiskAnalysisCard } from './dashboard/RiskAnalysisCard';
import { ScenarioPresetBar } from './dashboard/ScenarioPresetBar';
import { ScoreExplanationDrawer } from './dashboard/ScoreExplanationDrawer';
import { SearchBar } from './dashboard/SearchBar';
import { SensitivityControls } from './dashboard/SensitivityControls';
import { SmartWarnings } from './dashboard/SmartWarnings';
import { StrategyPersonaSelector } from './dashboard/StrategyPersonaSelector';
import { TopDealsPanel } from './dashboard/TopDealsPanel';
import { SimulationPanel } from './dashboard/SimulationPanel';

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

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

const sortOptions = ['Highest score', 'Lowest price', 'Highest projected ROI', 'Lowest risk', 'Fastest timeline'] as const;

export const DashboardView = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(defaultFilters);
  const [selected, setSelected] = useState<SiteRecord>(sites[0]);
  const [showHotZones, setShowHotZones] = useState(true);
  const [assumptions, setAssumptions] = useState<BuildAssumptions>(getDefaultAssumptions(sites[0]));
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sensitivity, setSensitivity] = useState<Sensitivity>(defaultSensitivity);
  const [pitchMode, setPitchMode] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]>('Highest score');
  const [showWhyNot, setShowWhyNot] = useState(false);
  const [showPrintable, setShowPrintable] = useState(false);
  const [checklist, setChecklist] = useState<string[]>([]);
  const [recommendationHistory, setRecommendationHistory] = useState<string[]>([]);
  const [scenarioBook, setScenarioBook] = useState<Record<string, BuildAssumptions>>({
    'Base Case': getDefaultAssumptions(sites[0]),
    'Bank Case': getDefaultAssumptions(sites[0]),
    'Stretch Case': getDefaultAssumptions(sites[0]),
    'Stress Test': getDefaultAssumptions(sites[0]),
  });
  const [activeScenario, setActiveScenario] = useState<keyof typeof scenarioBook>('Base Case');

  const {
    save,
    duplicate,
    toggleFavorite,
    saved,
    trackViewed,
    recentSites,
    activityFeed,
    darkMode,
    setDarkMode,
    compactMode,
    setCompactMode,
    selectedPersona,
    setSelectedPersona,
    scoreWeights,
    setScoreWeights,
    addSavedView,
    savedViews,
    savedAssumptionProfiles,
    addAssumptionProfile,
    setStatus,
    setScenarioLabel,
    logActivity,
    addDecisionSnapshot,
    markForShare,
  } = useDeals();

  useEffect(() => {
    trackViewed(selected.id);
  }, [selected.id, trackViewed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 's') save(selected.id);
      if (e.key.toLowerCase() === 'c') navigate('/compare');
      if (e.key.toLowerCase() === 'p') setPitchMode((v) => !v);
      if (e.key.toLowerCase() === 'd') setDarkMode(!darkMode);
      if (e.key.toLowerCase() === 'u') duplicate(selected.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [darkMode, duplicate, save, selected.id, setDarkMode, navigate]);

  const scoredRows = useMemo(() => {
    return sites.map((site) => {
      const base = site.id === selected.id ? assumptions : getDefaultAssumptions(site);
      const model = modelDeal(base, sensitivity);
      const risk = getRiskBreakdown(site, model);
      const score = scoreDeal(site, model, risk.score, scoreWeights);
      return { site, model, risk, score };
    });
  }, [assumptions, scoreWeights, selected.id, sensitivity]);

  const filtered = useMemo(() => {
    const searched = scoredRows.filter(({ site }) => {
      const needle = search.toLowerCase().trim();
      if (!needle) return true;
      const savedItem = saved[site.id];
      const hay = [site.address, site.neighborhood, site.zoning, savedItem?.tag, savedItem?.note?.investmentThesis].join(' ').toLowerCase();
      return hay.includes(needle);
    });

    const byFilters = searched.filter(({ site, model, score }) =>
      site.landPrice >= filters.minPrice &&
      site.landPrice <= filters.maxPrice &&
      site.lotSqft >= filters.minLotSqft &&
      site.lotSqft <= filters.maxLotSqft &&
      (filters.neighborhoods.length === 0 || filters.neighborhoods.includes(site.neighborhood)) &&
      score.score >= filters.minDealScore &&
      site.distanceToCTA <= filters.maxTransitDistance &&
      model.roiPct >= filters.minROI,
    );

    return [...byFilters].sort((a, b) => {
      if (sortBy === 'Lowest price') return a.site.landPrice - b.site.landPrice;
      if (sortBy === 'Highest projected ROI') return b.model.roiPct - a.model.roiPct;
      if (sortBy === 'Lowest risk') return a.risk.score - b.risk.score;
      if (sortBy === 'Fastest timeline') return getDefaultAssumptions(a.site).timelineMonths - getDefaultAssumptions(b.site).timelineMonths;
      return b.score.score - a.score.score;
    });
  }, [filters, saved, scoreWeights, scoredRows, search, sortBy]);

  const topDeals = filtered.slice(0, 5).map((r) => ({ site: r.site, score: r.score.score }));
  const selectedRow = scoredRows.find((x) => x.site.id === selected.id) ?? scoredRows[0];
  const baselineModel = modelDeal(getDefaultAssumptions(selected), defaultSensitivity);
  const recommendation = getRecommendation(selectedRow.score.score, selectedRow.model.roiPct, selectedRow.risk.score, selectedPersona);
  const confidence = getConfidence(sensitivity, selectedRow.score.score, selectedRow.risk.score);
  const whyNot = getWhyNot(selected, selectedRow.model, selectedRow.risk.score);
  const warnings = warningBanners(selectedRow.model, selectedRow.risk.score, sensitivity);
  const story = dealStory(selected, recommendation, selectedRow.model, selectedRow.risk.score);
  const bands = getConfidenceBands(selectedRow.model);
  const diligenceCompleteness = Math.round(((checklist.length / 8) * 70) + ((saved[selected.id]?.note?.investmentThesis ? 1 : 0) * 30));

  const playbook = ({
    New: ['Pull parcel comps', 'Check zoning envelope', 'Set baseline assumptions'],
    Reviewing: ['Validate rent comps', 'Call 2 GCs for rough pricing', 'Set go/no-go guardrails'],
    Underwriting: ['Stress-test downside case', 'Review financing terms', 'Draft IC memo'],
    Contacted: ['Confirm seller timeline', 'Verify title/encumbrances', 'Request survey if available'],
    Offered: ['Draft contingencies', 'Model revised basis', 'Prep attorney handoff'],
    Dead: ['Archive lessons learned', 'Tag rejection reason', 'Reallocate budget to top alternatives'],
    Closed: ['Kick off predevelopment checklist', 'Lock design + permits', 'Track monthly variance'],
  } as const)[(saved[selected.id]?.status ?? 'New') as PipelineStatus];


  useEffect(() => {
    const msg = `${new Date().toLocaleTimeString()} · ${recommendation.stance} (${recommendation.bestFit})`;
    setRecommendationHistory((prev) => [msg, ...prev.filter((p) => p !== msg)].slice(0, 12));
  }, [recommendation.bestFit, recommendation.stance]);

  const neighborhoods = useMemo(() => {
    const groups = new Map<string, typeof filtered>();
    filtered.forEach((r) => {
      const arr = groups.get(r.site.neighborhood) ?? [];
      arr.push(r);
      groups.set(r.site.neighborhood, arr);
    });
    return [...groups.entries()].slice(0, 6).map(([neighborhood, rows]) => ({
      neighborhood,
      avgScore: Math.round(rows.reduce((s, r) => s + r.score.score, 0) / rows.length),
      avgPrice: rows.reduce((s, r) => s + r.site.landPrice, 0) / rows.length,
      dominant: rows[0]?.site.suggestedUse ?? 'Duplex',
      risk: rows.reduce((s, r) => s + r.risk.score, 0) / rows.length > 60 ? 'High' : 'Moderate',
    }));
  }, [filtered]);

  const exportCSV = () => {
    const csv = Papa.unparse([{ address: selected.address, score: selectedRow.score.score, risk: selectedRow.risk.score, roi: selectedRow.model.roiPct, recommendation: recommendation.bestFit, confidence, note: saved[selected.id]?.note?.investmentThesis ?? '' }]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sitesense-${selected.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const applyFilterPreset = (name: string) => {
    const preset = ({
      'Cheap land': { ...defaultFilters, maxPrice: 75000 },
      'Best hold deals': { ...defaultFilters, minDealScore: 70, minROI: 8 },
      'Best flip candidates': { ...defaultFilters, minROI: 12, maxTransitDistance: 1.1 },
      'Highest score': { ...defaultFilters, minDealScore: 80 },
      'Low risk': { ...defaultFilters, minDealScore: 65, maxTransitDistance: 0.7 },
    } as Record<string, Filters>)[name];
    if (preset) setFilters(preset);
    logActivity(`Applied filter preset ${name}`);
  };

  const applySavedView = (v: SavedView) => {
    setFilters(v.filters);
    setSelectedPersona(v.persona);
    setScoreWeights(v.scoreWeights);
    logActivity(`Loaded saved view ${v.name}`);
  };

  const onSelect = (site: SiteRecord) => {
    setSelected(site);
    const base = getDefaultAssumptions(site);
    setAssumptions(base);
    setScenarioBook({
      'Base Case': base,
      'Bank Case': base,
      'Stretch Case': base,
      'Stress Test': base,
    });
    setActiveScenario('Base Case');
  };

  return (
    <div className={`${darkMode ? 'dark' : ''} ${showPrintable ? 'printable' : ''}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 dark:border-stone-700 dark:bg-stone-900">
        <div>
          <p className="text-sm font-semibold dark:text-stone-100">SignalMap™ Underwriting Workstation</p>
          <p className="text-xs text-stone-500">Shortcuts: S save · C compare · P pitch · D dark · U duplicate</p>
        </div>
        <div className="flex gap-2">
          <LayoutToggle compact={compactMode} onToggle={() => setCompactMode(!compactMode)} />
          <button className="rounded-lg border px-3 py-1.5 text-xs" onClick={() => setPitchMode((v) => !v)}>Deal Pitch Mode</button>
          <button className="rounded-lg border px-3 py-1.5 text-xs" onClick={() => setShowPrintable((v) => !v)}>Printable Summary</button>
          <button className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs text-white dark:bg-stone-100 dark:text-stone-900" onClick={() => setDarkMode(!darkMode)}>{darkMode ? 'Light' : 'Dark'} Mode</button>
        </div>
      </div>

      {pitchMode ? (
        <DealPitchView title={selected.address} score={selectedRow.score.score} risk={selectedRow.risk.score} roi={selectedRow.model.roiPct} strategy={recommendation.bestFit} recommendation={`${recommendation.stance} · ${recommendation.voice}`} note={story} />
      ) : (
        <div className={`grid gap-4 ${compactMode ? 'lg:grid-cols-[280px_1fr_430px]' : 'lg:grid-cols-[320px_1fr_500px]'}`}>
          <aside className="panel h-fit space-y-3 p-4">
            <SearchBar value={search} onChange={setSearch} />
            <label className="block text-sm">Sort
              <select className="mt-1 w-full rounded-lg border p-2 text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value as (typeof sortOptions)[number])}>
                {sortOptions.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <FilterPresets onApply={applyFilterPreset} />
            <OpportunityFunnel total={sites.length} afterFilters={scoredRows.length} afterSearch={filtered.length} />
            <label className="block text-xs">Min DealScore: {filters.minDealScore}<input className="w-full" type="range" min={1} max={100} value={filters.minDealScore} onChange={(e) => setFilters((p) => ({ ...p, minDealScore: +e.target.value }))} /></label>
            <label className="block text-xs">Max Price: {fmt(filters.maxPrice)}<input className="w-full" type="range" min={50000} max={300000} step={5000} value={filters.maxPrice} onChange={(e) => setFilters((p) => ({ ...p, maxPrice: +e.target.value }))} /></label>
            <label className="block text-xs">Min ROI: {filters.minROI.toFixed(1)}%<input className="w-full" type="range" min={-20} max={30} step={1} value={filters.minROI} onChange={(e) => setFilters((p) => ({ ...p, minROI: +e.target.value }))} /></label>
            <select className="w-full rounded-lg border p-2 text-sm" onChange={(e) => setFilters((p) => ({ ...p, neighborhoods: e.target.value ? [e.target.value] : [] }))}><option value="">All neighborhoods</option>{[...new Set(sites.map((s) => s.neighborhood))].map((n) => <option key={n}>{n}</option>)}</select>
            <StrategyPersonaSelector value={selectedPersona} onChange={(p) => { setSelectedPersona(p); setScoreWeights(personaWeights(p)); logActivity(`Changed persona to ${p}`); }} />
            <DealScoreWeightsCard weights={scoreWeights} onChange={(w) => { setScoreWeights(w); logActivity('Adjusted score weights'); }} />
            <SensitivityControls sensitivity={sensitivity} onChange={setSensitivity} />
            <TopDealsPanel deals={topDeals} onSelect={onSelect} />
            <button className="w-full rounded-lg border px-3 py-2 text-xs" onClick={() => addSavedView(`Custom ${new Date().toLocaleTimeString()}`, filters, selectedPersona, scoreWeights)}>Save current view</button>
            {!!savedViews.length && <select className="w-full rounded-lg border p-2 text-xs" onChange={(e) => { const found = savedViews.find((v) => v.id === e.target.value); if (found) applySavedView(found); }}><option>Load saved view...</option>{savedViews.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>}
            <button className="w-full rounded-lg border px-3 py-2 text-xs" onClick={() => addAssumptionProfile(`Profile ${new Date().toLocaleTimeString()}`, assumptions)}>Save assumption profile</button>
            {!!savedAssumptionProfiles.length && <select className="w-full rounded-lg border p-2 text-xs" onChange={(e) => { const found = savedAssumptionProfiles.find((p) => p.id === e.target.value); if (found) setAssumptions(found.assumptions); }}><option>Load assumption profile...</option>{savedAssumptionProfiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}
          </aside>

          <section className="panel relative min-h-[900px] overflow-hidden">
            {import.meta.env.VITE_MAPBOX_TOKEN ? (
              <Map mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN} mapStyle="mapbox://styles/mapbox/light-v11" initialViewState={{ longitude: -87.6298, latitude: 41.8781, zoom: 10.2 }} style={{ width: '100%', height: '100%' }}>
                <NavigationControl position="top-right" />
                {filtered.map(({ site, score }) => (
                  <Marker key={site.id} longitude={site.longitude} latitude={site.latitude} onClick={() => onSelect(site)}>
                    <button onMouseEnter={() => setHoveredId(site.id)} onMouseLeave={() => setHoveredId(null)} className={`h-5 w-5 rounded-full border-2 border-white ${score.score >= 80 ? 'bg-emerald-500' : score.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} />
                  </Marker>
                ))}
                {hoveredId && (() => {
                  const row = filtered.find((x) => x.site.id === hoveredId);
                  if (!row) return null;
                  return (
                    <Popup closeButton={false} longitude={row.site.longitude} latitude={row.site.latitude}>
                      <div className="text-xs">
                        <p className="font-semibold">{row.site.address}</p>
                        <p>Score {row.score.score} · {row.site.suggestedUse}</p>
                        <p>{fmt(row.site.landPrice)}</p>
                        <p className="text-stone-600">{row.site.notes}</p>
                      </div>
                    </Popup>
                  );
                })()}
              </Map>
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-center"><div><h3 className="text-xl font-semibold">SignalMap™ Ready</h3><p className="mt-2 text-sm text-stone-600">Add <code>VITE_MAPBOX_TOKEN</code> to enable Mapbox tiles.</p></div></div>
            )}
            {showHotZones && <div className="absolute right-3 top-3 w-72 space-y-2">{hotZones.map((z) => <div key={z.neighborhood} className="rounded-lg border bg-white/90 p-2 text-xs"><div className="font-semibold">{z.neighborhood}</div><div>{z.category}</div></div>)}</div>}
            <button className="absolute bottom-3 left-3 rounded-lg border bg-white px-3 py-1 text-xs" onClick={() => setShowHotZones((v) => !v)}>{showHotZones ? 'Hide' : 'Show'} HotZones</button>
          </section>

          <aside className="sticky top-3 space-y-4 self-start">
            <section className="panel p-4">
              <div className="mb-2 flex flex-wrap gap-2">
                {(Object.keys(scenarioBook) as (keyof typeof scenarioBook)[]).map((name) => (
                  <button key={name} className={`rounded-full border px-2 py-1 text-xs ${activeScenario === name ? 'bg-brand-700 text-white' : ''}`} onClick={() => { setActiveScenario(name); setAssumptions(scenarioBook[name]); }}>
                    {name}
                  </button>
                ))}
                <button className="rounded-full border px-2 py-1 text-xs" onClick={() => setScenarioBook((prev) => ({ ...prev, [activeScenario]: assumptions }))}>Save to scenario</button>
              </div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Deal Detail Panel</h3>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedRow.score.score >= 80 ? 'bg-emerald-100 text-emerald-700' : selectedRow.score.score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>DealScore™ {selectedRow.score.score}</span>
              </div>
              <p className="font-medium">{selected.address}</p>
              <p className="text-sm text-stone-600">Confidence: {confidence} · Risk: {selectedRow.risk.score}/100</p>
              <p className="mt-1 text-xs text-brand-700">Operator DNA: {recommendation.operatorDNA}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <p>Asking <span className="block font-semibold">{fmt(selected.landPrice)}</span></p>
                <p>Lot <span className="block font-semibold">{selected.lotSqft} sqft</span></p>
                <p>Status <span className="block"><span className={`rounded-full px-2 py-0.5 ${statusColor((saved[selected.id]?.status ?? 'New') as PipelineStatus)}`}>{saved[selected.id]?.status ?? 'New'}</span></span></p>
                <p>Strategy <span className="block font-semibold">{recommendation.bestFit}</span></p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button className="rounded-lg bg-brand-700 px-3 py-2 text-xs text-white" onClick={() => save(selected.id)}>Save</button>
                <button className="rounded-lg border px-3 py-2 text-xs" onClick={() => duplicate(selected.id)}>Duplicate</button>
                <button className="rounded-lg border px-3 py-2 text-xs" onClick={() => toggleFavorite(selected.id)}>{saved[selected.id]?.favorite ? '★' : '☆'}</button>
                <button className="rounded-lg border px-3 py-2 text-xs" onClick={exportCSV}>Export CSV</button>
                <button className="rounded-lg border px-3 py-2 text-xs" onClick={() => window.print()}>PDF Export Screen</button>
                <button className="rounded-lg border px-3 py-2 text-xs" onClick={() => {
                  addDecisionSnapshot({ key: selected.id, score: selectedRow.score.score, roi: selectedRow.model.roiPct, risk: selectedRow.risk.score, recommendation: `${recommendation.stance} · ${recommendation.bestFit}` });
                }}>Snapshot decision</button>
                <button className="rounded-lg border px-3 py-2 text-xs" onClick={() => markForShare(selected.id)}>Mark for share packet</button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <select className="rounded border p-1" value={saved[selected.id]?.status ?? 'New'} onChange={(e) => setStatus(selected.id, e.target.value as PipelineStatus)}>
                  <option>New</option><option>Reviewing</option><option>Underwriting</option><option>Contacted</option><option>Offered</option><option>Dead</option><option>Closed</option>
                </select>
                <select className="rounded border p-1" value={saved[selected.id]?.scenarioLabel ?? 'Base Case'} onChange={(e) => setScenarioLabel(selected.id, e.target.value as 'Base Case' | 'Stretch Case' | 'Stress Test' | 'Bank Case' | 'Sell Case')}>
                  <option>Base Case</option><option>Stretch Case</option><option>Stress Test</option><option>Bank Case</option><option>Sell Case</option>
                </select>
              </div>
              <button className="mt-2 text-xs text-brand-700" onClick={() => setShowWhyNot((v) => !v)}>Why NOT build here?</button>
              {showWhyNot && <ul className="mt-1 list-disc pl-5 text-xs text-stone-600">{whyNot.map((r) => <li key={r}>{r}</li>)}</ul>}
            </section>

            <section className="panel p-4 text-xs">
              <h3 className="font-semibold">BuildIQ™ controls</h3>
              <ScenarioPresetBar current={assumptions} onApply={setAssumptions} />
              <div className="mt-2 flex flex-wrap gap-2">{Object.entries(unitMixTemplates).map(([name, fn]) => <button key={name} className="rounded-full border px-2 py-1" onClick={() => setAssumptions(fn(assumptions))}>{name}</button>)}</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[['landPurchasePrice', 'Land'], ['modularCostPerSqft', 'Build $/sqft'], ['numberOfUnits', 'Units'], ['avgUnitSize', 'Unit size'], ['monthlyRentPerUnit', 'Rent/unit'], ['vacancyRate', 'Vacancy %'], ['timelineMonths', 'Timeline mo'], ['loanToCost', 'Loan %'], ['interestRate', 'Interest %'], ['loanTermYears', 'Term yrs']].map(([key, label]) => (
                  <label key={key}>{label}<input className="mt-1 w-full rounded border p-1" type="number" value={assumptions[key as keyof BuildAssumptions] as number} onChange={(e) => setAssumptions((p) => ({ ...p, [key]: +e.target.value }))} /></label>
                ))}
                <label>Exit<select className="mt-1 w-full rounded border p-1" value={assumptions.exitStrategy} onChange={(e) => setAssumptions((p) => ({ ...p, exitStrategy: e.target.value as BuildAssumptions['exitStrategy'] }))}><option>Flip</option><option>Hold</option><option>Refinance and Hold</option><option>Sell to Operator</option></select></label>
                <label>Capital<select className="mt-1 w-full rounded border p-1" value={assumptions.capitalType} onChange={(e) => setAssumptions((p) => ({ ...p, capitalType: e.target.value as BuildAssumptions['capitalType'] }))}><option>Loan</option><option>Cash</option></select></label>
                <label className="col-span-2 flex items-center gap-2"><input type="checkbox" checked={assumptions.interestOnly} onChange={(e) => setAssumptions((p) => ({ ...p, interestOnly: e.target.checked }))} /> Interest only</label>
              </div>
              <div className="mt-2 flex gap-2">
                <button className="rounded border px-2 py-1" onClick={() => setAssumptions(getDefaultAssumptions(selected))}>Reset all</button>
                <button className="rounded border px-2 py-1" onClick={() => setSensitivity(defaultSensitivity)}>Reset sensitivity</button>
              </div>
            </section>

            <section className="panel p-4 text-sm">
              <div className="mb-2 grid grid-cols-3 gap-2">
                <DeltaMetric label="DealScore" value={selectedRow.score.score} prev={scoreDeal(selected, baselineModel, selectedRow.risk.score, scoreWeights).score} />
                <DeltaMetric label="ROI %" value={selectedRow.model.roiPct} prev={baselineModel.roiPct} />
                <DeltaMetric label="Risk" value={selectedRow.risk.score} prev={getRiskBreakdown(selected, baselineModel).score} />
              </div>
              <h3 className="font-semibold">ReturnLens™</h3>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <p>Total Cost <span className="block font-semibold">{fmt(selectedRow.model.totalProjectCost)}</span></p>
                <p>Stabilized Value <span className="block font-semibold">{fmt(selectedRow.model.stabilizedValue)}</span></p>
                <p>NOI <span className="block font-semibold">{fmt(selectedRow.model.annualNOI)}</span></p>
                <p>Cash Flow <span className="block font-semibold">{fmt(selectedRow.model.annualCashFlow)}</span></p>
                <p>Break-even Rent <span className="block font-semibold">{fmt(selectedRow.model.breakEvenRent)}</span></p>
                <p>Break-even Exit <span className="block font-semibold">{fmt(selectedRow.model.breakEvenExit)}</span></p>
                <p>Max All-in Cost <span className="block font-semibold">{fmt(selectedRow.model.maxAllInCost)}</span></p>
                <p>ROI <span className="block font-semibold">{selectedRow.model.roiPct.toFixed(1)}%</span></p>
                <p>NOI Band <span className="block font-semibold">{fmt(bands.noiLow)} - {fmt(bands.noiHigh)}</span></p>
                <p>Value Band <span className="block font-semibold">{fmt(bands.valueLow)} - {fmt(bands.valueHigh)}</span></p>
              </div>
              <div className="mt-2 h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: 'Revenue', v: selectedRow.model.stabilizedValue }, { name: 'Land', v: -assumptions.landPurchasePrice }, { name: 'Build', v: -selectedRow.model.hardCost }, { name: 'Soft', v: -(assumptions.softCosts + assumptions.siteWorkUtilities) }, { name: 'Financing', v: -selectedRow.model.financingCost }, { name: 'Profit', v: selectedRow.model.developmentSpread }]}>
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="v" fill="#2e6a4a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <ICMemoCard thesis={story} bearCase={`If rents drop 10%, projected cash flow weakens quickly.`} risks={whyNot} recommendation={`${recommendation.stance} · ${recommendation.bestFit}`} completeness={diligenceCompleteness} />
            <section className="panel p-4 text-xs">
              <h3 className="font-semibold">Execution Playbook</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {playbook.map((step) => <li key={step}>{step}</li>)}
              </ul>
            </section>
            <CostBreakdownCard m={selectedRow.model} />
            <RiskAnalysisCard risk={{ score: selectedRow.risk.score, buckets: selectedRow.risk.buckets as Record<string, string> }} />
            <ScoreExplanationDrawer components={selectedRow.score.components as Record<string, number>} />
            <SmartWarnings warnings={warnings} />
            <RecommendationHistory items={recommendationHistory} />
            <GuidedChecklist checked={checklist} onToggle={(s) => setChecklist((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s])} />
            {!!recentSites.length && <section className="panel p-4 text-xs"><h3 className="font-semibold">Recently viewed</h3><ul className="mt-1 space-y-1">{recentSites.map((site) => <li key={site.id} className="cursor-pointer hover:text-brand-700" onClick={() => onSelect(site)}>{site.address}</li>)}</ul></section>}
          </aside>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <NeighborhoodSummary rows={neighborhoods} />
        <LocalActivityFeed items={activityFeed} />
        <SimulationPanel />
      </div>
    </div>
  );
};
