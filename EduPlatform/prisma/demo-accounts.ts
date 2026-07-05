import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { recordAttempt } from "@/lib/masteryEngine";
import { checkAndAwardBadges } from "@/lib/badges";

const DEMO_PASSWORD = "Demo1234!";

async function ensureUser(opts: {
  name: string;
  email: string;
  role: "STUDENT" | "PARENT" | "TUTOR";
  gradeBand?: "K-2" | "3-5" | "6-8";
}) {
  const existing = await prisma.user.findUnique({ where: { email: opts.email } });
  if (existing) return existing;
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  return prisma.user.create({
    data: {
      name: opts.name,
      email: opts.email,
      passwordHash,
      role: opts.role,
      studentProfile: opts.gradeBand ? { create: { gradeBand: opts.gradeBand } } : undefined,
    },
  });
}

async function simulatePractice(studentId: string, skillSlug: string, answersInOrder: (string | null)[]) {
  const skill = await prisma.skill.findFirst({ where: { slug: skillSlug } });
  if (!skill) return;
  const questions = await prisma.question.findMany({ where: { skillId: skill.id }, orderBy: { difficulty: "asc" } });
  for (let i = 0; i < answersInOrder.length; i++) {
    const question = questions[i % questions.length];
    const wantsCorrect = answersInOrder[i] !== null;
    const given = wantsCorrect ? question.answer : "___wrong___";
    await recordAttempt(studentId, question.id, given, 4000 + Math.floor(Math.random() * 6000));
  }
  await checkAndAwardBadges(studentId);
}

async function main() {
  console.log("Creating demo parent + student accounts...");

  const parent = await ensureUser({ name: "Priya Demo (Parent)", email: "parent@demo.eduplatform.dev", role: "PARENT" });
  const student = await ensureUser({
    name: "Arjun Demo (Student)",
    email: "student@demo.eduplatform.dev",
    role: "STUDENT",
    gradeBand: "3-5",
  });

  await prisma.user.update({
    where: { id: parent.id },
    data: { guardianOf: { connect: [{ id: student.id }] } },
  });

  // Give the demo student some practice history so the dashboard isn't empty.
  await simulatePractice(student.id, "adding-within-20", ["c", "c", "c", "c", "c", "c", "c"]);
  await simulatePractice(student.id, "subtracting-within-20", ["c", "c", "c", null, "c", "c"]);
  await simulatePractice(student.id, "multiplication-facts", ["c", null, "c", "c"]);
  await simulatePractice(student.id, "sight-words-phonics", ["c", "c", "c", "c", "c", "c", "c"]);
  await simulatePractice(student.id, "basic-vocabulary", ["c", "c", null, "c", "c"]);
  await simulatePractice(student.id, "living-nonliving", ["c", "c", "c", "c", "c", "c", "c"]);

  console.log("\nDemo accounts ready:");
  console.log(`  Parent  -> ${parent.email} / ${DEMO_PASSWORD}`);
  console.log(`  Student -> ${student.email} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
