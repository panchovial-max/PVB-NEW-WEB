// POST /api/provider-match
// Body: { project_id }
// Busca proveedores compatibles con el proyecto y genera links de WhatsApp para notificarlos.
// Uso: Francisco llama esto desde el admin cuando crea un proyecto nuevo.

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Solo admin puede llamar esto
    const apiKey = event.headers['x-pvb-admin-key'];
    if (apiKey !== process.env.PVB_ADMIN_KEY) {
        return { statusCode: 401, body: 'Unauthorized' };
    }

    let body;
    try { body = JSON.parse(event.body); } catch {
        return { statusCode: 400, body: 'Invalid JSON' };
    }

    const { project_id } = body;
    if (!project_id) return { statusCode: 400, body: 'project_id required' };

    // 1. Cargar proyecto
    const { data: project, error: projErr } = await supabase
        .from('projects')
        .select('*')
        .eq('id', project_id)
        .single();

    if (projErr || !project) {
        return { statusCode: 404, body: 'Project not found' };
    }

    // 2. Buscar proveedores activos que matcheen alguna categoría del proyecto
    const { data: providers } = await supabase
        .from('providers')
        .select('id, full_name, phone, email, category, provider_assets(title)')
        .eq('status', 'active')
        .in('category', project.categories_needed || []);

    if (!providers || providers.length === 0) {
        return {
            statusCode: 200,
            body: JSON.stringify({ matched: 0, message: 'No active providers found for this project.' })
        };
    }

    // 3. Crear registros de match en la DB
    const matchRecords = providers.map(p => ({
        project_id,
        provider_id: p.id,
        status: 'notified',
        notified_at: new Date().toISOString()
    }));

    await supabase
        .from('project_matches')
        .upsert(matchRecords, { onConflict: 'project_id,provider_id' });

    // 4. Actualizar status del proyecto
    await supabase
        .from('projects')
        .update({ status: 'matching' })
        .eq('id', project_id);

    // 5. Generar links de WhatsApp para que Francisco notifique manualmente
    const shootInfo = project.shoot_date ? ` · Fecha: ${project.shoot_date}` : '';
    const whatsappLinks = providers.map(p => {
        const assetList = (p.provider_assets || []).map(a => a.title).join(', ');
        const msg = encodeURIComponent(
            `Hola ${p.full_name.split(' ')[0]}! 👋 Soy Francisco de PVB Estudio Creativo.\n\n` +
            `Tenemos un proyecto que puede interesarte: *${project.title}*${shootInfo}.\n` +
            `${project.description || ''}\n\n` +
            `¿Estarías disponible? Entra a tu perfil para confirmar: https://panchovial.com/proveedor-dashboard.html`
        );
        return {
            provider: p.full_name,
            phone: p.phone,
            category: p.category,
            assets: assetList,
            whatsapp: `https://wa.me/${p.phone.replace(/\D/g, '')}?text=${msg}`
        };
    });

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            project: project.title,
            matched: providers.length,
            providers: whatsappLinks
        })
    };
};
