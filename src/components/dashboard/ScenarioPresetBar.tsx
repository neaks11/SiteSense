import { scenarioPresets } from '@/lib/finance';
import type { BuildAssumptions } from '@/lib/types';

export const ScenarioPresetBar = ({ current, onApply }: { current: BuildAssumptions; onApply: (next: BuildAssumptions) => void }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(scenarioPresets).map(([name, fn]) => (
        <button key={name} className="rounded-full border px-2 py-1 text-xs" onClick={() => onApply(fn(current))}>
          {name}
        </button>
      ))}
    </div>
  );
};
