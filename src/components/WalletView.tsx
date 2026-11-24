import { ArrowRight, CheckCircle2, PiggyBank, Receipt, Sliders } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useGigKids } from '../context/GigKidsContext';
import { formatInr, formatShortDate } from '../utils/formatters';

export function WalletView() {
  const {
    state,
    activeMember,
    kidMembers,
    setActiveView,
    payAssignedExpense,
    updateJarSplit,
    transferSpendToSave,
  } = useGigKids();

  const kid = activeMember.role === 'kid' ? activeMember : kidMembers[0];

  const [editingSplit, setEditingSplit] = useState(false);
  const [savePct, setSavePct] = useState(kid?.jarSplit.savePct ?? 40);
  const [spendPct, setSpendPct] = useState(kid?.jarSplit.spendPct ?? 45);
  const [givePct, setGivePct] = useState(kid?.jarSplit.givePct ?? 15);
  const [boostAmount, setBoostAmount] = useState(100);

  useEffect(() => {
    setEditingSplit(false);
  }, [kid?.id]);

  if (!kid) return null;

  const activeKidGoals = state.savingsGoals.filter(
    (g) => g.kidId === kid.id && g.status !== 'purchased'
  );
  const primaryGoal =
    activeKidGoals.find((g) => g.isPrimary) ?? activeKidGoals[0] ?? null;
  const allocatedGoalInr = activeKidGoals.reduce((sum, g) => sum + g.savedInr, 0);

  const totalSaveValue = kid.balances.saveInr + allocatedGoalInr;
  const totalBalance =
    totalSaveValue + kid.balances.spendInr + kid.balances.giveInr;

  const goalProgressPct = primaryGoal
    ? Math.min(
        100,
        Math.round((primaryGoal.savedInr / Math.max(1, primaryGoal.targetInr)) * 100)
      )
    : 0;
  const remainingForGoal = primaryGoal
    ? Math.max(0, primaryGoal.targetInr - primaryGoal.savedInr)
    : 0;

  const kidExpenses = state.expenses.filter((e) => e.kidId === kid.id);
  const dueExpenses = kidExpenses.filter((e) => e.status === 'due');
  const paidExpenses = kidExpenses.filter((e) => e.status === 'paid');
  const kidTransactions = state.transactions.filter((t) => t.kidId === kid.id);

  const splitSum = savePct + spendPct + givePct;

  const handleSaveSplit = (e: React.FormEvent) => {
    e.preventDefault();
    if (splitSum !== 100) return;
    updateJarSplit(kid.id, { savePct, spendPct, givePct });
    setEditingSplit(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <p className="text-xs font-medium text-emerald-700">
          Earnings Wallet · Save / Spend / Give Split Jars
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {kid.name}&apos;s Money &amp; Jars
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Every approved gig payout automatically splits across your three jars in Indian Rupees.
        </p>
      </section>

      {/* 4-Column Flat KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Total Earned Net Worth</div>
          <div className="mt-1.5 font-mono tabular-nums text-2xl font-bold text-slate-900">
            {formatInr(totalBalance)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Jars + active goals</div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-emerald-700">Save &amp; Goals ({kid.jarSplit.savePct}%)</div>
          <div className="mt-1.5 font-mono tabular-nums text-2xl font-bold text-emerald-700">
            {formatInr(totalSaveValue)}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
            {formatInr(kid.balances.saveInr)} jar · {formatInr(allocatedGoalInr)} in goals
          </div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-indigo-700">Spend Jar ({kid.jarSplit.spendPct}%)</div>
          <div className="mt-1.5 font-mono tabular-nums text-2xl font-bold text-indigo-700">
            {formatInr(kid.balances.spendInr)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Wants &amp; gifts</div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-amber-700">Give Jar ({kid.jarSplit.givePct}%)</div>
          <div className="mt-1.5 font-mono tabular-nums text-2xl font-bold text-amber-700">
            {formatInr(kid.balances.giveInr)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Charity &amp; kindness</div>
        </div>
      </section>

      {/* Main Split: Primary Goal Link + Jar Controls | Expense Passover */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Primary Savings Goal Summary Card */}
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <PiggyBank className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Primary Savings Goal · {activeKidGoals.length} active{' '}
                    {activeKidGoals.length === 1 ? 'target' : 'targets'}
                  </span>
                </div>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  {primaryGoal ? primaryGoal.title : 'No active goal set'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('goals')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-800 px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer whitespace-nowrap"
              >
                <span>All Savings Goals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {primaryGoal ? (
              <div className="mt-5">
                <div className="flex items-baseline justify-between text-sm mb-2">
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    {formatInr(primaryGoal.savedInr)} saved
                  </span>
                  <span className="font-mono tabular-nums text-slate-500">
                    Goal: {formatInr(primaryGoal.targetInr)} ({goalProgressPct}%)
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-200"
                    style={{ width: `${goalProgressPct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {remainingForGoal === 0
                    ? 'Goal reached! Open Savings Goals to mark it purchased.'
                    : `${formatInr(remainingForGoal)} more needed to unlock ${primaryGoal.title}.`}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Head to Savings Goals to set a ₹ target for an item you want.
              </p>
            )}

            {/* Boost Save Jar from Spend Jar */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-600">
                Move from Spend Jar ({formatInr(kid.balances.spendInr)}) to Save Jar
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  aria-label="Amount to transfer to Save Jar"
                  min={10}
                  step={10}
                  value={boostAmount}
                  onChange={(e) => setBoostAmount(Number(e.target.value))}
                  className="w-24 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-mono tabular-nums text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => transferSpendToSave(kid.id, boostAmount)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer"
                >
                  <span>Move to Save</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </section>

          {/* Auto-Split Rule Configurator */}
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Auto-Split Payout Rule</span>
                </div>
                <h2 className="mt-1 text-base font-semibold text-slate-900">
                  How each new Rupee gets divided
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSavePct(kid.jarSplit.savePct);
                  setSpendPct(kid.jarSplit.spendPct);
                  setGivePct(kid.jarSplit.givePct);
                  setEditingSplit((p) => !p);
                }}
                className="text-xs font-medium text-indigo-700 hover:text-indigo-800 px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer"
              >
                {editingSplit ? 'Cancel' : 'Adjust Split'}
              </button>
            </div>

            <div className="mt-4 h-2.5 w-full rounded-full overflow-hidden flex bg-slate-100">
              <div
                className="bg-emerald-600"
                style={{ width: `${editingSplit ? savePct : kid.jarSplit.savePct}%` }}
                title="Save"
              />
              <div
                className="bg-indigo-600"
                style={{ width: `${editingSplit ? spendPct : kid.jarSplit.spendPct}%` }}
                title="Spend"
              />
              <div
                className="bg-amber-500"
                style={{ width: `${editingSplit ? givePct : kid.jarSplit.givePct}%` }}
                title="Give"
              />
            </div>

            {editingSplit ? (
              <form onSubmit={handleSaveSplit} className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="split-save" className="block text-xs font-medium text-emerald-700 mb-1">
                      Save (%)
                    </label>
                    <input
                      id="split-save"
                      type="number"
                      min={0}
                      max={100}
                      value={savePct}
                      onChange={(e) => setSavePct(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label htmlFor="split-spend" className="block text-xs font-medium text-indigo-700 mb-1">
                      Spend (%)
                    </label>
                    <input
                      id="split-spend"
                      type="number"
                      min={0}
                      max={100}
                      value={spendPct}
                      onChange={(e) => setSpendPct(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label htmlFor="split-give" className="block text-xs font-medium text-amber-700 mb-1">
                      Give (%)
                    </label>
                    <input
                      id="split-give"
                      type="number"
                      min={0}
                      max={100}
                      value={givePct}
                      onChange={(e) => setGivePct(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-mono tabular-nums"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      splitSum === 100 ? 'text-emerald-700' : 'text-red-600 font-semibold'
                    }`}
                  >
                    Total: {splitSum}% {splitSum !== 100 ? '(Must equal 100%)' : ''}
                  </span>
                  <button
                    type="submit"
                    disabled={splitSum !== 100}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 disabled:bg-slate-300 rounded-lg cursor-pointer"
                  >
                    Save Split
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span>
                  Save: <strong className="font-mono tabular-nums text-emerald-700">{kid.jarSplit.savePct}%</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Spend: <strong className="font-mono tabular-nums text-indigo-700">{kid.jarSplit.spendPct}%</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Give: <strong className="font-mono tabular-nums text-amber-700">{kid.jarSplit.givePct}%</strong>
                </span>
              </div>
            )}
          </section>
        </div>

        {/* Expense Passover ("Skin in the Game") */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
          <div className="pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Receipt className="w-3.5 h-3.5 text-indigo-600" />
              <span>Expenses → Kids · Skin in the Game</span>
            </div>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              Assigned Expenses
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Friends&apos; birthday gifts and personal wants are paid from your Spend Jar ({formatInr(kid.balances.spendInr)} available).
            </p>
          </div>

          {dueExpenses.length === 0 && paidExpenses.length === 0 ? (
            <p className="py-6 text-sm text-slate-500">
              No personal expenses assigned right now.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 mt-2">
              {dueExpenses.map((exp) => (
                <div key={exp.id} className="py-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-500 capitalize">
                      {exp.category} · Due from Spend Jar
                    </div>
                    <div className="text-sm font-semibold text-slate-900 mt-0.5">
                      {exp.title}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono tabular-nums text-sm font-bold text-slate-900">
                      {formatInr(exp.amountInr)}
                    </span>
                    <button
                      type="button"
                      onClick={() => payAssignedExpense(exp.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer whitespace-nowrap"
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              ))}

              {paidExpenses.map((exp) => (
                <div key={exp.id} className="py-3.5 flex items-center justify-between gap-3 opacity-75">
                  <div>
                    <div className="text-xs text-emerald-700 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Paid from Spend Jar</span>
                    </div>
                    <div className="text-sm font-medium text-slate-700 mt-0.5">
                      {exp.title}
                    </div>
                  </div>
                  <span className="font-mono tabular-nums text-sm font-medium text-slate-600">
                    {formatInr(exp.amountInr)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Transaction History Ledger */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Rupee Ledger
            </h2>
            <p className="text-xs text-slate-500">
              Recent gig payouts, savings goal allocations, and paid expenses
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {kidTransactions.length} entries
          </span>
        </div>

        {kidTransactions.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Complete your first gig to see your earnings history here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-2.5 px-6">Activity</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Jar Breakdown</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {kidTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-6 font-medium text-slate-900">{tx.title}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {tx.type === 'gig_payout'
                        ? 'Gig Payout'
                        : tx.type === 'expense_paid'
                          ? 'Expense Paid'
                          : tx.type === 'goal_purchased'
                            ? 'Goal Purchased'
                            : tx.type === 'weekly_payday'
                              ? 'Weekly Bonus'
                              : 'Goal Allocation'}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono tabular-nums text-slate-500">
                      {tx.jarBreakdown
                        ? `Save ${formatInr(tx.jarBreakdown.saveInr)} · Spend ${formatInr(
                            tx.jarBreakdown.spendInr
                          )} · Give ${formatInr(tx.jarBreakdown.giveInr)}`
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatShortDate(tx.timestamp)}
                    </td>
                    <td
                      className={`py-3 px-6 text-right font-mono tabular-nums font-semibold whitespace-nowrap ${
                        tx.amountInr >= 0 ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {tx.amountInr >= 0 ? `+${formatInr(tx.amountInr)}` : formatInr(tx.amountInr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
