import { useMemo, useState } from 'react';
import { sites } from '@/data/sites';
import { getDefaultAssumptions, modelDeal, scoreDeal } from './finance';
import type { StructuredNote } from './types';

export type SavedDeal = {
  siteId: string;
  favorite: boolean;
  tag: 'High Potential' | 'Too Risky' | 'Revisit' | '';
  note: StructuredNote;
};

const blankNote: StructuredNote = { strategy: '', risks: '', nextSteps: '' };

export const useDealVault = () => {
  const [saved, setSaved] = useState<Record<string, SavedDeal>>({});
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  const siteLookup = useMemo(() => Object.fromEntries(sites.map((s) => [s.id, s])), []);

  const trackViewed = (siteId: string) => {
    setRecentlyViewed((prev) => [siteId, ...prev.filter((id) => id !== siteId)].slice(0, 5));
  };

  const save = (siteId: string) => {
    setSaved((prev) => ({
      ...prev,
      [siteId]: prev[siteId] ?? { siteId, favorite: false, tag: '', note: blankNote },
    }));
  };

  const duplicate = (siteId: string) => {
    setSaved((prev) => {
      const newId = `${siteId}-dup-${Date.now()}`;
      const source = prevOrDefault(prev[siteId], siteId);
      return { ...prev, [newId]: { ...source, siteId } };
    });
  };

  const toggleFavorite = (key: string) => {
    setSaved((prev) => {
      const item = prevOrDefault(prev[key], key);
      return { ...prev, [key]: { ...item, favorite: !item.favorite } };
    });
  };

  const setTag = (key: string, tag: SavedDeal['tag']) => {
    setSaved((prev) => ({ ...prev, [key]: { ...prevOrDefault(prev[key], key), tag } }));
  };

  const setNote = (key: string, note: StructuredNote) => {
    setSaved((prev) => ({ ...prev, [key]: { ...prevOrDefault(prev[key], key), note } }));
  };

  const savedRows = Object.entries(saved).map(([key, item]) => {
    const site = siteLookup[item.siteId];
    const financials = modelDeal(getDefaultAssumptions(site));
    const dealScore = scoreDeal(site);
    return { key, item, site, financials, dealScore };
  });

  const recentSites = recentlyViewed.map((id) => siteLookup[id]).filter(Boolean);

  return { saved, save, duplicate, toggleFavorite, setTag, setNote, savedRows, trackViewed, recentSites };
};

const prevOrDefault = (input: SavedDeal | undefined, siteId: string): SavedDeal =>
  input ?? { siteId, favorite: false, tag: '', note: blankNote };
