// POST /api/provider-match — matching proyecto → proveedores
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = req.headers['x-pvb-admin-key'];
    if (apiKey !== process.env.PVB_ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });

    const { project_id } = req.body || {};
    if (!project_id) return res.status(400).json({ error: 'project_id required' });

    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: project } = await sb.from('projects').select('*').eq('id', project_id).single();
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { data: providers } = await sb.from('providers')
        .select('id, full_name, phone, category, provider_assets(title)')
        .eq('status', 'active')
        .in('category', project.categories_needed || []);

    if (!providers?.length) return res.json({ matched: 0, message: 'No active providers found' });

    await sb.from('project_matches').upsert(
        providers.map(p => ({ project_id, provider_id: p.id, status: 'notified', notified_at: new Date().toISOString() })),
        { onConflict: 'project_id,provider_id' }
    );
    await sb.from('projects').update({ status: 'matching' }).eq('id', project_id);

    const links = providers.map(p => {
        const msg = encodeURIComponent(`Hola ${p.full_name.split(' ')[0]}! 👋 Soy Francisco de PVB.\n\nTenemos el proyecto *${project.title}* y tu perfil hace match. ¿Puedes participar?\n\nhttps://panchovial.com/proveedor-dashboard`);
        return { provider: p.full_name, phone: p.phone, category: p.category, whatsapp: `https://wa.me/${p.phone.replace(/\D/g,'')}?text=${msg}` };
    });

    return res.json({ project: project.title, matched: providers.length, providers: links });
}
