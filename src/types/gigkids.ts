export type UserRole = 'kid' | 'parent';

export type AppView = 'board' | 'goals' | 'wallet' | 'profile' | 'parent';

export type GigCategory = 'action' | 'brain';

export type GigStatus =
  | 'open'
  | 'claimed'
  | 'pending_review'
  | 'completed'
  | 'proposed';

export type KidLevel = 'Apprentice' | 'Pro' | 'Expert' | 'GigBoss';

export type SavingsGoalCategory = 'sports' | 'tech' | 'books' | 'creative' | 'other';

export interface SavingsGoalItem {
  id: string;
  kidId: string;
  title: string;
  category: SavingsGoalCategory;
  targetInr: number;
  savedInr: number;
  isPrimary: boolean;
  status: 'active' | 'reached' | 'purchased';
  createdAt: number;
  purchasedAt?: number;
}

export interface JarSplit {
  savePct: number;
  spendPct: number;
  givePct: number;
}

export interface JarBalances {
  saveInr: number;
  spendInr: number;
  giveInr: number;
}

export interface SavingsGoal {
  title: string;
  targetInr: number;
}

export interface SkillProgress {
  financial: number;
  intellectual: number;
  physical: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: UserRole;
  age?: number;
  avatarUrl: string;
  xp: number;
  streakDays: number;
  gigsCompleted: number;
  brainGigsCompleted: number;
  actionGigsCompleted: number;
  jarSplit: JarSplit;
  balances: JarBalances;
  savingsGoal: SavingsGoal;
  unlockedBadgeIds: string[];
  skills: SkillProgress;
}

export interface ExpectationItem {
  id: string;
  title: string;
  completedByKidIds: string[];
}

export interface Gig {
  id: string;
  title: string;
  description: string;
  category: GigCategory;
  rewardInr: number;
  xpReward: number;
  estimatedMinutes: number;
  status: GigStatus;
  claimedByKidId?: string;
  claimedAt?: number;
  proposedByKidId?: string;
  proofImageDataUrl?: string;
  proofNote?: string;
  parentFeedback?: string;
  submittedAt?: number;
  completedAt?: number;
}

export type ExpenseCategory = 'gift' | 'want' | 'snack';

export interface AssignedExpense {
  id: string;
  kidId: string;
  title: string;
  amountInr: number;
  category: ExpenseCategory;
  status: 'due' | 'paid';
  assignedAt: number;
  paidAt?: number;
}

export type TransactionType =
  | 'gig_payout'
  | 'expense_paid'
  | 'goal_transfer'
  | 'goal_purchased'
  | 'weekly_payday';

export interface Transaction {
  id: string;
  kidId: string;
  type: TransactionType;
  title: string;
  amountInr: number;
  jarBreakdown?: JarBalances;
  timestamp: number;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  category: 'brain' | 'action' | 'streak' | 'finance';
}

export interface ParentSettings {
  requireExpectationsForGigs: boolean;
  weeklyPaydayInr: number;
}

export interface GigKidsState {
  activeMemberId: string;
  activeView: AppView;
  members: FamilyMember[];
  expectations: ExpectationItem[];
  gigs: Gig[];
  savingsGoals: SavingsGoalItem[];
  expenses: AssignedExpense[];
  transactions: Transaction[];
  parentSettings: ParentSettings;
}

export interface ToastMessage {
  id: string;
  title: string;
  tone: 'success' | 'info' | 'warning';
}
