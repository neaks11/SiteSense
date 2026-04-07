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

export type ExitStrategy = 'Flip' | 'Hold' | 'Refinance and Hold' | 'Sell to Operator';
export type CapitalType = 'Loan' | 'Cash';
export type Persona = 'Beginner Investor' | 'Developer' | 'Cash Flow Buyer' | 'Value Add Buyer' | 'Conservative Underwriter';
export type DealTag = 'High Potential' | 'Risky' | 'Revisit' | 'Hold for Later' | 'Favorite Submarket' | '';
export type PipelineStatus = 'New' | 'Reviewing' | 'Underwriting' | 'Contacted' | 'Offered' | 'Dead' | 'Closed';

export type DealScoreWeights = {
  purchasePrice: number;
  developmentCost: number;
  rentPotential: number;
  neighborhood: number;
  risk: number;
  timeline: number;
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
  loanTermYears: number;
  interestOnly: boolean;
  timelineMonths: number;
  exitStrategy: ExitStrategy;
  capitalType: CapitalType;
  exitPriceVariance: number;
};

export type Sensitivity = {
  rentVariance: number;
  costVariance: number;
  exitVariance: number;
  vacancyVariance: number;
};

export type StructuredNote = {
  investmentThesis: string;
  risks: string;
  nextStep: string;
  contactStatus: string;
  offerStrategy: string;
};

export type SavedView = {
  id: string;
  name: string;
  filters: Filters;
  persona: Persona;
  scoreWeights: DealScoreWeights;
};

export type AssumptionProfile = {
  id: string;
  name: string;
  assumptions: BuildAssumptions;
};

export type ActivityItem = {
  id: string;
  timestamp: number;
  message: string;
};


export type PortfolioConfig = {
  budget: number;
  maxRisk: number;
  targetHoldPct: number;
};

export type DecisionSnapshot = {
  id: string;
  key: string;
  timestamp: number;
  score: number;
  roi: number;
  risk: number;
  recommendation: string;
};
