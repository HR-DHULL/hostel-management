-- ============================================================
--  MULTI-BRANCH MANAGEMENT SYSTEM v2
--  Run this AFTER your existing schema_v1 is already in place
--  (It uses IF NOT EXISTS so safe to re-run)
-- ============================================================

-- ── BRANCHES ─────────────────────────────────────────────────
create table if not exists branches (
  id text primary key,
  name text not null,
  type text default 'sub',       -- 'main' or 'sub'
  city text,
  address text,
  phone text,
  created_at timestamp default now()
);

insert into branches (id, name, type, city) values
  ('branch_cd',  'Charkhi Dadri', 'main', 'Charkhi Dadri'),
  ('branch_roh', 'Rohtak',        'sub',  'Rohtak'),
  ('branch_bad', 'Badhmere',      'sub',  'Badhmere')
on conflict do nothing;

-- ── USERS / STAFF LOGIN ───────────────────────────────────────
create table if not exists app_users (
  id text primary key,
  name text not null,
  email text unique not null,
  password_hash text not null,   -- store bcrypt hash, never plain text
  role text default 'staff',     -- 'superadmin' | 'manager' | 'staff'
  branch_id text references branches(id) on delete set null,
  is_active boolean default true,
  last_login text,
  created_at timestamp default now()
);

-- Default superadmin (password: admin123 — CHANGE IMMEDIATELY)
insert into app_users (id, name, email, password_hash, role, branch_id) values
  ('user_admin', 'Super Admin', 'admin@institute.com',
   '$2b$10$rOzJqWmKvLpN8sT1uYqX4eHjDmNbPcKwAoLfVgSiTnUxMzEyBvCd1', -- admin123
   'superadmin', null)
on conflict do nothing;

-- ── DEPARTMENTS (custom, per branch) ─────────────────────────
create table if not exists departments (
  id text primary key,
  branch_id text references branches(id) on delete cascade,
  name text not null,
  color text default '#1565c0',
  created_at timestamp default now()
);

-- ── HOSTELS (multiple per branch) ────────────────────────────
create table if not exists hostels (
  id text primary key,
  branch_id text references branches(id) on delete cascade,
  name text not null,
  address text,
  total_rooms integer default 0,
  created_at timestamp default now()
);

-- ── ROOMS (inside a hostel) ───────────────────────────────────
create table if not exists rooms (
  id text primary key,
  hostel_id text references hostels(id) on delete cascade,
  branch_id text references branches(id) on delete cascade,
  room_number text not null,
  capacity integer default 1,    -- beds in this room
  floor text,
  room_type text default 'shared', -- 'single' | 'shared' | 'dormitory'
  monthly_rent numeric default 0,
  notes text,
  created_at timestamp default now()
);

-- ── LIBRARIES (multiple per branch) ──────────────────────────
create table if not exists libraries (
  id text primary key,
  branch_id text references branches(id) on delete cascade,
  name text not null,
  total_seats integer default 0,
  address text,
  created_at timestamp default now()
);

-- ── LIBRARY SEATS ────────────────────────────────────────────
create table if not exists library_seats (
  id text primary key,
  library_id text references libraries(id) on delete cascade,
  branch_id text references branches(id) on delete cascade,
  seat_number text not null,
  row_label text,                -- e.g. "A", "B"
  col_number integer,            -- position in row
  seat_type text default 'standard', -- 'standard' | 'window' | 'corner'
  is_active boolean default true,
  created_at timestamp default now()
);

-- ── EMPLOYEES ────────────────────────────────────────────────
create table if not exists employees (
  id text primary key,
  branch_id text references branches(id) on delete cascade,
  department_id text references departments(id) on delete set null,
  name text not null,
  phone text,
  email text,
  dob text,
  address text,
  joining_date text,
  exit_date text,
  designation text,
  employment_type text default 'full-time', -- 'full-time'|'part-time'|'contract'
  monthly_salary numeric default 0,
  bank_name text,
  bank_account text,
  ifsc text,
  aadhar text,
  pan text,
  emergency_contact text,
  notes text,
  photo_url text,
  status text default 'active',  -- 'active' | 'exited'
  created_at timestamp default now()
);

-- ── EMPLOYEE DOCUMENTS ────────────────────────────────────────
create table if not exists employee_documents (
  id text primary key,
  employee_id text references employees(id) on delete cascade,
  doc_type text,   -- 'aadhar' | 'pan' | 'certificate' | 'photo' | 'other'
  doc_name text,
  file_url text,
  uploaded_at text,
  created_at timestamp default now()
);

-- ── EMPLOYEE ATTENDANCE ───────────────────────────────────────
create table if not exists employee_attendance (
  id text primary key,
  employee_id text references employees(id) on delete cascade,
  branch_id text references branches(id) on delete cascade,
  att_date text not null,        -- YYYY-MM-DD
  status text default 'present', -- 'present'|'absent'|'half'|'holiday'|'leave'
  in_time text,
  out_time text,
  note text,
  created_at timestamp default now(),
  unique(employee_id, att_date)
);

-- ── EMPLOYEE LEAVES ───────────────────────────────────────────
create table if not exists employee_leaves (
  id text primary key,
  employee_id text references employees(id) on delete cascade,
  branch_id text references branches(id) on delete cascade,
  from_date text,
  to_date text,
  leave_type text default 'casual', -- 'casual'|'sick'|'earned'|'unpaid'
  reason text,
  status text default 'approved',   -- 'pending'|'approved'|'rejected'
  approved_by text,
  created_at timestamp default now()
);

-- ── EMPLOYEE SALARY ───────────────────────────────────────────
create table if not exists employee_salary (
  id text primary key,
  employee_id text references employees(id) on delete cascade,
  branch_id text references branches(id) on delete cascade,
  month integer,
  year integer,
  basic numeric default 0,
  allowances numeric default 0,
  deductions numeric default 0,
  advance_deduction numeric default 0,
  net_salary numeric default 0,
  paid_amount numeric default 0,
  balance numeric default 0,
  status text default 'pending',    -- 'pending'|'paid'|'partial'
  paid_date text,
  mode text,
  note text,
  working_days integer default 26,
  present_days integer default 26,
  created_at timestamp default now(),
  unique(employee_id, month, year)
);

-- ── SALARY ADVANCES ───────────────────────────────────────────
create table if not exists salary_advances (
  id text primary key,
  employee_id text references employees(id) on delete cascade,
  branch_id text references branches(id) on delete cascade,
  amount numeric,
  given_date text,
  reason text,
  status text default 'pending',  -- 'pending'|'deducted'
  deducted_month integer,
  deducted_year integer,
  created_at timestamp default now()
);

-- ── ADD branch_id TO EXISTING TABLES ─────────────────────────
alter table hostel_students    add column if not exists branch_id text references branches(id);
alter table hostel_students    add column if not exists hostel_id text references hostels(id);
alter table hostel_students    add column if not exists room_id   text references rooms(id);
alter table leaves             add column if not exists branch_id text references branches(id);
alter table monthly_fees       add column if not exists branch_id text references branches(id);
alter table library_members    add column if not exists branch_id text references branches(id);
alter table library_members    add column if not exists library_id text references libraries(id);
alter table library_members    add column if not exists seat_id   text references library_seats(id);
alter table library_fees       add column if not exists branch_id text references branches(id);
alter table payment_log        add column if not exists branch_id text references branches(id);

-- ── STUDENT TRANSFERS ────────────────────────────────────────
create table if not exists student_transfers (
  id text primary key,
  student_id text,
  student_name text,
  module text,                -- 'hostel' | 'library'
  from_branch_id text references branches(id),
  to_branch_id text references branches(id),
  from_hostel_id text,
  to_hostel_id text,
  transfer_date text,
  reason text,
  transferred_by text,
  created_at timestamp default now()
);

-- ── RLS POLICIES FOR NEW TABLES ───────────────────────────────
alter table branches            enable row level security;
alter table app_users           enable row level security;
alter table departments         enable row level security;
alter table hostels             enable row level security;
alter table rooms               enable row level security;
alter table libraries           enable row level security;
alter table library_seats       enable row level security;
alter table employees           enable row level security;
alter table employee_documents  enable row level security;
alter table employee_attendance enable row level security;
alter table employee_leaves     enable row level security;
alter table employee_salary     enable row level security;
alter table salary_advances     enable row level security;
alter table student_transfers   enable row level security;

-- Open policies (auth handled in app layer for now)
create policy "allow_all_branches"    on branches            for all using (true) with check (true);
create policy "allow_all_users"       on app_users           for all using (true) with check (true);
create policy "allow_all_depts"       on departments         for all using (true) with check (true);
create policy "allow_all_hostels"     on hostels             for all using (true) with check (true);
create policy "allow_all_rooms"       on rooms               for all using (true) with check (true);
create policy "allow_all_libraries"   on libraries           for all using (true) with check (true);
create policy "allow_all_seats"       on library_seats       for all using (true) with check (true);
create policy "allow_all_employees"   on employees           for all using (true) with check (true);
create policy "allow_all_emp_docs"    on employee_documents  for all using (true) with check (true);
create policy "allow_all_emp_att"     on employee_attendance for all using (true) with check (true);
create policy "allow_all_emp_leaves"  on employee_leaves     for all using (true) with check (true);
create policy "allow_all_emp_salary"  on employee_salary     for all using (true) with check (true);
create policy "allow_all_advances"    on salary_advances     for all using (true) with check (true);
create policy "allow_all_transfers"   on student_transfers   for all using (true) with check (true);
