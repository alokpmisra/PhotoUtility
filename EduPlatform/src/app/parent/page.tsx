import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStudentDashboard } from "@/lib/dashboard";
import { AddStudentForm } from "@/components/AddStudentForm";

export default async function ParentPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["PARENT", "TUTOR"].includes(session.user.role)) redirect("/dashboard");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { guardianOf: { include: { studentProfile: true } } },
  });
  const students = me?.guardianOf ?? [];

  const summaries = await Promise.all(
    students.map(async (s) => ({
      id: s.id,
      name: s.name,
      gradeBand: s.studentProfile?.gradeBand,
      dashboard: await getStudentDashboard(s.id),
    })),
  );

  return (
    <div className="mx-auto max-w-5xl w-full px-6 py-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {session.user.role === "TUTOR" ? "Your students" : "Your children"}
          </h1>
          <p className="text-slate-400 mt-1">Track mastery, not just grades.</p>
        </div>
        <AddStudentForm />
      </div>

      {summaries.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-slate-400">
          No students yet. Add one above to get started.
        </div>
      ) : (
        <div className="mt-8 grid sm:grid-cols-2 gap-5">
          {summaries.map((s) => (
            <Link
              key={s.id}
              href={`/parent/${s.id}`}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06] transition-colors"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white text-lg">{s.name}</h2>
                <span className="text-xs text-slate-500">{s.gradeBand}</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xl font-bold text-white">{s.dashboard.stats.skillsMastered}</p>
                  <p className="text-[11px] text-slate-500">Mastered</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{s.dashboard.stats.accuracy}%</p>
                  <p className="text-[11px] text-slate-500">Accuracy</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{s.dashboard.stats.dailyStreak}🔥</p>
                  <p className="text-[11px] text-slate-500">Streak</p>
                </div>
              </div>
              {s.dashboard.recommended && (
                <p className="mt-4 text-sm text-teal-400">Focus area: {s.dashboard.recommended.skillName}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
