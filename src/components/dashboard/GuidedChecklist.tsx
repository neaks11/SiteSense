const steps = ['Review price', 'Review costs', 'Review rents', 'Review timeline', 'Review risk', 'Review strategy', 'Save notes', 'Decide pursue or pass'];

export const GuidedChecklist = ({ checked, onToggle }: { checked: string[]; onToggle: (s: string) => void }) => (
  <section className="panel p-4 text-xs">
    <h3 className="font-semibold">Guided Review Checklist</h3>
    <ul className="mt-2 space-y-1">
      {steps.map((s) => (
        <li key={s}>
          <label className="flex items-center gap-2"><input type="checkbox" checked={checked.includes(s)} onChange={() => onToggle(s)} /> {s}</label>
        </li>
      ))}
    </ul>
  </section>
);
