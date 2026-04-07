import { useEffect, useMemo, useState } from 'react';
import { sites } from '@/data/sites';
import { defaultWeights, getDefaultAssumptions, modelDeal, scoreDeal } from './finance';
import type {
  ActivityItem,
  AssumptionProfile,
  DealScoreWeights,
  DealTag,
  Filters,
  Persona,
  PipelineStatus,
  SavedView,
  StructuredNote,
  PortfolioConfig,
} from './types';

export type SavedDeal = {
  siteId: string;
  favorite: boolean;
  tag: DealTag;
  note: StructuredNote;
  status: PipelineStatus;
  scenarioLabel: 'Base Case' | 'Stretch Case' | 'Stress Test' | 'Bank Case' | 'Sell Case';
};

const STORAGE_KEY = 'sitesense-state-v2';

const blankNote: StructuredNote = {
  investmentThesis: '',
  risks: '',
  nextStep: '',
  contactStatus: '',
  offerStrategy: '',
};

type PersistedState = {
  saved: Record<string, SavedDeal>;
  recentlyViewed: string[];
  activityFeed: ActivityItem[];
  darkMode: boolean;
  compactMode: boolean;
  savedViews: SavedView[];
  savedAssumptionProfiles: AssumptionProfile[];
  selectedPersona: Persona;
  scoreWeights: DealScoreWeights;
  filterPresets: SavedView[];
  portfolio: string[];
  portfolioConfig: PortfolioConfig;
};

export const useDealVault = () => {
  const [saved, setSaved] = useState<Record<string, SavedDeal>>({});
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [savedAssumptionProfiles, setSavedAssumptionProfiles] = useState<AssumptionProfile[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona>('Developer');
  const [scoreWeights, setScoreWeights] = useState<DealScoreWeights>(defaultWeights);
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [portfolioConfig, setPortfolioConfig] = useState<PortfolioConfig>({ budget: 1200000, maxRisk: 65, targetHoldPct: 60 });

  const siteLookup = useMemo(() => Object.fromEntries(sites.map((s) => [s.id, s])), []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedState;
      setSaved(parsed.saved ?? {});
      setRecentlyViewed(parsed.recentlyViewed ?? []);
      setActivityFeed(parsed.activityFeed ?? []);
      setDarkMode(parsed.darkMode ?? false);
      setCompactMode(parsed.compactMode ?? false);
      setSavedViews(parsed.savedViews ?? []);
      setSavedAssumptionProfiles(parsed.savedAssumptionProfiles ?? []);
      setSelectedPersona(parsed.selectedPersona ?? 'Developer');
      setScoreWeights(parsed.scoreWeights ?? defaultWeights);
      setPortfolio(parsed.portfolio ?? []);
      setPortfolioConfig(parsed.portfolioConfig ?? { budget: 1200000, maxRisk: 65, targetHoldPct: 60 });
    } catch {
      // ignore local parse issues
    }
  }, []);

  useEffect(() => {
    const filterPresets: SavedView[] = [
      { id: 'cheap', name: 'Cheap land', filters: { minPrice: 0, maxPrice: 75000, minLotSqft: 2000, maxLotSqft: 6000, neighborhoods: [], zoning: [], ownership: [], minDealScore: 1, modularOnly: false, affordableOnly: false, maxTransitDistance: 1.2, minROI: -50 }, persona: selectedPersona, scoreWeights },
      { id: 'hold', name: 'Best hold deals', filters: { minPrice: 0, maxPrice: 200000, minLotSqft: 2500, maxLotSqft: 6000, neighborhoods: [], zoning: [], ownership: [], minDealScore: 70, modularOnly: false, affordableOnly: false, maxTransitDistance: 0.8, minROI: 8 }, persona: selectedPersona, scoreWeights },
      { id: 'flip', name: 'Best flip candidates', filters: { minPrice: 0, maxPrice: 220000, minLotSqft: 2000, maxLotSqft: 6000, neighborhoods: [], zoning: [], ownership: [], minDealScore: 65, modularOnly: false, affordableOnly: false, maxTransitDistance: 1.2, minROI: 12 }, persona: selectedPersona, scoreWeights },
      { id: 'score', name: 'Highest score', filters: { minPrice: 0, maxPrice: 300000, minLotSqft: 2000, maxLotSqft: 6000, neighborhoods: [], zoning: [], ownership: [], minDealScore: 80, modularOnly: false, affordableOnly: false, maxTransitDistance: 1.2, minROI: -10 }, persona: selectedPersona, scoreWeights },
      { id: 'lowrisk', name: 'Low risk', filters: { minPrice: 0, maxPrice: 260000, minLotSqft: 2000, maxLotSqft: 6000, neighborhoods: [], zoning: [], ownership: [], minDealScore: 65, modularOnly: false, affordableOnly: false, maxTransitDistance: 0.7, minROI: 5 }, persona: selectedPersona, scoreWeights },
    ];

    const payload: PersistedState = {
      saved,
      recentlyViewed,
      activityFeed,
      darkMode,
      compactMode,
      savedViews,
      savedAssumptionProfiles,
      selectedPersona,
      scoreWeights,
      filterPresets,
      portfolio,
      portfolioConfig,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [saved, recentlyViewed, activityFeed, darkMode, compactMode, savedViews, savedAssumptionProfiles, selectedPersona, scoreWeights, portfolio, portfolioConfig]);

  const logActivity = (message: string) => {
    setActivityFeed((prev: ActivityItem[]) => [{ id: `${Date.now()}`, timestamp: Date.now(), message }, ...prev].slice(0, 40));
  };

  const trackViewed = (siteId: string) => setRecentlyViewed((prev: string[]) => [siteId, ...prev.filter((id) => id !== siteId)].slice(0, 5));

  const save = (siteId: string) => {
    setSaved((prev: Record<string, SavedDeal>) => ({ ...prev, [siteId]: prev[siteId] ?? { siteId, favorite: false, tag: '', note: blankNote, status: 'New', scenarioLabel: 'Base Case' } }));
    logActivity(`Saved deal ${siteId}`);
  };

  const duplicate = (siteId: string) => {
    setSaved((prev: Record<string, SavedDeal>) => {
      const newId = `${siteId}-dup-${Date.now()}`;
      const source = prev[siteId] ?? { siteId, favorite: false, tag: '', note: blankNote, status: 'Underwriting', scenarioLabel: 'Stretch Case' as const };
      return { ...prev, [newId]: { ...source, siteId } };
    });
    logActivity(`Duplicated scenario for ${siteId}`);
  };

  const toggleFavorite = (key: string) => {
    setSaved((prev: Record<string, SavedDeal>) => ({ ...prev, [key]: { ...(prev[key] ?? { siteId: key, favorite: false, tag: '', note: blankNote, status: 'New', scenarioLabel: 'Base Case' }), favorite: !(prev[key]?.favorite ?? false) } }));
    logActivity(`Toggled favorite on ${key}`);
  };

  const setTag = (key: string, tag: DealTag) => {
    setSaved((prev: Record<string, SavedDeal>) => ({ ...prev, [key]: { ...(prev[key] ?? { siteId: key, favorite: false, tag: '', note: blankNote, status: 'New', scenarioLabel: 'Base Case' }), tag } }));
    logActivity(`Tagged ${key} as ${tag || 'none'}`);
  };

  const setStatus = (key: string, status: PipelineStatus) => {
    setSaved((prev: Record<string, SavedDeal>) => ({ ...prev, [key]: { ...(prev[key] ?? { siteId: key, favorite: false, tag: '', note: blankNote, status: 'New', scenarioLabel: 'Base Case' }), status } }));
    logActivity(`Moved ${key} to ${status}`);
  };

  const setScenarioLabel = (key: string, scenarioLabel: SavedDeal['scenarioLabel']) => {
    setSaved((prev: Record<string, SavedDeal>) => ({ ...prev, [key]: { ...(prev[key] ?? { siteId: key, favorite: false, tag: '', note: blankNote, status: 'New', scenarioLabel: 'Base Case' }), scenarioLabel } }));
  };

  const setNote = (key: string, note: StructuredNote) => {
    setSaved((prev: Record<string, SavedDeal>) => ({ ...prev, [key]: { ...(prev[key] ?? { siteId: key, favorite: false, tag: '', note: blankNote, status: 'New', scenarioLabel: 'Base Case' }), note } }));
    logActivity(`Updated notes for ${key}`);
  };

  const addSavedView = (name: string, filters: Filters, persona: Persona, weights: DealScoreWeights) => {
    const id = `view-${Date.now()}`;
    setSavedViews((prev: SavedView[]) => [{ id, name, filters, persona, scoreWeights: weights }, ...prev].slice(0, 12));
    logActivity(`Saved dashboard view: ${name}`);
  };


  const addToPortfolio = (key: string) => {
    setPortfolio((prev: string[]) => (prev.includes(key) ? prev : [...prev, key]));
    logActivity(`Added ${key} to portfolio`);
  };

  const removeFromPortfolio = (key: string) => {
    setPortfolio((prev: string[]) => prev.filter((id) => id !== key));
  };

  const addAssumptionProfile = (name: string, assumptions: ReturnType<typeof getDefaultAssumptions>) => {
    const id = `profile-${Date.now()}`;
    setSavedAssumptionProfiles((prev: AssumptionProfile[]) => [{ id, name, assumptions }, ...prev].slice(0, 12));
    logActivity(`Saved assumption profile: ${name}`);
  };

  const savedRows = Object.entries(saved as Record<string, SavedDeal>).map(([key, item]) => {
    const site = siteLookup[item.siteId];
    const model = modelDeal(getDefaultAssumptions(site));
    const dealScore = scoreDeal(site, model, 50);
    return { key, item, site, model, dealScore };
  });

  const recentSites = recentlyViewed.map((id: string) => siteLookup[id]).filter(Boolean);

  const portfolioRows = portfolio
    .map((key: string) => {
      const row = savedRows.find((r) => r.key === key) ?? savedRows.find((r) => r.site.id === key);
      return row ? { key: row.key, item: row.item, site: row.site, model: row.model, dealScore: row.dealScore } : null;
    })
    .filter((row: { key: string; item: SavedDeal; site: (typeof sites)[number]; model: ReturnType<typeof modelDeal>; dealScore: ReturnType<typeof scoreDeal> } | null): row is { key: string; item: SavedDeal; site: (typeof sites)[number]; model: ReturnType<typeof modelDeal>; dealScore: ReturnType<typeof scoreDeal> } => row !== null);

  return {
    saved,
    save,
    duplicate,
    toggleFavorite,
    setTag,
    setStatus,
    setScenarioLabel,
    setNote,
    savedRows,
    trackViewed,
    recentSites,
    activityFeed,
    darkMode,
    setDarkMode,
    compactMode,
    setCompactMode,
    savedViews,
    addSavedView,
    savedAssumptionProfiles,
    addAssumptionProfile,
    selectedPersona,
    setSelectedPersona,
    scoreWeights,
    setScoreWeights,
    portfolio,
    portfolioConfig,
    setPortfolioConfig,
    portfolioRows,
    addToPortfolio,
    removeFromPortfolio,
    logActivity,
  };
};
