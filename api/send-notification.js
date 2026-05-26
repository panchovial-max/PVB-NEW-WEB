// POST /api/send-notification — client notifications (email + Telegram + Slack)
// POST /api/send-notification?_route=notify — internal agent → Telegram (merged from telegram-notify)
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

function verifyBrainToken(token, secret) {
  if (!secret) return false;
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (decoded.scope !== 'brain') return false;
    if (decoded.expires < Date.now()) return false;
    const expectedSig = createHmac('sha256', secret).update(`brain:${decoded.expires}`).digest('hex');
    return decoded.sig === expectedSig;
  } catch { return false; }
}

function escapeMarkdown(text) {
  return String(text).replace(/[_*`[]/g, '\\$&');
}

const PORTAL_URL = 'https://panchovial.com';
const FROM_EMAIL = 'PVB Estudio Creativo <notificaciones@panchovial.com>';

function emailBase(content, link, cta) {
    return `<!DOCTYPE html><html><body style="background:#080808;color:#fff;font-family:sans-serif;margin:0;padding:40px 20px;">
<div style="max-width:600px;margin:0 auto;background:#111;border:1px solid #1f1f1f;padding:32px;">
<p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#666;margin:0 0 24px;">PVB ESTUDIO CREATIVO</p>
${content}
${link ? `<div style="margin-top:28px;"><a href="${link}" style="display:inline-block;background:#fff;color:#000;padding:12px 24px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;font-weight:600;">${cta}</a></div>` : ''}
<hr style="border:none;border-top:1px solid #1f1f1f;margin:28px 0;">
<p style="font-size:11px;color:#444;margin:0;"><a href="${PORTAL_URL}" style="color:#666;">panchovial.com</a></p>
</div></body></html>`;
}

const TEMPLATES = {
    payment_created: (d) => ({ subject: `💰 Nuevo cobro — ${d.title}`, html: emailBase(`<h2>Tienes un nuevo cobro pendiente</h2><p style="color:#aaa">${d.body || ''}</p><div style="background:#1a1a1a;border-left:3px solid #f5c518;padding:16px;margin:20px 0"><strong>${d.title}</strong></div>`, d.link, 'Ver cobro') }),
    payment_confirmed: (d) => ({ subject: `✅ Pago confirmado — ${d.title}`, html: emailBase(`<h2>Tu pago fue confirmado</h2><div style="background:#0d1f0d;border-left:3px solid #4caf50;padding:16px;margin:20px 0"><strong style="color:#4caf50">✓ ${d.title}</strong></div>`, d.link, 'Ver pagos') }),
    payment_rejected: (d) => ({ subject: `⚠ Comprobante rechazado`, html: emailBase(`<h2>Tu comprobante fue rechazado</h2><p style="color:#aaa">Por favor súbelo nuevamente.</p>`, d.link, 'Subir comprobante') }),
    stage_started: (d) => ({ subject: `▶ Nueva etapa: ${d.title}`, html: emailBase(`<h2>Tu proyecto avanza</h2><div style="background:#0d0f1f;border-left:3px solid #6a8fff;padding:16px;margin:20px 0"><strong style="color:#6a8fff">● ${d.title}</strong></div>`, d.link, 'Ver timeline') }),
    stage_completed: (d) => ({ subject: `✓ Etapa completada: ${d.title}`, html: emailBase(`<h2>¡Etapa completada!</h2><div style="background:#0d1f0d;border-left:3px solid #4caf50;padding:16px;margin:20px 0"><strong style="color:#4caf50">✓ ${d.title}</strong></div>`, d.link, 'Ver progreso') }),
    stage_blocked: (d) => ({ subject: `⚠ Etapa bloqueada: ${d.title}`, html: emailBase(`<h2>Una etapa está bloqueada</h2><div style="background:#1a0808;border-left:3px solid #e55;padding:16px;margin:20px 0"><strong style="color:#e55">⚠ ${d.title}</strong></div>`, d.link, 'Ver timeline') }),
    moodboard_comment: (d) => ({ subject: `💬 Nuevo comentario en moodboard`, html: emailBase(`<h2>Nuevo comentario</h2><div style="background:#1a1a1a;padding:16px;margin:20px 0">"${d.body}"<p style="color:#666;font-size:12px;margin-top:8px">— Francisco</p></div>`, d.link, 'Ver moodboard') }),
    feed_item: (d) => ({ subject: `📌 Nueva referencia compartida`, html: emailBase(`<h2>Francisco compartió una referencia</h2><div style="background:#1a1a1a;padding:16px;margin:20px 0"><strong>${d.title}</strong></div>`, d.link, 'Ver feed') }),
    proof_uploaded: (d) => ({ subject: `📎 Comprobante subido — ${d.title}`, html: emailBase(`<h2>El cliente subió un comprobante</h2><p style="color:#aaa">Revisa y confirma el pago.</p>`, d.link || `${PORTAL_URL}/payments?admin=1`, 'Ver comprobante') }),
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', process.env.BASE_URL || '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // ── Internal agent notify (merged from telegram-notify) ──
    if (req.query._route === 'notify') {
        const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
        const HMAC_SECRET = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
        const OWNER_CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_OWNER_CHAT_ID;
        const LEVEL_ICONS = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (!token || !verifyBrainToken(token, HMAC_SECRET)) return res.status(401).json({ error: 'Unauthorized' });
        const { message, level = 'info', chat_id } = req.body;
        if (!message) return res.status(400).json({ error: 'message required' });
        const targetChat = chat_id || OWNER_CHAT_ID;
        if (!targetChat) return res.status(400).json({ error: 'No chat_id configured' });
        try {
            const result = await fetch(`${TELEGRAM_API}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: targetChat, text: `${LEVEL_ICONS[level] || 'ℹ️'} ${escapeMarkdown(message)}`, parse_mode: 'Markdown' })
            }).then(r => r.json());
            if (!result.ok) throw new Error(result.description);
            return res.status(200).json({ ok: true });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    const { user_id, user_email, user_name, type, title, body, link, metadata } = req.body || {};
    if (!user_id || !type || !title) return res.status(400).json({ error: 'user_id, type, title required' });

    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const results = {};

    const { data: notif } = await sb.from('notifications').insert({
        user_id, type, title, body, link, metadata, email_sent: false
    }).select().single();
    results.notification = notif?.id;

    if (user_email && process.env.RESEND_API_KEY) {
        const template = TEMPLATES[type];
        if (template) {
            const { subject, html } = template({ title, body, link, user_name });
            const emailRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ from: FROM_EMAIL, to: user_email, subject, html })
            });
            if (emailRes.ok) {
                const emailData = await emailRes.json();
                results.email = emailData.id;
                if (notif?.id) await sb.from('notifications').update({ email_sent: true }).eq('id', notif.id);
            }
        }
    }

    // Notificar a Pancho por Slack (#pvb-ops)
    const SLACK_CRITICAL = ['proof_uploaded', 'payment_confirmed', 'payment_rejected', 'stage_blocked'];
    if (process.env.SLACK_WEBHOOK_URL && SLACK_CRITICAL.includes(type)) {
        const icons = { proof_uploaded: '📎', payment_confirmed: '✅', payment_rejected: '⚠️', stage_blocked: '🔴' };
        const nombre = user_name || user_email || 'Cliente';
        await fetch(process.env.SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: `${icons[type]} *${title}*`,
                blocks: [
                    { type: 'section', text: { type: 'mrkdwn', text: `${icons[type]} *${title}*\n👤 ${nombre}${body ? '\n' + body : ''}` } },
                    ...(link ? [{ type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: 'Ver' }, url: link }] }] : []),
                ],
            }),
        });
        results.slack = 'sent';
    }

    // Notificar a Pancho por Telegram (@pvb_provee)
    if (process.env.TELEGRAM_PROVEE_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        const icons = { payment_created: '💰', payment_confirmed: '✅', payment_rejected: '⚠️', stage_started: '▶️', stage_completed: '✓', stage_blocked: '⚠️', proof_uploaded: '📎', moodboard_comment: '💬', feed_item: '📌' };
        const icon = icons[type] || '🔔';
        const nombre = user_name || user_email || 'Cliente';
        const msg = `${icon} *${title}*\n👤 ${nombre}${body ? '\n' + body : ''}${link ? '\n🔗 ' + link : ''}`;
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_PROVEE_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: msg, parse_mode: 'Markdown' })
        });
    }

    return res.json(results);
}
