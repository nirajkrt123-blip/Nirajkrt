import { Award, Flame, Trophy } from 'lucide-react';
import { BADGE_DEFINITIONS } from '../data/seedData';
import { useGigKids } from '../context/GigKidsContext';
import { LEVEL_THRESHOLDS, formatInr, getLevelInfo } from '../utils/formatters';
import { Avatar } from './Avatar';

export function ProfileView() {
  const { activeMember, kidMembers } = useGigKids();

  const kid = activeMember.role === 'kid' ? activeMember : kidMembers[0];
  if (!kid) return null;

  const levelInfo = getLevelInfo(kid.xp);
  const leaderboard = [...kidMembers].sort((a, b) => b.xp - a.xp);

  return (
    <div className="space-y-8">
      {/* Level & Profile Hero */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar src={kid.avatarUrl} name={kid.name} size="lg" />
            <div>
              <div className="text-xs text-slate-500">
                Age {kid.age} · Rank: <span className="font-semibold text-indigo-700">{levelInfo.level}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-0.5">{kid.name}&apos;s Progress</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                  <Flame className="w-3.5 h-3.5" />
                  <span className="font-mono tabular-nums">{kid.streakDays}-day</span> streak
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="font-mono tabular-nums text-slate-900">{kid.gigsCompleted}</strong>{' '}
                  gigs completed
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="font-mono tabular-nums text-slate-900">{kid.brainGigsCompleted}</strong>{' '}
                  Brain Gigs
                </span>
              </div>
            </div>
          </div>

          <div className="md:w-80">
            <div className="flex items-baseline justify-between text-xs mb-1.5">
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {kid.xp} XP
              </span>
              <span className="font-mono tabular-nums text-slate-500">
                {levelInfo.nextLevel
                  ? `${levelInfo.nextXp - kid.xp} XP to ${levelInfo.nextLevel}`
                  : 'Max Rank Reached'}
              </span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-200"
                style={{ width: `${levelInfo.progressPct}%` }}
              />
            </div>

            {/* Level ladder */}
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              {LEVEL_THRESHOLDS.map((tier) => {
                const reached = kid.xp >= tier.minXp;
                return (
                  <span
                    key={tier.level}
                    className={
                      tier.level === levelInfo.level
                        ? 'font-semibold text-indigo-700'
                        : reached
                          ? 'text-slate-700'
                          : 'text-slate-400'
                    }
                  >
                    {tier.level}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Skill Meters & Badge Collection Wall */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Skills Developed</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Earned automatically from Brain Gigs, Action Gigs, and managing your jars
            </p>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Financial Literacy', value: kid.skills.financial, color: 'bg-emerald-600' },
              { label: 'Intellectual Value (Brain Gigs)', value: kid.skills.intellectual, color: 'bg-indigo-600' },
              { label: 'Physical Hustle (Action Gigs)', value: kid.skills.physical, color: 'bg-amber-500' },
            ].map((skill) => (
              <div key={skill.label}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-700">{skill.label}</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    {skill.value}/100
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${skill.color} rounded-full`}
                    style={{ width: `${skill.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Badge Collection Wall</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real milestones unlocked through Brain Gigs, consistency, and savings
              </p>
            </div>
            <span className="font-mono tabular-nums text-xs font-semibold text-slate-700">
              {kid.unlockedBadgeIds.length}/{BADGE_DEFINITIONS.length} unlocked
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BADGE_DEFINITIONS.map((badge) => {
              const unlocked = kid.unlockedBadgeIds.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`p-3.5 rounded-lg border ${
                    unlocked
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-white border-slate-100 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Award
                        className={`w-4 h-4 shrink-0 ${
                          unlocked ? 'text-indigo-600' : 'text-slate-400'
                        }`}
                      />
                      <span className="text-sm font-semibold text-slate-900">
                        {badge.title}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-medium ${
                        unlocked ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      {unlocked ? 'Earned' : 'Locked'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 pl-6">{badge.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Sibling Leaderboard */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-600" />
          <h2 className="text-base font-semibold text-slate-900">Family Leaderboard</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                <th className="py-2.5 px-6">Sibling</th>
                <th className="py-2.5 px-4">Level</th>
                <th className="py-2.5 px-4 text-right">Streak</th>
                <th className="py-2.5 px-4 text-right">Brain Gigs</th>
                <th className="py-2.5 px-4 text-right">Total Saved</th>
                <th className="py-2.5 px-6 text-right">XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {leaderboard.map((member, idx) => {
                const info = getLevelInfo(member.xp);
                return (
                  <tr key={member.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <span className="font-mono tabular-nums text-xs text-slate-400 w-4">
                          #{idx + 1}
                        </span>
                        <Avatar src={member.avatarUrl} name={member.name} size="sm" />
                        <span className="font-semibold text-slate-900">{member.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-indigo-700">
                      {info.level}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {member.streakDays}d
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {member.brainGigsCompleted}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-medium">
                      {formatInr(member.balances.saveInr)}
                    </td>
                    <td className="py-3 px-6 text-right font-mono tabular-nums font-bold text-slate-900">
                      {member.xp}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
