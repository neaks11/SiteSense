export const DeltaMetric = ({ label, value, prev }: { label: string; value: number; prev: number }) => {
  const delta = value - prev;
  const color = delta > 0 ? 'text-emerald-700' : delta < 0 ? 'text-rose-700' : 'text-stone-500';
  return (
    <div className="rounded-lg border p-2 text-xs">
      <p className="text-stone-500">{label}</p>
      <p className="font-semibold">{value.toFixed(1)}</p>
      <p className={color}>{delta >= 0 ? '+' : ''}{delta.toFixed(1)} vs baseline</p>
    </div>
  );
};
