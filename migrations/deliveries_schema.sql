-- ============================================================
-- PVB Entrega de Archivos — Schema Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS public.deliverables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'final' CHECK (type IN (
        'draft','review','final','asset','raw','export'
    )),
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending','available','downloaded','approved','revision_requested'
    )),
    version INTEGER DEFAULT 1,
    expires_at TIMESTAMPTZ,             -- fecha de expiración del acceso
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.delivery_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deliverable_id UUID REFERENCES public.deliverables(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,         -- path en Supabase Storage
    file_size BIGINT,                   -- bytes
    mime_type TEXT,
    duration_seconds INTEGER,           -- para video
    resolution TEXT,                    -- '4K','1080p', etc.
    format TEXT,                        -- 'MP4','MOV','JPG','PDF', etc.
    public_url TEXT,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.delivery_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deliverable_id UUID REFERENCES public.deliverables(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_role TEXT DEFAULT 'client' CHECK (user_role IN ('client','admin')),
    action TEXT NOT NULL CHECK (action IN ('approved','revision_requested','comment','downloaded')),
    body TEXT,
    timecode TEXT,                      -- para comentarios en video ('00:01:23')
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER deliverables_updated_at
    BEFORE UPDATE ON public.deliverables
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── RLS ──
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_feedback ENABLE ROW LEVEL SECURITY;

-- Admin total
CREATE POLICY "deliverables_admin" ON public.deliverables FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "files_admin" ON public.delivery_files FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "feedback_admin" ON public.delivery_feedback FOR ALL USING (auth.role() = 'service_role');

-- Cliente: ve sus entregas
CREATE POLICY "deliverables_client" ON public.deliverables
    FOR SELECT USING (auth.uid() = client_user_id);

-- Cliente: ve archivos de sus entregas
CREATE POLICY "files_client" ON public.delivery_files
    FOR SELECT USING (
        deliverable_id IN (
            SELECT id FROM public.deliverables WHERE client_user_id = auth.uid()
        )
    );

-- Cliente: puede dejar feedback
CREATE POLICY "feedback_client_read" ON public.delivery_feedback
    FOR SELECT USING (
        deliverable_id IN (
            SELECT id FROM public.deliverables WHERE client_user_id = auth.uid()
        )
    );
CREATE POLICY "feedback_client_insert" ON public.delivery_feedback
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── STORAGE bucket para entregas (privado) ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('deliveries', 'deliveries', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "deliveries_upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'deliveries' AND auth.uid() IS NOT NULL);

CREATE POLICY "deliveries_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'deliveries' AND auth.uid() IS NOT NULL);

-- ── ÍNDICES ──
CREATE INDEX IF NOT EXISTS idx_deliverables_project ON public.deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_client ON public.deliverables(client_user_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_status ON public.deliverables(status);
CREATE INDEX IF NOT EXISTS idx_files_deliverable ON public.delivery_files(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_feedback_deliverable ON public.delivery_feedback(deliverable_id);
