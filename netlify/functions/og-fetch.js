// GET /api/og-fetch?url=https://...
// Extrae og:image, og:title, og:description de cualquier URL pública.
// Detecta automáticamente Pinterest, Instagram, Google Images.

exports.handler = async (event) => {
    const url = event.queryStringParameters?.url;
    if (!url) return { statusCode: 400, body: 'url required' };

    let targetUrl;
    try { targetUrl = new URL(url); } catch {
        return { statusCode: 400, body: 'Invalid URL' };
    }

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    try {
        const res = await fetch(targetUrl.toString(), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; PVBBot/1.0)',
                'Accept': 'text/html,application/xhtml+xml'
            },
            redirect: 'follow'
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const html = await res.text();

        const getMeta = (property) => {
            const match = html.match(
                new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')
            ) || html.match(
                new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i')
            );
            return match?.[1] || null;
        };

        const image = getMeta('og:image') || getMeta('twitter:image') || null;
        const title = getMeta('og:title') || getMeta('twitter:title')
            || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || null;
        const description = getMeta('og:description') || getMeta('twitter:description') || null;

        // Detectar fuente
        const host = targetUrl.hostname.replace('www.', '');
        const source =
            host.includes('pinterest') ? 'pinterest' :
            host.includes('instagram') ? 'instagram' :
            host.includes('google') ? 'google' : 'url';

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ image, title, description, source, url: targetUrl.toString() })
        };
    } catch (err) {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ image: null, title: null, description: null, source: 'url', url, error: err.message })
        };
    }
};
