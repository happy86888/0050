-- buy0050.com Vercel + Supabase schema
-- Run this once in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null default '匿名朋友',
  email text,
  type text not null check (type in ('idea', 'statement')),
  message text not null,
  holding_status text,
  permission_to_publish text,
  attachment_url text,
  attachment_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  ip_hash text,
  user_agent text
);

create index if not exists comments_status_created_at_idx on public.comments (status, created_at desc);
create index if not exists comments_ip_hash_created_at_idx on public.comments (ip_hash, created_at desc);

alter table public.comments enable row level security;

-- The app uses SUPABASE_SERVICE_ROLE_KEY from Vercel server functions.
-- Service-role requests bypass RLS, so public anon policies are intentionally not required.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY in client-side code.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'statements',
  'statements',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
