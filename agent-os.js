const STORAGE_KEY = 'pvb_agent_os_state_v1';

function createId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const seedState = {
    selectedAgentId: 'claude-code',
    selectedLayerId: 'foundation',
    selectedToolFilter: 'all',
    imageRunId: null,
    connections: {
        openai: null,
        adobeFirefly: null,
        googleDrive: null,
        telegram: null,
        notionDriveLookup: null,
        anthropic: null,
        supabase: null,
        localRunner: null
    },
    agents: [
        {
            id: 'claude-code',
            name: 'Claude Code',
            role: 'Coding and refactors',
            status: 'ready',
            provider: 'Anthropic',
            scope: 'PVB-NEW-WEB',
            tools: 'filesystem, git, shell',
            goal: 'Implementar cambios con control de calidad y pruebas locales.'
        },
        {
            id: 'hermes',
            name: 'Hermes',
            role: 'Scheduled operations',
            status: 'scheduled',
            provider: 'Local agent',
            scope: 'Daily workflows',
            tools: 'calendar, reminders, reports',
            goal: 'Ejecutar rutinas diarias y entregar reportes accionables.'
        },
        {
            id: 'openclaw',
            name: 'OpenClaw',
            role: 'Research and execution',
            status: 'idle',
            provider: 'Open source',
            scope: 'Research workspace',
            tools: 'web, files, skills',
            goal: 'Investigar, resumir y convertir hallazgos en entregables.'
        },
        {
            id: 'codex',
            name: 'Codex',
            role: 'App builder',
            status: 'ready',
            provider: 'OpenAI',
            scope: 'Feature branches',
            tools: 'repo, tests, browser checks',
            goal: 'Crear prototipos, dashboards y automatizaciones para PVB.'
        },
        {
            id: 'aura-director',
            name: 'AURA Director',
            role: 'Strategic orchestration',
            status: 'ready',
            provider: 'AURA Agency OS',
            scope: 'Creative agency pipeline',
            tools: 'Notion, Figma, Slack, Supabase',
            goal: 'Coordinar estrategia, briefs, Brand DNA y ejecucion multi-agente.'
        },
        {
            id: 'creative-agent',
            name: 'Creative Agent',
            role: 'Brand and visual concepts',
            status: 'ready',
            provider: 'AURA Agency OS',
            scope: 'Creative direction',
            tools: 'Figma, Freepik, image prompts',
            goal: 'Crear conceptos visuales, moodboards y prompts alineados a marca.'
        },
        {
            id: 'production-manager',
            name: 'Production Manager',
            role: 'Production workflow',
            status: 'ready',
            provider: 'AURA Agency OS',
            scope: 'Pre, production and post',
            tools: 'DaVinci, Premiere, Photoshop, call sheets',
            goal: 'Ordenar presupuestos, crew, shot lists, call sheets y entregables.'
        },
        {
            id: 'colorist-agent',
            name: 'Colorist Agent',
            role: 'Color grading',
            status: 'available',
            provider: 'AURA Agency OS',
            scope: 'DaVinci Resolve',
            tools: 'Resolve MCP, Fusion, LUTs',
            goal: 'Analizar look, conformar timeline y preparar grading profesional.'
        },
        {
            id: 'voice-agent',
            name: 'Voice Agent',
            role: 'Voiceover and audio',
            status: 'available',
            provider: 'AURA Agency OS',
            scope: 'Audio branding',
            tools: 'ElevenLabs, scripts, voice settings',
            goal: 'Crear scripts, tono vocal y configuraciones de voiceover.'
        },
        {
            id: 'remotion-agent',
            name: 'Remotion Agent',
            role: 'Programmatic video',
            status: 'available',
            provider: 'AURA Agency OS',
            scope: 'Motion graphics',
            tools: 'Remotion, React, timing, storyboards',
            goal: 'Traducir briefs en storyboards y composiciones de video.'
        },
        {
            id: 'spec-crew',
            name: 'Spec Crew',
            role: 'Requirements, design and tests',
            status: 'ready',
            provider: 'KFC spec agents',
            scope: 'Spec workflow',
            tools: 'requirements, design, tasks, test, judge',
            goal: 'Convertir ideas en specs revisables y tareas implementables.'
        }
    ],
    layers: [
        {
            id: 'foundation',
            name: 'Foundation',
            status: 'online',
            owner: 'PVB local',
            pulse: 4,
            summary: 'Base local donde viven repo, archivos, permisos y ejecucion.',
            signal: 'Repo PVB-NEW-WEB montado',
            output: 'Entorno listo para prototipos y validacion.'
        },
        {
            id: 'memory',
            name: 'Memory',
            status: 'learning',
            owner: 'Agent OS',
            pulse: 3,
            summary: 'Guarda decisiones, outputs, sesiones y contexto reutilizable.',
            signal: 'Memorias locales activas',
            output: 'Busqueda persistente en el dashboard.'
        },
        {
            id: 'brain',
            name: 'Brain',
            status: 'routing',
            owner: 'Models',
            pulse: 2,
            summary: 'Capa que decide que modelo/agente toma cada mision.',
            signal: 'Ruteo manual por agente seleccionado',
            output: 'Command center conectado a perfiles de agentes.'
        },
        {
            id: 'agents',
            name: 'Agents',
            status: 'ready',
            owner: 'PVB ops',
            pulse: 4,
            summary: 'Equipo operativo de agentes con roles, scopes y herramientas.',
            signal: '4 agentes registrados',
            output: 'Claude Code, Hermes, OpenClaw y Codex.'
        },
        {
            id: 'mission',
            name: 'Mission Control',
            status: 'active',
            owner: 'Dashboard',
            pulse: 5,
            summary: 'Superficie central para lanzar misiones y ver estado.',
            signal: 'Dashboard interactivo cargado',
            output: 'Comandos, metricas, stack y actividad reciente.'
        },
        {
            id: 'production',
            name: 'Production',
            status: 'queued',
            owner: 'Workflows',
            pulse: 3,
            summary: 'Convierte outputs en tareas, entregables y flujos reales.',
            signal: 'Tareas por flujo activas',
            output: 'Plan, build y review conectados al tablero.'
        },
        {
            id: 'loop',
            name: 'Feedback Loop',
            status: 'watching',
            owner: 'Memory',
            pulse: 2,
            summary: 'Cada output vuelve a memoria para mejorar proximas sesiones.',
            signal: 'Snapshots disponibles',
            output: 'Misiones y snapshots se escriben como memoria.'
        }
    ],
    layerEvents: [
        { layerId: 'mission', title: 'Mission Control online', body: 'Vista principal lista para operar agentes.', createdAt: 'Ahora' },
        { layerId: 'memory', title: 'Memoria inicial cargada', body: 'Blueprint, reglas y requisitos disponibles.', createdAt: 'Hoy' },
        { layerId: 'agents', title: 'Agentes registrados', body: 'Roles y scopes iniciales configurados.', createdAt: 'Hoy' }
    ],
    skills: [
        {
            id: 'client-context',
            name: 'Client Context',
            category: 'marketing',
            agentId: 'aura-director',
            status: 'assigned',
            source: 'aura-agency-os/skills/client-context.md',
            description: 'Captura negocio, audiencia, posicionamiento, tono y objetivos antes de ejecutar marketing.'
        },
        {
            id: 'landing-page',
            name: 'Landing Page',
            category: 'marketing',
            agentId: 'creative-agent',
            status: 'assigned',
            source: 'aura-agency-os/skills/landing-page.md',
            description: 'Genera landing pages de conversion con estructura completa y copy orientado a resultados.'
        },
        {
            id: 'seo-audit',
            name: 'SEO Audit',
            category: 'marketing',
            agentId: 'openclaw',
            status: 'assigned',
            source: 'aura-agency-os/skills/seo-audit.md',
            description: 'Audita robots, sitemap, metadata, performance, contenido y problemas tecnicos SEO.'
        },
        {
            id: 'email-sequence',
            name: 'Email Sequence',
            category: 'marketing',
            agentId: 'hermes',
            status: 'assigned',
            source: 'aura-agency-os/skills/email-sequence.md',
            description: 'Crea secuencias de nurturing, onboarding, re-engagement, ventas y post-compra.'
        },
        {
            id: 'audio-branding',
            name: 'Audio Branding',
            category: 'delivery',
            agentId: 'voice-agent',
            status: 'assigned',
            source: 'aura-agency-os/skills/audio-branding.md',
            description: 'Define paleta sonora, mood, BPM, referencias y prompts musicales para marca.'
        },
        {
            id: 'campaign-planning',
            name: 'Campaign Planning',
            category: 'marketing',
            agentId: 'openclaw',
            status: 'available',
            source: 'ads-skills/ads-foundations/campaign-planning.md',
            description: 'Planificacion de campanas, canales, presupuesto, medicion y optimizacion.'
        },
        {
            id: 'whatsapp-messaging',
            name: 'WhatsApp Messaging',
            category: 'delivery',
            agentId: 'hermes',
            status: 'assigned',
            source: 'agent-skills-master/skills/whatsapp-messaging/SKILL.md',
            description: 'Envio, lectura, plantillas, media e inbox por Kapso Meta proxy.'
        },
        {
            id: 'whatsapp-flows',
            name: 'WhatsApp Flows',
            category: 'delivery',
            agentId: 'hermes',
            status: 'available',
            source: 'agent-skills-master/skills/whatsapp-flows/SKILL.md',
            description: 'Crear, editar, publicar y testear WhatsApp Flows con endpoints dinamicos.'
        },
        {
            id: 'kapso-automation',
            name: 'Kapso Automation',
            category: 'delivery',
            agentId: 'hermes',
            status: 'available',
            source: 'agent-skills-master/skills/kapso-automation/SKILL.md',
            description: 'Gestionar workflows, triggers, ejecuciones, funciones y bases D1.'
        },
        {
            id: 'tdd',
            name: 'Test Driven Development',
            category: 'engineering',
            agentId: 'codex',
            status: 'available',
            source: 'superpowers/skills/test-driven-development/SKILL.md',
            description: 'Desarrollo guiado por pruebas con ciclos pequenos y verificacion continua.'
        },
        {
            id: 'systematic-debugging',
            name: 'Systematic Debugging',
            category: 'engineering',
            agentId: 'claude-code',
            status: 'assigned',
            source: 'superpowers/skills/systematic-debugging/SKILL.md',
            description: 'Debugging por causa raiz, hipotesis verificables y evidencia reproducible.'
        },
        {
            id: 'code-review',
            name: 'Code Review',
            category: 'engineering',
            agentId: 'spec-crew',
            status: 'assigned',
            source: 'superpowers/agents/code-reviewer.md',
            description: 'Revision contra plan, arquitectura, riesgos, pruebas y calidad.'
        },
        {
            id: 'spec-workflow',
            name: 'Spec Workflow',
            category: 'engineering',
            agentId: 'spec-crew',
            status: 'assigned',
            source: 'PVB-NEW-WEB/.claude/agents/kfc',
            description: 'Requirements, design, tasks, implementation, judge y test agents.'
        }
    ],
    memories: [
        {
            title: 'Agent OS blueprint',
            body: 'Siete capas: foundation, memory, brain, agents, mission control, production surfaces y feedback loop.',
            tag: 'architecture',
            createdAt: '2026-05-25'
        },
        {
            title: 'PVB operating rule',
            body: 'Cada agente debe trabajar por proyecto, con permisos acotados y outputs guardados en memoria.',
            tag: 'governance',
            createdAt: '2026-05-25'
        },
        {
            title: 'Dashboard requirement',
            body: 'Debe mostrar agentes, historial, busqueda de memoria, tareas, estado y un command center central.',
            tag: 'ui',
            createdAt: '2026-05-25'
        }
    ],
    sessions: [
        {
            agentId: 'claude-code',
            title: 'Fix PVB deployment bugs',
            body: 'Se corrigieron rutas API, parsing de calendar.js y carga de providers.',
            createdAt: 'Hoy'
        },
        {
            agentId: 'openclaw',
            title: 'Agent OS video extraction',
            body: 'Se extrajo el enfoque de dashboard local con memoria persistente y feedback loop.',
            createdAt: 'Hoy'
        }
    ],
    tasks: [
        { lane: 'plan', priority: 'high', title: 'Definir agentes PVB', body: 'Roles, permisos, herramientas y carpetas permitidas.' },
        { lane: 'build', priority: 'medium', title: 'Conectar memoria real', body: 'Persistir outputs en Supabase, Obsidian o filesystem local.' },
        { lane: 'review', priority: 'low', title: 'Auditar permisos', body: 'Separar acciones seguras de acciones que requieren aprobacion humana.' }
    ],
    tools: [
        {
            id: 'figma-mcp',
            name: 'Figma MCP',
            category: 'mcp',
            status: 'active',
            agentId: 'codex',
            repo: 'grab-cursor-talk-to-figma-mcp',
            path: '/Users/franciscovialbrown/Documents/GitHub/grab-cursor-talk-to-figma-mcp',
            description: 'Leer archivos Figma, extraer nodos, componentes, estilos y exportar assets.'
        },
        {
            id: 'davinci-mcp',
            name: 'DaVinci Resolve MCP',
            category: 'mcp',
            status: 'available',
            agentId: 'openclaw',
            repo: 'davinci-resolve-mcp',
            path: '/Users/franciscovialbrown/Documents/GitHub/davinci-resolve-mcp',
            description: 'Control de timeline, Fusion, renders y workflow de postproduccion desde lenguaje natural.'
        },
        {
            id: 'photoshop-mcp',
            name: 'Photoshop MCP',
            category: 'mcp',
            status: 'available',
            agentId: 'codex',
            repo: 'photoshop-mcp',
            path: '/Users/franciscovialbrown/Documents/GitHub/photoshop-mcp',
            description: 'Automatizacion creativa para edicion y generacion de assets en Photoshop.'
        },
        {
            id: 'indesign-mcp',
            name: 'InDesign MCP',
            category: 'mcp',
            status: 'available',
            agentId: 'codex',
            repo: 'indesign-mcp-server',
            path: '/Users/franciscovialbrown/Documents/GitHub/indesign-mcp-server',
            description: '35+ herramientas MCP para publicaciones, documentos y automatizacion editorial.'
        },
        {
            id: 'notion-mcp',
            name: 'Notion MCP',
            category: 'mcp',
            status: 'active',
            agentId: 'hermes',
            repo: 'notion-mcp-server',
            path: '/Users/franciscovialbrown/Documents/GitHub/notion-mcp-server',
            description: 'Lectura/escritura de bases, tareas, briefs y knowledge base de Notion.'
        },
        {
            id: 'obsidian-mcp',
            name: 'Obsidian MCP',
            category: 'mcp',
            status: 'available',
            agentId: 'openclaw',
            repo: 'obsidian-mcp',
            path: '/Users/franciscovialbrown/Documents/GitHub/obsidian-mcp',
            description: 'Memoria local en vault: crear, editar, buscar notas y administrar tags.'
        },
        {
            id: 'n8n-mcp',
            name: 'n8n MCP',
            category: 'automation',
            status: 'active',
            agentId: 'hermes',
            repo: 'n8n-mcp_',
            path: '/Users/franciscovialbrown/Documents/GitHub/n8n-mcp_',
            description: 'Automatizacion Meta Ads, Telegram, Google Workspace, Notion y Weavy.'
        },
        {
            id: 'whatsapp',
            name: 'WhatsApp Bot',
            category: 'automation',
            status: 'available',
            agentId: 'hermes',
            repo: 'whatsapp-web.js',
            path: '/Users/franciscovialbrown/Documents/GitHub/whatsapp-web.js',
            description: 'Bot con QR, reconexion, respuestas y manejo de mensajes por WhatsApp Web.'
        },
        {
            id: 'freepik-mcp',
            name: 'Freepik MCP',
            category: 'creative',
            status: 'available',
            agentId: 'openclaw',
            repo: 'freepik-mcp',
            path: '/Users/franciscovialbrown/Documents/GitHub/freepik-mcp',
            description: 'Busqueda, descarga, clasificacion y generacion visual con Freepik API.'
        },
        {
            id: 'docker-hub-mcp',
            name: 'Docker Hub MCP',
            category: 'ops',
            status: 'available',
            agentId: 'claude-code',
            repo: 'docker-hub-mcp',
            path: '/Users/franciscovialbrown/Documents/GitHub/docker-hub-mcp',
            description: 'Gestion de contenedores, logs, metricas, Prometheus y dashboards Grafana.'
        },
        {
            id: 'aura-agency-os',
            name: 'AURA Agency OS',
            category: 'agency',
            status: 'active',
            agentId: 'codex',
            repo: 'aura-agency-os',
            path: '/Users/franciscovialbrown/Documents/GitHub/aura-agency-os',
            description: 'Sistema boutique con agentes creativos, MCPs Adobe, Notion, Slack, Figma y Supabase.'
        },
        {
            id: 'ads-skills',
            name: 'Ads Skills',
            category: 'growth',
            status: 'available',
            agentId: 'openclaw',
            repo: 'ads-skills',
            path: '/Users/franciscovialbrown/Documents/GitHub/ads-skills',
            description: 'Frameworks y scripts para LinkedIn Ads, Meta Ads, Google Ads y onboarding.'
        }
    ],
    localScripts: [
        { id: 'pvb.check-agent-os', label: 'Check Agent OS JS', agentId: 'claude-code' },
        { id: 'pvb.check-apis', label: 'Check PVB API modules', agentId: 'claude-code' },
        { id: 'figma.build', label: 'Build Figma MCP', agentId: 'codex' },
        { id: 'aura.test', label: 'Run AURA system test', agentId: 'aura-director' }
    ],
    imageResults: [],
    executionLogs: [],
    runs: []
};

let state = loadState();

function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : structuredClone(seedState);
    } catch {
        return structuredClone(seedState);
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function selectedAgent() {
    return state.agents.find(agent => agent.id === state.selectedAgentId) || state.agents[0];
}

function selectedLayer() {
    return state.layers.find(layer => layer.id === state.selectedLayerId) || state.layers[0];
}

function ensureLayerState() {
    if (!state.layers) state.layers = structuredClone(seedState.layers);
    if (!state.layerEvents) state.layerEvents = structuredClone(seedState.layerEvents);
    if (!state.tools) state.tools = structuredClone(seedState.tools);
    if (!state.skills) state.skills = structuredClone(seedState.skills);
    if (!state.localScripts) state.localScripts = structuredClone(seedState.localScripts);
    if (!state.imageResults) state.imageResults = [];
    if (!state.executionLogs) state.executionLogs = [];
    if (!state.runs) state.runs = [];
    if (!state.connections) state.connections = structuredClone(seedState.connections);
    state.memories.forEach(memory => {
        if (!memory.id) memory.id = createId('memory');
        if (!memory.status && memory.title?.startsWith('Output pendiente')) memory.status = 'pending';
    });
    state.sessions.forEach(session => {
        if (!session.id) session.id = createId('session');
    });
    if (!state.selectedLayerId) state.selectedLayerId = 'foundation';
    if (!state.selectedToolFilter) state.selectedToolFilter = 'all';
    if (!state.selectedSkillFilter) state.selectedSkillFilter = 'all';
}

function renderAgents() {
    const list = document.getElementById('agentList');
    list.innerHTML = '';

    state.agents.forEach(agent => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `agent-button${agent.id === state.selectedAgentId ? ' active' : ''}`;
        button.innerHTML = `<strong>${escapeHtml(agent.name)}</strong><span>${escapeHtml(agent.role)} · ${escapeHtml(agent.status)}</span>`;
        button.addEventListener('click', () => {
            state.selectedAgentId = agent.id;
            saveState();
            render();
        });
        list.appendChild(button);
    });
}

function renderStackList() {
    const list = document.getElementById('stackList');
    list.innerHTML = '';

    state.layers.forEach(layer => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `stack-button${layer.id === state.selectedLayerId ? ' active' : ''}`;
        button.innerHTML = `<strong>${escapeHtml(layer.name)}</strong><span>${escapeHtml(layer.status)} · ${layer.pulse} signals</span>`;
        button.addEventListener('click', () => {
            state.selectedLayerId = layer.id;
            saveState();
            render();
        });
        list.appendChild(button);
    });
}

function renderLiveStack() {
    const layer = selectedLayer();
    document.getElementById('selectedLayerName').textContent = layer.name;
    document.getElementById('selectedLayerStatus').textContent = layer.status;

    document.getElementById('layerMap').innerHTML = state.layers.map(item => `
        <button class="layer-node${item.id === layer.id ? ' active' : ''}" type="button" data-layer-id="${escapeHtml(item.id)}">
            <span>
                <strong>${escapeHtml(item.name)}</strong>
                <p>${escapeHtml(item.signal)}</p>
            </span>
            <span class="layer-node-footer">
                <span class="health-dot ${healthClass(item.status)}"></span>
                <span class="pulse-count">${item.pulse} signals</span>
            </span>
        </button>
    `).join('');

    document.querySelectorAll('[data-layer-id]').forEach(node => {
        node.addEventListener('click', () => {
            state.selectedLayerId = node.dataset.layerId;
            saveState();
            render();
        });
    });

    document.getElementById('layerDetail').innerHTML = `
        <strong>${escapeHtml(layer.name)}</strong>
        <p>${escapeHtml(layer.summary)}</p>
        <div class="layer-fields">
            <div class="layer-field"><span>Owner</span><strong>${escapeHtml(layer.owner)}</strong></div>
            <div class="layer-field"><span>Status</span><strong>${escapeHtml(layer.status)}</strong></div>
            <div class="layer-field"><span>Signal</span><strong>${escapeHtml(layer.signal)}</strong></div>
            <div class="layer-field"><span>Output</span><strong>${escapeHtml(layer.output)}</strong></div>
        </div>
    `;

    const signals = state.layerEvents
        .filter(event => event.layerId === layer.id)
        .slice(0, 6);

    document.getElementById('layerSignals').innerHTML = signals.length ? signals.map(event => `
        <article class="signal-item">
            <strong>${escapeHtml(event.title)}</strong>
            <span>${escapeHtml(event.body)} · ${escapeHtml(event.createdAt)}</span>
        </article>
    `).join('') : '<div class="empty-state">Esta capa aun no tiene actividad reciente.</div>';
}

function healthClass(status) {
    if (['queued', 'learning', 'watching'].includes(status)) return 'warn';
    if (['idle', 'paused'].includes(status)) return 'idle';
    return '';
}

function pulseLayer(layerId, title, body) {
    const layer = state.layers.find(item => item.id === layerId);
    if (!layer) return;

    layer.pulse += 1;
    layer.signal = title;
    layer.output = body;
    if (layer.status === 'idle') layer.status = 'active';
    state.layerEvents.unshift({
        layerId,
        title,
        body,
        createdAt: 'Ahora'
    });
}

function renderSelectedAgent() {
    const agent = selectedAgent();
    document.getElementById('selectedAgentName').textContent = agent.name;
    document.getElementById('selectedAgentStatus').textContent = agent.status;
    document.getElementById('agentProfile').innerHTML = `
        <div class="profile-item"><span>Rol</span><strong>${escapeHtml(agent.role)}</strong></div>
        <div class="profile-item"><span>Scope</span><strong>${escapeHtml(agent.scope)}</strong></div>
        <div class="profile-item"><span>Tools</span><strong>${escapeHtml(agent.tools)}</strong></div>
        <div class="profile-item"><span>Provider</span><strong>${escapeHtml(agent.provider)}</strong></div>
        <div class="profile-item"><span>Objetivo</span><strong>${escapeHtml(agent.goal)}</strong></div>
        <div class="profile-item"><span>Guardrail</span><strong>Guardar output y pedir aprobacion para cambios riesgosos.</strong></div>
    `;
}

function renderMetrics() {
    document.getElementById('activeAgents').textContent = state.agents.filter(agent => agent.status !== 'idle').length;
    document.getElementById('sessionCount').textContent = state.sessions.length;
    document.getElementById('memoryCount').textContent = state.memories.length;
    document.getElementById('openTaskCount').textContent = state.tasks.length;
}

function renderConnections() {
    const labels = {
        openai: 'OpenAI',
        adobeFirefly: 'Adobe Firefly',
        googleDrive: 'Google Drive',
        telegram: 'Telegram',
        notionDriveLookup: 'Notion Drive lookup',
        anthropic: 'Anthropic',
        supabase: 'Supabase',
        localRunner: 'Local Runner'
    };
    const list = document.getElementById('connectionList');
    list.innerHTML = Object.entries(labels).map(([key, label]) => {
        const value = state.connections[key];
        const stateLabel = value === true ? 'conectado' : value === false ? 'falta' : 'sin chequear';
        const className = value === true ? 'ok' : value === false ? 'missing' : '';
        return `
            <div class="connection-item">
                <strong>${escapeHtml(label)}</strong>
                <span class="connection-state ${className}">${stateLabel}</span>
            </div>
        `;
    }).join('');
}

function renderOrchestrator() {
    renderConnections();

    const select = document.getElementById('localScriptSelect');
    select.innerHTML = state.localScripts.map(script => `
        <option value="${escapeHtml(script.id)}">${escapeHtml(script.label)} · ${escapeHtml(script.agentId)}</option>
    `).join('');

    const imageResults = document.getElementById('imageResults');
    imageResults.innerHTML = state.imageResults.length ? state.imageResults.map(result => `
        <article class="image-result-card">
            ${result.previewUrl ? `<img src="${escapeHtml(result.previewUrl)}" alt="Resultado generado por Agent OS">` : ''}
            <strong>${escapeHtml(result.filename || 'Imagen generada')}</strong>
            <p>${escapeHtml(result.prompt || '')}</p>
            ${result.driveLink ? `<a href="${escapeHtml(result.driveLink)}" target="_blank" rel="noopener">Abrir en Google Drive</a>` : ''}
        </article>
    `).join('') : '<div class="empty-state">Todavia no hay resultados de imagen.</div>';

    const logs = document.getElementById('executionLogs');
    logs.innerHTML = state.executionLogs.length ? state.executionLogs.map(log => `
        <article class="execution-log">
            <strong>${escapeHtml(log.title)}</strong>
            <span class="tag">${escapeHtml(log.status)}</span>
            <pre>${escapeHtml(log.body)}</pre>
        </article>
    `).join('') : '<div class="empty-state">Todavia no hay ejecuciones.</div>';

    const queue = document.getElementById('runQueue');
    queue.innerHTML = state.runs.length ? state.runs.map(run => `
        <article class="run-row">
            <div>
                <strong>${escapeHtml(run.action)} · ${escapeHtml(run.status)}</strong>
                <p>${escapeHtml(run.script_id || run.agent_id || run.id)} · ${escapeHtml(run.created_at || '')}</p>
            </div>
            ${['queued', 'running'].includes(run.status)
                ? `<button class="cancel-output" type="button" data-cancel-run="${escapeHtml(run.id)}">Cancelar</button>`
                : `<span class="tag">${escapeHtml(run.status)}</span>`}
        </article>
    `).join('') : '<div class="empty-state">No hay runs cargados.</div>';

    document.querySelectorAll('[data-cancel-run]').forEach(button => {
        button.addEventListener('click', () => cancelQueuedRun(button.dataset.cancelRun));
    });
}

async function checkConnections() {
    const token = localStorage.getItem('brain_token');

    try {
        const runnerRes = await fetch('http://localhost:8787/connections');
        state.connections.localRunner = runnerRes.ok;
        if (runnerRes.ok) {
            const runnerData = await runnerRes.json();
            Object.assign(state.connections, runnerData.connections);
        }
    } catch {
        state.connections.localRunner = false;
    }

    if (!token) {
        state.connections.adobeFirefly = false;
        state.connections.googleDrive = false;
        state.connections.telegram = false;
        state.connections.notionDriveLookup = false;
        addExecutionLog('Conexiones', 'missing-token', 'Falta brain_token. Inicia sesion en Master Brain para chequear credenciales server.');
        saveState();
        render();
        return;
    }

    try {
        const res = await fetch('/api/agent-run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: 'status' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo chequear /api/agent-run');
        Object.assign(state.connections, data.connections);
        addExecutionLog('Conexiones', 'ok', JSON.stringify(data.connections, null, 2));
    } catch (err) {
        addExecutionLog('Conexiones', 'error', err.message);
    }

    saveState();
    render();
}

async function generateImageRun() {
    const token = localStorage.getItem('brain_token');
    const prompt = document.getElementById('imagePromptInput').value.trim();
    const projectName = document.getElementById('imageProjectInput').value.trim();
    if (!prompt) return;
    if (!token) {
        addExecutionLog('Generar imagen', 'missing-token', 'Falta brain_token. Inicia sesion en Master Brain antes de generar.');
        saveState();
        render();
        return;
    }

    const runId = createId('image-run');
    state.imageRunId = runId;
    addExecutionLog('Generar imagen', 'running', `Run ${runId}\n${prompt}`);
    pulseLayer('production', 'Generacion de imagen iniciada', prompt.slice(0, 90));
    saveState();
    render();

    try {
        const res = await fetch('/api/agent-run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                action: 'generate-image',
                agentId: selectedAgent().id,
                prompt,
                projectName,
                notify: true
            })
        });
        const data = await res.json();
        if (state.imageRunId !== runId) {
            addExecutionLog('Generar imagen', 'cancelled', `Run ${runId} termino despues de ser cancelado. Resultado ignorado.`);
            saveState();
            render();
            return;
        }
        if (!res.ok) throw new Error(data.error || 'Error generando imagen');

        state.imageResults.unshift({
            ...data.result,
            prompt,
            createdAt: new Date().toISOString()
        });
        state.imageRunId = null;
        addExecutionLog('Generar imagen', 'ok', `Drive: ${data.result.driveLink}\nTelegram: ${data.result.telegram?.ok ? 'notificado' : 'sin notificar'}`);
        pulseLayer('production', 'Imagen generada y subida', data.result.driveLink || data.result.filename);
        pulseLayer('loop', 'Resultado visual guardado', 'Preview, Drive link y estado Telegram disponibles.');
    } catch (err) {
        state.imageRunId = null;
        addExecutionLog('Generar imagen', 'error', err.message);
        pulseLayer('production', 'Error generando imagen', err.message.slice(0, 120));
    }

    saveState();
    render();
}

function cancelImageRun() {
    if (!state.imageRunId) {
        cancelMostRecentPendingOutput();
        return;
    }
    const cancelled = state.imageRunId;
    state.imageRunId = null;
    addExecutionLog('Generar imagen', 'cancelled', `Run ${cancelled} marcado como cancelado. Si el servidor ya estaba procesando, el resultado se ignorara al volver.`);
    pulseLayer('mission', 'Run de imagen cancelado', cancelled);
    saveState();
    render();
}

async function runLocalScript() {
    const scriptId = document.getElementById('localScriptSelect').value;
    addExecutionLog('Runner local', 'running', scriptId);
    pulseLayer('foundation', 'Script local lanzado', scriptId);
    saveState();
    render();

    try {
        const res = await fetch('http://localhost:8787/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scriptId })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Runner local fallo');
        addExecutionLog('Runner local', data.ok ? 'ok' : 'error', `${scriptId}\n\nSTDOUT:\n${data.result.stdout}\n\nSTDERR:\n${data.result.stderr}`);
        pulseLayer('foundation', `Script ${data.ok ? 'ok' : 'fallo'}`, scriptId);
    } catch (err) {
        state.connections.localRunner = false;
        addExecutionLog('Runner local', 'error', `${err.message}\nArranca con: node local-agent-runner/server.js`);
    }

    saveState();
    render();
}

async function queueScriptRun() {
    const token = localStorage.getItem('brain_token');
    const scriptId = document.getElementById('localScriptSelect').value;
    if (!token) {
        addExecutionLog('Encolar script', 'missing-token', 'Falta brain_token.');
        saveState();
        render();
        return;
    }
    try {
        const res = await fetch('/api/agent-run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: 'queue-script', scriptId, agentId: selectedAgent().id })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo encolar script');
        state.runs.unshift(data.run);
        addExecutionLog('Encolar script', 'queued', `${scriptId}\nRun: ${data.run.id}`);
        pulseLayer('mission', 'Script encolado', scriptId);
    } catch (err) {
        addExecutionLog('Encolar script', 'error', err.message);
    }
    saveState();
    render();
}

async function refreshRuns() {
    const token = localStorage.getItem('brain_token');
    if (!token) {
        addExecutionLog('Actualizar runs', 'missing-token', 'Falta brain_token.');
        saveState();
        render();
        return;
    }
    try {
        const res = await fetch('/api/agent-run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: 'list-runs', limit: 25 })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudieron cargar runs');
        state.runs = data.runs;
        addExecutionLog('Actualizar runs', 'ok', `${data.runs.length} runs cargados`);
    } catch (err) {
        addExecutionLog('Actualizar runs', 'error', err.message);
    }
    saveState();
    render();
}

async function cancelQueuedRun(runId) {
    const token = localStorage.getItem('brain_token');
    if (!token) return;
    try {
        const res = await fetch('/api/agent-run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: 'cancel-run', runId })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo cancelar run');
        state.runs = state.runs.map(run => run.id === runId ? data.run : run);
        addExecutionLog('Cancelar run', 'cancelled', runId);
        pulseLayer('mission', 'Run cancelado', runId);
    } catch (err) {
        addExecutionLog('Cancelar run', 'error', err.message);
    }
    saveState();
    render();
}

async function processQueueOnce() {
    try {
        const res = await fetch('http://localhost:8787/runs/process-once', { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudo procesar cola');
        addExecutionLog('Procesar cola', data.ok ? 'ok' : 'error', JSON.stringify(data, null, 2));
        await refreshRuns();
    } catch (err) {
        addExecutionLog('Procesar cola', 'error', `${err.message}\nRunner local requerido.`);
        saveState();
        render();
    }
}

function addExecutionLog(title, status, body) {
    state.executionLogs.unshift({
        title,
        status,
        body,
        createdAt: new Date().toISOString()
    });
    state.executionLogs = state.executionLogs.slice(0, 30);
}

function renderToolRegistry() {
    const registry = document.getElementById('toolRegistry');
    const filter = state.selectedToolFilter;
    const tools = state.tools.filter(tool => {
        if (filter === 'all') return true;
        if (filter === 'active') return tool.status === 'active';
        return tool.category === filter;
    });

    registry.innerHTML = tools.length ? tools.map(tool => {
        const agent = state.agents.find(item => item.id === tool.agentId);
        return `
            <article class="tool-card ${tool.status === 'active' ? 'active' : ''}">
                <div>
                    <div class="tool-card-header">
                        <h3>${escapeHtml(tool.name)}</h3>
                        <span class="tag">${escapeHtml(tool.status)}</span>
                    </div>
                    <p>${escapeHtml(tool.description)}</p>
                </div>
                <div class="tool-meta">
                    <span class="tag">${escapeHtml(tool.category)}</span>
                    <span class="tag">${escapeHtml(agent?.name || 'sin agente')}</span>
                    <span class="tag">${escapeHtml(tool.repo)}</span>
                </div>
                <code class="tool-path">${escapeHtml(tool.path)}</code>
                <div class="tool-actions">
                    <button class="tool-toggle" type="button" data-tool-id="${escapeHtml(tool.id)}">
                        ${tool.status === 'active' ? 'Desactivar' : 'Activar'}
                    </button>
                    <span class="pulse-count">${escapeHtml(tool.agentId)}</span>
                </div>
            </article>
        `;
    }).join('') : '<div class="empty-state">No hay herramientas para este filtro.</div>';

    document.querySelectorAll('[data-tool-id]').forEach(button => {
        button.addEventListener('click', () => toggleTool(button.dataset.toolId));
    });

    document.querySelectorAll('[data-tool-filter]').forEach(button => {
        button.classList.toggle('active', button.dataset.toolFilter === state.selectedToolFilter);
    });
}

function renderSkillMatrix() {
    const matrix = document.getElementById('skillMatrix');
    const filter = state.selectedSkillFilter;
    const skills = state.skills.filter(skill => {
        if (filter === 'all') return true;
        if (filter === 'assigned') return skill.status === 'assigned';
        return skill.category === filter;
    });

    matrix.innerHTML = skills.length ? skills.map(skill => {
        const agent = state.agents.find(item => item.id === skill.agentId);
        return `
            <article class="skill-card ${skill.status === 'assigned' ? 'assigned' : ''}">
                <div>
                    <div class="tool-card-header">
                        <h3>${escapeHtml(skill.name)}</h3>
                        <span class="tag">${escapeHtml(skill.status)}</span>
                    </div>
                    <p>${escapeHtml(skill.description)}</p>
                </div>
                <div class="tool-meta">
                    <span class="tag">${escapeHtml(skill.category)}</span>
                    <span class="tag">${escapeHtml(agent?.name || 'sin agente')}</span>
                </div>
                <code class="tool-path">${escapeHtml(skill.source)}</code>
                <select data-skill-agent="${escapeHtml(skill.id)}" aria-label="Asignar ${escapeHtml(skill.name)}">
                    ${state.agents.map(item => `
                        <option value="${escapeHtml(item.id)}"${item.id === skill.agentId ? ' selected' : ''}>${escapeHtml(item.name)}</option>
                    `).join('')}
                </select>
            </article>
        `;
    }).join('') : '<div class="empty-state">No hay skills para este filtro.</div>';

    document.querySelectorAll('[data-skill-agent]').forEach(select => {
        select.addEventListener('change', () => assignSkill(select.dataset.skillAgent, select.value));
    });

    document.querySelectorAll('[data-skill-filter]').forEach(button => {
        button.classList.toggle('active', button.dataset.skillFilter === state.selectedSkillFilter);
    });
}

function assignSkill(skillId, agentId) {
    const skill = state.skills.find(item => item.id === skillId);
    const agent = state.agents.find(item => item.id === agentId);
    if (!skill || !agent) return;

    skill.agentId = agentId;
    skill.status = 'assigned';
    pulseLayer('agents', `${skill.name} asignada`, `${agent.name} ahora tiene esta skill.`);
    pulseLayer('memory', 'Skill map actualizado', `${skill.name} -> ${agent.name}.`);
    saveState();
    render();
}

function toggleTool(toolId) {
    const tool = state.tools.find(item => item.id === toolId);
    if (!tool) return;

    tool.status = tool.status === 'active' ? 'available' : 'active';
    const action = tool.status === 'active' ? 'activada' : 'desactivada';
    pulseLayer('agents', `${tool.name} ${action}`, `Asignada a ${tool.agentId}.`);
    pulseLayer('mission', 'Tool registry actualizado', `${tool.name}: ${tool.status}.`);
    saveState();
    render();
}

function renderMemories() {
    const query = document.getElementById('memorySearch').value.trim().toLowerCase();
    const list = document.getElementById('memoryList');
    const memories = state.memories.filter(memory => {
        const text = `${memory.title} ${memory.body} ${memory.tag}`.toLowerCase();
        return !query || text.includes(query);
    });

    list.innerHTML = memories.length ? memories.map(memory => `
        <article class="memory-item">
            <strong>${escapeHtml(memory.title)}</strong>
            <p>${escapeHtml(memory.body)}</p>
            <div class="memory-meta">
                <span class="tag">${escapeHtml(memory.tag)}</span>
                ${memory.status === 'pending'
                    ? `<button class="cancel-output" type="button" data-cancel-output="${escapeHtml(memory.id)}">Cancelar</button>`
                    : `<p>${escapeHtml(memory.createdAt)}</p>`}
            </div>
        </article>
    `).join('') : '<div class="empty-state">No hay memorias para esa busqueda.</div>';

    document.querySelectorAll('[data-cancel-output]').forEach(button => {
        button.addEventListener('click', () => cancelPendingOutput(button.dataset.cancelOutput));
    });
}

function renderSessions() {
    const list = document.getElementById('sessionList');
    list.innerHTML = state.sessions.map(session => {
        const agent = state.agents.find(item => item.id === session.agentId);
        return `
            <article class="session-item">
                <strong>${escapeHtml(session.title)}</strong>
                <p>${escapeHtml(session.body)}</p>
                <div class="session-meta">
                    <span class="tag">${escapeHtml(agent?.name || 'Agent')}</span>
                    <p>${escapeHtml(session.createdAt)}</p>
                </div>
            </article>
        `;
    }).join('');
}

function renderTasks() {
    const board = document.getElementById('taskBoard');
    const lanes = [
        ['plan', 'Plan'],
        ['build', 'Build'],
        ['review', 'Review']
    ];

    board.innerHTML = lanes.map(([lane, title]) => {
        const tasks = state.tasks.filter(task => task.lane === lane);
        const taskMarkup = tasks.length ? tasks.map(task => `
            <article class="task-card ${escapeHtml(task.priority)}">
                <strong>${escapeHtml(task.title)}</strong>
                <p>${escapeHtml(task.body)}</p>
            </article>
        `).join('') : '<div class="empty-state">Sin tareas.</div>';

        return `
            <section class="task-column">
                <h3>${title}</h3>
                <div class="task-stack">${taskMarkup}</div>
            </section>
        `;
    }).join('');
}

function addSessionFromCommand() {
    const input = document.getElementById('commandInput');
    const command = input.value.trim();
    if (!command) return;

    const agent = selectedAgent();
    const outputId = createId('output');
    state.sessions.unshift({
        id: createId('session'),
        outputId,
        agentId: agent.id,
        title: `Mision para ${agent.name}`,
        body: command,
        status: 'pending',
        createdAt: 'Ahora'
    });
    state.memories.unshift({
        id: outputId,
        title: `Output pendiente: ${agent.name}`,
        body: `Mision enviada: ${command}`,
        tag: 'session',
        status: 'pending',
        createdAt: new Date().toISOString().slice(0, 10)
    });
    pulseLayer('brain', `Ruteo a ${agent.name}`, command.slice(0, 90));
    pulseLayer('agents', `${agent.name} recibio mision`, agent.goal);
    const activeTools = state.tools.filter(tool => tool.agentId === agent.id && tool.status === 'active');
    if (activeTools.length) {
        pulseLayer('production', `Herramientas listas para ${agent.name}`, activeTools.map(tool => tool.name).join(', '));
    }
    const assignedSkills = state.skills.filter(skill => skill.agentId === agent.id && skill.status === 'assigned');
    if (assignedSkills.length) {
        pulseLayer('brain', `Skills cargadas para ${agent.name}`, assignedSkills.map(skill => skill.name).join(', '));
    }
    pulseLayer('mission', 'Nueva mision enviada', command.slice(0, 90));
    pulseLayer('loop', 'Output pendiente registrado', 'La mision quedo escrita en historial y memoria.');
    input.value = '';
    saveState();
    render();
}

function cancelPendingOutput(outputId) {
    const memory = state.memories.find(item => item.id === outputId);
    if (!memory || memory.status !== 'pending') return;

    state.memories = state.memories.filter(item => item.id !== outputId);
    state.sessions = state.sessions.map(session => {
        if (session.outputId !== outputId) return session;
        return {
            ...session,
            status: 'cancelled',
            title: `Cancelada: ${session.title}`,
            body: `${session.body}\n\nOutput cancelado antes de ejecucion.`
        };
    });

    pulseLayer('loop', 'Output pendiente cancelado', memory.title);
    pulseLayer('mission', 'Mision cancelada', memory.body.slice(0, 90));
    saveState();
    render();
}

function cancelMostRecentPendingOutput() {
    const pending = state.memories.find(memory => memory.status === 'pending');
    if (!pending) {
        addExecutionLog('Cancelar output', 'empty', 'No hay outputs pendientes para cancelar.');
        saveState();
        render();
        return;
    }
    cancelPendingOutput(pending.id);
}

function addMemoryFromCommand() {
    const input = document.getElementById('commandInput');
    const body = input.value.trim();
    if (!body) return;

    state.memories.unshift({
        title: 'Memoria manual',
        body,
        tag: selectedAgent().name.toLowerCase().replace(/\s+/g, '-'),
        createdAt: new Date().toISOString().slice(0, 10)
    });
    pulseLayer('memory', 'Memoria manual guardada', body.slice(0, 90));
    pulseLayer('loop', 'Feedback loop actualizado', 'Nueva memoria disponible para proximas sesiones.');
    input.value = '';
    saveState();
    render();
}

function saveSnapshot() {
    state.memories.unshift({
        title: 'Snapshot Agent OS',
        body: `${state.agents.length} agentes, ${state.sessions.length} sesiones, ${state.tasks.length} tareas abiertas.`,
        tag: 'snapshot',
        createdAt: new Date().toISOString().slice(0, 10)
    });
    pulseLayer('memory', 'Snapshot guardado', 'Estado del Agent OS persistido como memoria.');
    pulseLayer('loop', 'Snapshot agregado al loop', 'El sistema puede recuperar este punto de control.');
    saveState();
    render();
}

function resetDemo() {
    state = structuredClone(seedState);
    saveState();
    render();
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function render() {
    ensureLayerState();
    renderAgents();
    renderStackList();
    renderLiveStack();
    renderToolRegistry();
    renderSkillMatrix();
    renderOrchestrator();
    renderSelectedAgent();
    renderMetrics();
    renderMemories();
    renderSessions();
    renderTasks();
}

document.getElementById('runCommandBtn').addEventListener('click', addSessionFromCommand);
document.getElementById('addMemoryBtn').addEventListener('click', addMemoryFromCommand);
document.getElementById('saveSnapshotBtn').addEventListener('click', saveSnapshot);
document.getElementById('resetDemoBtn').addEventListener('click', resetDemo);
document.getElementById('memorySearch').addEventListener('input', renderMemories);
document.getElementById('checkConnectionsBtn').addEventListener('click', checkConnections);
document.getElementById('generateImageBtn').addEventListener('click', generateImageRun);
document.getElementById('cancelImageRunBtn').addEventListener('click', cancelImageRun);
document.getElementById('runLocalScriptBtn').addEventListener('click', runLocalScript);
document.getElementById('queueScriptBtn').addEventListener('click', queueScriptRun);
document.getElementById('processQueueBtn').addEventListener('click', processQueueOnce);
document.getElementById('refreshRunsBtn').addEventListener('click', refreshRuns);
document.querySelectorAll('[data-tool-filter]').forEach(button => {
    button.addEventListener('click', () => {
        state.selectedToolFilter = button.dataset.toolFilter;
        saveState();
        renderToolRegistry();
    });
});
document.querySelectorAll('[data-skill-filter]').forEach(button => {
    button.addEventListener('click', () => {
        state.selectedSkillFilter = button.dataset.skillFilter;
        saveState();
        renderSkillMatrix();
    });
});

render();
