import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

const SUBJECTS = [
  { name: "Math", icon: "🔢", blurb: "Arithmetic to pre-algebra, one mastery-gated skill at a time.", color: "from-blue-500/20 to-blue-500/5" },
  { name: "Reading & English", icon: "📖", blurb: "Phonics through inference and figurative language.", color: "from-violet-500/20 to-violet-500/5" },
  { name: "Science", icon: "🔬", blurb: "Life science through scientific reasoning and forces.", color: "from-teal-500/20 to-teal-500/5" },
];

const DIFFERENTIATORS = [
  {
    title: "Mastery-gated, not just paced",
    body: "Like a Kumon-style worksheet track, skills unlock only after a student proves mastery - not just after completing a lesson.",
  },
  {
    title: "Difficulty adapts every question",
    body: "An Elo-style rating engine re-targets difficulty after every single answer, instead of waiting for a weekly assessment to notice a student is bored or stuck.",
  },
  {
    title: "Explainable, not a black box",
    body: "Every answer comes with a plain-language explanation and a hint on misses, so students learn from the feedback loop, not just a checkmark or an X.",
  },
];

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "STUDENT" ? "/dashboard" : "/parent");
  }

  return (
    <div className="flex-1">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-500/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl px-6 py-24 sm:py-32 text-center">
          <p className="text-sm font-semibold text-teal-400 tracking-wide uppercase mb-4">
            Adaptive mastery learning
          </p>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white">
            Learning that moves at exactly your child&apos;s pace
          </h1>
          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
            Nimbus Learning combines the structured, mastery-gated progression of the best worksheet
            programs with a real-time adaptive engine - so every question is calibrated to challenge,
            not frustrate or bore.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-gradient-to-br from-teal-500 to-violet-600 px-6 py-3 text-white font-semibold hover:opacity-90"
            >
              Start learning free
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-white/15 px-6 py-3 text-slate-200 font-semibold hover:bg-white/5"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Three subjects, one mastery path</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {SUBJECTS.map((s) => (
            <div key={s.name} className={`rounded-2xl border border-white/10 bg-gradient-to-b ${s.color} p-6`}>
              <div className="text-3xl mb-3">{s.icon}</div>
              <h3 className="font-semibold text-white text-lg">{s.name}</h3>
              <p className="mt-2 text-sm text-slate-400">{s.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">
          The best of structured mastery and adaptive intelligence
        </h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {DIFFERENTIATORS.map((d) => (
            <div key={d.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="font-semibold text-white">{d.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{d.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 sm:p-12 text-center">
          <h2 className="text-2xl font-bold text-white">For parents and tutors</h2>
          <p className="mt-3 text-slate-400 max-w-xl mx-auto">
            See exactly which sub-skill a student is stuck on, not just a letter grade - with a
            mastery heatmap and recommended focus area updated after every session.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-block rounded-lg bg-gradient-to-br from-teal-500 to-violet-600 px-6 py-3 text-white font-semibold hover:opacity-90"
          >
            Create a parent or tutor account
          </Link>
        </div>
      </section>
    </div>
  );
}
