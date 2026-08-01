-- ============================================================
-- NovaOS — Phase 1: use signup email as full_name placeholder
-- Run this AFTER 01_schema_rls_storage.sql
-- Safely replaces the function body; the trigger itself is untouched.
-- ============================================================

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
    new.email,
    'team_member',
    coalesce(new.raw_user_meta_data->>'department', 'Unassigned')
  );
  return new;
end;
$$;

-- If you're running this on a fresh project where 01_schema_rls_storage.sql
-- was NOT already run, uncomment the block below too:

-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute function public.handle_new_user();
