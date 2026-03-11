# Build Plan

## Phase 1 — Scaffolding & Auth (Day 1-2)

1. Initialize Next.js project with TypeScript, Tailwind CSS, ESLint, Prettier
2. Set up Supabase project (local dev with Docker)
3. Create database schema (migrations for all core tables)
4. Configure Supabase Auth (email/password signup + login)
5. Build `profiles` table with `student` / `admin` roles, auto-created on signup via DB trigger
6. Create auth pages: sign-in, sign-up, sign-out
7. Add auth middleware to protect routes
8. Generate TypeScript types from DB schema

**Deliverable:** A running app where users can sign up, log in, and see a blank dashboard.

## Phase 2 — Admin: Test & Question Management (Day 3-5)

1. Admin layout with sidebar navigation
2. **Test CRUD** — create, list, edit, delete tests (title, subject, time limit, public/private)
3. **Section management** — add/reorder/delete sections within a test
4. **Question editor** — form that supports all 4 question types:
   - Multiple choice (2-6 options, mark correct answer)
   - True/false (pre-filled options)
   - Short answer (list of accepted answers)
   - Essay (rubric/instructions field for manual grading)
5. Question reordering within a section (drag-and-drop or up/down arrows)
6. Seed data: at least one full GED practice test per subject for immediate student use

**Deliverable:** Admin can create a complete test with mixed question types.

## Phase 3 — Student Test-Taking Experience (Day 6-9)

1. **Test browser** — list available tests, filter by subject/exam type
2. **Test detail page** — description, number of questions, time limit, start button
3. **Test-taking UI:**
   - One question at a time with prev/next navigation
   - Question sidebar/progress bar showing answered vs. unanswered
   - Countdown timer (if test has a time limit)
   - Answer persistence (save to Supabase as student answers, so refreshing doesn't lose progress)
   - Submit confirmation modal
4. **Auto-grading** on submission for MC, TF, and short-answer questions
5. **Results page** — score, breakdown by section, time taken
6. **Review mode** — walk through each question, see correct answer vs. student's answer

**Deliverable:** A student can take a full timed practice test and see their score.

## Phase 4 — Dashboard & Progress Tracking (Day 10-11)

1. **Student dashboard** — recent attempts, scores, suggested retakes
2. **Attempt history** — list all past attempts for a test, compare scores
3. **Admin dashboard** — see all students, their attempts, and essay responses needing review
4. **Essay grading UI** — admin can read essay responses, assign scores, leave feedback

**Deliverable:** Students can track progress; admin can review and grade essays.

## Phase 5 — Polish & GED Content (Day 12-14)

1. Responsive design pass (mobile-friendly test-taking)
2. Accessibility audit (keyboard navigation, screen readers, focus management)
3. Loading states, error boundaries, empty states
4. Populate full GED practice tests for all 4 subjects:
   - Mathematical Reasoning
   - Reasoning Through Language Arts
   - Science
   - Social Studies
5. Basic print/export of results (PDF or printable page)

**Deliverable:** App is ready for the first GED student to use.

## Phase 6 — Future Enhancements (Post-Launch)

- Integration into existing website (shared auth, navigation, theming)
- More exam types (ACT, SAT, AP)
- Question bank with tagging and random test generation
- Analytics (time per question, common wrong answers, weak topic identification)
- Image/diagram support in questions
- Bulk question import (CSV/JSON)
- Student groups / class management
