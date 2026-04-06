import { createContext, useContext } from 'react';
import { useDealVault } from '@/lib/store';

const DealContext = createContext<ReturnType<typeof useDealVault> | null>(null);

export const DealProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useDealVault();
  return <DealContext.Provider value={value}>{children}</DealContext.Provider>;
};

export const useDeals = () => {
  const ctx = useContext(DealContext);
  if (!ctx) throw new Error('useDeals must be used inside DealProvider');
  return ctx;
};
