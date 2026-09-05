create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  summary text check (summary is null or char_length(summary) <= 300),
  content text not null check (char_length(content) between 1 and 20000),
  type text not null default 'notification' check (type in ('modal', 'notification')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'critical')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  target_version text check (target_version is null or char_length(target_version) <= 80),
  target_channel text check (target_channel is null or target_channel in ('stable', 'beta')),
  action_label text check (action_label is null or char_length(action_label) between 1 and 80),
  action_url text check (action_url is null or action_url ~* '^https?://'),
  created_by text not null check (char_length(created_by) between 1 and 320),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  check (ends_at is null or ends_at > starts_at),
  check ((action_label is null) = (action_url is null)),
  check (status <> 'published' or published_at is not null)
);

create index announcements_active_lookup_idx
  on public.announcements (starts_at, ends_at, published_at desc)
  where status = 'published';
create index announcements_admin_list_idx
  on public.announcements (created_at desc);

alter table public.announcements enable row level security;
revoke all on table public.announcements from anon, authenticated;
grant all on table public.announcements to service_role;
