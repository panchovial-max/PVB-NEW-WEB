-- ============================================================
-- PVB Moodboard Colaborativo — Schema Supabase
-- ============================================================

-- Moodboards (múltiples por proyecto)
CREATE TABLE IF NOT EXISTS public.moodboards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'general' CHECK (category IN (
        'general','locaciones','vestuario','iluminacion','color','camara','arte','otro'
    )),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items del moodboard
CREATE TABLE IF NOT EXISTS public.moodboard_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    moodboard_id UUID REFERENCES public.moodboards(id) ON DELETE CASCADE NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('pinterest','instagram','google','upload','url')),
    original_url TEXT,                         -- URL original del pin/post
    thumbnail_url TEXT,                        -- imagen extraída (og:image o storage URL)
    storage_path TEXT,                         -- path en Supabase Storage si es upload
    title TEXT,                                -- título extraído o dado por usuario
    description TEXT,
    tags TEXT[] DEFAULT '{}',                  -- ['color','locacion','vestuario',...]
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    added_by_role TEXT DEFAULT 'client' CHECK (added_by_role IN ('client','admin')),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios por item
CREATE TABLE IF NOT EXISTS public.moodboard_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES public.moodboard_items(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_role TEXT DEFAULT 'client' CHECK (user_role IN ('client','admin')),
    user_name TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TRIGGER updated_at ──
CREATE TRIGGER moodboards_updated_at
    BEFORE UPDATE ON public.moodboards
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── RLS ──
ALTER TABLE public.moodboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moodboard_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moodboard_comments ENABLE ROW LEVEL SECURITY;

-- Admin (service_role) acceso total
CREATE POLICY "moodboards_admin" ON public.moodboards
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "items_admin" ON public.moodboard_items
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "comments_admin" ON public.moodboard_comments
    FOR ALL USING (auth.role() = 'service_role');

-- Cliente ve sus moodboards
CREATE POLICY "moodboards_client_read" ON public.moodboards
    FOR SELECT USING (auth.uid() = client_id OR auth.uid() = created_by);

CREATE POLICY "moodboards_client_insert" ON public.moodboards
    FOR INSERT WITH CHECK (auth.uid() = client_id OR auth.uid() = created_by);

-- Cliente ve y agrega items a sus moodboards
CREATE POLICY "items_client_read" ON public.moodboard_items
    FOR SELECT USING (
        moodboard_id IN (
            SELECT id FROM public.moodboards
            WHERE client_id = auth.uid() OR created_by = auth.uid()
        )
    );

CREATE POLICY "items_client_insert" ON public.moodboard_items
    FOR INSERT WITH CHECK (
        moodboard_id IN (
            SELECT id FROM public.moodboards
            WHERE client_id = auth.uid() OR created_by = auth.uid()
        )
    );

-- Cliente actualiza solo status de sus items (aprobación)
CREATE POLICY "items_client_approve" ON public.moodboard_items
    FOR UPDATE USING (
        moodboard_id IN (
            SELECT id FROM public.moodboards
            WHERE client_id = auth.uid() OR created_by = auth.uid()
        )
    );

-- Comentarios
CREATE POLICY "comments_client_read" ON public.moodboard_comments
    FOR SELECT USING (
        item_id IN (
            SELECT mi.id FROM public.moodboard_items mi
            JOIN public.moodboards mb ON mb.id = mi.moodboard_id
            WHERE mb.client_id = auth.uid() OR mb.created_by = auth.uid()
        )
    );

CREATE POLICY "comments_client_insert" ON public.moodboard_comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── ÍNDICES ──
CREATE INDEX IF NOT EXISTS idx_moodboards_project ON public.moodboards(project_id);
CREATE INDEX IF NOT EXISTS idx_moodboards_client ON public.moodboards(client_id);
CREATE INDEX IF NOT EXISTS idx_items_moodboard ON public.moodboard_items(moodboard_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON public.moodboard_items(status);
CREATE INDEX IF NOT EXISTS idx_comments_item ON public.moodboard_comments(item_id);

-- Storage bucket para uploads directos
INSERT INTO storage.buckets (id, name, public)
VALUES ('moodboard-assets', 'moodboard-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "moodboard_uploads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'moodboard-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "moodboard_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'moodboard-assets');
