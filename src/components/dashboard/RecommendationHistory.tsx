export const RecommendationHistory = ({ items }: { items: string[] }) => (
  <section className="panel p-4 text-xs">
    <h3 className="font-semibold">Recommendation History</h3>
    {items.length ? <ul className="mt-2 space-y-1">{items.slice(0, 6).map((i, idx) => <li key={`${i}-${idx}`}>{i}</li>)}</ul> : <p className="mt-2 text-stone-500">No recommendation changes yet.</p>}
  </section>
);
