-- Agent OS executable run queue
-- Apply in Supabase SQL editor before using queued/cancellable runs.

create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  agent_id text,
  tool_id text,
  script_id text,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  prompt text,
  project_name text,
  params jsonb not null default '{}',
  result jsonb,
  error text,
  logs text,
  requested_by text default 'agent-os',
  cancel_requested_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_agent_runs_status_created_at
  on agent_runs (status, created_at desc);

create index if not exists idx_agent_runs_agent_created_at
  on agent_runs (agent_id, created_at desc);

create or replace function set_agent_runs_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_agent_runs_updated_at on agent_runs;
create trigger trg_agent_runs_updated_at
before update on agent_runs
for each row execute function set_agent_runs_updated_at();
