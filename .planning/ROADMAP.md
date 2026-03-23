# ROADMAP: Hazeon HMS

> 9 phases. Each phase ships something usable. No phase depends on a later one.

---

## Phase 1 — Foundation
**Goal:** A running Next.js app, complete DB schema, working auth, and the dashboard shell.
When this is done: Owner can log in and see a dashboard skeleton. Nothing breaks, nothing leaks.

### Deliverables
- Next.js 14 (App Router) + TypeScript + Tailwind CSS initialized
- shadcn/ui installed and theme configured to Hazeon HMS design tokens
- Supabase project connected (env vars, client helper)
- **Complete SQL schema** — all 17 tables, constraints, indexes
- **Supabase Auth** — email/password, role metadata in `user_metadata`
- **RLS policies** — owner/staff/student access rules on every table
- Admin layout: sidebar (Hostel / Library / Mess / Complaints / Expenses / Settings), topbar, breadcrumb
- Route protection middleware (redirect unauthenticated → /login)
- Login page (owner + staff)
- Basic dashboard page (empty stat cards — wired to 0 for now)
- `.env.local` setup, no credentials in source

### Requirements Covered
R1 (auth), R2 (DB/security)

---

## Phase 2 — Hostel Module
**Goal:** Staff can fully manage hostel students and rooms.
When this is done: Every student CRUD operation works, occupancy grid is live.

### Deliverables
- Students list page: table with search, filter (status / course / building), pagination
- Add student form (full fields, validation)
- Edit student drawer / modal
- Student profile page (details + tabs for fees, leave, complaints)
- Soft-exit student (exit date recorded, status → exited)
- Soft delete → `deleted_records` audit log
- Building management (add/rename buildings from settings — used in student form)
- Room occupancy grid page: visual grid, colour-coded (occupied/vacant/on-leave)
- Leave management: grant leave, end leave, leave history per student

### Requirements Covered
R3 (hostel)

---

## Phase 3 — Fee Management
**Goal:** Staff can generate, collect, and receipt fees for all three modules.
When this is done: Monthly fees flow end-to-end — generate → collect → receipt.

### Deliverables
- Fee list page (per module: hostel / library / mess) with month navigator
- Auto-generate monthly fees for active members (on page visit if not yet generated)
- Fee status computation: pending → partial → paid / overdue
- Record payment modal (amount, mode, notes, date)
- Partial payment — balance recalculated and saved
- Advance payment (N future months)
- Bulk mark-paid with checkbox selection
- Discount support (read from student record, applied to net payable)
- Printable receipt (new tab, clean layout, institute branding)
- ID card generator (printable, avatar initials)
- WhatsApp reminder deep-link (configurable template from settings)
- Overdue detection query (status updates when due date is past)

### Requirements Covered
R4 (fee management)

---

## Phase 4 — Library Module
**Goal:** Library member management is fully operational.
When this is done: Library mirrors hostel in functionality with seat tracking.

### Deliverables
- Library members list (search, filter, pagination)
- Add / edit / exit / delete member
- Seat number field + seat map overview
- One-click "link from hostel" — pre-fill form from existing hostel student
- All fee management wired (uses Phase 3 components — just different table)
- Receipt + ID card (same components, library branding)

### Requirements Covered
R5 (library)

---

## Phase 5 — Mess Module
**Goal:** Mess attendance and fees are operational.
When this is done: Daily attendance can be marked and fees managed.

### Deliverables
- Mess members list (search, filter, pagination)
- Add / edit / exit / delete member
- Meal plan selector (veg / non-veg / custom with price)
- Link from hostel student
- Daily attendance page: calendar grid for current month, mark present/absent per member
- Attendance summary (days present / days this month / attendance %)
- All fee management wired (Phase 3 components)

### Requirements Covered
R6 (mess)

---

## Phase 6 — Student Portal
**Goal:** Students can log in and self-serve.
When this is done: Any student can view their status, fees, download receipts, and raise complaints.

### Deliverables
- Separate portal route `/portal` with its own layout (no sidebar admin nav)
- Student login page (`/portal/login`)
- Portal dashboard: profile card + quick stats (balance due, open complaints)
- Fee history page: tabs for hostel / library / mess, status per month
- Receipt download: generate PDF on-demand for any paid month
- Raise complaint form (subject, description, priority selection)
- My complaints page: list with status + staff notes timeline

### Requirements Covered
R7 (student portal)

---

## Phase 7 — Complaints & Expense Tracker
**Goal:** Management has a full ops view of complaints and spending.
When this is done: Complaints are tracked to resolution, expenses are categorised monthly.

### Deliverables
- Complaints list (admin): all complaints, filter by status/priority, search by student name
- Complaint detail page: student info, full description, status update form, resolution notes
- Email notification to student on status change (Resend)
- Expense tracker: add / edit / delete entries
- Expense list: filter by month, group by category
- Month summary: total per category + grand total

### Requirements Covered
R8 (complaints), R9 (expenses), partial R10 (email)

---

## Phase 8 — Dashboard, Notifications & Email
**Goal:** The home screen tells you everything at a glance. Reminders run automatically.
When this is done: Dashboard is meaningful, notification bell works, fee emails fire.

### Deliverables
- Dashboard stat cards (wired to real data): active members, monthly collected, outstanding
- Fee collection bar chart: 6-month trend (recharts)
- Per-module fee summary table
- Occupancy quick stat
- Notification bell: overdue fees, dues within N days, open complaints — fetched on load
- Fee due reminder email job: Supabase Edge Function or pg_cron — triggers N days before due date
- Overdue email: fires when fee status flips to overdue
- Manual reminder button from fee list (triggers immediate email via Resend)
- Broadcast / announcement logger (log message to DB + optional email to all active members)

### Requirements Covered
R10 (email), R11 (dashboard)

---

## Phase 9 — Settings, CSV Import/Export & Production Polish
**Goal:** The product is fully self-configurable, data can be imported/exported, and it's production-ready.
When this is done: An institute can onboard themselves, import existing data, and run without issues.

### Deliverables
- Settings page: institute name, admin email, reminder days, WhatsApp template, hostel buildings
- User management: add staff (sends invite email via Supabase Auth), deactivate staff
- CSV import wizard: hostel students (step 1: upload → step 2: map columns → step 3: preview → import)
- CSV import wizard: library members
- CSV import wizard: mess members
- Export: monthly fee report (CSV download)
- Export: student list (CSV download)
- Global error boundary + 404 / 500 pages
- Loading skeletons on all data tables
- Toast notifications on all mutations (success + error)
- Supabase env vars documented in README
- Production deployment checklist (rotate Supabase keys, set CORS, enable email templates)

### Requirements Covered
R12 (settings), R13 (data ops), Non-functional requirements

---

## Milestone Map

```
Phase 1  ──► Foundation (DB + Auth + Shell)
Phase 2  ──► Hostel Students & Rooms
Phase 3  ──► Fee Management (all modules share this)
Phase 4  ──► Library Module
Phase 5  ──► Mess Module
Phase 6  ──► Student Portal
Phase 7  ──► Complaints + Expenses
Phase 8  ──► Dashboard + Email Notifications
Phase 9  ──► Settings + Import/Export + Polish
                        │
                        ▼
              🚀 Production Deploy
```

## Dependencies

- Phase 3 depends on Phase 2 (needs hostel students to exist)
- Phase 4 depends on Phase 3 (reuses fee components)
- Phase 5 depends on Phase 3 (reuses fee components)
- Phase 6 depends on Phase 2-5 (reads all module data)
- Phase 7 depends on Phase 6 (complaints raised by students)
- Phase 8 depends on Phase 3 (needs fee data for charts)
- Phase 9 depends on all (settings config + import validates against schema)
