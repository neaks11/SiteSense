import type {
  BuildAssumptions,
  DealScoreWeights,
  ExitStrategy,
  Persona,
  PipelineStatus,
  Sensitivity,
  SiteRecord,
} from './types';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const defaultWeights: DealScoreWeights = {
  purchasePrice: 20,
  developmentCost: 18,
  rentPotential: 20,
  neighborhood: 17,
  risk: 15,
  timeline: 10,
};

export const defaultSensitivity: Sensitivity = {
  rentVariance: 0,
  costVariance: 0,
  exitVariance: 0,
  vacancyVariance: 0,
};

export const normalizeWeights = (weights: DealScoreWeights) => {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0) || 1;
  return Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, v / total])) as DealScoreWeights;
};

export const getDefaultAssumptions = (site: SiteRecord): BuildAssumptions => ({
  landPurchasePrice: site.landPrice,
  closingCosts: 9000,
  demolitionCleanup: 14000,
  modularCostPerSqft: site.estimatedBuildCostPerSqft,
  siteWorkUtilities: 56000,
  softCosts: 70000,
  permitContingency: 36000,
  numberOfUnits: site.suggestedUse === '4-Flat' ? 4 : site.suggestedUse === '3-Flat' ? 3 : 2,
  avgUnitSize: site.suggestedUse === 'Affordable Housing' ? 760 : 920,
  monthlyRentPerUnit: site.estimatedRentPerUnit,
  vacancyRate: 6,
  operatingExpensePct: 33,
  loanToCost: 70,
  interestRate: 7.2,
  loanTermYears: 30,
  interestOnly: false,
  timelineMonths: 14,
  exitStrategy: 'Hold',
  capitalType: 'Loan',
  exitPriceVariance: 0,
});

export const scenarioPresets = {
  Conservative: (a: BuildAssumptions) => ({ ...a, monthlyRentPerUnit: Math.round(a.monthlyRentPerUnit * 0.92), vacancyRate: 8, permitContingency: Math.round(a.permitContingency * 1.15), exitStrategy: 'Hold' as ExitStrategy }),
  Aggressive: (a: BuildAssumptions) => ({ ...a, monthlyRentPerUnit: Math.round(a.monthlyRentPerUnit * 1.08), vacancyRate: 4.5, permitContingency: Math.round(a.permitContingency * 0.92), exitStrategy: 'Flip' as ExitStrategy }),
  'Section 8': (a: BuildAssumptions) => ({ ...a, monthlyRentPerUnit: Math.round(a.monthlyRentPerUnit * 0.95), vacancyRate: 5, operatingExpensePct: 30, exitStrategy: 'Hold' as ExitStrategy }),
  'Value Add': (a: BuildAssumptions) => ({ ...a, demolitionCleanup: Math.round(a.demolitionCleanup * 1.18), monthlyRentPerUnit: Math.round(a.monthlyRentPerUnit * 1.07), timelineMonths: a.timelineMonths + 2, exitStrategy: 'Flip' as ExitStrategy }),
  'Premium Rental': (a: BuildAssumptions) => ({ ...a, modularCostPerSqft: Math.round(a.modularCostPerSqft * 1.12), monthlyRentPerUnit: Math.round(a.monthlyRentPerUnit * 1.2), exitStrategy: 'Refinance and Hold' as ExitStrategy }),
};

export const unitMixTemplates = {
  '2 flat': (a: BuildAssumptions) => ({ ...a, numberOfUnits: 2, avgUnitSize: 1100 }),
  '3 flat': (a: BuildAssumptions) => ({ ...a, numberOfUnits: 3, avgUnitSize: 930 }),
  '4 unit': (a: BuildAssumptions) => ({ ...a, numberOfUnits: 4, avgUnitSize: 860 }),
  '6 unit': (a: BuildAssumptions) => ({ ...a, numberOfUnits: 6, avgUnitSize: 820 }),
  Townhome: (a: BuildAssumptions) => ({ ...a, numberOfUnits: 3, avgUnitSize: 1280, modularCostPerSqft: a.modularCostPerSqft + 10 }),
  'Small mixed use': (a: BuildAssumptions) => ({ ...a, numberOfUnits: 5, avgUnitSize: 780, softCosts: a.softCosts + 12000 }),
};

export const personaWeights = (persona: Persona): DealScoreWeights => {
  if (persona === 'Cash Flow Buyer') return { purchasePrice: 22, developmentCost: 16, rentPotential: 26, neighborhood: 14, risk: 14, timeline: 8 };
  if (persona === 'Conservative Underwriter') return { purchasePrice: 18, developmentCost: 20, rentPotential: 16, neighborhood: 14, risk: 22, timeline: 10 };
  if (persona === 'Value Add Buyer') return { purchasePrice: 24, developmentCost: 16, rentPotential: 20, neighborhood: 12, risk: 12, timeline: 16 };
  if (persona === 'Beginner Investor') return { purchasePrice: 20, developmentCost: 20, rentPotential: 18, neighborhood: 16, risk: 18, timeline: 8 };
  return defaultWeights;
};

export const modelDeal = (a: BuildAssumptions, s: Sensitivity = defaultSensitivity) => {
  const totalBuildableSqft = a.numberOfUnits * a.avgUnitSize;
  const hardCost = totalBuildableSqft * a.modularCostPerSqft * (1 + s.costVariance / 100);
  const contingency = a.permitContingency * (1 + s.costVariance / 150);
  const totalProjectCost = a.landPurchasePrice + a.closingCosts + a.demolitionCleanup + hardCost + a.siteWorkUtilities + a.softCosts + contingency;

  const monthlyGrossRent = a.numberOfUnits * a.monthlyRentPerUnit * (1 + s.rentVariance / 100);
  const vacancy = clamp(a.vacancyRate + s.vacancyVariance, 1, 18);
  const annualEGI = monthlyGrossRent * 12 * (1 - vacancy / 100);
  const annualNOI = annualEGI * (1 - a.operatingExpensePct / 100);

  const loanAmount = a.capitalType === 'Cash' ? 0 : totalProjectCost * (a.loanToCost / 100);
  const annualDebtService = a.interestOnly ? loanAmount * (a.interestRate / 100) : loanAmount * ((a.interestRate / 100) + 1 / Math.max(a.loanTermYears, 1));
  const financingCost = annualDebtService;
  const annualCashFlow = annualNOI - annualDebtService;

  const carryingCost = totalProjectCost * 0.0044 * a.timelineMonths;
  const capRate = a.exitStrategy === 'Flip' ? 0.056 : a.exitStrategy === 'Sell to Operator' ? 0.06 : 0.0625;
  const stabilizedValue = (annualNOI / capRate) * (1 + (s.exitVariance + a.exitPriceVariance) / 100);

  const developmentSpread = stabilizedValue - (totalProjectCost + carryingCost);
  const roiPct = (developmentSpread / totalProjectCost) * 100;
  const cocReturn = ((annualCashFlow / Math.max(totalProjectCost - loanAmount, 1)) * 100);

  const breakEvenRent = (totalProjectCost * 0.09) / (a.numberOfUnits * 12 * (1 - vacancy / 100));
  const breakEvenExit = totalProjectCost + carryingCost;

  return {
    totalBuildableSqft,
    hardCost,
    contingency,
    totalProjectCost,
    financingCost,
    monthlyGrossRent,
    annualEGI,
    annualNOI,
    annualCashFlow,
    carryingCost,
    stabilizedValue,
    developmentSpread,
    roiPct,
    cocReturn,
    breakEvenRent,
    breakEvenExit,
    maxAllInCost: stabilizedValue * 0.82,
  };
};

export const getRiskBreakdown = (site: SiteRecord, m: ReturnType<typeof modelDeal>) => {
  const costOverrun = clamp(site.estimatedBuildCostPerSqft / 2.8, 20, 90);
  const rentRisk = clamp(100 - site.rentDemandScore + (m.breakEvenRent > site.estimatedRentPerUnit ? 15 : 0), 15, 90);
  const timelineRisk = clamp(25 + (m.carryingCost / 20000), 15, 90);
  const neighborhoodRisk = clamp(100 - site.growthScore, 10, 90);
  const exitRisk = clamp(m.roiPct < 8 ? 72 : 42, 20, 85);

  const score = Math.round((costOverrun + rentRisk + timelineRisk + neighborhoodRisk + exitRisk) / 5);
  const bucket = (v: number) => (v >= 67 ? 'High' : v >= 40 ? 'Medium' : 'Low');
  return {
    score,
    buckets: {
      costOverrun: bucket(costOverrun),
      rentRisk: bucket(rentRisk),
      timelineRisk: bucket(timelineRisk),
      neighborhoodRisk: bucket(neighborhoodRisk),
      exitRisk: bucket(exitRisk),
    },
    raw: { costOverrun, rentRisk, timelineRisk, neighborhoodRisk, exitRisk },
  };
};

export const scoreDeal = (
  site: SiteRecord,
  model: ReturnType<typeof modelDeal>,
  riskScore: number,
  weights: DealScoreWeights = defaultWeights,
) => {
  const norm = normalizeWeights(weights);
  const purchasePrice = clamp(100 - (site.landPrice / site.lotSqft) * 2, 0, 100);
  const developmentCost = clamp(100 - model.totalProjectCost / 18000, 0, 100);
  const rentPotential = clamp((site.rentDemandScore + clamp(model.roiPct + 50, 0, 100)) / 2, 0, 100);
  const neighborhood = (site.growthScore + site.affordabilityScore + (100 - site.distanceToCTA * 60)) / 3;
  const risk = 100 - riskScore;
  const timeline = clamp(100 - (model.carryingCost / 1800), 0, 100);

  const score = Math.round(
    purchasePrice * norm.purchasePrice +
      developmentCost * norm.developmentCost +
      rentPotential * norm.rentPotential +
      neighborhood * norm.neighborhood +
      risk * norm.risk +
      timeline * norm.timeline,
  );

  return {
    score: clamp(score, 1, 100),
    components: { purchasePrice, developmentCost, rentPotential, neighborhood, risk, timeline },
  };
};

export const getConfidence = (sensitivity: Sensitivity, score: number, risk: number) => {
  const variation = (Math.abs(sensitivity.rentVariance) + Math.abs(sensitivity.costVariance) + Math.abs(sensitivity.exitVariance) + Math.abs(sensitivity.vacancyVariance)) / 4;
  const stability = clamp(92 - variation * 2 - risk * 0.2 + score * 0.12, 10, 96);
  return stability >= 72 ? 'High' : stability >= 50 ? 'Medium' : 'Low';
};

export const getRecommendation = (score: number, roi: number, risk: number, persona: Persona) => {
  const stance = score > 80 && risk < 50 && roi > 10 ? 'Bullish' : score > 62 && roi > 4 ? 'Cautious' : 'Pass';
  const bestFit = roi > 13 ? 'Best for quick flip' : roi > 8 && risk < 60 ? 'Best for rental hold' : risk > 70 ? 'Too thin to pursue' : 'Best for value-add';
  const voice = persona === 'Conservative Underwriter' ? 'Protect downside first.' : 'Prioritize execution speed and basis control.';
  return { stance, bestFit, voice };
};

export const dealStory = (site: SiteRecord, rec: ReturnType<typeof getRecommendation>, m: ReturnType<typeof modelDeal>, risk: number) =>
  `This deal works if ${site.neighborhood} absorption remains steady and build cost is controlled. It could break if rent underperforms break-even (${Math.round(m.breakEvenRent)}). Best fit: ${rec.bestFit}. Risk score: ${risk}/100.`;

export const getWhyNot = (site: SiteRecord, m: ReturnType<typeof modelDeal>, risk: number) => [
  m.roiPct < 5 ? 'Projected ROI is below target threshold.' : 'ROI is viable but execution dependent.',
  risk > 68 ? 'Risk profile is elevated across timeline and rent uncertainty.' : 'Risk profile is manageable, pending construction bids.',
  site.distanceToCTA > 0.65 ? 'Transit proximity is weaker than prime renter corridors.' : 'Transit is decent but rent comps still require validation.',
];

export const warningBanners = (m: ReturnType<typeof modelDeal>, risk: number, sensitivity: Sensitivity) => {
  const warnings: string[] = [];
  if (m.roiPct < 6) warnings.push('Margin too thin for current assumptions.');
  if (m.carryingCost > 60000) warnings.push('Timeline too long; carrying cost is high.');
  if (Math.abs(sensitivity.rentVariance) > 14 || Math.abs(sensitivity.costVariance) > 14) warnings.push('Sensitivity stress is high; outputs are unstable.');
  if (risk > 70) warnings.push('Risk score elevated; require deeper diligence.');
  if (m.financingCost > m.annualNOI * 0.75) warnings.push('Financing stress is high vs NOI.');
  return warnings;
};

export const statusColor = (status: PipelineStatus) => ({
  New: 'bg-slate-100 text-slate-700',
  Reviewing: 'bg-blue-100 text-blue-700',
  Underwriting: 'bg-indigo-100 text-indigo-700',
  Contacted: 'bg-amber-100 text-amber-700',
  Offered: 'bg-orange-100 text-orange-700',
  Dead: 'bg-rose-100 text-rose-700',
  Closed: 'bg-emerald-100 text-emerald-700',
}[status]);
