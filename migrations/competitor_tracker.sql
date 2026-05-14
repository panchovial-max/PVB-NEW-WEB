-- Competitor Tracker — tablas para rastreo de competidores por cliente
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- 1. COMPETITOR_TRACKERS
-- Configuración por cliente: qué cuentas rastrear
-- ============================================
CREATE TABLE IF NOT EXISTS public.competitor_trackers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    instagram_handle TEXT NOT NULL,
    display_name TEXT,
    viral_threshold INTEGER DEFAULT 100000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, instagram_handle)
);

ALTER TABLE public.competitor_trackers ENABLE ROW LEVEL SECURITY;

-- Clientes solo ven sus propios trackers
CREATE POLICY "client_read_own_trackers" ON public.competitor_trackers
    FOR SELECT USING (auth.uid() = client_id);

-- Solo admins pueden insertar/actualizar/eliminar
CREATE POLICY "admin_manage_trackers" ON public.competitor_trackers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- ============================================
-- 2. VIRAL_POSTS
-- Posts virales detectados por el scanner
-- ============================================
CREATE TABLE IF NOT EXISTS public.viral_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tracker_id UUID REFERENCES public.competitor_trackers(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    instagram_handle TEXT NOT NULL,
    post_url TEXT NOT NULL UNIQUE,
    post_id TEXT,
    thumbnail_url TEXT,
    caption TEXT,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2),
    hook_analysis TEXT,
    why_viral TEXT,
    views_forecast INTEGER,
    posted_at TIMESTAMP WITH TIME ZONE,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notified BOOLEAN DEFAULT false
);

ALTER TABLE public.viral_posts ENABLE ROW LEVEL SECURITY;

-- Clientes ven solo sus posts
CREATE POLICY "client_read_own_viral_posts" ON public.viral_posts
    FOR SELECT USING (auth.uid() = client_id);

-- Service role puede insertar (desde Netlify function)
CREATE POLICY "service_insert_viral_posts" ON public.viral_posts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "service_update_viral_posts" ON public.viral_posts
    FOR UPDATE USING (true);

-- ============================================
-- Índices para performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_viral_posts_client ON public.viral_posts(client_id);
CREATE INDEX IF NOT EXISTS idx_viral_posts_detected ON public.viral_posts(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_trackers_client ON public.competitor_trackers(client_id);
