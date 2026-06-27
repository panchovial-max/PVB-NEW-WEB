-- ============================================================
-- ESPERANZA LEADS v2 — Datos completos para Master Brain + Notion
-- Run in Supabase SQL Editor
-- ============================================================

alter table public.esperanza_leads
  add column if not exists company       text,           -- nombre empresa/marca
  add column if not exists contact_email text,           -- email del contacto
  add column if not exists contact_role  text,           -- cargo del contacto
  add column if not exists budget        text,           -- presupuesto estimado en CLP
  add column if not exists objective     text,           -- objetivo de la campaña
  add column if not exists kpis          text,           -- métricas de éxito
  add column if not exists timeline      text,           -- plazo / fecha estimada
  add column if not exists formats       text[],         -- ['video','foto','social','ads','ia']
  add column if not exists references    text,           -- referencias / inspiración
  add column if not exists campaign_name text;           -- nombre de campaña si aplica
