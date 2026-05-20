-- ============================================================
-- PVB Mensajería Interna Proveedores
-- ============================================================

CREATE TABLE IF NOT EXISTS public.provider_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
    from_role TEXT NOT NULL CHECK (from_role IN ('admin','provider')),
    from_name TEXT NOT NULL,
    body TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS ──
ALTER TABLE public.provider_messages ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
CREATE POLICY "messages_admin" ON public.provider_messages
    FOR ALL USING (auth.role() = 'service_role');

-- Proveedor: ve y escribe sus propios mensajes
CREATE POLICY "messages_provider_read" ON public.provider_messages
    FOR SELECT USING (
        provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
    );

CREATE POLICY "messages_provider_insert" ON public.provider_messages
    FOR INSERT WITH CHECK (
        provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
        AND from_role = 'provider'
    );

-- Proveedor puede marcar mensajes como leídos
CREATE POLICY "messages_provider_update" ON public.provider_messages
    FOR UPDATE USING (
        provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
    );

-- ── ÍNDICES ──
CREATE INDEX IF NOT EXISTS idx_messages_provider ON public.provider_messages(provider_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.provider_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.provider_messages(read);
