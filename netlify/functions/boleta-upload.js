import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const NOTION_KEY = process.env.NOTION_API_KEY;
const DB_BOLETAS = '3337ab7f-975e-81e2-a15d-fb2e6071f1bf';

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '{"error":"Method not allowed"}' };

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
    const ext = filename.split('.').pop() || 'jpg';

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const storagePath = `boletas/${month}/${timestamp}_${filename}`;

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === 'boletas')) {
      await supabase.storage.createBucket('boletas', { public: true });
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('boletas')
      .upload(storagePath, buffer, { contentType, upsert: false });

    if (uploadError) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Upload failed: ' + uploadError.message }) };
    }

    // 2. Get public URL
    const { data: urlData } = supabase.storage.from('boletas').getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    // 3. Create Notion entry with image
    const fecha = now.toISOString().split('T')[0];
    const notionBody = {
      parent: { database_id: DB_BOLETAS },
      properties: {
        'Descripcion': { title: [{ text: { content: descripcion || 'Sin descripcion' } }] },
        'Fecha': { date: { start: fecha } },
        'Monto CLP': { number: parseInt(monto) || 0 },
        'Categoria': { select: { name: categoria || 'Otro' } },
        'Tipo Documento': { select: { name: tipo_documento || 'Boleta' } },
        'Archivo Drive': { url: publicUrl },
        'Estado': { select: { name: 'Pendiente' } }
      },
      children: [
        {
          object: 'block',
          type: 'image',
          image: { type: 'external', external: { url: publicUrl } }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: { rich_text: [{ text: { content: `Subida desde PVB Studio — ${fecha} ${now.toTimeString().slice(0,5)}` } }] }
        }
      ]
    };

    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notionBody)
    });
    const notionData = await notionRes.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        imageUrl: publicUrl,
        notionPageId: notionData.id,
        storagePath
      })
    };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
