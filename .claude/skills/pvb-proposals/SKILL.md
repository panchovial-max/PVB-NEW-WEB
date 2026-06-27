---
name: pvb-proposals
description: "Generación de propuestas comerciales PVB Estudio Creativo. Desde el brief hasta el documento final listo para enviar. Incluye pricing, estructura de presentación y cierre."
version: "1.0.0"
author: pvb-estudio-creativo
category: sales
tags:
  - proposals
  - sales
  - pricing
  - pvb
  - clients
department: Sales
models:
  recommended:
    - claude-sonnet-4-6
related_skills:
  - pvb-agent-orchestration
  - growth-council
---

# PVB Proposals — SOP Propuestas Comerciales

Genera propuestas profesionales para PVB Estudio Creativo en minutos.

## Datos que necesitas antes de generar

Pregunta al usuario si no están disponibles:
1. **Cliente**: nombre, industria, tamaño aproximado
2. **Servicio**: ¿qué quieren? (video, foto, social media, web, branding, pauta)
3. **Alcance**: ¿qué está incluido? ¿cuántos días de rodaje, cuántas piezas?
4. **Timeline**: fecha de entrega
5. **Budget aproximado** (si lo tienen)

## Estructura de la Propuesta PVB

### Sección 1: Resumen Ejecutivo (3-4 líneas)
- Qué van a recibir
- Por qué PVB es la elección correcta
- Una frase sobre el resultado esperado

### Sección 2: Entendimiento del Desafío
- El problema o objetivo del cliente en sus propios términos
- Qué está en juego (oportunidad que podrían perder)

### Sección 3: Nuestra Propuesta
Desglosar por fases:

**PRE-PRODUCCIÓN**
| Concepto | Detalle | Monto |
|---|---|---|
| Dirección creativa | Brief, moodboard, guión | $ XXX.XXX |
| Scouting | Locaciones, permisos | $ XXX.XXX |

**PRODUCCIÓN**
| Concepto | Detalle | Monto |
|---|---|---|
| Día de rodaje | X horas, X personas | $ XXX.XXX |
| Equipamiento | Cámara, luces, audio | INCLUIDO |

**POST-PRODUCCIÓN**
| Concepto | Detalle | Monto |
|---|---|---|
| Edición | X cortes, X revisiones | $ XXX.XXX |
| Color grade | Corrección y look | $ XXX.XXX |
| Audio mix | Música + locución | $ XXX.XXX |

### Sección 4: Inversión Total
```
TOTAL: $ X.XXX.XXX + IVA
Valores en CLP

Forma de pago:
- 50% al aprobar propuesta
- 50% contra entrega de archivos finales
```

### Sección 5: Timeline
```
Semana 1: Pre-producción y coordinación
Semana 2: Rodaje
Semana 3-4: Edición y correcciones
Entrega final: [fecha]
```

### Sección 6: Qué Incluye / Qué No Incluye
**Incluye:**
- [lista de lo incluido]

**No incluye** (cotización por separado):
- Locutores y actores
- Derechos musicales de autor
- Producción en regiones (se cotiza viáticos)

## Rangos de Precios PVB (referencia 2026)

### Video Corporativo
- Básico (1 día rodaje, 1-2 min): $800.000 - $1.500.000
- Estándar (2 días, 3-5 min, motion): $1.500.000 - $3.000.000
- Premium (3+ días, multicámara, post completo): $3.000.000+

### Fotografía Producto/Lifestyle
- Half day (20-30 fotos editadas): $400.000 - $700.000
- Full day (50+ fotos, 2 looks): $700.000 - $1.200.000

### Social Media (gestión mensual)
- Básico (2 plataformas, 12 posts/mes): $350.000/mes
- Estándar (3 plataformas, 20 posts, stories): $600.000/mes
- Full (todo incluido + pauta + reportes): $1.200.000/mes

### Branding Completo
- Logo + manual básico: $600.000 - $1.000.000
- Rebranding completo: $1.500.000 - $3.000.000

### Landing Page / Web
- One pager: $400.000 - $800.000
- Web completa (5-8 páginas): $800.000 - $2.000.000

## Formato de Entrega

La propuesta se genera en:
1. **Markdown** para revisión rápida en Claude Code
2. **PDF** exportado desde el markdown para enviar al cliente
3. **Notion** si el cliente tiene acceso al portal PVB

## Cierre Suave

Siempre terminar con:
```
¿Te genera alguna pregunta esta propuesta? 

Podemos agendar una llamada de 30 minutos para revisar 
detalles y ajustar según tus prioridades.

Francisco Vial Brown
Director — PVB Estudio Creativo
+56 9 XXXX XXXX | info@panchovial.com
```

## Notas Importantes

- Nunca comprometer más de lo que el equipo puede ejecutar
- Si el budget del cliente no alcanza: proponer versión reducida, no bajar calidad
- Plazo mínimo: 2 semanas desde aprobación para cualquier producción
- Revisiones incluidas: máximo 2 rondas de correcciones en post
