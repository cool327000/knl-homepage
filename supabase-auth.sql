-- KNL Discord OAuth access-control schema (run in Supabase SQL Editor)
-- IMPORTANT: Add ONLY the site owner's auth.users UUID to knl_admins.
-- Never expose a Supabase service_role key in GitHub Pages or browser code.

create table if not exists public.knl_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.knl_access_requests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  discord_name text not null default 'Discord user',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

alter table public.knl_admins enable row level security;
alter table public.knl_access_requests enable row level security;

-- A signed-in user can verify only whether their own account is the owner.
create policy "users can read own admin flag"
on public.knl_admins for select to authenticated
using (user_id = auth.uid());

-- A user can submit and view only their own request.
create policy "users can read own access request"
on public.knl_access_requests for select to authenticated
using (user_id = auth.uid());

create policy "users can submit own access request"
on public.knl_access_requests for insert to authenticated
with check (user_id = auth.uid() and status = 'pending' and reviewed_by is null);

-- The owner alone can view every request and approve/reject/revoke access.
create policy "owner can read all access requests"
on public.knl_access_requests for select to authenticated
using (exists (select 1 from public.knl_admins a where a.user_id = auth.uid()));

create policy "owner can update access requests"
on public.knl_access_requests for update to authenticated
using (exists (select 1 from public.knl_admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.knl_admins a where a.user_id = auth.uid()));

-- Rejected users may delete only their own request to submit it again.
create policy "users can delete own rejected request"
on public.knl_access_requests for delete to authenticated
using (user_id = auth.uid() and status = 'rejected');

-- No browser-side insert/update/delete policy exists for knl_admins.
-- This prevents anyone other than a trusted database operator from making themselves owner.
