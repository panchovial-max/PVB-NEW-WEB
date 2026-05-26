-- ============================================================
-- PVB CLIENT ACCOUNTS — Infrastructure owned by PVB
-- Run in Supabase SQL Editor (service role only)
-- ============================================================

create table if not exists public.client_accounts (
  id              uuid primary key default gen_random_uuid(),
  client_name     text not null,
  client_slug     text unique not null,         -- kaya | refugio-chiloe | romerelli
  email_alias     text,                          -- kaya@pvb.cl (Google Workspace alias)
  status          text default 'active' check (status in ('active','paused','offboarded')),

  -- Contract
  monthly_budget_clp  integer,
  contract_start      date,
  contract_end        date,
  service_type        text,                      -- foto | video | social | full-service

  -- Integrations created by PVB (tokens never exposed to client)
  ig_account_id       text,
  ig_access_token     text,
  fb_access_token     text,
  tiktok_access_token text,
  yt_refresh_token    text,
  notion_page_id      text,                      -- their project page in PVB Notion
  telegram_chat_id    text,                      -- for automated client notifications
  supabase_schema     text,                      -- isolated schema name if needed

  -- Notes
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Updated-at trigger
create or replace function update_client_accounts_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_client_accounts_updated_at on public.client_accounts;
create trigger trg_client_accounts_updated_at
  before update on public.client_accounts
  for each row execute function update_client_accounts_updated_at();

-- RLS: enabled but NO client-facing policies.
-- Only PVB's service role key can read/write.
-- Clients never access this table directly — they go through /api/brain.
alter table public.client_accounts enable row level security;

-- Seed: existing PVB clients
insert into public.client_accounts (client_name, client_slug, email_alias, status, service_type, monthly_budget_clp)
values
  ('Kaya Unite',                'kaya',           'kaya@pvb.cl',           'active', 'full-service', 1200000),
  ('Refugio Chiloé',            'refugio-chiloe', 'refugio@pvb.cl',        'active', 'foto',         800000),
  ('Romerelli',                 'romerelli',      'romerelli@pvb.cl',      'active', 'social',        600000),
  ('Compliance Global Consulting','cgc',           'cgc@pvb.cl',           'active', 'video',         950000)
on conflict (client_slug) do nothing;
