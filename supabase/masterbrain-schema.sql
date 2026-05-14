-- ============================================================
-- MASTER BRAIN — Supabase Schema
-- Tables for agent activity, proposals, campaign tracking
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Agent activity log — what each agent is doing right now
CREATE TABLE IF NOT EXISTS agent_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,           -- matches AGENTS_DATA id (e.g. 'marketing-growth-hacker')
  status TEXT NOT NULL DEFAULT 'idle',  -- idle | working | reviewing | proposing | completed
  current_task TEXT,                -- what they're doing right now
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  result_summary TEXT,              -- brief output when completed
  metadata JSONB DEFAULT '{}',      -- extra data (files touched, metrics, etc)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_activity_agent ON agent_activity(agent_id);
CREATE INDEX idx_agent_activity_status ON agent_activity(status);
CREATE INDEX idx_agent_activity_campaign ON agent_activity(campaign_id);

-- 2. Agent proposals — autonomous improvement suggestions
CREATE TABLE IF NOT EXISTS agent_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL,               -- short proposal title
  description TEXT NOT NULL,         -- what they suggest and why
  category TEXT NOT NULL DEFAULT 'improvement', -- improvement | bug | opportunity | optimization | creative
  priority TEXT NOT NULL DEFAULT 'medium',      -- low | medium | high | critical
  target_area TEXT,                  -- what it affects: 'ui', 'ux', 'performance', 'content', 'seo', 'brand', etc
  status TEXT NOT NULL DEFAULT 'pending',       -- pending | approved | rejected | in_progress | completed
  evidence JSONB DEFAULT '[]',       -- screenshots, links, data supporting the proposal
  estimated_impact TEXT,             -- "Could increase conversion by ~15%"
  estimated_effort TEXT,             -- "2-3 hours" or "1 sprint"
  response_note TEXT,                -- your response when approving/rejecting
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_proposals_agent ON agent_proposals(agent_id);
CREATE INDEX idx_proposals_status ON agent_proposals(status);
CREATE INDEX idx_proposals_category ON agent_proposals(category);
CREATE INDEX idx_proposals_created ON agent_proposals(created_at DESC);

-- 3. Campaign tasks — track agent work per campaign
CREATE TABLE IF NOT EXISTS campaign_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | in_progress | review | completed | blocked
  priority INTEGER DEFAULT 0,             -- 0=normal, 1=high, 2=critical
  deliverable_url TEXT,                   -- link to output (file, page, etc)
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaign_tasks_campaign ON campaign_tasks(campaign_id);
CREATE INDEX idx_campaign_tasks_agent ON campaign_tasks(agent_id);
CREATE INDEX idx_campaign_tasks_status ON campaign_tasks(status);

-- 4. Agent stats — aggregate performance metrics
CREATE TABLE IF NOT EXISTS agent_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL UNIQUE,
  tasks_completed INTEGER DEFAULT 0,
  proposals_made INTEGER DEFAULT 0,
  proposals_approved INTEGER DEFAULT 0,
  avg_task_hours NUMERIC(5,2) DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  streak_days INTEGER DEFAULT 0,       -- consecutive days with activity
  quality_score NUMERIC(3,2) DEFAULT 0, -- 0-5 rating based on outcomes
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_stats_agent ON agent_stats(agent_id);

-- 5. Enable RLS
ALTER TABLE agent_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_stats ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (single-tenant, owner only)
CREATE POLICY "owner_all" ON agent_activity FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "owner_all" ON agent_proposals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "owner_all" ON campaign_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "owner_all" ON agent_stats FOR ALL USING (true) WITH CHECK (true);

-- 6. Helper: get agent dashboard summary
CREATE OR REPLACE FUNCTION get_agent_dashboard()
RETURNS TABLE (
  agent_id TEXT,
  current_status TEXT,
  current_task TEXT,
  tasks_done BIGINT,
  pending_proposals BIGINT,
  last_active TIMESTAMPTZ
) AS $$
  SELECT
    s.agent_id,
    COALESCE(
      (SELECT a.status FROM agent_activity a WHERE a.agent_id = s.agent_id ORDER BY a.created_at DESC LIMIT 1),
      'idle'
    ) AS current_status,
    (SELECT a.current_task FROM agent_activity a WHERE a.agent_id = s.agent_id AND a.status != 'idle' ORDER BY a.created_at DESC LIMIT 1) AS current_task,
    s.tasks_completed AS tasks_done,
    (SELECT COUNT(*) FROM agent_proposals p WHERE p.agent_id = s.agent_id AND p.status = 'pending') AS pending_proposals,
    s.last_active_at AS last_active
  FROM agent_stats s
  ORDER BY s.last_active_at DESC NULLS LAST;
$$ LANGUAGE sql;
