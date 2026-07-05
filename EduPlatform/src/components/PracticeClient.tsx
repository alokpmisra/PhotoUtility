"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Question = {
  id: string;
  type: "MULTIPLE_CHOICE" | "NUMERIC" | "SHORT_TEXT";
  difficulty: number;
  prompt: string;
  choices: string[] | null;
};

type MasteryInfo = { masteryScore: number; currentDifficulty: number; correctStreak: number };

type AttemptResult = {
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
};

const BADGE_INFO: Record<string, { name: string; icon: string }> = {
  "first-steps": { name: "First Steps", icon: "🌱" },
  "five-in-a-row": { name: "On a Roll", icon: "🔥" },
  "skill-master": { name: "Skill Master", icon: "🏅" },
  "champion-math": { name: "Math Champion", icon: "🧮" },
  "champion-reading": { name: "Reading Champion", icon: "📚" },
  "champion-science": { name: "Science Champion", icon: "🧪" },
};

type Phase = "loading" | "answering" | "submitting" | "feedback" | "no-questions" | "error";

export function PracticeClient({ skillId, skillName }: { skillId: string; skillName: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [question, setQuestion] = useState<Question | null>(null);
  const [mastery, setMastery] = useState<MasteryInfo | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const startTimeRef = useRef<number>(0);

  // Shared fetch logic used by both the initial mount load and manual
  // retries (button clicks). Kept separate from the mount effect below so
  // the effect body never calls setState synchronously before its first
  // await - it only reacts once the fetch settles.
  const fetchQuestion = useCallback(async (): Promise<void> => {
    const res = await fetch(`/api/practice/next?skillId=${encodeURIComponent(skillId)}`);
    if (res.status === 404) {
      setPhase("no-questions");
      return;
    }
    if (!res.ok) throw new Error("Failed to load question");
    const data = await res.json();
    setQuestion(data.question);
    setMastery(data.mastery);
    startTimeRef.current = Date.now();
    setPhase("answering");
  }, [skillId]);

  const fetchNext = useCallback(async () => {
    setPhase("loading");
    setAnswer("");
    try {
      await fetchQuestion();
    } catch {
      setErrorMsg("Something went wrong loading your next question.");
      setPhase("error");
    }
  }, [fetchQuestion]);

  useEffect(() => {
    let cancelled = false;

    async function loadOnMount() {
      const res = await fetch(`/api/practice/next?skillId=${encodeURIComponent(skillId)}`);
      if (cancelled) return;
      if (res.status === 404) {
        setPhase("no-questions");
        return;
      }
      if (!res.ok) throw new Error("Failed to load question");
      const data = await res.json();
      if (cancelled) return;
      setQuestion(data.question);
      setMastery(data.mastery);
      startTimeRef.current = Date.now();
      setPhase("answering");
    }

    loadOnMount().catch(() => {
      if (!cancelled) {
        setErrorMsg("Something went wrong loading your next question.");
        setPhase("error");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [skillId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question || !answer.trim()) return;
    setPhase("submitting");
    const responseTimeMs = Date.now() - startTimeRef.current;
    try {
      const res = await fetch("/api/practice/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, answer, responseTimeMs }),
      });
      if (!res.ok) throw new Error("Failed to submit answer");
      const data = await res.json();
      setResult(data.result);
      setNewBadges(data.newBadges ?? []);
      setPhase("feedback");
    } catch {
      setErrorMsg("Something went wrong submitting your answer.");
      setPhase("error");
    }
  }

  return (
    <div className="mx-auto max-w-2xl w-full px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">
            ← Back to dashboard
          </Link>
          <h1 className="text-xl font-bold text-white mt-1">{skillName}</h1>
        </div>
        {mastery && (
          <div className="text-right">
            <p className="text-sm text-slate-400">Mastery</p>
            <p className="text-lg font-semibold text-teal-400">{Math.round(mastery.masteryScore)}%</p>
          </div>
        )}
      </div>

      {phase === "loading" && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-slate-400">
          Loading your next question...
        </div>
      )}

      {phase === "error" && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-300">
          {errorMsg}
          <button onClick={fetchNext} className="block mx-auto mt-4 text-sm underline">
            Try again
          </button>
        </div>
      )}

      {phase === "no-questions" && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-slate-400">
          No questions are available for this skill yet. Check back soon.
        </div>
      )}

      {(phase === "answering" || phase === "submitting") && question && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            Difficulty {question.difficulty} / 5
          </p>
          <p className="text-lg font-medium text-white leading-relaxed">{question.prompt}</p>

          <div className="mt-6">
            {question.type === "MULTIPLE_CHOICE" && question.choices ? (
              <div className="grid gap-2">
                {question.choices.map((choice) => (
                  <button
                    type="button"
                    key={choice}
                    onClick={() => setAnswer(choice)}
                    className={`text-left rounded-lg border px-4 py-3 transition-colors ${
                      answer === choice
                        ? "border-teal-500 bg-teal-500/10 text-white"
                        : "border-white/15 text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            ) : (
              <input
                autoFocus
                type={question.type === "NUMERIC" ? "text" : "text"}
                inputMode={question.type === "NUMERIC" ? "decimal" : "text"}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={question.type === "NUMERIC" ? "Type your numeric answer" : "Type your answer"}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={!answer.trim() || phase === "submitting"}
            className="mt-6 w-full rounded-lg bg-gradient-to-br from-teal-500 to-violet-600 px-4 py-3 text-white font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {phase === "submitting" ? "Checking..." : "Submit answer"}
          </button>
        </form>
      )}

      {phase === "feedback" && result && (
        <div
          className={`rounded-2xl border p-6 sm:p-8 ${
            result.correct ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"
          }`}
        >
          <p className={`text-lg font-semibold ${result.correct ? "text-emerald-300" : "text-amber-300"}`}>
            {result.correct ? "Correct! ✅" : "Not quite ✗"}
          </p>
          <p className="mt-3 text-slate-200">{result.explanation}</p>
          {!result.correct && result.hint && (
            <p className="mt-2 text-sm text-slate-400">
              <span className="font-medium text-slate-300">Hint: </span>
              {result.hint}
            </p>
          )}

          <div className="mt-4 flex items-center gap-3 text-sm text-slate-400">
            <span>
              Mastery: {Math.round(result.masteryBefore)}% → {Math.round(result.masteryAfter)}%
            </span>
            {result.leveledUp && <span className="text-teal-400 font-medium">Level up ↑ Difficulty {result.newDifficulty}</span>}
            {result.leveledDown && <span className="text-slate-400">Easing difficulty ↓ {result.newDifficulty}</span>}
          </div>

          {result.newlyMastered && (
            <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-emerald-200 font-medium">
              🏆 Skill mastered! This unlocks anything that depends on it.
            </div>
          )}

          {newBadges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {newBadges.map((slug) => {
                const info = BADGE_INFO[slug];
                if (!info) return null;
                return (
                  <span key={slug} className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white">
                    {info.icon} New badge: {info.name}
                  </span>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={fetchNext}
              className="rounded-lg bg-gradient-to-br from-teal-500 to-violet-600 px-5 py-2.5 text-white font-semibold hover:opacity-90"
            >
              Next question
            </button>
            <Link href="/dashboard" className="rounded-lg border border-white/15 px-5 py-2.5 text-slate-200 hover:bg-white/5">
              Back to dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
