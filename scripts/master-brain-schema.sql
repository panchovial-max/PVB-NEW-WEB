-- ============================================
-- PVB MASTER BRAIN — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Agents table
CREATE TABLE IF NOT EXISTS brain_agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  department TEXT NOT NULL,
  role TEXT DEFAULT 'specialist',
  capabilities TEXT,
  skills TEXT,
  budget_monthly_cents INTEGER DEFAULT 0,
  instruction_file TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget entries (cost tracking per execution)
CREATE TABLE IF NOT EXISTS brain_budget_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT REFERENCES brain_agents(id),
  task_id UUID,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS brain_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT REFERENCES brain_agents(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  project TEXT,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Routines (scheduled tasks)
CREATE TABLE IF NOT EXISTS brain_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT REFERENCES brain_agents(id),
  title TEXT NOT NULL,
  description TEXT,
  cron_expression TEXT NOT NULL,
  schedule_label TEXT,
  timezone TEXT DEFAULT 'America/Santiago',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disabled')),
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log (immutable)
CREATE TABLE IF NOT EXISTS brain_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brain_agents_dept ON brain_agents(department);
CREATE INDEX IF NOT EXISTS idx_brain_budget_agent ON brain_budget_entries(agent_id);
CREATE INDEX IF NOT EXISTS idx_brain_budget_date ON brain_budget_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_brain_tasks_agent ON brain_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_brain_tasks_status ON brain_tasks(status);
CREATE INDEX IF NOT EXISTS idx_brain_audit_date ON brain_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_brain_audit_type ON brain_audit_log(action_type);

-- RLS (Row Level Security) — allow authenticated users
ALTER TABLE brain_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_budget_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_audit_log ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by Netlify functions)
CREATE POLICY "Service role full access" ON brain_agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON brain_budget_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON brain_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON brain_routines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON brain_audit_log FOR ALL USING (true) WITH CHECK (true);

-- Authenticated users can read
CREATE POLICY "Auth users can read agents" ON brain_agents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can read budgets" ON brain_budget_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can read tasks" ON brain_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can read routines" ON brain_routines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can read audit" ON brain_audit_log FOR SELECT TO authenticated USING (true);
