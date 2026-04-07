export const ICMemoCard = ({
  thesis,
  bearCase,
  risks,
  recommendation,
  completeness,
}: {
  thesis: string;
  bearCase: string;
  risks: string[];
  recommendation: string;
  completeness: number;
}) => (
  <section className="panel p-4 text-xs">
    <h3 className="font-semibold">One-Glance IC Memo</h3>
    <p className="mt-2"><span className="font-medium">Thesis:</span> {thesis}</p>
    <p className="mt-1"><span className="font-medium">Bear Case:</span> {bearCase}</p>
    <p className="mt-1"><span className="font-medium">Recommendation:</span> {recommendation}</p>
    <p className="mt-1"><span className="font-medium">Diligence completeness:</span> {completeness}%</p>
    <ul className="mt-2 list-disc space-y-1 pl-5">
      {risks.slice(0, 3).map((r) => <li key={r}>{r}</li>)}
    </ul>
  </section>
);
