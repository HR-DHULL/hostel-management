# STACK: Hazeon HMS

## Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3 + shadcn/ui (Radix primitives)
- **Icons:** Lucide React
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod
- **Data fetching:** TanStack Query v5
- **PDF:** @react-pdf/renderer (receipts + ID cards)
- **CSV:** papaparse (import/export)

## Backend / Database
- **Database:** Supabase (PostgreSQL 15)
- **Auth:** Supabase Auth (email/password + JWT)
- **Storage:** Supabase Storage (institute logo)
- **Edge Functions:** Supabase Edge Functions (email trigger jobs)
- **ORM:** Supabase JS client v2 (typed with generated types)

## Email
- **Provider:** Resend
- **Templates:** React Email components

## Deployment
- **Frontend:** Vercel (Next.js native)
- **Backend:** Supabase cloud
- **Environment:** `.env.local` (never committed)

## Dev Tools
- **Linting:** ESLint (Next.js config)
- **Formatting:** Prettier
- **Types:** supabase gen types typescript

## Key Version Pins
```json
{
  "next": "14.x",
  "react": "18.x",
  "typescript": "5.x",
  "@supabase/supabase-js": "2.x",
  "@tanstack/react-query": "5.x",
  "tailwindcss": "3.x",
  "zod": "3.x",
  "react-hook-form": "7.x",
  "recharts": "2.x"
}
```
