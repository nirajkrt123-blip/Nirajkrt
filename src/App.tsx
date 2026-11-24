import { X } from 'lucide-react';
import { useState } from 'react';
import { GigBoardView } from './components/GigBoardView';
import { ProposeGigModal } from './components/GigModals';
import { ParentView } from './components/ParentView';
import { ProfileView } from './components/ProfileView';
import { SavingsGoalsView } from './components/SavingsGoalsView';
import { TopBar } from './components/TopBar';
import { WalletView } from './components/WalletView';
import { WorkspaceBar } from './components/WorkspaceBar';
import { GigKidsProvider, useGigKids } from './context/GigKidsContext';

function GigKidsWorkspace() {
  const { state, activeMember, setActiveView, toasts, dismissToast } = useGigKids();
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [parentCreateTrigger, setParentCreateTrigger] = useState(0);
  const [newGoalTrigger, setNewGoalTrigger] = useState(0);

  const handlePrimaryAction = () => {
    if (state.activeView === 'parent' || activeMember.role === 'parent') {
      setActiveView('parent');
      setParentCreateTrigger((n) => n + 1);
    } else if (state.activeView === 'goals') {
      setNewGoalTrigger((n) => n + 1);
    } else {
      setShowProposeModal(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar onPrimaryAction={handlePrimaryAction} />
      <WorkspaceBar />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-8">
        {state.activeView === 'board' && (
          <GigBoardView onOpenProposeModal={() => setShowProposeModal(true)} />
        )}
        {state.activeView === 'goals' && (
          <SavingsGoalsView externalNewGoalTrigger={newGoalTrigger} />
        )}
        {state.activeView === 'wallet' && <WalletView />}
        {state.activeView === 'profile' && <ProfileView />}
        {state.activeView === 'parent' && (
          <ParentView externalCreateTrigger={parentCreateTrigger} />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="inline-flex items-center gap-2">
            <img
              src="/src/assets/images/gigkids_app_logo_1795499980001.jpg"
              alt="GigKids"
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded object-cover border border-slate-200"
            />
            <span>GigKids · Stop paying for chores, offer gigs instead.</span>
          </div>
          <span>Currency: Indian Rupees (₹ INR)</span>
        </div>
      </footer>

      {showProposeModal && (
        <ProposeGigModal onClose={() => setShowProposeModal(false)} />
      )}

      {/* Toast Stack */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-sm text-sm font-medium ${
                toast.tone === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : toast.tone === 'info'
                    ? 'bg-white border-slate-200 text-slate-800'
                    : 'bg-slate-900 border-slate-900 text-white'
              }`}
            >
              <span>{toast.title}</span>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismissToast(toast.id)}
                className="opacity-70 hover:opacity-100 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <GigKidsProvider>
      <GigKidsWorkspace />
    </GigKidsProvider>
  );
}
