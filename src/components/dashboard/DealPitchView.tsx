export const DealPitchView = ({ title, score, risk, roi, strategy, recommendation, note }: { title: string; score: number; risk: number; roi: number; strategy: string; recommendation: string; note: string }) => (
  <section className="panel p-8 text-center">
    <p className="text-xs uppercase tracking-widest text-brand-700">Deal Pitch Mode</p>
    <h2 className="mt-2 text-3xl font-bold">{title}</h2>
    <div className="mt-4 grid grid-cols-2 gap-4 text-left md:grid-cols-5">
      <p><span className="text-xs text-stone-500">Score</span><span className="block text-2xl font-bold">{score}</span></p>
      <p><span className="text-xs text-stone-500">Risk</span><span className="block text-2xl font-bold">{risk}</span></p>
      <p><span className="text-xs text-stone-500">ROI</span><span className="block text-2xl font-bold">{roi.toFixed(1)}%</span></p>
      <p><span className="text-xs text-stone-500">Strategy</span><span className="block font-semibold">{strategy}</span></p>
      <p><span className="text-xs text-stone-500">Recommendation</span><span className="block font-semibold">{recommendation}</span></p>
    </div>
    <p className="mt-4 rounded-lg bg-stone-50 p-3 text-sm">{note}</p>
  </section>
);
