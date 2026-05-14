// GET /api/uf-value — valor UF del día desde mindicador.cl
let cache = { value: null, date: null };

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const today = new Date().toISOString().split('T')[0];

    if (cache.date === today && cache.value) {
        return res.json({ uf: cache.value, date: today, source: 'cache' });
    }

    try {
        const response = await fetch('https://mindicador.cl/api/uf');
        const data = await response.json();
        const value = data?.serie?.[0]?.valor;
        if (!value) throw new Error('No UF value');
        cache = { value, date: today };
        return res.json({ uf: value, date: today, source: 'mindicador.cl' });
    } catch (err) {
        return res.json({ uf: null, error: err.message });
    }
}
