// llm-client.js — Drop-in LLM adapter con interfaz Anthropic Messages API
//
// Política PVB (mayo 2026):
//   1. Gemini 2.5 Flash = default (gratis, español excelente, tool calling)
//   2. Groq Llama 3.3 70B = fallback rápido si Gemini falla
//   3. Anthropic Claude = SOLO si se invoca explícitamente (sin créditos por ahora)
//
// Expone: new LLMClient().messages.create({ model, system, messages, tools, max_tokens })
// Devuelve respuesta con el shape de Anthropic:
//   { content: [{type:'text', text}|{type:'tool_use', id, name, input}], stop_reason }
//
// Esto permite reusar el código del Growth Council y telegram-ai sin reescribir la lógica.

const GEMINI_MODEL  = 'gemini-2.5-flash';
const GROQ_MODEL    = 'llama-3.3-70b-versatile';

// ─── Helpers de conversión Anthropic ↔ OpenAI/Gemini ──────────────────────────

// Anthropic messages → OpenAI/Groq messages
function toOpenAIMessages(system, messages) {
  const out = [];
  if (system) out.push({ role: 'system', content: system });

  for (const m of messages) {
    // Mensaje user/assistant simple (string)
    if (typeof m.content === 'string') {
      out.push({ role: m.role, content: m.content });
      continue;
    }

    // Mensaje con content blocks (Anthropic style)
    if (Array.isArray(m.content)) {
      // Assistant con tool_use → OpenAI tool_calls
      if (m.role === 'assistant') {
        const textParts = m.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
        const toolUses  = m.content.filter(b => b.type === 'tool_use');
        const msg = { role: 'assistant', content: textParts || null };
        if (toolUses.length) {
          msg.tool_calls = toolUses.map(tu => ({
            id: tu.id,
            type: 'function',
            function: { name: tu.name, arguments: JSON.stringify(tu.input || {}) }
          }));
        }
        out.push(msg);
        continue;
      }

      // User con tool_result → OpenAI role:tool (uno por result)
      if (m.role === 'user') {
        const toolResults = m.content.filter(b => b.type === 'tool_result');
        const textParts   = m.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
        for (const tr of toolResults) {
          out.push({
            role: 'tool',
            tool_call_id: tr.tool_use_id,
            content: typeof tr.content === 'string' ? tr.content : JSON.stringify(tr.content)
          });
        }
        if (textParts) out.push({ role: 'user', content: textParts });
        continue;
      }
    }

    // Fallback
    out.push({ role: m.role, content: String(m.content || '') });
  }
  return out;
}

// Anthropic tools → OpenAI function tools
function toOpenAITools(tools) {
  if (!tools?.length) return undefined;
  return tools.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema
    }
  }));
}

// OpenAI response → Anthropic-shaped response
function fromOpenAIResponse(data) {
  const choice = data.choices?.[0];
  if (!choice) {
    return {
      content: [{ type: 'text', text: 'Sin respuesta del modelo.' }],
      stop_reason: 'end_turn'
    };
  }

  const msg = choice.message || {};
  const content = [];

  if (msg.content) content.push({ type: 'text', text: msg.content });

  if (msg.tool_calls?.length) {
    for (const tc of msg.tool_calls) {
      let input = {};
      try { input = JSON.parse(tc.function?.arguments || '{}'); } catch {}
      content.push({
        type: 'tool_use',
        id: tc.id,
        name: tc.function?.name,
        input
      });
    }
  }

  if (!content.length) content.push({ type: 'text', text: '' });

  const stop_reason = msg.tool_calls?.length ? 'tool_use'
    : choice.finish_reason === 'length' ? 'max_tokens'
    : 'end_turn';

  return { content, stop_reason, usage: data.usage };
}

// ─── Gemini provider (OpenAI-compatible endpoint) ─────────────────────────────
// Gemini expone un endpoint /v1beta/openai/chat/completions compatible con OpenAI.

async function callGemini({ system, messages, tools, max_tokens, model }) {
  const KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!KEY) throw new Error('GEMINI_API_KEY/GOOGLE_API_KEY no configurada');

  const body = {
    model: model || GEMINI_MODEL,
    messages: toOpenAIMessages(system, messages),
    max_tokens: max_tokens || 1024
  };
  const openaiTools = toOpenAITools(tools);
  if (openaiTools) body.tools = openaiTools;

  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  return fromOpenAIResponse(data);
}

// ─── Groq provider (OpenAI-compatible) ────────────────────────────────────────

async function callGroq({ system, messages, tools, max_tokens, model }) {
  const KEY = process.env.GROQ_API_KEY;
  if (!KEY) throw new Error('GROQ_API_KEY no configurada');

  const body = {
    model: model || GROQ_MODEL,
    messages: toOpenAIMessages(system, messages),
    max_tokens: max_tokens || 1024
  };
  const openaiTools = toOpenAITools(tools);
  if (openaiTools) body.tools = openaiTools;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  return fromOpenAIResponse(data);
}

// ─── Anthropic provider (solo emergencias) ────────────────────────────────────

async function callAnthropic({ system, messages, tools, max_tokens, model }) {
  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) throw new Error('ANTHROPIC_API_KEY no configurada');

  // Anthropic acepta su propio formato directamente
  const body = {
    model: model || 'claude-sonnet-4-6',
    max_tokens: max_tokens || 1024,
    system,
    messages,
    ...(tools?.length ? { tools } : {})
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic ${res.status}: ${errText.slice(0, 300)}`);
  }

  return res.json();
}

// ─── Cliente principal con failover ───────────────────────────────────────────

export class LLMClient {
  constructor(opts = {}) {
    // opts.preferred: 'groq' (default actual) | 'gemini' | 'anthropic'
    // NOTA: default = groq porque GEMINI_API_KEY aún no está en Vercel.
    // Cuando se agregue, cambiar a 'gemini' (mejor español chileno).
    this.preferred = opts.preferred || 'groq';
    this.messages = {
      create: (params) => this._create(params)
    };
  }

  async _create(params) {
    // Si el caller pidió explícitamente un modelo Claude, respetar (uso emergencia)
    if (params.model?.startsWith('claude-')) {
      return callAnthropic(params);
    }

    const order = this.preferred === 'groq'
      ? [callGroq, callGemini]
      : [callGemini, callGroq];

    let lastErr;
    for (const fn of order) {
      try {
        return await fn(params);
      } catch (err) {
        lastErr = err;
        console.warn(`[llm-client] ${fn.name} falló: ${err.message} — probando fallback…`);
      }
    }
    throw new Error(`Todos los providers LLM fallaron. Último error: ${lastErr?.message}`);
  }
}

// ─── Sugar: drop-in replacement para `new Anthropic({ apiKey })` ──────────────
// Permite cambiar solo el import sin tocar el resto del código.

export default class AnthropicCompat {
  constructor(_opts = {}) {
    const client = new LLMClient();
    this.messages = client.messages;
  }
}
