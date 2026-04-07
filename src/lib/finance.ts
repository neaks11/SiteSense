import type { BuildAssumptions, DealScoreWeights, Persona, SiteRecord } from './types';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const defaultWeights: DealScoreWeights = {
  landBasis: 25,
  rentPotential: 25,
  location: 20,
  growth: 15,
  strategyFit: 15,
};

const normalizeWeights = (weights: DealScoreWeights) => {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0) || 1;
  return {
    landBasis: weights.landBasis / total,
    rentPotential: weights.rentPotential / total,
    location: weights.location / total,
    growth: weights.growth / total,
    strategyFit: weights.strategyFit / total,
  };
};

export const scoreDeal = (site: SiteRecord, weights: DealScoreWeights = defaultWeights) => {
  const pricePerSqft = site.landPrice / site.lotSqft;
  const landBasisScore = clamp(100 - pricePerSqft * 1.8, 0, 100);
  const rentToCost = (site.estimatedRentPerUnit * 12) / (site.estimatedBuildCostPerSqft * 900);
  const rentToCostScore = clamp(rentToCost * 800, 0, 100);
  const transitScore = clamp(100 - site.distanceToCTA * 80, 0, 100);
  const locationScore = (transitScore + site.rentDemandScore) / 2;
  const strategyFit = (site.affordabilityScore + site.modularFitScore) / 2;
  const w = normalizeWeights(weights);

  const weighted =
    landBasisScore * w.landBasis +
    rentToCostScore * w.rentPotential +
    locationScore * w.location +
    site.growthScore * w.growth +
    strategyFit * w.strategyFit;

  const score = Math.round(clamp(weighted, 1, 100));

  let explanation = 'Balanced fundamentals with moderate execution risk.';
  if (score >= 80) explanation = 'Strong price-to-rent ratio and low land basis.';
  else if (score >= 60) explanation = 'Good neighborhood, but construction cost compresses return.';
  else explanation = 'Transit proximity helps but site is overpriced for current rents.';

  return { score, explanation, subScores: { landBasisScore, rentToCostScore, locationScore, strategyFit } };
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
  timelineMonths: 14,
  exitStrategy: 'Hold',
  capitalType: 'Financed',
});

export const applyScenarioPreset = (scenario: 'Conservative' | 'Aggressive' | 'Section 8 Strategy', base: BuildAssumptions) => {
  if (scenario === 'Conservative') {
    return { ...base, monthlyRentPerUnit: Math.round(base.monthlyRentPerUnit * 0.92), vacancyRate: 8, modularCostPerSqft: Math.round(base.modularCostPerSqft * 1.08) };
  }
  if (scenario === 'Aggressive') {
    return { ...base, monthlyRentPerUnit: Math.round(base.monthlyRentPerUnit * 1.08), vacancyRate: 4.5, modularCostPerSqft: Math.round(base.modularCostPerSqft * 0.96) };
  }
  return { ...base, monthlyRentPerUnit: Math.round(base.monthlyRentPerUnit * 0.95), vacancyRate: 5.5, operatingExpensePct: 30 };
};

export const applyUnitMixTemplate = (template: '3-flat Chicago' | '6-unit multifamily' | 'Townhomes', base: BuildAssumptions) => {
  if (template === '6-unit multifamily') return { ...base, numberOfUnits: 6, avgUnitSize: 820 };
  if (template === 'Townhomes') return { ...base, numberOfUnits: 3, avgUnitSize: 1250, modularCostPerSqft: base.modularCostPerSqft + 8 };
  return { ...base, numberOfUnits: 3, avgUnitSize: 940 };
};

export const modelDeal = (a: BuildAssumptions, sensitivityPct = 0) => {
  const rentFactor = 1 + sensitivityPct / 100;
  const costFactor = 1 - sensitivityPct / 100;

  const totalBuildableSqft = a.numberOfUnits * a.avgUnitSize;
  const hardCost = totalBuildableSqft * (a.modularCostPerSqft * costFactor);
  const totalProjectCost =
    a.landPurchasePrice +
    a.closingCosts +
    a.demolitionCleanup +
    hardCost +
    a.siteWorkUtilities +
    a.softCosts +
    a.permitContingency;

  const monthlyGrossRent = a.numberOfUnits * (a.monthlyRentPerUnit * rentFactor);
  const effectiveMonthlyIncome = monthlyGrossRent * (1 - a.vacancyRate / 100);
  const annualEGI = effectiveMonthlyIncome * 12;
  const annualNOI = annualEGI * (1 - a.operatingExpensePct / 100);

  const loanAmount = a.capitalType === 'Cash' ? 0 : totalProjectCost * (a.loanToCost / 100);
  const equity = totalProjectCost - loanAmount;
  const annualDebtService = loanAmount * (a.interestRate / 100);
  const annualCashFlow = annualNOI - annualDebtService;
  const cocReturn = equity > 0 ? (annualCashFlow / equity) * 100 : 0;

  const carryingCost = (totalProjectCost * 0.0045) * a.timelineMonths;
  const capRate = a.exitStrategy === 'Sell' ? 0.058 : 0.0625;
  const stabilizedValue = annualNOI / capRate;
  const developmentSpread = stabilizedValue - (totalProjectCost + carryingCost);
  const projectedEquity = Math.max(0, developmentSpread);
  const roiPct = totalProjectCost > 0 ? (developmentSpread / totalProjectCost) * 100 : 0;

  return {
    totalBuildableSqft,
    totalProjectCost,
    totalCostPerUnit: totalProjectCost / a.numberOfUnits,
    totalCostPerSqft: totalProjectCost / Math.max(totalBuildableSqft, 1),
    revenuePerUnit: annualEGI / a.numberOfUnits,
    monthlyGrossRent,
    annualEGI,
    annualNOI,
    annualCashFlow,
    annualDebtService,
    carryingCost,
    cocReturn,
    stabilizedValue,
    developmentSpread,
    projectedEquity,
    roiPct,
    simplePayback: annualCashFlow > 0 ? totalProjectCost / annualCashFlow : 0,
  };
};

export const getAIRecommendation = (score: number, roi: number, transit: number, persona: Persona) => {
  const personaBonus = persona === 'Cash Flow Buyer' ? 2 : persona === 'Developer' ? -1 : 0;
  const adjusted = score + personaBonus;
  const stance = adjusted >= 80 && roi > 12 ? 'Bullish' : adjusted >= 62 ? 'Cautious' : 'Pass';

  const reasons = [
    transit < 0.4 ? 'Strong CTA access supports renter demand.' : 'Transit access is workable but not elite.',
    roi > 12 ? 'Projected return clears target hurdle rates.' : 'Returns are thin under current assumptions.',
    adjusted >= 75 ? 'DealScore indicates strategic fit for modular infill.' : 'Execution risk remains high versus upside.',
  ];

  const path = adjusted >= 75 ? 'Pursue predevelopment and lock modular GC pricing early.' : 'Negotiate lower land basis and validate rents before LOI.';
  return { stance, reasons, path };
};

export const getRiskScore = (site: SiteRecord, roi: number) => {
  const permittingRisk = clamp(100 - site.growthScore, 15, 80);
  const costOverrunRisk = clamp(site.estimatedBuildCostPerSqft / 3, 20, 85);
  const rentUncertainty = clamp(100 - site.rentDemandScore + (roi < 10 ? 12 : 0), 20, 85);
  return {
    score: Math.round((permittingRisk + costOverrunRisk + rentUncertainty) / 3),
    permittingRisk,
    costOverrunRisk,
    rentUncertainty,
  };
};

export const getConfidence = (site: SiteRecord, sensitivity: number) => {
  const completeness = 88;
  const variancePenalty = Math.abs(sensitivity) * 2.2;
  const transitPenalty = site.distanceToCTA > 0.75 ? 12 : 0;
  const value = Math.round(clamp(completeness - variancePenalty - transitPenalty, 20, 95));
  return value >= 75 ? 'High' : value >= 55 ? 'Medium' : 'Low';
};

export const getDealStory = (site: SiteRecord, roi: number, riskScore: number) =>
  `This deal works because ${site.neighborhood} combines ${site.growthScore > 72 ? 'momentum' : 'stable'} neighborhood demand with ${site.modularFitScore > 78 ? 'strong modular fit' : 'traditional infill viability'}. Under current assumptions, projected ROI is ${roi.toFixed(1)}% with ${riskScore < 45 ? 'manageable' : 'elevated'} risk.`;

export const getCounterCase = (site: SiteRecord, roi: number) => [
  site.distanceToCTA > 0.65 ? 'Transit distance may reduce rent resilience in a downturn.' : 'Transit is good, but submarket leasing velocity still needs validation.',
  roi < 9 ? 'Margin of safety is thin at current land basis.' : 'Return is solid, but dependent on construction discipline.',
  site.estimatedBuildCostPerSqft > 205 ? 'High build cost profile raises overrun exposure.' : 'Construction pricing appears viable but bid confirmation is still needed.',
];

export const autoStrategyLabel = (assumption: BuildAssumptions, roi: number) => {
  if (assumption.exitStrategy === 'Sell' && roi > 14) return 'Best for value-add flip to sell.';
  if (assumption.monthlyRentPerUnit < 1500 && assumption.vacancyRate <= 6) return 'Best for Section 8 hold strategy.';
  return 'Best for long-term rental hold with refinance optionality.';
};
