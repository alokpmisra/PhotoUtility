# Nimbus Learning

An adaptive, mastery-paced learning platform for Math, Reading & English, and
Science - built to take the best of two different models and combine them
into something better than either alone:

- **Kumon-style mastery gating**: skills are organized into prerequisite
  chains. A skill only unlocks once the ones before it are truly mastered,
  not just "completed."
- **Adaptive, real-time difficulty** (the way modern assessment platforms
  like Best Brains's diagnostics work, taken further): instead of a fixed
  worksheet or a periodic assessment, every single answer re-targets the
  next question's difficulty using an Elo-style rating engine.
- **Explainable feedback, not a black box**: every answer - right or wrong -
  comes back with a plain-language explanation, and misses get a scaffolded
  hint, so the feedback loop actually teaches instead of just grading.

It's a installable Progressive Web App (PWA) with student, parent, and tutor
accounts.

## How the adaptive mastery engine works

See [`src/lib/masteryEngine.ts`](src/lib/masteryEngine.ts) for the full
implementation. In short, per student per skill:

1. Each skill tracks a continuous **mastery score** (0-100) and a discrete
   **difficulty tier** (1-5) that decides which question is served next.
2. After each attempt, the mastery score updates with an Elo-style step:
   `masteryAfter = masteryBefore + K * (outcome - expectedScore)`, where
   `expectedScore` is a logistic function of the gap between the student's
   mastery and the question's difficulty rating. This means a correct
   answer on a hard question moves the score more than a correct answer on
   an easy one, and vice versa for misses.
3. The difficulty tier steps up after a couple of easy wins in a row (or
   immediately if a question turned out to be too easy for the student's
   current rating), and steps down immediately after a miss.
4. A skill is marked **mastered** - unlocking whatever depends on it - only
   after the student strings together three consecutive correct answers at
   the hardest tier *and* their overall mastery score clears 80. This
   mirrors Kumon's "prove it repeatedly, at the hardest level" gate while
   still reacting per-question like a modern adaptive system.

## Tech stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Prisma + SQLite** for data (swap the `DATABASE_URL` and provider in
  `prisma/schema.prisma` for Postgres/MySQL in production)
- **NextAuth v5** (Credentials provider, JWT sessions) for Student / Parent /
  Tutor accounts
- **Tailwind CSS v4**
- A hand-rolled service worker + manifest for PWA installability and an
  offline fallback page

## Getting started

```bash
npm install
cp .env.example .env        # then edit AUTH_SECRET (openssl rand -hex 32)
npx prisma migrate dev      # creates prisma/dev.db and applies the schema
npm run db:seed             # loads the Math / Reading / Science curriculum
npm run db:demo             # creates demo accounts with sample practice history
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo accounts

`npm run db:demo` creates:

| Role    | Email                          | Password    |
| ------- | ------------------------------- | ----------- |
| Student | student@demo.eduplatform.dev   | Demo1234!   |
| Parent  | parent@demo.eduplatform.dev    | Demo1234!   |

The demo student already has some practice history so the mastery dashboard
and parent view aren't empty on first login.

## Data model & content

- `prisma/schema.prisma` - Users/roles, Subject → Unit → Skill (with
  prerequisite links), Question, Attempt, SkillMastery, Badges.
- `prisma/seed.ts` - the curriculum: 3 subjects, 9 units, 18 skills spanning
  K-8, each with 5 questions (one per difficulty tier) including worked
  explanations and hints. Re-running the seed is idempotent and keeps
  question content in sync with this file.
- `prisma/demo-accounts.ts` - creates a demo parent + student and simulates
  a practice history using the real adaptive engine (not fake data), so the
  dashboard reflects genuine mastery state.

## App structure

- `/` - marketing landing page (redirects signed-in users to their dashboard)
- `/login`, `/register` - auth, with role selection (Student / Parent / Tutor)
- `/dashboard` - student view: streak, accuracy, badges, recommended focus
  skill, and the full subject → unit → skill mastery tree
- `/practice/[skillId]` - the adaptive practice session itself
- `/parent`, `/parent/[studentId]` - parent/tutor view: linked
  students, per-student stats, and a read-only mastery heatmap
- `src/lib/masteryEngine.ts` - the adaptive engine (question selection,
  mastery updates, skill unlocking)
- `src/lib/dashboard.ts` - aggregates subject/unit/skill state, streaks, and
  recommendations for both the student and parent views
- `src/lib/badges.ts` - lightweight engagement badges (first attempt, streaks,
  mastering a skill, mastering an entire subject)

## Scripts

- `npm run dev` / `npm run build` / `npm run start`
- `npm run lint`
- `npm run db:seed` - (re)load the curriculum
- `npm run db:demo` - create/refresh demo accounts
- `npx prisma studio` - browse the database
