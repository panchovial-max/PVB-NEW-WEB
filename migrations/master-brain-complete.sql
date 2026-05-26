-- ============================================================
-- PVB MASTER BRAIN — Schema Completo v2
-- Agregar DESPUÉS del master-brain-schema.sql base
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ─── brain_proposals (reemplaza SAMPLE_PROPOSALS hardcodeado) ───
CREATE TABLE IF NOT EXISTS brain_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT REFERENCES brain_agents(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'improvement' CHECK (category IN (
    'improvement', 'bug', 'opportunity', 'optimization', 'creative'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  target_area TEXT,
  estimated_impact TEXT,
  estimated_effort TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brain_proposals_status ON brain_proposals(status);
CREATE INDEX IF NOT EXISTS idx_brain_proposals_agent ON brain_proposals(agent_id);
CREATE INDEX IF NOT EXISTS idx_brain_proposals_category ON brain_proposals(category);

ALTER TABLE brain_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON brain_proposals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can read proposals" ON brain_proposals FOR SELECT TO authenticated USING (true);

-- ─── brain_agent_status (reemplaza simulateAgentActivity()) ───
CREATE TABLE IF NOT EXISTS brain_agent_status (
  agent_id TEXT PRIMARY KEY REFERENCES brain_agents(id),
  status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'working', 'reviewing', 'proposing', 'completed', 'error')),
  current_task TEXT,
  task_started_at TIMESTAMPTZ,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  tasks_done_total INTEGER DEFAULT 0,
  tasks_done_today INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  quality_score REAL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE brain_agent_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON brain_agent_status FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can read status" ON brain_agent_status FOR SELECT TO authenticated USING (true);

-- ─── brain_campaigns (reemplaza renderCampaigns() hardcodeado) ───
CREATE TABLE IF NOT EXISTS brain_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('planning', 'active', 'paused', 'completed', 'cancelled')),
  progress_pct INTEGER DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  start_date DATE,
  end_date DATE,
  budget_clp INTEGER DEFAULT 0,
  spent_clp INTEGER DEFAULT 0,
  lead_agent_id TEXT REFERENCES brain_agents(id),
  notion_page_id TEXT,
  description TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brain_campaigns_status ON brain_campaigns(status);
ALTER TABLE brain_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON brain_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can read campaigns" ON brain_campaigns FOR SELECT TO authenticated USING (true);

-- ─── brain_daily_briefing (briefing diario enviado a Telegram) ───
CREATE TABLE IF NOT EXISTS brain_daily_briefing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT DEFAULT 'morning' CHECK (type IN ('morning', 'evening', 'weekly')),
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  telegram_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE brain_daily_briefing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON brain_daily_briefing FOR ALL USING (true) WITH CHECK (true);

-- ─── ESPERANZA — Directora de Ventas ─────────────────────────

-- Pipeline de leads de Esperanza
CREATE TABLE IF NOT EXISTS esperanza_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  instagram_handle TEXT,
  phone TEXT,
  email TEXT,
  source TEXT DEFAULT 'instagram' CHECK (source IN (
    'instagram', 'whatsapp', 'referral', 'cold_outreach', 'inbound', 'other'
  )),
  stage TEXT DEFAULT 'new' CHECK (stage IN (
    'new',           -- lead nuevo, sin contacto
    'contacted',     -- primer contacto enviado
    'replied',       -- respondió
    'qualified',     -- calificado (tiene presupuesto y necesidad)
    'proposal_sent', -- propuesta enviada
    'negotiating',   -- en negociación
    'won',           -- cliente ganado
    'lost',          -- perdido
    'nurturing'      -- en seguimiento largo plazo
  )),
  interest TEXT,
  budget_range TEXT,
  notes TEXT,
  last_contact TIMESTAMPTZ,
  next_followup TIMESTAMPTZ,
  assigned_to TEXT DEFAULT 'esperanza',
  won_at TIMESTAMPTZ,
  lost_reason TEXT,
  deal_value_clp INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_esperanza_leads_stage ON esperanza_leads(stage);
CREATE INDEX IF NOT EXISTS idx_esperanza_leads_next_followup ON esperanza_leads(next_followup);
ALTER TABLE esperanza_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON esperanza_leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can read leads" ON esperanza_leads FOR SELECT TO authenticated USING (true);

-- Conversaciones de Esperanza (historial de DMs)
CREATE TABLE IF NOT EXISTS esperanza_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES esperanza_leads(id) ON DELETE CASCADE,
  platform TEXT DEFAULT 'instagram' CHECK (platform IN ('instagram', 'whatsapp', 'telegram', 'email')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_esperanza_conv_lead ON esperanza_conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_esperanza_conv_sent ON esperanza_conversations(sent_at);
ALTER TABLE esperanza_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON esperanza_conversations FOR ALL USING (true) WITH CHECK (true);

-- Actividad de seguimiento de Esperanza
CREATE TABLE IF NOT EXISTS esperanza_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES esperanza_leads(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  detail TEXT,
  outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE esperanza_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON esperanza_activity FOR ALL USING (true) WITH CHECK (true);

-- ─── Vistas útiles ────────────────────────────────────────────

-- Pipeline summary de Esperanza
CREATE OR REPLACE VIEW esperanza_pipeline_summary AS
SELECT
  stage,
  COUNT(*) as count,
  SUM(deal_value_clp) as total_value_clp,
  MIN(created_at) as oldest_lead,
  MAX(created_at) as newest_lead
FROM esperanza_leads
GROUP BY stage
ORDER BY
  CASE stage
    WHEN 'new' THEN 1 WHEN 'contacted' THEN 2 WHEN 'replied' THEN 3
    WHEN 'qualified' THEN 4 WHEN 'proposal_sent' THEN 5 WHEN 'negotiating' THEN 6
    WHEN 'won' THEN 7 WHEN 'nurturing' THEN 8 WHEN 'lost' THEN 9
  END;

-- Leads que necesitan follow-up hoy
CREATE OR REPLACE VIEW esperanza_followups_today AS
SELECT * FROM esperanza_leads
WHERE next_followup <= NOW() + INTERVAL '24 hours'
  AND stage NOT IN ('won', 'lost')
ORDER BY next_followup ASC;

-- ─── Referral codes (pendiente del portal) ───────────────────
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  owner_user_id UUID REFERENCES auth.users(id),
  discount_pct INTEGER DEFAULT 20,
  max_uses INTEGER DEFAULT 10,
  uses_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON referral_codes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can read own code" ON referral_codes FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());
