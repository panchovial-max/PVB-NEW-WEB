// POST /api/providers?action=notify|message|broadcast
// Consolida: notify-new-provider + send-provider-message
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

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
    if (req.method !== 'POST') return res.status(405).end();

    const action = req.query.action || req.body?.action;

    // ── Notificar nuevo proveedor (Supabase Webhook) ──
    if (action === 'notify') {
        const { record } = req.body || {};
        if (!record) return res.status(400).json({ error: 'No record' });
        const msg = `🆕 *Nuevo proveedor registrado*\n\n👤 *${record.full_name}*\n📁 ${CAT[record.category] || record.category}\n📱 ${record.phone || '—'}\n✉️ ${record.email || '—'}${record.instagram ? `\n📸 ${record.instagram}` : ''}${record.referred_by ? `\n🔗 Referido por: ${record.referred_by}` : ''}\n\n[Ver en Production CRM](https://panchovial.com/produccion)`;
        await sendTelegram(msg);
        return res.json({ ok: true });
    }

    // ── Webhook: proveedor respondió → notificar a Francisco ──
    if (action === 'provider-replied') {
        const { record } = req.body || {};
        if (!record || record.from_role !== 'provider') return res.json({ ok: true });

        // Buscar nombre del proveedor
        const { data: prov } = await sb.from('providers')
            .select('full_name, phone, category')
            .eq('id', record.provider_id).single();

        const msg = `💬 *Mensaje de proveedor*\n\n👤 *${prov?.full_name || record.from_name}*\n📁 ${CAT[prov?.category] || ''}\n\n"${record.body}"\n\n[Responder en el portal](https://panchovial.com/produccion)`;
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

    return res.status(400).json({ error: 'action required: notify|message|broadcast' });
}
