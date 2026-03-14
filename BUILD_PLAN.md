# Build Plan

## Phase 1 — Scaffolding & Auth ✅

1. Initialize Next.js project with TypeScript, Tailwind CSS, ESLint, Prettier
2. Set up Supabase project (local dev with Docker)
3. Create database schema (migrations for all core tables)
4. Configure Supabase Auth (email/password signup + login)
5. Build `profiles` table with `student` / `admin` roles, auto-created on signup via DB trigger
6. Create auth pages: sign-in, sign-up, sign-out
7. Add auth middleware to protect routes
8. Generate TypeScript types from DB schema

**Deliverable:** A running app where users can sign up, log in, and see a blank dashboard.

## Phase 2 — Admin: Test & Question Management ✅

1. Admin layout with sidebar navigation
2. **Test CRUD** — create, list, edit, delete tests (title, subject, time limit, public/private)
3. **Section management** — add/reorder/delete sections within a test
4. **Question editor** — form that supports all 4 question types:
   - Multiple choice (2-6 options, mark correct answer)
   - True/false (pre-filled options)
   - Short answer (list of accepted answers)
   - Essay (rubric/instructions field for manual grading)
5. Question randomization (per test session) within a section (up/down arrows for admin ordering, randomized for students)
6. Answer options randomized (per test session) for each question
7. Seed data: one GED practice test per subject (Math, Language Arts, Science, Social Studies)
8. Tests can optionally be assigned to only be visible to a specific user (custom tests for individual students)

**Deliverable:** Admin can create a complete test with mixed question types.

## Phase 3 — Student Test-Taking Experience ✅

1. **Test browser** — list available tests, filter by subject
2. **Test detail page** — description, number of questions, time limit, start button
3. **Test-taking UI:**
   - One question at a time with prev/next navigation
   - Question sidebar showing answered vs. unanswered
   - Countdown timer (if test has a time limit)
   - Answer persistence (save to Supabase on each answer, refresh-safe)
   - Submit confirmation modal
4. **Auto-grading** on submission for MC, TF, and short-answer questions
   - Note: may incorporate a lightweight LLM to grade short answer for semantic/connotative similarity to ground truth (future enhancement — start with exact match + accepted variants)
5. **Results page** — score, breakdown by section, time taken
6. **Review mode** — walk through each question, see correct answer vs. student's answer

**Deliverable:** A student can take a full timed practice test and see their score.

## Phase 4 — Dashboard, Progress & Remaining Features ✅

1. **Student dashboard** — recent attempts, scores, suggested retakes
2. **Attempt history** — list all past attempts for a test, compare scores
3. **Admin dashboard** — see all students, their attempts, and essay responses needing review
4. **Essay grading UI** — admin can read essay responses, assign scores, leave feedback
5. **Question & answer randomization** — shuffle question order within sections and MC/TF option order per attempt (stored on attempt so review shows same order)
6. **Per-user test assignment** — admin can assign a test to a specific student (DB: `assigned_to` column on tests, RLS policy update, admin UI for assignment)

**Deliverable:** Students can track progress; admin can grade essays; randomization and per-user tests work.

## Phase 5 — Integration Prep & Design Alignment

Per the integration report from the main site (focus-coding.com), TestTaker will be merged into the existing Next.js 16 frontend as pages under `/tests/*`. This phase prepares the codebase for that merge.

1. **Route restructuring** — move admin routes under `/tests/admin/*`, dashboard under `/tests/dashboard`, so every TestTaker route lives under `/tests`
2. **Remove root layout** — delete `app/layout.tsx` (the main site provides `<html>`, `<body>`, fonts, header/footer). Replace with `app/tests/layout.tsx` that only wraps TestTaker-specific UI
3. **Remove auth pages** — delete `app/auth/*` (the main site provides `/auth/sign-in`, `/auth/sign-up`, `/auth/callback`). Update all redirects to point to `/auth/sign-in`
4. **Supabase client imports** — keep `lib/supabase/client.ts` and `lib/supabase/server.ts` as thin wrappers so they can easily be remapped to the main site's shared utilities during merge
5. **Design system alignment** — update color scheme from blue to teal primary (`teal-500`/`teal-600`) and coral accent (`orange-500`). Match main site's card style (subtle shadows, rounded-lg)
6. **Mobile responsiveness pass** — test-taking UI must work on phones (timer, question nav, answer selection)
7. **No hardcoded env vars** — audit all `process.env` usage, document required vars

**Deliverable:** Codebase is ready to copy into the main site's `app/tests/` directory with minimal changes.

## Phase 6 — Deploy & Go Live

1. Set up hosted Supabase project (migrate schema + seed data)
2. Add Supabase env vars to EC2 deployment config
3. Copy TestTaker routes/components into main site repo under `app/tests/` and `components/tests/`
4. Remap Supabase client imports to main site's shared utilities
5. Update Caddy/routing if needed (all `/tests/*` routes already go to Next.js)
6. Smoke-test full flow on production: sign up → browse tests → take test → see results → admin grading
7. Loading states, error boundaries, empty states

**Deliverable:** TestTaker is live on focus-coding.com, integrated and working.

## Future Enhancements (Post-Launch)

- LLM-powered short answer grading (semantic similarity)
- More exam types (ACT, SAT, AP)
- Question bank with tagging and random test generation
- Analytics (time per question, common wrong answers, weak topic identification)
- Image/diagram support in questions
- Bulk question import (CSV/JSON)
- Student groups / class management
- Accessibility audit (keyboard navigation, screen readers, focus management)
- Print/export results (PDF or printable page)
