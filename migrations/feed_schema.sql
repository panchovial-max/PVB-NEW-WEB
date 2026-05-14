-- ============================================================
-- PVB Inspiration Feed — Schema Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS public.feed_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_role TEXT DEFAULT 'client' CHECK (user_role IN ('client','admin')),
    -- Contenido
    body TEXT,                          -- mensaje de texto libre
    content_url TEXT,                   -- link compartido
    thumbnail_url TEXT,                 -- og:image extraída
    link_title TEXT,
    link_description TEXT,
    source TEXT CHECK (source IN ('instagram','pinterest','tiktok','youtube','url','text')),
    -- Estado
    pinned BOOLEAN DEFAULT false,       -- Francisco puede fijar al moodboard
    pinned_to_moodboard UUID REFERENCES public.moodboards(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.feed_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES public.feed_items(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_name TEXT NOT NULL,
    emoji TEXT NOT NULL CHECK (emoji IN ('👍','❤️','🔥','✓','✕')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(item_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS public.feed_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES public.feed_items(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_role TEXT DEFAULT 'client' CHECK (user_role IN ('client','admin')),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS ──
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_replies ENABLE ROW LEVEL SECURITY;

-- Service role: acceso total
CREATE POLICY "feed_items_admin" ON public.feed_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "feed_reactions_admin" ON public.feed_reactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "feed_replies_admin" ON public.feed_replies FOR ALL USING (auth.role() = 'service_role');

-- Usuarios autenticados: leer y escribir en su proyecto
CREATE POLICY "feed_items_auth_read" ON public.feed_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "feed_items_auth_insert" ON public.feed_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "feed_items_auth_update" ON public.feed_items FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "feed_reactions_auth" ON public.feed_reactions FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "feed_replies_auth_read" ON public.feed_replies FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "feed_replies_auth_insert" ON public.feed_replies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── ÍNDICES ──
CREATE INDEX IF NOT EXISTS idx_feed_project ON public.feed_items(project_id);
CREATE INDEX IF NOT EXISTS idx_feed_created ON public.feed_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_item ON public.feed_reactions(item_id);
CREATE INDEX IF NOT EXISTS idx_replies_item ON public.feed_replies(item_id);
