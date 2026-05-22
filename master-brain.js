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
  sales:       { name: 'Sales',             icon: '&#9654;', color: '#F59E0B', director: 'Sales Lead' },
};

// ─── All 68 Agents ───
// Models: opus = Opus 4.6 (complex reasoning), sonnet = Sonnet 4.6 (balanced), haiku = Haiku 4.5 (fast/simple)
const AGENTS_DATA = [
  // CEO
  { id: 'agents-orchestrator', name: 'Pancho — Orchestrator', title: 'Founder & CEO / Agents Orchestrator', dept: 'ceo', role: 'ceo', model: 'opus',
    capabilities: 'workflow-orchestration, quality-gate-enforcement, multi-agent-coordination, autonomous-error-recovery, dev-qa-loops', skills: '' },

  // CREATIVE (8)
  { id: 'design-brand-guardian', name: 'Brand Guardian', title: 'Identidad de marca, consistencia visual, brand systems', dept: 'creative', model: 'sonnet',
    capabilities: 'brand-identity, visual-systems, brand-voice, consistency-monitoring, brand-evolution, style-guides', skills: '' },
  { id: 'design-ui-designer', name: 'UI Designer', title: 'Design systems, component libraries, interfaces pixel-perfect', dept: 'creative', model: 'sonnet',
    capabilities: 'design-systems, component-libraries, dark-mode-theming, wcag-aa-accessibility, pixel-perfect-interfaces', skills: 'landing-page, page-cro' },
  { id: 'design-ux-architect', name: 'UX Architect', title: 'Foundations para devs, CSS systems, layout frameworks', dept: 'creative', model: 'opus',
    capabilities: 'css-design-systems, layout-frameworks, schema-compliance, developer-ready-foundations', skills: 'page-cro, onboarding-cro' },
  { id: 'design-ux-researcher', name: 'UX Researcher', title: 'User behavior analysis, usability testing, data-driven design', dept: 'creative', model: 'sonnet',
    capabilities: 'user-interviews, usability-testing, persona-development, journey-mapping', skills: '' },
  { id: 'design-image-prompt-engineer', name: 'Image Prompt Engineer', title: 'Prompts de fotografia IA profesional', dept: 'creative', model: 'sonnet',
    capabilities: 'ai-image-prompts, photography-direction, visual-concept-translation, style-consistency', skills: 'ad-creative' },
  { id: 'design-visual-storyteller', name: 'Visual Storyteller', title: 'Narrativa visual, multimedia, infografias', dept: 'creative', model: 'sonnet',
    capabilities: 'visual-narratives, multimedia-content, data-visualization, emotional-storytelling', skills: '' },
  { id: 'design-inclusive-visuals-specialist', name: 'Inclusive Visuals', title: 'Representacion diversa, anti-bias, imagenes culturales', dept: 'creative', model: 'haiku',
    capabilities: 'bias-detection, cultural-accuracy, intersectional-representation', skills: '' },
  { id: 'design-whimsy-injector', name: 'Whimsy Injector', title: 'Personalidad de marca, micro-interacciones, deleite', dept: 'creative', model: 'haiku',
    capabilities: 'brand-personality, micro-interactions, easter-eggs, playful-ux', skills: '' },

  // MARKETING (12)
  { id: 'marketing-content-creator', name: 'Content Creator', title: 'Estratega y creador de contenido multi-plataforma', dept: 'marketing', model: 'sonnet',
    capabilities: 'content-strategy, editorial-calendars, brand-storytelling, seo-content, copywriting', skills: 'content-strategy, copywriting, email-sequence, cold-email, social-content' },
  { id: 'marketing-social-media-strategist', name: 'Social Media Strategist', title: 'Estrategia cross-platform LinkedIn/Twitter', dept: 'marketing', model: 'sonnet',
    capabilities: 'cross-platform-campaigns, community-building, thought-leadership, real-time-engagement', skills: 'social-content' },
  { id: 'marketing-instagram-curator', name: 'Instagram Curator', title: 'Visual storytelling, comunidad, multi-formato', dept: 'marketing', model: 'haiku',
    capabilities: 'visual-brand-development, reels, stories, social-commerce, hashtag-strategy', skills: 'social-content, ad-creative' },
  { id: 'marketing-tiktok-strategist', name: 'TikTok Strategist', title: 'Contenido viral, algoritmo TikTok, creators', dept: 'marketing', model: 'haiku',
    capabilities: 'viral-content, algorithm-mastery, trend-analysis, creator-partnerships', skills: 'social-content, ad-creative' },
  { id: 'marketing-twitter-engager', name: 'Twitter Engager', title: 'Thought leadership, threads virales en X', dept: 'marketing', model: 'haiku',
    capabilities: 'real-time-engagement, thought-leadership, thread-creation, community-growth', skills: 'social-content' },
  { id: 'marketing-growth-hacker', name: 'Growth Hacker', title: 'Adquisicion de usuarios, growth loops, funnels', dept: 'marketing', model: 'opus',
    capabilities: 'growth-strategy, ab-testing, viral-mechanics, channel-optimization', skills: 'referral-program, paid-ads, free-tool-strategy, ab-test-setup' },
  { id: 'marketing-app-store-optimizer', name: 'App Store Optimizer', title: 'ASO, discoverability, conversion rate de apps', dept: 'marketing', model: 'haiku',
    capabilities: 'aso-optimization, keyword-research, screenshot-optimization, review-management', skills: '' },
  { id: 'specialized-developer-advocate', name: 'Developer Advocate', title: 'Comunidad de devs, DX, contenido tecnico', dept: 'marketing', model: 'sonnet',
    capabilities: 'developer-community, technical-content, dx-optimization, platform-adoption', skills: '' },
  { id: 'marketing-xiaohongshu-specialist', name: 'Xiaohongshu Specialist', title: 'Marketing lifestyle, micro-contenido estetico', dept: 'marketing', model: 'haiku',
    capabilities: 'lifestyle-content, trend-driven-strategy, aesthetic-storytelling', skills: '' },
  { id: 'marketing-wechat-official-account', name: 'WeChat Manager', title: 'WeChat OA, subscriber engagement', dept: 'marketing', model: 'haiku',
    capabilities: 'wechat-content, subscriber-engagement, mini-programs', skills: '' },
  { id: 'marketing-zhihu-strategist', name: 'Zhihu Strategist', title: 'Thought leadership y autoridad en Zhihu', dept: 'marketing', model: 'haiku',
    capabilities: 'knowledge-marketing, qa-strategy, brand-authority', skills: '' },
  { id: 'marketing-reddit-community-builder', name: 'Reddit Community Builder', title: 'Engagement autentico en Reddit', dept: 'marketing', model: 'haiku',
    capabilities: 'community-engagement, reddit-culture, authentic-marketing', skills: '' },

  // PAID MEDIA (3)
  { id: 'paid-media-meta-ads', name: 'Valentina — Meta Ads', title: 'Meta Ads specialist: fatiga creativa, audiencias, pacing y saturacion para Kaya, Aboga y Compliance', dept: 'marketing', model: 'sonnet',
    capabilities: 'custom-audiences, lookalikes, creative-fatigue-detection, audience-saturation, budget-pacing, crm-upload',
    skills: 'meta-audience-builder, meta-creative-fatigue-analyzer, meta-fatigue-monitor, meta-spend-tracker' },
  { id: 'paid-media-google-ads', name: 'Rodrigo — Google Ads', title: 'Google Ads specialist: Quality Score, keyword gaps, search term mining y performance period-over-period', dept: 'marketing', model: 'sonnet',
    capabilities: 'quality-score-audit, keyword-gap-analysis, search-term-mining, negative-keyword-lists, period-comparison, impression-share',
    skills: 'google-keyword-analyzer, google-negative-keywords, google-performance-auditor, google-search-terms' },
  { id: 'paid-media-linkedin-ads', name: 'Isidora — LinkedIn Ads', title: 'LinkedIn Ads specialist B2B: ABM audiences, bid optimization, bulk edits y copy Feel First para Compliance', dept: 'marketing', model: 'sonnet',
    capabilities: 'abm-audiences, firmographic-targeting, bid-optimization, bulk-campaign-editing, b2b-copy, feel-first-framework',
    skills: 'linkedin-audience-builder, linkedin-bid-optimizer, linkedin-bulk-editor, linkedin-creative-builder' },

  // ENGINEERING (10)
  { id: 'engineering-frontend-developer', name: 'Frontend Developer', title: 'React/Vue/Angular, responsive, Core Web Vitals', dept: 'engineering', model: 'sonnet',
    capabilities: 'modern-web-apps, responsive-design, performance-optimization, pwa, accessibility', skills: 'landing-page, page-cro' },
  { id: 'engineering-backend-architect', name: 'Backend Architect', title: 'Scalable systems, Supabase, APIs, databases', dept: 'engineering', model: 'opus',
    capabilities: 'system-design, database-architecture, api-design, event-driven-systems, security-first', skills: 'seo-audit, schema-markup, analytics-tracking' },
  { id: 'engineering-senior-developer', name: 'Senior Developer', title: 'Laravel/Livewire/FluxUI, Three.js, premium web', dept: 'engineering', model: 'opus',
    capabilities: 'laravel-livewire-fluxui, advanced-css, three-js, glass-morphism, organic-shapes', skills: '' },
  { id: 'engineering-rapid-prototyper', name: 'Rapid Prototyper', title: 'MVPs ultra-rapidos, proof-of-concept', dept: 'engineering', model: 'sonnet',
    capabilities: 'mvp-development, rapid-iteration, framework-selection', skills: '' },
  { id: 'engineering-security-engineer', name: 'Security Engineer', title: 'Threat modeling, OWASP, secure code review', dept: 'engineering', model: 'opus',
    capabilities: 'threat-modeling, vulnerability-assessment, secure-code-review, owasp-top-10', skills: '' },
  { id: 'engineering-devops-automator', name: 'DevOps Automator', title: 'CI/CD, Netlify, cloud ops, automation', dept: 'engineering', model: 'sonnet',
    capabilities: 'ci-cd-pipelines, cloud-infrastructure, containerization, monitoring', skills: '' },
  { id: 'engineering-mobile-app-builder', name: 'Mobile App Builder', title: 'iOS/Android, React Native, Flutter', dept: 'engineering', model: 'sonnet',
    capabilities: 'native-ios-android, react-native, flutter, cross-platform', skills: '' },
  { id: 'engineering-ai-engineer', name: 'AI Engineer', title: 'ML models, Claude API, integraciones IA', dept: 'engineering', model: 'opus',
    capabilities: 'ml-models, claude-api-integration, ai-features, data-pipelines', skills: '' },
  { id: 'engineering-technical-writer', name: 'Technical Writer', title: 'Docs de desarrollador, API references, tutoriales', dept: 'engineering', model: 'haiku',
    capabilities: 'developer-docs, api-references, readme-files, tutorials', skills: '' },
  { id: 'engineering-data-engineer', name: 'Data Engineer', title: 'Pipelines ETL/ELT, Spark, dbt, lakehouse', dept: 'engineering', model: 'sonnet',
    capabilities: 'etl-elt-pipelines, apache-spark, dbt, streaming-systems', skills: '' },

  // QA & TESTING (8)
  { id: 'testing-reality-checker', name: 'Reality Checker', title: 'Default: NEEDS WORK. Requiere evidencia abrumadora', dept: 'qa', model: 'sonnet',
    capabilities: 'integration-testing, evidence-validation, visual-proof, fantasy-detection', skills: '' },
  { id: 'testing-accessibility-auditor', name: 'Accessibility Auditor', title: 'WCAG, screen readers, inclusive design', dept: 'qa', model: 'sonnet',
    capabilities: 'wcag-audit, screen-reader-testing, inclusive-design, a11y-compliance', skills: '' },
  { id: 'testing-performance-benchmarker', name: 'Performance Benchmarker', title: 'Core Web Vitals, load testing, optimization', dept: 'qa', model: 'haiku',
    capabilities: 'performance-testing, core-web-vitals, load-testing', skills: '' },
  { id: 'testing-api-tester', name: 'API Tester', title: 'API validation, performance, QA integraciones', dept: 'qa', model: 'haiku',
    capabilities: 'api-validation, contract-testing, performance-testing, security-testing', skills: '' },
  { id: 'testing-tool-evaluator', name: 'Tool Evaluator', title: 'Evaluacion de herramientas antes de adoptar', dept: 'qa', model: 'sonnet',
    capabilities: 'tool-assessment, platform-evaluation, cost-benefit-analysis', skills: '' },
  { id: 'testing-workflow-optimizer', name: 'Workflow Optimizer', title: 'Analisis y automatizacion de procesos', dept: 'qa', model: 'sonnet',
    capabilities: 'process-analysis, bottleneck-detection, automation-opportunities', skills: '' },
  { id: 'testing-test-results-analyzer', name: 'Test Results Analyzer', title: 'Analisis de resultados de tests, metricas QA', dept: 'qa', model: 'haiku',
    capabilities: 'test-evaluation, quality-metrics, ab-test-analysis', skills: 'ab-test-setup' },
  { id: 'testing-evidence-collector', name: 'Evidence Collector', title: 'Screenshots, pruebas visuales, busca 3-5 issues', dept: 'qa', model: 'haiku',
    capabilities: 'visual-evidence, screenshot-capture, bug-documentation', skills: '' },

  // ANALYTICS & DATA (4)
  { id: 'support-analytics-reporter', name: 'Analytics Reporter', title: 'Dashboards, GA4/GTM, KPIs, business intelligence', dept: 'analytics', model: 'sonnet',
    capabilities: 'dashboards, statistical-analysis, predictive-modeling, data-visualization', skills: 'analytics-tracking, revops' },
  { id: 'sales-data-extraction-agent', name: 'Sales Data Extractor', title: 'Monitoreo Excel, metricas MTD/YTD', dept: 'analytics', model: 'haiku',
    capabilities: 'excel-monitoring, sales-metrics, pipeline-analysis', skills: '' },
  { id: 'data-consolidation-agent', name: 'Data Consolidator', title: 'Consolidacion en dashboards live', dept: 'analytics', model: 'haiku',
    capabilities: 'data-consolidation, live-dashboards, territory-summaries', skills: '' },
  { id: 'report-distribution-agent', name: 'Report Distributor', title: 'Distribucion automatizada de reportes', dept: 'analytics', model: 'haiku',
    capabilities: 'automated-distribution, territorial-routing, scheduled-reports', skills: '' },

  // PRODUCT STRATEGY (4)
  { id: 'product-sprint-prioritizer', name: 'Sprint Prioritizer', title: 'Agile planning, RICE/MoSCoW/Kano, pricing', dept: 'product', model: 'opus',
    capabilities: 'rice-moscow-kano, sprint-planning, capacity-planning, velocity-prediction', skills: 'pricing-strategy' },
  { id: 'product-behavioral-nudge-engine', name: 'Behavioral Nudge Engine', title: 'Psicologia conductual, retencion, churn', dept: 'product', model: 'opus',
    capabilities: 'behavioral-psychology, user-motivation, interaction-adaptation', skills: 'churn-prevention, onboarding-cro' },
  { id: 'product-trend-researcher', name: 'Trend Researcher', title: 'Market intelligence, tendencias, competitive analysis', dept: 'product', model: 'sonnet',
    capabilities: 'market-research, trend-analysis, competitive-intelligence', skills: 'competitor-alternatives' },
  { id: 'product-feedback-synthesizer', name: 'Feedback Synthesizer', title: 'Multi-channel feedback → insights accionables', dept: 'product', model: 'sonnet',
    capabilities: 'feedback-collection, qualitative-to-quantitative, sentiment-analysis', skills: '' },

  // PROJECT MANAGEMENT (5)
  { id: 'project-management-studio-producer', name: 'Studio Producer', title: 'Orquestacion de portafolio, vision creativa', dept: 'production', model: 'opus',
    capabilities: 'portfolio-management, creative-vision-alignment, resource-allocation', skills: 'launch-strategy' },
  { id: 'project-management-project-shepherd', name: 'Project Shepherd', title: 'Coordinacion cross-funcional, timeline, riesgos', dept: 'production', model: 'sonnet',
    capabilities: 'cross-functional-coordination, timeline-management, risk-mitigation', skills: '' },
  { id: 'project-management-studio-operations', name: 'Studio Operations', title: 'Eficiencia operativa dia a dia, procesos', dept: 'production', model: 'haiku',
    capabilities: 'daily-operations, process-optimization, resource-coordination', skills: '' },
  { id: 'project-management-experiment-tracker', name: 'Experiment Tracker', title: 'Diseno de experimentos, A/B tests', dept: 'production', model: 'sonnet',
    capabilities: 'experiment-design, ab-testing, hypothesis-validation', skills: 'ab-test-setup' },
  { id: 'project-manager-senior', name: 'Senior PM', title: 'Specs realistas, task decomposition, scope control', dept: 'production', model: 'opus',
    capabilities: 'spec-to-tasks, realistic-scope, exact-requirements', skills: '' },

  // SUPPORT & LEGAL (5)
  { id: 'support-legal-compliance-checker', name: 'Legal & Compliance', title: 'GDPR/CCPA/HIPAA, contratos, multi-jurisdiccion', dept: 'support', model: 'opus',
    capabilities: 'gdpr-ccpa-hipaa, risk-assessment, privacy-policies, content-compliance', skills: '' },
  { id: 'support-finance-tracker', name: 'Finance Tracker', title: 'P&L, cash flow, budgeting, cost management', dept: 'support', model: 'sonnet',
    capabilities: 'budgeting, cash-flow-management, financial-reporting, cost-management', skills: '' },
  { id: 'support-infrastructure-maintainer', name: 'Infrastructure Maintainer', title: 'System reliability, Supabase/Netlify monitoring', dept: 'support', model: 'haiku',
    capabilities: 'system-reliability, performance-optimization, monitoring, security', skills: '' },
  { id: 'support-executive-summary-generator', name: 'Executive Summary Gen', title: 'McKinsey SCQA + BCG Pyramid para C-suite', dept: 'support', model: 'opus',
    capabilities: 'scqa-framework, pyramid-principle, complexity-to-clarity', skills: 'sales-enablement' },
  { id: 'support-support-responder', name: 'Support Responder', title: 'Atencion al cliente excepcional, multi-canal', dept: 'support', model: 'haiku',
    capabilities: 'multi-channel-support, issue-resolution, proactive-care', skills: '' },

  // SPECIALIZED (4 — mapped to their departments)
  { id: 'specialized-cultural-intelligence-strategist', name: 'Cultural Intelligence', title: 'Inclusion global e inteligencia cultural', dept: 'product', model: 'sonnet',
    capabilities: 'cultural-analysis, bias-detection, global-context', skills: '' },
  { id: 'agentic-identity-trust', name: 'Identity & Trust Architect', title: 'Identidad y trust para agentes autonomos', dept: 'engineering', model: 'opus',
    capabilities: 'identity-systems, trust-verification, audit-trails', skills: '' },
  { id: 'engineering-autonomous-optimization-architect', name: 'Autonomous Optimizer', title: 'Shadow-testing APIs, guardrails financieros', dept: 'engineering', model: 'sonnet',
    capabilities: 'api-shadow-testing, cost-guardrails, performance-monitoring', skills: '' },
  { id: 'lsp-index-engineer', name: 'LSP Index Engineer', title: 'Language Server Protocol, code intelligence', dept: 'engineering', model: 'sonnet',
    capabilities: 'lsp-orchestration, semantic-indexing, code-intelligence', skills: '' },

  // XR & Spatial (5)
  { id: 'xr-immersive-developer', name: 'XR Immersive Dev', title: 'WebXR, browser-based AR/VR/XR', dept: 'engineering', model: 'sonnet',
    capabilities: 'webxr, browser-ar-vr, immersive-web', skills: '' },
  { id: 'xr-interface-architect', name: 'XR Interface Architect', title: 'Spatial interaction design for XR', dept: 'engineering', model: 'opus',
    capabilities: 'spatial-design, xr-interaction, immersive-ui', skills: '' },
  { id: 'xr-cockpit-interaction-specialist', name: 'XR Cockpit Specialist', title: 'Cockpit control systems for XR', dept: 'engineering', model: 'sonnet',
    capabilities: 'cockpit-design, xr-controls, immersive-dashboards', skills: '' },
  { id: 'visionos-spatial-engineer', name: 'visionOS Engineer', title: 'visionOS, SwiftUI volumetric, Liquid Glass', dept: 'engineering', model: 'sonnet',
    capabilities: 'visionos, swiftui-volumetric, liquid-glass', skills: '' },
  { id: 'macos-spatial-metal-engineer', name: 'macOS Metal Engineer', title: 'Swift Metal, 3D rendering, spatial computing', dept: 'engineering', model: 'sonnet',
    capabilities: 'metal-api, 3d-rendering, spatial-computing', skills: '' },

  // Data reporters (mapped to analytics)
  { id: 'data-analytics-reporter', name: 'Data Analytics Reporter', title: 'Raw data → actionable business insights', dept: 'analytics', model: 'sonnet',
    capabilities: 'data-analysis, dashboards, statistical-analysis, kpi-tracking', skills: '' },

  // Terminal specialist (mapped to engineering)
  { id: 'terminal-integration-specialist', name: 'Terminal Specialist', title: 'Terminal emulation, SwiftTerm integration', dept: 'engineering', model: 'haiku',
    capabilities: 'terminal-emulation, text-rendering, swiftterm', skills: '' },

  // SALES (3) — imported from agency-agents
  { id: 'sales-proposal-strategist', name: 'Proposal Strategist', title: 'Win narratives, presupuestos y propuestas persuasivas', dept: 'sales', model: 'opus',
    capabilities: 'win-theme-development, proposal-narrative, executive-summary, competitive-positioning, pricing-narrative', skills: 'sales-enablement' },
  { id: 'sales-outbound-strategist', name: 'Outbound Strategist', title: 'Signal-based prospecting, cold email, ICP, secuencias multicanal', dept: 'sales', model: 'sonnet',
    capabilities: 'signal-based-outreach, icp-definition, cold-email, sequence-design, pipeline-building', skills: '' },
  { id: 'sales-discovery-coach', name: 'Discovery Coach', title: 'Discovery calls, SPIN selling, gap mapping, manejo de objeciones', dept: 'sales', model: 'sonnet',
    capabilities: 'spin-selling, gap-selling, sandler-pain-funnel, call-structure, objection-handling', skills: '' },

  // CEO PERSONAL PERFORMANCE (1)
  { id: 'pvb-5am-coach', name: '5AM Coach — Robin Sharma', title: 'Coach de alto rendimiento basado en El Club de las 5 AM. Victory Hour, 4 Imperios Interiores, 66 dias de instalacion de habitos', dept: 'ceo', model: 'opus',
    capabilities: '20-20-20-formula, mindset-heartset-healthset-soulset, habit-installation-66-days, twin-cycles-elite-performance, four-focuses-history-makers, victory-hour-design',
    skills: 'pvb-5am-coach' },
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
  simulateAgentActivity();
  buildDepartments();
  renderNeuralMap();
  renderDepartmentsTab();
  renderAgentsTab();
  renderActivity();
  renderRoutines();
  renderAuditLog();
  initLearnings();
  renderLearningsTab();
  renderPortfolio();

  // Check for Drive OAuth callback
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('drive_connected') === 'true') {
    showNotification('Google Drive connected — department folders created', 'success');
    history.replaceState(null, '', window.location.pathname);
  }
  renderProposals();
  renderCampaigns();
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

// ─── Office Canvas ───
function renderNeuralMap() {
  const floor = document.getElementById('officeFloor');

  // Agents with routines
  const routineAgentIds = new Set(ROUTINES_DATA.map(r => r.agent));

  floor.innerHTML = departments.map(dept => {
    // Room size based on team count
    const roomClass = dept.agents.length >= 10 ? 'room-xl' : 'room-lg';

    const desksHtml = dept.agents.map(agent => {
      const skills = (agent.skills || '').split(',').filter(s => s.trim());
      const hasRoutine = routineAgentIds.has(agent.id);
      const capCount = (agent.capabilities || '').split(',').filter(c => c.trim()).length;
      const deskSize = capCount >= 5 ? 'desk-lg' : capCount >= 3 ? 'desk-md' : 'desk-sm';

      // Live status from simulation
      const live = getAgentStatus(agent.id);
      const isActive = live.status !== 'idle';
      const lampClass = isActive ? live.status : (hasRoutine ? 'routine' : skills.length > 0 ? 'on' : '');
      const tooltip = isActive ? `${agent.name}: ${live.task}` : agent.title;

      let itemsHtml = '';
      if (isActive) {
        itemsHtml += `<span class="desk-item status-${live.status}">${getStatusLabel(live.status)}</span>`;
      } else {
        if (skills.length) itemsHtml += `<span class="desk-item has-skills">${skills.length} skills</span>`;
        if (hasRoutine) itemsHtml += `<span class="desk-item has-routine">routine</span>`;
      }

      return `
        <div class="agent-desk ${deskSize} ${isActive ? 'desk-active' : ''}" data-agent-id="${agent.id}" title="${tooltip}">
          <div class="desk-lamp ${lampClass}" ${isActive ? `style="background: ${getStatusColor(live.status)}; box-shadow: 0 0 8px ${getStatusColor(live.status)}"` : ''}></div>
          <div class="desk-agent-name">${agent.name} <span class="model-badge model-${agent.model || 'sonnet'}">${(agent.model || 'sonnet').toUpperCase()}</span></div>
          ${isActive ? `<div class="desk-task-preview">${live.task}</div>` : `<div class="desk-agent-title">${agent.title}</div>`}
          ${itemsHtml ? `<div class="desk-items">${itemsHtml}</div>` : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="dept-room ${roomClass} dept-${dept.key}" style="--dept-color: ${dept.color}">
        <div class="room-sign">
          <div class="room-sign-left">
            <div class="room-sign-icon">${dept.icon}</div>
            <div>
              <div class="room-sign-name">${dept.name}</div>
              <div class="room-sign-director">${dept.director}</div>
            </div>
          </div>
          <span class="room-sign-count">${dept.agents.length}</span>
        </div>
        <div class="room-desks">
          ${desksHtml}
        </div>
      </div>
    `;
  }).join('');
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
          <div class="agent-card-name">${agent.name} <span class="model-badge model-${agent.model || 'sonnet'}">${(agent.model || 'sonnet').toUpperCase()}</span></div>
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
// ─── Learnings System ───
let agentLearnings = {}; // { agent_id: [{ id, learning, category, confidence, times_applied }] }

// Sample learnings data (will be replaced by Supabase data)
const SAMPLE_LEARNINGS = [
  { id: '1', agent_id: 'marketing-content-creator', learning: 'Para clientes LATAM, usar tono casual pero profesional. Evitar formalidades excesivas.', category: 'style', confidence: 0.95, times_applied: 12 },
  { id: '2', agent_id: 'marketing-content-creator', learning: 'Posts de martes y jueves tienen 40% mas engagement que otros dias.', category: 'technique', confidence: 0.85, times_applied: 8 },
  { id: '3', agent_id: 'marketing-content-creator', learning: 'No usar emojis en LinkedIn — reduce credibilidad profesional para audiencia chilena.', category: 'avoid', confidence: 0.9, times_applied: 5 },
  { id: '4', agent_id: 'design-brand-guardian', learning: 'Kaya usa paleta fria invierno: azul petroleo, gris grafito, blanco roto. Nunca colores calidos.', category: 'client', confidence: 0.98, times_applied: 15 },
  { id: '5', agent_id: 'design-brand-guardian', learning: 'Siempre verificar que logos tengan zona de exclusion minima de 2x el alto del isotipo.', category: 'technique', confidence: 0.92, times_applied: 7 },
  { id: '6', agent_id: 'engineering-backend-architect', learning: 'Supabase RLS policies deben testearse con rol anon Y authenticated antes de deploy.', category: 'process', confidence: 0.95, times_applied: 4 },
  { id: '7', agent_id: 'engineering-frontend-developer', learning: 'Netlify functions con esbuild requieren imports ESM — no usar require().', category: 'tool', confidence: 0.99, times_applied: 10 },
  { id: '8', agent_id: 'testing-reality-checker', learning: 'Screenshots deben incluir URL bar visible como evidencia del entorno (staging vs prod).', category: 'technique', confidence: 0.88, times_applied: 6 },
  { id: '9', agent_id: 'support-executive-summary-generator', learning: 'Pancho prefiere bullet points sobre parrafos. Max 5 bullets por seccion.', category: 'style', confidence: 0.95, times_applied: 9 },
  { id: '10', agent_id: 'marketing-instagram-curator', learning: 'Reels con texto overlay en los primeros 0.5s tienen 60% mas retention.', category: 'technique', confidence: 0.82, times_applied: 3 },
  { id: '11', agent_id: 'product-sprint-prioritizer', learning: 'Para PVB, usar RICE por default. MoSCoW solo cuando el cliente lo pide.', category: 'process', confidence: 0.87, times_applied: 4 },
  { id: '12', agent_id: 'engineering-senior-developer', learning: 'Glass morphism: backdrop-filter blur(20px) + rgba bg 0.3-0.6 opacity. Siempre fallback solid color.', category: 'technique', confidence: 0.93, times_applied: 8 },
];

function initLearnings() {
  agentLearnings = {};
  SAMPLE_LEARNINGS.forEach(l => {
    if (!agentLearnings[l.agent_id]) agentLearnings[l.agent_id] = [];
    agentLearnings[l.agent_id].push(l);
  });
}

function renderLearningsTab(deptFilter = 'all', catFilter = 'all') {
  const grid = document.getElementById('learningsGrid');
  const statsBar = document.getElementById('learningsStatsBar');
  const deptSelect = document.getElementById('learningsDeptFilter');

  // Populate dept filter
  if (deptSelect.options.length <= 1) {
    departments.forEach(dept => {
      const opt = document.createElement('option');
      opt.value = dept.key;
      opt.textContent = dept.name;
      deptSelect.appendChild(opt);
    });
  }

  const allLearnings = SAMPLE_LEARNINGS.slice();

  // Stats
  const totalLearnings = allLearnings.length;
  const categories = {};
  const agentsWithLearnings = new Set();
  let totalApplied = 0;
  allLearnings.forEach(l => {
    categories[l.category] = (categories[l.category] || 0) + 1;
    agentsWithLearnings.add(l.agent_id);
    totalApplied += l.times_applied;
  });

  statsBar.innerHTML = `
    <div class="learning-stat-card"><div class="learning-stat-value">${totalLearnings}</div><div class="learning-stat-label">LEARNINGS</div></div>
    <div class="learning-stat-card"><div class="learning-stat-value">${agentsWithLearnings.size}</div><div class="learning-stat-label">AGENTS LEARNING</div></div>
    <div class="learning-stat-card"><div class="learning-stat-value">${totalApplied}</div><div class="learning-stat-label">TIMES APPLIED</div></div>
    <div class="learning-stat-card"><div class="learning-stat-value">${Object.keys(categories).length}</div><div class="learning-stat-label">CATEGORIES</div></div>
  `;

  // Filter
  let filtered = allLearnings;
  if (deptFilter !== 'all') {
    const deptAgentIds = allAgents.filter(a => a.dept === deptFilter).map(a => a.id);
    filtered = filtered.filter(l => deptAgentIds.includes(l.agent_id));
  }
  if (catFilter !== 'all') {
    filtered = filtered.filter(l => l.category === catFilter);
  }

  grid.innerHTML = filtered.length ? filtered.map(l => {
    const agent = allAgents.find(a => a.id === l.agent_id);
    return `
      <div class="learning-row">
        <span class="learning-agent-name">${agent ? agent.name : l.agent_id}</span>
        <span class="learning-text">${l.learning}</span>
        <span class="learning-category-badge cat-${l.category}">${l.category}</span>
        <span class="learning-confidence">${Math.round(l.confidence * 100)}% · ${l.times_applied}x</span>
      </div>
    `;
  }).join('') : '<p class="no-data-text">No learnings match your filter.</p>';
}

function getAgentLearnings(agentId) {
  return agentLearnings[agentId] || [];
}

function renderModalLearnings(agentId) {
  const learnings = getAgentLearnings(agentId);
  const container = document.getElementById('modalLearnings');
  const countEl = document.getElementById('modalLearningCount');
  countEl.textContent = learnings.length;

  container.innerHTML = learnings.length ? learnings.map(l => `
    <div class="modal-learning-item" data-learning-id="${l.id}">
      <span class="learning-category-badge cat-${l.category}">${l.category}</span>
      <span class="modal-learning-text">${l.learning}</span>
      <button class="modal-learning-remove" title="Remove learning" data-lid="${l.id}">&times;</button>
    </div>
  `).join('') : '<span class="no-data-text">No learnings yet — teach this agent below.</span>';
}

function addLearning(agentId) {
  const input = document.getElementById('learningInput');
  const category = document.getElementById('learningCategory').value;
  const text = input.value.trim();
  if (!text) return;

  const newLearning = {
    id: 'local-' + Date.now(),
    agent_id: agentId,
    learning: text,
    category,
    confidence: 0.8,
    times_applied: 0,
  };

  SAMPLE_LEARNINGS.push(newLearning);
  if (!agentLearnings[agentId]) agentLearnings[agentId] = [];
  agentLearnings[agentId].push(newLearning);

  input.value = '';
  renderModalLearnings(agentId);
  showNotification(`Learning added to ${allAgents.find(a => a.id === agentId)?.name || agentId}`, 'success');
}

function removeLearning(learningId, agentId) {
  const idx = SAMPLE_LEARNINGS.findIndex(l => l.id === learningId);
  if (idx > -1) SAMPLE_LEARNINGS.splice(idx, 1);
  if (agentLearnings[agentId]) {
    agentLearnings[agentId] = agentLearnings[agentId].filter(l => l.id !== learningId);
  }
  renderModalLearnings(agentId);
}

// ─── Portfolio (Google Drive) ───
let driveConnected = false;
let driveFolders = [];
let currentDriveFolder = 'all';

async function checkDriveConnection() {
  try {
    const res = await fetch('/.netlify/functions/drive-files?action=folders');
    const data = await res.json();
    if (data.success && data.connected) {
      driveConnected = true;
      driveFolders = data.folders || [];
      return true;
    }
  } catch (e) { /* not connected */ }
  return false;
}

async function renderPortfolio() {
  const header = document.getElementById('portfolioHeader');
  const foldersEl = document.getElementById('portfolioFolders');
  const grid = document.getElementById('portfolioGrid');

  const connected = await checkDriveConnection();

  if (!connected) {
    header.innerHTML = `
      <div class="portfolio-connect">
        <p class="portfolio-connect-text">Connect Google Drive (info@panchovial.com) to browse deliverables</p>
        <button type="button" class="pin-btn portfolio-connect-btn" id="connectDriveBtn">Connect Drive</button>
      </div>
    `;
    foldersEl.innerHTML = '';
    grid.innerHTML = '';

    document.getElementById('connectDriveBtn')?.addEventListener('click', connectDrive);
    return;
  }

  // Connected — show folder tabs
  header.innerHTML = '';
  const allFolders = [{ id: 'all', name: 'All' }, ...driveFolders];
  foldersEl.innerHTML = allFolders.map(f =>
    `<button type="button" class="portfolio-folder-btn ${f.id === currentDriveFolder ? 'active' : ''}" data-folder="${f.id}" data-folder-name="${f.name}">${f.name}</button>`
  ).join('');

  // Folder click handlers
  foldersEl.querySelectorAll('.portfolio-folder-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentDriveFolder = btn.dataset.folder;
      foldersEl.querySelectorAll('.portfolio-folder-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadDriveFiles(btn.dataset.folder === 'all' ? null : btn.dataset.folderName);
    });
  });

  // Load files
  await loadDriveFiles(null);
}

async function loadDriveFiles(folder) {
  const grid = document.getElementById('portfolioGrid');
  grid.innerHTML = '<p class="portfolio-empty">Loading...</p>';

  try {
    const url = folder
      ? `/.netlify/functions/drive-files?folder=${encodeURIComponent(folder)}`
      : '/.netlify/functions/drive-files';

    const res = await fetch(url);
    const data = await res.json();

    if (!data.success || !data.files?.length) {
      grid.innerHTML = '<p class="portfolio-empty">No files in this folder yet.</p>';
      return;
    }

    grid.innerHTML = data.files.map(f => {
      const isImage = f.mimeType?.startsWith('image/');
      const isVideo = f.mimeType?.startsWith('video/');
      const isPdf = f.mimeType === 'application/pdf';
      const icon = isVideo ? '&#9654;' : isPdf ? '&#9776;' : '&#9634;';
      const sizeStr = f.size ? formatFileSize(f.size) : '';
      const dateStr = f.modified ? new Date(f.modified).toLocaleDateString('es-CL') : '';

      return `
        <div class="portfolio-item" data-view-link="${f.viewLink || ''}" onclick="window.open('${f.viewLink}', '_blank')">
          ${f.thumbnail
            ? `<img class="portfolio-thumb" src="${f.thumbnail}" alt="${f.name}" loading="lazy">`
            : `<div class="portfolio-thumb-placeholder">${icon}</div>`
          }
          <div class="portfolio-item-info">
            <div class="portfolio-item-name" title="${f.name}">${f.name}</div>
            <div class="portfolio-item-meta">${sizeStr}${sizeStr && dateStr ? ' · ' : ''}${dateStr}</div>
          </div>
        </div>
      `;
    }).join('');

  } catch (e) {
    grid.innerHTML = `<p class="portfolio-empty">Error loading files: ${e.message}</p>`;
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

async function connectDrive() {
  try {
    const token = localStorage.getItem('brain_token');
    const res = await fetch('/.netlify/functions/oauth-drive-initiate', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success && data.authorization_url) {
      window.location.href = data.authorization_url;
    } else {
      showNotification(data.message || 'Error connecting Drive', 'error');
    }
  } catch (e) {
    showNotification('Error: ' + e.message, 'error');
  }
}

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

// ─── Clientes ───
const PLATFORM_ICONS = { instagram: '📸', facebook: '📘', tiktok: '🎵', youtube: '▶️', linkedin: '💼' };
const PLATFORM_COLORS = { instagram: '#E1306C', facebook: '#1877F2', tiktok: '#010101', youtube: '#FF0000', linkedin: '#0A66C2' };

async function loadClients() {
  const grid = document.getElementById('clientsGrid');
  const empty = document.getElementById('clientsEmpty');
  grid.innerHTML = '<div class="loading-state">Cargando clientes...</div>';

  const token = localStorage.getItem('brain_token');
  try {
    const res = await fetch('/.netlify/functions/brain-clients?action=list', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);

    const clients = data.clients || [];
    const badge = document.getElementById('clientsBadge');
    if (clients.length > 0) {
      badge.textContent = clients.length;
      badge.classList.remove('hidden');
    }

    if (clients.length === 0) {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    grid.innerHTML = clients.map(c => `
      <div class="client-card" data-client-id="${c.id}">
        <div class="client-card-header">
          <div class="client-avatar">${(c.name || '?')[0].toUpperCase()}</div>
          <div class="client-info">
            <div class="client-name">${c.name}</div>
            <div class="client-company">${c.company || c.email || ''}</div>
          </div>
        </div>
        <div class="client-platforms">
          ${c.platforms.length === 0
            ? '<span class="no-platforms">Sin cuentas conectadas</span>'
            : c.platforms.map(p => `
              <button type="button" class="platform-chip" style="border-color:${PLATFORM_COLORS[p.platform] || '#888'}"
                data-client-id="${c.id}" data-platform="${p.platform}">
                ${PLATFORM_ICONS[p.platform] || '🔗'} ${p.username || p.account_name || p.platform}
              </button>`).join('')}
        </div>
        <div class="client-stats-area" id="stats-${c.id}"></div>
        <div class="client-card-actions">
          <button type="button" class="action-btn small" onclick="analyzeClient('${c.id}','${c.name}')">&#9881; Analizar</button>
        </div>
      </div>
    `).join('');

    // Platform chip click → load stats
    grid.querySelectorAll('.platform-chip').forEach(btn => {
      btn.addEventListener('click', () => loadClientStats(btn.dataset.clientId, btn.dataset.platform));
    });

  } catch (err) {
    grid.innerHTML = `<div class="error-state">Error cargando clientes: ${err.message}</div>`;
  }
}

async function loadClientStats(clientId, platform) {
  const area = document.getElementById(`stats-${clientId}`);
  area.innerHTML = '<span class="loading-inline">Cargando métricas...</span>';

  const token = localStorage.getItem('brain_token');
  try {
    const res = await fetch(`/.netlify/functions/brain-clients?action=stats&user_id=${clientId}&platform=${platform}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);

    const s = data.stats;
    const rows = Object.entries(s)
      .filter(([k]) => !['username', 'profile_picture', 'name', 'title'].includes(k))
      .map(([k, v]) => `<div class="stat-row"><span class="stat-key">${k.replace(/_/g, ' ')}</span><span class="stat-val">${Number.isFinite(+v) ? (+v).toLocaleString() : v}</span></div>`)
      .join('');

    area.innerHTML = `<div class="stats-block"><div class="stats-platform-label" style="color:${PLATFORM_COLORS[platform]}">${PLATFORM_ICONS[platform]} ${platform}</div>${rows}</div>`;
  } catch (err) {
    area.innerHTML = `<span class="error-inline">${err.message}</span>`;
  }
}

function analyzeClient(clientId, clientName) {
  showNotification(`Análisis de ${clientName} pendiente — conectar con agente de estrategia`);
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
  document.getElementById('modalName').innerHTML = agent.name + ` <span class="model-badge model-${agent.model || 'sonnet'}">${(agent.model || 'sonnet').toUpperCase()}</span>`;
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

  // Live status
  const live = getAgentStatus(agentId);
  const statusEl = document.getElementById('modalLiveStatus');
  const statusDot = statusEl.querySelector('.live-dot');
  const statusText = document.getElementById('modalStatusText');
  const statusColor = getStatusColor(live.status);
  statusDot.style.background = statusColor;
  statusDot.style.boxShadow = `0 0 8px ${statusColor}`;
  statusText.textContent = live.status === 'idle'
    ? 'Idle — ready for tasks'
    : `${getStatusLabel(live.status)} — ${live.task}`;

  // Performance stats
  const agentProposals = SAMPLE_PROPOSALS.filter(p => p.agent_id === agentId);
  document.getElementById('modalTasksDone').textContent = Math.floor(Math.random() * 20 + 3);
  document.getElementById('modalProposals').textContent = agentProposals.length;
  document.getElementById('modalQuality').textContent = (3.5 + Math.random() * 1.5).toFixed(1);
  document.getElementById('modalStreak').textContent = Math.floor(Math.random() * 14 + 1) + 'd';

  // Recent tasks (simulated)
  const recentTasks = live.status !== 'idle'
    ? `<div class="modal-task-row active"><span class="task-dot" style="background:${statusColor}"></span>${live.task}<span class="task-time">now</span></div>`
    : '';
  document.getElementById('modalTasks').innerHTML = recentTasks
    + '<div class="modal-task-row"><span class="task-dot"></span>Routine check completed<span class="task-time">2h ago</span></div>'
    + '<div class="modal-task-row"><span class="task-dot"></span>Weekly deliverable reviewed<span class="task-time">1d ago</span></div>'
    || '<span class="no-data-text">No recent activity</span>';

  // Proposals by this agent
  const proposalsList = document.getElementById('modalProposalsList');
  if (agentProposals.length) {
    proposalsList.innerHTML = agentProposals.map(p => `
      <div class="modal-proposal-row">
        <span class="proposal-status-dot status-${p.status}"></span>
        <div class="modal-proposal-info">
          <span class="modal-proposal-title">${p.title}</span>
          <span class="modal-proposal-meta">${p.category} · ${p.priority} · ${getTimeAgo(p.created_at)}</span>
        </div>
      </div>
    `).join('');
  } else {
    proposalsList.innerHTML = '<span class="no-data-text">No proposals yet</span>';
  }

  // Render learnings for this agent
  renderModalLearnings(agentId);

  // Wire up add learning button
  const addBtn = document.getElementById('learningAddBtn');
  const newAddBtn = addBtn.cloneNode(true);
  addBtn.parentNode.replaceChild(newAddBtn, addBtn);
  newAddBtn.addEventListener('click', () => addLearning(agentId));

  // Wire up enter key on input
  const input = document.getElementById('learningInput');
  const newInput = input.cloneNode(true);
  input.parentNode.replaceChild(newInput, input);
  newInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addLearning(agentId); });

  // Wire up remove buttons (delegated)
  document.getElementById('modalLearnings').addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.modal-learning-remove');
    if (removeBtn) removeLearning(removeBtn.dataset.lid, agentId);
  });

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
      if (tab.dataset.tab === 'clients') loadClients();
      if (tab.dataset.tab === 'competitor-config' && !competitorTabInitialized) {
        competitorTabInitialized = true;
        initCompetitorConfigTab();
      }
    });
  });

  document.getElementById('refreshClients')?.addEventListener('click', loadClients);

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

  // Learnings filters
  const learnDeptFilter = document.getElementById('learningsDeptFilter');
  const learnCatFilter = document.getElementById('learningsCatFilter');
  if (learnDeptFilter) learnDeptFilter.addEventListener('change', () => renderLearningsTab(learnDeptFilter.value, learnCatFilter.value));
  if (learnCatFilter) learnCatFilter.addEventListener('change', () => renderLearningsTab(learnDeptFilter.value, learnCatFilter.value));

  // Proposal filters
  const catFilter = document.getElementById('proposalCategoryFilter');
  const statFilter = document.getElementById('proposalStatusFilter');
  if (catFilter) catFilter.addEventListener('change', () => renderProposals(catFilter.value, statFilter.value));
  if (statFilter) statFilter.addEventListener('change', () => renderProposals(catFilter.value, statFilter.value));

  // Refresh
  document.getElementById('refreshData').addEventListener('click', () => {
    showNotification('Syncing agents...', 'info');
    simulateAgentActivity();
    renderNeuralMap();
    renderProposals();
    renderCampaigns();
    updateKPIs();
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
// ═══════════════════════════════════════════════════════════════
// PROPOSALS — Autonomous agent suggestions feed
// ═══════════════════════════════════════════════════════════════

// Sample proposals (until Supabase tables are created)
const SAMPLE_PROPOSALS = [
  {
    id: 'p1', agent_id: 'design-ux-architect', title: 'Simplify onboarding flow to 3 steps',
    description: 'Current onboarding has 7 steps with 45% drop-off at step 4. Reducing to 3 consolidated steps could increase completion by ~30%. Key changes: merge profile + preferences into one screen, defer non-essential fields to post-signup.',
    category: 'optimization', priority: 'high', target_area: 'ux',
    estimated_impact: '+30% onboarding completion', estimated_effort: '4-6 hours',
    status: 'pending', created_at: '2026-04-03T08:30:00Z'
  },
  {
    id: 'p2', agent_id: 'testing-performance-benchmarker', title: 'Dashboard images missing lazy loading',
    description: 'Campaign images on dashboard.html load eagerly, causing LCP of 4.2s on mobile. Adding loading="lazy" to below-fold images and switching to WebP format would reduce LCP to ~1.8s.',
    category: 'bug', priority: 'high', target_area: 'performance',
    estimated_impact: 'LCP 4.2s → 1.8s', estimated_effort: '1 hour',
    status: 'pending', created_at: '2026-04-03T07:00:00Z'
  },
  {
    id: 'p3', agent_id: 'marketing-growth-hacker', title: 'Add referral program to client portal',
    description: 'The client onboarding already has referral code UI but no backend validation. Implementing real referral tracking with double-sided incentives ($5K discount for referrer, $5K for referred) could generate 2-3 new clients/quarter at $0 CAC.',
    category: 'opportunity', priority: 'medium', target_area: 'growth',
    estimated_impact: '2-3 new clients/quarter', estimated_effort: '1 sprint',
    status: 'pending', created_at: '2026-04-02T14:00:00Z'
  },
  {
    id: 'p4', agent_id: 'design-brand-guardian', title: 'Inconsistent accent color across pages',
    description: 'Landing page uses #c9a96e but dashboard uses #d4b070 for the gold accent. Brand consistency requires a single source of truth. Recommend adding CSS custom property --pvb-gold and using it everywhere.',
    category: 'improvement', priority: 'low', target_area: 'brand',
    estimated_impact: 'Visual consistency +100%', estimated_effort: '30 min',
    status: 'approved', created_at: '2026-04-01T11:00:00Z'
  },
  {
    id: 'p5', agent_id: 'engineering-security-engineer', title: 'Add CSP headers to Netlify config',
    description: 'Current netlify.toml has basic security headers but no Content-Security-Policy. Adding a strict CSP would prevent XSS attacks. Recommend: default-src self, script-src self cdn.jsdelivr.net, style-src self fonts.googleapis.com unsafe-inline.',
    category: 'improvement', priority: 'high', target_area: 'security',
    estimated_impact: 'XSS protection', estimated_effort: '2 hours',
    status: 'pending', created_at: '2026-04-02T09:00:00Z'
  },
  {
    id: 'p6', agent_id: 'design-whimsy-injector', title: 'Add micro-animations to KPI cards',
    description: 'KPI cards currently appear static. Adding a subtle count-up animation on page load and a gentle pulse on hover would make the dashboard feel alive. CSS-only implementation, no JS needed.',
    category: 'creative', priority: 'low', target_area: 'ui',
    estimated_impact: 'Perceived quality +20%', estimated_effort: '1 hour',
    status: 'pending', created_at: '2026-04-03T06:00:00Z'
  },
  {
    id: 'p7', agent_id: 'testing-accessibility-auditor', title: 'Missing aria-labels on icon-only buttons',
    description: 'The refresh, settings, and logout buttons in the nav use SVG icons without text alternatives. Screen readers announce them as "button" with no context. Add aria-label to each.',
    category: 'bug', priority: 'medium', target_area: 'accessibility',
    estimated_impact: 'WCAG AA compliance', estimated_effort: '15 min',
    status: 'pending', created_at: '2026-04-02T16:00:00Z'
  },
  {
    id: 'p8', agent_id: 'product-behavioral-nudge-engine', title: 'Add streak counter to client dashboard',
    description: 'Clients who check their dashboard daily are 3x more likely to renew. Adding a visible "login streak" counter with milestone celebrations (7d, 30d, 90d) would increase daily engagement through loss aversion.',
    category: 'opportunity', priority: 'medium', target_area: 'retention',
    estimated_impact: '+40% daily active clients', estimated_effort: '3-4 hours',
    status: 'pending', created_at: '2026-04-01T10:00:00Z'
  },
];

// Simulated live agent states (until Supabase is connected)
const AGENT_LIVE_STATUS = {};
function simulateAgentActivity() {
  const activeIds = [
    'marketing-content-creator', 'support-analytics-reporter', 'testing-reality-checker',
    'design-brand-guardian', 'engineering-frontend-developer', 'product-trend-researcher',
    'support-finance-tracker', 'marketing-growth-hacker'
  ];
  const tasks = [
    'Reviewing weekly content calendar', 'Analyzing engagement metrics Q1',
    'QA check on 3 pending deliverables', 'Auditing brand consistency across pages',
    'Optimizing dashboard load performance', 'Researching LATAM market trends',
    'Processing March invoices from Drive', 'Modeling referral loop economics'
  ];
  const statuses = ['working', 'working', 'working', 'reviewing', 'proposing'];

  activeIds.forEach((id, i) => {
    AGENT_LIVE_STATUS[id] = {
      status: statuses[i % statuses.length],
      task: tasks[i],
      started: new Date(Date.now() - Math.random() * 3600000).toISOString()
    };
  });
}

function getAgentStatus(agentId) {
  return AGENT_LIVE_STATUS[agentId] || { status: 'idle', task: null };
}

function getStatusLabel(status) {
  const labels = {
    idle: 'Idle — ready for tasks',
    working: 'Working',
    reviewing: 'Reviewing',
    proposing: 'Drafting proposal',
    completed: 'Task completed'
  };
  return labels[status] || status;
}

function getStatusColor(status) {
  const colors = { idle: '#6B7280', working: '#34D399', reviewing: '#60A5FA', proposing: '#FBBF24', completed: '#10B981' };
  return colors[status] || '#6B7280';
}

// ─── Render Proposals Feed ───
function renderProposals(categoryFilter = 'all', statusFilter = 'pending') {
  const feed = document.getElementById('proposalsFeed');
  if (!feed) return;

  let proposals = [...SAMPLE_PROPOSALS];
  if (categoryFilter !== 'all') proposals = proposals.filter(p => p.category === categoryFilter);
  if (statusFilter !== 'all') proposals = proposals.filter(p => p.status === statusFilter);

  proposals.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
  });

  const pendingCount = SAMPLE_PROPOSALS.filter(p => p.status === 'pending').length;
  const badge = document.getElementById('proposalBadge');
  if (badge) {
    badge.textContent = pendingCount;
    badge.style.display = pendingCount > 0 ? 'inline-flex' : 'none';
  }

  if (!proposals.length) {
    feed.innerHTML = '<p class="no-data-text">No proposals match the current filters.</p>';
    return;
  }

  const priorityColors = { critical: '#EF4444', high: '#F59E0B', medium: '#3B82F6', low: '#6B7280' };
  const categoryIcons = {
    improvement: '&#9650;', bug: '&#9888;', opportunity: '&#9733;',
    optimization: '&#9881;', creative: '&#10024;'
  };
  const statusIcons = {
    pending: '&#9679;', approved: '&#10003;', rejected: '&#10007;',
    in_progress: '&#9654;', completed: '&#10004;'
  };

  feed.innerHTML = proposals.map(p => {
    const agent = allAgents.find(a => a.id === p.agent_id);
    const deptCfg = agent ? (DEPT_CONFIG[agent.dept] || {}) : {};
    const timeAgo = getTimeAgo(p.created_at);

    return `
      <div class="proposal-card" data-proposal-id="${p.id}" data-status="${p.status}">
        <div class="proposal-priority-bar" style="background: ${priorityColors[p.priority] || '#6B7280'}"></div>
        <div class="proposal-content">
          <div class="proposal-header">
            <div class="proposal-agent">
              <span class="proposal-agent-icon" style="color: ${deptCfg.color || '#c9a96e'}">${deptCfg.icon || '&#9678;'}</span>
              <span class="proposal-agent-name" data-agent-id="${p.agent_id}">${agent ? agent.name : p.agent_id}</span>
              <span class="proposal-time">${timeAgo}</span>
            </div>
            <div class="proposal-badges">
              <span class="proposal-category">${categoryIcons[p.category] || ''} ${p.category}</span>
              <span class="proposal-priority" style="color: ${priorityColors[p.priority]}">${p.priority}</span>
            </div>
          </div>
          <h3 class="proposal-title">${p.title}</h3>
          <p class="proposal-desc">${p.description}</p>
          <div class="proposal-meta">
            ${p.estimated_impact ? `<span class="proposal-impact">Impact: ${p.estimated_impact}</span>` : ''}
            ${p.estimated_effort ? `<span class="proposal-effort">Effort: ${p.estimated_effort}</span>` : ''}
            ${p.target_area ? `<span class="proposal-area">${p.target_area}</span>` : ''}
          </div>
          ${p.status === 'pending' ? `
            <div class="proposal-actions">
              <button class="proposal-btn approve" onclick="handleProposal('${p.id}', 'approved')">Approve</button>
              <button class="proposal-btn reject" onclick="handleProposal('${p.id}', 'rejected')">Reject</button>
              <button class="proposal-btn discuss" onclick="openAgentModal('${p.agent_id}')">Discuss</button>
            </div>
          ` : `
            <div class="proposal-status-badge status-${p.status}">${statusIcons[p.status] || ''} ${p.status}</div>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function handleProposal(proposalId, newStatus) {
  const proposal = SAMPLE_PROPOSALS.find(p => p.id === proposalId);
  if (proposal) {
    proposal.status = newStatus;
    proposal.reviewed_at = new Date().toISOString();
    renderProposals(
      document.getElementById('proposalCategoryFilter')?.value || 'all',
      document.getElementById('proposalStatusFilter')?.value || 'pending'
    );
    showNotification(
      `Proposal "${proposal.title}" ${newStatus}`,
      newStatus === 'approved' ? 'success' : 'info'
    );
  }
}

// ─── Render Campaigns Tab ───
function renderCampaigns() {
  const grid = document.getElementById('campaignsGrid');
  if (!grid) return;

  // Sample campaign data (will come from Supabase campaigns table)
  const campaigns = [
    {
      name: 'Compliance Video — CGC',
      client: 'Compliance Global Consulting',
      status: 'in_progress',
      agents_involved: ['marketing-content-creator', 'engineering-frontend-developer', 'design-visual-storyteller'],
      tasks: { total: 12, completed: 8, in_progress: 3, blocked: 1 },
      deadline: '2026-04-15',
      progress: 67,
    },
    {
      name: 'Kaya Winter Campaign 2026',
      client: 'Kaya Unite',
      status: 'in_progress',
      agents_involved: ['design-image-prompt-engineer', 'marketing-instagram-curator', 'marketing-tiktok-strategist', 'design-brand-guardian'],
      tasks: { total: 18, completed: 5, in_progress: 8, blocked: 0 },
      deadline: '2026-05-01',
      progress: 28,
    },
    {
      name: 'Client Portal v2',
      client: 'PVB Internal',
      status: 'in_progress',
      agents_involved: ['engineering-frontend-developer', 'engineering-backend-architect', 'design-ux-architect', 'testing-reality-checker'],
      tasks: { total: 24, completed: 18, in_progress: 4, blocked: 2 },
      deadline: '2026-04-30',
      progress: 75,
    },
  ];

  grid.innerHTML = campaigns.map(c => {
    const agentAvatars = c.agents_involved.map(id => {
      const agent = allAgents.find(a => a.id === id);
      const dept = agent ? (DEPT_CONFIG[agent.dept] || {}) : {};
      return `<span class="campaign-agent-avatar" title="${agent ? agent.name : id}" style="background: ${dept.color || '#c9a96e'}30; color: ${dept.color || '#c9a96e'}">${dept.icon || '&#9678;'}</span>`;
    }).join('');

    const daysLeft = Math.ceil((new Date(c.deadline) - Date.now()) / 86400000);
    const urgency = daysLeft <= 7 ? 'urgent' : daysLeft <= 14 ? 'soon' : 'ok';

    return `
      <div class="campaign-card">
        <div class="campaign-header">
          <div>
            <h3 class="campaign-name">${c.name}</h3>
            <span class="campaign-client">${c.client}</span>
          </div>
          <span class="campaign-deadline ${urgency}">${daysLeft}d left</span>
        </div>

        <div class="campaign-progress-bar">
          <div class="campaign-progress-fill" style="width: ${c.progress}%"></div>
        </div>
        <div class="campaign-progress-label">${c.progress}% complete</div>

        <div class="campaign-task-breakdown">
          <span class="task-stat completed">${c.tasks.completed} done</span>
          <span class="task-stat in-progress">${c.tasks.in_progress} active</span>
          ${c.tasks.blocked > 0 ? `<span class="task-stat blocked">${c.tasks.blocked} blocked</span>` : ''}
          <span class="task-stat total">${c.tasks.total} total</span>
        </div>

        <div class="campaign-agents">
          <span class="campaign-agents-label">Team:</span>
          ${agentAvatars}
        </div>
      </div>
    `;
  }).join('');
}

function getTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

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

// ============================================
// COMPETITOR TRACKER CONFIG PANEL
// ============================================
const SUPABASE_URL_MB = 'https://krmoihryyvooymvhsuno.supabase.co';
const SUPABASE_ANON_MB = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtybW9paHJ5eXZvb3ltdmhzdW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzM5NjYsImV4cCI6MjA4NDQ0OTk2Nn0.VBiCJK4Goz6iao4fqUfOs3wrgMaFO-LUGZqOxp9UKKg';

async function sbFetch(path, options = {}) {
  const token = localStorage.getItem('brain_token');
  const res = await fetch(`${SUPABASE_URL_MB}/rest/v1/${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON_MB,
      'Authorization': `Bearer ${SUPABASE_ANON_MB}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {})
    }
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

async function initCompetitorConfigTab() {
  await loadClientsForSelect();
  await loadTrackersList();

  document.getElementById('cfgAddBtn').addEventListener('click', addTracker);
  document.getElementById('scanAllBtn').addEventListener('click', triggerScan);
}

async function loadClientsForSelect() {
  const token = localStorage.getItem('brain_token');
  try {
    const res = await fetch('/.netlify/functions/brain-clients?action=list', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const select = document.getElementById('cfgClientSelect');
    (data.clients || []).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.full_name || c.email} — ${c.company_name || ''}`.trim();
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('loadClientsForSelect:', err);
  }
}

async function loadTrackersList() {
  const list = document.getElementById('trackersList');
  try {
    const data = await sbFetch('competitor_trackers?select=*,user_profiles(full_name,company_name)&order=created_at.desc');
    if (!data?.length) {
      list.innerHTML = '<p class="loading-text">No hay competidores configurados aún.</p>';
      return;
    }
    list.innerHTML = data.map(t => `
      <div class="tracker-row" data-id="${t.id}">
        <span class="tracker-client">${t.user_profiles?.full_name || t.client_id.slice(0, 8)}</span>
        <span class="tracker-handle">@${escapeHtmlMB(t.instagram_handle)}</span>
        ${t.display_name ? `<span class="tracker-name">${escapeHtmlMB(t.display_name)}</span>` : ''}
        <span class="tracker-threshold">${t.viral_threshold.toLocaleString('es-CL')} views</span>
        <span class="tracker-status ${t.is_active ? 'active' : 'inactive'}">${t.is_active ? 'Activo' : 'Pausado'}</span>
        <button type="button" class="tracker-toggle-btn" onclick="toggleTracker('${t.id}', ${t.is_active})">${t.is_active ? 'Pausar' : 'Activar'}</button>
        <button type="button" class="tracker-delete-btn" onclick="deleteTracker('${t.id}')">✕</button>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = `<p class="loading-text">Error cargando trackers: ${escapeHtmlMB(err.message)}</p>`;
  }
}

async function addTracker() {
  const clientId = document.getElementById('cfgClientSelect').value;
  const handle = document.getElementById('cfgHandle').value.trim().replace(/^@/, '');
  const displayName = document.getElementById('cfgDisplayName').value.trim();
  const threshold = parseInt(document.getElementById('cfgThreshold').value, 10) || 100000;

  if (!clientId || !handle) {
    showToast('Seleccioná un cliente e ingresá el handle.', 'warning');
    return;
  }

  try {
    await sbFetch('competitor_trackers', {
      method: 'POST',
      body: JSON.stringify({ client_id: clientId, instagram_handle: handle, display_name: displayName || null, viral_threshold: threshold })
    });
    document.getElementById('cfgHandle').value = '';
    document.getElementById('cfgDisplayName').value = '';
    showToast(`@${handle} agregado correctamente.`, 'success');
    await loadTrackersList();
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

async function toggleTracker(id, currentActive) {
  try {
    await sbFetch(`competitor_trackers?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !currentActive })
    });
    await loadTrackersList();
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

async function deleteTracker(id) {
  if (!confirm('¿Eliminar este competidor?')) return;
  try {
    await sbFetch(`competitor_trackers?id=eq.${id}`, { method: 'DELETE' });
    await loadTrackersList();
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

async function triggerScan() {
  const btn = document.getElementById('scanAllBtn');
  btn.disabled = true;
  btn.textContent = 'Escaneando...';
  try {
    const token = localStorage.getItem('brain_token');
    const res = await fetch('/api/competitor-scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({})
    });
    const data = await res.json();
    showToast(`Escaneo completado. ${data.new_viral_posts || 0} posts virales nuevos.`, 'success');
  } catch (err) {
    showToast(`Error en escaneo: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '▶ Escanear ahora';
  }
}

function escapeHtmlMB(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

let competitorTabInitialized = false;
