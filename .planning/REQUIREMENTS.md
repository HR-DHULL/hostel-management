# REQUIREMENTS: Hazeon HMS

> Goal-backward: What must be TRUE for this product to be complete?

---

## R1 — Authentication & Roles

- [ ] Owner can log in with email + password (Supabase Auth)
- [ ] Staff manager can log in with email + password
- [ ] Student can log in with email + password (separate portal route)
- [ ] Sessions persist across page refreshes (JWT in httpOnly cookie)
- [ ] Owner can create / deactivate staff accounts
- [ ] Owner can create student login credentials (linked to student record)
- [ ] Role-based access: staff cannot access settings or user management
- [ ] Student can only access their own data (enforced at DB level via RLS)
- [ ] Unauthenticated users are redirected to login
- [ ] Passwords are never stored in plaintext (Supabase Auth handles hashing)

---

## R2 — Database & Security

- [ ] Complete PostgreSQL schema — all 17 tables exist with proper constraints
- [ ] Every table has RLS enabled with appropriate policies per role
- [ ] UUIDs used as primary keys (not custom prefix+timestamp IDs)
- [ ] Soft deletes via `deleted_at` timestamp (not hard deletes for audit)
- [ ] `deleted_records` audit log preserved from original
- [ ] No credentials hardcoded in source code (env vars only)
- [ ] Supabase anon key scoped to read-only non-sensitive data only

---

## R3 — Hostel Module

### Students
- [ ] Add student (name, phone, email, DOB, course, room, joining date, monthly fee, fee day)
- [ ] Edit student details
- [ ] Mark student as exited (soft exit with exit date)
- [ ] Delete student (soft delete to audit log)
- [ ] Search students by name / phone / room
- [ ] Filter by status (active / exited), course, building
- [ ] View student profile page (full details + fee history)

### Rooms & Occupancy
- [ ] Room grid view — colour coded: occupied / vacant / on-leave
- [ ] Multiple hostel buildings supported
- [ ] Each room shows current occupant name on hover

### Leave Tracker
- [ ] Grant leave (from date, to date, reason)
- [ ] End leave early
- [ ] Leave history per student
- [ ] Room shows "on leave" status in occupancy grid

---

## R4 — Fee Management (Hostel + Library + Mess)

- [ ] Monthly fees auto-generated for active members on month start (or on first visit to that month)
- [ ] Per-fee record: due date, total amount, discount, net payable, amount paid, balance, status
- [ ] Fee statuses: pending / partial / paid / overdue
- [ ] Record payment (amount, mode: cash/UPI/cheque/other, notes, date)
- [ ] Partial payment supported — balance carries forward
- [ ] Advance payment for N future months
- [ ] Bulk mark-all-paid for the current month
- [ ] Discount applied per student (stored on student record)
- [ ] Fee overdue computed: if unpaid past due date → overdue
- [ ] Month navigator (prev / next month)
- [ ] Printable receipt (opens in new tab, clean print layout)
- [ ] ID card generation (printable)
- [ ] WhatsApp reminder deep-link with configurable message

---

## R5 — Library Module

- [ ] Add / edit / exit / delete library member
- [ ] Seat number assignment
- [ ] Link to hostel student (one-click copy from hostel record)
- [ ] All fee management features (same as hostel)
- [ ] Receipt + ID card

---

## R6 — Mess Module

- [ ] Add / edit / exit / delete mess member
- [ ] Meal plan selection: veg / non-veg / custom
- [ ] Custom meal plan price override
- [ ] Link to hostel student
- [ ] Daily attendance marking (present / absent per date)
- [ ] Attendance view: calendar grid for the month
- [ ] All fee management features

---

## R7 — Student Portal

- [ ] Student logs in and sees own dashboard only
- [ ] Own profile (name, room, course, joining date)
- [ ] Hostel fee history (all months, status per month)
- [ ] Library fee history (if enrolled)
- [ ] Mess fee history (if enrolled)
- [ ] Download receipt for any paid month (PDF)
- [ ] Raise a complaint (subject, description, priority)
- [ ] View own complaint history + status updates

---

## R8 — Complaints & Tickets

- [ ] Students can raise complaints (from portal)
- [ ] Staff / admin can see all complaints in a list
- [ ] Filter by status (open / in-progress / resolved), priority (low/medium/high/urgent)
- [ ] Update complaint status + add resolution note
- [ ] Student gets email notification on status change
- [ ] Complaint linked to student record

---

## R9 — Expense Tracker

- [ ] Add expense (description, amount, category, date)
- [ ] Categories: maintenance, utilities, staff, food, misc, other
- [ ] Month-based view with total per category
- [ ] Edit / delete expense entries

---

## R10 — Email Notifications

- [ ] Fee due reminder email: sent N days before due date (configurable in settings)
- [ ] Overdue fee email: sent when fee status flips to overdue
- [ ] Complaint status update email: sent to student when staff updates ticket
- [ ] Emails sent via Resend API
- [ ] Email template: clean, branded (Hazeon HMS)
- [ ] Admin can trigger manual fee reminder from fee list

---

## R11 — Dashboard & Analytics

- [ ] Stat cards: active hostel / library / mess members, total collected this month, total outstanding
- [ ] Fee collection chart: last 6 months bar chart (collected vs outstanding)
- [ ] Per-module fee summary table (paid / partial / pending / overdue counts)
- [ ] Occupancy quick-view: filled rooms / total rooms
- [ ] Notification bell: overdue fees, dues within N days, open complaints
- [ ] Recent activity feed (last 10 payments received)

---

## R12 — Settings & Configuration

- [ ] Institute name + logo
- [ ] Admin email
- [ ] Fee reminder lead days (e.g., 3 days before due)
- [ ] WhatsApp message template (editable)
- [ ] Hostel building names (add / rename / remove)
- [ ] User management: add staff (email + role), deactivate staff

---

## R13 — Data Operations

- [ ] CSV import: hostel students (column mapping wizard)
- [ ] CSV import: library members
- [ ] CSV import: mess members
- [ ] Export: monthly fee report (CSV)
- [ ] Export: student list (CSV)

---

## Non-Functional Requirements

- [ ] Page load < 2s on standard broadband (India)
- [ ] All tables paginated (25 rows per page default) — no full-table loads
- [ ] Mobile-responsive layout (usable on phone, optimised for desktop)
- [ ] All async operations have loading states + error toasts
- [ ] No silent failures — every Supabase error surfaces to the user
- [ ] Environment variables via `.env.local` — nothing hardcoded
