import type { Sensitivity } from '@/lib/types';

export const SensitivityControls = ({ sensitivity, onChange }: { sensitivity: Sensitivity; onChange: (s: Sensitivity) => void }) => (
  <div className="rounded-lg border p-3">
    <p className="mb-2 text-xs font-semibold uppercase text-stone-500">Sensitivity</p>
    {(Object.keys(sensitivity) as (keyof Sensitivity)[]).map((k) => (
      <label key={k} className="block text-xs">
        {k}: {sensitivity[k]}%
        <input type="range" className="w-full" min={-20} max={20} value={sensitivity[k]} onChange={(e) => onChange({ ...sensitivity, [k]: +e.target.value })} />
      </label>
    ))}
  </div>
);
