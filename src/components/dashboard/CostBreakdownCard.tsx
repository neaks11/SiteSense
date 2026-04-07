export const CostBreakdownCard = ({ m }: { m: { totalProjectCost: number; hardCost: number; contingency: number; financingCost: number } }) => (
  <section className="panel p-4 text-sm">
    <h3 className="font-semibold">Cost Breakdown</h3>
    <ul className="mt-2 space-y-1 text-xs">
      <li>Land + closing included</li>
      <li>Hard cost: ${Math.round(m.hardCost).toLocaleString()}</li>
      <li>Contingency: ${Math.round(m.contingency).toLocaleString()}</li>
      <li>Financing cost: ${Math.round(m.financingCost).toLocaleString()}</li>
      <li className="font-semibold">Total: ${Math.round(m.totalProjectCost).toLocaleString()}</li>
    </ul>
  </section>
);
