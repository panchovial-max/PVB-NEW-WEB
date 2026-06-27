-- Memoria de Estilo PVB
-- Almacena reglas permanentes que Pancho registra desde el tab Reportes.
-- Tipo 'never' = nunca hacer esto. Tipo 'change' = cambiar este patrón.
-- Estas reglas se inyectan en el system prompt de agentes creativos.

create table if not exists public.brain_style_memory (
  id          uuid        primary key default gen_random_uuid(),
  type        text        not null check (type in ('never', 'change')) default 'change',
  rule        text        not null,
  context     text,
  created_at  timestamptz not null default now()
);

alter table public.brain_style_memory enable row level security;

-- Reglas base — estética PVB
insert into public.brain_style_memory (type, rule, context) values
  ('never',  'Nunca usar colores saturados o vibrantes en fondos. Paleta: negro, blanco, grises, dorado discreto.', 'Identidad PVB'),
  ('never',  'Nunca sobrecargar composiciones. Máximo 3 elementos visuales por pieza.', 'Identidad PVB'),
  ('change', 'Siempre dejar espacio en blanco generoso — el silencio visual es parte del diseño.', 'Identidad PVB'),
  ('change', 'Tipografía: una sola familia por pieza, sin mezclar estilos decorativos.', 'Identidad PVB');
