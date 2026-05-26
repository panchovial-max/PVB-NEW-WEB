# PVB Agent OS Execution Plan

## Objetivo

Convertir `agent-os.html` en una consola operativa para agentes PVB: ejecutar scripts allowlist, generar assets visuales, subir resultados a Google Drive, notificar por Telegram y registrar todo en memoria.

## Estado Actual

- Dashboard local: `http://localhost:8087/agent-os.html`
- Local runner: `http://localhost:8787`
- API serverless: `/api/agent-run`
- Tool registry: repos MCP y automatizaciones locales
- Skill matrix: skills asignables por agente
- Feedback loop: señales, memoria, sesiones y logs

## Conexiones Detectadas Localmente

- Supabase: configurado
- Anthropic: configurado
- Notion: configurado
- Telegram: configurado
- Adobe Firefly: pendiente
- Google Drive upload: pendiente `GOOGLE_REFRESH_TOKEN`

## Fase 1: Runner Local Seguro

El runner ejecuta solo scripts declarados en `local-agent-runner/server.js`.

Scripts iniciales:

- `pvb.check-agent-os`: valida `agent-os.js`
- `pvb.check-apis`: valida API `agent-run`
- `figma.build`: build de Figma MCP
- `aura.test`: test de AURA Agency OS

Reglas:

- No comandos libres desde el navegador.
- No escritura fuera de repos conocidos.
- Cada script devuelve `stdout`, `stderr`, `exit code`, inicio y fin.
- Cada ejecución se registra en logs del dashboard.

## Fase 2: Imagen + Drive + Telegram

Endpoint: `/api/agent-run`

Acción: `generate-image`

Flujo:

1. Recibe `agentId`, `prompt`, `projectName`.
2. Genera imagen con Adobe Firefly.
3. Busca carpeta de Drive por proyecto en Notion si aplica.
4. Sube imagen a Google Drive.
5. Hace el archivo visible.
6. Envía link por Telegram.
7. Devuelve preview, Drive link, filename y estado Telegram.

Variables requeridas:

- `ADOBE_CLIENT_ID`
- `ADOBE_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `TELEGRAM_BOT_TOKEN` o `TELEGRAM_TASKS_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `NOTION_TOKEN` o `NOTION_API_KEY`

## Fase 3: Cancelación

Tipos de cancelación:

- Output pendiente de una misión: elimina memoria pendiente y marca sesión como cancelada.
- Run de imagen en cliente: marca la corrida como cancelada y descarta el resultado si vuelve tarde.

Limitación actual:

- Si `/api/agent-run` ya está ejecutando Firefly/Drive, no se aborta el request en servidor. Se ignora el resultado al volver. Para abort real necesitamos job queue con IDs persistidos.

## Fase 4: Próximo Paso Técnico

Crear una cola real:

- Tabla `agent_runs` en Supabase.
- Estados: `queued`, `running`, `completed`, `failed`, `cancelled`.
- Endpoint `POST /api/agent-run` crea run.
- Endpoint `POST /api/agent-run/:id/cancel` cancela.
- Worker local procesa runs.
- Dashboard hace polling por estado.

Esto permite cancelar de verdad antes de que el worker tome el job.

## Fase 4 Implementada

Archivos:

- `migrations/agent_runs_schema.sql`
- `api/_agent-run.js`
- `local-agent-runner/server.js`
- `agent-os.html`
- `agent-os.js`

Acciones API nuevas en `/api/agent-run`:

- `queue-image`
- `queue-script`
- `list-runs`
- `get-run`
- `cancel-run`

Runner local:

- `GET /connections`
- `GET /scripts`
- `POST /run`
- `POST /runs/process-once`

Dashboard:

- Encolar script
- Procesar cola una vez
- Actualizar runs
- Cancelar run queued/running

Estado pendiente:

La tabla `agent_runs` aun debe aplicarse en Supabase. Hasta aplicar la migración, el runner responde:

```txt
Could not find the table 'public.agent_runs' in the schema cache
```

Para activar la cola:

1. Abrir Supabase SQL Editor.
2. Ejecutar `migrations/agent_runs_schema.sql`.
3. Volver al dashboard.
4. Encolar script.
5. Presionar `Procesar cola una vez`.
