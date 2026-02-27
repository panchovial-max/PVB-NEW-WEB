-- Tabla: client_contexts
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.client_contexts (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  -- Negocio
  cliente           TEXT NOT NULL,
  email_contacto    TEXT,
  industria         TEXT,
  modelo            TEXT,
  precio            TEXT,
  descripcion       TEXT,

  -- Audiencia
  cliente_ideal     TEXT,
  problema          TEXT,
  alternativas      TEXT,
  objeciones        TEXT,

  -- Posicionamiento
  competidores      TEXT,
  diferenciacion    TEXT,
  resultado_clave   TEXT,
  prueba_social     TEXT,

  -- Tono
  tono              TEXT,
  palabras_evitar   TEXT,
  referencias       TEXT,

  -- Objetivos
  objetivo          TEXT,
  metrica           TEXT,
  plazo             TEXT,

  -- Meta
  status            TEXT DEFAULT 'Onboarding',
  notion_page_id    TEXT,

  UNIQUE(user_id, cliente)
);

-- RLS
ALTER TABLE public.client_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own client contexts"
  ON public.client_contexts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_contexts_updated_at
  BEFORE UPDATE ON public.client_contexts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
