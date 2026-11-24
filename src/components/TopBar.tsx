import { useState } from 'react';
import { useGigKids } from '../context/GigKidsContext';
import { AppView } from '../types/gigkids';

interface TopBarProps {
  onPrimaryAction: () => void;
}

const NAV_ITEMS: { id: AppView; label: string }[] = [
  { id: 'board', label: 'Gig Board' },
  { id: 'goals', label: 'Savings Goals' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'profile', label: 'Profile' },
  { id: 'parent', label: 'Parent View' },
];

export function TopBar({ onPrimaryAction }: TopBarProps) {
  const { state, activeMember, setActiveView } = useGigKids();
  const [logoFailed, setLogoFailed] = useState(false);

  const pendingApprovals = state.gigs.filter(
    (g) => g.status === 'pending_review' || g.status === 'proposed'
  ).length;

  const isParentMode = state.activeView === 'parent' || activeMember.role === 'parent';
  const isGoalsMode = state.activeView === 'goals' && !isParentMode;

  const primaryActionLabel = isParentMode
    ? 'Create Gig'
    : isGoalsMode
      ? 'New Goal'
      : 'Propose Gig';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark + logo */}
        <button
          type="button"
          onClick={() => setActiveView(activeMember.role === 'parent' ? 'parent' : 'board')}
          className="inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded"
        >
          {!logoFailed ? (
            <img
              src="/src/assets/images/gigkids_app_logo_1795499980001.jpg"
              alt="GigKids logo"
              referrerPolicy="no-referrer"
              onError={() => setLogoFailed(true)}
              className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm font-bold inline-flex items-center justify-center shrink-0">
              G
            </span>
          )}
          <span>GigKids</span>
        </button>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive = state.activeView === item.id;
            const showCount = item.id === 'parent' && pendingApprovals > 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded ${
                  isActive
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {showCount && (
                  <span className="ml-1.5 font-mono tabular-nums text-xs text-amber-700 font-semibold">
                    ({pendingApprovals})
                  </span>
                )}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-indigo-600"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
          >
            {primaryActionLabel}
          </button>
        </div>
      </div>

      {/* Compact mobile navigation row */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden border-t border-slate-100 px-4 flex items-center justify-between gap-2 overflow-x-auto"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = state.activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
              className={`py-2.5 px-2 text-xs font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                isActive
                  ? 'border-indigo-600 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600'
              }`}
            >
              {item.label}
              {item.id === 'parent' && pendingApprovals > 0 ? ` (${pendingApprovals})` : ''}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
