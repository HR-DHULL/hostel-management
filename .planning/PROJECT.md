# PROJECT: Hazeon HMS
**Hostel · Library · Mess Management Dashboard**

---

## Vision

A professional, production-grade management dashboard for a single hostel institute.
Replaces a fragile single-file prototype with a secure, modular, maintainable Next.js application backed by Supabase.

The product must feel like a serious internal tool — not a template, not an AI-generated UI.
Clean, purposeful, fast.

---

## What We're Building

A multi-role web application with three user types:

| Role | What They Do |
|---|---|
| **Owner / Admin** | Full access to all modules, settings, user management |
| **Staff Manager** | Operate day-to-day (hostel/library/mess CRUD, fees, attendance) |
| **Student** | Read-only portal — view own fees, download receipts, raise complaints |

Three management modules:
- **Hostel** — student records, room/leave management, fee collection
- **Library** — member records, seat assignments, monthly fees
- **Mess** — meal plans, daily attendance, monthly fees

Plus cross-cutting concerns:
- Unified fee management (generate → collect → receipt)
- Complaints tracker (students raise → staff resolve)
- Expense tracker
- Email notifications (fee reminders, complaint updates)
- Settings & configuration

---

## Source Reference

Original prototype: https://github.com/HR-DHULL/hostel-lib-final
Key reference: Single `index.html` (1947 lines), Supabase backend, fully functional business logic to port and improve.

---

## Design Principles

- **Light theme only**
- **Professional minimalistic** — no gradients, no shadows everywhere, no card-spam
- **Purposeful whitespace** — breathe, don't crowd
- **Color palette**: Slate neutrals + Blue primary + single status colors

### Design Tokens

```
Background:       #FFFFFF
Surface:          #F8FAFC  (slate-50)
Border:           #E2E8F0  (slate-200)
Text Primary:     #0F172A  (slate-900)
Text Secondary:   #64748B  (slate-500)
Text Muted:       #94A3B8  (slate-400)

Primary:          #2563EB  (blue-600)
Primary Hover:    #1D4ED8  (blue-700)
Primary Subtle:   #EFF6FF  (blue-50)

Success:          #059669  (emerald-600)
Warning:          #D97706  (amber-600)
Danger:           #DC2626  (red-600)
```

Font: Inter (system fallback: -apple-system, sans-serif)

---

## Scale

- Hostel: ~50 students
- Library: ~50 members
- Mess: ~50 members
- Users (staff): < 10

---

## Tech Decisions

| Concern | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR, file-based routing, easy Vercel deploy |
| Language | TypeScript | Type safety, autocomplete, maintainability |
| Styling | Tailwind CSS + shadcn/ui | Utility-first, unstyled primitives we control |
| Database | Supabase (PostgreSQL) | Existing familiarity, PostgREST, realtime |
| Auth | Supabase Auth (JWT) | Replaces the broken custom plaintext system |
| Email | Resend | Simple API, generous free tier |
| PDF | react-pdf or @react-pdf/renderer | Fee receipts, ID cards |
| State | TanStack Query (React Query) | Server state, caching, pagination |
| Deployment | Vercel (frontend) + Supabase (backend) | Fully managed, zero-ops |

---

## Out of Scope (v1)

- Online fee payment (Razorpay) — manual cash/UPI recording only
- Mobile app (PWA-ready but not native)
- Multi-tenant / multi-institute
- Biometric attendance
- SMS notifications (email only)
