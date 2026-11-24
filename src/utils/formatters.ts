import { KidLevel } from '../types/gigkids';

const inrFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

export function formatInr(amount: number): string {
  const safe = Math.round(amount);
  const absFormatted = inrFormatter.format(Math.abs(safe));
  return safe < 0 ? `-₹${absFormatted}` : `₹${absFormatted}`;
}

export interface LevelInfo {
  level: KidLevel;
  nextLevel: KidLevel | null;
  minXp: number;
  nextXp: number;
  progressPct: number;
}

export const LEVEL_THRESHOLDS: { level: KidLevel; minXp: number }[] = [
  { level: 'Apprentice', minXp: 0 },
  { level: 'Pro', minXp: 250 },
  { level: 'Expert', minXp: 650 },
  { level: 'GigBoss', minXp: 1200 },
];

export function getLevelInfo(xp: number): LevelInfo {
  let currentIndex = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i].minXp) {
      currentIndex = i;
    }
  }

  const current = LEVEL_THRESHOLDS[currentIndex];
  const next = LEVEL_THRESHOLDS[currentIndex + 1] ?? null;

  if (!next) {
    return {
      level: current.level,
      nextLevel: null,
      minXp: current.minXp,
      nextXp: current.minXp,
      progressPct: 100,
    };
  }

  const span = next.minXp - current.minXp;
  const gained = xp - current.minXp;
  const progressPct = Math.min(100, Math.max(0, Math.round((gained / span) * 100)));

  return {
    level: current.level,
    nextLevel: next.level,
    minXp: current.minXp,
    nextXp: next.minXp,
    progressPct,
  };
}

export function formatElapsedTimer(startedAt: number, nowMs: number): string {
  const diffSeconds = Math.max(0, Math.floor((nowMs - startedAt) / 1000));
  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatShortDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}
