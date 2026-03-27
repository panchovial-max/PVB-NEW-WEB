-- =============================================
-- PVB RED DE PROVEEDORES — Schema Supabase
-- =============================================

-- Categorías de proveedores
-- 'modelos'     → Modelos, actores, extras
-- 'vehiculos'   → Autos, motos, camiones, bicicletas, etc.
-- 'locaciones'  → Casas, galpones, exteriores, rooftops, etc.
-- 'utileria'    → Props, muebles, elementos de arte
-- 'vestuario'   → Ropa, accesorios, styling
-- 'catering'    → Alimentación en set
-- 'otro'        → Cualquier otro bien o servicio

-- Tabla principal de proveedores
CREATE TABLE IF NOT EXISTS providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Datos de contacto
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    instagram TEXT,          -- @handle, opcional

    -- Categoría principal
    category TEXT NOT NULL CHECK (category IN (
        'modelos', 'vehiculos', 'locaciones', 'utileria',
        'vestuario', 'catering', 'otro'
    )),

    -- Estado en la red
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',   -- recién registrado, pendiente revisión PVB
        'active',    -- aprobado, aparece en búsquedas
        'inactive',  -- desactivado temporalmente
        'rejected'   -- no apto para la red
    )),

    -- Notas internas PVB (no visibles al proveedor)
    internal_notes TEXT,

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets del proveedor (cada bien que ofrece)
-- Un proveedor puede tener múltiples assets
-- Ej: misma persona tiene bici de montaña Y bici de ruta
CREATE TABLE IF NOT EXISTS provider_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,

    -- Descripción del asset
    title TEXT NOT NULL,          -- "Bicicleta de montaña azul"
    description TEXT NOT NULL,    -- "Trek 2022, frenos hidráulicos, perfecto estado. Disponible con o sin casco."
    category TEXT NOT NULL,       -- hereda categoría del proveedor pero puede ser diferente

    -- Detalles específicos según categoría
    -- Para vehículos: marca, modelo, año, color, patente
    -- Para locaciones: m2, capacidad, dirección aproximada, tipo
    -- Para modelos: medidas, experiencia, idiomas
    details JSONB,                -- flexible por categoría

    -- Disponibilidad general (no calendario estricto)
    availability_notes TEXT,      -- "Disponible fines de semana y días hábiles previo aviso 48hrs"

    -- Zona geográfica
    location_city TEXT DEFAULT 'Santiago',
    location_notes TEXT,          -- "Sector oriente, no traslado al norte"

    -- Precio referencial (opcional, orientativo)
    -- No es tarifario fijo — cotización caso a caso
    price_reference TEXT,         -- "Desde $30.000/hr" o "Consultar según producción"

    -- Estado del asset
    is_active BOOLEAN DEFAULT TRUE,

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fotos de cada asset (Supabase Storage)
CREATE TABLE IF NOT EXISTS provider_asset_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID NOT NULL REFERENCES provider_assets(id) ON DELETE CASCADE,

    storage_path TEXT NOT NULL,   -- path en Supabase Storage bucket 'provider-assets'
    url TEXT,                     -- URL pública generada
    is_cover BOOLEAN DEFAULT FALSE, -- foto principal del asset
    sort_order INTEGER DEFAULT 0,

    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solicitudes de disponibilidad (cuando PVB consulta a un proveedor)
CREATE TABLE IF NOT EXISTS availability_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES providers(id),
    asset_id UUID REFERENCES provider_assets(id),

    -- Datos de la producción
    production_name TEXT,         -- nombre interno del proyecto
    requested_date DATE NOT NULL,
    duration_hours DECIMAL(4,1),  -- ej: 0.5, 2, 8
    location TEXT,                -- locación de la producción
    notes TEXT,                   -- detalles adicionales para el proveedor

    -- Respuesta del proveedor
    response TEXT CHECK (response IN ('available', 'unavailable', 'pending')),
    response_notes TEXT,          -- "Puedo pero necesito transporte de vuelta"
    quoted_price INTEGER,         -- precio ofrecido en CLP

    -- Comisión PVB (19%)
    commission_amount INTEGER GENERATED ALWAYS AS (ROUND(quoted_price * 0.19)) STORED,
    client_price INTEGER GENERATED ALWAYS AS (ROUND(quoted_price * 1.19)) STORED,

    -- Estado
    status TEXT DEFAULT 'sent' CHECK (status IN (
        'sent',      -- enviada al proveedor
        'confirmed', -- proveedor confirmó disponibilidad
        'booked',    -- producción confirmada
        'cancelled'  -- cancelada
    )),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_asset_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_requests ENABLE ROW LEVEL SECURITY;

-- Solo admins PVB ven todo
CREATE POLICY "Admins ven todo providers" ON providers
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins ven todo assets" ON provider_assets
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins ven todo fotos" ON provider_asset_photos
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins ven solicitudes" ON availability_requests
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Registro público (INSERT anónimo permitido para formulario de registro)
CREATE POLICY "Registro publico providers" ON providers
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Registro publico assets" ON provider_assets
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Registro publico fotos" ON provider_asset_photos
    FOR INSERT WITH CHECK (TRUE);

-- =============================================
-- STORAGE BUCKET (ejecutar en Supabase Dashboard)
-- =============================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('provider-assets', 'provider-assets', true);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_providers_category ON providers(category);
CREATE INDEX IF NOT EXISTS idx_providers_status ON providers(status);
CREATE INDEX IF NOT EXISTS idx_assets_provider ON provider_assets(provider_id);
CREATE INDEX IF NOT EXISTS idx_assets_category ON provider_assets(category);
CREATE INDEX IF NOT EXISTS idx_photos_asset ON provider_asset_photos(asset_id);
