import { createClient } from '@supabase/supabase-js';
import { validateAnyToken } from './utils/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const NOTION_KEY = process.env.NOTION_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const DB_BOLETAS = '3337ab7f-975e-81e2-a15d-fb2e6071f1bf';

async function analyzeImage(base64Data, contentType) {
  if (!ANTHROPIC_KEY) return null;

  const mediaType = contentType.replace('image/', '').replace('jpeg', 'jpeg');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: contentType, data: base64Data }
          },
          {
            type: 'text',
            text: `Analiza este documento chileno. Responde SOLO con un JSON valido, sin markdown ni texto extra:
{
  "tipo_documento": "Boleta" | "Factura" | "Nota Credito" | "Orden de Compra" | "Otro",
  "descripcion": "resumen breve del contenido (max 60 chars)",
  "monto_total": 0,
  "rut_emisor": "XX.XXX.XXX-X o null",
  "razon_social": "nombre emisor o null",
  "fecha": "YYYY-MM-DD o null",
  "categoria": "Produccion" | "Software" | "Oficina" | "Marketing" | "Profesional" | "Otro",
  "items": ["item1", "item2"],
  "confianza": "alta" | "media" | "baja"
}`
          }
        ]
      }]
    })
  });

  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return null;
  }
}

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.BASE_URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '{"error":"Method not allowed"}' };

  // Auth check (accepts Supabase JWT or Studio HMAC token)
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const auth = await validateAnyToken(authHeader);
  if (!auth) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing or invalid authorization token' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { imagen, filename, descripcion, monto, categoria, tipo_documento } = body;

    if (!imagen || !filename) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'imagen y filename requeridos' }) };
    }

    // 1. Upload image to Supabase Storage
    const base64Data = imagen.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const contentType = imagen.match(/^data:([^;]+);/)?.[1] || 'image/jpeg';

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const storagePath = `boletas/${month}/${timestamp}_${filename}`;

    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === 'boletas')) {
      await supabase.storage.createBucket('boletas', { public: true });
    }

    const { error: uploadError } = await supabase.storage
      .from('boletas')
      .upload(storagePath, buffer, { contentType, upsert: false });

    if (uploadError) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Upload failed: ' + uploadError.message }) };
    }

    // Generate permanent public URL
    const { data: urlData } = supabase.storage.from('boletas').getPublicUrl(storagePath);
    const publicUrl = urlData?.publicUrl || `${process.env.SUPABASE_URL}/storage/v1/object/public/boletas/${storagePath}`;

    // 2. Analyze image with Claude Vision (if API key available)
    const analysis = await analyzeImage(base64Data, contentType);

    // Use AI results, fallback to manual input
    const finalDesc = analysis?.descripcion || descripcion || 'Sin descripcion';
    const finalMonto = analysis?.monto_total || parseInt(monto) || 0;
    const finalCategoria = analysis?.categoria || categoria || 'Otro';
    const finalTipo = analysis?.tipo_documento || tipo_documento || 'Boleta';
    const finalFecha = analysis?.fecha || now.toISOString().split('T')[0];
    const finalRut = analysis?.rut_emisor || '';
    const finalRazon = analysis?.razon_social || '';
    const estado = analysis ? (analysis.confianza === 'baja' ? 'Error OCR' : 'Procesada') : 'Pendiente';

    // 3. Create Notion entry
    const properties = {
      'Descripcion': { title: [{ text: { content: finalDesc } }] },
      'Fecha': { date: { start: finalFecha } },
      'Monto CLP': { number: finalMonto },
      'Categoria': { select: { name: finalCategoria } },
      'Tipo Documento': { select: { name: finalTipo } },
      'Archivo Drive': { url: publicUrl },
      'Estado': { select: { name: estado } }
    };
    if (finalRut) properties['RUT Emisor'] = { rich_text: [{ text: { content: finalRut } }] };
    if (finalRazon) properties['Razon Social'] = { rich_text: [{ text: { content: finalRazon } }] };

    const childBlocks = [
      { object: 'block', type: 'image', image: { type: 'external', external: { url: publicUrl } } }
    ];

    if (analysis) {
      let ocrText = `OCR: ${finalTipo} — ${finalDesc}\nMonto: $${finalMonto.toLocaleString('es-CL')}\nRUT: ${finalRut || '?'} — ${finalRazon || '?'}`;
      if (analysis.items?.length) ocrText += '\nItems: ' + analysis.items.join(', ');
      ocrText += `\nConfianza: ${analysis.confianza}`;
      childBlocks.push({
        object: 'block', type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: ocrText } }] }
      });
    }

    childBlocks.push({
      object: 'block', type: 'paragraph',
      paragraph: { rich_text: [{ text: { content: `PVB Studio — ${finalFecha} ${now.toTimeString().slice(0, 5)}` } }] }
    });

    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ parent: { database_id: DB_BOLETAS }, properties, children: childBlocks })
    });
    const notionData = await notionRes.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        imageUrl: publicUrl,
        notionPageId: notionData.id,
        storagePath,
        analysis
      })
    };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
