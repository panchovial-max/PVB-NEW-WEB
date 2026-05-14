-- ============================================================
-- PVB Project Timeline — Schema Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_stages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    stage_order INTEGER NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','blocked')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    due_date DATE,
    visible_to_client BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stage_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stage_id UUID REFERENCES public.project_stages(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER stages_updated_at
    BEFORE UPDATE ON public.project_stages
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── RLS ──
ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_milestones ENABLE ROW LEVEL SECURITY;

-- Admin total
CREATE POLICY "stages_admin" ON public.project_stages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "milestones_admin" ON public.stage_milestones FOR ALL USING (auth.role() = 'service_role');

-- Cliente lee etapas visibles de sus proyectos
CREATE POLICY "stages_client_read" ON public.project_stages
    FOR SELECT USING (
        visible_to_client = true
        AND project_id IN (
            SELECT id FROM public.projects WHERE id IN (
                SELECT project_id FROM public.payments WHERE client_user_id = auth.uid()
                UNION
                SELECT project_id FROM public.moodboards WHERE client_id = auth.uid()
                UNION
                SELECT project_id FROM public.feed_items WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "milestones_client_read" ON public.stage_milestones
    FOR SELECT USING (
        stage_id IN (
            SELECT id FROM public.project_stages WHERE visible_to_client = true
        )
    );

-- ── ÍNDICES ──
CREATE INDEX IF NOT EXISTS idx_stages_project ON public.project_stages(project_id);
CREATE INDEX IF NOT EXISTS idx_stages_order ON public.project_stages(stage_order);
CREATE INDEX IF NOT EXISTS idx_milestones_stage ON public.stage_milestones(stage_id);
