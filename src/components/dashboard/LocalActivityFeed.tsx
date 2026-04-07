import type { ActivityItem } from '@/lib/types';

export const LocalActivityFeed = ({ items }: { items: ActivityItem[] }) => (
  <section className="panel p-4 text-xs">
    <h3 className="font-semibold">Local Activity Feed</h3>
    {items.length ? <ul className="mt-2 space-y-1">{items.slice(0, 8).map((i) => <li key={i.id}>{new Date(i.timestamp).toLocaleTimeString()} · {i.message}</li>)}</ul> : <p className="mt-2 text-stone-500">No activity yet.</p>}
  </section>
);
