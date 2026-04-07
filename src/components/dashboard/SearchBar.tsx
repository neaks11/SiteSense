export const SearchBar = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search address, neighborhood, zoning, tag, notes" className="w-full rounded-lg border p-2 text-sm" />
);
