# TestTaker

A practice-test web app for students preparing for standardized exams (GED, ACT, SAT, AP, and more). Built with Next.js, Supabase, and Tailwind CSS. Designed to be integrated into an existing Next.js site under the `/tests` route prefix.

## Features

- **Multiple test types** — GED (all 4 subjects), ACT, SAT, AP exams, and custom tests
- **Question formats** — Multiple choice, true/false, short answer, and essay
- **Timed tests** — Optional countdown timer per test
- **Instant feedback** — Auto-graded questions show results immediately after submission
- **Essay review** — Essay/long-form answers are flagged for manual grading by an admin
- **Student dashboard** — View past attempts, scores, and progress over time
- **Admin tools** — Create and edit tests, manage questions, review essay submissions
- **Auth & roles** — Student and admin roles via Supabase Auth with row-level security
- **Per-student test assignment** — Assign custom tests visible only to a specific student
- **Randomization** — Question and answer option order randomized per attempt

## Prerequisites

- Node.js 18+
- npm 9+
- Docker (for local Supabase)
- A Supabase project (or use local Supabase for development)

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment template and fill in your Supabase keys
cp .env.example .env.local

# Start local Supabase (requires Docker)
npx supabase start

# Run database migrations and seed data
npx supabase db reset

# Generate TypeScript types from the database schema
npx supabase gen types typescript --local > src/types/database.ts

# Start the dev server
npm run dev
```

Open [http://localhost:3333](http://localhost:3333).

## Project Structure

```
src/
  app/
    actions/           — Server Actions for DB mutations
    tests/             — All TestTaker routes (under /tests prefix)
      page.tsx         — Test browser (list available tests)
      dashboard/       — Student dashboard (stats, attempts, progress)
      [id]/            — Test detail, take, and review pages
      admin/           — Admin panel (test CRUD, grading)
        tests/         — Test management (create, edit, delete)
        grading/       — Essay grading queue
  components/
    tests/             — Student-facing components (test-taking UI, start button)
    admin/             — Admin components (sidebar, editors, graders)
  lib/
    supabase/          — Supabase client setup (browser, server, middleware)
    admin.ts           — Admin auth helper
  types/               — Shared TypeScript types and generated DB types
supabase/
  migrations/          — SQL migration files (schema source of truth)
  seed.sql             — GED practice test seed data
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous/public key |

## Integration

This app is designed to be merged into an existing Next.js site. All routes live under `/tests/*` so they can be dropped into a host app's `app/tests/` directory. See `TESTTAKER_INTEGRATION_REPORT.md` and `BUILD_PLAN.md` for details.

During integration:
- Delete `src/app/layout.tsx` (the host site provides the root layout)
- Remap Supabase client imports to the host site's shared utilities if applicable
- Auth pages are not included — the host site provides `/auth/sign-in` etc.

## License

MIT
