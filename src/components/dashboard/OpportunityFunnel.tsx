export const OpportunityFunnel = ({ total, afterFilters, afterSearch }: { total: number; afterFilters: number; afterSearch: number }) => (
  <div className="rounded-lg border p-3 text-xs">
    <p className="font-semibold">Opportunity Funnel</p>
    <p>Total inventory: {total}</p>
    <p>After filters: {afterFilters}</p>
    <p>After search/sort: {afterSearch}</p>
  </div>
);
