import http from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const PORT = Number(process.env.AGENT_RUNNER_PORT || 8787);
const ROOT = '/Users/franciscovialbrown/Documents/GitHub';
const PVB_ROOT = `${ROOT}/PVB-NEW-WEB`;

const scripts = {
  'pvb.check-agent-os': {
    label: 'Check Agent OS JS',
    cwd: `${ROOT}/PVB-NEW-WEB`,
    command: 'node',
    args: ['--check', 'agent-os.js'],
    agentId: 'claude-code',
  },
  'pvb.check-apis': {
    label: 'Check PVB API modules',
    cwd: `${ROOT}/PVB-NEW-WEB`,
    command: 'node',
    args: ['--check', 'api/agent-run.js'],
    agentId: 'claude-code',
  },
  'figma.build': {
    label: 'Build Figma MCP',
    cwd: `${ROOT}/grab-cursor-talk-to-figma-mcp`,
    command: 'npm',
    args: ['run', 'build'],
    agentId: 'codex',
  },
  'aura.test': {
    label: 'Run AURA system test',
    cwd: `${ROOT}/aura-agency-os`,
    command: 'npm',
    args: ['run', 'test'],
    agentId: 'aura-director',
  },
};

function loadEnvValues() {
  for (const file of ['.env', '.env.local', '.env.production.local']) {
    const fullPath = path.join(PVB_ROOT, file);
    if (!fs.existsSync(fullPath)) continue;
    const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [key, ...valueParts] = trimmed.split('=');
      if (!process.env[key]) {
        process.env[key] = valueParts.join('=').replace(/^['"]|['"]$/g, '');
      }
    }
  }
}

loadEnvValues();

function readEnvKeys() {
  const keys = new Set(Object.keys(process.env));
  for (const file of ['.env', '.env.local', '.env.production.local']) {
    const fullPath = path.join(PVB_ROOT, file);
    if (!fs.existsSync(fullPath)) continue;
    const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      keys.add(trimmed.split('=')[0]);
    }
  }
  return keys;
}

function getConnectionStatus() {
  const keys = readEnvKeys();
  return {
    openai: keys.has('OPENAI_API_KEY'),
    adobeFirefly: keys.has('ADOBE_CLIENT_ID') && keys.has('ADOBE_CLIENT_SECRET'),
    googleDrive: keys.has('GOOGLE_CLIENT_ID') && keys.has('GOOGLE_CLIENT_SECRET') && keys.has('GOOGLE_REFRESH_TOKEN'),
    telegram: (keys.has('TELEGRAM_TASKS_BOT_TOKEN') || keys.has('TELEGRAM_BOT_TOKEN')) && (keys.has('TELEGRAM_CHAT_ID') || keys.has('TELEGRAM_OWNER_CHAT_ID')),
    notionDriveLookup: keys.has('NOTION_TOKEN') || keys.has('NOTION_API_KEY'),
    anthropic: keys.has('ANTHROPIC_API_KEY'),
    supabase: (keys.has('SUPABASE_SERVICE_ROLE_KEY') || keys.has('SUPABASE_SERVICE_KEY')) && keys.has('SUPABASE_URL'),
  };
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase env vars are required');
  return createClient(url, key);
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 100_000) reject(new Error('Payload too large'));
    });
    req.on('end', () => resolve(data ? JSON.parse(data) : {}));
    req.on('error', reject);
  });
}

function runScript(script) {
  return new Promise(resolve => {
    const startedAt = new Date().toISOString();
    const child = spawn(script.command, script.args, {
      cwd: script.cwd,
      env: process.env,
      shell: false,
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });
    child.on('close', code => {
      resolve({
        ok: code === 0,
        code,
        startedAt,
        finishedAt: new Date().toISOString(),
        stdout: stdout.slice(-8000),
        stderr: stderr.slice(-8000),
      });
    });
  });
}

async function processQueuedScriptRun() {
  const supabase = getSupabase();
  const { data: queued, error: fetchError } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('status', 'queued')
    .eq('action', 'run-script')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!queued) return { ok: true, processed: false, message: 'No queued script runs' };

  const script = scripts[queued.script_id];
  if (!script) {
    const { data, error } = await supabase
      .from('agent_runs')
      .update({
        status: 'failed',
        error: `Script not allowed: ${queued.script_id}`,
        finished_at: new Date().toISOString(),
      })
      .eq('id', queued.id)
      .select('*')
      .single();
    if (error) throw error;
    return { ok: false, processed: true, run: data };
  }

  const { data: running, error: updateError } = await supabase
    .from('agent_runs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', queued.id)
    .eq('status', 'queued')
    .select('*')
    .single();
  if (updateError) throw updateError;

  const result = await runScript(script);

  const { data: latest } = await supabase
    .from('agent_runs')
    .select('status')
    .eq('id', running.id)
    .single();

  if (latest?.status === 'cancelled') {
    return { ok: true, processed: true, cancelled: true, runId: running.id };
  }

  const { data: finished, error: finishError } = await supabase
    .from('agent_runs')
    .update({
      status: result.ok ? 'completed' : 'failed',
      result,
      error: result.ok ? null : result.stderr || `Exit code ${result.code}`,
      logs: `STDOUT:\n${result.stdout}\n\nSTDERR:\n${result.stderr}`,
      finished_at: new Date().toISOString(),
    })
    .eq('id', running.id)
    .select('*')
    .single();
  if (finishError) throw finishError;
  return { ok: result.ok, processed: true, run: finished };
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method === 'GET' && req.url === '/connections') {
    return send(res, 200, { ok: true, connections: getConnectionStatus() });
  }

  if (req.method === 'GET' && req.url === '/scripts') {
    return send(res, 200, {
      ok: true,
      scripts: Object.entries(scripts).map(([id, script]) => ({
        id,
        label: script.label,
        cwd: script.cwd,
        command: [script.command, ...script.args].join(' '),
        agentId: script.agentId,
      })),
    });
  }

  if (req.method === 'POST' && req.url === '/runs/process-once') {
    try {
      return send(res, 200, await processQueuedScriptRun());
    } catch (err) {
      return send(res, 500, { ok: false, error: err.message });
    }
  }

  if (req.method === 'POST' && req.url === '/run') {
    try {
      const body = await readBody(req);
      const script = scripts[body.scriptId];
      if (!script) return send(res, 404, { ok: false, error: 'Script not allowed' });
      const result = await runScript(script);
      return send(res, 200, { ok: result.ok, scriptId: body.scriptId, script, result });
    } catch (err) {
      return send(res, 500, { ok: false, error: err.message });
    }
  }

  return send(res, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Agent runner listening on http://localhost:${PORT}`);
});
