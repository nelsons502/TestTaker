# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TestTaker is a Next.js web app for online test practice (GED, ACT, SAT, AP exams, etc.). It is built for a tutoring business where students with active accounts can take practice tests, review results, and track progress. The app will eventually be embedded into an existing Next.js website ecosystem as a companion app.

## Tech Stack

- **Framework:** Next.js (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Backend/Auth/DB:** Supabase (Postgres, Row-Level Security, Auth)
- **State:** React context + Supabase realtime where needed
- **Testing:** Vitest + React Testing Library
- **Linting:** ESLint (Next.js config) + Prettier

## Common Commands

```bash
npm run dev          # Start dev server (localhost:3333)
npm run build        # Production build
npm run lint         # ESLint
npm run format       # Prettier
npm run test         # Run all tests with Vitest
npm run test -- --run src/path/to/file.test.ts  # Single test file
npx supabase start   # Local Supabase (Docker required)
npx supabase db reset # Reset local DB and re-run migrations
npx supabase migration new <name>  # Create a new migration
```

## Architecture

### Data Model (Supabase/Postgres)

- **tests** — metadata for a test (title, subject, time_limit, is_public)
- **sections** — ordered sections within a test
- **questions** — belongs to a section; types: `multiple_choice`, `true_false`, `short_answer`, `essay`
- **answer_options** — choices for MC/TF questions
- **attempts** — a student's attempt at a test (start_time, end_time, score)
- **responses** — individual answers within an attempt
- **profiles** — extends Supabase Auth user with role (`student` | `admin`)

Row-Level Security: students see only their own attempts/responses; admins can CRUD tests/questions.

### Key App Routes (App Router)

```
/                    — landing / dashboard
/tests               — browse available tests
/tests/[id]          — test detail & start
/tests/[id]/take     — active test-taking UI (timer, question nav, answer input)
/tests/[id]/review   — post-attempt review with correct answers
/admin/tests         — admin: list/create/edit tests
/admin/tests/[id]    — admin: edit questions for a test
```

### Question Format Handling

Each question type has a dedicated renderer component and a dedicated grader utility:
- `MultipleChoice` / `TrueFalse` — auto-graded
- `ShortAnswer` — auto-graded against accepted answers list (case-insensitive, trimmed)
- `Essay` — manually graded by admin; flagged for review after submission

### Integration Notes

- The app is designed as a standalone Next.js app now, but will be merged into an existing Next.js site later. Keep routes under a `/tests` prefix to make future namespacing easy.
- Supabase client is initialized once in `src/lib/supabase/client.ts` (browser) and `src/lib/supabase/server.ts` (server components/actions).
- All DB mutations go through Server Actions in `src/app/actions/`.

## Conventions

- Use Server Components by default; add `'use client'` only when interactivity is needed.
- Colocate component-specific types in the same file; shared types go in `src/types/`.
- Database types are auto-generated: `npx supabase gen types typescript --local > src/types/database.ts`.
- Migrations live in `supabase/migrations/` and are the source of truth for the schema.
