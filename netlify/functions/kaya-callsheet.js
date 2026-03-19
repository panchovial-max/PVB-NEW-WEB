const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // GET — traer todos los campos editados
  if (event.httpMethod === 'GET') {
    const { data, error } = await supabase
      .from('kaya_callsheet_edits')
      .select('field_id, value');

    if (error) return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  }

  // POST — guardar un campo editado
  if (event.httpMethod === 'POST') {
    const { field_id, value } = JSON.parse(event.body);

    const { error } = await supabase
      .from('kaya_callsheet_edits')
      .upsert({ field_id, value, updated_at: new Date().toISOString() }, { onConflict: 'field_id' });

    if (error) return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, headers, body: 'Method not allowed' };
};
