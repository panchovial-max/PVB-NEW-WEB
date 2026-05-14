-- ============================================================
-- PVB Red de Proveedores — Schema Supabase
-- ============================================================

-- Proveedores (vinculado a auth.users via OAuth)
CREATE TABLE IF NOT EXISTS public.providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    instagram TEXT,
    category TEXT NOT NULL CHECK (category IN ('vehiculos','locaciones','modelos','utileria','vestuario','catering','otro')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','paused','contacted')),
    referral_code TEXT UNIQUE,                -- código único de referido de este proveedor
    referred_by TEXT,                         -- código del proveedor que lo refirió
    allow_referral_contact BOOLEAN DEFAULT false, -- autorización para contactar su red
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets de cada proveedor
CREATE TABLE IF NOT EXISTS public.provider_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    photos TEXT[],                            -- URLs de Supabase Storage
    status TEXT DEFAULT 'available' CHECK (status IN ('available','in_use','unavailable')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proyectos (creados por Francisco / admin)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    shoot_date DATE,
    location TEXT,
    categories_needed TEXT[],                 -- ['vehiculos','locaciones']
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft','matching','confirmed','done')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches proyecto ↔ proveedor
CREATE TABLE IF NOT EXISTS public.project_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
    asset_id UUID REFERENCES public.provider_assets(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'notified' CHECK (status IN ('notified','interested','confirmed','rejected')),
    notified_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    notes TEXT,
    UNIQUE(project_id, provider_id)
);

-- Referidos
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
    referred_provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    commission_pct NUMERIC DEFAULT 5,         -- % del valor del proyecto para el referidor
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── FUNCIONES ──

-- Generar código de referido al insertar proveedor
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.referral_code := 'PVB-' || UPPER(SUBSTRING(NEW.full_name FROM 1 FOR 3)) || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_referral_code
    BEFORE INSERT ON public.providers
    FOR EACH ROW
    WHEN (NEW.referral_code IS NULL)
    EXECUTE FUNCTION public.generate_referral_code();

-- Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER providers_updated_at
    BEFORE UPDATE ON public.providers
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── RLS ──
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Proveedor ve y edita solo su propio registro
CREATE POLICY "provider_self" ON public.providers
    FOR ALL USING (auth.uid() = user_id);

-- Proveedor ve y edita sus propios assets
CREATE POLICY "assets_owner" ON public.provider_assets
    FOR ALL USING (
        provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
    );

-- Proveedor ve sus propios matches
-- Proyectos: lectura pública para autenticados, escritura solo service_role
CREATE POLICY "projects_public_read" ON public.projects
    FOR SELECT USING (true);

CREATE POLICY "projects_admin_write" ON public.projects
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "matches_owner" ON public.project_matches
    FOR SELECT USING (
        provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
    );

-- Proveedor ve sus referidos
CREATE POLICY "referrals_owner" ON public.referrals
    FOR SELECT USING (referrer_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

-- ── ÍNDICES ──
CREATE INDEX IF NOT EXISTS idx_providers_category ON public.providers(category);
CREATE INDEX IF NOT EXISTS idx_providers_status ON public.providers(status);
CREATE INDEX IF NOT EXISTS idx_provider_assets_provider ON public.provider_assets(provider_id);
CREATE INDEX IF NOT EXISTS idx_matches_project ON public.project_matches(project_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.project_matches(status);
