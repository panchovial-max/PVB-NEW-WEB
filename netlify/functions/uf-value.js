// GET /api/uf-value
// Retorna el valor de la UF del día desde mindicador.cl
// Cache de 1 hora para no saturar la API externa.

let cache = { value: null, date: null };

exports.handler = async () => {
    const today = new Date().toISOString().split('T')[0];

    if (cache.date === today && cache.value) {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ uf: cache.value, date: today, source: 'cache' })
        };
    }

    try {
        const res = await fetch('https://mindicador.cl/api/uf');
        const data = await res.json();
        const value = data?.serie?.[0]?.valor;

        if (!value) throw new Error('No UF value in response');

        cache = { value, date: today };

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ uf: value, date: today, source: 'mindicador.cl' })
        };
    } catch (err) {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ uf: null, error: err.message })
        };
    }
};
