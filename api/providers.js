// POST /api/providers?action=notify|message|broadcast
// Consolida: notify-new-provider + send-provider-message
import { createClient } from '@supabase/supabase-js';

const NOTION_DB_PROVIDERS = 'a555f623-bb66-43fa-a7d0-a608007142ea';

const CAT_NOTION = {
    modelos:   'Talent/Modelos',
    locaciones:'Locaciones',
    vehiculos: 'Equipamiento',
    utileria:  'Equipamiento',
    vestuario: 'Diseño',
    catering:  null,
    mascotas:  null,
    otro:      null,
};

async function createNotionProvider(record) {
    const key = process.env.NOTION_API_KEY;
    if (!key) return;

    const categoria = CAT_NOTION[record.category] ?? null;
    const instagram = record.instagram
        ? (record.instagram.startsWith('http') ? record.instagram : `https://instagram.com/${record.instagram.replace('@','')}`)
        : undefined;

    const properties = {
        Proveedor: { title: [{ text: { content: record.full_name || '' } }] },
        Estado:    { select: { name: 'En evaluación' } },
        ...(record.email    && { Email:    { email: record.email } }),
        ...(record.phone    && { WhatsApp: { phone_number: record.phone }, Contacto: { rich_text: [{ text: { content: record.phone } }] } }),
        ...(instagram       && { Instagram: { url: instagram } }),
        ...(categoria       && { Categoría: { select: { name: categoria } } }),
        ...(record.referred_by && { Notas: { rich_text: [{ text: { content: `Referido por: ${record.referred_by}` } }] } }),
    };

    await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${key}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parent: { database_id: NOTION_DB_PROVIDERS }, properties }),
    });
}

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error('Supabase env vars are required');
    return createClient(url, key);
}

async function sendTelegram(msg) {
    const BOT = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT = process.env.TELEGRAM_CHAT_ID;
    if (!BOT || !CHAT) return;
    await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT, text: msg, parse_mode: 'Markdown' })
    });
}

const CAT = {
    modelos:'🧍 Modelos/Talent', locaciones:'🏠 Locaciones', vehiculos:'🚗 Vehículos',
    utileria:'🪑 Utilería', vestuario:'👗 Vestuario', catering:'🍱 Catering',
    mascotas:'🐾 Mascotas', otro:'✨ Otro'
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-pvb-admin-key');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).end();

    const action = req.query.action || req.body?.action;
    const needsSupabase = ['provider-replied', 'message', 'broadcast', 'match'].includes(action);
    const sb = needsSupabase ? getSupabase() : null;

    // ── Notificar nuevo proveedor (Supabase Webhook) ──
    if (action === 'notify') {
        const { record } = req.body || {};
        if (!record) return res.status(400).json({ error: 'No record' });
        const msg = `🆕 *Nuevo proveedor registrado*\n\n👤 *${record.full_name}*\n📁 ${CAT[record.category] || record.category}\n📱 ${record.phone || '—'}\n✉️ ${record.email || '—'}${record.instagram ? `\n📸 ${record.instagram}` : ''}${record.referred_by ? `\n🔗 Referido por: ${record.referred_by}` : ''}\n\n[Ver en Production CRM](https://panchovial.com/produccion)`;
        await Promise.all([sendTelegram(msg), createNotionProvider(record)]);
        return res.json({ ok: true });
    }

    // ── Setup webhook Telegram (llamar una vez) ──
    if (action === 'setup-webhook') {
        const BOT = process.env.TELEGRAM_BOT_TOKEN;
        if (!BOT) return res.json({ error: 'no token' });
        const r = await fetch(`https://api.telegram.org/bot${BOT}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: 'https://panchovial.com/api/telegram-bot' })
        });
        return res.json(await r.json());
    }

    // ── Webhook: proveedor respondió → notificar a Francisco ──
    if (action === 'provider-replied') {
        const { record } = req.body || {};
        if (!record || record.from_role !== 'provider') return res.json({ ok: true });

        // Buscar nombre del proveedor
        const { data: prov } = await sb.from('providers')
            .select('full_name, phone, category')
            .eq('id', record.provider_id).single();

        const msg = `💬 *Mensaje de proveedor*\n\n👤 *${prov?.full_name || record.from_name}*\n📁 ${CAT[prov?.category] || ''}\n\n"${record.body}"\n\nprovider_id:${record.provider_id}\n_Responde a este mensaje para contestar directo al portal_`;
        await sendTelegram(msg);
        return res.json({ ok: true });
    }

    // ── Enviar mensaje interno (individual o broadcast) ──
    if (action === 'message' || action === 'broadcast') {
        const { provider_id, broadcast, body } = req.body || {};
        if (!body) return res.status(400).json({ error: 'body required' });

        let providerIds = [];
        if (broadcast) {
            const { data } = await sb.from('providers').select('id');
            providerIds = (data || []).map(p => p.id);
        } else if (provider_id) {
            providerIds = [provider_id];
        } else {
            return res.status(400).json({ error: 'provider_id or broadcast required' });
        }

        const records = providerIds.map(pid => ({
            provider_id: pid, from_role: 'admin',
            from_name: 'Francisco — PVB Estudio Creativo', body
        }));

        const { error } = await sb.from('provider_messages').insert(records);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ sent: providerIds.length });
    }

    // ── Matching proyecto → proveedores (merged from provider-match) ──
    if (action === 'match') {
        const apiKey = req.headers['x-pvb-admin-key'];
        if (apiKey !== process.env.PVB_ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
        const { project_id } = req.body || {};
        if (!project_id) return res.status(400).json({ error: 'project_id required' });
        const { data: project } = await sb.from('projects').select('*').eq('id', project_id).single();
        if (!project) return res.status(404).json({ error: 'Project not found' });
        const { data: matched } = await sb.from('providers')
            .select('id, full_name, phone, category, provider_assets(title)')
            .eq('status', 'active')
            .in('category', project.categories_needed || []);
        if (!matched?.length) return res.json({ matched: 0, message: 'No active providers found' });
        await sb.from('project_matches').upsert(
            matched.map(p => ({ project_id, provider_id: p.id, status: 'notified', notified_at: new Date().toISOString() })),
            { onConflict: 'project_id,provider_id' }
        );
        await sb.from('projects').update({ status: 'matching' }).eq('id', project_id);
        const CAT_MAP = { modelos:'🧍 Modelos/Talent', locaciones:'🏠 Locaciones', vehiculos:'🚗 Vehículos', utileria:'🪑 Utilería', vestuario:'👗 Vestuario', catering:'🍱 Catering', mascotas:'🐾 Mascotas', otro:'✨ Otro' };
        const links = matched.map(p => {
            const msg = encodeURIComponent(`Hola ${p.full_name.split(' ')[0]}! 👋 Soy Francisco de PVB.\n\nTenemos el proyecto *${project.title}* y tu perfil hace match. ¿Puedes participar?\n\nhttps://panchovial.com/proveedor-dashboard`);
            return { provider: p.full_name, phone: p.phone, category: CAT_MAP[p.category] || p.category, whatsapp: `https://wa.me/${p.phone.replace(/\D/g,'')}?text=${msg}` };
        });
        return res.json({ project: project.title, matched: matched.length, providers: links });
    }

    return res.status(400).json({ error: 'action required: notify|message|broadcast|match' });
}
