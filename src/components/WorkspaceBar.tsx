import { RotateCcw, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useGigKids } from '../context/GigKidsContext';
import { formatElapsedTimer, formatInr, getLevelInfo } from '../utils/formatters';
import { Avatar } from './Avatar';

export function WorkspaceBar() {
  const { state, activeMember, setActiveMember, resetDemoData } = useGigKids();
  const [nowMs, setNowMs] = useState(() => Date.now());

  const activeClaimedGig = state.gigs.find(
    (g) => g.status === 'claimed' && g.claimedByKidId === activeMember.id && g.claimedAt
  );

  useEffect(() => {
    if (!activeClaimedGig) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [activeClaimedGig]);

  const activeGoalSavings = state.savingsGoals
    .filter((g) => g.kidId === activeMember.id && g.status !== 'purchased')
    .reduce((sum, g) => sum + g.savedInr, 0);

  const totalBalance =
    activeMember.balances.saveInr +
    activeMember.balances.spendInr +
    activeMember.balances.giveInr +
    activeGoalSavings;

  const levelInfo = getLevelInfo(activeMember.xp);

  return (
    <div className="bg-slate-50 border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Family Profile Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 mr-1 whitespace-nowrap">
            Active Profile
          </span>
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
            {state.members.map((member) => {
              const selected = member.id === activeMember.id;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setActiveMember(member.id)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                    selected
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Avatar src={member.avatarUrl} name={member.name} size="sm" />
                  <span>
                    {member.name}
                    {member.role === 'parent' ? ' · Parent' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contextual Kid Summary / Active Timer + Reset */}
        <div className="flex items-center gap-5 text-xs text-slate-600">
          {activeMember.role === 'kid' && (
            <div className="flex items-center gap-3 whitespace-nowrap">
              <span>
                Rank: <strong className="font-semibold text-slate-900">{levelInfo.level}</strong>
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span>
                Saved &amp; Jars:{' '}
                <strong className="font-mono tabular-nums font-semibold text-emerald-700">
                  {formatInr(totalBalance)}
                </strong>
              </span>
            </div>
          )}

          {activeClaimedGig && activeClaimedGig.claimedAt && (
            <div className="hidden sm:flex items-center gap-1.5 text-indigo-700 font-medium whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[160px]">{activeClaimedGig.title}</span>
              <span className="font-mono tabular-nums font-semibold">
                {formatElapsedTimer(activeClaimedGig.claimedAt, nowMs)}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={resetDemoData}
            title="Reset sample family data"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
