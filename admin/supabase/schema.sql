create extension if not exists pgcrypto;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  type text not null check (type in ('emergency', 'watch')),
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now()
);

alter table public.reports replica identity full;

alter publication supabase_realtime add table public.reports;

