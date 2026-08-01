-- ============================================================
-- NovaOS — Committee Progress Tracker
-- Supabase schema + RLS policies
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ------------------------------------------------------------
-- 0. EXTENSIONS & ENUMS
-- ------------------------------------------------------------
create extension if not exists "pgcrypto"; -- for gen_random_uuid()

create type user_role as enum ('executive', 'dept_head', 'team_member');
create type task_status as enum ('not_started', 'in_progress', 'review', 'completed', 'delayed');
create type task_priority as enum ('critical', 'high', 'medium', 'low');

-- ------------------------------------------------------------
-- 1. TABLES
-- ------------------------------------------------------------

-- profiles: 1:1 with auth.users
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        user_role not null default 'team_member',
  department  text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- tasks
create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  department   text not null,
  assigned_to  uuid references public.profiles(id) on delete set null,
  status       task_status not null default 'not_started',
  priority     task_priority not null default 'medium',
  deadline     date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- reports
create table public.reports (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references public.tasks(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  content       text,
  blocker       text,
  file_url      text,
  status_update text,
  created_at    timestamptz not null default now()
);

-- Helpful indexes
create index idx_tasks_assigned_to on public.tasks(assigned_to);
create index idx_tasks_department on public.tasks(department);
create index idx_reports_task_id on public.reports(task_id);
create index idx_reports_user_id on public.reports(user_id);

-- ------------------------------------------------------------
-- 2. AUTO-UPDATE `updated_at`
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 3. AUTO-CREATE PROFILE ON SIGNUP
-- New auth.users row -> insert matching profiles row.
-- Reads role/department from signup metadata if provided,
-- otherwise defaults to 'team_member' / 'Unassigned'.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, department)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Unnamed'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'team_member'),
    coalesce(new.raw_user_meta_data->>'department', 'Unassigned')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 4. HELPER FUNCTIONS (SECURITY DEFINER)
-- These bypass RLS internally so policies on `profiles` can
-- check the caller's own role/department WITHOUT recursively
-- triggering the RLS on `profiles` itself (which would error).
-- ------------------------------------------------------------
create or replace function public.get_my_role()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.get_my_department()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select department from public.profiles where id = auth.uid();
$$;

-- ------------------------------------------------------------
-- 5. ENABLE RLS
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.reports enable row level security;

-- ------------------------------------------------------------
-- 6. POLICIES: profiles
-- ------------------------------------------------------------

-- SELECT: yourself, your dept (if dept_head), or everyone (if exec)
create policy "profiles_select"
on public.profiles for select
using (
  id = auth.uid()
  or public.get_my_role() = 'executive'
  or (public.get_my_role() = 'dept_head' and department = public.get_my_department())
);

-- UPDATE: only your own row, and you cannot change your own role
create policy "profiles_update_self"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid() and role = public.get_my_role());

-- Executives can update anyone's profile (e.g. to change role/department)
create policy "profiles_update_exec"
on public.profiles for update
using (public.get_my_role() = 'executive')
with check (public.get_my_role() = 'executive');

-- No public INSERT policy — profile rows are created only by the
-- handle_new_user() trigger, which runs as SECURITY DEFINER.

-- ------------------------------------------------------------
-- 7. POLICIES: tasks
-- ------------------------------------------------------------

-- SELECT: own tasks, dept tasks (dept_head), all tasks (executive)
create policy "tasks_select"
on public.tasks for select
using (
  assigned_to = auth.uid()
  or public.get_my_role() = 'executive'
  or (public.get_my_role() = 'dept_head' and department = public.get_my_department())
);

-- INSERT: dept_head (own dept only) or executive (any dept)
create policy "tasks_insert"
on public.tasks for insert
with check (
  public.get_my_role() = 'executive'
  or (public.get_my_role() = 'dept_head' and department = public.get_my_department())
);

-- UPDATE: dept_head (own dept), executive (any), OR the assignee
-- updating only their own task's status (handled at app layer —
-- Postgres RLS can't easily restrict which *columns* change, so
-- keep an eye on this via the app form, or split into a separate
-- RPC function if you want hard column-level enforcement).
create policy "tasks_update"
on public.tasks for update
using (
  assigned_to = auth.uid()
  or public.get_my_role() = 'executive'
  or (public.get_my_role() = 'dept_head' and department = public.get_my_department())
)
with check (
  assigned_to = auth.uid()
  or public.get_my_role() = 'executive'
  or (public.get_my_role() = 'dept_head' and department = public.get_my_department())
);

-- DELETE: executive only
create policy "tasks_delete"
on public.tasks for delete
using (public.get_my_role() = 'executive');

-- ------------------------------------------------------------
-- 8. POLICIES: reports
-- ------------------------------------------------------------

-- SELECT: your own reports, reports on tasks in your dept (dept_head),
-- or all reports (executive)
create policy "reports_select"
on public.reports for select
using (
  user_id = auth.uid()
  or public.get_my_role() = 'executive'
  or (
    public.get_my_role() = 'dept_head'
    and exists (
      select 1 from public.tasks t
      where t.id = reports.task_id
        and t.department = public.get_my_department()
    )
  )
);

-- INSERT: you can only log a report as yourself, and only on a task
-- you're actually assigned to (dept_head/exec can log on any task
-- in their scope too, e.g. leaving a status note).
create policy "reports_insert"
on public.reports for insert
with check (
  user_id = auth.uid()
  and (
    exists (select 1 from public.tasks t where t.id = task_id and t.assigned_to = auth.uid())
    or public.get_my_role() = 'executive'
    or (
      public.get_my_role() = 'dept_head'
      and exists (select 1 from public.tasks t where t.id = task_id and t.department = public.get_my_department())
    )
  )
);

-- UPDATE/DELETE: only the author, or executive
create policy "reports_update"
on public.reports for update
using (user_id = auth.uid() or public.get_my_role() = 'executive')
with check (user_id = auth.uid() or public.get_my_role() = 'executive');

create policy "reports_delete"
on public.reports for delete
using (user_id = auth.uid() or public.get_my_role() = 'executive');

-- ============================================================
-- 9. STORAGE: file attachments bucket
-- ============================================================

-- Create a private bucket for report attachments.
-- (You can also do this via Dashboard → Storage → New Bucket,
-- just make sure "Public" is OFF.)
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- Convention: files are uploaded to a path of the form
--   {department}/{task_id}/{filename}
-- This lets us scope storage RLS by department using the path,
-- the same way we scope table rows above.

-- SELECT (view/download): same scoping as tasks — own dept
-- (dept_head), everything (executive), or files under a task
-- assigned to you.
create policy "attachments_select"
on storage.objects for select
using (
  bucket_id = 'attachments'
  and (
    public.get_my_role() = 'executive'
    or (public.get_my_role() = 'dept_head' and (storage.foldername(name))[1] = public.get_my_department())
    or exists (
      select 1 from public.tasks t
      where t.id::text = (storage.foldername(name))[2]
        and t.assigned_to = auth.uid()
    )
  )
);

-- INSERT (upload): any authenticated user, but only into a folder
-- matching their own department, and only for a task assigned to
-- them (or any task in-scope if dept_head/executive).
create policy "attachments_insert"
on storage.objects for insert
with check (
  bucket_id = 'attachments'
  and (
    public.get_my_role() = 'executive'
    or (public.get_my_role() = 'dept_head' and (storage.foldername(name))[1] = public.get_my_department())
    or exists (
      select 1 from public.tasks t
      where t.id::text = (storage.foldername(name))[2]
        and t.assigned_to = auth.uid()
        and t.department = (storage.foldername(name))[1]
    )
  )
);

-- DELETE: uploader's own dept scope or executive (kept simple —
-- tighten to "only the uploader" at the app layer if you prefer,
-- since storage.objects doesn't track uploader by default unless
-- you add an owner column check).
create policy "attachments_delete"
on storage.objects for delete
using (
  bucket_id = 'attachments'
  and (
    public.get_my_role() = 'executive'
    or (public.get_my_role() = 'dept_head' and (storage.foldername(name))[1] = public.get_my_department())
  )
);
