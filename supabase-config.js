// Supabase Configuration for PVB Estudio Creativo
// Replace these with your actual Supabase project credentials

const SUPABASE_CONFIG = {
    url: window.SUPABASE_URL || process.env.SUPABASE_URL || 'https://krmoihryyvooymvhsuno.supabase.co',
    anonKey: window.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_siFuszUIw5ibS-2Y15O4-Q_k484kZ8i'
};

// Initialize Supabase client (will be imported via CDN in HTML)
let supabase = null;

// Initialize Supabase when the library is loaded
function initSupabase() {
    if (typeof supabaseModule !== 'undefined') {
        supabase = supabaseModule.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('✅ Supabase initialized');
        return true;
    }
    return false;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_CONFIG, initSupabase };
}

