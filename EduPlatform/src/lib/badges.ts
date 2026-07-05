import { prisma } from "@/lib/prisma";

async function award(studentId: string, badgeSlug: string): Promise<boolean> {
  const badge = await prisma.badge.findUnique({ where: { slug: badgeSlug } });
  if (!badge) return false;
  try {
    await prisma.earnedBadge.create({ data: { studentId, badgeId: badge.id } });
    return true;
  } catch {
    return false; // already earned - unique constraint tripped
  }
}

/** Call after recording an attempt. Returns slugs of badges newly earned this call. */
export async function checkAndAwardBadges(studentId: string): Promise<string[]> {
  const newly: string[] = [];

  const attemptCount = await prisma.attempt.count({ where: { studentId } });
  if (attemptCount === 1 && (await award(studentId, "first-steps"))) newly.push("first-steps");

  const last5 = await prisma.attempt.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  if (last5.length === 5 && last5.every((a) => a.correct) && (await award(studentId, "five-in-a-row"))) {
    newly.push("five-in-a-row");
  }

  const masteredCount = await prisma.skillMastery.count({ where: { studentId, masteredAt: { not: null } } });
  if (masteredCount === 1 && (await award(studentId, "skill-master"))) newly.push("skill-master");

  const subjects = await prisma.subject.findMany({ include: { units: { include: { skills: true } } } });
  for (const subject of subjects) {
    const skillIds = subject.units.flatMap((u) => u.skills.map((s) => s.id));
    if (skillIds.length === 0) continue;
    const masteredForSubject = await prisma.skillMastery.count({
      where: { studentId, skillId: { in: skillIds }, masteredAt: { not: null } },
    });
    if (masteredForSubject === skillIds.length && (await award(studentId, `champion-${subject.slug}`))) {
      newly.push(`champion-${subject.slug}`);
    }
  }

  return newly;
}
