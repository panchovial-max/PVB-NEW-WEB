---
name: context-management
description: "Best practices para manejar el contexto en Claude Code: cuándo compactar, cómo estructurar CLAUDE.md, sistema de memoria entre sesiones, y cómo evitar el context overflow en proyectos largos."
version: "1.0.0"
author: pvb-estudio-creativo
category: ai-engineering
tags:
  - context
  - memory
  - claude-code
  - performance
  - sessions
department: Engineering
models:
  recommended:
    - claude-sonnet-4-6
related_skills:
  - agent-orchestration
  - master-brain
---

# Context Management — PVB SOP

Sistema para mantener agentes eficientes sin perder información importante entre sesiones.

## La Ventana de Contexto

Claude tiene una ventana de ~1 millón de tokens. Cada mensaje gasta tokens:
- **Token** ≈ 1 palabra (aproximado)
- **Costo**: tokens usados = créditos gastados + ventana ocupada
- **Límite práctico**: a partir del 70% de la ventana, la calidad baja

### Señales de que necesitas gestionar contexto:
- Claude "olvida" instrucciones dadas hace mucho
- Respuestas se vuelven genéricas o inconsistentes
- El indicador de tokens en Claude Code llega al 70%+

## Estructura de Archivos de Contexto

### CLAUDE.md (siempre activo)
```markdown
# [Nombre Proyecto] — Claude Code Config

## Quién soy
[Rol del agente en 2-3 líneas]

## Contexto del proyecto
[Descripción en 3-4 líneas máx]

## Reglas siempre activas
- [Regla 1]
- [Regla 2]
- [Regla 3 máx]

## Referencias
- Ver memory.md para historial de sesiones
- Ver user.md para preferencias de Pancho
- Skills disponibles: /propuesta, /deploy, /growth-council
```

**Regla: CLAUDE.md no supera 200 líneas nunca.**

### memory.md (contexto histórico)
```markdown
# Memoria PVB — Actualización automática

## Proyectos activos
- Refugio Chiloé: [estado actual]
- [Proyecto 2]: [estado]

## Decisiones importantes
### 2026-06-01
- [Decisión tomada y por qué]

## Pendientes de seguimiento
- [ ] [Tarea 1]
- [ ] [Tarea 2]
```

### user.md (perfil Pancho)
```markdown
# Pancho — Perfil de trabajo

## Preferencias de comunicación
- Directo, sin rodeos
- Español chileno
- Respuestas cortas en Telegram, más largas en análisis

## Horarios típicos de trabajo
- Mañana: planning estratégico
- Tarde: producción y reuniones
- Noche: revisión y decisiones

## Tools preferidos
- Notion para gestión
- Telegram para coordinación
- Vercel para deploy
```

## Cuándo Ejecutar Cada Acción

### `/compact` — Compactar contexto
Ejecutar cuando:
- El indicador de tokens llega al 60-70%
- La conversación lleva más de 2 horas
- Antes de empezar una tarea nueva y compleja

**Qué hace**: Resume la conversación sin perder los hechos clave.  
**Qué NO hace**: No guarda en memoria permanente — eso es manual.

### Guardar en memory.md
Ejecutar al **final de cada sesión** con:
```
"Antes de cerrar, guarda en memory.md:
1. Las decisiones tomadas hoy
2. El estado actual de cada proyecto activo
3. Los pendientes para la próxima sesión"
```

### Resetear contexto
Solo cuando:
- La ventana está completamente llena y `/compact` no es suficiente
- Estás empezando un proyecto completamente diferente

**Antes de resetear:** Siempre guardar en memory.md primero.

## Cómo Cargar Contexto al Inicio de Sesión

Prompt de inicio estándar PVB:
```
"Lee CLAUDE.md, memory.md y user.md para tener contexto. 
Luego dime: ¿cuál es el estado actual de los proyectos activos 
y qué es lo más urgente para hoy?"
```

## Estrategia de Referencias Entre Archivos

En lugar de poner todo en CLAUDE.md, usa referencias:

```markdown
# CLAUDE.md
...
## Proyectos (ver memory.md para detalles)
## Estilo de comunicación (ver user.md)
## Proceso creativo PVB (ver .claude/skills/pvb-proceso-creativo/)
```

Esto mantiene CLAUDE.md liviano y la información detallada donde corresponde.

## Skills Como Memoria Especializada

Los skills son memoria de procedimientos. En lugar de explicar cada vez cómo hacer una propuesta:

1. Crear `skills/pvb-proposals/SKILL.md` con el SOP
2. Invocar con `/pvb-proposals` cuando se necesite
3. El agente lee el SOP y lo ejecuta

**Ventaja**: El skill no gasta contexto hasta que se invoca.

## Sesión de Optimización de Contexto (cada semana)

Ejecutar este skill periódicamente:
```
"Ejecuta una sesión de optimización:
1. Lee CLAUDE.md y verifica que no supere 200 líneas
2. Lee memory.md y archiva entradas de hace más de 30 días
3. Lee user.md y actualiza con nuevas preferencias observadas
4. Reporta qué cambios hiciste"
```
