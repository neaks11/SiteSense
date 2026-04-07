export const SmartWarnings = ({ warnings }: { warnings: string[] }) =>
  warnings.length ? (
    <div className="space-y-2">
      {warnings.map((w) => <div key={w} className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">⚠ {w}</div>)}
    </div>
  ) : (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">No critical warning flags detected.</div>
  );
