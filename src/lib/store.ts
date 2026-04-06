import { useMemo, useState } from 'react';
import { sites } from '@/data/sites';
import { getDefaultAssumptions, modelDeal, scoreDeal } from './finance';

export type SavedDeal = {
  siteId: string;
  favorite: boolean;
  note: string;
};

export const useDealVault = () => {
  const [saved, setSaved] = useState<Record<string, SavedDeal>>({});

  const siteLookup = useMemo(() => Object.fromEntries(sites.map((s) => [s.id, s])), []);

  const save = (siteId: string) => {
    setSaved((prev) => ({
      ...prev,
      [siteId]: prev[siteId] ?? { siteId, favorite: false, note: '' },
    }));
  };

  const toggleFavorite = (siteId: string) => {
    setSaved((prev) => {
      const item = prev[siteId] ?? { siteId, favorite: false, note: '' };
      return { ...prev, [siteId]: { ...item, favorite: !item.favorite } };
    });
  };

  const setNote = (siteId: string, note: string) => {
    setSaved((prev) => ({
      ...prev,
      [siteId]: { ...(prev[siteId] ?? { siteId, favorite: false, note: '' }), note },
    }));
  };

  const savedRows = Object.values(saved).map((item) => {
    const site = siteLookup[item.siteId];
    const financials = modelDeal(getDefaultAssumptions(site));
    const dealScore = scoreDeal(site);
    return { item, site, financials, dealScore };
  });

  return { saved, save, toggleFavorite, setNote, savedRows };
};
