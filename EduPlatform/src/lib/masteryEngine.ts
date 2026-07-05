import { prisma } from "@/lib/prisma";
import type { Question, SkillMastery } from "@prisma/client";

/**
 * Adaptive mastery engine.
 *
 * Every skill tracks a continuous 0-100 masteryScore (updated with an
 * Elo-style rating step, so the system explains *why* difficulty moved
 * instead of behaving as an opaque black box) plus a discrete
 * currentDifficulty (1-5) that decides which question tier to serve next.
 *
 * A skill is "mastered" - and unlocks whatever it gates - only once the
 * student has strung together several correct answers at the hardest tier
 * *and* their overall rating clears a floor, mirroring Kumon's repeated-
 * proof-of-mastery gate while still reacting per-question like a modern
 * adaptive system.
 */

const MASTERY_FLOOR = 0;
const MASTERY_CEILING = 100;
const MASTERED_SCORE_THRESHOLD = 80;
const MASTERED_TOP_STREAK_THRESHOLD = 3;
const STARTING_DIFFICULTY = 2;
const MAX_DIFFICULTY = 5;
const MIN_DIFFICULTY = 1;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Maps a 1-5 difficulty tier onto the same 0-100 scale as masteryScore. */
function difficultyRating(difficulty: number) {
  return difficulty * 20;
}

async function getOrCreateMastery(studentId: string, skillId: string): Promise<SkillMastery> {
  const existing = await prisma.skillMastery.findUnique({
    where: { studentId_skillId: { studentId, skillId } },
  });
  if (existing) return existing;
  return prisma.skillMastery.create({
    data: { studentId, skillId, currentDifficulty: STARTING_DIFFICULTY },
  });
}

function checkAnswer(question: Question, given: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase();
  if (question.type === "NUMERIC") {
    const a = parseFloat(given);
    const b = parseFloat(question.answer);
    if (!Number.isNaN(a) && !Number.isNaN(b)) return Math.abs(a - b) < 1e-6;
  }
  return norm(given) === norm(question.answer);
}

/** Difficulty tiers to search, closest to the target first, e.g. [3,4,2,5,1]. */
function difficultySearchOrder(target: number): number[] {
  const order = [target];
  for (let d = 1; d <= MAX_DIFFICULTY - MIN_DIFFICULTY; d++) {
    if (target + d <= MAX_DIFFICULTY) order.push(target + d);
    if (target - d >= MIN_DIFFICULTY) order.push(target - d);
  }
  return order;
}

export async function pickNextQuestion(studentId: string, skillId: string) {
  const mastery = await getOrCreateMastery(studentId, skillId);

  const attempted = await prisma.attempt.findMany({
    where: { studentId, question: { skillId } },
    select: { questionId: true },
  });
  const attemptedIds = new Set(attempted.map((a) => a.questionId));

  for (const difficulty of difficultySearchOrder(mastery.currentDifficulty)) {
    const candidates = await prisma.question.findMany({ where: { skillId, difficulty } });
    if (candidates.length === 0) continue;
    const unseen = candidates.filter((q) => !attemptedIds.has(q.id));
    const pool = unseen.length > 0 ? unseen : candidates;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    return { question: chosen, mastery };
  }
  return null;
}

export interface AttemptResult {
  correct: boolean;
  explanation: string;
  hint: string | null;
  masteryBefore: number;
  masteryAfter: number;
  previousDifficulty: number;
  newDifficulty: number;
  leveledUp: boolean;
  leveledDown: boolean;
  skillAlreadyMastered: boolean;
  newlyMastered: boolean;
}

export async function recordAttempt(
  studentId: string,
  questionId: string,
  givenAnswer: string,
  responseTimeMs: number,
): Promise<AttemptResult> {
  const question = await prisma.question.findUniqueOrThrow({ where: { id: questionId } });
  const mastery = await getOrCreateMastery(studentId, question.skillId);

  const correct = checkAnswer(question, givenAnswer);
  const masteryBefore = mastery.masteryScore;

  // Elo-style expected-outcome step: a correct answer against a question
  // rated far above current mastery moves the score more than a correct
  // answer against an easy one, and vice-versa for misses.
  const expected = 1 / (1 + Math.pow(10, (difficultyRating(question.difficulty) - masteryBefore) / 40));
  const k = mastery.attemptsCount < 5 ? 20 : 12; // faster convergence while the system is still learning the student
  const outcome = correct ? 1 : 0;
  const masteryAfter = clamp(masteryBefore + k * (outcome - expected), MASTERY_FLOOR, MASTERY_CEILING);

  const previousDifficulty = mastery.currentDifficulty;
  let newDifficulty = previousDifficulty;
  let correctStreak = mastery.correctStreak;
  let topDifficultyStreak = mastery.topDifficultyStreak;

  if (correct) {
    correctStreak += 1;
    const questionWasEasyForStudent = expected > 0.65;
    if (questionWasEasyForStudent || correctStreak >= 2) {
      newDifficulty = Math.min(MAX_DIFFICULTY, previousDifficulty + 1);
      correctStreak = 0;
    }
    if (question.difficulty === MAX_DIFFICULTY) {
      topDifficultyStreak += 1;
    }
  } else {
    correctStreak = 0;
    newDifficulty = Math.max(MIN_DIFFICULTY, previousDifficulty - 1);
    if (question.difficulty === MAX_DIFFICULTY) {
      topDifficultyStreak = 0;
    }
  }

  const skillAlreadyMastered = mastery.masteredAt !== null;
  const newlyMastered =
    !skillAlreadyMastered &&
    topDifficultyStreak >= MASTERED_TOP_STREAK_THRESHOLD &&
    masteryAfter >= MASTERED_SCORE_THRESHOLD;

  await prisma.$transaction([
    prisma.attempt.create({
      data: {
        studentId,
        questionId,
        givenAnswer,
        correct,
        responseTimeMs,
        difficultyAtAttempt: question.difficulty,
        masteryBefore,
        masteryAfter,
      },
    }),
    prisma.skillMastery.update({
      where: { id: mastery.id },
      data: {
        masteryScore: masteryAfter,
        currentDifficulty: newDifficulty,
        correctStreak,
        topDifficultyStreak,
        attemptsCount: mastery.attemptsCount + 1,
        lastPracticedAt: new Date(),
        masteredAt: newlyMastered ? new Date() : mastery.masteredAt,
      },
    }),
  ]);

  return {
    correct,
    explanation: question.explanation,
    hint: correct ? null : question.hint,
    masteryBefore,
    masteryAfter,
    previousDifficulty,
    newDifficulty,
    leveledUp: newDifficulty > previousDifficulty,
    leveledDown: newDifficulty < previousDifficulty,
    skillAlreadyMastered,
    newlyMastered,
  };
}

/** A skill unlocks once every prerequisite skill is mastered by this student. */
export async function getUnlockedSkillIds(
  studentId: string,
  skills: { id: string; prerequisites: { id: string }[] }[],
): Promise<Set<string>> {
  const masteries = await prisma.skillMastery.findMany({
    where: { studentId, masteredAt: { not: null } },
    select: { skillId: true },
  });
  const masteredSkillIds = new Set(masteries.map((m) => m.skillId));
  const unlocked = new Set<string>();
  for (const skill of skills) {
    if (skill.prerequisites.length === 0 || skill.prerequisites.every((p) => masteredSkillIds.has(p.id))) {
      unlocked.add(skill.id);
    }
  }
  return unlocked;
}
