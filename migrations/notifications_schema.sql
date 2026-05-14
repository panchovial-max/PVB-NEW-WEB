-- ============================================================
-- PVB Notifications — Schema Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'payment_created','payment_confirmed','payment_rejected',
        'stage_started','stage_completed','stage_blocked',
        'moodboard_comment','moodboard_approved',
        'feed_item','proof_uploaded','milestone_completed'
    )),
    title TEXT NOT NULL,
    body TEXT,
    link TEXT,                          -- URL a donde ir al hacer clic
    read BOOLEAN DEFAULT false,
    email_sent BOOLEAN DEFAULT false,
    metadata JSONB,                     -- datos extra (project_id, etc)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS ──
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_own" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- ── ÍNDICES ──
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);
