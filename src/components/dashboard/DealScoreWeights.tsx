import type { DealScoreWeights } from '@/lib/types';

export const DealScoreWeightsCard = ({ weights, onChange }: { weights: DealScoreWeights; onChange: (w: DealScoreWeights) => void }) => (
  <div className="rounded-lg border p-3">
    <p className="mb-2 text-xs font-semibold uppercase text-stone-500">DealScore weights</p>
    {(Object.keys(weights) as (keyof DealScoreWeights)[]).map((k) => (
      <label key={k} className="block text-xs">
        {k}: {weights[k]}
        <input className="w-full" type="range" min={5} max={40} value={weights[k]} onChange={(e) => onChange({ ...weights, [k]: +e.target.value })} />
      </label>
    ))}
  </div>
);
