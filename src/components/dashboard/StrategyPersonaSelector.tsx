import type { Persona } from '@/lib/types';

export const StrategyPersonaSelector = ({ value, onChange }: { value: Persona; onChange: (p: Persona) => void }) => (
  <label className="block text-xs">
    Strategy persona
    <select className="mt-1 w-full rounded border p-1" value={value} onChange={(e) => onChange(e.target.value as Persona)}>
      <option>Beginner Investor</option>
      <option>Developer</option>
      <option>Cash Flow Buyer</option>
      <option>Value Add Buyer</option>
      <option>Conservative Underwriter</option>
    </select>
  </label>
);
