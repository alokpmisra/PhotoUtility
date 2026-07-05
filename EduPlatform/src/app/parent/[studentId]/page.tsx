import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStudentDashboard } from "@/lib/dashboard";
import { SkillTree } from "@/components/SkillTree";

export default async function StudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["PARENT", "TUTOR"].includes(session.user.role)) redirect("/dashboard");

  const link = await prisma.user.findFirst({
    where: { id: session.user.id, guardianOf: { some: { id: studentId } } },
  });
  if (!link) notFound();

  const student = await prisma.user.findUnique({ where: { id: studentId }, include: { studentProfile: true } });
  if (!student) notFound();

  const dashboard = await getStudentDashboard(studentId);

  return (
    <div className="mx-auto max-w-5xl w-full px-6 py-10">
      <Link href="/parent" className="text-sm text-slate-400 hover:text-white">
        ← All students
      </Link>
      <div className="mt-2 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{student.name}</h1>
          <p className="text-slate-400 mt-1">Grade band {student.studentProfile?.gradeBand}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-2xl font-bold text-white">{dashboard.stats.dailyStreak}🔥</p>
          <p className="text-xs text-slate-400">Day streak</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-2xl font-bold text-white">{dashboard.stats.accuracy}%</p>
          <p className="text-xs text-slate-400">Accuracy</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-2xl font-bold text-white">
            {dashboard.stats.skillsMastered}/{dashboard.stats.totalSkills}
          </p>
          <p className="text-xs text-slate-400">Skills mastered</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-2xl font-bold text-white">{dashboard.stats.totalAttempts}</p>
          <p className="text-xs text-slate-400">Questions answered</p>
        </div>
      </div>

      {dashboard.recommended && (
        <div className="mt-8 rounded-2xl border border-teal-500/30 bg-teal-500/10 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-400">Recommended focus area</p>
          <p className="text-lg font-semibold text-white mt-1">{dashboard.recommended.skillName}</p>
          <p className="text-sm text-slate-400 mt-1">
            This is the skill in progress with the most room to grow right now - a good place to
            offer encouragement or a few extra minutes of practice.
          </p>
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
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Mastery map</h2>
        <SkillTree subjects={dashboard.subjects} />
      </div>
    </div>
  );
}
