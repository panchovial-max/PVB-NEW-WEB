// POST /api/notify-new-provider
// Llamado por Supabase Webhook cuando se inserta un nuevo proveedor
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method !== 'POST') return res.status(405).end();

    const { record } = req.body || {};
    if (!record) return res.status(400).json({ error: 'No record' });

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    const CAT = {
        modelos:'🧍 Modelos/Talent', locaciones:'🏠 Locaciones',
        vehiculos:'🚗 Vehículos', utileria:'🪑 Utilería',
        vestuario:'👗 Vestuario', catering:'🍱 Catering', otro:'✨ Otro'
    };

    const msg = `🆕 *Nuevo proveedor registrado*

👤 *${record.full_name}*
📁 ${CAT[record.category] || record.category}
📱 ${record.phone || '—'}
✉️ ${record.email || '—'}
${record.instagram ? `📸 ${record.instagram}` : ''}
${record.referred_by ? `🔗 Referido por: ${record.referred_by}` : ''}

[Ver en Production CRM](https://panchovial.com/produccion)`;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'Markdown' })
    });

    return res.status(200).json({ ok: true });
}
