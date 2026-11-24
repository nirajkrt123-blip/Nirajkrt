import { Check, Lock } from 'lucide-react';
import { useGigKids } from '../context/GigKidsContext';

export function ExpectationsPanel() {
  const { state, activeMember, kidMembers, toggleExpectation } = useGigKids();

  const targetKid =
    activeMember.role === 'kid' ? activeMember : kidMembers[0];

  if (!targetKid) return null;

  const totalCount = state.expectations.length;
  const doneCount = state.expectations.filter((item) =>
    item.completedByKidIds.includes(targetKid.id)
  ).length;
  const allComplete = totalCount > 0 && doneCount === totalCount;

  return (
    <section
      aria-labelledby="expectations-heading"
      className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Chores ≠ Money</span>
            <span aria-hidden="true">·</span>
            <span>Unpaid Household Standards</span>
            {state.parentSettings.requireExpectationsForGigs && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                  <Lock className="w-3 h-3" />
                  Required before paid gigs
                </span>
              </>
            )}
          </div>
          <h2
            id="expectations-heading"
            className="mt-1 text-lg font-semibold text-slate-900"
          >
            {targetKid.name}&apos;s Daily Expectations
          </h2>
        </div>

        <div className="flex items-center gap-4 text-sm whitespace-nowrap shrink-0">
          <span className="font-mono tabular-nums font-semibold text-slate-900">
            {doneCount}/{totalCount} completed
          </span>
          <span
            className={`text-xs font-medium ${
              allComplete ? 'text-emerald-700' : 'text-slate-500'
            }`}
          >
            {allComplete ? 'Standard met for today' : 'Unpaid family baseline'}
          </span>
        </div>
      </div>

      {totalCount === 0 ? (
        <p className="pt-4 text-sm text-slate-500">
          No daily expectations configured yet. Parents can add household standards in Parent View.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 mt-1">
          {state.expectations.map((item) => {
            const isDone = item.completedByKidIds.includes(targetKid.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggleExpectation(item.id, targetKid.id)}
                  className="w-full py-3 flex items-center justify-between gap-4 text-left hover:bg-slate-50/70 px-2 -mx-2 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white border-slate-300 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </span>
                    <span
                      className={`text-sm ${
                        isDone
                          ? 'line-through text-slate-400'
                          : 'text-slate-800 font-medium'
                      }`}
                    >
                      {item.title}
                    </span>
                  </span>
                  <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                    {isDone ? 'Done' : 'Expectation'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
