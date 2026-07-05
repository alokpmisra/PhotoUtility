import Link from "next/link";
import type { StudentDashboard } from "@/lib/dashboard";

function masteryBarColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-teal-400";
  if (score >= 20) return "bg-amber-400";
  return "bg-slate-500";
}

function SkillChip({ skill, href }: { skill: StudentDashboard["subjects"][number]["units"][number]["skills"][number]; href?: string }) {
  const content = (
    <div
      className={`rounded-xl border p-3 w-44 shrink-0 transition-colors ${
        skill.mastered
          ? "border-emerald-500/40 bg-emerald-500/10"
          : skill.unlocked
            ? "border-white/15 bg-white/[0.04] hover:bg-white/[0.08]"
            : "border-white/5 bg-white/[0.01] opacity-50"
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-sm font-medium text-slate-100 leading-snug">{skill.name}</p>
        {skill.mastered ? (
          <span title="Mastered">🏆</span>
        ) : !skill.unlocked ? (
          <span title="Locked - complete prerequisites first">🔒</span>
        ) : null}
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full ${masteryBarColor(skill.masteryScore)}`}
          style={{ width: `${Math.max(4, Math.round(skill.masteryScore))}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-slate-500">
        {skill.mastered ? "Mastered" : skill.unlocked ? `${Math.round(skill.masteryScore)}% mastery · Lv ${skill.currentDifficulty}` : "Locked"}
      </p>
    </div>
  );

  if (href && skill.unlocked && !skill.mastered) {
    return (
      <Link href={href} className="focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-xl">
        {content}
      </Link>
    );
  }
  if (href && skill.unlocked && skill.mastered) {
    return (
      <Link href={href} className="focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-xl" title="Mastered - keep sharpening it any time">
        {content}
      </Link>
    );
  }
  return content;
}

export function SkillTree({
  subjects,
  practiceLinks = false,
}: {
  subjects: StudentDashboard["subjects"];
  practiceLinks?: boolean;
}) {
  return (
    <div className="space-y-10">
      {subjects.map((subject) => (
        <section key={subject.id}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{subject.icon}</span>
              <h2 className="text-lg font-semibold text-white">{subject.name}</h2>
            </div>
            <span className="text-sm text-slate-400">
              {subject.masteredCount}/{subject.totalSkills} skills mastered · {Math.round(subject.subjectMastery)}% avg
            </span>
          </div>
          <div className="space-y-5">
            {subject.units.map((unit) => (
              <div key={unit.id}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  {unit.name} <span className="text-slate-600">· grades {unit.gradeBand}</span>
                </p>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {unit.skills.map((skill) => (
                    <SkillChip key={skill.id} skill={skill} href={practiceLinks ? `/practice/${skill.id}` : undefined} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
