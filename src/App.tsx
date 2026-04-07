import { NavLink, Route, Routes } from 'react-router-dom';
import { ComparisonView } from './components/ComparisonView';
import { DashboardView } from './components/DashboardView';
import { SavedDealsView } from './components/SavedDealsView';
import { PortfolioView } from './components/PortfolioView';
import { SharePacketView } from './components/SharePacketView';

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-700">SiteSense</p>
            <h1 className="text-xl font-semibold text-stone-900">See the deal before it’s built.</h1>
          </div>
          <nav className="flex gap-2 rounded-xl bg-stone-100 p-1">
            {[
              ['/', 'SignalMap™'],
              ['/saved', 'DealVault™'],
              ['/compare', 'Compare'],
              ['/portfolio', 'Portfolio'],
              ['/share', 'Share Packet'],
            ].map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-2 text-sm font-medium ${
                    isActive ? 'bg-brand-700 text-white' : 'text-stone-700 hover:bg-stone-200'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] p-6">
        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/saved" element={<SavedDealsView />} />
          <Route path="/compare" element={<ComparisonView />} />
          <Route path="/portfolio" element={<PortfolioView />} />
          <Route path="/share" element={<SharePacketView />} />
        </Routes>
      </main>
    </div>
  );
}
