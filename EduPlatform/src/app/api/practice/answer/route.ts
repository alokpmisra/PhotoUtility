import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { recordAttempt } from "@/lib/masteryEngine";
import { checkAndAwardBadges } from "@/lib/badges";
import { prisma } from "@/lib/prisma";

const answerSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().max(500),
  responseTimeMs: z.number().int().min(0).max(10 * 60 * 1000),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only student accounts can submit answers" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = answerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const question = await prisma.question.findUnique({ where: { id: parsed.data.questionId } });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const result = await recordAttempt(
    session.user.id,
    parsed.data.questionId,
    parsed.data.answer,
    parsed.data.responseTimeMs,
  );
  const newBadges = await checkAndAwardBadges(session.user.id);

  return NextResponse.json({ result, newBadges });
}
