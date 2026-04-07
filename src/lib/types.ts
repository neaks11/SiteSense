export type OwnershipType = 'Private Listing' | 'City-Owned' | 'Off-Market';
export type ZoningType = 'RS-3' | 'RT-4' | 'RM-5' | 'B2-2' | 'C1-2';

export type SiteRecord = {
  id: string;
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  landPrice: number;
  lotSqft: number;
  zoning: ZoningType;
  ownershipType: OwnershipType;
  distanceToCTA: number;
  growthScore: number;
  rentDemandScore: number;
  affordabilityScore: number;
  modularFitScore: number;
  suggestedUse: 'Modular SF' | 'Duplex' | '3-Flat' | '4-Flat' | 'Affordable Housing';
  estimatedRentPerUnit: number;
  estimatedBuildCostPerSqft: number;
  notes: string;
};

export type HotZone = {
  neighborhood: string;
  category: 'High Upside' | 'Redevelopment Corridor' | 'Stable but Expensive' | 'Affordable Housing Fit' | 'Modular-Friendly Zone';
  growthScore: number;
  rentDemandScore: number;
  affordabilityScore: number;
  landCostScore: number;
  modularFit: number;
  investorAttractiveness: number;
};

export type Filters = {
  minPrice: number;
  maxPrice: number;
  minLotSqft: number;
  maxLotSqft: number;
  neighborhoods: string[];
  zoning: string[];
  ownership: string[];
  minDealScore: number;
  modularOnly: boolean;
  affordableOnly: boolean;
  maxTransitDistance: number;
  minROI: number;
};

export type ExitStrategy = 'Hold' | 'Sell';
export type CapitalType = 'Financed' | 'Cash';
export type Persona = 'Beginner Investor' | 'Developer' | 'Cash Flow Buyer';

export type DealScoreWeights = {
  landBasis: number;
  rentPotential: number;
  location: number;
  growth: number;
  strategyFit: number;
};

export type BuildAssumptions = {
  landPurchasePrice: number;
  closingCosts: number;
  demolitionCleanup: number;
  modularCostPerSqft: number;
  siteWorkUtilities: number;
  softCosts: number;
  permitContingency: number;
  numberOfUnits: number;
  avgUnitSize: number;
  monthlyRentPerUnit: number;
  vacancyRate: number;
  operatingExpensePct: number;
  loanToCost: number;
  interestRate: number;
  timelineMonths: number;
  exitStrategy: ExitStrategy;
  capitalType: CapitalType;
};

export type StructuredNote = {
  strategy: string;
  risks: string;
  nextSteps: string;
};
