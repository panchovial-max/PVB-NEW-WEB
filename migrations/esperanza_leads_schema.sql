-- ============================================================
-- ESPERANZA LEADS — Conversaciones del agente de ventas
-- Run in Supabase SQL Editor
-- ============================================================

create table if not exists public.esperanza_leads (
  id           uuid primary key default gen_random_uuid(),
  chat_id      text not null unique,       -- Telegram chat ID
  username     text,                        -- @handle de Telegram
  name         text,                        -- nombre del prospect
  service      text,                        -- video | social | ads | web | brand
  interest     text,                        -- descripción libre del proyecto
  step         text default 'idle',         -- estado interno del bot
  decision     text,                        -- esp_now | esp_later | esp_call
  status       text default 'new' check (status in ('new','warm','hot','converted','lost')),
  notion_page_id text,                      -- ID de la página creada en Notion
  notes        text,                        -- notas internas de PVB
  conversation jsonb default '[]'::jsonb,  -- [{role,text,ts}]
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create or replace function update_esperanza_leads_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_esperanza_updated_at on public.esperanza_leads;
create trigger trg_esperanza_updated_at
  before update on public.esperanza_leads
  for each row execute function update_esperanza_leads_updated_at();

-- RLS: habilitado, sin policies públicas — solo service role (PVB)
alter table public.esperanza_leads enable row level security;
