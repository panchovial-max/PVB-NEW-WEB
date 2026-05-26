-- Historial de conversaciones con el bot de Telegram (Pancho ↔ Claude)
-- Permite que el bot recuerde el contexto aunque Vercel reinicie el serverless

create table if not exists public.telegram_ai_history (
  chat_id     text        primary key,
  messages    jsonb       not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- RLS habilitado — sin políticas públicas, solo service_role
alter table public.telegram_ai_history enable row level security;

-- Trigger para updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_telegram_ai_history_updated_at on public.telegram_ai_history;
create trigger trg_telegram_ai_history_updated_at
  before update on public.telegram_ai_history
  for each row execute function public.set_updated_at();
