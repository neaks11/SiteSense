import type { BuildAssumptions, SiteRecord } from './types';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const scoreDeal = (site: SiteRecord) => {
  const pricePerSqft = site.landPrice / site.lotSqft;
  const landBasisScore = clamp(100 - pricePerSqft * 1.8, 0, 100);
  const rentToCost = (site.estimatedRentPerUnit * 12) / (site.estimatedBuildCostPerSqft * 900);
  const rentToCostScore = clamp(rentToCost * 800, 0, 100);
  const transitScore = clamp(100 - site.distanceToCTA * 80, 0, 100);

  const weighted =
    landBasisScore * 0.2 +
    rentToCostScore * 0.25 +
    site.growthScore * 0.2 +
    transitScore * 0.15 +
    site.affordabilityScore * 0.1 +
    site.modularFitScore * 0.1;

  const score = Math.round(clamp(weighted, 1, 100));

  let explanation = 'Balanced fundamentals with moderate execution risk.';
  if (score >= 80) explanation = 'Strong price-to-rent ratio and low land basis.';
  else if (score >= 60) explanation = 'Good neighborhood, but construction cost compresses return.';
  else explanation = 'Transit proximity helps but site is overpriced for current rents.';

  return { score, explanation };
};

export const getDefaultAssumptions = (site: SiteRecord): BuildAssumptions => ({
  landPurchasePrice: site.landPrice,
  closingCosts: 8000,
  demolitionCleanup: 14000,
  modularCostPerSqft: site.estimatedBuildCostPerSqft,
  siteWorkUtilities: 55000,
  softCosts: 68000,
  permitContingency: 36000,
  numberOfUnits: site.suggestedUse === '4-Flat' ? 4 : site.suggestedUse === '3-Flat' ? 3 : 2,
  avgUnitSize: site.suggestedUse === 'Affordable Housing' ? 780 : 920,
  monthlyRentPerUnit: site.estimatedRentPerUnit,
  vacancyRate: 6,
  operatingExpensePct: 34,
  loanToCost: 70,
  interestRate: 7.2,
});

export const modelDeal = (a: BuildAssumptions) => {
  const totalBuildableSqft = a.numberOfUnits * a.avgUnitSize;
  const hardCost = totalBuildableSqft * a.modularCostPerSqft;
  const totalProjectCost =
    a.landPurchasePrice +
    a.closingCosts +
    a.demolitionCleanup +
    hardCost +
    a.siteWorkUtilities +
    a.softCosts +
    a.permitContingency;

  const monthlyGrossRent = a.numberOfUnits * a.monthlyRentPerUnit;
  const effectiveMonthlyIncome = monthlyGrossRent * (1 - a.vacancyRate / 100);
  const annualEGI = effectiveMonthlyIncome * 12;
  const annualNOI = annualEGI * (1 - a.operatingExpensePct / 100);

  const loanAmount = totalProjectCost * (a.loanToCost / 100);
  const equity = totalProjectCost - loanAmount;
  const annualDebtService = loanAmount * (a.interestRate / 100);
  const annualCashFlow = annualNOI - annualDebtService;
  const cocReturn = equity > 0 ? (annualCashFlow / equity) * 100 : 0;

  const stabilizedValue = annualNOI / 0.0625;
  const developmentSpread = stabilizedValue - totalProjectCost;
  const projectedEquity = Math.max(0, developmentSpread);
  const roiPct = totalProjectCost > 0 ? (developmentSpread / totalProjectCost) * 100 : 0;

  return {
    totalBuildableSqft,
    totalProjectCost,
    totalCostPerUnit: totalProjectCost / a.numberOfUnits,
    monthlyGrossRent,
    annualEGI,
    annualNOI,
    annualCashFlow,
    cocReturn,
    stabilizedValue,
    developmentSpread,
    projectedEquity,
    roiPct,
    simplePayback: annualCashFlow > 0 ? totalProjectCost / annualCashFlow : 0,
  };
};

export const getAIRecommendation = (score: number, roi: number, transit: number) => {
  const stance = score >= 80 && roi > 14 ? 'Bullish' : score >= 62 ? 'Cautious' : 'Pass';

  const reasons = [
    transit < 0.4 ? 'Strong CTA access supports renter demand.' : 'Transit access is workable but not elite.',
    roi > 12 ? 'Projected return clears target hurdle rates.' : 'Returns are thin under current assumptions.',
    score >= 75 ? 'DealScore indicates strong strategic fit for modular infill.' : 'Execution risk remains high versus upside.',
  ];

  const path = score >= 75 ? 'Pursue predevelopment and lock modular GC pricing early.' : 'Negotiate lower land basis and validate rents before LOI.';
  return { stance, reasons, path };
};
