/**
 * PVB MASTER BRAIN — Agent Command Center
 * Visualizes 68 AI agents, budgets, routines, and audit logs
 */

let allAgents = [];
let departments = [];
let brainToken = null;

// ─── Department Definitions ───
const DEPT_CONFIG = {
  creative:    { name: 'Creative',         icon: '&#9733;', color: '#E91E63', director: 'Creative Director' },
  marketing:   { name: 'Marketing',        icon: '&#9752;', color: '#FF9800', director: 'Marketing Director' },
  engineering: { name: 'Engineering',       icon: '&#9881;', color: '#2196F3', director: 'Engineering Lead' },
  production:  { name: 'Production',        icon: '&#9734;', color: '#4CAF50', director: 'Production Lead' },
  qa:          { name: 'QA & Testing',      icon: '&#9888;', color: '#F44336', director: 'QA Lead' },
  analytics:   { name: 'Analytics & Data',  icon: '&#9670;', color: '#00BCD4', director: 'Analytics Lead' },
  product:     { name: 'Product Strategy',  icon: '&#9830;', color: '#9C27B0', director: 'Product Strategy Lead' },
  support:     { name: 'Operations & Legal',icon: '&#9635;', color: '#607D8B', director: 'Operations & Legal Lead' },
};

// ─── All 68 Agents ───
const AGENTS_DATA = [
  // CEO
  { id: 'agents-orchestrator', name: 'Pancho — Orchestrator', title: 'Founder & CEO / Agents Orchestrator', dept: 'ceo', role: 'ceo',
    capabilities: 'workflow-orchestration, quality-gate-enforcement, multi-agent-coordination, autonomous-error-recovery, dev-qa-loops', skills: '' },

  // CREATIVE (8)
  { id: 'design-brand-guardian', name: 'Brand Guardian', title: 'Identidad de marca, consistencia visual, brand systems', dept: 'creative',
    capabilities: 'brand-identity, visual-systems, brand-voice, consistency-monitoring, brand-evolution, style-guides', skills: '' },
  { id: 'design-ui-designer', name: 'UI Designer', title: 'Design systems, component libraries, interfaces pixel-perfect', dept: 'creative',
    capabilities: 'design-systems, component-libraries, dark-mode-theming, wcag-aa-accessibility, pixel-perfect-interfaces', skills: 'landing-page, page-cro' },
  { id: 'design-ux-architect', name: 'UX Architect', title: 'Foundations para devs, CSS systems, layout frameworks', dept: 'creative',
    capabilities: 'css-design-systems, layout-frameworks, schema-compliance, developer-ready-foundations', skills: 'page-cro, onboarding-cro' },
  { id: 'design-ux-researcher', name: 'UX Researcher', title: 'User behavior analysis, usability testing, data-driven design', dept: 'creative',
    capabilities: 'user-interviews, usability-testing, persona-development, journey-mapping', skills: '' },
  { id: 'design-image-prompt-engineer', name: 'Image Prompt Engineer', title: 'Prompts de fotografia IA profesional', dept: 'creative',
    capabilities: 'ai-image-prompts, photography-direction, visual-concept-translation, style-consistency', skills: 'ad-creative' },
  { id: 'design-visual-storyteller', name: 'Visual Storyteller', title: 'Narrativa visual, multimedia, infografias', dept: 'creative',
    capabilities: 'visual-narratives, multimedia-content, data-visualization, emotional-storytelling', skills: '' },
  { id: 'design-inclusive-visuals-specialist', name: 'Inclusive Visuals', title: 'Representacion diversa, anti-bias, imagenes culturales', dept: 'creative',
    capabilities: 'bias-detection, cultural-accuracy, intersectional-representation', skills: '' },
  { id: 'design-whimsy-injector', name: 'Whimsy Injector', title: 'Personalidad de marca, micro-interacciones, deleite', dept: 'creative',
    capabilities: 'brand-personality, micro-interactions, easter-eggs, playful-ux', skills: '' },

  // MARKETING (12)
  { id: 'marketing-content-creator', name: 'Content Creator', title: 'Estratega y creador de contenido multi-plataforma', dept: 'marketing',
    capabilities: 'content-strategy, editorial-calendars, brand-storytelling, seo-content, copywriting', skills: 'content-strategy, copywriting, email-sequence, cold-email, social-content' },
  { id: 'marketing-social-media-strategist', name: 'Social Media Strategist', title: 'Estrategia cross-platform LinkedIn/Twitter', dept: 'marketing',
    capabilities: 'cross-platform-campaigns, community-building, thought-leadership, real-time-engagement', skills: 'social-content' },
  { id: 'marketing-instagram-curator', name: 'Instagram Curator', title: 'Visual storytelling, comunidad, multi-formato', dept: 'marketing',
    capabilities: 'visual-brand-development, reels, stories, social-commerce, hashtag-strategy', skills: 'social-content, ad-creative' },
  { id: 'marketing-tiktok-strategist', name: 'TikTok Strategist', title: 'Contenido viral, algoritmo TikTok, creators', dept: 'marketing',
    capabilities: 'viral-content, algorithm-mastery, trend-analysis, creator-partnerships', skills: 'social-content, ad-creative' },
  { id: 'marketing-twitter-engager', name: 'Twitter Engager', title: 'Thought leadership, threads virales en X', dept: 'marketing',
    capabilities: 'real-time-engagement, thought-leadership, thread-creation, community-growth', skills: 'social-content' },
  { id: 'marketing-growth-hacker', name: 'Growth Hacker', title: 'Adquisicion de usuarios, growth loops, funnels', dept: 'marketing',
    capabilities: 'growth-strategy, ab-testing, viral-mechanics, channel-optimization', skills: 'referral-program, paid-ads, free-tool-strategy, ab-test-setup' },
  { id: 'marketing-app-store-optimizer', name: 'App Store Optimizer', title: 'ASO, discoverability, conversion rate de apps', dept: 'marketing',
    capabilities: 'aso-optimization, keyword-research, screenshot-optimization, review-management', skills: '' },
  { id: 'specialized-developer-advocate', name: 'Developer Advocate', title: 'Comunidad de devs, DX, contenido tecnico', dept: 'marketing',
    capabilities: 'developer-community, technical-content, dx-optimization, platform-adoption', skills: '' },
  { id: 'marketing-xiaohongshu-specialist', name: 'Xiaohongshu Specialist', title: 'Marketing lifestyle, micro-contenido estetico', dept: 'marketing',
    capabilities: 'lifestyle-content, trend-driven-strategy, aesthetic-storytelling', skills: '' },
  { id: 'marketing-wechat-official-account', name: 'WeChat Manager', title: 'WeChat OA, subscriber engagement', dept: 'marketing',
    capabilities: 'wechat-content, subscriber-engagement, mini-programs', skills: '' },
  { id: 'marketing-zhihu-strategist', name: 'Zhihu Strategist', title: 'Thought leadership y autoridad en Zhihu', dept: 'marketing',
    capabilities: 'knowledge-marketing, qa-strategy, brand-authority', skills: '' },
  { id: 'marketing-reddit-community-builder', name: 'Reddit Community Builder', title: 'Engagement autentico en Reddit', dept: 'marketing',
    capabilities: 'community-engagement, reddit-culture, authentic-marketing', skills: '' },

  // ENGINEERING (10)
  { id: 'engineering-frontend-developer', name: 'Frontend Developer', title: 'React/Vue/Angular, responsive, Core Web Vitals', dept: 'engineering',
    capabilities: 'modern-web-apps, responsive-design, performance-optimization, pwa, accessibility', skills: 'landing-page, page-cro' },
  { id: 'engineering-backend-architect', name: 'Backend Architect', title: 'Scalable systems, Supabase, APIs, databases', dept: 'engineering',
    capabilities: 'system-design, database-architecture, api-design, event-driven-systems, security-first', skills: 'seo-audit, schema-markup, analytics-tracking' },
  { id: 'engineering-senior-developer', name: 'Senior Developer', title: 'Laravel/Livewire/FluxUI, Three.js, premium web', dept: 'engineering',
    capabilities: 'laravel-livewire-fluxui, advanced-css, three-js, glass-morphism, organic-shapes', skills: '' },
  { id: 'engineering-rapid-prototyper', name: 'Rapid Prototyper', title: 'MVPs ultra-rapidos, proof-of-concept', dept: 'engineering',
    capabilities: 'mvp-development, rapid-iteration, framework-selection', skills: '' },
  { id: 'engineering-security-engineer', name: 'Security Engineer', title: 'Threat modeling, OWASP, secure code review', dept: 'engineering',
    capabilities: 'threat-modeling, vulnerability-assessment, secure-code-review, owasp-top-10', skills: '' },
  { id: 'engineering-devops-automator', name: 'DevOps Automator', title: 'CI/CD, Netlify, cloud ops, automation', dept: 'engineering',
    capabilities: 'ci-cd-pipelines, cloud-infrastructure, containerization, monitoring', skills: '' },
  { id: 'engineering-mobile-app-builder', name: 'Mobile App Builder', title: 'iOS/Android, React Native, Flutter', dept: 'engineering',
    capabilities: 'native-ios-android, react-native, flutter, cross-platform', skills: '' },
  { id: 'engineering-ai-engineer', name: 'AI Engineer', title: 'ML models, Claude API, integraciones IA', dept: 'engineering',
    capabilities: 'ml-models, claude-api-integration, ai-features, data-pipelines', skills: '' },
  { id: 'engineering-technical-writer', name: 'Technical Writer', title: 'Docs de desarrollador, API references, tutoriales', dept: 'engineering',
    capabilities: 'developer-docs, api-references, readme-files, tutorials', skills: '' },
  { id: 'engineering-data-engineer', name: 'Data Engineer', title: 'Pipelines ETL/ELT, Spark, dbt, lakehouse', dept: 'engineering',
    capabilities: 'etl-elt-pipelines, apache-spark, dbt, streaming-systems', skills: '' },

  // QA & TESTING (8)
  { id: 'testing-reality-checker', name: 'Reality Checker', title: 'Default: NEEDS WORK. Requiere evidencia abrumadora', dept: 'qa',
    capabilities: 'integration-testing, evidence-validation, visual-proof, fantasy-detection', skills: '' },
  { id: 'testing-accessibility-auditor', name: 'Accessibility Auditor', title: 'WCAG, screen readers, inclusive design', dept: 'qa',
    capabilities: 'wcag-audit, screen-reader-testing, inclusive-design, a11y-compliance', skills: '' },
  { id: 'testing-performance-benchmarker', name: 'Performance Benchmarker', title: 'Core Web Vitals, load testing, optimization', dept: 'qa',
    capabilities: 'performance-testing, core-web-vitals, load-testing', skills: '' },
  { id: 'testing-api-tester', name: 'API Tester', title: 'API validation, performance, QA integraciones', dept: 'qa',
    capabilities: 'api-validation, contract-testing, performance-testing, security-testing', skills: '' },
  { id: 'testing-tool-evaluator', name: 'Tool Evaluator', title: 'Evaluacion de herramientas antes de adoptar', dept: 'qa',
    capabilities: 'tool-assessment, platform-evaluation, cost-benefit-analysis', skills: '' },
  { id: 'testing-workflow-optimizer', name: 'Workflow Optimizer', title: 'Analisis y automatizacion de procesos', dept: 'qa',
    capabilities: 'process-analysis, bottleneck-detection, automation-opportunities', skills: '' },
  { id: 'testing-test-results-analyzer', name: 'Test Results Analyzer', title: 'Analisis de resultados de tests, metricas QA', dept: 'qa',
    capabilities: 'test-evaluation, quality-metrics, ab-test-analysis', skills: 'ab-test-setup' },
  { id: 'testing-evidence-collector', name: 'Evidence Collector', title: 'Screenshots, pruebas visuales, busca 3-5 issues', dept: 'qa',
    capabilities: 'visual-evidence, screenshot-capture, bug-documentation', skills: '' },

  // ANALYTICS & DATA (4)
  { id: 'support-analytics-reporter', name: 'Analytics Reporter', title: 'Dashboards, GA4/GTM, KPIs, business intelligence', dept: 'analytics',
    capabilities: 'dashboards, statistical-analysis, predictive-modeling, data-visualization', skills: 'analytics-tracking, revops' },
  { id: 'sales-data-extraction-agent', name: 'Sales Data Extractor', title: 'Monitoreo Excel, metricas MTD/YTD', dept: 'analytics',
    capabilities: 'excel-monitoring, sales-metrics, pipeline-analysis', skills: '' },
  { id: 'data-consolidation-agent', name: 'Data Consolidator', title: 'Consolidacion en dashboards live', dept: 'analytics',
    capabilities: 'data-consolidation, live-dashboards, territory-summaries', skills: '' },
  { id: 'report-distribution-agent', name: 'Report Distributor', title: 'Distribucion automatizada de reportes', dept: 'analytics',
    capabilities: 'automated-distribution, territorial-routing, scheduled-reports', skills: '' },

  // PRODUCT STRATEGY (4)
  { id: 'product-sprint-prioritizer', name: 'Sprint Prioritizer', title: 'Agile planning, RICE/MoSCoW/Kano, pricing', dept: 'product',
    capabilities: 'rice-moscow-kano, sprint-planning, capacity-planning, velocity-prediction', skills: 'pricing-strategy' },
  { id: 'product-behavioral-nudge-engine', name: 'Behavioral Nudge Engine', title: 'Psicologia conductual, retencion, churn', dept: 'product',
    capabilities: 'behavioral-psychology, user-motivation, interaction-adaptation', skills: 'churn-prevention, onboarding-cro' },
  { id: 'product-trend-researcher', name: 'Trend Researcher', title: 'Market intelligence, tendencias, competitive analysis', dept: 'product',
    capabilities: 'market-research, trend-analysis, competitive-intelligence', skills: 'competitor-alternatives' },
  { id: 'product-feedback-synthesizer', name: 'Feedback Synthesizer', title: 'Multi-channel feedback → insights accionables', dept: 'product',
    capabilities: 'feedback-collection, qualitative-to-quantitative, sentiment-analysis', skills: '' },

  // PROJECT MANAGEMENT (5)
  { id: 'project-management-studio-producer', name: 'Studio Producer', title: 'Orquestacion de portafolio, vision creativa', dept: 'production',
    capabilities: 'portfolio-management, creative-vision-alignment, resource-allocation', skills: 'launch-strategy' },
  { id: 'project-management-project-shepherd', name: 'Project Shepherd', title: 'Coordinacion cross-funcional, timeline, riesgos', dept: 'production',
    capabilities: 'cross-functional-coordination, timeline-management, risk-mitigation', skills: '' },
  { id: 'project-management-studio-operations', name: 'Studio Operations', title: 'Eficiencia operativa dia a dia, procesos', dept: 'production',
    capabilities: 'daily-operations, process-optimization, resource-coordination', skills: '' },
  { id: 'project-management-experiment-tracker', name: 'Experiment Tracker', title: 'Diseno de experimentos, A/B tests', dept: 'production',
    capabilities: 'experiment-design, ab-testing, hypothesis-validation', skills: 'ab-test-setup' },
  { id: 'project-manager-senior', name: 'Senior PM', title: 'Specs realistas, task decomposition, scope control', dept: 'production',
    capabilities: 'spec-to-tasks, realistic-scope, exact-requirements', skills: '' },

  // SUPPORT & LEGAL (5)
  { id: 'support-legal-compliance-checker', name: 'Legal & Compliance', title: 'GDPR/CCPA/HIPAA, contratos, multi-jurisdiccion', dept: 'support',
    capabilities: 'gdpr-ccpa-hipaa, risk-assessment, privacy-policies, content-compliance', skills: '' },
  { id: 'support-finance-tracker', name: 'Finance Tracker', title: 'P&L, cash flow, budgeting, cost management', dept: 'support',
    capabilities: 'budgeting, cash-flow-management, financial-reporting, cost-management', skills: '' },
  { id: 'support-infrastructure-maintainer', name: 'Infrastructure Maintainer', title: 'System reliability, Supabase/Netlify monitoring', dept: 'support',
    capabilities: 'system-reliability, performance-optimization, monitoring, security', skills: '' },
  { id: 'support-executive-summary-generator', name: 'Executive Summary Gen', title: 'McKinsey SCQA + BCG Pyramid para C-suite', dept: 'support',
    capabilities: 'scqa-framework, pyramid-principle, complexity-to-clarity', skills: 'sales-enablement' },
  { id: 'support-support-responder', name: 'Support Responder', title: 'Atencion al cliente excepcional, multi-canal', dept: 'support',
    capabilities: 'multi-channel-support, issue-resolution, proactive-care', skills: '' },

  // SPECIALIZED (4 — mapped to their departments)
  { id: 'specialized-cultural-intelligence-strategist', name: 'Cultural Intelligence', title: 'Inclusion global e inteligencia cultural', dept: 'product',
    capabilities: 'cultural-analysis, bias-detection, global-context', skills: '' },
  { id: 'agentic-identity-trust', name: 'Identity & Trust Architect', title: 'Identidad y trust para agentes autonomos', dept: 'engineering',
    capabilities: 'identity-systems, trust-verification, audit-trails', skills: '' },
  { id: 'engineering-autonomous-optimization-architect', name: 'Autonomous Optimizer', title: 'Shadow-testing APIs, guardrails financieros', dept: 'engineering',
    capabilities: 'api-shadow-testing, cost-guardrails, performance-monitoring', skills: '' },
  { id: 'lsp-index-engineer', name: 'LSP Index Engineer', title: 'Language Server Protocol, code intelligence', dept: 'engineering',
    capabilities: 'lsp-orchestration, semantic-indexing, code-intelligence', skills: '' },

  // XR & Spatial (5)
  { id: 'xr-immersive-developer', name: 'XR Immersive Dev', title: 'WebXR, browser-based AR/VR/XR', dept: 'engineering',
    capabilities: 'webxr, browser-ar-vr, immersive-web', skills: '' },
  { id: 'xr-interface-architect', name: 'XR Interface Architect', title: 'Spatial interaction design for XR', dept: 'engineering',
    capabilities: 'spatial-design, xr-interaction, immersive-ui', skills: '' },
  { id: 'xr-cockpit-interaction-specialist', name: 'XR Cockpit Specialist', title: 'Cockpit control systems for XR', dept: 'engineering',
    capabilities: 'cockpit-design, xr-controls, immersive-dashboards', skills: '' },
  { id: 'visionos-spatial-engineer', name: 'visionOS Engineer', title: 'visionOS, SwiftUI volumetric, Liquid Glass', dept: 'engineering',
    capabilities: 'visionos, swiftui-volumetric, liquid-glass', skills: '' },
  { id: 'macos-spatial-metal-engineer', name: 'macOS Metal Engineer', title: 'Swift Metal, 3D rendering, spatial computing', dept: 'engineering',
    capabilities: 'metal-api, 3d-rendering, spatial-computing', skills: '' },

  // Data reporters (mapped to analytics)
  { id: 'data-analytics-reporter', name: 'Data Analytics Reporter', title: 'Raw data → actionable business insights', dept: 'analytics',
    capabilities: 'data-analysis, dashboards, statistical-analysis, kpi-tracking', skills: '' },

  // Terminal specialist (mapped to engineering)
  { id: 'terminal-integration-specialist', name: 'Terminal Specialist', title: 'Terminal emulation, SwiftTerm integration', dept: 'engineering',
    capabilities: 'terminal-emulation, text-rendering, swiftterm', skills: '' },
];

// ─── Routines ───
const ROUTINES_DATA = [
  { title: 'Calendario de contenido semanal', agent: 'marketing-content-creator', cron: '0 9 * * 1', schedule: 'Lunes 9:00', status: 'active',
    description: 'Crear plan de contenido: posts, stories, reels.' },
  { title: 'Research de tendencias', agent: 'product-trend-researcher', cron: '0 8 * * 2,4', schedule: 'Mar/Jue 8:00', status: 'active',
    description: 'Tendencias emergentes LATAM relevantes para clientes.' },
  { title: 'Revision de metricas', agent: 'support-analytics-reporter', cron: '0 10 * * 3', schedule: 'Mie 10:00', status: 'active',
    description: 'Engagement, alcance, y conversiones de la semana.' },
  { title: 'QA de entregables', agent: 'testing-reality-checker', cron: '0 16 * * 1-5', schedule: 'L-V 16:00', status: 'active',
    description: 'Tickets "done" que no han pasado QA. Default: NEEDS WORK.' },
  { title: 'Auditoria de marca', agent: 'design-brand-guardian', cron: '0 14 * * 5', schedule: 'Vie 14:00', status: 'active',
    description: 'Revisar entregables contra brand guidelines.' },
  { title: 'Resumen ejecutivo semanal', agent: 'support-executive-summary-generator', cron: '0 18 * * 5', schedule: 'Vie 18:00', status: 'active',
    description: 'Consolidar proyectos, tareas, metricas, bloqueadores.' },
  { title: 'Reporte financiero mensual', agent: 'support-finance-tracker', cron: '0 9 1 * *', schedule: '1ero/mes 9:00', status: 'active',
    description: 'P&L del mes, costos por proyecto, tokens consumidos.' },
  { title: 'Health check infraestructura', agent: 'support-infrastructure-maintainer', cron: '0 7 * * 1-5', schedule: 'L-V 7:00', status: 'active',
    description: 'Supabase, Netlify, n8n, MCPs Adobe, APIs externas.' },
  { title: 'Optimizacion de workflows', agent: 'testing-workflow-optimizer', cron: '0 11 * * 5', schedule: 'Vie 11:00', status: 'active',
    description: 'Tiempos, cuellos de botella, oportunidades de automatizacion.' },
];

// ─── Department Icon Map ───
const DEPT_ICONS = {
  creative: '&#10024;',    // sparkles
  marketing: '&#9752;',    // rocket-like
  engineering: '&#9881;',  // gear
  production: '&#9733;',   // star
  qa: '&#9888;',           // warning
  analytics: '&#9670;',    // diamond
  product: '&#9830;',      // diamond suit
  support: '&#9635;',      // shield-like
};

// ─── PIN Auth ───
function checkBrainAuth() {
  const token = localStorage.getItem('brain_token');
  if (!token) return false;
  try {
    const data = JSON.parse(atob(token));
    if (data.scope !== 'brain' || data.expires < Date.now()) {
      localStorage.removeItem('brain_token');
      return false;
    }
    brainToken = token;
    return true;
  } catch { return false; }
}

function showPinScreen() {
  document.querySelector('.dashboard-nav').style.display = 'none';
  document.querySelector('.brain-main').innerHTML = `
    <div class="pin-screen">
      <div class="pin-box">
        <div class="pin-logo">PVB <span style="color: var(--brain-accent)">&#9679;</span></div>
        <h1 class="pin-title">MASTER BRAIN</h1>
        <p class="pin-subtitle">Agent Command Center</p>
        <div class="pin-input-row">
          <input type="password" id="pinInput" class="pin-input" maxlength="6" placeholder="PIN" autocomplete="off">
        </div>
        <button class="pin-btn" id="pinSubmit">ACCESS</button>
        <p class="pin-error" id="pinError"></p>
      </div>
    </div>
  `;

  const pinInput = document.getElementById('pinInput');
  const pinSubmit = document.getElementById('pinSubmit');
  const pinError = document.getElementById('pinError');

  pinInput.focus();

  async function tryLogin() {
    const pin = pinInput.value.trim();
    if (!pin) return;
    pinSubmit.textContent = '...';
    pinSubmit.disabled = true;
    try {
      const res = await fetch('/.netlify/functions/brain-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem('brain_token', data.token);
        window.location.reload();
      } else {
        pinError.textContent = 'PIN incorrecto';
        pinInput.value = '';
        pinInput.focus();
      }
    } catch {
      pinError.textContent = 'Error de conexion';
    }
    pinSubmit.textContent = 'ACCESS';
    pinSubmit.disabled = false;
  }

  pinSubmit.addEventListener('click', tryLogin);
  pinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryLogin(); });
}

// ─── Init ───
document.addEventListener('DOMContentLoaded', async () => {
  if (!checkBrainAuth()) {
    showPinScreen();
    return;
  }

  allAgents = AGENTS_DATA;
  buildDepartments();
  renderNeuralMap();
  renderDepartmentsTab();
  renderAgentsTab();
  renderActivity();
  renderRoutines();
  renderAuditLog();
  updateKPIs();
  setupEventListeners();
});

function buildDepartments() {
  departments = Object.entries(DEPT_CONFIG).map(([key, cfg]) => ({
    key,
    ...cfg,
    agents: allAgents.filter(a => a.dept === key),
  }));
}

function countDeptSkills(dept) {
  return dept.agents.reduce((sum, a) => sum + (a.skills ? a.skills.split(',').filter(s => s.trim()).length : 0), 0);
}

function countTotalSkills() {
  const all = new Set();
  allAgents.forEach(a => { if (a.skills) a.skills.split(',').forEach(s => { if (s.trim()) all.add(s.trim()); }); });
  return all.size;
}

function countTotalCapabilities() {
  const all = new Set();
  allAgents.forEach(a => { if (a.capabilities) a.capabilities.split(',').forEach(c => { if (c.trim()) all.add(c.trim()); }); });
  return all.size;
}

// ─── Neural Map ───
function renderNeuralMap() {
  const container = document.getElementById('neuralDepartments');
  container.innerHTML = departments.map(dept => `
    <div class="neural-node dept-node dept-${dept.key}" data-dept="${dept.key}" style="--dept-color: ${dept.color}">
      <div class="node-icon">${dept.icon}</div>
      <div class="node-name">${dept.name}</div>
      <div class="node-title">${dept.director}</div>
      <div class="node-count">${dept.agents.length} agents</div>
      <div class="node-skills">${countDeptSkills(dept)} skills</div>
    </div>
  `).join('');
}

// ─── Departments Tab ───
function renderDepartmentsTab() {
  const grid = document.getElementById('departmentsGrid');
  grid.innerHTML = departments.map(dept => `
    <div class="dept-card dept-${dept.key}" style="--dept-color: ${dept.color}">
      <div class="dept-card-header">
        <h3>${dept.icon} ${dept.name}</h3>
        <span class="dept-agent-count">${dept.agents.length} agents</span>
      </div>
      <div class="dept-budget-bar">
        <div class="dept-budget-fill" style="width: 0%"></div>
      </div>
      <div class="dept-agents-list">
        ${dept.agents.map(agent => `
          <div class="dept-agent-row" data-agent-id="${agent.id}">
            <div class="dept-agent-info">
              <span class="agent-status-dot idle"></span>
              <div>
                <div class="dept-agent-name">${agent.name}</div>
                <div class="dept-agent-role">${agent.title}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// ─── Agents Tab ───
function renderAgentsTab(filter = 'all', search = '') {
  const grid = document.getElementById('agentsGrid');
  const deptFilter = document.getElementById('agentDeptFilter');

  // Populate filter if empty
  if (deptFilter.options.length <= 1) {
    departments.forEach(dept => {
      const opt = document.createElement('option');
      opt.value = dept.key;
      opt.textContent = dept.name;
      deptFilter.appendChild(opt);
    });
  }

  let filtered = allAgents.filter(a => a.dept !== 'ceo');
  if (filter !== 'all') {
    filtered = filtered.filter(a => a.dept === filter);
  }
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(a =>
      a.name.toLowerCase().includes(s) ||
      a.title.toLowerCase().includes(s) ||
      a.capabilities.toLowerCase().includes(s)
    );
  }

  grid.innerHTML = filtered.map(agent => {
    const deptCfg = DEPT_CONFIG[agent.dept] || {};
    return `
      <div class="agent-card" data-agent-id="${agent.id}" style="--dept-color: ${deptCfg.color || '#c9a96e'}">
        <div class="agent-card-icon">${deptCfg.icon || '&#9678;'}</div>
        <div class="agent-card-content">
          <div class="agent-card-name">${agent.name}</div>
          <div class="agent-card-title">${agent.title}</div>
          <span class="agent-card-dept-badge" style="background: ${deptCfg.color || '#c9a96e'}20; color: ${deptCfg.color || '#c9a96e'}">${deptCfg.name || agent.dept}</span>
        </div>
      </div>
    `;
  }).join('');

  if (!filtered.length) {
    grid.innerHTML = '<p class="no-data-text">No agents match your search.</p>';
  }
}

// ─── Activity Tab (replaces Budgets) ───
function renderActivity() {
  const container = document.getElementById('activityContainer');

  // Summary card
  const totalCaps = countTotalCapabilities();
  const totalSkills = countTotalSkills();

  let html = `
    <div class="budget-card" style="grid-column: 1 / -1">
      <div class="budget-card-header">
        <div class="budget-card-name">PVB Master Brain — Overview</div>
        <div class="budget-card-amount">${allAgents.length} agents</div>
      </div>
      <div class="activity-stats">
        <div class="activity-stat">
          <span class="activity-stat-value">${departments.length}</span>
          <span class="activity-stat-label">Departments</span>
        </div>
        <div class="activity-stat">
          <span class="activity-stat-value">${totalCaps}</span>
          <span class="activity-stat-label">Capabilities</span>
        </div>
        <div class="activity-stat">
          <span class="activity-stat-value">${totalSkills}</span>
          <span class="activity-stat-label">Unique Skills</span>
        </div>
        <div class="activity-stat">
          <span class="activity-stat-value">${ROUTINES_DATA.filter(r => r.status === 'active').length}</span>
          <span class="activity-stat-label">Active Routines</span>
        </div>
      </div>
    </div>
  `;

  // Department cards with agent count + skills breakdown
  departments.forEach(dept => {
    const deptSkills = countDeptSkills(dept);
    const deptCaps = dept.agents.reduce((sum, a) => sum + (a.capabilities ? a.capabilities.split(',').filter(c => c.trim()).length : 0), 0);
    const maxAgents = Math.max(...departments.map(d => d.agents.length));
    const pct = maxAgents > 0 ? (dept.agents.length / maxAgents * 100) : 0;

    html += `
      <div class="budget-card" style="--dept-color: ${dept.color}">
        <div class="budget-card-header">
          <div class="budget-card-name">${dept.icon} ${dept.name}</div>
          <div class="budget-card-amount">${dept.agents.length} agents</div>
        </div>
        <div class="budget-bar">
          <div class="budget-bar-fill" style="width: ${pct.toFixed(0)}%; background: ${dept.color}"></div>
        </div>
        <div class="budget-card-detail">
          <span>${deptCaps} capabilities</span>
          <span>${deptSkills} skills</span>
        </div>
        <div class="activity-agent-list">
          ${dept.agents.slice(0, 5).map(a => `<span class="activity-agent-chip">${a.name}</span>`).join('')}
          ${dept.agents.length > 5 ? `<span class="activity-agent-chip more">+${dept.agents.length - 5} more</span>` : ''}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ─── Routines Tab ───
function renderRoutines() {
  const list = document.getElementById('routinesList');
  list.innerHTML = ROUTINES_DATA.map(r => {
    const agent = allAgents.find(a => a.id === r.agent);
    return `
      <div class="routine-row">
        <span class="routine-status ${r.status}"></span>
        <div class="routine-info">
          <h4>${r.title}</h4>
          <p>${r.description}</p>
        </div>
        <span class="routine-cron">${r.cron}</span>
        <span class="routine-agent">${agent ? agent.name : r.agent}</span>
        <span class="routine-next">${r.schedule}</span>
      </div>
    `;
  }).join('');
}

// ─── Audit Log ───
function renderAuditLog() {
  const log = document.getElementById('auditLog');
  // Placeholder — will be populated from Supabase
  const sampleEntries = [
    { time: '2026-04-03 09:00', action: 'routine', detail: 'Calendario de contenido semanal ejecutado por Content Creator' },
    { time: '2026-04-03 07:00', action: 'routine', detail: 'Health check infraestructura — todos los servicios OK' },
    { time: '2026-04-02 16:00', action: 'execution', detail: 'QA de entregables — 2 tickets marcados NEEDS WORK' },
    { time: '2026-04-02 08:00', action: 'routine', detail: 'Research de tendencias — 3 trends relevantes identificados' },
    { time: '2026-04-01 09:00', action: 'budget', detail: 'Reset mensual de budgets — nuevo ciclo abril 2026' },
    { time: '2026-03-31 18:00', action: 'execution', detail: 'Resumen ejecutivo semanal generado — entregado a Pancho' },
  ];

  log.innerHTML = sampleEntries.map(e => `
    <div class="audit-entry">
      <span class="audit-time">${e.time}</span>
      <span class="audit-action">${e.action}</span>
      <span class="audit-detail">${e.detail}</span>
    </div>
  `).join('');
}

// ─── KPIs ───
function updateKPIs() {
  document.getElementById('kpiTotalAgents').textContent = allAgents.length;
  document.getElementById('kpiDepartments').textContent = departments.length;
  document.getElementById('kpiCapabilities').textContent = countTotalCapabilities();
  document.getElementById('kpiSkills').textContent = countTotalSkills();
  document.getElementById('kpiTasksCompleted').textContent = '0';
  document.getElementById('kpiRoutinesActive').textContent = ROUTINES_DATA.filter(r => r.status === 'active').length;
  document.getElementById('activeAgentCount').textContent = allAgents.length;
}

// ─── Agent Detail Modal ───
function openAgentModal(agentId) {
  const agent = allAgents.find(a => a.id === agentId);
  if (!agent) return;

  const deptCfg = DEPT_CONFIG[agent.dept] || {};
  document.getElementById('modalIcon').innerHTML = deptCfg.icon || '&#9678;';
  document.getElementById('modalIcon').style.borderColor = deptCfg.color || '#c9a96e';
  document.getElementById('modalIcon').style.color = deptCfg.color || '#c9a96e';
  document.getElementById('modalName').textContent = agent.name;
  document.getElementById('modalTitle').textContent = agent.title;
  document.getElementById('modalDept').textContent = deptCfg.name || agent.dept;
  document.getElementById('modalDept').style.background = (deptCfg.color || '#c9a96e') + '20';
  document.getElementById('modalDept').style.color = deptCfg.color || '#c9a96e';

  // Capabilities
  const caps = agent.capabilities.split(',').map(c => c.trim()).filter(Boolean);
  document.getElementById('modalCapabilities').innerHTML = caps.map(c =>
    `<span class="capability-tag">${c}</span>`
  ).join('');

  // Skills
  const skills = (agent.skills || '').split(',').map(s => s.trim()).filter(Boolean);
  document.getElementById('modalSkills').innerHTML = skills.length
    ? skills.map(s => `<span class="skill-tag">${s}</span>`).join('')
    : '<span class="no-data-text">No specific skills assigned</span>';

  // Status
  document.getElementById('modalBudgetFill').style.width = '100%';
  document.getElementById('modalBudgetFill').style.background = '#00C853';
  document.getElementById('modalBudgetText').textContent = 'Ready — available for tasks';

  // Tasks (placeholder)
  document.getElementById('modalTasks').innerHTML = '<span class="no-data-text">No recent tasks</span>';

  document.getElementById('agentModal').classList.add('open');
}

function closeAgentModal() {
  document.getElementById('agentModal').classList.remove('open');
}

// ─── Event Listeners ───
function setupEventListeners() {
  // Tabs
  document.querySelectorAll('.brain-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.brain-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.brain-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  // Agent clicks (delegated)
  document.addEventListener('click', (e) => {
    const agentCard = e.target.closest('[data-agent-id]');
    if (agentCard) {
      openAgentModal(agentCard.dataset.agentId);
      return;
    }

    const deptNode = e.target.closest('[data-dept]');
    if (deptNode) {
      // Switch to departments tab and scroll
      document.querySelectorAll('.brain-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.brain-tab-content').forEach(c => c.classList.remove('active'));
      document.querySelector('[data-tab="departments"]').classList.add('active');
      document.getElementById('tab-departments').classList.add('active');
    }
  });

  // Modal close
  document.getElementById('modalClose').addEventListener('click', closeAgentModal);
  document.getElementById('agentModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('agentModal')) closeAgentModal();
  });

  // Search & filter
  document.getElementById('agentSearch').addEventListener('input', (e) => {
    renderAgentsTab(document.getElementById('agentDeptFilter').value, e.target.value);
  });
  document.getElementById('agentDeptFilter').addEventListener('change', (e) => {
    renderAgentsTab(e.target.value, document.getElementById('agentSearch').value);
  });

  // Refresh
  document.getElementById('refreshData').addEventListener('click', () => {
    showNotification('Syncing agents...', 'info');
    // Future: fetch from Supabase
    setTimeout(() => showNotification('All agents synced', 'success'), 500);
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('brain_token');
    window.location.reload();
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAgentModal();
  });
}

// ─── Notifications ───
function showNotification(message, type = 'info') {
  const toast = document.createElement('div');
  toast.textContent = message;
  const colors = { success: '#16A34A', error: '#DC2626', info: '#3B82F6' };
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: ${colors[type] || colors.info};
    color: white; padding: 12px 24px; border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000; font-family: Inter, sans-serif;
    font-size: 13px; font-weight: 600;
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
