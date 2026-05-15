-- ============================================================
-- Notion → Supabase sync schema — PVB Estudio Creativo
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Boletas y Gastos
create table if not exists notion_boletas (
  id               uuid primary key default gen_random_uuid(),
  notion_id        text unique not null,
  nombre           text,
  tipo             text,          -- 'Boleta' | 'Gasto' | 'Factura'
  monto_clp        integer,
  estado           text,          -- 'Pendiente' | 'Procesada' | 'Pagada'
  fecha            date,
  proyecto_notion_id text,        -- FK referencial a notion_proyectos.notion_id
  proveedor        text,
  descripcion      text,
  last_edited_time timestamptz,
  synced_at        timestamptz default now()
);

-- Proyectos
create table if not exists notion_proyectos (
  id               uuid primary key default gen_random_uuid(),
  notion_id        text unique not null,
  nombre           text,
  cliente          text,
  tipo             text[],        -- multi-select
  estado           text,          -- 'Brief' | 'Pre-produccion' | 'Produccion' | 'Post-produccion' | 'Entregado'
  presupuesto_clp  integer,
  fecha_inicio     date,
  fecha_entrega    date,
  last_edited_time timestamptz,
  synced_at        timestamptz default now()
);

-- Suscripciones y Herramientas
create table if not exists notion_suscripciones (
  id               uuid primary key default gen_random_uuid(),
  notion_id        text unique not null,
  nombre           text,
  categoria        text,
  monto_clp        integer,
  frecuencia       text,          -- 'Mensual' | 'Anual' | 'Pago único'
  activa           boolean default true,
  fecha_renovacion date,
  last_edited_time timestamptz,
  synced_at        timestamptz default now()
);

-- Entregas
create table if not exists notion_entregas (
  id                 uuid primary key default gen_random_uuid(),
  notion_id          text unique not null,
  titulo             text,
  estado             text,        -- 'Pendiente' | 'En proceso' | 'Revisión' | 'Entregado'
  proyecto_notion_id text,
  deadline           date,
  prioridad          text,        -- 'Alta' | 'Media' | 'Baja'
  last_edited_time   timestamptz,
  synced_at          timestamptz default now()
);

-- Log de sincronizaciones
create table if not exists notion_sync_log (
  id            uuid primary key default gen_random_uuid(),
  db_name       text not null,
  trigger       text default 'webhook',  -- 'webhook' | 'full_sync' | 'manual'
  pages_synced  integer default 0,
  status        text default 'ok',       -- 'ok' | 'error'
  error         text,
  synced_at     timestamptz default now()
);

-- Índices para queries frecuentes del dashboard
create index if not exists idx_boletas_fecha on notion_boletas(fecha desc);
create index if not exists idx_boletas_estado on notion_boletas(estado);
create index if not exists idx_boletas_tipo on notion_boletas(tipo);
create index if not exists idx_proyectos_estado on notion_proyectos(estado);
create index if not exists idx_proyectos_fecha_entrega on notion_proyectos(fecha_entrega);
create index if not exists idx_entregas_deadline on notion_entregas(deadline);
create index if not exists idx_entregas_estado on notion_entregas(estado);
create index if not exists idx_sync_log_db on notion_sync_log(db_name, synced_at desc);

-- View: resumen financiero del mes actual
create or replace view v_resumen_mes as
select
  date_trunc('month', fecha) as mes,
  sum(case when tipo != 'Gasto' then monto_clp else 0 end) as ingresos_clp,
  sum(case when tipo = 'Gasto' then monto_clp else 0 end) as gastos_clp,
  sum(case when tipo != 'Gasto' then monto_clp else -monto_clp end) as neto_clp,
  count(*) filter (where tipo != 'Gasto') as n_boletas,
  count(*) filter (where tipo = 'Gasto') as n_gastos
from notion_boletas
where fecha is not null
group by 1
order by 1 desc;

-- View: suscripciones activas con costo mensualizado
create or replace view v_suscripciones_activas as
select
  nombre,
  categoria,
  frecuencia,
  monto_clp,
  case frecuencia
    when 'Anual'  then round(monto_clp / 12.0)
    when 'Mensual' then monto_clp
    else null
  end as costo_mensual_clp,
  fecha_renovacion
from notion_suscripciones
where activa = true
order by costo_mensual_clp desc nulls last;
