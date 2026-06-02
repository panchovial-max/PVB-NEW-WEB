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
  const vbWidget = document.getElementById('vb-widget');
  if (vbWidget) vbWidget.style.display = 'none';
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
      const res = await fetch('/api/brain', {
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

  // Auto-logout after 5 minutes of inactivity
  const INACTIVITY_MS = 5 * 60 * 1000;
  let inactivityTimer = setTimeout(doInactivityLogout, INACTIVITY_MS);
  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(doInactivityLogout, INACTIVITY_MS);
  }
  function doInactivityLogout() {
    localStorage.removeItem('brain_token');
    showPinScreen();
  }
  ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(evt =>
    document.addEventListener(evt, resetInactivityTimer, { passive: true })
  );

  const vbWidget = document.getElementById('vb-widget');
  if (vbWidget) vbWidget.style.display = '';

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
  loadStyleMemory();
  renderCampaigns();
  updateKPIs();
  initProyectosTab();
  setupEventListeners();
  initVoiceBot();
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

  let html = renderSystemUpdates() + `
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
// ─── System Updates Feed ───
const SYSTEM_UPDATES = [
  { date: '2026-05-29', type: 'skill',    icon: '🎬', title: 'YouTube Intelligence activado',        desc: 'Cron semanal (lunes 08:00) — 16 canales curados, verificación de URLs + sentiment de comentarios.' },
  { date: '2026-05-29', type: 'workflow', icon: '🤖', title: 'AI Digest n8n activo',                 desc: 'Cada 3 días: 6 RSS feeds → Ollama → Telegram. Fuentes: TLDR AI, Verge AI, Google AI, n8n, Ollama, Anthropic SDK.' },
  { date: '2026-05-28', type: 'agent',    icon: '💬', title: 'Esperanza — Sales Agent operativa',    desc: 'Instagram DM lead qualification via n8n + llama3.1:8b. Pendiente: conectar ManyChat Pro.' },
  { date: '2026-05-28', type: 'config',   icon: '⚙️', title: 'Hermes default → Claude Haiku',        desc: 'Modelo primario cambiado de Gemini 2.5 Pro a Claude Haiku 4.5 para todos los crons.' },
  { date: '2026-05-26', type: 'skill',    icon: '📁', title: 'Google Drive upload en todos los agentes', desc: 'Telegram AI, Master Brain chat y Tasks Bot pueden guardar archivos directo a Drive por proyecto.' },
];

const SYSTEM_UPDATE_TYPES = {
  skill:    { label: 'Skill',    color: '#c9a96e' },
  workflow: { label: 'Workflow', color: '#5a9fd4' },
  agent:    { label: 'Agent',    color: '#7ec87e' },
  config:   { label: 'Config',   color: '#b08fd4' },
};

function renderSystemUpdates() {
  const lastSeen = localStorage.getItem('mb_updates_seen') || '2000-01-01';
  const unseen = SYSTEM_UPDATES.filter(u => u.date > lastSeen);

  const badge = document.getElementById('activityBadge');
  if (badge) {
    if (unseen.length > 0) {
      badge.textContent = unseen.length;
      badge.classList.remove('tab-badge--hidden');
    } else {
      badge.classList.add('tab-badge--hidden');
    }
  }

  return `
    <div class="budget-card" style="grid-column: 1 / -1">
      <div class="budget-card-header">
        <div class="budget-card-name">🆕 Novedades del Sistema</div>
        <button type="button" class="btn-sm" onclick="markUpdatesRead()" style="font-size:11px;padding:2px 8px;opacity:0.7">Marcar leídas</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
        ${SYSTEM_UPDATES.map(u => {
          const typeInfo = SYSTEM_UPDATE_TYPES[u.type] || { label: u.type, color: '#c9a96e' };
          const isNew = u.date > lastSeen;
          return `
            <div style="display:flex;gap:12px;align-items:flex-start;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
              <span style="font-size:20px;line-height:1">${u.icon}</span>
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                  <span style="font-weight:600;color:#f0e6d3">${u.title}</span>
                  <span style="font-size:10px;padding:1px 6px;border-radius:3px;background:${typeInfo.color}22;color:${typeInfo.color};border:1px solid ${typeInfo.color}44">${typeInfo.label}</span>
                  ${isNew ? '<span style="font-size:10px;padding:1px 6px;border-radius:3px;background:#7ec87e22;color:#7ec87e;border:1px solid #7ec87e44">NEW</span>' : ''}
                </div>
                <div style="font-size:12px;color:#a0927e;margin-top:3px">${u.desc}</div>
                <div style="font-size:11px;color:#6b5d52;margin-top:2px">${u.date}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function markUpdatesRead() {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem('mb_updates_seen', today);
  const badge = document.getElementById('activityBadge');
  if (badge) badge.classList.add('tab-badge--hidden');
  renderActivity();
}

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
    const res = await fetch('/api/brain?action=list', {
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
    const res = await fetch(`/api/brain?action=stats&user_id=${clientId}&platform=${platform}`, {
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

  // Show run section only for creative agents
  const CREATIVE_DEPTS = ['creative'];
  const IMAGE_CAPABLE = ['ai-image-prompts', 'photography-direction', 'visual-concept-translation'];
  const hasImageCap = (agent.capabilities || '').split(',').some(c => IMAGE_CAPABLE.includes(c.trim()));
  const isCreative = CREATIVE_DEPTS.includes(agent.dept) && hasImageCap;
  const runSection = document.getElementById('agentRunSection');
  runSection.classList.toggle('agent-run-section-hidden', !isCreative);

  // Reset run UI
  document.getElementById('agentProjectInput').value = '';
  document.getElementById('agentPromptInput').value = '';
  document.getElementById('agentRunResult').classList.add('agent-run-result-hidden');
  document.getElementById('agentRunError').classList.add('agent-run-error-hidden');
  document.getElementById('agentRunPreview').classList.add('agent-run-preview-hidden');
  document.getElementById('agentRunBtnText').textContent = '▶ Generar Imagen';
  document.getElementById('agentRunBtn').disabled = false;

  // Wire up run button (replace listener)
  const runBtn = document.getElementById('agentRunBtn');
  const newRunBtn = runBtn.cloneNode(true);
  runBtn.parentNode.replaceChild(newRunBtn, runBtn);
  newRunBtn.addEventListener('click', () => runAgentImageTask(agentId));

  document.getElementById('agentModal').classList.add('open');
}

async function runAgentImageTask(agentId) {
  const prompt = document.getElementById('agentPromptInput').value.trim();
  const projectName = document.getElementById('agentProjectInput').value.trim();
  if (!prompt) { alert('Escribe un prompt primero'); return; }

  const btn = document.getElementById('agentRunBtn');
  btn.disabled = true;
  document.getElementById('agentRunBtnText').textContent = '⏳ Generando...';
  document.getElementById('agentRunResult').classList.add('agent-run-result-hidden');
  document.getElementById('agentRunError').classList.add('agent-run-error-hidden');

  try {
    const token = localStorage.getItem('brain_token');
    const res = await fetch('/api/agent-run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ agentId, prompt, action: 'generate-image', projectName: projectName || undefined }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Error desconocido');

    document.getElementById('agentRunLink').href = data.result.driveLink;
    const preview = document.getElementById('agentRunPreview');
    if (data.result.previewUrl) {
      preview.src = data.result.previewUrl;
      preview.classList.remove('agent-run-preview-hidden');
    }
    document.getElementById('agentRunResult').classList.remove('agent-run-result-hidden');
    document.getElementById('agentRunBtnText').textContent = '✓ Listo';
  } catch (err) {
    const errEl = document.getElementById('agentRunError');
    errEl.textContent = `Error: ${err.message}`;
    errEl.classList.remove('agent-run-error-hidden');
    document.getElementById('agentRunBtnText').textContent = '▶ Generar Imagen';
    btn.disabled = false;
  }
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
      if (tab.dataset.tab === 'hub') loadHub();
      if (tab.dataset.tab === 'accounts' && !accountsLoaded) { initAccountsTab(); loadAccounts(); }
      if (tab.dataset.tab === 'esperanza' && !esperanzaLoaded) { initEsperanzaTab(); loadEsperanza(); }
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

  // Style rule modal save button
  document.getElementById('styleRuleSave')?.addEventListener('click', saveStyleRule);

  // Close style rule modal on backdrop click
  document.getElementById('styleRuleModal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeStyleRuleModal();
  });

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

// ─── Style Memory ───

let styleMemoryRules = [];
let pendingRuleType = null;
let pendingRuleContext = '';

async function loadStyleMemory() {
  try {
    const res = await fetch(`${API_BASE}?action=style-memory`, { headers: { 'x-studio-pin': studioPin } });
    const data = await res.json();
    styleMemoryRules = data.rules || [];
  } catch {
    styleMemoryRules = [];
  }
  renderStyleMemory();
}

function renderStyleMemory() {
  const container = document.getElementById('styleMemoryRules');
  if (!container) return;

  if (!styleMemoryRules.length) {
    container.innerHTML = '<span class="style-memory-empty">Sin reglas aún. Usa "Marcar cambio" o "Nunca más" en un reporte para registrar estándares.</span>';
    return;
  }

  container.innerHTML = styleMemoryRules.map(r => `
    <span class="style-rule-tag ${r.type}" title="${escapeHtml(r.context || '')}">
      <span class="style-rule-tag-dot"></span>
      ${escapeHtml(r.rule)}
      <button type="button" class="style-rule-delete" onclick="deleteStyleRule('${r.id}')" aria-label="Eliminar regla">×</button>
    </span>
  `).join('');
}

async function deleteStyleRule(ruleId) {
  try {
    await fetch(`${API_BASE}?action=style-memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-studio-pin': studioPin },
      body: JSON.stringify({ sub: 'delete', id: ruleId })
    });
    styleMemoryRules = styleMemoryRules.filter(r => r.id !== ruleId);
    renderStyleMemory();
  } catch {
    showNotification('Error al eliminar regla', 'error');
  }
}

function openStyleRuleModal(type, context) {
  pendingRuleType = type;
  pendingRuleContext = context;
  const modal = document.getElementById('styleRuleModal');
  const title = document.getElementById('styleRuleModalTitle');
  const ctx = document.getElementById('styleRuleContext');
  const input = document.getElementById('styleRuleInput');
  if (!modal) return;
  title.textContent = type === 'never' ? 'Nunca más — registrar regla' : 'Marcar cambio — registrar regla';
  ctx.textContent = context ? `Reporte: "${context}"` : '';
  input.value = '';
  modal.classList.remove('hidden');
  setTimeout(() => input.focus(), 50);
}

function closeStyleRuleModal() {
  document.getElementById('styleRuleModal')?.classList.add('hidden');
  pendingRuleType = null;
  pendingRuleContext = '';
}

async function saveStyleRule() {
  const input = document.getElementById('styleRuleInput');
  const rule = input?.value.trim();
  if (!rule) return;
  try {
    const res = await fetch(`${API_BASE}?action=style-memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-studio-pin': studioPin },
      body: JSON.stringify({ sub: 'create', type: pendingRuleType, rule, context: pendingRuleContext })
    });
    const data = await res.json();
    if (data.ok) {
      styleMemoryRules.unshift(data.rule);
      renderStyleMemory();
      closeStyleRuleModal();
      showNotification('Regla guardada en memoria de estilo', 'success');
    }
  } catch {
    showNotification('Error al guardar regla', 'error');
  }
}

// ─── Render Reportes Feed ───

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
    badge.classList.toggle('tab-badge--hidden', pendingCount === 0);
  }

  if (!proposals.length) {
    feed.innerHTML = '<p class="no-data-text">Sin reportes en esta vista.</p>';
    return;
  }

  const priorityColors = { critical: '#EF4444', high: '#F59E0B', medium: '#3B82F6', low: '#6B7280' };
  const categoryIcons = {
    improvement: '&#9650;', bug: '&#9888;', opportunity: '&#9733;',
    optimization: '&#9881;', creative: '&#10024;'
  };

  feed.innerHTML = proposals.map(p => {
    const agent = allAgents.find(a => a.id === p.agent_id);
    const deptCfg = agent ? (DEPT_CONFIG[agent.dept] || {}) : {};
    const timeAgo = getTimeAgo(p.created_at);
    const titleEsc = escapeHtml(p.title);

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
          <h3 class="proposal-title">${titleEsc}</h3>
          <p class="proposal-desc">${escapeHtml(p.description)}</p>
          <div class="proposal-meta">
            ${p.estimated_impact ? `<span class="proposal-impact">Impacto: ${p.estimated_impact}</span>` : ''}
            ${p.estimated_effort ? `<span class="proposal-effort">Esfuerzo: ${p.estimated_effort}</span>` : ''}
            ${p.target_area ? `<span class="proposal-area">${p.target_area}</span>` : ''}
          </div>
          ${p.status === 'pending' ? `
            <div class="proposal-actions">
              <button type="button" class="proposal-btn archive" onclick="handleProposal('${p.id}', 'archived')">Archivar</button>
              <button type="button" class="proposal-btn flag-change" onclick="openStyleRuleModal('change', ${JSON.stringify(titleEsc)})">Marcar cambio</button>
              <button type="button" class="proposal-btn never" onclick="openStyleRuleModal('never', ${JSON.stringify(titleEsc)})">Nunca más</button>
            </div>
          ` : `
            <div class="proposal-status-badge status-${p.status}">&#10003; archivado</div>
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
    renderProposals(
      document.getElementById('proposalCategoryFilter')?.value || 'all',
      document.getElementById('proposalStatusFilter')?.value || 'pending'
    );
    showNotification('Reporte archivado', 'info');
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
  await Promise.all([loadClientsForSelect(), loadNotionProjectsForSelect()]);
  await loadTrackersList();

  document.getElementById('cfgAddBtn').addEventListener('click', addTracker);
  document.getElementById('scanAllBtn').addEventListener('click', triggerScan);
}

async function loadNotionProjectsForSelect() {
  const token = localStorage.getItem('brain_token');
  try {
    const res = await fetch('/api/brain?action=hub', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const select = document.getElementById('cfgNotionProject');
    (data.proyectos || []).forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.nombre}${p.cliente ? ` — ${p.cliente}` : ''}`;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('loadNotionProjectsForSelect:', err);
  }
}

async function loadClientsForSelect() {
  const token = localStorage.getItem('brain_token');
  try {
    const res = await fetch('/api/brain?action=list', {
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
        ${t.notion_project_id ? `<a class="tracker-notion-link" href="https://notion.so/${t.notion_project_id.replace(/-/g,'')}" target="_blank" title="Ver proyecto en Notion">Notion ↗</a>` : ''}
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
  const notionProjectId = document.getElementById('cfgNotionProject').value || null;
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
      body: JSON.stringify({ client_id: clientId, instagram_handle: handle, display_name: displayName || null, viral_threshold: threshold, notion_project_id: notionProjectId })
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

// ── Hub Tab: Notion + Telegram ────────────────────────────────────────────────
let hubLoaded = false;

async function loadHub(force = false) {
  if (hubLoaded && !force) return;
  hubLoaded = true;
  const root = document.getElementById('hub-root');
  if (!root) return;
  root.innerHTML = '<div class="hub-loading">LOADING HUB…</div>';

  const token = localStorage.getItem('brain_token');
  try {
    const res = await fetch('/api/brain?action=hub', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    root.innerHTML = renderHub(data);
    initHubTelegram();
    initHubChat(data.proyectos || []);
  } catch (err) {
    root.innerHTML = `<div class="hub-empty">Error cargando Hub: ${err.message}</div>`;
  }
}

function prioClass(p) {
  if (!p) return '';
  const l = p.toLowerCase();
  if (l === 'alta') return 'alta';
  if (l === 'baja') return 'low';
  return 'media';
}

function dotClass(p) {
  if (!p) return '';
  const l = p.toLowerCase();
  if (l === 'alta') return 'high';
  if (l === 'idea') return 'idea';
  if (l === 'baja') return 'low';
  return '';
}

function renderHub({ entregas = [], proyectos = [], boletas = [] }) {
  const fmtMonto = (n) => n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—';
  const fmtFecha = (d) => {
    if (!d) return '';
    const diff = Math.ceil((new Date(d) - new Date()) / (1000*60*60*24));
    const label = d.slice(0, 10);
    if (diff < 0) return `<span style="color:var(--brain-red)">${label} ⚠ vencida</span>`;
    if (diff === 0) return `<span style="color:var(--brain-orange)">${label} · hoy</span>`;
    if (diff <= 3) return `<span style="color:var(--brain-orange)">${label} · ${diff}d</span>`;
    return label;
  };

  const entregasHTML = entregas.length
    ? entregas.map(e => `
      <div class="hub-item">
        <div class="hub-item-dot ${dotClass(e.prioridad)}"></div>
        <div class="hub-item-body">
          <div class="hub-item-name">${escapeHtml(e.titulo)}</div>
          <div class="hub-item-meta">
            ${e.cliente ? `<span class="hub-badge active">${escapeHtml(e.cliente)}</span>` : ''}
            ${e.estado ? `<span class="hub-badge">${e.estado}</span>` : ''}
            ${e.deadline ? `<span>${fmtFecha(e.deadline)}</span>` : ''}
          </div>
        </div>
        ${e.url ? `<a class="hub-item-link" href="${e.url}" target="_blank">↗</a>` : ''}
      </div>`).join('')
    : '<div class="hub-empty">Sin entregas pendientes ✓</div>';

  const proyectosHTML = proyectos.length
    ? proyectos.map(p => `
      <div class="hub-item">
        <div class="hub-item-dot"></div>
        <div class="hub-item-body">
          <div class="hub-item-name">${escapeHtml(p.nombre)}</div>
          <div class="hub-item-meta">
            ${p.estado ? `<span class="hub-badge active">${p.estado}</span>` : ''}
            ${p.cliente ? `<span>${escapeHtml(p.cliente)}</span>` : ''}
          </div>
        </div>
        ${p.url ? `<a class="hub-item-link" href="${p.url}" target="_blank">↗</a>` : ''}
      </div>`).join('')
    : '<div class="hub-empty">Sin proyectos activos</div>';

  const boletasHTML = boletas.length
    ? boletas.map(b => `
      <div class="hub-finance-row">
        <span>${escapeHtml(b.nombre)}${b.tipo ? ` <span class="hub-badge">${b.tipo}</span>` : ''}</span>
        <span class="hub-finance-monto">${fmtMonto(b.monto)}</span>
      </div>`).join('')
    : '<div class="hub-empty">Sin registros recientes</div>';

  return `
    <div class="hub-grid">
      <div class="hub-col-wide">
        <div class="hub-widget">
          <div class="hub-widget-title">
            <span>📦</span> Entregas de Clientes
            <button class="hub-refresh-btn" onclick="loadHub(true)">↺ refresh</button>
          </div>
          ${entregasHTML}
        </div>
        <div class="hub-widget">
          <div class="hub-widget-title"><span>🎬</span> Campañas Activas</div>
          ${proyectosHTML}
        </div>
      </div>
      <div class="hub-col-narrow">
        <div class="hub-widget">
          <div class="hub-widget-title"><span>💰</span> Boletas Recientes</div>
          ${boletasHTML}
        </div>
        <div class="hub-widget">
          <div class="hub-widget-title"><span>✈️</span> Telegram Quick Send</div>
          <div class="hub-telegram-form">
            <textarea class="hub-telegram-textarea" id="hubTgMsg" placeholder="Mensaje a tu Telegram personal…"></textarea>
            <button class="hub-telegram-btn" id="hubTgBtn">SEND ↗</button>
            <div class="hub-telegram-status" id="hubTgStatus"></div>
          </div>
        </div>
      </div>
    </div>`;
}

function initHubTelegram() {
  const btn = document.getElementById('hubTgBtn');
  const textarea = document.getElementById('hubTgMsg');
  const status = document.getElementById('hubTgStatus');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const message = textarea.value.trim();
    if (!message) return;
    btn.disabled = true;
    btn.textContent = '…';
    status.textContent = '';
    status.className = 'hub-telegram-status';

    try {
      const token = localStorage.getItem('brain_token');
      const res = await fetch('/api/brain?action=telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (data.ok) {
        status.textContent = '✓ Enviado';
        status.className = 'hub-telegram-status ok';
        textarea.value = '';
      } else {
        throw new Error(data.error || 'Error');
      }
    } catch (err) {
      status.textContent = `✗ ${err.message}`;
      status.className = 'hub-telegram-status err';
    }
    btn.disabled = false;
    btn.textContent = 'SEND ↗';
  });
}

// ── Shared UI helpers (used by Hub Chat + Voice Bot) ─────────────
function showVBToast(msg, level = 'info') {
  const t = document.createElement('div');
  t.className = `vb-toast vb-toast-${level}`;
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => { requestAnimationFrame(() => t.classList.add('show')); });
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
}

function executeVBCommands(commands = []) {
  for (const cmd of commands) {
    if (cmd.type === 'navigate_tab') {
      const tab = document.querySelector(`.brain-tab[data-tab="${cmd.tab}"]`);
      if (tab) { tab.click(); tab.classList.add('vb-highlight'); setTimeout(() => tab.classList.remove('vb-highlight'), 1500); }

    } else if (cmd.type === 'show_toast') {
      showVBToast(cmd.message, cmd.level || 'info');

    } else if (cmd.type === 'highlight') {
      document.querySelectorAll(cmd.selector || '').forEach(el => {
        el.classList.add('vb-highlight'); setTimeout(() => el.classList.remove('vb-highlight'), 2000);
      });

    } else if (cmd.type === 'scroll_to') {
      document.querySelector(cmd.selector || '')?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } else if (cmd.type === 'create_project_local') {
      document.querySelector('.brain-tab[data-tab="proyectos"]')?.click();
      const proj = createProject(cmd.data || cmd);
      renderProjects();
      setTimeout(() => openProjectDetail(proj.id), 250);
      showVBToast(`Proyecto "${proj.name}" creado`, 'success');
      syncProjectToNotion(proj); // auto-sync

    } else if (cmd.type === 'open_project') {
      document.querySelector('.brain-tab[data-tab="proyectos"]')?.click();
      setTimeout(() => { if (cmd.id) openProjectDetail(cmd.id); }, 200);

    } else if (cmd.type === 'update_project_field') {
      const proj = pvbProjects.find(p => p.id === cmd.id);
      if (proj && cmd.fields) {
        Object.assign(proj, cmd.fields);
        saveProjects();
        renderProjects();
        if (currentProject?.id === cmd.id) document.getElementById('detailStatus').textContent = PROJECT_STATUS[proj.status] || proj.status;
        showVBToast('Proyecto actualizado', 'success');
        syncProjectToNotion(proj); // auto-sync
      }

    } else if (cmd.type === 'advance_gantt_phase') {
      const proj = pvbProjects.find(p => p.id === cmd.id);
      if (proj?.gantt) {
        const activeIdx = proj.gantt.findIndex(g => g.status === 'active');
        if (activeIdx >= 0) {
          proj.gantt[activeIdx].status = 'done';
          if (proj.gantt[activeIdx + 1]) proj.gantt[activeIdx + 1].status = 'active';
        }
        saveProjects();
        renderProjects();
        if (currentProject?.id === cmd.id) renderGantt();
        showVBToast('Fase avanzada ✓', 'success');
        syncProjectToNotion(proj); // auto-sync

      }

    } else if (cmd.type === 'start_review_session') {
      const filtered = cmd.filter_status ? pvbProjects.filter(p => p.status === cmd.filter_status) : pvbProjects;
      localStorage.setItem('mb_review_session', JSON.stringify({ projects: filtered.map(p => p.id), currentIndex: 0, started: new Date().toISOString() }));
      document.querySelector('.brain-tab[data-tab="proyectos"]')?.click();

    } else if (cmd.type === 'review_advance') {
      const session = JSON.parse(localStorage.getItem('mb_review_session') || 'null');
      if (session) { session.currentIndex = (session.currentIndex || 0) + 1; localStorage.setItem('mb_review_session', JSON.stringify(session)); }
      if (cmd.open_id) setTimeout(() => openProjectDetail(cmd.open_id), 200);

    } else if (cmd.type === 'save_project_note') {
      const proj = pvbProjects.find(p => p.id === cmd.id);
      if (proj) {
        if (!proj.projectNotes) proj.projectNotes = [];
        const title = cmd.title ? `**${cmd.title}**\n` : '';
        proj.projectNotes.push({ date: new Date().toISOString(), text: cmd.note, title: cmd.title || null, source: 'bot' });
        proj.notes = (proj.notes || '') + `\n\n---\n${title}*${new Date().toLocaleDateString('es-CL')} — Bot*\n${cmd.note}`;
        saveProjects();
        if (currentProject?.id === cmd.id) renderBriefDisplay();
        showVBToast(`Nota guardada en "${proj.name}"`, 'success');
      }
    } else if (cmd.type === 'delete_project_local') {
      const idx = pvbProjects.findIndex(p => p.id === cmd.id);
      if (idx !== -1) {
        const name = pvbProjects[idx].name;
        pvbProjects.splice(idx, 1);
        saveProjects();
        if (currentProject?.id === cmd.id) {
          currentProject = null;
          document.getElementById('pvbProjectsList').classList.remove('hidden');
          document.getElementById('pvbProjectDetail').classList.add('hidden');
        }
        renderProjects();
        showVBToast(`Proyecto "${name}" eliminado`, 'warning');
      }
    }
  }
}

// ── Hub Chat + Voice ─────────────────────────────────────────────
let hubChatHistory = [];

function initHubChat(proyectos = []) {
  const widget = document.getElementById('hub-chat-widget');
  const input = document.getElementById('hubChatInput');
  const sendBtn = document.getElementById('hubChatSend');
  const micBtn = document.getElementById('hubMicBtn');
  const messages = document.getElementById('hubChatMessages');
  const projectSelect = document.getElementById('hubProjectSelect');
  if (!widget || !input || !sendBtn) return;

  // Populate project selector: local projects first (with IDs), then Notion
  if (projectSelect) {
    pvbProjects.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name}${p.client ? ` — ${p.client}` : ''}`;
      projectSelect.appendChild(opt);
    });
    proyectos.forEach(p => {
      if (pvbProjects.find(lp => lp.name === p.nombre)) return;
      const opt = document.createElement('option');
      opt.value = p.nombre;
      opt.textContent = p.nombre + (p.cliente ? ` — ${p.cliente}` : '');
      projectSelect.appendChild(opt);
    });
  }

  // Show the chat widget
  widget.classList.remove('hub-chat-hidden');

  // Send on button click
  sendBtn.addEventListener('click', () => sendHubMessage());

  // Send on Enter (Shift+Enter = newline)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendHubMessage();
    }
  });

  // Voice input via Web Speech API — continuous mode, silence-detect to stop
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let recording = false;
    let intentionalStop = false;
    let hubFinalText = '';
    let hubSilenceTimer = null;
    const HUB_SILENCE_MS = 2500;

    micBtn.addEventListener('click', () => {
      if (recording) {
        clearTimeout(hubSilenceTimer);
        intentionalStop = true;
        recognition.stop();
      } else {
        hubFinalText = '';
        intentionalStop = false;
        input.value = '';
        try {
          recognition.start();
          micBtn.classList.add('recording');
          micBtn.title = 'Grabando… (clic para parar)';
          recording = true;
        } catch (_) {}
      }
    });

    recognition.onresult = (e) => {
      clearTimeout(hubSilenceTimer);
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) hubFinalText += e.results[i][0].transcript + ' ';
        else interim = e.results[i][0].transcript;
      }
      input.value = hubFinalText + interim;
      // Stop after 2.5s of silence — user can always click to stop sooner
      hubSilenceTimer = setTimeout(() => { intentionalStop = true; recognition.stop(); }, HUB_SILENCE_MS);
    };

    recognition.onend = () => {
      clearTimeout(hubSilenceTimer);
      // Browser-imposed cut (not silence timer, not user click) — restart immediately
      if (!intentionalStop && recording) {
        try { recognition.start(); return; } catch (_) {}
      }
      intentionalStop = false;
      recording = false;
      micBtn.classList.remove('recording');
      micBtn.title = 'Hablar';
      input.value = hubFinalText.trim();
      input.focus();
    };

    recognition.onerror = (e) => {
      clearTimeout(hubSilenceTimer);
      if (e.error === 'no-speech' && recording && !intentionalStop) {
        // No speech detected but mic still active — restart silently
        try { recognition.start(); return; } catch (_) {}
      }
      intentionalStop = false;
      recording = false;
      micBtn.classList.remove('recording');
      micBtn.title = 'Hablar';
    };
  } else {
    micBtn.style.display = 'none';
  }

  function appendMessage(role, text) {
    const empty = messages.querySelector('.hub-chat-empty');
    if (empty) empty.remove();

    const el = document.createElement('div');
    el.className = `hub-msg hub-msg-${role}`;
    const noteBtn = role === 'assistant'
      ? `<button type="button" class="hub-msg-note" title="Guardar como nota del proyecto">📝</button>`
      : '';
    el.innerHTML = `<div class="hub-msg-bubble">${escapeHtml(text)}${noteBtn}</div>`;
    if (role === 'assistant') {
      el.querySelector('.hub-msg-note')?.addEventListener('click', () => {
        const proj = pvbProjects.find(p => p.id === projectSelect?.value || p.name === projectSelect?.value);
        if (!proj) { showVBToast('Seleccioná un proyecto primero', 'warning'); return; }
        if (!proj.projectNotes) proj.projectNotes = [];
        proj.projectNotes.push({ date: new Date().toISOString(), text, source: 'hub-chat' });
        proj.notes = (proj.notes || '') + `\n\n---\n*${new Date().toLocaleDateString('es-CL')} — Hub Chat*\n${text}`;
        saveProjects();
        if (currentProject?.id === proj.id) renderBriefDisplay();
        showVBToast(`Nota guardada en "${proj.name}"`, 'success');
      });
    }
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  function appendThinking() {
    const el = document.createElement('div');
    el.className = 'hub-msg hub-msg-assistant hub-chat-thinking';
    el.innerHTML = '<div class="hub-msg-bubble"><span></span><span></span><span></span></div>';
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  async function sendHubMessage() {
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    sendBtn.disabled = true;
    appendMessage('user', text);
    hubChatHistory.push({ role: 'user', content: text });

    const thinking = appendThinking();

    try {
      const token = localStorage.getItem('brain_token');
      const rawVal = projectSelect?.value || '';
      const selectedProj = pvbProjects.find(p => p.id === rawVal);
      const proyecto = selectedProj ? selectedProj.name : rawVal;
      const localProjects = pvbProjects.map(p => ({
        id: p.id, name: p.name, client: p.client, status: p.status,
        startDate: p.startDate, launchDate: p.launchDate, budget: p.budget,
        objective: p.objective, kpis: p.kpis, notes: p.notes,
        activePhase: p.gantt?.find(g => g.status === 'active')?.phaseId || null,
        progress: p.gantt ? Math.round((p.gantt.filter(g => g.status === 'done').length / (p.gantt.length || 1)) * 100) : 0,
      }));
      const reviewSession = JSON.parse(localStorage.getItem('mb_review_session') || 'null');
      const res = await fetch('/api/brain?action=chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, history: hubChatHistory.slice(-10), proyecto, localProjects, reviewSession }),
      });
      const data = await res.json();
      thinking.remove();

      if (!data.ok) throw new Error(data.error || 'Error del servidor');

      appendMessage('assistant', data.reply);
      hubChatHistory.push({ role: 'assistant', content: data.reply });

      if (data.commands?.length) executeVBCommands(data.commands);

      if (data.actionsPerformed?.length > 0) {
        setTimeout(() => loadHub(true), 800);
      }
    } catch (err) {
      thinking.remove();
      appendMessage('assistant', `Error: ${err.message}`);
    }

    sendBtn.disabled = false;
    input.focus();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Cuentas PVB — Client infrastructure ──────────────────────────
let accountsLoaded = false;

async function loadAccounts(force = false) {
  if (accountsLoaded && !force) return;
  accountsLoaded = true;
  const list = document.getElementById('accountsList');
  if (!list) return;
  list.innerHTML = '<div class="hub-loading">Cargando cuentas…</div>';

  try {
    const token = localStorage.getItem('brain_token');
    const res = await fetch('/api/brain?action=accounts', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    renderAccounts(data.accounts || []);
  } catch (err) {
    list.innerHTML = `<div class="hub-empty">Error: ${escapeHtml(err.message)}</div>`;
  }
}

const SERVICE_LABELS = { 'full-service': 'Full Service', social: 'Social', video: 'Video', foto: 'Foto' };
const STATUS_COLORS  = { active: '#34D399', paused: '#FBBF24', offboarded: '#6B7280' };

function renderAccounts(accounts) {
  const list = document.getElementById('accountsList');
  if (!accounts.length) {
    list.innerHTML = '<div class="hub-empty">Sin cuentas registradas — crea la primera.</div>';
    return;
  }

  list.innerHTML = accounts.map(a => {
    const integrations = [
      { key: 'ig',      label: 'IG',      active: !!a.ig_account_id },
      { key: 'fb',      label: 'FB',      active: !!a.fb_access_token },
      { key: 'tiktok',  label: 'TT',      active: !!a.tiktok_access_token },
      { key: 'youtube', label: 'YT',      active: !!a.yt_refresh_token },
      { key: 'notion',  label: 'Notion',  active: !!a.notion_page_id },
      { key: 'tg',      label: 'TG',      active: !!a.telegram_chat_id },
    ];

    const dots = integrations.map(i => `
      <span class="acct-integration ${i.active ? 'connected' : 'disconnected'}" title="${i.label}: ${i.active ? 'Conectado' : 'Sin conectar'}">
        ${i.label}
      </span>`).join('');

    const budget = a.monthly_budget_clp
      ? `$${Number(a.monthly_budget_clp).toLocaleString('es-CL')}/mes`
      : '—';

    const contractEnd = a.contract_end
      ? new Date(a.contract_end) < new Date() ? '⚠ Vencido' : a.contract_end.slice(0,10)
      : '—';

    return `
      <div class="acct-card" data-id="${a.id}">
        <div class="acct-card-left">
          <div class="acct-status-dot" style="background:${STATUS_COLORS[a.status] || '#6B7280'}" title="${a.status}"></div>
          <div>
            <div class="acct-name">${escapeHtml(a.client_name)}</div>
            <div class="acct-meta">
              ${a.email_alias ? `<span class="acct-email">${escapeHtml(a.email_alias)}</span>` : ''}
              ${a.service_type ? `<span class="acct-badge">${SERVICE_LABELS[a.service_type] || a.service_type}</span>` : ''}
              <span class="acct-budget">${budget}</span>
            </div>
            <div class="acct-integrations">${dots}</div>
          </div>
        </div>
        <div class="acct-card-right">
          <div class="acct-contract">Contrato hasta: <strong>${contractEnd}</strong></div>
          <div class="acct-actions">
            <button type="button" class="action-btn small" onclick="editAccount('${a.id}')">✎ Editar</button>
            ${a.status !== 'offboarded'
              ? `<button type="button" class="action-btn small danger" onclick="offboardAccount('${a.id}','${escapeHtml(a.client_name)}')">Offboard</button>`
              : '<span class="acct-offboarded">Offboarded</span>'}
          </div>
        </div>
      </div>`;
  }).join('');
}

function initAccountsTab() {
  const newBtn   = document.getElementById('accountsNewBtn');
  const form     = document.getElementById('accountsForm');
  const saveBtn  = document.getElementById('acfSave');
  const cancelBtn= document.getElementById('acfCancel');
  const slugInput= document.getElementById('acfSlug');
  const nameInput= document.getElementById('acfName');

  // Auto-generate slug from name
  nameInput?.addEventListener('input', () => {
    if (slugInput.dataset.manual) return;
    slugInput.value = nameInput.value.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g,'')
      .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  });
  slugInput?.addEventListener('input', () => { slugInput.dataset.manual = '1'; });

  newBtn?.addEventListener('click', () => {
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) nameInput?.focus();
  });

  cancelBtn?.addEventListener('click', () => {
    form.classList.add('hidden');
    form.reset?.();
    delete slugInput.dataset.manual;
  });

  saveBtn?.addEventListener('click', async () => {
    const client_name = document.getElementById('acfName').value.trim();
    const client_slug = document.getElementById('acfSlug').value.trim();
    if (!client_name || !client_slug) { showNotification('Nombre y slug son obligatorios', 'error'); return; }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Creando…';
    try {
      const token = localStorage.getItem('brain_token');
      const res = await fetch('/api/brain?action=accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          sub: 'create',
          client_name,
          client_slug,
          email_alias:        document.getElementById('acfEmail').value.trim() || null,
          service_type:       document.getElementById('acfService').value || null,
          monthly_budget_clp: parseInt(document.getElementById('acfBudget').value) || null,
          contract_start:     document.getElementById('acfStart').value || null,
          notes:              document.getElementById('acfNotes').value.trim() || null,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      showNotification(`Cliente "${client_name}" creado. PVB tiene el control.`, 'success');
      form.classList.add('hidden');
      accountsLoaded = false;
      loadAccounts(true);
    } catch (err) {
      showNotification(`Error: ${err.message}`, 'error');
    }
    saveBtn.disabled = false;
    saveBtn.textContent = 'Crear cuenta';
  });

  // Edit modal wiring
  document.getElementById('aeSave')?.addEventListener('click', saveEditAccount);
  document.getElementById('acctEditModal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeEditAccount();
  });
}

async function offboardAccount(id, name) {
  if (!confirm(`¿Offboardear a ${name}? Se borrarán todos los tokens OAuth almacenados. Esta acción no se puede deshacer.`)) return;
  const token = localStorage.getItem('brain_token');
  try {
    const res = await fetch('/api/brain?action=accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sub: 'offboard', id }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    showNotification(`${name} offboardeado. Tokens eliminados.`, 'info');
    accountsLoaded = false;
    loadAccounts(true);
  } catch (err) {
    showNotification(`Error: ${err.message}`, 'error');
  }
}

let editingAccountId = null;

function editAccount(id) {
  // Buscar la cuenta en el DOM via data-id o recargar desde API
  const token = localStorage.getItem('brain_token');
  fetch(`/api/brain?action=accounts`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json())
    .then(data => {
      const acct = (data.accounts || []).find(a => a.id === id);
      if (!acct) { showNotification('Cuenta no encontrada', 'error'); return; }
      editingAccountId = id;

      // Poblar campos
      document.getElementById('aeClientName').value = acct.client_name || '';
      document.getElementById('aeStatus').value     = acct.status || 'active';
      document.getElementById('aeEmail').value      = acct.email_alias || '';
      document.getElementById('aeService').value    = acct.service_type || '';
      document.getElementById('aeBudget').value     = acct.monthly_budget_clp || '';
      document.getElementById('aeContractEnd').value= acct.contract_end ? acct.contract_end.slice(0,10) : '';
      document.getElementById('aeIgId').value       = acct.ig_account_id || '';
      document.getElementById('aeNotionId').value   = acct.notion_page_id || '';
      document.getElementById('aeTgId').value       = acct.telegram_chat_id || '';
      document.getElementById('aeNotes').value      = acct.notes || '';

      document.getElementById('acctEditModal').classList.remove('hidden');
      document.getElementById('aeClientName').focus();
    })
    .catch(err => showNotification(`Error: ${err.message}`, 'error'));
}

function closeEditAccount() {
  document.getElementById('acctEditModal').classList.add('hidden');
  editingAccountId = null;
}

async function saveEditAccount() {
  if (!editingAccountId) return;
  const token = localStorage.getItem('brain_token');
  const payload = {
    sub: 'update',
    id: editingAccountId,
    client_name:       document.getElementById('aeClientName').value.trim(),
    status:            document.getElementById('aeStatus').value,
    email_alias:       document.getElementById('aeEmail').value.trim() || null,
    service_type:      document.getElementById('aeService').value || null,
    monthly_budget_clp:Number(document.getElementById('aeBudget').value) || null,
    contract_end:      document.getElementById('aeContractEnd').value || null,
    ig_account_id:     document.getElementById('aeIgId').value.trim() || null,
    notion_page_id:    document.getElementById('aeNotionId').value.trim() || null,
    telegram_chat_id:  document.getElementById('aeTgId').value.trim() || null,
    notes:             document.getElementById('aeNotes').value.trim() || null,
  };

  const btn = document.getElementById('aeSave');
  btn.textContent = 'Guardando…';
  btn.disabled = true;

  try {
    const res = await fetch('/api/brain?action=accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    closeEditAccount();
    showNotification('Cuenta actualizada', 'success');
    loadAccounts();
  } catch (err) {
    showNotification(`Error: ${err.message}`, 'error');
  } finally {
    btn.textContent = 'Guardar cambios';
    btn.disabled = false;
  }
}

// ── Esperanza — pipeline de leads ────────────────────────────────
let esperanzaLoaded = false;
let currentLeadId   = null;

const ESP_STATUS = {
  new:       { label: 'New',        color: '#60A5FA' },
  warm:      { label: 'Warm',       color: '#FBBF24' },
  hot:       { label: 'Hot 🔥',     color: '#F97316' },
  converted: { label: 'Convertido', color: '#34D399' },
  lost:      { label: 'Perdido',    color: '#6B7280' },
};

const SVC_ICON = { video:'🎬', social:'📱', ads:'📣', web:'🌐', brand:'🎨' };

async function loadEsperanza(force = false) {
  if (esperanzaLoaded && !force) return;
  esperanzaLoaded = true;
  const list   = document.getElementById('espList');
  const stats  = document.getElementById('espStats');
  const filter = document.getElementById('espStatusFilter')?.value || 'all';
  list.innerHTML = '<div class="hub-loading">Cargando leads…</div>';

  try {
    const token = localStorage.getItem('brain_token');
    const url   = `/api/brain?action=esperanza${filter !== 'all' ? `&status=${filter}` : ''}`;
    const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data  = await res.json();
    if (!data.ok) throw new Error(data.error);

    // Stats bar
    const s = data.stats || {};
    stats.innerHTML = Object.entries(ESP_STATUS).map(([k, v]) =>
      `<div class="esp-stat-pill" style="border-color:${v.color}20;color:${v.color}">
        <span class="esp-stat-n">${s[k] || 0}</span>
        <span class="esp-stat-l">${v.label}</span>
      </div>`
    ).join('');

    renderEsperanzaLeads(data.leads || []);
  } catch (err) {
    list.innerHTML = `<div class="hub-empty">Error: ${escapeHtml(err.message)}</div>`;
  }
}

function renderEsperanzaLeads(leads) {
  const list = document.getElementById('espList');
  if (!leads.length) {
    list.innerHTML = '<div class="hub-empty">Sin leads aún — Esperanza está en espera.</div>';
    return;
  }

  list.innerHTML = leads.map(l => {
    const st      = ESP_STATUS[l.status] || ESP_STATUS.new;
    const svcKey  = Object.keys(SVC_ICON).find(k => (l.service || '').toLowerCase().includes(k)) || '';
    const icon    = SVC_ICON[svcKey] || '💬';
    const msgs    = Array.isArray(l.conversation) ? l.conversation.length : 0;
    const updated = l.updated_at ? new Date(l.updated_at).toLocaleDateString('es-CL') : '—';

    return `
      <div class="esp-lead-row" data-id="${l.id}" onclick="openEsperanzaDrawer('${l.id}')">
        <div class="esp-lead-status-dot" style="background:${st.color}" title="${st.label}"></div>
        <div class="esp-lead-icon">${icon}</div>
        <div class="esp-lead-info">
          <div class="esp-lead-name">${escapeHtml(l.name || 'Sin nombre')}</div>
          <div class="esp-lead-meta">
            ${l.username ? `@${escapeHtml(l.username)} · ` : ''}
            ${escapeHtml(l.service || 'Sin servicio')}
          </div>
        </div>
        <div class="esp-lead-right">
          <span class="esp-status-badge" style="color:${st.color};border-color:${st.color}40">${st.label}</span>
          <span class="esp-lead-date">${updated}</span>
          <span class="esp-lead-msgs">${msgs} msgs</span>
        </div>
      </div>`;
  }).join('');
}

let allEsperanzaLeads = [];

function openEsperanzaDrawer(id) {
  // Reload full list from last fetch — re-fetch if needed
  const token = localStorage.getItem('brain_token');
  fetch(`/api/brain?action=esperanza`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json())
    .then(data => {
      if (!data.ok) return;
      allEsperanzaLeads = data.leads || [];
      const lead = allEsperanzaLeads.find(l => l.id === id);
      if (!lead) return;
      currentLeadId = id;
      renderDrawer(lead);
      document.getElementById('espDrawer').classList.add('open');
    });
}

function renderDrawer(lead) {
  const st = ESP_STATUS[lead.status] || ESP_STATUS.new;

  document.getElementById('espDrawerTitle').textContent =
    `${lead.name || 'Sin nombre'}${lead.username ? ` · @${lead.username}` : ''}`;

  document.getElementById('espDrawerMeta').innerHTML =
    `<span>${lead.service || '—'}</span>` +
    (lead.interest ? `<span class="esp-drawer-interest">"${escapeHtml(lead.interest)}"</span>` : '') +
    (lead.notion_page_id ? `<a class="esp-notion-link" href="https://notion.so/${lead.notion_page_id.replace(/-/g,'')}" target="_blank">Notion ↗</a>` : '');

  // Status selector
  document.getElementById('espDrawerStatusRow').innerHTML =
    Object.entries(ESP_STATUS).map(([k, v]) =>
      `<button type="button" class="esp-status-btn ${lead.status === k ? 'active' : ''}"
        style="--st-color:${v.color}" onclick="updateLeadStatus('${lead.id}','${k}')">${v.label}</button>`
    ).join('');

  // Conversation thread
  const conv = Array.isArray(lead.conversation) ? lead.conversation : [];
  document.getElementById('espConversation').innerHTML = conv.length
    ? conv.map(m => `
        <div class="esp-msg esp-msg-${m.role}">
          <span class="esp-msg-role">${m.role === 'bot' ? '🌟 Esperanza' : m.role === 'prospect' ? '👤 Prospect' : '🧠 PVB'}</span>
          <span class="esp-msg-text">${escapeHtml(m.text)}</span>
          ${m.ts ? `<span class="esp-msg-ts">${new Date(m.ts).toLocaleTimeString('es-CL', {hour:'2-digit',minute:'2-digit'})}</span>` : ''}
        </div>`)
      .join('')
    : '<div class="hub-empty">Sin mensajes registrados aún.</div>';

  document.getElementById('espNoteInput').value = lead.notes || '';
}

async function updateLeadStatus(id, status) {
  const token = localStorage.getItem('brain_token');
  try {
    await fetch('/api/brain?action=esperanza', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, sub: 'status', status }),
    });
    showNotification(`Lead actualizado → ${ESP_STATUS[status]?.label}`, 'success');
    esperanzaLoaded = false;
    loadEsperanza(true);
    // Refresh drawer status buttons
    const lead = allEsperanzaLeads.find(l => l.id === id);
    if (lead) { lead.status = status; renderDrawer(lead); }
  } catch (err) {
    showNotification(`Error: ${err.message}`, 'error');
  }
}

// ═══════════════════════════════════════════════════════════
// PROYECTOS — Creative Production OS
// ═══════════════════════════════════════════════════════════

const GANTT_PHASES = [
  { id: 'descubrimiento', name: 'Descubrimiento',       days: 3,  owner: 'PVB + Cliente',  color: '#6366f1', deliverables: ['Brief validado', 'Objetivos definidos', 'KPIs acordados'] },
  { id: 'estrategia',     name: 'Estrategia Creativa',  days: 5,  owner: 'David + Ruby',   color: '#E91E63', deliverables: ['Concepto creativo', 'Mensaje núcleo', 'Tono de comunicación'] },
  { id: 'presentacion',   name: 'Presentación Cliente', days: 3,  owner: 'PVB + Cliente',  color: '#FF9800', deliverables: ['Aprobación concepto', 'Ajustes incorporados', 'Presupuesto firmado'] },
  { id: 'preprod',        name: 'Pre-Producción',       days: 10, owner: 'Art Director',   color: '#2196F3', deliverables: ['Script', 'Storyboard', 'Plan de arte', 'Casting', 'Locaciones', 'Wardrobe', 'Call sheet'] },
  { id: 'produccion',     name: 'Producción',           days: 2,  owner: 'Film Crew / IA', color: '#4CAF50', deliverables: ['Footage rodado', 'Assets generados', 'BTS'] },
  { id: 'postprod',       name: 'Post-Producción',      days: 7,  owner: 'Editor',         color: '#00BCD4', deliverables: ['Cut final', 'Color grade', 'Audio mix', 'Motion graphics'] },
  { id: 'revisiones',     name: 'Revisiones',           days: 5,  owner: 'PVB + Cliente',  color: '#9C27B0', deliverables: ['V1 entregada', 'Feedback cliente', 'Correcciones', 'V2 aprobada'] },
  { id: 'aprobacion',     name: 'Aprobación Final',     days: 2,  owner: 'Cliente',        color: '#FF5722', deliverables: ['Sign-off formal', 'Assets finales entregados'] },
  { id: 'lanzamiento',    name: 'Lanzamiento',          days: 1,  owner: 'PVB',            color: '#F59E0B', deliverables: ['Publicación en canales', 'UTMs configurados', 'Boosting activo'] },
  { id: 'medicion',       name: 'Medición & Reporte',   days: 30, owner: 'PVB Analytics',  color: '#607D8B', deliverables: ['Reporte 30 días', 'Reporte 60 días', 'Reporte 90 días', 'Cierre de campaña'] },
];

const STATUS_LABELS = { pending: 'Pendiente', active: 'En curso', done: 'Completado', review: 'En revisión', risk: 'En riesgo' };
const PROJECT_STATUS = { briefing: 'Brief', creative: 'Creativo', preproduction: 'Pre-Prod', production: 'Producción', postproduction: 'Post-Prod', delivery: 'Entrega', live: 'Live', measuring: 'Métricas' };

let pvbProjects = [];
let currentProject = null;

function loadProjects() {
  const saved = localStorage.getItem('pvb_projects');
  pvbProjects = saved ? JSON.parse(saved) : [];
}

function saveProjects() {
  localStorage.setItem('pvb_projects', JSON.stringify(pvbProjects));
}

async function syncProjectToNotion(project) {
  const btn = document.getElementById('syncNotionBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sincronizando…'; }
  try {
    const token = localStorage.getItem('brain_token');
    const r = await fetch('/api/brain?action=sync-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ project }),
    });
    const d = await r.json();
    if (!d.ok) throw new Error(d.error || 'sync failed');
    const idx = pvbProjects.findIndex(p => p.id === project.id);
    if (idx !== -1) {
      pvbProjects[idx].notion_page_id = d.notion_page_id;
      pvbProjects[idx].notion_gantt_ids = d.notion_gantt_ids;
      saveProjects();
    }
    showNotification('Sincronizado con Notion ✓', 'success');
  } catch (err) {
    showNotification(`Error sync Notion: ${err.message}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> Sync → Notion`;
    }
  }
}

function createProject(data) {
  const start = data.startDate || new Date().toISOString().split('T')[0];
  let d = new Date(start + 'T12:00:00');
  const gantt = GANTT_PHASES.map((phase, i) => {
    const phaseStart = d.toISOString().split('T')[0];
    d.setDate(d.getDate() + phase.days);
    const phaseEnd = d.toISOString().split('T')[0];
    d.setDate(d.getDate() + 1);
    return { phaseId: phase.id, startDate: phaseStart, endDate: phaseEnd, status: i === 0 ? 'active' : 'pending', notes: '' };
  });
  const project = {
    id: 'proj_' + Date.now(),
    name: data.campaignName,
    client: data.client,
    contact: { name: data.contactName, role: data.contactRole, email: data.contactEmail },
    objective: data.objective,
    kpis: data.kpis,
    budget: data.budget,
    startDate: start,
    launchDate: data.launchDate,
    formats: data.formats || [],
    path: data.path,
    references: data.references,
    notes: data.notes,
    status: 'briefing',
    createdAt: new Date().toISOString(),
    concept: null,
    creativeSession: [],
    gantt,
  };
  pvbProjects.unshift(project);
  saveProjects();
  return project;
}

function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  const empty = document.getElementById('projectsEmpty');
  if (!grid) return;
  if (!pvbProjects.length) { empty.classList.remove('hidden'); grid.querySelectorAll('.project-card').forEach(c => c.remove()); return; }
  empty.classList.add('hidden');
  grid.querySelectorAll('.project-card').forEach(c => c.remove());
  pvbProjects.forEach(p => {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.id = p.id;
    const activePhase = p.gantt?.find(g => g.status === 'active');
    const phaseName = activePhase ? GANTT_PHASES.find(ph => ph.id === activePhase.phaseId)?.name : '—';
    const progress = p.gantt ? Math.round((p.gantt.filter(g => g.status === 'done').length / GANTT_PHASES.length) * 100) : 0;
    card.innerHTML = `
      <div class="project-card-header">
        <span class="project-card-client">${p.client}</span>
        <span class="project-card-status-badge">${PROJECT_STATUS[p.status] || p.status}</span>
      </div>
      <h3 class="project-card-name">${p.name}</h3>
      <p class="project-card-contact">${p.contact?.name || ''} ${p.contact?.role ? '· ' + p.contact.role : ''}</p>
      <div class="project-card-phase">Fase activa: <strong>${phaseName}</strong></div>
      <div class="project-progress-bar"><div class="project-progress-fill" style="width:${progress}%"></div></div>
      <div class="project-card-footer">
        <span class="project-progress-label">${progress}% · ${p.launchDate || '—'}</span>
        <div class="project-card-actions">
          <button type="button" class="btn-card-edit-brief" data-id="${p.id}">✏️ Brief</button>
          <button type="button" class="btn-card-delete" data-id="${p.id}" title="Eliminar proyecto">🗑</button>
        </div>
      </div>
    `;
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-card-edit-brief') || e.target.closest('.btn-card-delete')) return;
      openProjectDetail(p.id);
    });
    card.querySelector('.btn-card-edit-brief').addEventListener('click', (e) => {
      e.stopPropagation();
      currentProject = pvbProjects.find(pr => pr.id === p.id);
      document.getElementById('editBriefBtn')?.click();
    });
    card.querySelector('.btn-card-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      const proj = pvbProjects.find(pr => pr.id === p.id);
      if (!proj) return;
      if (!confirm(`¿Eliminar "${proj.name}"? Esta acción no se puede deshacer.`)) return;
      pvbProjects.splice(pvbProjects.indexOf(proj), 1);
      saveProjects();
      if (currentProject?.id === proj.id) {
        currentProject = null;
        document.getElementById('pvbProjectsList').classList.remove('hidden');
        document.getElementById('pvbProjectDetail').classList.add('hidden');
      }
      renderProjects();
      showVBToast(`"${proj.name}" eliminado`, 'warning');
    });
    grid.appendChild(card);
  });
}

// ── Notion Projects Gallery ───────────────────────────────────────────────────
const STATUS_COLOR = {
  'En curso': '#22c55e', 'Activo': '#22c55e', 'Producción': '#f59e0b',
  'Entregado': '#60a5fa', 'Completado': '#6b7280', 'Pausado': '#ef4444',
  'Nuevo': '#a78bfa', 'Briefing': '#a78bfa',
};

async function loadNotionProjectsGallery() {
  const container = document.getElementById('notionProjectsGallery');
  if (!container) return;
  container.innerHTML = '<div class="notion-gallery-loading">Cargando proyectos…</div>';
  try {
    const token = localStorage.getItem('brain_token');
    const res = await fetch('/api/brain?action=notion-projects', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.ok || !data.projects?.length) {
      container.innerHTML = '<div class="notion-gallery-empty">Sin proyectos en Notion aún.</div>';
      return;
    }

    // Bidirectional sync: update local projects that are linked to Notion
    let syncCount = 0;
    data.projects.forEach(np => {
      const local = pvbProjects.find(lp => lp.notion_page_id === np.id);
      if (local) {
        // Notion → local: update status and name if changed
        let changed = false;
        const notionStatus = NOTION_TO_LOCAL_STATUS[np.estado] || local.status;
        if (notionStatus !== local.status) { local.status = notionStatus; changed = true; }
        if (np.nombre && np.nombre !== '—' && np.nombre !== local.name) { local.name = np.nombre; changed = true; }
        if (np.launchDate && np.launchDate !== local.launchDate) { local.launchDate = np.launchDate; changed = true; }
        if (changed) syncCount++;
      }
    });
    if (syncCount > 0) { saveProjects(); renderProjects(); }

    container.innerHTML = data.projects.map(p => {
      const color = STATUS_COLOR[p.estado] || '#6b7280';
      const initial = (p.nombre || '?')[0].toUpperCase();
      const coverStyle = p.cover ? `style="background-image:url('${p.cover}')"` : '';
      const local = pvbProjects.find(lp => lp.notion_page_id === p.id);
      const syncBadge = local
        ? `<span class="notion-sync-badge synced" title="Vinculado a Master Brain">⚡</span>`
        : `<button class="notion-import-btn" data-notion-id="${p.id}" data-nombre="${escapeHtml(p.nombre)}" data-cliente="${escapeHtml(p.cliente)}" data-estado="${escapeHtml(p.estado)}" data-fecha="${p.fecha || ''}" data-objetivo="${escapeHtml(p.objetivo || '')}">+ Import</button>`;
      return `
        <div class="notion-project-card" data-notion-id="${p.id}">
          <div class="notion-card-cover ${p.cover ? 'has-cover' : ''}" ${coverStyle}>
            ${p.icon ? `<span class="notion-card-icon">${p.icon}</span>` : `<span class="notion-card-initial">${initial}</span>`}
          </div>
          <div class="notion-card-body">
            <div class="notion-card-meta">
              <span class="notion-card-client">${p.cliente}</span>
              <span class="notion-card-status" style="color:${color};border-color:${color}40">${p.estado}</span>
            </div>
            <h4 class="notion-card-name">${p.nombre}</h4>
            <div class="notion-card-footer">
              ${p.fecha ? `<span class="notion-card-date">${new Date(p.fecha).toLocaleDateString('es-CL', {month:'short',year:'numeric'})}</span>` : '<span></span>'}
              ${syncBadge}
            </div>
          </div>
        </div>`;
    }).join('');

    // Wire Import buttons
    container.querySelectorAll('.notion-import-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const { notionId, nombre, cliente, estado, fecha, objetivo } = btn.dataset;
        const proj = createProject({
          campaignName: nombre, client: cliente,
          startDate: fecha || new Date().toISOString().slice(0, 10),
          objective: objetivo,
        });
        proj.notion_page_id = notionId;
        proj.status = NOTION_TO_LOCAL_STATUS[estado] || 'briefing';
        saveProjects();
        renderProjects();
        showVBToast(`"${nombre}" importado a Master Brain`, 'success');
        loadNotionProjectsGallery(); // refresh to show sync badge
      });
    });

    // Wire card click → open local project if linked
    container.querySelectorAll('.notion-project-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.notion-import-btn')) return;
        const notionId = card.dataset.notionId;
        const local = pvbProjects.find(lp => lp.notion_page_id === notionId);
        if (local) {
          document.querySelector('.brain-tab[data-tab="proyectos"]')?.click();
          setTimeout(() => openProjectDetail(local.id), 150);
        }
      });
    });

  } catch (e) {
    container.innerHTML = `<div class="notion-gallery-empty">Error: ${e.message}</div>`;
  }
}

const NOTION_TO_LOCAL_STATUS = {
  'Nuevo': 'briefing', 'Briefing': 'briefing',
  'En curso': 'production', 'Activo': 'production', 'Producción': 'production',
  'Revisión': 'postproduction', 'Post': 'postproduction',
  'Entregado': 'delivery', 'Completado': 'measuring', 'Pausado': 'briefing',
};

function openProjectDetail(id) {
  currentProject = pvbProjects.find(p => p.id === id);
  if (!currentProject) return;
  document.getElementById('pvbProjectsList').classList.add('hidden');
  document.getElementById('pvbProjectDetail').classList.remove('hidden');
  document.getElementById('detailClient').textContent = currentProject.client;
  document.getElementById('detailName').textContent = currentProject.name;
  document.getElementById('detailStatus').textContent = PROJECT_STATUS[currentProject.status] || currentProject.status;
  renderBriefDisplay();
  renderGantt();
  if (currentProject.creativeSession.length > 0) renderCreativeSession();
  switchSubTab('brief');
}

function renderBriefDisplay() {
  if (!currentProject) return;
  const p = currentProject;
  const formats = Array.isArray(p.formats) ? p.formats.join(', ') : p.formats;
  const pathLabels = { 'film-crew': 'Film Crew (orgánico)', 'ia': 'IA Generativa', 'ambos': 'Ambos' };
  document.getElementById('briefDisplay').innerHTML = `
    <div class="brief-grid">
      <div class="brief-section">
        <h4>Cliente</h4>
        <p class="brief-value">${p.client}</p>
      </div>
      <div class="brief-section">
        <h4>Contacto</h4>
        <p class="brief-value">${p.contact?.name || '—'}<br><span class="brief-sub">${p.contact?.role || ''} ${p.contact?.email ? '· ' + p.contact.email : ''}</span></p>
      </div>
      <div class="brief-section full">
        <h4>Objetivo de campaña</h4>
        <p class="brief-value">${p.objective || '—'}</p>
      </div>
      <div class="brief-section full">
        <h4>KPIs / Métricas de éxito</h4>
        <p class="brief-value">${p.kpis || '—'}</p>
      </div>
      <div class="brief-section">
        <h4>Presupuesto</h4>
        <p class="brief-value">${p.budget || '—'}</p>
      </div>
      <div class="brief-section">
        <h4>Lanzamiento objetivo</h4>
        <p class="brief-value">${p.launchDate || '—'}</p>
      </div>
      <div class="brief-section">
        <h4>Formatos</h4>
        <p class="brief-value">${formats || '—'}</p>
      </div>
      <div class="brief-section">
        <h4>Path de producción</h4>
        <p class="brief-value">${pathLabels[p.path] || p.path || '—'}</p>
      </div>
      ${p.references ? `<div class="brief-section full"><h4>Referencias</h4><p class="brief-value">${p.references}</p></div>` : ''}
      ${p.notes ? `<div class="brief-section full"><h4>Notas de la reunión</h4><p class="brief-value">${p.notes}</p></div>` : ''}
    </div>
  `;
}

function renderCreativeSession() {
  if (!currentProject) return;
  const msgs = document.getElementById('creativeMessages');
  const iterate = document.getElementById('creativeIterate');
  const concept = document.getElementById('conceptOutput');
  msgs.innerHTML = '';
  currentProject.creativeSession.forEach(msg => {
    const div = document.createElement('div');
    div.className = `creative-msg creative-msg--${msg.role}`;
    div.innerHTML = `<div class="creative-msg-author">${msg.role === 'david' ? '👔 David — Estrategia' : msg.role === 'ruby' ? '🎨 Ruby — Creativo' : '💡 Concepto'}</div><div class="creative-msg-body">${msg.content.replace(/\n/g, '<br>')}</div>`;
    msgs.appendChild(div);
  });
  msgs.scrollTop = msgs.scrollHeight;
  iterate.classList.remove('hidden');
  if (currentProject.concept) {
    concept.classList.remove('hidden');
    concept.innerHTML = `<div class="concept-card"><div class="concept-card-label">Concepto Final</div><div class="concept-card-body">${currentProject.concept.replace(/\n/g, '<br>')}</div></div>`;
  }
}

async function startCreativeSession() {
  if (!currentProject) return;
  const btn = document.getElementById('startCreativeSessionBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Generando sesión creativa...'; }
  const msgs = document.getElementById('creativeMessages');
  msgs.innerHTML = '<div class="creative-loading"><div class="creative-loading-dots"><span></span><span></span><span></span></div><p>David y Ruby están analizando el brief...</p></div>';
  const token = localStorage.getItem('brain_token');
  try {
    const res = await fetch('/api/brain?action=creative-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ brief: currentProject }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error en sesión creativa');
    currentProject.creativeSession = data.session;
    currentProject.concept = data.concept;
    currentProject.status = 'creative';
    saveProjects();
    renderCreativeSession();
    renderProjects();
  } catch (err) {
    msgs.innerHTML = `<div class="creative-error">Error: ${err.message}</div>`;
    if (btn) { btn.disabled = false; btn.textContent = 'Reintentar'; }
  }
}

async function iterateCreativeSession() {
  if (!currentProject) return;
  const input = document.getElementById('iterateInput');
  const prompt = input.value.trim();
  if (!prompt) return;
  input.value = '';
  const iterateBtn = document.getElementById('iterateBtn');
  iterateBtn.disabled = true;
  const token = localStorage.getItem('brain_token');
  try {
    const res = await fetch('/api/brain?action=creative-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ brief: currentProject, iterate: prompt }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error');
    currentProject.creativeSession = data.session;
    currentProject.concept = data.concept;
    saveProjects();
    renderCreativeSession();
  } catch (err) {
    showNotification(`Error: ${err.message}`, 'error');
  } finally {
    iterateBtn.disabled = false;
  }
}

function renderGantt() {
  if (!currentProject) return;
  const container = document.getElementById('ganttContainer');
  const meta = document.getElementById('ganttMeta');
  if (!container) return;
  const startRaw = currentProject.startDate || new Date().toISOString().slice(0, 10);
  const start = new Date(startRaw + 'T12:00:00');
  const totalDays = GANTT_PHASES.reduce((s, p) => s + p.days + 1, 0);
  meta.textContent = `${startRaw} → ${currentProject.launchDate || 'TBD'} · ${totalDays} días estimados`;
  let html = `<div class="gantt-table">
    <div class="gantt-row gantt-row--header">
      <div class="gantt-col-phase">Fase</div>
      <div class="gantt-col-owner">Responsable</div>
      <div class="gantt-col-dates">Fechas</div>
      <div class="gantt-col-bar">Línea de tiempo</div>
      <div class="gantt-col-status">Estado</div>
    </div>`;
  GANTT_PHASES.forEach(phase => {
    const g = currentProject.gantt?.find(gg => gg.phaseId === phase.id) || { startDate: '—', endDate: '—', status: 'pending', notes: '' };
    const statusClass = `gantt-status--${g.status}`;
    const barWidth = Math.round((phase.days / totalDays) * 100);
    const gStart = g.startDate && g.startDate !== '—' ? new Date(g.startDate + 'T12:00:00') : null;
    const barOffset = gStart && !isNaN(gStart) ? Math.round(((gStart - start) / (1000 * 60 * 60 * 24)) / totalDays * 100) : 0;
    const dlList = phase.deliverables.map(d => `<span class="gantt-deliverable">${d}</span>`).join('');
    html += `
    <div class="gantt-row" data-phase="${phase.id}">
      <div class="gantt-col-phase">
        <span class="gantt-phase-dot" style="background:${phase.color}"></span>
        <div>
          <strong>${phase.name}</strong>
          <div class="gantt-deliverables">${dlList}</div>
        </div>
      </div>
      <div class="gantt-col-owner">${phase.owner}</div>
      <div class="gantt-col-dates">${g.startDate}<br><span class="gantt-date-end">${g.endDate}</span></div>
      <div class="gantt-col-bar">
        <div class="gantt-bar-track">
          <div class="gantt-bar-fill" style="left:${barOffset}%;width:${barWidth}%;background:${phase.color}"></div>
        </div>
      </div>
      <div class="gantt-col-status">
        <select class="gantt-status-select ${statusClass}" data-phase="${phase.id}" title="Estado de la fase">
          <option value="pending" ${g.status === 'pending' ? 'selected' : ''}>Pendiente</option>
          <option value="active" ${g.status === 'active' ? 'selected' : ''}>En curso</option>
          <option value="review" ${g.status === 'review' ? 'selected' : ''}>En revisión</option>
          <option value="done" ${g.status === 'done' ? 'selected' : ''}>Completado</option>
          <option value="risk" ${g.status === 'risk' ? 'selected' : ''}>En riesgo</option>
        </select>
      </div>
    </div>`;
  });
  html += '</div>';
  container.innerHTML = html;
  container.querySelectorAll('.gantt-status-select').forEach(sel => {
    sel.addEventListener('change', e => {
      const phaseId = e.target.dataset.phase;
      const g = currentProject.gantt.find(gg => gg.phaseId === phaseId);
      if (g) {
        g.status = e.target.value;
        e.target.className = `gantt-status-select gantt-status--${g.status}`;
        if (g.status === 'done') {
          const idx = GANTT_PHASES.findIndex(p => p.id === phaseId);
          const next = currentProject.gantt[idx + 1];
          if (next && next.status === 'pending') next.status = 'active';
        }
        const activePhase = currentProject.gantt.find(gg => gg.status === 'active');
        const statusMap = { briefing: 'descubrimiento', creative: 'estrategia', preproduction: 'preprod', production: 'produccion', postproduction: 'postprod', delivery: 'revisiones', live: 'lanzamiento', measuring: 'medicion' };
        if (activePhase) {
          const projStatus = Object.entries(statusMap).find(([, ph]) => ph === activePhase.phaseId)?.[0];
          if (projStatus) currentProject.status = projStatus;
        }
        saveProjects();
        document.getElementById('detailStatus').textContent = PROJECT_STATUS[currentProject.status] || currentProject.status;
        renderProjects();
      }
    });
  });
}

function switchSubTab(name) {
  document.querySelectorAll('.project-sub-tab').forEach(b => b.classList.toggle('active', b.dataset.subtab === name));
  document.querySelectorAll('.project-sub-content').forEach(s => s.classList.toggle('active', s.id === `subtab-${name}`));
}

function initProyectosTab() {
  loadProjects();
  renderProjects();
  loadNotionProjectsGallery();

  document.getElementById('refreshNotionGallery')?.addEventListener('click', loadNotionProjectsGallery);

  document.getElementById('openNewProjectBtn')?.addEventListener('click', () => {
    document.getElementById('newProjectModal').classList.remove('hidden');
    document.getElementById('briefStartDate').valueAsDate = new Date();
  });
  const closeModal = () => {
    document.getElementById('newProjectModal').classList.add('hidden');
    const form = document.getElementById('briefForm');
    if (form) { form.dataset.editMode = 'false'; }
    document.querySelector('#newProjectModal h3').textContent = 'Nueva Campaña';
  };
  document.getElementById('closeModalBtn')?.addEventListener('click', closeModal);
  document.getElementById('closeModalBackdrop')?.addEventListener('click', closeModal);
  document.getElementById('cancelBriefBtn')?.addEventListener('click', closeModal);

  document.getElementById('briefForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.formats = fd.getAll('formats');
    if (e.target.dataset.editMode === 'true') {
      // Editing existing project
      const p = currentProject;
      p.name = data.campaignName;
      p.client = data.client;
      p.contact = { name: data.contactName, role: data.contactRole, email: data.contactEmail };
      p.budget = data.budget;
      p.objective = data.objective;
      p.kpis = data.kpis;
      p.startDate = data.startDate;
      p.launchDate = data.launchDate;
      p.formats = data.formats || fd.getAll('formats');
      p.path = data.path;
      p.references = data.references;
      p.notes = data.notes;
      saveProjects();
      renderBriefDisplay();
      document.getElementById('detailName').textContent = p.name;
      e.target.dataset.editMode = 'false';
      document.querySelector('#newProjectModal h3').textContent = 'Nueva Campaña';
      document.getElementById('newProjectModal').classList.add('hidden');
      showNotification('Brief actualizado', 'success');
    } else {
      createProject(data);
      e.target.reset();
      document.getElementById('newProjectModal').classList.add('hidden');
      renderProjects();
      showNotification('Proyecto creado', 'success');
    }
  });

  document.getElementById('editBriefBtn')?.addEventListener('click', () => {
    if (!currentProject) return;
    const p = currentProject;
    const form = document.getElementById('briefForm');
    // Pre-fill fields
    form.querySelector('[name=campaignName]').value = p.name || '';
    form.querySelector('[name=client]').value = p.client || '';
    form.querySelector('[name=contactName]').value = p.contact?.name || '';
    form.querySelector('[name=contactRole]').value = p.contact?.role || '';
    form.querySelector('[name=contactEmail]').value = p.contact?.email || '';
    form.querySelector('[name=budget]').value = p.budget || '';
    form.querySelector('[name=objective]').value = p.objective || '';
    form.querySelector('[name=kpis]').value = p.kpis || '';
    form.querySelector('[name=startDate]').value = p.startDate || '';
    form.querySelector('[name=launchDate]').value = p.launchDate || '';
    form.querySelector('[name=references]').value = p.references || '';
    form.querySelector('[name=notes]').value = p.notes || '';
    // Checkboxes
    const formats = Array.isArray(p.formats) ? p.formats : (p.formats ? [p.formats] : []);
    form.querySelectorAll('[name=formats]').forEach(cb => { cb.checked = formats.includes(cb.value); });
    // Radio
    const pathRadio = form.querySelector(`[name=path][value="${p.path}"]`);
    if (pathRadio) pathRadio.checked = true;
    // Set edit mode and open
    form.dataset.editMode = 'true';
    document.querySelector('#newProjectModal h3').textContent = 'Editar Brief';
    document.getElementById('newProjectModal').classList.remove('hidden');
  });

  document.getElementById('backToProjectsBtn')?.addEventListener('click', () => {
    currentProject = null;
    document.getElementById('pvbProjectDetail').classList.add('hidden');
    document.getElementById('pvbProjectsList').classList.remove('hidden');
    renderProjects();
  });

  document.querySelectorAll('.project-sub-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      switchSubTab(btn.dataset.subtab);
      if (btn.dataset.subtab === 'gantt') renderGantt();
    });
  });

  document.getElementById('startCreativeSessionBtn')?.addEventListener('click', startCreativeSession);
  document.getElementById('iterateBtn')?.addEventListener('click', iterateCreativeSession);
  document.getElementById('iterateInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); iterateCreativeSession(); }
  });

  document.getElementById('syncNotionBtn')?.addEventListener('click', () => {
    if (currentProject) syncProjectToNotion(currentProject);
  });
}

function initEsperanzaTab() {
  document.getElementById('espDrawerClose')?.addEventListener('click', () => {
    document.getElementById('espDrawer').classList.remove('open');
    currentLeadId = null;
  });

  document.getElementById('espRefreshBtn')?.addEventListener('click', () => {
    esperanzaLoaded = false;
    loadEsperanza(true);
  });

  document.getElementById('espStatusFilter')?.addEventListener('change', () => {
    esperanzaLoaded = false;
    loadEsperanza(true);
  });

  document.getElementById('espNoteSave')?.addEventListener('click', async () => {
    if (!currentLeadId) return;
    const notes = document.getElementById('espNoteInput').value.trim();
    const token = localStorage.getItem('brain_token');
    try {
      await fetch('/api/brain?action=esperanza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: currentLeadId, sub: 'note', notes }),
      });
      showNotification('Nota guardada', 'success');
    } catch (err) {
      showNotification(`Error: ${err.message}`, 'error');
    }
  });
}

// ── Voice Bot Widget ───────────────────────────────────────────────────────
function initVoiceBot() {
  const widget   = document.getElementById('vb-widget');
  const fab      = document.getElementById('vbFab');
  const panel    = document.getElementById('vbPanel');
  const closeBtn = document.getElementById('vbClose');
  const messages = document.getElementById('vbMessages');
  const input    = document.getElementById('vbInput');
  const micBtn       = document.getElementById('vbMic');
  const sendBtn      = document.getElementById('vbSend');
  const statusEl     = document.getElementById('vbStatus');
  const dot          = document.getElementById('vbDot');
  const ttsBtn       = document.getElementById('vbTtsToggle');
  const autoListenBtn= document.getElementById('vbAutoListen');
  const projSel      = document.getElementById('vbProjectSelect');
  const noteSaveBtn  = document.getElementById('vbNoteSave');
  if (!widget) return;

  const HISTORY_KEY = 'brain_chat_history';
  const MESSAGES_KEY = 'brain_chat_messages';

  // Restore history from localStorage
  let history = [];
  try { history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch {}

  let ttsEnabled = true;
  let recording = false;
  let autoListen = false;
  let autoListenTimer = null;
  let onSpeakEnd = null; // set by STT block to restart mic after TTS

  // ── TTS toggle ──
  ttsBtn.classList.toggle('on', ttsEnabled);
  ttsBtn.addEventListener('click', () => {
    ttsEnabled = !ttsEnabled;
    ttsBtn.classList.toggle('on', ttsEnabled);
    ttsBtn.title = ttsEnabled ? 'Voz activada' : 'Voz desactivada';
    if (!ttsEnabled) speechSynthesis.cancel();
  });

  // ── Open / close ──
  fab.addEventListener('click', () => {
    widget.classList.toggle('vb-collapsed');
    if (!widget.classList.contains('vb-collapsed')) {
      loadProjectsIntoVoiceBot();
      if (autoListen) scheduleAutoListen(300); else input.focus();
    } else {
      stopAutoListen();
    }
  });
  closeBtn.addEventListener('click', () => { widget.classList.add('vb-collapsed'); stopAutoListen(); });

  // ── Brainstorm button — sesión creativa con David & Rubín ──
  const brainstormBtn = document.getElementById('vbBrainstorm');
  let brainstormActive = false;
  let brainstormHistory = [];

  async function sendBrainstorm(text) {
    if (!text.trim()) return;
    const token = localStorage.getItem('brain_token');
    const selectedProj = pvbProjects.find(p => p.id === projSel.value);
    const proyecto = selectedProj?.name || projSel.value || '';

    addMsg('user', text);
    brainstormHistory.push({ role: 'user', content: text });
    input.value = '';
    const thinking = addThinking();
    dot.classList.add('active');
    statusEl.textContent = 'pensando…';
    try {
      const res = await fetch('/api/brain?action=brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, proyecto, history: brainstormHistory.slice(-6) }),
      });
      const data = await res.json();
      thinking.remove();
      if (!data.ok) throw new Error(data.error);
      // Display Droga and Rubín responses with labels
      const combined = `🎯 **David Droga:**\n${data.droga}\n\n🎨 **Rubín (Consejo Creativo):**\n${data.rubin}`;
      addMsg('assistant', combined);
      brainstormHistory.push({ role: 'assistant', content: combined });
      // Speak David with Adam voice, then queue Rubín with Josh after David finishes
      onSpeakEnd = () => { onSpeakEnd = null; speak(data.rubin, 'rubin'); };
      speak(data.droga, 'droga');
    } catch (err) {
      thinking.remove();
      addMsg('assistant', `Error: ${err.message}`);
    }
    dot.classList.remove('active');
    statusEl.textContent = 'listo';
  }

  brainstormBtn?.addEventListener('click', () => {
    brainstormActive = !brainstormActive;
    brainstormBtn.classList.toggle('on', brainstormActive);
    brainstormBtn.title = brainstormActive ? 'Brainstorm activo — clic para salir' : 'Sesión creativa con David & Rubín';
    if (brainstormActive) {
      widget.classList.remove('vb-collapsed');
      brainstormHistory = [];
      sendBrainstorm('Quiero iniciar una sesión de brainstorming. Presenten sus perspectivas sobre el proyecto actual y cuál sería el ángulo más disruptivo para atacarlo.');
    } else {
      showVBToast('Sesión creativa cerrada', 'info');
    }
  });

  // ── Auto-listen toggle ──
  autoListenBtn.addEventListener('click', () => {
    autoListen = !autoListen;
    autoListenBtn.classList.toggle('on', autoListen);
    autoListenBtn.title = autoListen ? 'Modo continuo activo — clic para desactivar' : 'Activar modo conversación continua';
    if (autoListen && !widget.classList.contains('vb-collapsed')) {
      scheduleAutoListen(200);
    } else if (!autoListen) {
      stopAutoListen();
    }
  });

  // ── Project note-pad ──
  projSel.addEventListener('change', () => {
    const hasProjId = projSel.value && pvbProjects.find(p => p.name === projSel.value || p.id === projSel.value);
    noteSaveBtn.classList.toggle('tab-badge--hidden', !hasProjId);
    noteSaveBtn.title = hasProjId ? `Guardar nota en "${projSel.value}" (Shift+Enter)` : '';
  });

  function saveNoteToCurrentProject(text) {
    if (!text.trim()) return;
    const proj = pvbProjects.find(p => p.name === projSel.value || p.id === projSel.value);
    if (!proj) { showVBToast('Seleccioná un proyecto primero', 'warning'); return; }
    if (!proj.projectNotes) proj.projectNotes = [];
    proj.projectNotes.push({ date: new Date().toISOString(), text: text.trim(), source: 'voice-bot' });
    // Also append to notes field (shown in brief) as markdown chunk
    const dated = `\n\n---\n**Nota ${new Date().toLocaleDateString('es-CL')}**\n${text.trim()}`;
    proj.notes = (proj.notes || '') + dated;
    saveProjects();
    showVBToast(`Nota guardada en "${proj.name}"`, 'success');
    input.value = '';
    renderBriefDisplay(); // refresh if brief is open
  }

  noteSaveBtn?.addEventListener('click', () => saveNoteToCurrentProject(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.shiftKey && projSel.value) {
      e.preventDefault();
      saveNoteToCurrentProject(input.value);
    }
  });

  // ── Load Notion projects into selector ──
  let projectsLoaded = false;
  async function loadProjectsIntoVoiceBot() {
    if (projectsLoaded) return;
    projectsLoaded = true;
    try {
      const token = localStorage.getItem('brain_token');
      const res = await fetch('/api/brain?action=hub', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      // Local projects first (with IDs for note-saving)
      pvbProjects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.name}${p.client ? ` — ${p.client}` : ''}`;
        projSel.appendChild(opt);
      });
      // Then Notion projects
      (data.proyectos || []).forEach(p => {
        if (pvbProjects.find(lp => lp.name === p.nombre)) return; // skip duplicates
        const opt = document.createElement('option');
        opt.value = p.nombre;
        opt.textContent = p.nombre + (p.cliente ? ` — ${p.cliente}` : '');
        projSel.appendChild(opt);
      });
    } catch (_) {}
  }

  // Restore UI messages from localStorage
  if (history.length) {
    const welcome = messages.querySelector('.vb-welcome');
    if (welcome) welcome.remove();
    history.slice(-20).forEach(m => {
      if (m.role === 'user' || m.role === 'assistant') {
        const row = document.createElement('div');
        row.className = `vb-msg vb-msg-${m.role}`;
        const bubble = document.createElement('div');
        bubble.className = 'vb-bubble';
        bubble.textContent = typeof m.content === 'string' ? m.content : '';
        row.appendChild(bubble);
        messages.appendChild(row);
      }
    });
    messages.scrollTop = messages.scrollHeight;
  }

  // ── Append message ──
  function addMsg(role, text) {
    const welcome = messages.querySelector('.vb-welcome');
    if (welcome) welcome.remove();
    const row = document.createElement('div');
    row.className = `vb-msg vb-msg-${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'vb-bubble';
    bubble.textContent = text;
    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  function addThinking() {
    const row = document.createElement('div');
    row.className = 'vb-msg vb-thinking';
    row.innerHTML = '<div class="vb-bubble"><span></span><span></span><span></span></div>';
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  // ── TTS speak ──
  function pickSpanishVoice() {
    const vs = speechSynthesis.getVoices();
    return vs.find(v => v.name === 'Esperanza')              // macOS es-MX
        || vs.find(v => v.name === 'Paulina')                // macOS es-MX alt
        || vs.find(v => v.name === 'Monica')                 // macOS es-ES
        || vs.find(v => /^Jorge/i.test(v.name))              // macOS es-ES male
        || vs.find(v => /es[-_]MX/i.test(v.lang))
        || vs.find(v => /es[-_]ES/i.test(v.lang))
        || vs.find(v => v.lang.startsWith('es'))
        || null;
  }

  function speakFallback(text) {
    if (!('speechSynthesis' in window)) { onSpeakEnd?.(); return; }
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.05;
    utter.pitch = 1;
    utter.onend = () => onSpeakEnd?.();
    function doSpeak() {
      const voice = pickSpanishVoice();
      if (voice) { utter.voice = voice; utter.lang = voice.lang; }
      else { utter.lang = 'es-MX'; }
      speechSynthesis.speak(utter);
    }
    if (speechSynthesis.getVoices().length) doSpeak();
    else speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
  }

  async function speak(text, voice = null) {
    if (!ttsEnabled) { onSpeakEnd?.(); return; }
    const token = localStorage.getItem('brain_token');
    try {
      const res = await fetch('/api/brain?action=tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text, ...(voice ? { voice } : {}) }),
      });
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const ctx = getAudioCtx();
        const decoded = await ctx.decodeAudioData(arrayBuf);
        const source = ctx.createBufferSource();
        source.buffer = decoded;
        source.connect(ctx.destination);
        source.onended = () => { statusEl.textContent = autoListen ? 'escuchando…' : 'listo'; onSpeakEnd?.(); };
        source.start(0);
        return;
      } else {
        const errText = await res.text().catch(() => '');
        console.warn('[TTS] error:', res.status, errText.slice(0, 100));
        showVBToast(`TTS error ${res.status}`, 'warning');
      }
    } catch (e) {
      console.warn('[TTS] error:', e.message);
    }
    speakFallback(text);
  }

  // ── Send message ──
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    sendBtn.disabled = true;
    dot.classList.add('active');
    statusEl.textContent = 'pensando…';

    addMsg('user', text);
    history.push({ role: 'user', content: text });

    const thinking = addThinking();
    try {
      const token = localStorage.getItem('brain_token');
      // Selected project — prefer name for Notion context, ID for local ops
      const selectedProj = pvbProjects.find(p => p.id === projSel.value);
      const proyecto = selectedProj ? selectedProj.name : (projSel.value || '');
      // Send local project state so the bot can create/edit Master Brain projects
      const localProjects = (pvbProjects || []).map(p => ({
        id: p.id, name: p.name, client: p.client, status: p.status,
        startDate: p.startDate, launchDate: p.launchDate, budget: p.budget,
        objective: p.objective, kpis: p.kpis, notes: p.notes,
        activePhase: p.gantt?.find(g => g.status === 'active')?.phaseId || null,
        progress: p.gantt ? Math.round((p.gantt.filter(g => g.status === 'done').length / (p.gantt.length || 1)) * 100) : 0,
      }));
      const reviewSession = JSON.parse(localStorage.getItem('mb_review_session') || 'null');
      const res = await fetch('/api/brain?action=chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, history: history.slice(-10), proyecto, localProjects, reviewSession }),
      });
      const data = await res.json();
      thinking.remove();

      if (!data.ok) throw new Error(data.error || 'Error del servidor');
      if (!data.reply) throw new Error('Respuesta vacía del servidor');

      addMsg('assistant', data.reply);
      history.push({ role: 'assistant', content: data.reply });
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-40))); } catch {}
      if (data.commands?.length) executeVBCommands(data.commands);
      speak(data.reply); // speak() calls onSpeakEnd when done → restarts mic if autoListen

      if (data.actionsPerformed?.length > 0) {
        statusEl.textContent = `✓ ${data.actionsPerformed.length} acciones`;
        setTimeout(() => { statusEl.textContent = autoListen ? 'escuchando…' : 'listo'; }, 3000);
      } else {
        statusEl.textContent = 'listo';
      }
    } catch (err) {
      thinking.remove();
      addMsg('assistant', `Error: ${err.message}`);
      statusEl.textContent = 'error';
      if (autoListen) scheduleAutoListen(1500);
    }

    sendBtn.disabled = false;
    dot.classList.remove('active');
    if (!autoListen) input.focus();
  }

  sendBtn.addEventListener('click', () => brainstormActive ? sendBrainstorm(input.value.trim()) : sendMessage());
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      brainstormActive ? sendBrainstorm(input.value.trim()) : sendMessage();
    }
  });

  // ── Voice input (STT) — continuous mode, silence-detect + auto-send ──
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SR();
    recog.lang = 'es-ES';
    recog.continuous = true;     // no 8s hard cut
    recog.interimResults = true; // show text live while speaking
    recog.maxAlternatives = 1;

    let vbFinalText = '';
    let vbSilenceTimer = null;
    let vbIntentionalStop = false;
    const VB_SILENCE_MS = 2500;  // stop after 2.5s of silence, then auto-send

    // AudioContext — once resumed inside a user gesture, plays freely from any async context
    let audioCtx = null;
    function getAudioCtx() {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    }

    function startListening() {
      if (recording) return;
      getAudioCtx(); // resume/create inside user gesture — unlocks async playback
      clearTimeout(autoListenTimer);
      clearTimeout(vbSilenceTimer);
      vbFinalText = '';
      vbIntentionalStop = false;
      try {
        speechSynthesis.cancel();
        recog.start();
        recording = true;
        micBtn.classList.remove('auto-listening');
        micBtn.classList.add('recording');
        micBtn.title = 'Grabando… (clic para parar)';
        statusEl.textContent = 'escuchando…';
      } catch (_) { /* recognition already running */ }
    }

    function scheduleAutoListen(delay = 600) {
      clearTimeout(autoListenTimer);
      autoListenTimer = setTimeout(() => {
        if (autoListen && !recording) startListening();
      }, delay);
      micBtn.classList.add('auto-listening');
    }

    function stopAutoListen() {
      autoListen = false;
      clearTimeout(autoListenTimer);
      clearTimeout(vbSilenceTimer);
      autoListenBtn.classList.remove('on');
      micBtn.classList.remove('auto-listening', 'recording');
      micBtn.title = 'Hablar';
      if (recording) { vbIntentionalStop = true; recog.stop(); recording = false; }
    }

    micBtn.addEventListener('click', () => {
      if (recording) {
        // Manual stop — turn off auto-listen, stop mic, send whatever was captured
        clearTimeout(vbSilenceTimer);
        autoListen = false;
        autoListenBtn.classList.remove('on');
        autoListenBtn.title = 'Activar modo conversación continua';
        vbIntentionalStop = true;
        recog.stop();
        // onend will handle sending vbFinalText
      } else {
        startListening();
      }
    });

    recog.onresult = (e) => {
      clearTimeout(vbSilenceTimer);
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) vbFinalText += e.results[i][0].transcript + ' ';
        else interim = e.results[i][0].transcript;
      }
      // Show live transcript in status bar (keeps input clean until send)
      statusEl.textContent = (vbFinalText + interim).trim().slice(-60) || 'escuchando…';
      // Auto-stop after 2.5s of silence
      vbSilenceTimer = setTimeout(() => { vbIntentionalStop = true; recog.stop(); }, VB_SILENCE_MS);
    };

    recog.onend = () => {
      clearTimeout(vbSilenceTimer);
      // Browser-imposed cut — restart immediately to keep mic alive
      if (!vbIntentionalStop && recording) {
        try { recog.start(); return; } catch (_) {}
      }
      vbIntentionalStop = false;
      recording = false;
      micBtn.classList.remove('recording');
      micBtn.title = autoListen ? 'Modo continuo' : 'Hablar';
      const text = vbFinalText.trim();
      if (text) {
        input.value = text;
        vbFinalText = '';
        sendMessage(); // auto-send on silence/stop
      } else {
        statusEl.textContent = 'listo';
        if (autoListen) scheduleAutoListen(500);
      }
    };

    recog.onerror = (e) => {
      clearTimeout(vbSilenceTimer);
      if (e.error === 'no-speech' && recording && !vbIntentionalStop) {
        // Browser reported no-speech but we're still in active listening — restart
        try { recog.start(); return; } catch (_) {}
      }
      vbIntentionalStop = false;
      recording = false;
      vbFinalText = '';
      micBtn.classList.remove('recording');
      micBtn.title = 'Hablar';
      statusEl.textContent = 'listo';
      if (autoListen && e.error !== 'aborted') scheduleAutoListen(2000);
    };

    // Wire onSpeakEnd so speak() restarts mic after TTS finishes
    onSpeakEnd = () => { if (autoListen) scheduleAutoListen(500); };

  } else {
    micBtn.style.display = 'none';
  }
}
