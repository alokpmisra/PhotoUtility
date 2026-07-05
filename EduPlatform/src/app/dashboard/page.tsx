import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getStudentDashboard } from "@/lib/dashboard";
import { SkillTree } from "@/components/SkillTree";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/parent");

  const dashboard = await getStudentDashboard(session.user.id);

  return (
    <div className="mx-auto max-w-5xl w-full px-6 py-10">
      <h1 className="text-2xl font-bold text-white">Welcome back, {session.user.name?.split(" ")[0]}</h1>
      <p className="text-slate-400 mt-1">Here&apos;s where your mastery stands today.</p>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Day streak" value={`${dashboard.stats.dailyStreak}🔥`} />
        <StatCard label="Accuracy" value={`${dashboard.stats.accuracy}%`} />
        <StatCard label="Skills mastered" value={`${dashboard.stats.skillsMastered}/${dashboard.stats.totalSkills}`} />
        <StatCard label="Questions answered" value={dashboard.stats.totalAttempts} />
      </div>

      {dashboard.recommended && (
        <div className="mt-8 rounded-2xl border border-teal-500/30 bg-teal-500/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-400">Recommended next</p>
            <p className="text-lg font-semibold text-white mt-1">{dashboard.recommended.skillName}</p>
          </div>
          <Link
            href={`/practice/${dashboard.recommended.skillId}`}
            className="rounded-lg bg-gradient-to-br from-teal-500 to-violet-600 px-5 py-2.5 text-white font-semibold hover:opacity-90 text-center"
          >
            Practice now
          </Link>
        </div>
      )}

      {dashboard.badges.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Badges earned</h2>
          <div className="flex flex-wrap gap-3">
            {dashboard.badges.map((b) => (
              <div key={b.slug} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 flex items-center gap-2">
                <span className="text-lg">{b.icon}</span>
                <div>
                  <p className="text-sm font-medium text-white">{b.name}</p>
                  <p className="text-[11px] text-slate-500">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <SkillTree subjects={dashboard.subjects} practiceLinks />
      </div>
    </div>
  );
}
