// POST /api/send-provider-message
// Body: { provider_id, body } o { broadcast: true, body } para enviar a todos
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method !== 'POST') return res.status(405).end();

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
        provider_id: pid,
        from_role: 'admin',
        from_name: 'Francisco — PVB Estudio Creativo',
        body
    }));

    const { error } = await sb.from('provider_messages').insert(records);
    if (error) return res.status(500).json({ error: error.message });

    return res.json({ sent: providerIds.length });
}
