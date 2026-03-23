# PLAN: Phase 1 — Foundation

## Goal
A running Next.js app, complete DB schema, working auth, and the dashboard shell.
**Done when:** Owner can log in at /login and see the dashboard skeleton. No credentials in code.

---

## Wave 1 — Independent (run in parallel)

### Task 01-01: Initialize Next.js 14 project
- Create package.json, tsconfig.json, next.config.ts, postcss.config.mjs
- Install: next, react, react-dom, typescript, @types/*, tailwindcss, autoprefixer
- Install: @supabase/supabase-js, @supabase/ssr, @tanstack/react-query
- Install: react-hook-form, @hookform/resolvers, zod
- Install: lucide-react, clsx, tailwind-merge, class-variance-authority
- Install: recharts, @react-pdf/renderer, papaparse, resend
- Create src/app/layout.tsx, src/app/globals.css, src/app/page.tsx

### Task 01-02: Complete SQL schema
- supabase/schema.sql — 17 tables with UUIDs, FK constraints, indexes
- Tables: profiles, app_settings, hostels, rooms, hostel_students, leaves,
         library_members, mess_members, mess_attendance,
         hostel_fees, library_fees, mess_fees, payment_log,
         complaints, expenses, deleted_records, broadcast_log
- RLS policies for every table (owner/staff/student)

---

## Wave 2 — Depends on Wave 1

### Task 01-03: Tailwind + shadcn/ui
- tailwind.config.ts with Hazeon design tokens (CSS vars)
- src/app/globals.css with :root CSS variables
- shadcn/ui init + add: button, input, label, badge, card, dialog,
  dropdown-menu, select, separator, sheet, skeleton, sonner, table, tabs, tooltip

### Task 01-04: Supabase client helpers
- src/lib/supabase/client.ts (browser)
- src/lib/supabase/server.ts (server, SSR)
- src/lib/supabase/middleware.ts (session refresh)
- .env.example (template)
- src/lib/utils.ts (cn helper)

---

## Wave 3 — Depends on Wave 2

### Task 01-05: Middleware
- src/middleware.ts — refresh session + role-based redirect
  - unauthenticated → /login
  - student role → /portal/* only
  - owner/staff → /dashboard and below

### Task 01-06: Admin layout
- src/app/(admin)/layout.tsx
- src/components/layout/Sidebar.tsx (nav items: Dashboard, Hostel, Library, Mess, Complaints, Expenses, Settings)
- src/components/layout/Topbar.tsx (page title, notification bell, user avatar + logout)

---

## Wave 4 — Depends on Wave 3

### Task 01-07: Login page
- src/app/(auth)/login/page.tsx — email + password form
- src/app/(auth)/layout.tsx — centered card layout
- Server Action: signIn → Supabase Auth → redirect by role

### Task 01-08: Dashboard skeleton
- src/app/(admin)/dashboard/page.tsx — 4 stat cards (0 values), empty chart placeholder
- src/components/dashboard/StatCard.tsx
- Update STATE.md — Phase 1 complete

---

## Verification Checklist
- [ ] `npm run dev` starts without errors
- [ ] `/login` renders email + password form
- [ ] Valid credentials → redirect to `/dashboard`
- [ ] Invalid credentials → error toast shown
- [ ] Unauthenticated → redirect to `/login`
- [ ] Dashboard shows 4 stat cards (even if showing 0)
- [ ] Sidebar navigation is visible and links don't 404
- [ ] No credentials in any source file
- [ ] `.env.example` documents all required vars
