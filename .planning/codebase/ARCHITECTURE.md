# ARCHITECTURE: Hazeon HMS

## Route Structure

```
app/
├── (auth)/
│   └── login/                    # Admin/staff login
├── (admin)/                      # Protected — owner + staff
│   ├── layout.tsx                # Sidebar + topbar shell
│   ├── dashboard/                # Home: stats + charts
│   ├── hostel/
│   │   ├── page.tsx              # Students list
│   │   ├── [id]/page.tsx         # Student profile
│   │   └── occupancy/page.tsx    # Room grid
│   ├── library/
│   │   ├── page.tsx              # Members list
│   │   └── [id]/page.tsx         # Member profile
│   ├── mess/
│   │   ├── page.tsx              # Members list
│   │   ├── [id]/page.tsx         # Member profile
│   │   └── attendance/page.tsx   # Daily attendance grid
│   ├── fees/
│   │   ├── hostel/page.tsx       # Hostel fee list
│   │   ├── library/page.tsx      # Library fee list
│   │   └── mess/page.tsx         # Mess fee list
│   ├── complaints/
│   │   ├── page.tsx              # All complaints
│   │   └── [id]/page.tsx         # Complaint detail
│   ├── expenses/page.tsx
│   └── settings/page.tsx
├── (portal)/                     # Protected — students only
│   ├── portal/login/             # Student login
│   ├── portal/dashboard/         # Student home
│   ├── portal/fees/page.tsx      # Fee history
│   └── portal/complaints/        # Raise + view complaints
└── api/
    ├── send-reminder/route.ts    # Manual fee reminder trigger
    └── webhooks/                 # Supabase webhook handlers
```

## Component Structure

```
components/
├── ui/                           # shadcn/ui primitives (auto-generated)
├── layout/
│   ├── Sidebar.tsx
│   ├── Topbar.tsx
│   └── Breadcrumb.tsx
├── shared/
│   ├── DataTable.tsx             # Reusable paginated table
│   ├── SearchFilter.tsx          # Search + filter bar
│   ├── StatusBadge.tsx           # Fee/complaint status pill
│   ├── ConfirmDialog.tsx         # Delete confirmation modal
│   └── EmptyState.tsx
├── hostel/
│   ├── StudentForm.tsx
│   ├── StudentRow.tsx
│   ├── OccupancyGrid.tsx
│   └── LeaveForm.tsx
├── fees/
│   ├── FeeTable.tsx              # Used by all 3 modules
│   ├── PaymentModal.tsx
│   ├── BulkPayModal.tsx
│   ├── AdvancePayModal.tsx
│   ├── FeeReceipt.tsx            # Printable receipt
│   └── IDCard.tsx                # Printable ID card
├── library/
│   └── MemberForm.tsx
├── mess/
│   ├── MemberForm.tsx
│   └── AttendanceGrid.tsx
├── portal/
│   ├── PortalFeeCard.tsx
│   └── ComplaintForm.tsx
└── dashboard/
    ├── StatCard.tsx
    ├── FeeChart.tsx
    └── NotificationBell.tsx
```

## Data Layer

```
lib/
├── supabase/
│   ├── client.ts                 # Browser client (anon key)
│   ├── server.ts                 # Server client (service role, server-only)
│   └── types.ts                  # Generated types from `supabase gen types`
├── queries/
│   ├── students.ts               # All hostel student queries
│   ├── library.ts
│   ├── mess.ts
│   ├── fees.ts                   # Shared fee logic
│   ├── complaints.ts
│   └── expenses.ts
├── actions/
│   ├── students.ts               # Server Actions (mutations)
│   ├── fees.ts
│   └── complaints.ts
├── email/
│   ├── resend.ts                 # Resend client
│   └── templates/
│       ├── FeeReminder.tsx
│       ├── FeeOverdue.tsx
│       └── ComplaintUpdate.tsx
└── utils/
    ├── fee-calculator.ts         # Fee math (ported from original)
    ├── date.ts                   # Date helpers
    ├── format.ts                 # Currency, phone formatting
    └── csv.ts                    # Import/export helpers
```

## Database Schema (17 Tables)

### Auth (managed by Supabase Auth)
- `auth.users` — Supabase managed

### App
- `profiles` — extends auth.users (role, display_name, is_active, linked_student_id)
- `app_settings` — single row (institute config)

### Hostel
- `hostels` — building registry
- `rooms` — room registry per building
- `hostel_students` — student records
- `leaves` — leave grants per student

### Library
- `library_members`

### Mess
- `mess_members`
- `mess_attendance` — daily attendance

### Fees (shared pattern across modules)
- `hostel_fees` — monthly fee records
- `library_fees`
- `mess_fees`
- `payment_log` — all payment transactions (cross-module)

### Operations
- `complaints` — support tickets
- `expenses` — expense entries
- `deleted_records` — audit log for soft deletes

---

## Auth Flow

```
Admin/Staff:
  /login → Supabase Auth signInWithPassword
         → JWT stored in httpOnly cookie (Next.js middleware)
         → middleware checks role in JWT → routes to (admin) layout

Student:
  /portal/login → same Supabase Auth
               → middleware checks role = 'student'
               → routes to (portal) layout
               → all DB queries filtered by linked_student_id
```

## RLS Policy Pattern

```sql
-- Staff/owner: full access to module tables
CREATE POLICY "staff_access" ON hostel_students
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('owner', 'staff')
  );

-- Student: read own record only
CREATE POLICY "student_read_own" ON hostel_students
  FOR SELECT USING (
    id = (
      SELECT linked_student_id FROM profiles
      WHERE id = auth.uid()
    )
  );
```
