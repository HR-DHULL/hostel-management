# STATE: Hazeon HMS

## Current Status
- **Active Phase:** 2 (Hostel Module — ready to execute)
- **Last Action:** Phase 1 Foundation complete — build passes, all routes compile clean
- **Next Action:** Execute Phase 2 — Hostel Module

---

## Completed Phases

### Phase 1 — Foundation ✅
- Next.js 14.2.35 + TypeScript + Tailwind CSS
- Complete SQL schema: 17 tables, RLS policies, triggers (supabase/schema.sql)
- Supabase Auth client helpers (browser + server + types)
- Route protection middleware (role-based redirects)
- Admin layout: Sidebar + Topbar
- Login page (/login) — email + password with role-based redirect
- Student portal login (/portal/login)
- Dashboard skeleton with live stat cards (hostel/library/mess counts + fee summary)
- Design tokens: Hazeon HMS light theme fully configured
- Production build: ✓ passing

---

## In-Progress
_None._

---

## Key Decisions Made

| Decision | Choice | Reason |
|---|---|---|
| Auth system | Supabase Auth (JWT) | Original used plaintext passwords — critical security fix |
| Frontend | Next.js 14 App Router + TypeScript | Modern, Vercel-native, component isolation |
| Styling | Tailwind + shadcn/ui (customized) | Not template-looking; we control every token |
| Email | Resend | Simple, generous free tier, great DX |
| State/data | TanStack Query | Caching, pagination, background refetch |
| Payments | Manual only (no gateway) | v1 scope — owner confirmed cash/UPI manual entry |
| ID generation | Supabase UUID (gen_random_uuid()) | Replace collision-prone custom prefix+timestamp IDs |
| Deployment | Vercel + Supabase cloud | Zero-ops, owner confirmed |

---

## Known Risks

1. **Supabase anon key in original repo is PUBLIC** — must rotate before any real data is entered
2. **Original schema is missing ~8 tables** — Phase 1 writes the complete schema from scratch
3. **Email delivery** — Resend free tier: 100 emails/day, 3,000/month — fine for 50 students
4. **PDF generation** — react-pdf can be slow for complex layouts; evaluate @react-pdf/renderer vs puppeteer

---

## Environment Variables Required (Phase 1)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

---

## Notes from Source Analysis

- All business logic to port lives in `index.html` lines 1–1947
- Fee math is solid — port the calculation logic directly to TypeScript utilities
- `deleted_records` audit pattern is good — keep it
- WhatsApp deep-link: `https://wa.me/${phone}?text=${encodeURIComponent(template)}`
- Receipt print: recreate as a React component with `window.print()` + print-specific CSS
- ID card: initials-based avatar — keep this pattern, looks fine
