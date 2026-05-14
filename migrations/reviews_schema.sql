-- ============================================================
-- PVB Aprobación de Cortes — Schema Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS public.video_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,            -- YouTube o Google Drive URL
    video_source TEXT NOT NULL CHECK (video_source IN ('youtube','drive','vimeo','url')),
    embed_id TEXT,                      -- ID extraído para embed
    version INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending_review' CHECK (status IN (
        'pending_review','in_review','approved','revision_requested','final'
    )),
    due_date DATE,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.review_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID REFERENCES public.video_reviews(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_role TEXT DEFAULT 'client' CHECK (user_role IN ('client','admin')),
    timecode_seconds NUMERIC,           -- segundo exacto del video
    timecode_label TEXT,                -- '00:01:23' formateado
    body TEXT NOT NULL,
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER reviews_updated_at
    BEFORE UPDATE ON public.video_reviews
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── RLS ──
ALTER TABLE public.video_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_admin" ON public.video_reviews FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "comments_admin" ON public.review_comments FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "reviews_client" ON public.video_reviews
    FOR SELECT USING (auth.uid() = client_user_id);

CREATE POLICY "reviews_client_update" ON public.video_reviews
    FOR UPDATE USING (auth.uid() = client_user_id);

CREATE POLICY "comments_client_read" ON public.review_comments
    FOR SELECT USING (
        review_id IN (SELECT id FROM public.video_reviews WHERE client_user_id = auth.uid())
    );

CREATE POLICY "comments_auth_insert" ON public.review_comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "comments_resolve" ON public.review_comments
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ── ÍNDICES ──
CREATE INDEX IF NOT EXISTS idx_reviews_project ON public.video_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client ON public.video_reviews(client_user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.video_reviews(status);
CREATE INDEX IF NOT EXISTS idx_comments_review ON public.review_comments(review_id);
CREATE INDEX IF NOT EXISTS idx_comments_timecode ON public.review_comments(timecode_seconds);
