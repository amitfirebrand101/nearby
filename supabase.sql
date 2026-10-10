-- Run this once in the Supabase SQL editor before deploying the site.
create extension if not exists pgcrypto;

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null unique,
  reason text not null,
  created_at timestamptz not null default now()
);

-- The Vercel function uses the server-only service role key, so visitors never
-- need direct access to this table.
alter table public.waitlist_signups enable row level security;

create index if not exists waitlist_signups_created_at_idx
  on public.waitlist_signups (created_at desc);
