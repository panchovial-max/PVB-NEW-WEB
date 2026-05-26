// GET /api/og-fetch?url=https://...
// Optional: &img=<encoded_img_url>  (from Pinterest bookmarklet direct capture)
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const url = req.query?.url;
    const bookmarkletImg = req.query?.img ? decodeURIComponent(req.query.img) : null;
    if (!url) return res.status(400).json({ error: 'url required' });

    let targetUrl;
    try { targetUrl = new URL(url); } catch {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    const host = targetUrl.hostname.replace('www.', '');
    const isPinterest = host.includes('pinterest');

    // Pinterest: use bookmarklet-captured image directly — their site blocks server-side scraping
    if (isPinterest && bookmarkletImg) {
        const pinId = targetUrl.pathname.match(/\/pin\/(\d+)/)?.[1];
        return res.json({
            image: bookmarkletImg,
            title: pinId ? `Pin ${pinId}` : 'Pin de Pinterest',
            description: null,
            source: 'pinterest',
            url: targetUrl.toString()
        });
    }

    try {
        const fetchHeaders = { 'Accept': 'text/html,application/xhtml+xml' };

        // Pinterest needs a real browser UA to return og: tags
        if (isPinterest) {
            fetchHeaders['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
            fetchHeaders['Accept-Language'] = 'es-CL,es;q=0.9';
        } else {
            fetchHeaders['User-Agent'] = 'Mozilla/5.0 (compatible; PVBBot/1.0)';
        }

        const response = await fetch(targetUrl.toString(), {
            headers: fetchHeaders,
            redirect: 'follow',
            signal: AbortSignal.timeout(8000)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const html = await response.text();
        const getMeta = (property) => {
            const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'))
                || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i'));
            return match?.[1] || null;
        };

        let image = getMeta('og:image') || getMeta('twitter:image') || null;
        let title = getMeta('og:title') || getMeta('twitter:title') || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || null;
        const description = getMeta('og:description') || getMeta('twitter:description') || null;

        // Pinterest fallback: extract image from JSON-LD or pinimg CDN src
        if (isPinterest && !image) {
            const jsonLd = html.match(/<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/i);
            if (jsonLd) {
                const imgMatch = jsonLd[1].match(/"url"\s*:\s*"(https:\/\/i\.pinimg\.com[^"]+)"/);
                if (imgMatch) image = imgMatch[1];
            }
            if (!image && bookmarkletImg) image = bookmarkletImg;
        }

        // Clean up Pinterest title (often "X on Pinterest")
        if (isPinterest && title) title = title.replace(/\s*[\|–-]\s*Pinterest.*$/i, '').trim() || title;

        const source = isPinterest ? 'pinterest'
            : host.includes('instagram') ? 'instagram'
            : host.includes('tiktok') ? 'tiktok'
            : host.includes('youtube') || host.includes('youtu.be') ? 'youtube'
            : 'url';

        return res.json({ image, title, description, source, url: targetUrl.toString() });
    } catch (err) {
        // If scraping failed but bookmarklet sent an image, still return something useful
        if (bookmarkletImg) {
            return res.json({ image: bookmarkletImg, title: 'Pin de Pinterest', description: null, source: 'pinterest', url });
        }
        return res.json({ image: null, title: null, description: null, source: 'url', url, error: err.message });
    }
}
