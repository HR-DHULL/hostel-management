# CONCERNS: Hazeon HMS

## Critical (Must Fix Before Any Real Data)

### 1. Rotate the Supabase Credentials
The original repo's Supabase URL and anon key are publicly visible on GitHub.
**Action:** Create a fresh Supabase project for HMS. Never reuse the old project's credentials.

### 2. Auth System Rewrite
Original: custom `app_users` table, plaintext password compared in JavaScript.
**Action:** Use Supabase Auth entirely. No custom password storage.

### 3. RLS Must Be Written Per Role
Original: `using (true)` on every table = anyone with the anon key owns the database.
**Action:** Every table gets specific RLS policies. Students can only read their own rows.

---

## High Priority

### 4. Complete Database Schema
Original schema file is missing ~8 of ~17 tables. A fresh install breaks silently.
**Action:** Phase 1 writes a single authoritative `schema.sql` that is the source of truth.

### 5. UUID Primary Keys
Original uses `prefix + Date.now() + 4-digit-random`. Collision-prone, non-standard.
**Action:** All tables use `gen_random_uuid()` as default PK.

### 6. No Silent Failures
Original: most `await` calls have no `try/catch`. Failed inserts are swallowed.
**Action:** All mutations wrapped in try/catch, errors surface via toast notifications.

### 7. Pagination
Original: `loadData()` fetches ALL rows on every tab switch.
**Action:** All list queries use Supabase `.range(from, to)` with 25 rows/page default.

---

## Medium Priority

### 8. Input Validation
No server-side validation in the original — only HTML `required` attributes.
**Action:** Zod schemas for every form. Validate in React Hook Form + Server Actions.

### 9. XSS Protection
No sanitization of user inputs before rendering.
**Action:** React's JSX escaping handles most cases. Don't use `dangerouslySetInnerHTML`.

### 10. Fee Auto-Generation Side Effect
Original runs fee generation as a side effect inside `loadData()` — runs on every page visit.
**Action:** Move to an explicit "Generate fees for month" action, or a Supabase Edge Function with a scheduled trigger.

### 11. hostel_names in JSON String
Original stores hostel building names as a JSON string inside a text column.
**Action:** Separate `hostels` table with proper rows.

---

## Known Limitations (Accepted for v1)

- No online payment gateway (manual cash/UPI only)
- No SMS notifications (email only)
- No mobile app (responsive web)
- No multi-tenant isolation
- Resend free tier: 100 emails/day — fine for 50 students
- No biometric/RFID attendance
