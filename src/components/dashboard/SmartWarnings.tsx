export const SmartWarnings = ({ warnings }: { warnings: { level: 'Critical' | 'Material' | 'Watchlist'; text: string }[] }) =>
  warnings.length ? (
    <div className="space-y-2">
      {warnings.map((w) => (
        <div
          key={w.text}
          className={`rounded-lg px-3 py-2 text-xs ${
            w.level === 'Critical'
              ? 'border border-rose-300 bg-rose-50 text-rose-800'
              : w.level === 'Material'
                ? 'border border-amber-300 bg-amber-50 text-amber-800'
                : 'border border-blue-300 bg-blue-50 text-blue-800'
          }`}
        >
          {w.level}: {w.text}
        </div>
      ))}
    </div>
  ) : (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">No critical warning flags detected.</div>
  );
