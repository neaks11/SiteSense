import { useState } from 'react';
import { sites } from '@/data/sites';
import { defaultSensitivity, getDefaultAssumptions, getRiskBreakdown, modelDeal, scoreDeal } from '@/lib/finance';

export const SimulationPanel = () => {
  const [result, setResult] = useState<string>('Not run');

  const runSimulation = () => {
    const issues: string[] = [];

    for (let user = 1; user <= 50; user += 1) {
      try {
        for (let i = 0; i < 120; i += 1) {
          const site = sites[Math.floor(Math.random() * sites.length)];
          const assumptions = getDefaultAssumptions(site);
          assumptions.monthlyRentPerUnit = Math.max(800, assumptions.monthlyRentPerUnit + (Math.random() * 400 - 200));
          assumptions.timelineMonths = Math.max(8, assumptions.timelineMonths + Math.floor(Math.random() * 6 - 3));
          const sensitivity = {
            ...defaultSensitivity,
            rentVariance: Math.floor(Math.random() * 30 - 15),
            costVariance: Math.floor(Math.random() * 30 - 15),
            exitVariance: Math.floor(Math.random() * 20 - 10),
            vacancyVariance: Math.floor(Math.random() * 8 - 4),
          };
          const model = modelDeal(assumptions, sensitivity);
          const risk = getRiskBreakdown(site, model);
          const score = scoreDeal(site, model, risk.score);
          if (!Number.isFinite(model.roiPct) || !Number.isFinite(score.score)) {
            issues.push(`User ${user}: non-finite math result`);
          }
        }
      } catch (error) {
        issues.push(`User ${user} crashed: ${String(error)}`);
      }
    }

    setResult(issues.length ? `Found ${issues.length} issues` : 'Pass: 50-user simulation completed without runtime exceptions.');
  };

  return (
    <section className="panel p-4 text-xs">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Simulation Lab</h3>
        <button className="rounded border px-2 py-1" onClick={runSimulation}>Run 50-user stress sim</button>
      </div>
      <p className="mt-2 text-stone-600">Synthetic in-browser interaction runner for underwriting math + scoring stability.</p>
      <p className="mt-2 rounded bg-stone-100 p-2">{result}</p>
    </section>
  );
};
