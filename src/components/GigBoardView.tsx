import { Brain, CheckCircle2, Clock, Hammer, Search, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useGigKids } from '../context/GigKidsContext';
import { Gig } from '../types/gigkids';
import { formatElapsedTimer, formatInr } from '../utils/formatters';
import { Avatar } from './Avatar';
import { ExpectationsPanel } from './ExpectationsPanel';
import { SubmitProofModal } from './GigModals';

type BoardFilter = 'all' | 'brain' | 'action' | 'mine' | 'family';
type SortMode = 'reward_desc' | 'time_asc';

interface GigBoardViewProps {
  onOpenProposeModal: () => void;
}

export function GigBoardView({ onOpenProposeModal }: GigBoardViewProps) {
  const { state, activeMember, claimGig, releaseGig } = useGigKids();
  const [filter, setFilter] = useState<BoardFilter>('all');
  const [sortBy, setSortBy] = useState<SortMode>('reward_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [proofTargetGig, setProofTargetGig] = useState<Gig | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const hasAnyClaimed = state.gigs.some((g) => g.status === 'claimed' && g.claimedAt);

  useEffect(() => {
    if (!hasAnyClaimed) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [hasAnyClaimed]);

  const memberById = useMemo(() => {
    const map = new Map(state.members.map((m) => [m.id, m]));
    return map;
  }, [state.members]);

  const filteredGigs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return state.gigs
      .filter((gig) => {
        if (gig.status === 'completed') return false;
        if (query) {
          const hit =
            gig.title.toLowerCase().includes(query) ||
            gig.description.toLowerCase().includes(query);
          if (!hit) return false;
        }
        if (filter === 'brain') return gig.category === 'brain';
        if (filter === 'action') return gig.category === 'action';
        if (filter === 'mine') {
          return (
            (gig.status === 'claimed' || gig.status === 'pending_review') &&
            gig.claimedByKidId === activeMember.id
          );
        }
        if (filter === 'family') {
          return gig.status === 'claimed' || gig.status === 'pending_review';
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'reward_desc') return b.rewardInr - a.rewardInr;
        return a.estimatedMinutes - b.estimatedMinutes;
      });
  }, [state.gigs, filter, sortBy, searchQuery, activeMember.id]);

  const openGigsCount = state.gigs.filter((g) => g.status === 'open').length;
  const activeCount = state.gigs.filter(
    (g) => g.status === 'claimed' && g.claimedByKidId === activeMember.id
  ).length;
  const pendingCount = state.gigs.filter(
    (g) => g.status === 'pending_review' && g.claimedByKidId === activeMember.id
  ).length;

  return (
    <div className="space-y-8">
      {/* Editorial Summary Strip */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-indigo-700">
            Family Gig Marketplace · Earn It, Learn It, Own It
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
            Pick an optional gig to earn Rupees
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-slate-600 max-w-2xl">
            Basic household expectations are unpaid standards. Choose Action Gigs or high-value Brain Gigs below to build your savings jars.
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm border border-slate-200 bg-white rounded-xl px-5 py-3 shrink-0">
          <div>
            <div className="text-xs text-slate-500">Open Gigs</div>
            <div className="font-mono tabular-nums text-lg font-bold text-slate-900">
              {openGigsCount}
            </div>
          </div>
          <div className="h-7 w-px bg-slate-200" aria-hidden="true" />
          <div>
            <div className="text-xs text-slate-500">In Progress</div>
            <div className="font-mono tabular-nums text-lg font-bold text-indigo-700">
              {activeCount}
            </div>
          </div>
          <div className="h-7 w-px bg-slate-200" aria-hidden="true" />
          <div>
            <div className="text-xs text-slate-500">In Review</div>
            <div className="font-mono tabular-nums text-lg font-bold text-amber-700">
              {pendingCount}
            </div>
          </div>
        </div>
      </section>

      {/* Daily Unpaid Expectations Checklist */}
      <ExpectationsPanel />

      {/* Gig Board Filter & Search Toolbar */}
      <section aria-labelledby="gig-board-heading" className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            {(
              [
                { id: 'all', label: 'All Gigs' },
                { id: 'brain', label: 'Brain Gigs' },
                { id: 'action', label: 'Action Gigs' },
                { id: 'mine', label: 'My Active' },
                { id: 'family', label: 'Family Taken' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search gigs..."
                aria-label="Search gigs"
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <select
              aria-label="Sort gigs"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortMode)}
              className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
            >
              <option value="reward_desc">Highest ₹ Reward</option>
              <option value="time_asc">Quickest First</option>
            </select>
          </div>
        </div>

        <h2 id="gig-board-heading" className="sr-only">
          Available Family Gigs
        </h2>

        {filteredGigs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-base font-semibold text-slate-900">
              No gigs match this view right now
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Switch filters or pitch your own Custom Gig idea to earn extra Rupees.
            </p>
            <button
              type="button"
              onClick={onOpenProposeModal}
              className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
            >
              Propose a Custom Gig
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGigs.map((gig) => {
              const claimer = gig.claimedByKidId
                ? memberById.get(gig.claimedByKidId)
                : undefined;
              const proposer = gig.proposedByKidId
                ? memberById.get(gig.proposedByKidId)
                : undefined;
              const isClaimedByMe =
                gig.status === 'claimed' && gig.claimedByKidId === activeMember.id;
              const isPendingByMe =
                gig.status === 'pending_review' && gig.claimedByKidId === activeMember.id;

              return (
                <article
                  key={gig.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-5"
                >
                  <div>
                    {/* Quiet unboxed metadata line */}
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        {gig.category === 'brain' ? (
                          <Brain className="w-3.5 h-3.5 text-indigo-600" />
                        ) : (
                          <Hammer className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span
                          className={
                            gig.category === 'brain'
                              ? 'text-indigo-700'
                              : 'text-emerald-700'
                          }
                        >
                          {gig.category === 'brain' ? 'Brain Gig' : 'Action Gig'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {gig.estimatedMinutes}m
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">+{gig.xpReward} XP</span>
                      </span>

                      <span className="font-mono tabular-nums text-base font-bold text-slate-900">
                        {formatInr(gig.rewardInr)}
                      </span>
                    </div>

                    <h3 className="mt-2.5 text-base font-semibold text-slate-900 leading-snug">
                      {gig.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                      {gig.description}
                    </p>

                    {gig.parentFeedback && gig.status === 'claimed' && (
                      <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        Parent note: {gig.parentFeedback}
                      </p>
                    )}
                  </div>

                  {/* Footer action area */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    {gig.status === 'open' && (
                      <>
                        <span className="text-xs text-slate-500">Available now</span>
                        <button
                          type="button"
                          onClick={() => claimGig(gig.id)}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Claim Gig
                        </button>
                      </>
                    )}

                    {gig.status === 'proposed' && (
                      <div className="w-full flex items-center justify-between gap-2 text-xs text-amber-700">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <Sparkles className="w-3.5 h-3.5" />
                          Proposed by {proposer?.name ?? 'Kid'} · Awaiting Parent price
                        </span>
                      </div>
                    )}

                    {gig.status === 'claimed' && claimer && (
                      <>
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar src={claimer.avatarUrl} name={claimer.name} size="sm" />
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-slate-800 truncate">
                              {isClaimedByMe ? 'Your timer' : `${claimer.name} claimed`}
                            </div>
                            {gig.claimedAt && (
                              <div className="text-xs font-mono tabular-nums text-indigo-700 flex items-center gap-1">
                                <Clock className="w-3 h-3 shrink-0" />
                                {formatElapsedTimer(gig.claimedAt, nowMs)}
                              </div>
                            )}
                          </div>
                        </div>

                        {isClaimedByMe ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => releaseGig(gig.id)}
                              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg cursor-pointer"
                            >
                              Release
                            </button>
                            <button
                              type="button"
                              onClick={() => setProofTargetGig(gig)}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg whitespace-nowrap cursor-pointer"
                            >
                              Submit Proof
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            In progress
                          </span>
                        )}
                      </>
                    )}

                    {gig.status === 'pending_review' && claimer && (
                      <div className="w-full flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar src={claimer.avatarUrl} name={claimer.name} size="sm" />
                          <span className="text-xs font-medium text-amber-800 truncate">
                            {isPendingByMe
                              ? 'Submitted · Waiting for Parent'
                              : `${claimer.name} submitted proof`}
                          </span>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {proofTargetGig && (
        <SubmitProofModal
          gig={proofTargetGig}
          onClose={() => setProofTargetGig(null)}
        />
      )}
    </div>
  );
}
