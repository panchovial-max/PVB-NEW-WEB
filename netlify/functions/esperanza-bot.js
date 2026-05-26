// esperanza-bot.js — Esperanza, Directora de Ventas de PVB
// Maneja el pipeline de leads, follow-ups y propuestas comerciales
// Se invoca desde telegram-bot.js cuando el mensaje empieza con /esp o chat_id es Esperanza

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const ESPERANZA_PERSONA = `Eres Esperanza, Directora de Ventas de PVB Estudio Creativo.
Personalidad: directa, cálida, persuasiva. Hablas en español chileno.
Tu trabajo es convertir leads en clientes de PVB.

PVB ofrece:
- Producción audiovisual (video, foto, drone) — desde $800.000 CLP
- Campañas de redes sociales — desde $300.000/mes CLP
- Branding y web — desde $600.000 CLP
- Paquetes completos — desde $1.500.000 CLP

Cuando califiques un lead, pregunta siempre:
1. ¿Qué tipo de proyecto necesitan?
2. ¿Cuándo lo necesitan?
3. ¿Tienen un presupuesto estimado?

Respuestas cortas y accionables. Siempre sugiere el siguiente paso concreto.`;

const ESPERANZA_TOOLS = [
  {
    name: 'crear_lead',
    description: 'Registra un nuevo lead en el pipeline',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        company: { type: 'string' },
        instagram_handle: { type: 'string' },
        phone: { type: 'string' },
        interest: { type: 'string' },
        source: { type: 'string', enum: ['instagram', 'whatsapp', 'referral', 'cold_outreach', 'inbound', 'other'] },
        notes: { type: 'string' }
      },
      required: ['name']
    }
  },
  {
    name: 'avanzar_lead',
    description: 'Avanza un lead a la siguiente etapa del pipeline',
    input_schema: {
      type: 'object',
      properties: {
        lead_id: { type: 'string' },
        busqueda: { type: 'string', description: 'Nombre o handle si no tienes el ID' },
        stage: { type: 'string', enum: ['contacted', 'replied', 'qualified', 'proposal_sent', 'negotiating', 'won', 'lost', 'nurturing'] },
        notes: { type: 'string' },
        next_followup_days: { type: 'number', description: 'Días para el próximo seguimiento' },
        deal_value_clp: { type: 'number' }
      },
      required: ['stage']
    }
  },
  {
    name: 'ver_pipeline',
    description: 'Muestra el estado actual del pipeline de ventas',
    input_schema: { type: 'object', properties: { stage: { type: 'string' } }, required: [] }
  },
  {
    name: 'ver_followups',
    description: 'Lista leads que necesitan seguimiento hoy o esta semana',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'agregar_nota',
    description: 'Agrega una nota a un lead',
    input_schema: {
      type: 'object',
      properties: {
        busqueda: { type: 'string' },
        nota: { type: 'string' }
      },
      required: ['busqueda', 'nota']
    }
  }
];

export async function handleEsperanza(chatId, message, sendMessage) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  async function executeTool(name, input) {
    switch (name) {
      case 'crear_lead': {
        const { data, error } = await supabase.from('esperanza_leads').insert({
          ...input,
          stage: 'new',
          last_contact: new Date().toISOString()
        }).select().single();
        if (error) return { error: error.message };
        return { ok: true, id: data.id, name: data.name };
      }
      case 'avanzar_lead': {
        let leadId = input.lead_id;
        if (!leadId && input.busqueda) {
          const { data } = await supabase.from('esperanza_leads')
            .select('id,name')
            .ilike('name', `%${input.busqueda}%`)
            .limit(1).single();
          if (!data) {
            const { data: byHandle } = await supabase.from('esperanza_leads')
              .select('id,name')
              .ilike('instagram_handle', `%${input.busqueda}%`)
              .limit(1).single();
            leadId = byHandle?.id;
          } else {
            leadId = data.id;
          }
        }
        if (!leadId) return { error: 'Lead no encontrado' };

        const update = {
          stage: input.stage,
          last_contact: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        if (input.notes) update.notes = input.notes;
        if (input.deal_value_clp) update.deal_value_clp = input.deal_value_clp;
        if (input.next_followup_days) {
          const d = new Date();
          d.setDate(d.getDate() + input.next_followup_days);
          update.next_followup = d.toISOString();
        }
        if (input.stage === 'won') update.won_at = new Date().toISOString();

        const { error } = await supabase.from('esperanza_leads').update(update).eq('id', leadId);
        if (error) return { error: error.message };

        await supabase.from('esperanza_activity').insert({
          lead_id: leadId,
          action: 'stage_change',
          detail: `→ ${input.stage}`,
          outcome: input.notes
        });
        return { ok: true };
      }
      case 'ver_pipeline': {
        const { data } = await supabase.from('esperanza_pipeline_summary').select('*');
        return data || [];
      }
      case 'ver_followups': {
        const { data } = await supabase.from('esperanza_followups_today').select('*').limit(10);
        return data || [];
      }
      case 'agregar_nota': {
        const { data } = await supabase.from('esperanza_leads')
          .select('id,name,notes')
          .ilike('name', `%${input.busqueda}%`)
          .limit(1).single();
        if (!data) return { error: 'Lead no encontrado' };
        const { error } = await supabase.from('esperanza_leads')
          .update({ notes: `${data.notes || ''}\n[${new Date().toLocaleDateString('es-CL')}] ${input.nota}`.trim() })
          .eq('id', data.id);
        return error ? { error: error.message } : { ok: true, name: data.name };
      }
      default:
        return { error: 'Herramienta no encontrada' };
    }
  }

  const messages = [{ role: 'user', content: message }];
  let response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: ESPERANZA_PERSONA,
    tools: ESPERANZA_TOOLS,
    messages
  });

  while (response.stop_reason === 'tool_use') {
    const toolUses = response.content.filter(b => b.type === 'tool_use');
    const toolResults = [];
    for (const t of toolUses) {
      const result = await executeTool(t.name, t.input);
      toolResults.push({ type: 'tool_result', tool_use_id: t.id, content: JSON.stringify(result) });
    }
    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: toolResults });
    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: ESPERANZA_PERSONA,
      tools: ESPERANZA_TOOLS,
      messages
    });
  }

  const text = response.content.find(b => b.type === 'text')?.text || 'Sin respuesta';
  await sendMessage(chatId, `👩‍💼 *Esperanza — Ventas*\n\n${text}`);
}

// Comandos directos de Esperanza (desde /esp)
export async function handleEsperanzaCommand(chatId, subcommand, args, sendMessage) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  switch (subcommand) {
    case 'pipeline': {
      const { data } = await supabase.from('esperanza_pipeline_summary').select('*');
      if (!data?.length) {
        await sendMessage(chatId, '📭 Pipeline vacío — usa /esp nuevo para agregar leads.');
        return;
      }
      const STAGE_ICONS = {
        new: '🆕', contacted: '📤', replied: '💬', qualified: '✅',
        proposal_sent: '📋', negotiating: '🤝', won: '🏆', lost: '❌', nurturing: '🌱'
      };
      const lines = data.map(s =>
        `${STAGE_ICONS[s.stage] || '▪️'} *${s.stage}*: ${s.count}${s.total_value_clp ? ` — $${parseInt(s.total_value_clp).toLocaleString('es-CL')}` : ''}`
      );
      const total = data.reduce((s, r) => s + (parseInt(r.count) || 0), 0);
      await sendMessage(chatId, `👩‍💼 *Pipeline Esperanza — ${total} leads*\n\n${lines.join('\n')}`);
      break;
    }
    case 'followups': {
      const { data } = await supabase.from('esperanza_followups_today').select('*');
      if (!data?.length) {
        await sendMessage(chatId, '✅ No hay follow-ups pendientes hoy.');
        return;
      }
      const lines = data.map(l => {
        const fecha = l.next_followup ? new Date(l.next_followup).toLocaleDateString('es-CL') : 'hoy';
        return `• *${l.name}*${l.company ? ' — ' + l.company : ''} (${l.stage}) · ${fecha}`;
      });
      await sendMessage(chatId, `🔔 *Follow-ups pendientes (${data.length})*\n\n${lines.join('\n')}`);
      break;
    }
    default:
      await sendMessage(chatId,
        `👩‍💼 *Esperanza — Directora de Ventas*\n\n` +
        `/esp pipeline — Ver pipeline completo\n` +
        `/esp followups — Ver seguimientos de hoy\n\n` +
        `_O escríbeme directamente: "nuevo lead: @handle" o "actualiza a Kaya a qualified"_`
      );
  }
}
