import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Cpu,
  Dumbbell,
  Palette,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useGigKids } from '../context/GigKidsContext';
import { SavingsGoalCategory, SavingsGoalItem } from '../types/gigkids';
import { formatInr, formatShortDate } from '../utils/formatters';

const CATEGORY_META: Record<
  SavingsGoalCategory,
  { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  sports: { label: 'Sports & Gear', Icon: Dumbbell },
  tech: { label: 'Tech & STEM', Icon: Cpu },
  books: { label: 'Books & Learning', Icon: BookOpen },
  creative: { label: 'Art & Hobbies', Icon: Palette },
  other: { label: 'Personal Goal', Icon: Target },
};

interface SavingsGoalsViewProps {
  externalNewGoalTrigger: number;
}

export function SavingsGoalsView({ externalNewGoalTrigger }: SavingsGoalsViewProps) {
  const {
    state,
    activeMember,
    kidMembers,
    setActiveView,
    createSavingsGoal,
    updateGoalDetails,
    setPrimaryGoal,
    allocateToGoal,
    withdrawFromGoal,
    markGoalPurchased,
    deleteSavingsGoal,
  } = useGigKids();

  const kid = activeMember.role === 'kid' ? activeMember : kidMembers[0];

  const [showNewModal, setShowNewModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoalItem | null>(null);
  const [fundingGoalId, setFundingGoalId] = useState<string | null>(null);
  const [fundSource, setFundSource] = useState<'save' | 'spend'>('save');
  const [fundAmount, setFundAmount] = useState(100);

  // New / Edit Modal Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<SavingsGoalCategory>('sports');
  const [formTargetInr, setFormTargetInr] = useState(1500);
  const [formIsPrimary, setFormIsPrimary] = useState(true);

  useEffect(() => {
    if (externalNewGoalTrigger > 0) {
      setEditingGoal(null);
      setFormTitle('');
      setFormCategory('sports');
      setFormTargetInr(1500);
      setFormIsPrimary(true);
      setShowNewModal(true);
    }
  }, [externalNewGoalTrigger]);

  useEffect(() => {
    setFundingGoalId(null);
  }, [kid?.id]);

  if (!kid) return null;

  const kidGoals = state.savingsGoals.filter((g) => g.kidId === kid.id);
  const activeGoals = kidGoals.filter((g) => g.status !== 'purchased');
  const purchasedGoals = kidGoals.filter((g) => g.status === 'purchased');

  const primaryGoal =
    activeGoals.find((g) => g.isPrimary) ?? activeGoals[0] ?? null;

  const totalAllocatedInGoals = activeGoals.reduce((sum, g) => sum + g.savedInr, 0);

  const openGigs = state.gigs.filter((g) => g.status === 'open');
  const avgGigReward =
    openGigs.length > 0
      ? Math.round(openGigs.reduce((s, g) => s + g.rewardInr, 0) / openGigs.length)
      : 250;

  const openNewModal = () => {
    setEditingGoal(null);
    setFormTitle('');
    setFormCategory('sports');
    setFormTargetInr(1500);
    setFormIsPrimary(activeGoals.length === 0);
    setShowNewModal(true);
  };

  const openEditModal = (goal: SavingsGoalItem) => {
    setEditingGoal(goal);
    setFormTitle(goal.title);
    setFormCategory(goal.category);
    setFormTargetInr(goal.targetInr);
    setFormIsPrimary(goal.isPrimary);
    setShowNewModal(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    if (editingGoal) {
      updateGoalDetails(editingGoal.id, formTitle, formTargetInr, formCategory);
    } else {
      createSavingsGoal({
        kidId: kid.id,
        title: formTitle,
        category: formCategory,
        targetInr: formTargetInr,
        isPrimary: formIsPrimary,
      });
    }
    setShowNewModal(false);
  };

  const handleFundSubmit = (e: React.FormEvent, goalId: string) => {
    e.preventDefault();
    allocateToGoal(goalId, fundAmount, fundSource);
    setFundingGoalId(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-emerald-700">
            Savings Goals · Earn, Save &amp; Track Targets in ₹
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {kid.name}&apos;s Savings Goals
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
            Set a target in Indian Rupees for items you want to own. Your Primary Goal automatically collects your Save Jar split from every completed gig.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Target Item</span>
        </button>
      </section>

      {/* 4-Column Flat KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        <div className="p-5">
          <div className="text-xs font-medium text-emerald-700">Saved in Goals</div>
          <div className="mt-1.5 font-mono tabular-nums text-2xl font-bold text-emerald-700">
            {formatInr(totalAllocatedInGoals)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Earmarked for items</div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Available Save Jar</div>
          <div className="mt-1.5 font-mono tabular-nums text-2xl font-bold text-slate-900">
            {formatInr(kid.balances.saveInr)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Ready to assign</div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-indigo-700">Active Targets</div>
          <div className="mt-1.5 font-mono tabular-nums text-2xl font-bold text-indigo-700">
            {activeGoals.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">In progress</div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Items Achieved</div>
          <div className="mt-1.5 font-mono tabular-nums text-2xl font-bold text-slate-900">
            {purchasedGoals.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">Bought with own earnings</div>
        </div>
      </section>

      {/* Primary Goal Spotlight */}
      {primaryGoal && (
        <section
          aria-labelledby="primary-goal-heading"
          className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7"
        >
          {(() => {
            const pct = Math.min(
              100,
              Math.round((primaryGoal.savedInr / Math.max(1, primaryGoal.targetInr)) * 100)
            );
            const remaining = Math.max(0, primaryGoal.targetInr - primaryGoal.savedInr);
            const savePerGig = Math.max(
              1,
              Math.round((avgGigReward * kid.jarSplit.savePct) / 100)
            );
            const estGigsLeft =
              remaining === 0 ? 0 : Math.max(1, Math.ceil(remaining / savePerGig));
            const MetaIcon = CATEGORY_META[primaryGoal.category].Icon;

            return (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-indigo-700 font-medium">
                      <Star className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
                      <span>Primary Auto-Save Goal</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 text-slate-500 font-normal">
                        <MetaIcon className="w-3.5 h-3.5" />
                        {CATEGORY_META[primaryGoal.category].label}
                      </span>
                    </div>
                    <h2
                      id="primary-goal-heading"
                      className="mt-1 text-xl font-bold text-slate-900"
                    >
                      {primaryGoal.title}
                    </h2>
                  </div>

                  <div className="sm:text-right">
                    <div className="font-mono tabular-nums text-xl font-bold text-slate-900">
                      {formatInr(primaryGoal.savedInr)}{' '}
                      <span className="text-sm font-normal text-slate-500">
                        / {formatInr(primaryGoal.targetInr)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                      {remaining === 0
                        ? '100% Target Reached!'
                        : `${formatInr(remaining)} left · ~${estGigsLeft} gigs at current ${kid.jarSplit.savePct}% Save split`}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-600">Progress toward item</span>
                    <span className="font-mono tabular-nums font-semibold text-emerald-700">
                      {pct}%
                    </span>
                  </div>
                  <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-200"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Quick Actions Row */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  {remaining === 0 ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                      <span className="text-sm font-medium text-emerald-700 inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Ready to buy with your own earned money!
                      </span>
                      <button
                        type="button"
                        onClick={() => markGoalPurchased(primaryGoal.id)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                      >
                        Mark Purchased (+50 XP)
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-500 mr-1">
                          Quick boost from Save Jar ({formatInr(kid.balances.saveInr)}):
                        </span>
                        {[50, 100, 250].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => allocateToGoal(primaryGoal.id, amt, 'save')}
                            disabled={kid.balances.saveInr < amt}
                            className="px-2.5 py-1 text-xs font-mono tabular-nums font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed border border-emerald-200 rounded-md cursor-pointer"
                          >
                            +{formatInr(amt)}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveView('board')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-800 cursor-pointer"
                      >
                        <span>Earn more on Gig Board</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {/* All Active Savings Goals */}
      <section aria-labelledby="all-goals-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="all-goals-heading" className="text-lg font-semibold text-slate-900">
            Active Target Items
          </h2>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {activeGoals.length} active
          </span>
        </div>

        {activeGoals.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-base font-semibold text-slate-900">
              No active savings goals yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Pick something you want to buy—a sports item, book set, or gadget—and set your ₹ target.
            </p>
            <button
              type="button"
              onClick={openNewModal}
              className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
            >
              Set Your First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeGoals.map((goal) => {
              const pct = Math.min(
                100,
                Math.round((goal.savedInr / Math.max(1, goal.targetInr)) * 100)
              );
              const remaining = Math.max(0, goal.targetInr - goal.savedInr);
              const MetaIcon = CATEGORY_META[goal.category].Icon;
              const isFundingOpen = fundingGoalId === goal.id;

              return (
                <article
                  key={goal.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                          <MetaIcon className="w-3.5 h-3.5 text-slate-500" />
                          <span>{CATEGORY_META[goal.category].label}</span>
                          {goal.isPrimary && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-indigo-700 font-semibold">
                                Primary Auto-Save
                              </span>
                            </>
                          )}
                          {remaining === 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-emerald-700 font-semibold">
                                Ready to Buy
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="mt-1 text-base font-semibold text-slate-900">
                          {goal.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!goal.isPrimary && (
                          <button
                            type="button"
                            title="Set as Primary Auto-Save Goal"
                            onClick={() => setPrimaryGoal(goal.id)}
                            className="px-2 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50 rounded-md cursor-pointer"
                          >
                            Make Primary
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label={`Edit ${goal.title}`}
                          onClick={() => openEditModal(goal)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${goal.title}`}
                          onClick={() => deleteSavingsGoal(goal.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between text-xs mb-1.5">
                        <span className="font-mono tabular-nums font-semibold text-slate-900">
                          {formatInr(goal.savedInr)} saved
                        </span>
                        <span className="font-mono tabular-nums text-slate-500">
                          Target {formatInr(goal.targetInr)} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-200 ${
                            remaining === 0 ? 'bg-emerald-600' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Inline Allocate / Withdraw Drawer or Action Row */}
                  {isFundingOpen ? (
                    <form
                      onSubmit={(e) => handleFundSubmit(e, goal.id)}
                      className="pt-3 border-t border-slate-100 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex p-0.5 bg-slate-100 rounded-md">
                          <button
                            type="button"
                            onClick={() => setFundSource('save')}
                            className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                              fundSource === 'save'
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600'
                            }`}
                          >
                            Save Jar ({formatInr(kid.balances.saveInr)})
                          </button>
                          <button
                            type="button"
                            onClick={() => setFundSource('spend')}
                            className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                              fundSource === 'spend'
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600'
                            }`}
                          >
                            Spend Jar ({formatInr(kid.balances.spendInr)})
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setFundingGoalId(null)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          aria-label="Rupees to save toward goal"
                          min={10}
                          step={10}
                          value={fundAmount}
                          onChange={(e) => setFundAmount(Number(e.target.value))}
                          className="w-28 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono tabular-nums"
                        />
                        <button
                          type="submit"
                          className="flex-1 py-1.5 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                        >
                          Add to Goal
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <span className="text-xs font-mono tabular-nums text-slate-500">
                        {remaining === 0
                          ? 'Target met!'
                          : `${formatInr(remaining)} to go`}
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        {goal.savedInr > 0 && remaining > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              withdrawFromGoal(goal.id, Math.min(100, goal.savedInr))
                            }
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg cursor-pointer"
                          >
                            -{formatInr(Math.min(100, goal.savedInr))}
                          </button>
                        )}

                        {remaining === 0 ? (
                          <button
                            type="button"
                            onClick={() => markGoalPurchased(goal.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                          >
                            Mark Purchased (+50 XP)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setFundingGoalId(goal.id);
                              setFundAmount(Math.min(remaining, 150));
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                          >
                            Add ₹ to Goal
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Achieved / Purchased History */}
      {purchasedGoals.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Items Bought With Own Earnings
              </h2>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {purchasedGoals.length} achieved
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {purchasedGoals.map((goal) => (
              <div
                key={goal.id}
                className="px-6 py-3.5 flex items-center justify-between gap-4 text-sm"
              >
                <div>
                  <div className="font-semibold text-slate-900">{goal.title}</div>
                  <div className="text-xs text-slate-500">
                    {CATEGORY_META[goal.category].label}
                    {goal.purchasedAt ? ` · Purchased ${formatShortDate(goal.purchasedAt)}` : ''}
                  </div>
                </div>
                <span className="font-mono tabular-nums font-bold text-emerald-700">
                  {formatInr(goal.targetInr)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* New / Edit Savings Goal Modal */}
      {showNewModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="goal-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <p className="text-xs text-slate-500">
                  {kid.name}&apos;s Savings Target · ₹ INR
                </p>
                <h3 id="goal-modal-title" className="text-lg font-semibold text-slate-900 mt-0.5">
                  {editingGoal ? 'Edit Savings Goal' : 'Set a New Savings Goal'}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setShowNewModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-4 space-y-4">
              <div>
                <label htmlFor="new-goal-title" className="block text-sm font-medium text-slate-700 mb-1">
                  What are you saving up for?
                </label>
                <input
                  id="new-goal-title"
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Skateboarding Helmet, Art Easel, Headphones"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-goal-cat" className="block text-sm font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    id="new-goal-cat"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as SavingsGoalCategory)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="sports">Sports &amp; Gear</option>
                    <option value="tech">Tech &amp; STEM</option>
                    <option value="books">Books &amp; Learning</option>
                    <option value="creative">Art &amp; Hobbies</option>
                    <option value="other">Personal Goal</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="new-goal-target" className="block text-sm font-medium text-slate-700 mb-1">
                    Target Amount (₹)
                  </label>
                  <input
                    id="new-goal-target"
                    type="number"
                    min={100}
                    step={50}
                    required
                    value={formTargetInr}
                    onChange={(e) => setFormTargetInr(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900"
                  />
                </div>
              </div>

              {!editingGoal && (
                <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={formIsPrimary}
                    onChange={(e) => setFormIsPrimary(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-indigo-600"
                  />
                  <span>
                    Make this my <strong>Primary Auto-Save Goal</strong> (Save Jar earnings from approved gigs go straight here)
                  </span>
                </label>
              )}

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                >
                  {editingGoal ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
