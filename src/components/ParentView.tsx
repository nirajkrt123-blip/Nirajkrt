import {
  BarChart3,
  Check,
  ClipboardCheck,
  Pencil,
  Plus,
  Receipt,
  Sparkles,
  Trash2,
} from 'lucide-react';
import React, { useState } from 'react';
import { BRAIN_GIG_TEMPLATES } from '../data/seedData';
import { useGigKids } from '../context/GigKidsContext';
import { ExpenseCategory, Gig, GigCategory } from '../types/gigkids';
import { formatInr, formatShortDate, getLevelInfo } from '../utils/formatters';
import { Avatar } from './Avatar';

type ParentTab = 'approvals' | 'studio' | 'expectations' | 'expenses' | 'reports';

interface ParentViewProps {
  externalCreateTrigger: number;
}

export function ParentView({ externalCreateTrigger }: ParentViewProps) {
  const {
    state,
    kidMembers,
    approveGig,
    requestGigRedo,
    approveProposedGig,
    declineProposedGig,
    saveGig,
    deleteGig,
    addExpectation,
    deleteExpectation,
    toggleRequireExpectations,
    updateWeeklyPayday,
    triggerWeeklyPayday,
    assignExpense,
  } = useGigKids();

  const [activeTab, setActiveTab] = useState<ParentTab>('approvals');
  const [redoDrafts, setRedoDrafts] = useState<Record<string, string>>({});
  const [proposalPrices, setProposalPrices] = useState<Record<string, number>>({});

  // Gig Studio Form
  const [editingGigId, setEditingGigId] = useState<string | undefined>(undefined);
  const [gigTitle, setGigTitle] = useState('');
  const [gigDescription, setGigDescription] = useState('');
  const [gigCategory, setGigCategory] = useState<GigCategory>('brain');
  const [gigRewardInr, setGigRewardInr] = useState(250);
  const [gigXp, setGigXp] = useState(90);
  const [gigMinutes, setGigMinutes] = useState(25);

  // Expectations Form
  const [newExpTitle, setNewExpTitle] = useState('');

  // Expense Passover Form
  const [expKidId, setExpKidId] = useState(kidMembers[0]?.id ?? 'maya');
  const [expTitle, setExpTitle] = useState('');
  const [expAmountInr, setExpAmountInr] = useState(300);
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('gift');

  React.useEffect(() => {
    if (externalCreateTrigger > 0) {
      setActiveTab('studio');
      setEditingGigId(undefined);
    }
  }, [externalCreateTrigger]);

  const pendingReviews = state.gigs.filter((g) => g.status === 'pending_review');
  const proposedGigs = state.gigs.filter((g) => g.status === 'proposed');
  const manageableGigs = state.gigs.filter(
    (g) => g.status === 'open' || g.status === 'claimed'
  );

  const memberMap = new Map(state.members.map((m) => [m.id, m]));

  const loadTemplate = (tpl: (typeof BRAIN_GIG_TEMPLATES)[number]) => {
    setEditingGigId(undefined);
    setGigTitle(tpl.title);
    setGigDescription(tpl.description);
    setGigCategory(tpl.category);
    setGigRewardInr(tpl.rewardInr);
    setGigXp(tpl.xpReward);
    setGigMinutes(tpl.estimatedMinutes);
  };

  const startEditingGig = (gig: Gig) => {
    setEditingGigId(gig.id);
    setGigTitle(gig.title);
    setGigDescription(gig.description);
    setGigCategory(gig.category);
    setGigRewardInr(gig.rewardInr);
    setGigXp(gig.xpReward);
    setGigMinutes(gig.estimatedMinutes);
    setActiveTab('studio');
  };

  const handleSaveGigForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gigTitle.trim() || !gigDescription.trim()) return;
    saveGig({
      id: editingGigId,
      title: gigTitle,
      description: gigDescription,
      category: gigCategory,
      rewardInr: gigRewardInr,
      xpReward: gigXp,
      estimatedMinutes: gigMinutes,
    });
    setEditingGigId(undefined);
    setGigTitle('');
    setGigDescription('');
    setGigRewardInr(250);
    setGigXp(90);
    setGigMinutes(25);
  };

  const handleAddExpectation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpTitle.trim()) return;
    addExpectation(newExpTitle);
    setNewExpTitle('');
  };

  const handleAssignExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim()) return;
    assignExpense({
      kidId: expKidId,
      title: expTitle,
      amountInr: expAmountInr,
      category: expCategory,
    });
    setExpTitle('');
    setExpAmountInr(300);
  };

  const tabs: { id: ParentTab; label: string; count?: number }[] = [
    {
      id: 'approvals',
      label: 'Approvals & Pitches',
      count: pendingReviews.length + proposedGigs.length,
    },
    { id: 'studio', label: 'Gig Studio' },
    { id: 'expectations', label: 'Expectations & Payday' },
    { id: 'expenses', label: 'Expense Passover' },
    { id: 'reports', label: 'Skill Reports' },
  ];

  return (
    <div className="space-y-8">
      {/* Parent Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-indigo-700">
            Parent Dashboard · Gig Management &amp; Financial Oversight
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Family Operations &amp; Approvals
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Review photo proofs in Rupees, price kid-proposed gigs, manage unpaid expectations, and track skill growth.
          </p>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
              {typeof tab.count === 'number' && tab.count > 0 ? ` (${tab.count})` : ''}
            </button>
          ))}
        </div>
      </section>

      {/* TAB 1: Approvals & Kid Proposals */}
      {activeTab === 'approvals' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Completed Gigs Waiting for Review
                </h2>
                <p className="text-xs text-slate-500">
                  Approving automatically splits the ₹ reward into Save, Spend, and Give jars
                </p>
              </div>
              <span className="font-mono tabular-nums text-xs font-semibold text-slate-700">
                {pendingReviews.length} pending
              </span>
            </div>

            {pendingReviews.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                All submitted gigs have been reviewed.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {pendingReviews.map((gig) => {
                  const kid = gig.claimedByKidId
                    ? memberMap.get(gig.claimedByKidId)
                    : undefined;
                  return (
                    <div key={gig.id} className="py-5 first:pt-0 last:pb-0 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {kid && <Avatar src={kid.avatarUrl} name={kid.name} size="md" />}
                          <div>
                            <div className="text-xs text-slate-500">
                              {kid?.name} · {gig.category === 'brain' ? 'Brain Gig' : 'Action Gig'}
                              {gig.submittedAt ? ` · ${formatShortDate(gig.submittedAt)}` : ''}
                            </div>
                            <h3 className="text-base font-semibold text-slate-900">
                              {gig.title}
                            </h3>
                          </div>
                        </div>
                        <span className="font-mono tabular-nums text-base font-bold text-emerald-700">
                          {formatInr(gig.rewardInr)}
                        </span>
                      </div>

                      {gig.proofNote && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-sm text-slate-700">
                          <span className="text-xs font-medium text-slate-500 block mb-1">
                            Kid&apos;s Completion Note
                          </span>
                          {gig.proofNote}
                        </div>
                      )}

                      {gig.proofImageDataUrl && (
                        <img
                          src={gig.proofImageDataUrl}
                          alt={`Proof submitted for ${gig.title}`}
                          className="w-full max-h-56 object-cover rounded-lg border border-slate-200"
                        />
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Optional feedback if requesting redo..."
                            value={redoDrafts[gig.id] ?? ''}
                            onChange={(e) =>
                              setRedoDrafts((p) => ({ ...p, [gig.id]: e.target.value }))
                            }
                            className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => requestGigRedo(gig.id, redoDrafts[gig.id] ?? '')}
                            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg whitespace-nowrap cursor-pointer"
                          >
                            Request Redo
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => approveGig(gig.id)}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg whitespace-nowrap cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve &amp; Pay {formatInr(gig.rewardInr)}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Kid-Proposed Custom Gigs */}
          <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs text-indigo-700 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Custom Gigs · Entrepreneurial Pitches</span>
              </div>
              <h2 className="mt-1 text-base font-semibold text-slate-900">
                Kid-Proposed Gigs to Price
              </h2>
            </div>

            {proposedGigs.length === 0 ? (
              <p className="py-6 text-sm text-slate-500">
                No custom gig pitches waiting right now.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {proposedGigs.map((gig) => {
                  const proposer = gig.proposedByKidId
                    ? memberMap.get(gig.proposedByKidId)
                    : undefined;
                  const price = proposalPrices[gig.id] ?? gig.rewardInr;
                  return (
                    <div key={gig.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                      <div>
                        <div className="text-xs text-slate-500">
                          Pitched by {proposer?.name ?? 'Kid'} ·{' '}
                          {gig.category === 'brain' ? 'Brain Gig' : 'Action Gig'}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 mt-0.5">
                          {gig.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1">{gig.description}</p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`price-${gig.id}`}
                            className="text-xs text-slate-600"
                          >
                            Offer (₹):
                          </label>
                          <input
                            id={`price-${gig.id}`}
                            type="number"
                            min={20}
                            step={10}
                            value={price}
                            onChange={(e) =>
                              setProposalPrices((p) => ({
                                ...p,
                                [gig.id]: Number(e.target.value),
                              }))
                            }
                            className="w-24 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-mono tabular-nums"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => declineProposedGig(gig.id)}
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg cursor-pointer"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => approveProposedGig(gig.id, price)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                          >
                            Approve &amp; Assign
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 2: Gig Studio */}
      {activeTab === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {editingGigId ? 'Edit Family Gig' : 'Create a New Gig'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Or pick a high-value Brain Gig template below to pre-fill
              </p>
            </div>

            {/* Quick Brain Gig Templates */}
            <div className="flex flex-wrap gap-1.5">
              {BRAIN_GIG_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.title}
                  type="button"
                  onClick={() => loadTemplate(tpl)}
                  className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors cursor-pointer"
                >
                  + {tpl.title}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveGigForm} className="space-y-3.5 pt-2 border-t border-slate-100">
              <div>
                <label htmlFor="studio-title" className="block text-xs font-medium text-slate-700 mb-1">
                  Title
                </label>
                <input
                  id="studio-title"
                  type="text"
                  required
                  value={gigTitle}
                  onChange={(e) => setGigTitle(e.target.value)}
                  placeholder="e.g., Audit unused streaming plans"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-xs font-medium text-slate-700 mb-1">Category</span>
                  <div className="flex p-1 bg-slate-100 rounded-lg">
                    {(['brain', 'action'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setGigCategory(cat)}
                        className={`flex-1 py-1 text-xs font-medium rounded-md cursor-pointer ${
                          gigCategory === cat ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        {cat === 'brain' ? 'Brain' : 'Action'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="studio-reward" className="block text-xs font-medium text-slate-700 mb-1">
                    Reward (₹)
                  </label>
                  <input
                    id="studio-reward"
                    type="number"
                    min={20}
                    step={10}
                    required
                    value={gigRewardInr}
                    onChange={(e) => setGigRewardInr(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="studio-xp" className="block text-xs font-medium text-slate-700 mb-1">
                    XP Bonus
                  </label>
                  <input
                    id="studio-xp"
                    type="number"
                    min={20}
                    step={10}
                    required
                    value={gigXp}
                    onChange={(e) => setGigXp(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="studio-mins" className="block text-xs font-medium text-slate-700 mb-1">
                    Est. Minutes
                  </label>
                  <input
                    id="studio-mins"
                    type="number"
                    min={5}
                    step={5}
                    required
                    value={gigMinutes}
                    onChange={(e) => setGigMinutes(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="studio-desc" className="block text-xs font-medium text-slate-700 mb-1">
                  Description &amp; Success Criteria
                </label>
                <textarea
                  id="studio-desc"
                  rows={3}
                  required
                  value={gigDescription}
                  onChange={(e) => setGigDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {editingGigId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGigId(undefined);
                      setGigTitle('');
                      setGigDescription('');
                    }}
                    className="px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{editingGigId ? 'Save Changes' : 'Publish Gig'}</span>
                </button>
              </div>
            </form>
          </section>

          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Active Board Gigs</h2>
              <span className="font-mono tabular-nums text-xs text-slate-500">
                {manageableGigs.length} gigs
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {manageableGigs.map((gig) => (
                <div
                  key={gig.id}
                  className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/60"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500">
                      <span
                        className={
                          gig.category === 'brain' ? 'text-indigo-700 font-medium' : 'text-emerald-700 font-medium'
                        }
                      >
                        {gig.category === 'brain' ? 'Brain Gig' : 'Action Gig'}
                      </span>
                      {' · '}
                      <span>{gig.status === 'claimed' ? 'Claimed' : 'Open'}</span>
                      {' · '}
                      <span className="font-mono tabular-nums">{gig.estimatedMinutes}m</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 truncate mt-0.5">
                      {gig.title}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono tabular-nums text-sm font-bold text-slate-900">
                      {formatInr(gig.rewardInr)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Edit ${gig.title}`}
                      onClick={() => startEditingGig(gig)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${gig.title}`}
                      onClick={() => deleteGig(gig.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: Expectations & Weekly Payday */}
      {activeTab === 'expectations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Chores ≠ Money · Unpaid Family Baseline</span>
              </div>
              <h2 className="mt-1 text-base font-semibold text-slate-900">
                Daily Expectations List
              </h2>
            </div>

            <form onSubmit={handleAddExpectation} className="flex gap-2">
              <input
                type="text"
                value={newExpTitle}
                onChange={(e) => setNewExpTitle(e.target.value)}
                placeholder="Add a daily unpaid expectation (e.g., Put shoes on rack)"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap cursor-pointer"
              >
                Add Standard
              </button>
            </form>

            <ul className="divide-y divide-slate-100">
              {state.expectations.map((item) => (
                <li
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-4 text-sm"
                >
                  <div>
                    <div className="font-medium text-slate-900">{item.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Checked today:{' '}
                      {item.completedByKidIds.length === 0
                        ? 'None yet'
                        : item.completedByKidIds
                            .map((id) => memberMap.get(id)?.name)
                            .filter(Boolean)
                            .join(', ')}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${item.title}`}
                    onClick={() => deleteExpectation(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <h2 className="text-base font-semibold text-slate-900">Rules &amp; Weekly Payday</h2>

            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="text-sm font-medium text-slate-900">
                  Require Expectations before Paid Gigs
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  When enabled, kids must tick all daily expectations before claiming new gigs.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={state.parentSettings.requireExpectationsForGigs}
                onClick={toggleRequireExpectations}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  state.parentSettings.requireExpectationsForGigs
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                {state.parentSettings.requireExpectationsForGigs ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="weekly-payday" className="block text-sm font-medium text-slate-900 mb-1">
                  Weekly Consistency Bonus (₹ per child)
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Optional end-of-week payout auto-split across each child&apos;s Save/Spend/Give jars.
                </p>
                <input
                  id="weekly-payday"
                  type="number"
                  min={0}
                  step={50}
                  value={state.parentSettings.weeklyPaydayInr}
                  onChange={(e) => updateWeeklyPayday(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>

              <button
                type="button"
                onClick={triggerWeeklyPayday}
                className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
              >
                Run Weekly Payday ({formatInr(state.parentSettings.weeklyPaydayInr)} each)
              </button>
            </div>
          </section>
        </div>
      )}

      {/* TAB 4: Expense Passover */}
      {activeTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-indigo-700 font-medium">
                <Receipt className="w-3.5 h-3.5" />
                <span>Expenses → Kids</span>
              </div>
              <h2 className="mt-1 text-base font-semibold text-slate-900">
                Assign an Expense to a Child
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Give kids skin in the game by assigning birthday gifts, snacks, or personal wants to their Spend Jar.
              </p>
            </div>

            <form onSubmit={handleAssignExpense} className="space-y-3.5 pt-2 border-t border-slate-100">
              <div>
                <label htmlFor="exp-kid" className="block text-xs font-medium text-slate-700 mb-1">
                  Child
                </label>
                <select
                  id="exp-kid"
                  value={expKidId}
                  onChange={(e) => setExpKidId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                >
                  {kidMembers.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name} (Spend Jar: {formatInr(k.balances.spendInr)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="exp-title" className="block text-xs font-medium text-slate-700 mb-1">
                  Expense Description
                </label>
                <input
                  id="exp-title"
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g., Arjun's Birthday Gift or Movie Popcorn"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="exp-amt" className="block text-xs font-medium text-slate-700 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    id="exp-amt"
                    type="number"
                    min={10}
                    step={10}
                    required
                    value={expAmountInr}
                    onChange={(e) => setExpAmountInr(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="exp-cat" className="block text-xs font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    id="exp-cat"
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="gift">Birthday Gift</option>
                    <option value="want">Personal Want</option>
                    <option value="snack">Snacks / Outing</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
              >
                Assign Expense
              </button>
            </form>
          </section>

          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">Family Expense Passover Log</h2>
            </div>

            <div className="divide-y divide-slate-100">
              {state.expenses.map((exp) => {
                const kid = memberMap.get(exp.kidId);
                return (
                  <div
                    key={exp.id}
                    className="px-6 py-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {kid && <Avatar src={kid.avatarUrl} name={kid.name} size="sm" />}
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {exp.title}
                        </div>
                        <div className="text-xs text-slate-500 capitalize">
                          {kid?.name} · {exp.category} ·{' '}
                          <span
                            className={
                              exp.status === 'paid'
                                ? 'text-emerald-700 font-medium'
                                : 'text-amber-700 font-medium'
                            }
                          >
                            {exp.status === 'paid' ? 'Paid by child' : 'Due from Spend Jar'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="font-mono tabular-nums text-sm font-bold text-slate-900 shrink-0">
                      {formatInr(exp.amountInr)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* TAB 5: Weekly Skill Reports */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {kidMembers.map((kid) => {
            const info = getLevelInfo(kid.xp);
            const activeGoals = state.savingsGoals.filter(
              (g) => g.kidId === kid.id && g.status !== 'purchased'
            );
            const primaryGoal =
              activeGoals.find((g) => g.isPrimary) ?? activeGoals[0] ?? null;
            const allocatedInGoals = activeGoals.reduce((s, g) => s + g.savedInr, 0);
            const totalInr =
              kid.balances.saveInr +
              kid.balances.spendInr +
              kid.balances.giveInr +
              allocatedInGoals;
            const goalPct = primaryGoal
              ? Math.min(
                  100,
                  Math.round(
                    (primaryGoal.savedInr / Math.max(1, primaryGoal.targetInr)) * 100
                  )
                )
              : 0;
            return (
              <section
                key={kid.id}
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
              >
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <Avatar src={kid.avatarUrl} name={kid.name} size="md" />
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {kid.name} (Age {kid.age})
                      </h2>
                      <p className="text-xs text-slate-500">
                        {info.level} · {kid.streakDays}-day streak ·{' '}
                        <span className="font-mono tabular-nums">{kid.gigsCompleted}</span> gigs
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 flex items-center justify-end gap-1">
                      <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Total Saved &amp; Jars</span>
                    </div>
                    <div className="font-mono tabular-nums text-lg font-bold text-emerald-700">
                      {formatInr(totalInr)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Financial Discipline', value: kid.skills.financial, color: 'bg-emerald-600' },
                    { label: 'Intellectual Value (Brain)', value: kid.skills.intellectual, color: 'bg-indigo-600' },
                    { label: 'Physical Hustle (Action)', value: kid.skills.physical, color: 'bg-amber-500' },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700">{s.label}</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-900">
                          {s.value}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${s.color} rounded-full`}
                          style={{ width: `${s.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-slate-500">Brain Gigs</div>
                    <div className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                      {kid.brainGigsCompleted}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Action Gigs</div>
                    <div className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                      {kid.actionGigsCompleted}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Primary Goal</div>
                    <div className="font-mono tabular-nums font-semibold text-emerald-700 mt-0.5">
                      {primaryGoal ? `${goalPct}% (${primaryGoal.title})` : 'None'}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
