// Master Brain Agents API — Netlify Function
// URL: /.netlify/functions/master-brain-agents
// Returns agent data, budgets, tasks from Supabase

import { validateUserSession, getSupabaseAdmin } from './utils/supabase.js';

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: 'Missing auth token' }) };
    }

    const sessionToken = authHeader.substring(7);
    const user = await validateUserSession(sessionToken);
    if (!user) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: 'Invalid session' }) };
    }

    const supabase = getSupabaseAdmin();
    const params = event.queryStringParameters || {};
    const action = params.action || 'list';

    // GET actions
    if (event.httpMethod === 'GET') {
      if (action === 'list') {
        // List all agents
        const { data: agents, error } = await supabase
          .from('brain_agents')
          .select('*')
          .order('department', { ascending: true });

        if (error) throw error;
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, agents: agents || [] }) };
      }

      if (action === 'budgets') {
        // Get budget entries for current month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const { data: budgets, error } = await supabase
          .from('brain_budget_entries')
          .select('*')
          .gte('created_at', monthStart);

        if (error) throw error;

        // Aggregate by agent
        const byAgent = {};
        (budgets || []).forEach(b => {
          if (!byAgent[b.agent_id]) byAgent[b.agent_id] = 0;
          byAgent[b.agent_id] += b.cost_cents;
        });

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, budgets: byAgent }) };
      }

      if (action === 'tasks') {
        const { data: tasks, error } = await supabase
          .from('brain_tasks')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, tasks: tasks || [] }) };
      }

      if (action === 'learnings') {
        const agentId = params.agent_id || null;
        let query = supabase
          .from('brain_learnings')
          .select('*')
          .eq('is_active', true)
          .order('confidence', { ascending: false })
          .order('times_applied', { ascending: false });

        if (agentId) query = query.eq('agent_id', agentId);
        const { data, error } = await query.limit(200);
        if (error) throw error;
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, learnings: data || [] }) };
      }

      if (action === 'learnings-stats') {
        const { data, error } = await supabase
          .from('brain_learnings')
          .select('agent_id, category, confidence, times_applied, is_active')
          .eq('is_active', true);

        if (error) throw error;

        // Aggregate per agent
        const stats = {};
        (data || []).forEach(l => {
          if (!stats[l.agent_id]) stats[l.agent_id] = { total: 0, categories: {}, avgConfidence: 0, totalApplied: 0 };
          stats[l.agent_id].total++;
          stats[l.agent_id].categories[l.category] = (stats[l.agent_id].categories[l.category] || 0) + 1;
          stats[l.agent_id].avgConfidence += l.confidence;
          stats[l.agent_id].totalApplied += l.times_applied;
        });
        Object.values(stats).forEach(s => { s.avgConfidence = s.total > 0 ? (s.avgConfidence / s.total) : 0; });

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, stats }) };
      }

      if (action === 'audit') {
        const filterType = params.type || 'all';
        let query = supabase
          .from('brain_audit_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (filterType !== 'all') {
          query = query.eq('action_type', filterType);
        }

        const { data: entries, error } = await query;
        if (error) throw error;
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, entries: entries || [] }) };
      }
    }

    // POST — record a budget entry or task
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');

      if (action === 'record-cost') {
        const { agent_id, cost_cents, tokens_in, tokens_out, model, task_id } = body;
        const { data, error } = await supabase
          .from('brain_budget_entries')
          .insert({ agent_id, cost_cents, tokens_in, tokens_out, model, task_id })
          .select()
          .single();

        if (error) throw error;

        // Audit log
        await supabase.from('brain_audit_log').insert({
          action_type: 'budget',
          entity_type: 'agent',
          entity_id: agent_id,
          details: { cost_cents, model, task_id },
        });

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, entry: data }) };
      }

      if (action === 'add-learning') {
        const { agent_id, learning, category, source, source_task_id, confidence } = body;
        if (!agent_id || !learning) {
          return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'agent_id and learning required' }) };
        }
        const { data, error } = await supabase
          .from('brain_learnings')
          .insert({
            agent_id,
            learning,
            category: category || 'general',
            source: source || 'manual',
            source_task_id: source_task_id || null,
            confidence: confidence || 0.8,
          })
          .select()
          .single();

        if (error) throw error;

        await supabase.from('brain_audit_log').insert({
          action_type: 'learning',
          entity_type: 'agent',
          entity_id: agent_id,
          details: { learning, category: category || 'general', learning_id: data.id },
        });

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, learning: data }) };
      }

      if (action === 'update-learning') {
        const { id, is_active, confidence, times_applied } = body;
        const updates = {};
        if (is_active !== undefined) updates.is_active = is_active;
        if (confidence !== undefined) updates.confidence = confidence;
        if (times_applied !== undefined) updates.times_applied = times_applied;
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
          .from('brain_learnings')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, learning: data }) };
      }

      if (action === 'create-task') {
        const { agent_id, title, description, status, project } = body;
        const { data, error } = await supabase
          .from('brain_tasks')
          .insert({ agent_id, title, description, status: status || 'pending', project })
          .select()
          .single();

        if (error) throw error;

        await supabase.from('brain_audit_log').insert({
          action_type: 'task',
          entity_type: 'task',
          entity_id: data.id,
          details: { agent_id, title, status: status || 'pending' },
        });

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, task: data }) };
      }
    }

    return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Unknown action' }) };

  } catch (error) {
    console.error('Master Brain error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: error.message }) };
  }
};
