---
name: agent-orchestration
description: "Orquestación de equipos de agentes IA en Claude Code. Cómo coordinar sub-agentes en paralelo, pasar contexto entre agentes, y construir pipelines autónomos. SOP oficial para el ecosistema PVB."
version: "1.0.0"
author: pvb-estudio-creativo
category: ai-engineering
tags:
  - agents
  - orchestration
  - multi-agent
  - claude-code
  - automation
department: Engineering
models:
  recommended:
    - claude-opus-4-8
    - claude-sonnet-4-6
related_skills:
  - master-brain
  - growth-council
  - context-management
---

# Agent Orchestration — PVB SOP

Sistema para coordinar múltiples agentes IA trabajando en paralelo o en secuencia dentro del ecosistema PVB.

## Principios Fundamentales

### 1. El Skill es el SOP del Agente
Un skill = un SOP (Standard Operating Procedure) en markdown. El agente lee el skill y sabe exactamente qué hacer, cómo hacerlo y qué entregar. No improvisa — ejecuta el SOP.

**Regla de oro:** Si el agente necesita saber algo para hacer su trabajo, está en su skill o en su CLAUDE.md.

### 2. Arquitectura de Archivos
```
proyecto/
├── CLAUDE.md          ← instrucciones globales (MAX 200 líneas)
├── memory.md          ← contexto persistente entre sesiones
├── user.md            ← perfil del usuario (Pancho, preferencias, estilo)
└── .claude/
    ├── skills/        ← SOPs específicos por tarea
    │   ├── propuesta/
    │   ├── n8n/
    │   └── deploy/
    └── agents/        ← definiciones de agentes especializados
```

### 3. Jerarquía de Contexto
```
CLAUDE.md (siempre cargado)
    └── referencia → memory.md (contexto histórico)
    └── referencia → user.md (quién es Pancho)
    └── activa skill → cuando se invoca /skill-name
```

## Modos de Operación

### Modo Plan (antes de ejecutar)
Claude presenta el plan completo antes de hacer cambios. Úsalo cuando:
- La tarea toca múltiples archivos
- Hay riesgo de romper algo
- Quieres validar el approach antes de gastar tokens

```
"Antes de ejecutar, muéstrame el plan detallado paso a paso."
```

### Modo Bypass (ejecución autónoma)
Claude ejecuta sin pedir permiso en cada paso. Úsalo cuando:
- La tarea es clara y definida
- Ya validaste el plan
- Quieres velocidad máxima

```
"Ejecuta en bypass permissions — no me pidas confirmación en cada paso."
```

### Modo Loop (tareas repetitivas)
Claude ejecuta un skill en ciclos. Úsalo para:
- Monitoreo periódico (cada 30 min revisar leads)
- Optimización continua (cada sesión compactar CLAUDE.md)
- Reportes automáticos

```
"Ejecuta el skill [nombre] en loop cada 30 minutos."
```

## Patrones de Orquestación

### Patrón 1: Agente Principal → Sub-agentes Paralelos
```
Orquestador (Claude Code)
├── Sub-agente A: Research
├── Sub-agente B: Redacción  
└── Sub-agente C: Validación

→ Todos corren en paralelo, orquestador consolida
```

**Cuándo usarlo:** Tareas grandes divisibles en partes independientes.

**Prompt template:**
```
Vamos a ejecutar esto con 3 agentes en paralelo:
- Agente 1: [tarea A]
- Agente 2: [tarea B]  
- Agente 3: [tarea C]

Cuando terminen los tres, consolida los resultados en [formato de output].
```

### Patrón 2: Pipeline Secuencial
```
Input → Triage → Especialista → QA → Output
```

**Cuándo usarlo:** Tareas donde cada paso depende del anterior.

**Ejemplo PVB:**
```
Brief cliente → Growth Director (estrategia) → Creative Producer (brief creativo) → Senior Editor (producción)
```

### Patrón 3: Agente de Monitoreo + Acción
```
Monitor (corre cada X tiempo)
└── Detecta condición → dispara Agente de Acción
```

**Ejemplo PVB:**
```
Esperanza Bot detecta lead nuevo
└── Growth Director analiza fit
    └── Si califica → Propuesta Automática
    └── Si no → Respuesta de cortesía
```

## Cómo Pasar Contexto Entre Agentes

### Método 1: Archivo Compartido
```markdown
# Resultado de Agente A
[output del agente A]

# Para Agente B:
Usa el resultado anterior para [siguiente tarea].
```

### Método 2: Referencia de Skill
```
"Ejecuta el skill /growth-council con el contexto de este brief: [brief]"
```

### Método 3: Memory.md como Puente
```markdown
# memory.md
## Última sesión Growth Council (2026-06-01)
- Conclusión: Campaña Refugio Chiloé necesita más UGC
- Siguiente acción: Contratar 2 creators locales
- Responsable: Pancho
```

## Reglas de Contexto

- **CLAUDE.md**: máximo 200 líneas. Si crece más, mover info a archivos referenciados.
- **Compactar**: cuando el contexto llega al 70%, ejecutar `/compact`.
- **Resetear**: solo cuando sea estrictamente necesario — se pierde todo el contexto activo.
- **Skills**: cargar solo cuando se necesitan, no dejar todo pre-cargado.

## Anti-patrones a Evitar

❌ **No** cargar todos los skills al inicio — contamina el contexto  
❌ **No** hacer que el agente "improvise" sin SOP — siempre hay un skill  
❌ **No** dejar CLAUDE.md crecer sin límite — se degrada la performance  
❌ **No** olvidar guardar en memory.md las decisiones importantes de la sesión  
❌ **No** correr loops sin límite de tokens por perfil — configura límites en Hermes

## Integración con Hermes Workspace

Hermes Workspace extiende esto con:
- **Swarm**: múltiples agentes con roles fijos (Builder, Reviewer, Triage, Scribe, QA)
- **Kanban**: tareas asignadas automáticamente al agente correcto
- **Conductor**: visualización en tiempo real del trabajo de cada agente
- **Provider libre**: usar OpenRouter con modelos gratuitos (Gemini, Llama) para tareas rutinarias

```yaml
# config.yaml Hermes - modelo gratuito para tareas batch
model:
  default: gemini-2.5-flash
  provider: google
fallback_providers:
  - provider: nous
    model: hermes-3-llama-3.1-70b
```
