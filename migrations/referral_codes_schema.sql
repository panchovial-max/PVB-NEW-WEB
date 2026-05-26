-- referral_codes — validación real de códigos de referido en client-onboarding
-- Ejecutar en Supabase SQL Editor: https://supabase.com/dashboard/project/krmoihryyvooymvhsuno/sql

CREATE TABLE IF NOT EXISTS public.referral_codes (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  code       TEXT        UNIQUE NOT NULL,           -- ej: PVB-JUA-1234
  active     BOOLEAN     DEFAULT true,
  owner_name TEXT,                                  -- nombre del referidor (opcional)
  owner_email TEXT,                                 -- email del referidor (opcional)
  uses_count INT         DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- Lectura pública de códigos activos (para validación anónima en onboarding)
CREATE POLICY "referral_codes_select_active"
  ON public.referral_codes FOR SELECT
  USING (active = true);

-- Solo service_role puede insertar/actualizar
CREATE POLICY "referral_codes_service_write"
  ON public.referral_codes FOR ALL
  USING (auth.role() = 'service_role');

-- Función para incrementar uses_count cuando se aplica un código
CREATE OR REPLACE FUNCTION public.use_referral_code(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.referral_codes
  SET uses_count = uses_count + 1
  WHERE code = p_code AND active = true;
  RETURN FOUND;
END;
$$;

-- Códigos semilla para empezar (Pancho puede agregar más desde el dashboard)
INSERT INTO public.referral_codes (code, owner_name, active) VALUES
  ('PVB-PAN-2026', 'Francisco Vial Brown', true),
  ('PVB-PVB-0001', 'PVB Estudio Creativo', true)
ON CONFLICT (code) DO NOTHING;
