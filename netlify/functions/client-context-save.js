import { getSupabaseAdmin, validateUserSession } from './utils/supabase.js';

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_CLIENT_CONTEXT_DB_ID || 'ad371b671e4b426f937a0c94bd53b2ca';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, message: 'Method not allowed' }) };
  }

  try {
    // 1. Validate auth
    const authHeader = event.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: 'Unauthorized' }) };
    }
    const sessionToken = authHeader.substring(7);
    const user = await validateUserSession(sessionToken);
    if (!user) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: 'Invalid session' }) };
    }

    // 2. Parse body
    const body = JSON.parse(event.body || '{}');
    const {
      cliente, descripcion, industria, modelo, precio,
      cliente_ideal, problema, alternativas, objeciones,
      competidores, diferenciacion, resultado_clave, prueba_social,
      tono, palabras_evitar, referencias,
      objetivo, metrica, plazo, email_contacto
    } = body;

    if (!cliente) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'El nombre del cliente es requerido' }) };
    }

    const contextData = {
      user_id: user.id,
      cliente, descripcion, industria, modelo, precio,
      cliente_ideal, problema, alternativas, objeciones,
      competidores, diferenciacion, resultado_clave, prueba_social,
      tono, palabras_evitar, referencias,
      objetivo, metrica, plazo, email_contacto,
      status: 'Onboarding',
      created_at: new Date().toISOString()
    };

    // 3. Guardar en Supabase
    const supabase = getSupabaseAdmin();
    const { data: supabaseData, error: supabaseError } = await supabase
      .from('client_contexts')
      .upsert(contextData, { onConflict: 'user_id,cliente' })
      .select()
      .single();

    if (supabaseError) {
      console.error('Supabase error:', supabaseError);
      // No falla — continúa con Notion aunque Supabase falle
    }

    // 4. Sincronizar a Notion
    let notionPageUrl = null;
    if (NOTION_API_KEY) {
      try {
        const notionResponse = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            parent: { database_id: NOTION_DATABASE_ID },
            properties: {
              'Cliente':           { title: [{ text: { content: cliente || '' } }] },
              'Status':            { select: { name: 'Onboarding' } },
              'Email de Contacto': { email: email_contacto || null },
              'Industria':         industria ? { select: { name: industria } } : undefined,
              'Modelo de Negocio': modelo    ? { select: { name: modelo } }    : undefined,
              'Tono de Comunicación': tono   ? { select: { name: tono } }      : undefined,
              'Precio Promedio':        precio            ? { rich_text: [{ text: { content: precio } }] }            : undefined,
              'Descripción del Negocio': descripcion      ? { rich_text: [{ text: { content: descripcion } }] }       : undefined,
              'Cliente Ideal (ICP)':    cliente_ideal     ? { rich_text: [{ text: { content: cliente_ideal } }] }     : undefined,
              'Problema Principal':     problema          ? { rich_text: [{ text: { content: problema } }] }          : undefined,
              'Alternativas Actuales':  alternativas      ? { rich_text: [{ text: { content: alternativas } }] }      : undefined,
              'Objeciones Principales': objeciones        ? { rich_text: [{ text: { content: objeciones } }] }        : undefined,
              'Competidores':           competidores      ? { rich_text: [{ text: { content: competidores } }] }      : undefined,
              'Diferenciación':         diferenciacion    ? { rich_text: [{ text: { content: diferenciacion } }] }    : undefined,
              'Resultado Clave':        resultado_clave   ? { rich_text: [{ text: { content: resultado_clave } }] }   : undefined,
              'Prueba Social':          prueba_social     ? { rich_text: [{ text: { content: prueba_social } }] }     : undefined,
              'Palabras a Evitar':      palabras_evitar   ? { rich_text: [{ text: { content: palabras_evitar } }] }   : undefined,
              'Referencias de Copy':    referencias       ? { rich_text: [{ text: { content: referencias } }] }      : undefined,
              'Objetivo del Proyecto':  objetivo          ? { rich_text: [{ text: { content: objetivo } }] }          : undefined,
              'Métrica de Éxito':       metrica           ? { rich_text: [{ text: { content: metrica } }] }           : undefined,
              'Plazo':                  plazo             ? { rich_text: [{ text: { content: plazo } }] }             : undefined,
              'Fecha de Onboarding': {
                date: { start: new Date().toISOString().split('T')[0] }
              }
            }
          })
        });
        const notionResult = await notionResponse.json();
        if (notionResult.url) notionPageUrl = notionResult.url;
      } catch (notionError) {
        console.error('Notion sync error:', notionError);
        // No falla — Notion es secundario
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Contexto guardado correctamente',
        data: {
          supabase_id: supabaseData?.id || null,
          notion_url: notionPageUrl,
          synced_to_notion: !!notionPageUrl
        }
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Error interno del servidor', error: error.message })
    };
  }
};
