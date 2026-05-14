// GET /api/og-fetch?url=https://...
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const url = req.query?.url;
    if (!url) return res.status(400).json({ error: 'url required' });

    let targetUrl;
    try { targetUrl = new URL(url); } catch {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    try {
        const response = await fetch(targetUrl.toString(), {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PVBBot/1.0)', 'Accept': 'text/html' },
            redirect: 'follow'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const html = await response.text();
        const getMeta = (property) => {
            const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'))
                || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i'));
            return match?.[1] || null;
        };

        const image = getMeta('og:image') || getMeta('twitter:image') || null;
        const title = getMeta('og:title') || getMeta('twitter:title') || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || null;
        const description = getMeta('og:description') || getMeta('twitter:description') || null;

        const host = targetUrl.hostname.replace('www.', '');
        const source = host.includes('pinterest') ? 'pinterest' : host.includes('instagram') ? 'instagram' : host.includes('google') ? 'google' : 'url';

        return res.json({ image, title, description, source, url: targetUrl.toString() });
    } catch (err) {
        return res.json({ image: null, title: null, description: null, source: 'url', url, error: err.message });
    }
}
