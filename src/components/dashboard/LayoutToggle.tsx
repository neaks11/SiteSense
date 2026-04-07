export const LayoutToggle = ({ compact, onToggle }: { compact: boolean; onToggle: () => void }) => (
  <button onClick={onToggle} className="rounded-lg border px-3 py-1.5 text-xs">{compact ? 'Expanded' : 'Compact'} layout</button>
);
