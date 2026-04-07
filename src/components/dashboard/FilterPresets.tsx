export const FilterPresets = ({ onApply }: { onApply: (name: string) => void }) => (
  <div className="flex flex-wrap gap-2">
    {['Cheap land', 'Best hold deals', 'Best flip candidates', 'Highest score', 'Low risk'].map((name) => (
      <button key={name} onClick={() => onApply(name)} className="rounded-full border px-2 py-1 text-xs">{name}</button>
    ))}
  </div>
);
