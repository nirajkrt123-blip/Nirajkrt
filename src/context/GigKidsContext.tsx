import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createInitialSeedState } from '../data/seedData';
import {
  AppView,
  AssignedExpense,
  ExpenseCategory,
  FamilyMember,
  Gig,
  GigCategory,
  GigKidsState,
  JarSplit,
  SavingsGoalCategory,
  SavingsGoalItem,
  ToastMessage,
  Transaction,
} from '../types/gigkids';
import { formatInr } from '../utils/formatters';

const STORAGE_KEY = 'gigkids_family_state_v1';

interface GigKidsContextValue {
  state: GigKidsState;
  activeMember: FamilyMember;
  kidMembers: FamilyMember[];
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  setActiveMember: (memberId: string) => void;
  setActiveView: (view: AppView) => void;
  toggleExpectation: (expectationId: string, kidId?: string) => void;
  claimGig: (gigId: string) => void;
  releaseGig: (gigId: string) => void;
  submitGigProof: (gigId: string, proofNote: string, proofImageDataUrl?: string) => void;
  proposeCustomGig: (input: {
    title: string;
    description: string;
    category: GigCategory;
    rewardInr: number;
    estimatedMinutes: number;
  }) => void;
  approveGig: (gigId: string) => void;
  requestGigRedo: (gigId: string, feedback: string) => void;
  approveProposedGig: (gigId: string, finalRewardInr: number) => void;
  declineProposedGig: (gigId: string) => void;
  saveGig: (gigData: {
    id?: string;
    title: string;
    description: string;
    category: GigCategory;
    rewardInr: number;
    xpReward: number;
    estimatedMinutes: number;
  }) => void;
  deleteGig: (gigId: string) => void;
  addExpectation: (title: string) => void;
  deleteExpectation: (id: string) => void;
  toggleRequireExpectations: () => void;
  updateWeeklyPayday: (amountInr: number) => void;
  triggerWeeklyPayday: () => void;
  assignExpense: (input: {
    kidId: string;
    title: string;
    amountInr: number;
    category: ExpenseCategory;
  }) => void;
  payAssignedExpense: (expenseId: string) => void;
  updateJarSplit: (kidId: string, split: JarSplit) => void;
  updateSavingsGoal: (kidId: string, title: string, targetInr: number) => void;
  transferSpendToSave: (kidId: string, amountInr: number) => void;
  createSavingsGoal: (input: {
    kidId: string;
    title: string;
    category: SavingsGoalCategory;
    targetInr: number;
    isPrimary: boolean;
  }) => void;
  updateGoalDetails: (
    goalId: string,
    title: string,
    targetInr: number,
    category: SavingsGoalCategory
  ) => void;
  setPrimaryGoal: (goalId: string) => void;
  allocateToGoal: (goalId: string, amountInr: number, source: 'save' | 'spend') => void;
  withdrawFromGoal: (goalId: string, amountInr: number) => void;
  markGoalPurchased: (goalId: string) => void;
  deleteSavingsGoal: (goalId: string) => void;
  resetDemoData: () => void;
}

const GigKidsContext = createContext<GigKidsContextValue | null>(null);

function splitAmountByJars(amountInr: number, split: JarSplit) {
  const saveInr = Math.round((amountInr * split.savePct) / 100);
  const giveInr = Math.round((amountInr * split.givePct) / 100);
  const spendInr = Math.max(0, amountInr - saveInr - giveInr);
  return { saveInr, spendInr, giveInr };
}

function evaluateUnlockedBadges(
  member: FamilyMember,
  paidExpenseCount: number,
  kidGoals: SavingsGoalItem[]
): string[] {
  const set = new Set(member.unlockedBadgeIds);
  const allocatedGoalSavings = kidGoals
    .filter((g) => g.status !== 'purchased')
    .reduce((sum, g) => sum + g.savedInr, 0);
  const purchasedGoalsCount = kidGoals.filter((g) => g.status === 'purchased').length;

  if (member.brainGigsCompleted >= 1) set.add('first_brain_gig');
  if (member.brainGigsCompleted >= 3) set.add('brain_master_3');
  if (member.actionGigsCompleted >= 1) set.add('first_action_gig');
  if (member.streakDays >= 3) set.add('streak_3');
  if (member.streakDays >= 7) set.add('streak_7');
  if (member.balances.saveInr + allocatedGoalSavings >= 1000) set.add('savings_starter');
  if (purchasedGoalsCount >= 1) set.add('goal_achiever');
  if (paidExpenseCount >= 1) set.add('skin_in_the_game');
  if (member.xp >= 250) set.add('pro_rank');
  return Array.from(set);
}

function loadInitialState(): GigKidsState {
  const seed = createInitialSeedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Partial<GigKidsState>;
    if (!parsed || !Array.isArray(parsed.members) || !Array.isArray(parsed.gigs)) {
      return seed;
    }
    return {
      ...seed,
      ...parsed,
      savingsGoals: Array.isArray(parsed.savingsGoals)
        ? parsed.savingsGoals
        : seed.savingsGoals,
    };
  } catch {
    return seed;
  }
}

export function GigKidsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GigKidsState>(() => loadInitialState());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [state]);

  const pushToast = (title: string, tone: ToastMessage['tone'] = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { id, title, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const activeMember = useMemo(
    () => state.members.find((m) => m.id === state.activeMemberId) ?? state.members[0],
    [state.members, state.activeMemberId]
  );

  const kidMembers = useMemo(
    () => state.members.filter((m) => m.role === 'kid'),
    [state.members]
  );

  const setActiveMember = (memberId: string) => {
    setState((prev) => {
      const target = prev.members.find((m) => m.id === memberId);
      if (!target) return prev;
      let nextView = prev.activeView;
      if (target.role === 'parent' && prev.activeView !== 'parent') {
        nextView = 'parent';
      } else if (target.role === 'kid' && prev.activeView === 'parent') {
        nextView = 'board';
      }
      return { ...prev, activeMemberId: memberId, activeView: nextView };
    });
  };

  const setActiveView = (view: AppView) => {
    setState((prev) => {
      const current = prev.members.find((m) => m.id === prev.activeMemberId);
      if (view === 'parent' && current?.role !== 'parent') {
        const parent = prev.members.find((m) => m.role === 'parent');
        if (parent) {
          return { ...prev, activeView: view, activeMemberId: parent.id };
        }
      }
      if (view !== 'parent' && current?.role === 'parent') {
        const firstKid = prev.members.find((m) => m.role === 'kid');
        if (firstKid) {
          return { ...prev, activeView: view, activeMemberId: firstKid.id };
        }
      }
      return { ...prev, activeView: view };
    });
  };

  const toggleExpectation = (expectationId: string, kidId?: string) => {
    const targetKidId =
      kidId ?? (activeMember.role === 'kid' ? activeMember.id : kidMembers[0]?.id);
    if (!targetKidId) return;

    setState((prev) => {
      const expectations = prev.expectations.map((item) => {
        if (item.id !== expectationId) return item;
        const hasDone = item.completedByKidIds.includes(targetKidId);
        return {
          ...item,
          completedByKidIds: hasDone
            ? item.completedByKidIds.filter((id) => id !== targetKidId)
            : [...item.completedByKidIds, targetKidId],
        };
      });
      return { ...prev, expectations };
    });
  };

  const claimGig = (gigId: string) => {
    if (activeMember.role !== 'kid') {
      pushToast('Switch to a kid profile to claim gigs.', 'info');
      return;
    }

    if (state.parentSettings.requireExpectationsForGigs) {
      const incomplete = state.expectations.some(
        (e) => !e.completedByKidIds.includes(activeMember.id)
      );
      if (incomplete) {
        pushToast('Finish daily Expectations first before claiming paid gigs.', 'warning');
        return;
      }
    }

    setState((prev) => ({
      ...prev,
      gigs: prev.gigs.map((g) =>
        g.id === gigId && g.status === 'open'
          ? {
              ...g,
              status: 'claimed',
              claimedByKidId: prev.activeMemberId,
              claimedAt: Date.now(),
              parentFeedback: undefined,
            }
          : g
      ),
    }));
    pushToast('Gig claimed — timer started.', 'success');
  };

  const releaseGig = (gigId: string) => {
    setState((prev) => ({
      ...prev,
      gigs: prev.gigs.map((g) =>
        g.id === gigId && g.status === 'claimed'
          ? {
              ...g,
              status: 'open',
              claimedByKidId: undefined,
              claimedAt: undefined,
              parentFeedback: undefined,
            }
          : g
      ),
    }));
    pushToast('Gig returned to the family board.', 'info');
  };

  const submitGigProof = (gigId: string, proofNote: string, proofImageDataUrl?: string) => {
    setState((prev) => ({
      ...prev,
      gigs: prev.gigs.map((g) =>
        g.id === gigId
          ? {
              ...g,
              status: 'pending_review',
              proofNote: proofNote.trim() || 'Completed as requested.',
              proofImageDataUrl,
              submittedAt: Date.now(),
              parentFeedback: undefined,
            }
          : g
      ),
    }));
    pushToast('Proof submitted for parent approval.', 'success');
  };

  const proposeCustomGig = (input: {
    title: string;
    description: string;
    category: GigCategory;
    rewardInr: number;
    estimatedMinutes: number;
  }) => {
    const proposerId = activeMember.role === 'kid' ? activeMember.id : kidMembers[0]?.id ?? 'maya';
    const newGig: Gig = {
      id: `gig_custom_${Date.now()}`,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      rewardInr: Math.max(20, Math.round(input.rewardInr)),
      xpReward: Math.max(40, Math.round(input.rewardInr / 3)),
      estimatedMinutes: Math.max(10, Math.round(input.estimatedMinutes)),
      status: 'proposed',
      proposedByKidId: proposerId,
    };
    setState((prev) => ({
      ...prev,
      gigs: [newGig, ...prev.gigs],
    }));
    pushToast('Custom gig pitch sent to Parent View for pricing.', 'success');
  };

  const applySaveSplitWithPrimaryGoal = (
    kidId: string,
    saveInr: number,
    goals: SavingsGoalItem[]
  ) => {
    const primary = goals.find(
      (g) => g.kidId === kidId && g.status === 'active' && g.isPrimary
    );
    if (!primary || saveInr <= 0) {
      return { overflowSaveInr: saveInr, updatedGoals: goals, routedToGoalTitle: null as string | null };
    }
    const needed = Math.max(0, primary.targetInr - primary.savedInr);
    if (needed <= 0) {
      return { overflowSaveInr: saveInr, updatedGoals: goals, routedToGoalTitle: null };
    }
    const applied = Math.min(saveInr, needed);
    const overflowSaveInr = saveInr - applied;
    const updatedGoals = goals.map((g) => {
      if (g.id !== primary.id) return g;
      const nextSaved = g.savedInr + applied;
      return {
        ...g,
        savedInr: nextSaved,
        status: nextSaved >= g.targetInr ? ('reached' as const) : ('active' as const),
      };
    });
    return { overflowSaveInr, updatedGoals, routedToGoalTitle: primary.title };
  };

  const approveGig = (gigId: string) => {
    const targetGig = state.gigs.find((g) => g.id === gigId);
    if (!targetGig || !targetGig.claimedByKidId) return;

    const kidId = targetGig.claimedByKidId;
    const paidExpenseCount = state.expenses.filter(
      (e) => e.kidId === kidId && e.status === 'paid'
    ).length;

    let routedTitle: string | null = null;

    setState((prev) => {
      const kid = prev.members.find((m) => m.id === kidId);
      if (!kid) return prev;
      const breakdown = splitAmountByJars(targetGig.rewardInr, kid.jarSplit);
      const goalRouting = applySaveSplitWithPrimaryGoal(
        kidId,
        breakdown.saveInr,
        prev.savingsGoals
      );
      routedTitle = goalRouting.routedToGoalTitle;

      const updatedMembers = prev.members.map((m) => {
        if (m.id !== kidId) return m;
        const nextMember: FamilyMember = {
          ...m,
          xp: m.xp + targetGig.xpReward,
          streakDays: m.streakDays + 1,
          gigsCompleted: m.gigsCompleted + 1,
          brainGigsCompleted:
            targetGig.category === 'brain'
              ? m.brainGigsCompleted + 1
              : m.brainGigsCompleted,
          actionGigsCompleted:
            targetGig.category === 'action'
              ? m.actionGigsCompleted + 1
              : m.actionGigsCompleted,
          balances: {
            saveInr: m.balances.saveInr + goalRouting.overflowSaveInr,
            spendInr: m.balances.spendInr + breakdown.spendInr,
            giveInr: m.balances.giveInr + breakdown.giveInr,
          },
          skills: {
            financial: Math.min(100, m.skills.financial + 4),
            intellectual:
              targetGig.category === 'brain'
                ? Math.min(100, m.skills.intellectual + 8)
                : m.skills.intellectual,
            physical:
              targetGig.category === 'action'
                ? Math.min(100, m.skills.physical + 8)
                : m.skills.physical,
          },
        };
        const kidGoals = goalRouting.updatedGoals.filter((g) => g.kidId === kidId);
        nextMember.unlockedBadgeIds = evaluateUnlockedBadges(
          nextMember,
          paidExpenseCount,
          kidGoals
        );
        return nextMember;
      });

      const tx: Transaction = {
        id: `tx_${Date.now()}`,
        kidId,
        type: 'gig_payout',
        title: targetGig.title,
        amountInr: targetGig.rewardInr,
        jarBreakdown: breakdown,
        timestamp: Date.now(),
      };

      return {
        ...prev,
        members: updatedMembers,
        savingsGoals: goalRouting.updatedGoals,
        gigs: prev.gigs.map((g) =>
          g.id === gigId ? { ...g, status: 'completed', completedAt: Date.now() } : g
        ),
        transactions: [tx, ...prev.transactions],
      };
    });

    pushToast(
      routedTitle
        ? `Paid ${formatInr(targetGig.rewardInr)} & auto-saved toward ${routedTitle}.`
        : `Approved and paid ${formatInr(targetGig.rewardInr)} across jars.`,
      'success'
    );
  };

  const requestGigRedo = (gigId: string, feedback: string) => {
    setState((prev) => ({
      ...prev,
      gigs: prev.gigs.map((g) =>
        g.id === gigId
          ? {
              ...g,
              status: 'claimed',
              parentFeedback: feedback.trim() || 'Please double-check and upload fresh proof.',
            }
          : g
      ),
    }));
    pushToast('Sent back with feedback for a quick redo.', 'info');
  };

  const approveProposedGig = (gigId: string, finalRewardInr: number) => {
    const cleanReward = Math.max(20, Math.round(finalRewardInr));
    setState((prev) => ({
      ...prev,
      gigs: prev.gigs.map((g) =>
        g.id === gigId
          ? {
              ...g,
              rewardInr: cleanReward,
              xpReward: Math.max(40, Math.round(cleanReward / 3)),
              status: 'claimed',
              claimedByKidId: g.proposedByKidId,
              claimedAt: Date.now(),
            }
          : g
      ),
    }));
    pushToast(`Custom gig priced at ${formatInr(cleanReward)} and assigned.`, 'success');
  };

  const declineProposedGig = (gigId: string) => {
    setState((prev) => ({
      ...prev,
      gigs: prev.gigs.filter((g) => g.id !== gigId),
    }));
    pushToast('Custom gig proposal declined.', 'info');
  };

  const saveGig = (gigData: {
    id?: string;
    title: string;
    description: string;
    category: GigCategory;
    rewardInr: number;
    xpReward: number;
    estimatedMinutes: number;
  }) => {
    const cleanReward = Math.max(20, Math.round(gigData.rewardInr));
    setState((prev) => {
      if (gigData.id) {
        return {
          ...prev,
          gigs: prev.gigs.map((g) =>
            g.id === gigData.id
              ? {
                  ...g,
                  title: gigData.title.trim(),
                  description: gigData.description.trim(),
                  category: gigData.category,
                  rewardInr: cleanReward,
                  xpReward: Math.max(30, Math.round(gigData.xpReward)),
                  estimatedMinutes: Math.max(5, Math.round(gigData.estimatedMinutes)),
                }
              : g
          ),
        };
      }
      const created: Gig = {
        id: `gig_${Date.now()}`,
        title: gigData.title.trim(),
        description: gigData.description.trim(),
        category: gigData.category,
        rewardInr: cleanReward,
        xpReward: Math.max(30, Math.round(gigData.xpReward)),
        estimatedMinutes: Math.max(5, Math.round(gigData.estimatedMinutes)),
        status: 'open',
      };
      return { ...prev, gigs: [created, ...prev.gigs] };
    });
    pushToast(gigData.id ? 'Gig updated.' : 'New gig published to the family board.', 'success');
  };

  const deleteGig = (gigId: string) => {
    setState((prev) => ({
      ...prev,
      gigs: prev.gigs.filter((g) => g.id !== gigId),
    }));
    pushToast('Gig removed.', 'info');
  };

  const addExpectation = (title: string) => {
    const clean = title.trim();
    if (!clean) return;
    setState((prev) => ({
      ...prev,
      expectations: [
        ...prev.expectations,
        { id: `exp_${Date.now()}`, title: clean, completedByKidIds: [] },
      ],
    }));
    pushToast('Daily expectation added.', 'success');
  };

  const deleteExpectation = (id: string) => {
    setState((prev) => ({
      ...prev,
      expectations: prev.expectations.filter((e) => e.id !== id),
    }));
  };

  const toggleRequireExpectations = () => {
    setState((prev) => ({
      ...prev,
      parentSettings: {
        ...prev.parentSettings,
        requireExpectationsForGigs: !prev.parentSettings.requireExpectationsForGigs,
      },
    }));
  };

  const updateWeeklyPayday = (amountInr: number) => {
    setState((prev) => ({
      ...prev,
      parentSettings: {
        ...prev.parentSettings,
        weeklyPaydayInr: Math.max(0, Math.round(amountInr)),
      },
    }));
  };

  const triggerWeeklyPayday = () => {
    const amount = state.parentSettings.weeklyPaydayInr;
    if (amount <= 0) {
      pushToast('Set a weekly payday amount above ₹0 first.', 'warning');
      return;
    }

    setState((prev) => {
      const newTxs: Transaction[] = [];
      let workingGoals = [...prev.savingsGoals];

      const updatedMembers = prev.members.map((m) => {
        if (m.role !== 'kid') return m;
        const breakdown = splitAmountByJars(amount, m.jarSplit);
        const goalRouting = applySaveSplitWithPrimaryGoal(
          m.id,
          breakdown.saveInr,
          workingGoals
        );
        workingGoals = goalRouting.updatedGoals;

        newTxs.push({
          id: `tx_payday_${m.id}_${Date.now()}`,
          kidId: m.id,
          type: 'weekly_payday',
          title: 'Weekly Consistency Bonus',
          amountInr: amount,
          jarBreakdown: breakdown,
          timestamp: Date.now(),
        });
        const paidCount = prev.expenses.filter(
          (e) => e.kidId === m.id && e.status === 'paid'
        ).length;
        const nextMember: FamilyMember = {
          ...m,
          balances: {
            saveInr: m.balances.saveInr + goalRouting.overflowSaveInr,
            spendInr: m.balances.spendInr + breakdown.spendInr,
            giveInr: m.balances.giveInr + breakdown.giveInr,
          },
          skills: { ...m.skills, financial: Math.min(100, m.skills.financial + 3) },
        };
        const kidGoals = workingGoals.filter((g) => g.kidId === m.id);
        nextMember.unlockedBadgeIds = evaluateUnlockedBadges(nextMember, paidCount, kidGoals);
        return nextMember;
      });

      return {
        ...prev,
        members: updatedMembers,
        savingsGoals: workingGoals,
        transactions: [...newTxs, ...prev.transactions],
      };
    });
    pushToast(`Distributed ${formatInr(amount)} weekly bonus to each child.`, 'success');
  };

  const assignExpense = (input: {
    kidId: string;
    title: string;
    amountInr: number;
    category: ExpenseCategory;
  }) => {
    const cleanAmount = Math.max(10, Math.round(input.amountInr));
    const expense: AssignedExpense = {
      id: `exp_pass_${Date.now()}`,
      kidId: input.kidId,
      title: input.title.trim(),
      amountInr: cleanAmount,
      category: input.category,
      status: 'due',
      assignedAt: Date.now(),
    };
    setState((prev) => ({
      ...prev,
      expenses: [expense, ...prev.expenses],
    }));
    const kidName = state.members.find((m) => m.id === input.kidId)?.name ?? 'child';
    pushToast(`Assigned ${formatInr(cleanAmount)} expense to ${kidName}.`, 'success');
  };

  const payAssignedExpense = (expenseId: string) => {
    const expense = state.expenses.find((e) => e.id === expenseId);
    if (!expense || expense.status === 'paid') return;

    const kid = state.members.find((m) => m.id === expense.kidId);
    if (!kid) return;

    if (kid.balances.spendInr < expense.amountInr) {
      pushToast(
        `Spend Jar has ${formatInr(kid.balances.spendInr)}. Complete another gig to cover ${formatInr(expense.amountInr)}.`,
        'warning'
      );
      return;
    }

    const nextPaidCount =
      state.expenses.filter((e) => e.kidId === kid.id && e.status === 'paid').length + 1;

    setState((prev) => {
      const kidGoals = prev.savingsGoals.filter((g) => g.kidId === kid.id);
      const updatedMembers = prev.members.map((m) => {
        if (m.id !== kid.id) return m;
        const nextMember: FamilyMember = {
          ...m,
          xp: m.xp + 40,
          balances: {
            ...m.balances,
            spendInr: m.balances.spendInr - expense.amountInr,
          },
          skills: { ...m.skills, financial: Math.min(100, m.skills.financial + 6) },
        };
        nextMember.unlockedBadgeIds = evaluateUnlockedBadges(
          nextMember,
          nextPaidCount,
          kidGoals
        );
        return nextMember;
      });

      return {
        ...prev,
        members: updatedMembers,
        expenses: prev.expenses.map((e) =>
          e.id === expenseId ? { ...e, status: 'paid', paidAt: Date.now() } : e
        ),
        transactions: [
          {
            id: `tx_exp_${Date.now()}`,
            kidId: kid.id,
            type: 'expense_paid',
            title: `Paid: ${expense.title}`,
            amountInr: -expense.amountInr,
            timestamp: Date.now(),
          },
          ...prev.transactions,
        ],
      };
    });

    pushToast(`Paid ${formatInr(expense.amountInr)} from Spend Jar (+40 XP).`, 'success');
  };

  const updateJarSplit = (kidId: string, split: JarSplit) => {
    if (split.savePct + split.spendPct + split.givePct !== 100) {
      pushToast('Save, Spend, and Give percentages must equal 100%.', 'warning');
      return;
    }
    setState((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === kidId ? { ...m, jarSplit: split } : m)),
    }));
    pushToast('Future payout split saved.', 'success');
  };

  const updateSavingsGoal = (kidId: string, title: string, targetInr: number) => {
    const cleanTitle = title.trim() || 'Savings Goal';
    const cleanTarget = Math.max(100, Math.round(targetInr));
    setState((prev) => {
      const primary = prev.savingsGoals.find(
        (g) => g.kidId === kidId && g.status !== 'purchased' && g.isPrimary
      );
      const updatedGoals = primary
        ? prev.savingsGoals.map((g) =>
            g.id === primary.id
              ? {
                  ...g,
                  title: cleanTitle,
                  targetInr: cleanTarget,
                  status: g.savedInr >= cleanTarget ? ('reached' as const) : ('active' as const),
                }
              : g
          )
        : prev.savingsGoals;

      return {
        ...prev,
        savingsGoals: updatedGoals,
        members: prev.members.map((m) =>
          m.id === kidId
            ? {
                ...m,
                savingsGoal: {
                  title: cleanTitle,
                  targetInr: cleanTarget,
                },
              }
            : m
        ),
      };
    });
    pushToast('Primary savings goal updated.', 'success');
  };

  const transferSpendToSave = (kidId: string, amountInr: number) => {
    const clean = Math.round(amountInr);
    const kid = state.members.find((m) => m.id === kidId);
    if (!kid || clean <= 0) return;
    if (kid.balances.spendInr < clean) {
      pushToast('Not enough in Spend Jar for that transfer.', 'warning');
      return;
    }

    const paidCount = state.expenses.filter(
      (e) => e.kidId === kidId && e.status === 'paid'
    ).length;

    setState((prev) => ({
      ...prev,
      members: prev.members.map((m) => {
        if (m.id !== kidId) return m;
        const nextMember: FamilyMember = {
          ...m,
          balances: {
            ...m.balances,
            spendInr: m.balances.spendInr - clean,
            saveInr: m.balances.saveInr + clean,
          },
          skills: { ...m.skills, financial: Math.min(100, m.skills.financial + 3) },
        };
        const kidGoals = prev.savingsGoals.filter((g) => g.kidId === kidId);
        nextMember.unlockedBadgeIds = evaluateUnlockedBadges(nextMember, paidCount, kidGoals);
        return nextMember;
      }),
      transactions: [
        {
          id: `tx_xfer_${Date.now()}`,
          kidId,
          type: 'goal_transfer',
          title: 'Moved from Spend to Save Jar',
          amountInr: clean,
          timestamp: Date.now(),
        },
        ...prev.transactions,
      ],
    }));
    pushToast(`Moved ${formatInr(clean)} into Save Jar.`, 'success');
  };

  const createSavingsGoal = (input: {
    kidId: string;
    title: string;
    category: SavingsGoalCategory;
    targetInr: number;
    isPrimary: boolean;
  }) => {
    const cleanTitle = input.title.trim();
    const cleanTarget = Math.max(100, Math.round(input.targetInr));
    if (!cleanTitle) return;

    setState((prev) => {
      const hasAnyActive = prev.savingsGoals.some(
        (g) => g.kidId === input.kidId && g.status !== 'purchased'
      );
      const shouldBePrimary = input.isPrimary || !hasAnyActive;

      const updatedGoals = prev.savingsGoals.map((g) =>
        g.kidId === input.kidId && shouldBePrimary ? { ...g, isPrimary: false } : g
      );

      const newGoal: SavingsGoalItem = {
        id: `goal_${Date.now()}`,
        kidId: input.kidId,
        title: cleanTitle,
        category: input.category,
        targetInr: cleanTarget,
        savedInr: 0,
        isPrimary: shouldBePrimary,
        status: 'active',
        createdAt: Date.now(),
      };

      return {
        ...prev,
        savingsGoals: [newGoal, ...updatedGoals],
        members: shouldBePrimary
          ? prev.members.map((m) =>
              m.id === input.kidId
                ? { ...m, savingsGoal: { title: cleanTitle, targetInr: cleanTarget } }
                : m
            )
          : prev.members,
      };
    });

    pushToast(`Added Savings Goal: ${cleanTitle} (${formatInr(cleanTarget)}).`, 'success');
  };

  const updateGoalDetails = (
    goalId: string,
    title: string,
    targetInr: number,
    category: SavingsGoalCategory
  ) => {
    const cleanTitle = title.trim();
    const cleanTarget = Math.max(100, Math.round(targetInr));
    if (!cleanTitle) return;

    setState((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map((g) => {
        if (g.id !== goalId) return g;
        const nextStatus =
          g.status === 'purchased'
            ? 'purchased'
            : g.savedInr >= cleanTarget
              ? 'reached'
              : 'active';
        return {
          ...g,
          title: cleanTitle,
          targetInr: cleanTarget,
          category,
          status: nextStatus,
        };
      }),
    }));
    pushToast('Savings goal updated.', 'success');
  };

  const setPrimaryGoal = (goalId: string) => {
    const target = state.savingsGoals.find((g) => g.id === goalId);
    if (!target || target.status === 'purchased') return;

    setState((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map((g) =>
        g.kidId === target.kidId
          ? { ...g, isPrimary: g.id === goalId }
          : g
      ),
      members: prev.members.map((m) =>
        m.id === target.kidId
          ? { ...m, savingsGoal: { title: target.title, targetInr: target.targetInr } }
          : m
      ),
    }));
    pushToast(`Auto-save payouts now go to ${target.title}.`, 'success');
  };

  const allocateToGoal = (goalId: string, amountInr: number, source: 'save' | 'spend') => {
    const goal = state.savingsGoals.find((g) => g.id === goalId);
    if (!goal || goal.status === 'purchased') return;

    const kid = state.members.find((m) => m.id === goal.kidId);
    if (!kid) return;

    const clean = Math.round(amountInr);
    if (clean <= 0) {
      pushToast('Enter an amount above ₹0.', 'warning');
      return;
    }

    const available = source === 'save' ? kid.balances.saveInr : kid.balances.spendInr;
    if (available < clean) {
      pushToast(
        `Only ${formatInr(available)} available in your ${source === 'save' ? 'Save' : 'Spend'} Jar.`,
        'warning'
      );
      return;
    }

    const remainingNeeded = Math.max(0, goal.targetInr - goal.savedInr);
    if (remainingNeeded === 0) {
      pushToast(`${goal.title} has already reached 100% of its target.`, 'info');
      return;
    }

    const applied = Math.min(clean, remainingNeeded);
    const paidCount = state.expenses.filter(
      (e) => e.kidId === kid.id && e.status === 'paid'
    ).length;

    setState((prev) => {
      const updatedGoals = prev.savingsGoals.map((g) => {
        if (g.id !== goalId) return g;
        const nextSaved = g.savedInr + applied;
        return {
          ...g,
          savedInr: nextSaved,
          status: nextSaved >= g.targetInr ? ('reached' as const) : ('active' as const),
        };
      });

      const updatedMembers = prev.members.map((m) => {
        if (m.id !== kid.id) return m;
        const nextMember: FamilyMember = {
          ...m,
          balances: {
            ...m.balances,
            saveInr: source === 'save' ? m.balances.saveInr - applied : m.balances.saveInr,
            spendInr: source === 'spend' ? m.balances.spendInr - applied : m.balances.spendInr,
          },
          skills: { ...m.skills, financial: Math.min(100, m.skills.financial + 3) },
        };
        const kidGoals = updatedGoals.filter((g) => g.kidId === kid.id);
        nextMember.unlockedBadgeIds = evaluateUnlockedBadges(
          nextMember,
          paidCount,
          kidGoals
        );
        return nextMember;
      });

      const tx: Transaction = {
        id: `tx_goal_${Date.now()}`,
        kidId: kid.id,
        type: 'goal_transfer',
        title: `Saved toward ${goal.title} (from ${source === 'save' ? 'Save' : 'Spend'} Jar)`,
        amountInr: applied,
        timestamp: Date.now(),
      };

      return {
        ...prev,
        members: updatedMembers,
        savingsGoals: updatedGoals,
        transactions: [tx, ...prev.transactions],
      };
    });

    if (goal.savedInr + applied >= goal.targetInr) {
      pushToast(`Target reached! ${goal.title} is 100% funded!`, 'success');
    } else {
      pushToast(`Saved ${formatInr(applied)} toward ${goal.title}.`, 'success');
    }
  };

  const withdrawFromGoal = (goalId: string, amountInr: number) => {
    const goal = state.savingsGoals.find((g) => g.id === goalId);
    if (!goal || goal.status === 'purchased') return;
    const clean = Math.min(goal.savedInr, Math.round(amountInr));
    if (clean <= 0) return;

    setState((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map((g) => {
        if (g.id !== goalId) return g;
        const nextSaved = g.savedInr - clean;
        return {
          ...g,
          savedInr: nextSaved,
          status: nextSaved >= g.targetInr ? 'reached' : 'active',
        };
      }),
      members: prev.members.map((m) =>
        m.id === goal.kidId
          ? {
              ...m,
              balances: { ...m.balances, saveInr: m.balances.saveInr + clean },
            }
          : m
      ),
    }));
    pushToast(`Returned ${formatInr(clean)} from ${goal.title} to Save Jar.`, 'info');
  };

  const markGoalPurchased = (goalId: string) => {
    const goal = state.savingsGoals.find((g) => g.id === goalId);
    if (!goal || goal.status === 'purchased' || goal.savedInr < goal.targetInr) return;

    const paidCount = state.expenses.filter(
      (e) => e.kidId === goal.kidId && e.status === 'paid'
    ).length;

    setState((prev) => {
      const nextActive = prev.savingsGoals.find(
        (g) => g.kidId === goal.kidId && g.id !== goalId && g.status !== 'purchased'
      );
      const updatedGoals = prev.savingsGoals.map((g) => {
        if (g.id === goalId) {
          return {
            ...g,
            isPrimary: false,
            status: 'purchased' as const,
            purchasedAt: Date.now(),
          };
        }
        if (goal.isPrimary && nextActive && g.id === nextActive.id) {
          return { ...g, isPrimary: true };
        }
        return g;
      });

      const updatedMembers = prev.members.map((m) => {
        if (m.id !== goal.kidId) return m;
        const nextMember: FamilyMember = {
          ...m,
          xp: m.xp + 50,
          skills: { ...m.skills, financial: Math.min(100, m.skills.financial + 8) },
          savingsGoal: nextActive
            ? { title: nextActive.title, targetInr: nextActive.targetInr }
            : { title: 'Set next goal', targetInr: 1000 },
        };
        const kidGoals = updatedGoals.filter((g) => g.kidId === goal.kidId);
        nextMember.unlockedBadgeIds = evaluateUnlockedBadges(
          nextMember,
          paidCount,
          kidGoals
        );
        return nextMember;
      });

      const tx: Transaction = {
        id: `tx_buy_${Date.now()}`,
        kidId: goal.kidId,
        type: 'goal_purchased',
        title: `Goal Purchased: ${goal.title}`,
        amountInr: -goal.targetInr,
        timestamp: Date.now(),
      };

      return {
        ...prev,
        members: updatedMembers,
        savingsGoals: updatedGoals,
        transactions: [tx, ...prev.transactions],
      };
    });

    pushToast(`Goal achieved: ${goal.title} purchased (+50 XP)!`, 'success');
  };

  const deleteSavingsGoal = (goalId: string) => {
    const goal = state.savingsGoals.find((g) => g.id === goalId);
    if (!goal) return;

    setState((prev) => {
      const refund = goal.status !== 'purchased' ? goal.savedInr : 0;
      const remainingGoals = prev.savingsGoals.filter((g) => g.id !== goalId);
      const nextActive = remainingGoals.find(
        (g) => g.kidId === goal.kidId && g.status !== 'purchased'
      );

      const finalGoals =
        goal.isPrimary && nextActive
          ? remainingGoals.map((g) =>
              g.id === nextActive.id ? { ...g, isPrimary: true } : g
            )
          : remainingGoals;

      return {
        ...prev,
        savingsGoals: finalGoals,
        members: prev.members.map((m) =>
          m.id === goal.kidId
            ? {
                ...m,
                balances: { ...m.balances, saveInr: m.balances.saveInr + refund },
              }
            : m
        ),
      };
    });

    pushToast(
      goal.savedInr > 0 && goal.status !== 'purchased'
        ? `Removed ${goal.title} and refunded ${formatInr(goal.savedInr)} to Save Jar.`
        : `Removed ${goal.title}.`,
      'info'
    );
  };

  const resetDemoData = () => {
    const fresh = createInitialSeedState();
    setState(fresh);
    pushToast('Family workspace reset to sample data.', 'info');
  };

  return (
    <GigKidsContext.Provider
      value={{
        state,
        activeMember,
        kidMembers,
        toasts,
        dismissToast,
        setActiveMember,
        setActiveView,
        toggleExpectation,
        claimGig,
        releaseGig,
        submitGigProof,
        proposeCustomGig,
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
        payAssignedExpense,
        updateJarSplit,
        updateSavingsGoal,
        transferSpendToSave,
        createSavingsGoal,
        updateGoalDetails,
        setPrimaryGoal,
        allocateToGoal,
        withdrawFromGoal,
        markGoalPurchased,
        deleteSavingsGoal,
        resetDemoData,
      }}
    >
      {children}
    </GigKidsContext.Provider>
  );
}

export function useGigKids() {
  const ctx = useContext(GigKidsContext);
  if (!ctx) {
    throw new Error('useGigKids must be used within GigKidsProvider');
  }
  return ctx;
}
