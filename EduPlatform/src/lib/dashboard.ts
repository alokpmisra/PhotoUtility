import { prisma } from "@/lib/prisma";
import { getUnlockedSkillIds } from "@/lib/masteryEngine";

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Consecutive calendar days (ending today or yesterday) the student has practiced. */
function computeDailyStreak(attemptDates: Date[]): number {
  if (attemptDates.length === 0) return 0;
  const days = new Set(attemptDates.map(dateKey));
  let streak = 0;
  const cursor = new Date();
  // allow the streak to still count if today has no activity yet, as long as yesterday does
  if (!days.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dateKey(cursor))) return 0;
  }
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function getStudentDashboard(studentId: string) {
  const subjects = await prisma.subject.findMany({
    orderBy: { order: "asc" },
    include: {
      units: {
        orderBy: { order: "asc" },
        include: {
          skills: {
            orderBy: { order: "asc" },
            include: { prerequisites: { select: { id: true } } },
          },
        },
      },
    },
  });

  const allSkills = subjects.flatMap((s) => s.units.flatMap((u) => u.skills));
  const unlockedIds = await getUnlockedSkillIds(studentId, allSkills);

  const masteries = await prisma.skillMastery.findMany({ where: { studentId } });
  const masteryBySkill = new Map(masteries.map((m) => [m.skillId, m]));

  const subjectViews = subjects.map((subject) => {
    const units = subject.units.map((unit) => {
      const skills = unit.skills.map((skill) => {
        const mastery = masteryBySkill.get(skill.id);
        return {
          id: skill.id,
          slug: skill.slug,
          name: skill.name,
          description: skill.description,
          unlocked: unlockedIds.has(skill.id),
          masteryScore: mastery?.masteryScore ?? 0,
          currentDifficulty: mastery?.currentDifficulty ?? 1,
          attemptsCount: mastery?.attemptsCount ?? 0,
          mastered: Boolean(mastery?.masteredAt),
        };
      });
      const unitMastery =
        skills.length > 0 ? skills.reduce((sum, s) => sum + s.masteryScore, 0) / skills.length : 0;
      return { id: unit.id, slug: unit.slug, name: unit.name, gradeBand: unit.gradeBand, skills, unitMastery };
    });
    const subjectSkillCount = units.reduce((sum, u) => sum + u.skills.length, 0);
    const subjectMastery =
      subjectSkillCount > 0
        ? units.reduce((sum, u) => sum + u.skills.reduce((s2, sk) => s2 + sk.masteryScore, 0), 0) / subjectSkillCount
        : 0;
    const masteredCount = units.reduce((sum, u) => sum + u.skills.filter((s) => s.mastered).length, 0);
    return {
      id: subject.id,
      slug: subject.slug,
      name: subject.name,
      color: subject.color,
      icon: subject.icon,
      units,
      subjectMastery,
      masteredCount,
      totalSkills: subjectSkillCount,
    };
  });

  // Recommended focus skill: an unlocked, unmastered skill already in progress
  // (lowest mastery first), falling back to the first unlocked fresh skill.
  const unlockedUnmastered = allSkills
    .filter((s) => unlockedIds.has(s.id))
    .map((s) => ({ skill: s, mastery: masteryBySkill.get(s.id) }))
    .filter((x) => !x.mastery?.masteredAt);

  const inProgress = unlockedUnmastered
    .filter((x) => (x.mastery?.attemptsCount ?? 0) > 0)
    .sort((a, b) => (a.mastery?.masteryScore ?? 0) - (b.mastery?.masteryScore ?? 0));

  const recommended = inProgress[0]?.skill ?? unlockedUnmastered[0]?.skill ?? null;

  const attempts = await prisma.attempt.findMany({ where: { studentId }, select: { createdAt: true, correct: true } });
  const correctCount = attempts.filter((a) => a.correct).length;
  const accuracy = attempts.length > 0 ? Math.round((correctCount / attempts.length) * 100) : 0;
  const dailyStreak = computeDailyStreak(attempts.map((a) => a.createdAt));

  const earnedBadges = await prisma.earnedBadge.findMany({
    where: { studentId },
    include: { badge: true },
    orderBy: { earnedAt: "desc" },
  });

  const totalMastered = subjectViews.reduce((sum, s) => sum + s.masteredCount, 0);
  const totalSkills = subjectViews.reduce((sum, s) => sum + s.totalSkills, 0);

  return {
    subjects: subjectViews,
    recommended: recommended
      ? {
          skillId: recommended.id,
          skillName: recommended.name,
          unitId: recommended.unitId,
        }
      : null,
    stats: {
      totalAttempts: attempts.length,
      accuracy,
      dailyStreak,
      skillsMastered: totalMastered,
      totalSkills,
    },
    badges: earnedBadges.map((b) => ({
      slug: b.badge.slug,
      name: b.badge.name,
      description: b.badge.description,
      icon: b.badge.icon,
      earnedAt: b.earnedAt,
    })),
  };
}

export type StudentDashboard = Awaited<ReturnType<typeof getStudentDashboard>>;
