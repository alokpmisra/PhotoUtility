import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pickNextQuestion } from "@/lib/masteryEngine";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only student accounts can practice" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const skillId = searchParams.get("skillId");
  if (!skillId) {
    return NextResponse.json({ error: "skillId is required" }, { status: 400 });
  }

  const result = await pickNextQuestion(session.user.id, skillId);
  if (!result) {
    return NextResponse.json({ error: "No questions available for this skill yet" }, { status: 404 });
  }

  const { question, mastery } = result;
  return NextResponse.json({
    question: {
      id: question.id,
      type: question.type,
      difficulty: question.difficulty,
      prompt: question.prompt,
      choices: question.choices ? JSON.parse(question.choices) : null,
    },
    mastery: {
      masteryScore: mastery.masteryScore,
      currentDifficulty: mastery.currentDifficulty,
      correctStreak: mastery.correctStreak,
    },
  });
}
