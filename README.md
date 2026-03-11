# TestTaker

A practice-test web app for students preparing for standardized exams (GED, ACT, SAT, AP, and more). Built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Multiple test types** — GED (all 4 subjects), ACT, SAT, AP exams, and custom tests
- **Question formats** — Multiple choice, true/false, short answer, and essay
- **Timed tests** — Optional countdown timer per test or per section
- **Instant feedback** — Auto-graded questions show results immediately after submission
- **Essay review** — Essay/long-form answers are flagged for manual grading by an admin
- **Student dashboard** — View past attempts, scores, and progress over time
- **Admin tools** — Create and edit tests, manage questions, review essay submissions
- **Auth & roles** — Student and admin roles via Supabase Auth with row-level security

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

# Run database migrations
npx supabase db reset

# Generate TypeScript types from the database schema
npx supabase gen types typescript --local > src/types/database.ts

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/           — Next.js App Router pages and layouts
    actions/     — Server Actions for DB mutations
    admin/       — Admin routes (test/question management)
    tests/       — Student-facing test routes
  components/    — Reusable UI components
    questions/   — Question-type renderers (MC, TF, short, essay)
  lib/
    supabase/    — Supabase client initialization
    grading/     — Auto-grading utilities per question type
  types/         — Shared TypeScript types and generated DB types
supabase/
  migrations/    — SQL migration files (schema source of truth)
  seed.sql       — Optional seed data for development
```

## License

MIT
