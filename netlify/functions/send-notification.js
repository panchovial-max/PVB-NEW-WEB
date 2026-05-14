// POST /api/send-notification
// Crea notificación in-app + envía email via Resend
// Body: { user_id, user_email, user_name, type, title, body, link, metadata }

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'PVB Estudio Creativo <notificaciones@panchovial.com>';
const PORTAL_URL = 'https://panchovial.com';

const EMAIL_TEMPLATES = {
    payment_created: (data) => ({
        subject: `💰 Nuevo cobro — ${data.title}`,
        html: emailBase(`
            <h2 style="margin:0 0 16px;">Tienes un nuevo cobro pendiente</h2>
            <p style="color:#aaa;line-height:1.6;">${data.body || 'Francisco ha generado un cobro para tu proyecto.'}</p>
            <div style="background:#1a1a1a;border:1px solid #2a2a2a;padding:16px;margin:20px 0;border-left:3px solid #f5c518;">
                <strong style="color:#fff;">${data.title}</strong>
            </div>
            <p style="color:#666;font-size:13px;">Sube tu comprobante de transferencia desde el portal para registrar el pago.</p>
        `, data.link, 'Ver cobro y subir comprobante')
    }),
    payment_confirmed: (data) => ({
        subject: `✅ Pago confirmado — ${data.title}`,
        html: emailBase(`
            <h2 style="margin:0 0 16px;">Tu pago fue confirmado</h2>
            <p style="color:#aaa;line-height:1.6;">Francisco confirmó la recepción de tu transferencia.</p>
            <div style="background:#0d1f0d;border:1px solid #1a3a1a;padding:16px;margin:20px 0;border-left:3px solid #4caf50;">
                <strong style="color:#4caf50;">✓ ${data.title}</strong>
            </div>
        `, data.link, 'Ver historial de pagos')
    }),
    payment_rejected: (data) => ({
        subject: `⚠ Comprobante rechazado — revisa tu pago`,
        html: emailBase(`
            <h2 style="margin:0 0 16px;">Tu comprobante fue rechazado</h2>
            <p style="color:#aaa;line-height:1.6;">Hubo un problema con el comprobante que subiste. Por favor súbelo nuevamente.</p>
            ${data.body ? `<p style="color:#e55;font-size:13px;">${data.body}</p>` : ''}
        `, data.link, 'Subir comprobante')
    }),
    stage_started: (data) => ({
        subject: `▶ Nueva etapa iniciada — ${data.title}`,
        html: emailBase(`
            <h2 style="margin:0 0 16px;">Tu proyecto avanza</h2>
            <p style="color:#aaa;line-height:1.6;">Se ha iniciado una nueva etapa en tu proyecto.</p>
            <div style="background:#0d0f1f;border:1px solid #1a2060;padding:16px;margin:20px 0;border-left:3px solid #6a8fff;">
                <strong style="color:#6a8fff;">● ${data.title}</strong>
                ${data.body ? `<p style="color:#aaa;margin-top:8px;font-size:13px;">${data.body}</p>` : ''}
            </div>
        `, data.link, 'Ver timeline del proyecto')
    }),
    stage_completed: (data) => ({
        subject: `✓ Etapa completada — ${data.title}`,
        html: emailBase(`
            <h2 style="margin:0 0 16px;">¡Etapa completada!</h2>
            <div style="background:#0d1f0d;border:1px solid #1a3a1a;padding:16px;margin:20px 0;border-left:3px solid #4caf50;">
                <strong style="color:#4caf50;">✓ ${data.title}</strong>
            </div>
            <p style="color:#aaa;line-height:1.6;">Tu proyecto sigue avanzando. Revisa el timeline para ver el estado actual.</p>
        `, data.link, 'Ver progreso del proyecto')
    }),
    stage_blocked: (data) => ({
        subject: `⚠ Etapa bloqueada — ${data.title}`,
        html: emailBase(`
            <h2 style="margin:0 0 16px;">Una etapa de tu proyecto está bloqueada</h2>
            <div style="background:#1a0808;border:1px solid #3a1010;padding:16px;margin:20px 0;border-left:3px solid #e55;">
                <strong style="color:#e55;">⚠ ${data.title}</strong>
                ${data.body ? `<p style="color:#aaa;margin-top:8px;font-size:13px;">${data.body}</p>` : ''}
            </div>
            <p style="color:#aaa;line-height:1.6;">Francisco te contactará pronto para resolver el bloqueo.</p>
        `, data.link, 'Ver timeline')
    }),
    moodboard_comment: (data) => ({
        subject: `💬 Nuevo comentario en tu moodboard`,
        html: emailBase(`
            <h2 style="margin:0 0 16px;">Nuevo comentario en tu moodboard</h2>
            <div style="background:#1a1a1a;border:1px solid #2a2a2a;padding:16px;margin:20px 0;border-radius:2px;">
                <p style="color:#fff;line-height:1.6;">"${data.body}"</p>
                <p style="color:#666;font-size:12px;margin-top:8px;">— Francisco</p>
            </div>
        `, data.link, 'Ver moodboard')
    }),
    moodboard_approved: (data) => ({
        subject: `✓ Referencia aprobada en tu moodboard`,
        html: emailBase(`
            <h2 style="margin:0 0 16px;">Francisco aprobó una referencia</h2>
            <p style="color:#aaa;line-height:1.6;">Una de tus referencias fue aprobada y queda parte del brief visual del proyecto.</p>
        `, data.link, 'Ver moodboard')
    }),
    feed_item: (data) => ({
        subject: `📌 Nueva referencia compartida`,
        html: emailBase(`
            <h2 style="margin:0 0 16px;">Francisco compartió una referencia</h2>
            <div style="background:#1a1a1a;border:1px solid #2a2a2a;padding:16px;margin:20px 0;">
                <strong style="color:#fff;">${data.title}</strong>
                ${data.body ? `<p style="color:#aaa;margin-top:8px;font-size:13px;">${data.body}</p>` : ''}
            </div>
        `, data.link, 'Ver en el feed')
    }),
    proof_uploaded: (data) => ({
        subject: `📎 Comprobante subido — ${data.title}`,
        html: emailBase(`
            <h2 style="margin:0 0 16px;">El cliente subió un comprobante</h2>
            <p style="color:#aaa;line-height:1.6;">Revisa y confirma el pago desde el panel de producción.</p>
            <div style="background:#0d0f1f;border:1px solid #1a2060;padding:16px;margin:20px 0;border-left:3px solid #6a8fff;">
                <strong style="color:#fff;">${data.title}</strong>
            </div>
        `, data.link || `${PORTAL_URL}/payments?admin=1`, 'Ver comprobante')
    }),
    milestone_completed: (data) => ({
        subject: `✓ Hito completado — ${data.title}`,
        html: emailBase(`
            <h2 style="margin:0 0 16px;">Hito completado</h2>
            <div style="background:#0d1f0d;border:1px solid #1a3a1a;padding:16px;margin:20px 0;border-left:3px solid #4caf50;">
                <strong style="color:#4caf50;">✓ ${data.title}</strong>
            </div>
        `, data.link, 'Ver timeline')
    })
};

function emailBase(content, link, cta) {
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="background:#080808;color:#fff;font-family:'Inter',sans-serif;margin:0;padding:0;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
    <tr><td style="background:#111;border:1px solid #1f1f1f;padding:32px;">
        <p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#666;margin:0 0 24px;">PVB ESTUDIO CREATIVO</p>
        ${content}
        ${link ? `<div style="margin-top:28px;">
            <a href="${link}" style="display:inline-block;background:#fff;color:#000;padding:12px 24px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;font-weight:600;">${cta}</a>
        </div>` : ''}
        <hr style="border:none;border-top:1px solid #1f1f1f;margin:28px 0;">
        <p style="font-size:11px;color:#444;line-height:1.6;margin:0;">
            Este mensaje fue enviado desde el portal de PVB Estudio Creativo.<br>
            <a href="${PORTAL_URL}" style="color:#666;">panchovial.com</a>
        </p>
    </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export const handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

    let body;
    try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: 'Invalid JSON' }; }

    const { user_id, user_email, user_name, type, title, body: msgBody, link, metadata } = body;
    if (!user_id || !type || !title) return { statusCode: 400, body: 'user_id, type, title required' };

    const results = { notification: null, email: null };

    // 1. Crear notificación in-app
    const { data: notif, error: notifErr } = await supabase.from('notifications').insert({
        user_id, type, title, body: msgBody, link, metadata, email_sent: false
    }).select().single();

    if (notifErr) { console.error('Notification error:', notifErr); }
    else results.notification = notif?.id;

    // 2. Enviar email si hay dirección
    if (user_email && RESEND_API_KEY) {
        const template = EMAIL_TEMPLATES[type];
        if (template) {
            const { subject, html } = template({ title, body: msgBody, link, user_name });
            try {
                const emailRes = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ from: FROM_EMAIL, to: user_email, subject, html })
                });
                const emailData = await emailRes.json();
                if (emailRes.ok) {
                    results.email = emailData.id;
                    if (notif?.id) {
                        await supabase.from('notifications').update({ email_sent: true }).eq('id', notif.id);
                    }
                } else {
                    console.error('Resend error:', emailData);
                }
            } catch (err) { console.error('Email send error:', err); }
        }
    }

    return { statusCode: 200, headers, body: JSON.stringify(results) };
};
