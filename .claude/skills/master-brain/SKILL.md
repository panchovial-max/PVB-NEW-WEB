---
name: master-brain
description: "SOP del Master Brain de PVB: arquitectura completa del sistema de agentes, cómo agregar nuevos agentes, cómo debuggear el bot de Telegram, y cómo mantener el ecosistema funcionando."
version: "2.0.0"
author: pvb-estudio-creativo
category: ai-engineering
tags:
  - master-brain
  - telegram
  - agents
  - pvb
  - architecture
  - maintenance
department: Engineering
models:
  recommended:
    - claude-sonnet-4-6
related_skills:
  - agent-orchestration
  - context-management
  - growth-council
  - n8n-automation
---

# Master Brain PVB — SOP Sistema Central

Arquitectura, mantenimiento y expansión del sistema de agentes IA de PVB Estudio Creativo.

## Arquitectura del Ecosistema

```
panchovial.com/masterbrain (dashboard)
        │
        ├── api/brain.js (Vercel Functions)
        │       ├── /api/brain → router principal
        │       ├── /api/telegram-bot → webhook Telegram
        │       ├── /api/notion-sync → sincronización Notion
        │       └── /api/send-notification → notificaciones
        │
        ├── Supabase (DB + Auth)
        │       ├── agents table (68 agentes)
        │       ├── routines table (9 rutinas)
        │       └── sessions table
        │
        └── Integraciones externas
                ├── Telegram Bot (@pvb_masterbrain_bot)
                ├── Notion (hub central)
                ├── ElevenLabs (voces Growth Council)
                └── Groq Whisper (transcripción audio)
```

## Bot de Telegram — Comandos y Routing

### Comandos disponibles
| Comando | Función | Agente |
|---|---|---|
| `/ping` | Health check | Sistema |
| `/growth-council [tema]` | Convoca consejo estratégico | Growth Council |
| `/propuesta [cliente]` | Genera propuesta comercial | pvb-proposals |
| `/leads` | Estado del pipeline | pvb-growth-director |
| `/estado` | Resumen diario del negocio | Master Brain |

### Cómo funciona el routing
```javascript
// api/telegram-bot.js
1. Recibe update de Telegram
2. Detecta tipo: texto / voz / comando / foto
3. Si es voz → transcribe con Groq Whisper
4. Router analiza intención
5. Ejecuta agente correspondiente
6. Devuelve respuesta al chat
```

### Variables de entorno requeridas
```
TELEGRAM_BOT_TOKEN=     # Bot token de @BotFather
OWNER_CHAT_ID=          # Chat ID de Pancho (para comandos privados)
ANTHROPIC_API_KEY=      # Para agentes Claude
GROQ_API_KEY=           # Para transcripción de voz
ELEVENLABS_API_KEY=     # Para respuestas de voz del Council
NOTION_TOKEN=           # Para acceso al hub Notion
```

## Modelos por Función

| Función | Modelo | Por qué |
|---|---|---|
| Growth Council | claude-opus-4-8 | Máxima calidad en estrategia |
| Respuestas Telegram | claude-sonnet-4-6 | Balance calidad/velocidad |
| Transcripción voz | groq/whisper-large-v3 | Rápido y gratuito |
| Clasificación simple | gemini-2.5-flash | Bajo costo |
| Síntesis de reportes | claude-haiku-4-5 | Económico para batch |

## Agregar Nuevo Agente al Master Brain

### 1. Crear el skill
```
.claude/skills/[nombre-agente]/SKILL.md
```

### 2. Registrar en Supabase
```sql
INSERT INTO agents (name, role, department, model, skill_path, status)
VALUES ('[nombre]', '[rol]', '[departamento]', '[modelo]', '.claude/skills/[nombre]', 'active');
```

### 3. Agregar al router en brain.js
```javascript
const AGENTS = {
  '[keyword]': {
    skill: '.claude/skills/[nombre]/SKILL.md',
    model: 'claude-sonnet-4-6',
    handler: handle[NombreAgente]
  }
};
```

### 4. Actualizar CLAUDE.md del proyecto
Agregar referencia al nuevo skill en la lista de skills disponibles.

## Debugging Common Issues

### Bot no responde en Telegram
```bash
# 1. Verificar webhook
curl https://api.telegram.org/bot{TOKEN}/getWebhookInfo

# 2. Test endpoint directo
curl -X POST https://panchovial.com/api/telegram-bot \
  -H "Content-Type: application/json" \
  -d '{"message":{"text":"/ping","chat":{"id":123}}}'

# 3. Ver logs en Vercel
vercel logs --follow
```

### Error OWNER_CHAT_ID undefined
```javascript
// Verificar en api/brain.js que exista:
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID;
// Y que esté en Vercel env vars
```

### Growth Council sin respuesta de voz
```javascript
// Verificar ELEVENLABS_API_KEY en Vercel
// Verificar que voice_id esté configurado por consejero
const VOICES = {
  droga5: 'voice_id_droga',
  rubin: 'voice_id_rubin',
  pm: 'voice_id_pm'
};
```

## Mantenimiento Mensual

Checklist de mantenimiento:
- [ ] Verificar que todos los env vars siguen activos en Vercel
- [ ] Revisar logs de errores del último mes
- [ ] Actualizar modelos si hay versiones nuevas (deprecation)
- [ ] Auditar costo de API usage (Anthropic + Groq + ElevenLabs)
- [ ] Compactar context management del bot
- [ ] Actualizar skills con nuevos SOPs aprendidos

## Roadmap Futuro

### Fase actual (v2)
- [x] Bot Telegram con routing inteligente
- [x] Growth Council multiagente
- [x] Transcripción de voz
- [x] Deploy en Vercel

### Próxima fase (v3)
- [ ] Integración OpenClaw para runtime real de agentes
- [ ] Dashboard visual de actividad de agentes (Conductor)
- [ ] Kanban de tareas asignadas a agentes
- [ ] Hermes Workspace como capa de orquestación
- [ ] Modelos gratuitos vía OpenRouter para tareas batch

### Fase visión (v4)
- [ ] Agentes autónomos 24/7 monitoreando clientes
- [ ] Auto-generación de reportes sin intervención manual
- [ ] Pipeline completo: lead → propuesta → onboarding → entrega
