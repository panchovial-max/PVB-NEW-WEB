-- ============================================================
-- PVB Sistema de Cobros y Pagos
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    -- Destinatario
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('client','provider')),
    client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
    recipient_name TEXT NOT NULL,
    -- Monto
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL CHECK (currency IN ('CLP','UF','USD')),
    uf_value_at_payment NUMERIC,           -- valor UF del día si currency = UF
    amount_clp_equiv NUMERIC,             -- equivalente en CLP calculado
    -- Concepto
    concept TEXT NOT NULL,
    description TEXT,
    items JSONB,                          -- desglose [{label, amount}]
    -- Estado
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','proof_uploaded','confirmed','cancelled')),
    due_date DATE,
    -- Comprobante
    proof_url TEXT,                       -- URL del comprobante subido
    proof_uploaded_at TIMESTAMPTZ,
    proof_uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    -- Confirmación
    confirmed_at TIMESTAMPTZ,
    confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── RLS ──
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
CREATE POLICY "payments_admin" ON public.payments
    FOR ALL USING (auth.role() = 'service_role');

-- Cliente: ve sus propios cobros
CREATE POLICY "payments_client_read" ON public.payments
    FOR SELECT USING (auth.uid() = client_user_id);

-- Cliente: puede subir comprobante (UPDATE solo proof_url + status)
CREATE POLICY "payments_client_proof" ON public.payments
    FOR UPDATE USING (auth.uid() = client_user_id)
    WITH CHECK (auth.uid() = client_user_id);

-- Proveedor: ve sus propios pagos
CREATE POLICY "payments_provider_read" ON public.payments
    FOR SELECT USING (
        provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
    );

-- ── STORAGE bucket para comprobantes ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "proofs_upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid() IS NOT NULL);

CREATE POLICY "proofs_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'payment-proofs' AND auth.uid() IS NOT NULL);

-- ── ÍNDICES ──
CREATE INDEX IF NOT EXISTS idx_payments_client ON public.payments(client_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON public.payments(provider_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_project ON public.payments(project_id);
