# TestTaker Integration Report
### For placement in the TestTaker repository

**Date:** 2026-03-12
**From:** Focus Coding main site repo
**Purpose:** What needs to change in TestTaker to integrate smoothly with focus-coding.com

---

## 1. What You're Integrating Into

The focus-coding.com site runs on a single EC2 instance:

| Layer | Tech | Details |
|-------|------|---------|
| Reverse proxy | Caddy | HTTPS termination, routes `/api/*` → Express, `/*` → Next.js |
| Frontend | Next.js 16 + React 19 + Tailwind CSS 4 | Port 3000, App Router |
| Backend | Express 5 + TypeScript | Port 4000, Prisma ORM |
| Database | PostgreSQL 15 (Docker) | Site data only (testimonials, courses, contacts, FAQs) |
| CI/CD | GitHub Actions | SSH deploy on push to main |

**TestTaker will live inside the existing Next.js frontend as pages under `/tests/*`.** The Supabase database and auth remain external — the EC2's PostgreSQL is only for site-level data.

---

## 2. Changes Required in the TestTaker Codebase

### 2.1 Route Prefix: All Routes Must Live Under `/tests`

Your build plan (Phase 4) already mentions this: "all routes under `/tests` prefix, configurable base path." This is critical.

**Current TestTaker routes → Required routes:**

```
/                       → /tests                    (test browser)
/[testId]               → /tests/[testId]           (test detail)
/[testId]/take          → /tests/[testId]/take      (test-taking)
/[testId]/results       → /tests/[testId]/results   (results)
/[testId]/review        → /tests/[testId]/review    (review mode)
/dashboard              → /tests/dashboard           (student dashboard)
/history                → /tests/history             (attempt history)
/admin/*                → /tests/admin/*             (admin pages)
```

**Action:** Restructure your `app/` directory so that everything is under `app/tests/`. If you're using `next/link` or `next/navigation`, audit all internal links to use the `/tests` prefix.

### 2.2 Remove the Root Layout — Use a Route Group Layout Instead

The main site already has a root `layout.tsx` with:
- `<html>` and `<body>` tags
- Poppins / Inter / Fira Code fonts loaded via `next/font`
- `<Header />` and `<Footer />` components
- `<FloatingCTA />` button
- Dark mode support via Tailwind

**What to do:**
- Delete your root `layout.tsx` (the one with `<html>` and `<body>`)
- Create `app/tests/layout.tsx` that only wraps TestTaker-specific UI (sidebar nav, breadcrumbs, etc.)
- This layout will be nested inside the main site's root layout automatically

**Example:**
```tsx
// app/tests/layout.tsx
export default function TestsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <TestsSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

### 2.3 Design System Alignment

The main site uses these design tokens — TestTaker should match:

| Element | Main Site | What to Match |
|---------|-----------|---------------|
| Primary color | Teal (`#14b8a6` / `teal-400` to `teal-600`) | Use for primary buttons, links, accents |
| Accent color | Coral/Orange (`#f97316` / `orange-500`) | Use for CTAs, highlights |
| Heading font | Poppins (600/700 weight) | Already loaded in root layout |
| Body font | Inter (400/500 weight) | Already loaded in root layout |
| Code font | Fira Code | Already loaded in root layout |
| Tailwind version | **v4** | Ensure compatibility; v4 uses CSS-based config, not `tailwind.config.js` |
| Component style | Cards with subtle shadows, rounded-lg, clean spacing | See `frontend/components/ui/` |

**Action:** Audit your Tailwind config and component styles. If TestTaker was built with Tailwind v3, you'll need to migrate to v4 syntax (CSS-based `@theme` instead of `tailwind.config.ts`).

### 2.4 Supabase Client Setup

The main site will create shared Supabase client utilities at:
- `frontend/lib/supabase/client.ts` (browser)
- `frontend/lib/supabase/server.ts` (server components)
- `frontend/lib/supabase/middleware.ts` (route protection)

**Action:** Refactor TestTaker to import from these shared paths rather than its own Supabase setup. If you have a `lib/supabase.ts` or `utils/supabase/` in TestTaker, those imports will need to be updated during migration.

### 2.5 Auth Pages: Don't Bring Your Own

The main site will provide auth pages at:
- `/auth/sign-in`
- `/auth/sign-up`
- `/auth/callback`

**Action:** Remove TestTaker's auth pages. Replace any redirects to `/sign-in` or `/login` with redirects to `/auth/sign-in`. The auth middleware in the main site will handle protecting `/tests/*` routes.

### 2.6 Shared UI Components

The main site has these reusable components in `frontend/components/ui/`:
- `Button.tsx` (primary/secondary/outline variants)
- `Card.tsx` (container with optional hover)
- `Heading.tsx` (h1-h6 with consistent styling)
- `Input.tsx` (text input)
- `TextArea.tsx` (multi-line input)

**Action:** Where TestTaker has equivalent components, swap them for the shared ones during integration. Keep TestTaker-specific components (question editor, timer, test sidebar) in `frontend/components/tests/`.

### 2.7 Environment Variables

TestTaker needs these env vars. They'll be provided by the main site's Docker/deployment config:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...     # server-side only, for admin operations
```

**Action:** Make sure no env vars are hardcoded. Use `process.env` everywhere. Document any additional env vars TestTaker needs.

---

## 3. Administrator Considerations

### 3.1 Database Management

You'll be running **two databases**:

| Database | What It Stores | Where It Runs | Access Pattern |
|----------|---------------|---------------|----------------|
| PostgreSQL (Docker on EC2) | Testimonials, courses, contacts, FAQs | EC2 container | Express backend via Prisma |
| Supabase PostgreSQL (hosted) | Users/profiles, tests, questions, sections, attempts, answers, essay grades | Supabase cloud | Next.js via Supabase client + RLS |

**This is fine and actually beneficial:**
- Supabase handles auth, RLS, and real-time — things that would be complex to build yourself
- The local PostgreSQL keeps your Express backend learning experience intact
- They serve different purposes and don't need to talk to each other

**Backup strategy:**
- **Supabase:** Automatic daily backups on paid plans (Pro: $25/month). Free tier has no backups — consider upgrading before going live with student data.
- **EC2 PostgreSQL:** Currently relies on the Docker volume. Add a cron job to `pg_dump` daily to S3 or local storage. This is important — if the Docker volume is lost, your testimonials/site data are gone.

### 3.2 Cost/Pricing Breakdown

**Current monthly costs (estimated):**
| Service | Cost |
|---------|------|
| EC2 (t2/t3.micro) | ~$8-10/month |
| Domain (focus-coding.com) | ~$1/month (amortized) |
| **Current total** | **~$10/month** |

**After integration (estimated):**
| Service | Cost | Notes |
|---------|------|-------|
| EC2 (t3.small recommended) | ~$15/month | Upgrade for headroom with larger Next.js build |
| Supabase Free tier | $0 | 500 MB DB, 50K auth users, 500 MB storage — plenty for starting |
| Supabase Pro tier (optional) | $25/month | Daily backups, 8 GB DB, email support — recommended once students rely on it |
| Domain | ~$1/month | No change |
| **Total (free Supabase)** | **~$16/month** | |
| **Total (pro Supabase)** | **~$41/month** | Recommended once you have active students |

**When to upgrade Supabase from Free to Pro:**
- When you have real student data that can't be lost (backups)
- When you exceed 500 MB database storage
- When you need email sending beyond 2x/day (for verification, password reset)

**When to upgrade EC2:**
- If builds start failing due to OOM (out of memory) during `next build`
- If the site becomes sluggish under concurrent users
- You can also consider moving the frontend to **Vercel** (free tier) and keeping EC2 only for the Express backend — this would actually reduce EC2 load

### 3.3 Effectiveness as Online Tools

**TestTaker strengths for your tutoring business:**
- Timed practice tests are genuinely useful for GED/ACT prep students
- Admin essay grading gives you a workflow for subjective assessment
- Progress tracking helps you and parents see improvement over time
- Custom test assignment (per-student visibility) is a differentiator vs. generic test sites
- Having it on YOUR site (not Quizlet, Google Forms, etc.) builds your brand

**Things to watch out for:**
- **Mobile experience is critical.** Many students will access tests on phones. The test-taking UI (timer, question navigation, answer selection) must work flawlessly on mobile. Prioritize this in Phase 5.
- **Cheating prevention is limited.** This is a practice tool, not a proctored exam. Don't over-invest in anti-cheat. Students who cheat on practice tests only hurt themselves.
- **LLM grading for short answers** (mentioned in Phase 3) — start with exact match + a few accepted variants. LLM grading adds cost, latency, and unpredictability. Add it later only if manual grading becomes a bottleneck.
- **Data privacy:** You're storing student names, emails, and academic performance. Even without FERPA obligations (you're a private tutor, not a school), treat this data carefully. Don't share it, back it up, and have a basic privacy policy on the site.

### 3.4 Operational Recommendations

1. **Set up Supabase database backups before launching TestTaker to students.** Free tier has no backups. Either upgrade to Pro or write a script that uses `pg_dump` via the Supabase connection string on a schedule.

2. **Add basic monitoring.** At minimum:
   - Uptime check (e.g., free tier of UptimeRobot hitting `focus-coding.com/api/health`)
   - Docker container health checks (already in your compose file)
   - Supabase dashboard for auth and DB metrics

3. **Set up a staging environment** before doing the integration. You could:
   - Use a separate Supabase project for dev/staging
   - Run `docker compose` locally (you already do this)
   - Test the full flow before pushing to production

4. **Consider Vercel for the frontend long-term.** Your EC2 is doing double duty (frontend + backend). If the site grows, offloading Next.js to Vercel (free tier) means:
   - Faster builds (Vercel's build infra vs. your EC2)
   - Global CDN for static assets
   - EC2 only runs Express + PostgreSQL (much lighter)
   - But: requires Caddy config changes and split deployment

---

## 4. Pre-Integration Checklist (For TestTaker Repo)

Before starting the merge:

- [ ] All routes restructured under `/tests` prefix
- [ ] Root layout removed; replaced with route group layout
- [ ] Auth pages removed (will use main site's `/auth/*`)
- [ ] Supabase client imports use a configurable path (easy to remap)
- [ ] All internal links use `/tests/...` prefix
- [ ] Tailwind v4 compatibility verified
- [ ] No hardcoded env vars
- [ ] Components organized: shared UI vs. TestTaker-specific
- [ ] Color scheme updated to match teal/coral design system
- [ ] Mobile responsiveness verified for test-taking flow
- [ ] README updated with list of required env vars
