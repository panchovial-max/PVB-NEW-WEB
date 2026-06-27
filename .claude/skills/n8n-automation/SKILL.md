---
name: n8n-automation
description: "Genera flujos de automatización N8N listos para importar en JSON. Desde CRM automation hasta workflows de notificaciones, lead nurturing, y pipelines de contenido para PVB."
version: "1.0.0"
author: pvb-estudio-creativo
category: automation
tags:
  - n8n
  - automation
  - workflow
  - json
  - crm
  - notifications
department: Engineering
models:
  recommended:
    - claude-sonnet-4-6
related_skills:
  - agent-orchestration
  - growth-council
---

# N8N Automation — PVB SOP

Genera flujos N8N en formato JSON importable directamente. Sin necesidad de construir nodo por nodo.

## Cómo Usar Este Skill

1. Describe el flujo que necesitas en lenguaje natural
2. El agente genera el JSON de N8N
3. Copiar el JSON → N8N → Import → Listo

## Flujos PVB Pre-diseñados

### Flujo 1: Lead → Esperanza → CRM → Follow-up
```
Trigger: Webhook (nuevo lead desde panchovial.com)
→ Esperanza Bot analiza el lead (Claude API)
→ Crea registro en Notion (CRM)
→ Envía notificación a Telegram de Pancho
→ Espera 3 días → Follow-up automático por WhatsApp
```

### Flujo 2: Contenido Social → Aprobación → Publicación
```
Trigger: Nuevo archivo en Google Drive /contenido-pendiente/
→ Genera caption (Claude API + skill humanizer)
→ Envía a Telegram de Pancho para aprobación
→ Si aprueba → Publica en Instagram/TikTok/LinkedIn
→ Registra en Notion con métricas iniciales
```

### Flujo 3: Reportes Semanales de Clientes
```
Trigger: Cron (cada lunes 8am)
→ Fetch métricas de Meta Business API
→ Fetch métricas de Google Analytics
→ Genera reporte con Claude (formato visual)
→ Envía PDF por email al cliente
→ Copia en Notion del proyecto
```

### Flujo 4: Monitoreo de Entregas
```
Trigger: Cron (cada día 9am)
→ Lee proyectos en Notion con deadline esta semana
→ Verifica estado de entrega
→ Si hay retraso → alerta a Telegram de Pancho
→ Si está on-time → daily summary silencioso
```

## Template JSON Base

```json
{
  "name": "[Nombre del flujo]",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "[ruta-webhook]",
        "responseMode": "onReceived",
        "responseData": "allEntries"
      },
      "id": "trigger-node",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    }
  ],
  "connections": {},
  "settings": {
    "executionOrder": "v1"
  }
}
```

## Principios de Diseño de Flujos

### Flujos Determinísticos (sin IA)
- Mejor para tareas repetitivas sin variabilidad
- Ejemplo: mover archivo → notificar → registrar
- Más baratos en tokens, más predecibles

### Flujos con IA (Claude en el loop)
- Para tareas que requieren criterio o generación de contenido
- Ejemplo: clasificar lead, generar caption, analizar brief
- Usar modelo económico (Haiku o Gemini) para tareas simples

### Anti-bucles
- Siempre limitar retries: máximo 3
- Agregar condición de salida en todos los loops
- Monitorear costo de tokens en flujos con IA

## Cómo Pedir un Flujo Nuevo

```
"Necesito un flujo N8N que:
1. Se active cuando [trigger]
2. Haga [acción 1]
3. Luego [acción 2]
4. Finalice con [output]

Plataformas involucradas: [Notion / Telegram / Meta / Google / etc]
¿Tiene que usar IA? Sí/No — para [qué parte]"
```

## Conexiones Disponibles en PVB N8N

| Servicio | Tipo | Para qué |
|---|---|---|
| Notion | API Key | CRM, proyectos, reportes |
| Telegram | Bot Token | Notificaciones, aprobaciones |
| Meta Business | Graph API | Métricas, publicación |
| Google Drive | OAuth | Archivos, carpetas |
| Supabase | REST API | DB del Client Portal |
| Vercel | API Key | Deploy automático |
| Claude API | API Key | Procesamiento IA en flujos |
| Groq | API Key | Transcripción de audio (Whisper) |

## Integración N8N ↔ Claude Code

Desde Claude Code puedes:
1. Diseñar el flujo aquí → exportar JSON → importar en N8N
2. Usar MCP de N8N para ejecutar flujos directamente desde Claude
3. Claude puede disparar workflows vía webhook trigger

```
"Dispara el flujo 'lead-followup' en N8N con estos datos: 
{nombre: 'Cliente X', email: 'x@empresa.cl', servicio: 'video'}"
```
