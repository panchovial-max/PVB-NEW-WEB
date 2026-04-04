#!/usr/bin/env node
/**
 * PVB MASTER BRAIN — Seed Script
 * Seeds all 68 agents + 9 routines into Supabase
 *
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/seed-master-brain.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://krmoihryyvooymvhsuno.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_KEY) {
  console.error('Set SUPABASE_SERVICE_KEY env var');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const AGENTS = [
  // CEO
  { id: 'agents-orchestrator', name: 'Pancho — Orchestrator', title: 'Founder & CEO / Agents Orchestrator', department: 'ceo', role: 'ceo', budget_monthly_cents: 10000,
    capabilities: 'workflow-orchestration, quality-gate-enforcement, multi-agent-coordination, autonomous-error-recovery, dev-qa-loops', skills: '',
    instruction_file: 'agents-orchestrator.md' },

  // CREATIVE
  { id: 'design-brand-guardian', name: 'Brand Guardian', title: 'Identidad de marca, consistencia visual', department: 'creative', capabilities: 'brand-identity, visual-systems, brand-voice, consistency-monitoring', skills: '', instruction_file: 'design-brand-guardian.md' },
  { id: 'design-ui-designer', name: 'UI Designer', title: 'Design systems, component libraries', department: 'creative', capabilities: 'design-systems, component-libraries, dark-mode-theming, pixel-perfect-interfaces', skills: 'landing-page, page-cro', instruction_file: 'design-ui-designer.md' },
  { id: 'design-ux-architect', name: 'UX Architect', title: 'CSS systems, layout frameworks', department: 'creative', capabilities: 'css-design-systems, layout-frameworks, developer-ready-foundations', skills: 'page-cro, onboarding-cro', instruction_file: 'design-ux-architect.md' },
  { id: 'design-ux-researcher', name: 'UX Researcher', title: 'User behavior, usability testing', department: 'creative', capabilities: 'user-interviews, usability-testing, persona-development, journey-mapping', skills: '', instruction_file: 'design-ux-researcher.md' },
  { id: 'design-image-prompt-engineer', name: 'Image Prompt Engineer', title: 'AI photography prompts', department: 'creative', capabilities: 'ai-image-prompts, photography-direction, style-consistency', skills: 'ad-creative', instruction_file: 'design-image-prompt-engineer.md' },
  { id: 'design-visual-storyteller', name: 'Visual Storyteller', title: 'Narrativa visual, multimedia', department: 'creative', capabilities: 'visual-narratives, multimedia-content, data-visualization', skills: '', instruction_file: 'design-visual-storyteller.md' },
  { id: 'design-inclusive-visuals-specialist', name: 'Inclusive Visuals', title: 'Representacion diversa, anti-bias', department: 'creative', capabilities: 'bias-detection, cultural-accuracy, intersectional-representation', skills: '', instruction_file: 'design-inclusive-visuals-specialist.md' },
  { id: 'design-whimsy-injector', name: 'Whimsy Injector', title: 'Micro-interacciones, deleite', department: 'creative', capabilities: 'brand-personality, micro-interactions, easter-eggs, playful-ux', skills: '', instruction_file: 'design-whimsy-injector.md' },

  // MARKETING
  { id: 'marketing-content-creator', name: 'Content Creator', title: 'Contenido multi-plataforma', department: 'marketing', capabilities: 'content-strategy, editorial-calendars, brand-storytelling, copywriting', skills: 'content-strategy, copywriting, email-sequence, cold-email, social-content', instruction_file: 'marketing-content-creator.md' },
  { id: 'marketing-social-media-strategist', name: 'Social Media Strategist', title: 'Estrategia cross-platform', department: 'marketing', capabilities: 'cross-platform-campaigns, community-building, thought-leadership', skills: 'social-content', instruction_file: 'marketing-social-media-strategist.md' },
  { id: 'marketing-instagram-curator', name: 'Instagram Curator', title: 'Visual storytelling en IG', department: 'marketing', capabilities: 'visual-brand-development, reels, stories, social-commerce', skills: 'social-content, ad-creative', instruction_file: 'marketing-instagram-curator.md' },
  { id: 'marketing-tiktok-strategist', name: 'TikTok Strategist', title: 'Contenido viral TikTok', department: 'marketing', capabilities: 'viral-content, algorithm-mastery, trend-analysis', skills: 'social-content, ad-creative', instruction_file: 'marketing-tiktok-strategist.md' },
  { id: 'marketing-twitter-engager', name: 'Twitter Engager', title: 'Threads y engagement en X', department: 'marketing', capabilities: 'real-time-engagement, thought-leadership, thread-creation', skills: 'social-content', instruction_file: 'marketing-twitter-engager.md' },
  { id: 'marketing-growth-hacker', name: 'Growth Hacker', title: 'Growth loops y funnels', department: 'marketing', capabilities: 'growth-strategy, ab-testing, viral-mechanics', skills: 'referral-program, paid-ads, ab-test-setup', instruction_file: 'marketing-growth-hacker.md' },
  { id: 'marketing-app-store-optimizer', name: 'App Store Optimizer', title: 'ASO y discoverability', department: 'marketing', capabilities: 'aso-optimization, keyword-research, review-management', skills: '', instruction_file: 'marketing-app-store-optimizer.md' },
  { id: 'specialized-developer-advocate', name: 'Developer Advocate', title: 'Comunidad de devs, DX', department: 'marketing', capabilities: 'developer-community, technical-content, dx-optimization', skills: '', instruction_file: 'specialized-developer-advocate.md' },
  { id: 'marketing-xiaohongshu-specialist', name: 'Xiaohongshu Specialist', title: 'Marketing lifestyle', department: 'marketing', capabilities: 'lifestyle-content, trend-driven-strategy', skills: '', instruction_file: 'marketing-xiaohongshu-specialist.md' },
  { id: 'marketing-wechat-official-account', name: 'WeChat Manager', title: 'WeChat OA', department: 'marketing', capabilities: 'wechat-content, subscriber-engagement', skills: '', instruction_file: 'marketing-wechat-official-account.md' },
  { id: 'marketing-zhihu-strategist', name: 'Zhihu Strategist', title: 'Autoridad en Zhihu', department: 'marketing', capabilities: 'knowledge-marketing, qa-strategy', skills: '', instruction_file: 'marketing-zhihu-strategist.md' },
  { id: 'marketing-reddit-community-builder', name: 'Reddit Community Builder', title: 'Engagement en Reddit', department: 'marketing', capabilities: 'community-engagement, reddit-culture', skills: '', instruction_file: 'marketing-reddit-community-builder.md' },

  // ENGINEERING
  { id: 'engineering-frontend-developer', name: 'Frontend Developer', title: 'React/Vue, responsive, PWA', department: 'engineering', capabilities: 'modern-web-apps, responsive-design, performance-optimization', skills: 'landing-page, page-cro', instruction_file: 'engineering-frontend-developer.md' },
  { id: 'engineering-backend-architect', name: 'Backend Architect', title: 'Scalable systems, APIs', department: 'engineering', capabilities: 'system-design, database-architecture, api-design', skills: 'seo-audit, schema-markup', instruction_file: 'engineering-backend-architect.md' },
  { id: 'engineering-senior-developer', name: 'Senior Developer', title: 'Laravel/Livewire, Three.js', department: 'engineering', capabilities: 'laravel-livewire-fluxui, advanced-css, three-js', skills: '', instruction_file: 'engineering-senior-developer.md' },
  { id: 'engineering-rapid-prototyper', name: 'Rapid Prototyper', title: 'MVPs, proof-of-concept', department: 'engineering', capabilities: 'mvp-development, rapid-iteration', skills: '', instruction_file: 'engineering-rapid-prototyper.md' },
  { id: 'engineering-security-engineer', name: 'Security Engineer', title: 'Threat modeling, OWASP', department: 'engineering', capabilities: 'threat-modeling, vulnerability-assessment, secure-code-review', skills: '', instruction_file: 'engineering-security-engineer.md' },
  { id: 'engineering-devops-automator', name: 'DevOps Automator', title: 'CI/CD, cloud ops', department: 'engineering', capabilities: 'ci-cd-pipelines, cloud-infrastructure, containerization', skills: '', instruction_file: 'engineering-devops-automator.md' },
  { id: 'engineering-mobile-app-builder', name: 'Mobile App Builder', title: 'iOS/Android, Flutter', department: 'engineering', capabilities: 'native-ios-android, react-native, flutter', skills: '', instruction_file: 'engineering-mobile-app-builder.md' },
  { id: 'engineering-ai-engineer', name: 'AI Engineer', title: 'ML, Claude API', department: 'engineering', capabilities: 'ml-models, claude-api-integration, ai-features', skills: '', instruction_file: 'engineering-ai-engineer.md' },
  { id: 'engineering-technical-writer', name: 'Technical Writer', title: 'Docs, API references', department: 'engineering', capabilities: 'developer-docs, api-references, tutorials', skills: '', instruction_file: 'engineering-technical-writer.md' },
  { id: 'engineering-data-engineer', name: 'Data Engineer', title: 'ETL/ELT, Spark, dbt', department: 'engineering', capabilities: 'etl-elt-pipelines, apache-spark, dbt', skills: '', instruction_file: 'engineering-data-engineer.md' },
  { id: 'agentic-identity-trust', name: 'Identity & Trust Architect', title: 'Identidad para agentes autonomos', department: 'engineering', capabilities: 'identity-systems, trust-verification, audit-trails', skills: '', instruction_file: 'agentic-identity-trust.md' },
  { id: 'engineering-autonomous-optimization-architect', name: 'Autonomous Optimizer', title: 'Shadow-testing, guardrails', department: 'engineering', capabilities: 'api-shadow-testing, cost-guardrails', skills: '', instruction_file: 'engineering-autonomous-optimization-architect.md' },
  { id: 'lsp-index-engineer', name: 'LSP Index Engineer', title: 'LSP, code intelligence', department: 'engineering', capabilities: 'lsp-orchestration, semantic-indexing', skills: '', instruction_file: 'lsp-index-engineer.md' },
  { id: 'xr-immersive-developer', name: 'XR Immersive Dev', title: 'WebXR, browser AR/VR', department: 'engineering', capabilities: 'webxr, browser-ar-vr', skills: '', instruction_file: 'xr-immersive-developer.md' },
  { id: 'xr-interface-architect', name: 'XR Interface Architect', title: 'Spatial interaction design', department: 'engineering', capabilities: 'spatial-design, xr-interaction', skills: '', instruction_file: 'xr-interface-architect.md' },
  { id: 'xr-cockpit-interaction-specialist', name: 'XR Cockpit Specialist', title: 'Cockpit control XR', department: 'engineering', capabilities: 'cockpit-design, xr-controls', skills: '', instruction_file: 'xr-cockpit-interaction-specialist.md' },
  { id: 'visionos-spatial-engineer', name: 'visionOS Engineer', title: 'visionOS, SwiftUI volumetric', department: 'engineering', capabilities: 'visionos, swiftui-volumetric', skills: '', instruction_file: 'visionos-spatial-engineer.md' },
  { id: 'macos-spatial-metal-engineer', name: 'macOS Metal Engineer', title: 'Metal, 3D rendering', department: 'engineering', capabilities: 'metal-api, 3d-rendering', skills: '', instruction_file: 'macos-spatial-metal-engineer.md' },
  { id: 'terminal-integration-specialist', name: 'Terminal Specialist', title: 'Terminal emulation, SwiftTerm', department: 'engineering', capabilities: 'terminal-emulation, text-rendering', skills: '', instruction_file: 'terminal-integration-specialist.md' },

  // QA
  { id: 'testing-reality-checker', name: 'Reality Checker', title: 'Default: NEEDS WORK', department: 'qa', capabilities: 'integration-testing, evidence-validation, fantasy-detection', skills: '', instruction_file: 'testing-reality-checker.md' },
  { id: 'testing-accessibility-auditor', name: 'Accessibility Auditor', title: 'WCAG, inclusive design', department: 'qa', capabilities: 'wcag-audit, screen-reader-testing, a11y-compliance', skills: '', instruction_file: 'testing-accessibility-auditor.md' },
  { id: 'testing-performance-benchmarker', name: 'Performance Benchmarker', title: 'Core Web Vitals, load testing', department: 'qa', capabilities: 'performance-testing, core-web-vitals, load-testing', skills: '', instruction_file: 'testing-performance-benchmarker.md' },
  { id: 'testing-api-tester', name: 'API Tester', title: 'API validation, security', department: 'qa', capabilities: 'api-validation, contract-testing, security-testing', skills: '', instruction_file: 'testing-api-tester.md' },
  { id: 'testing-tool-evaluator', name: 'Tool Evaluator', title: 'Tool assessment', department: 'qa', capabilities: 'tool-assessment, platform-evaluation', skills: '', instruction_file: 'testing-tool-evaluator.md' },
  { id: 'testing-workflow-optimizer', name: 'Workflow Optimizer', title: 'Process automation', department: 'qa', capabilities: 'process-analysis, bottleneck-detection', skills: '', instruction_file: 'testing-workflow-optimizer.md' },
  { id: 'testing-test-results-analyzer', name: 'Test Results Analyzer', title: 'Quality metrics, A/B analysis', department: 'qa', capabilities: 'test-evaluation, quality-metrics', skills: 'ab-test-setup', instruction_file: 'testing-test-results-analyzer.md' },
  { id: 'testing-evidence-collector', name: 'Evidence Collector', title: 'Screenshots, visual proof', department: 'qa', capabilities: 'visual-evidence, screenshot-capture, bug-documentation', skills: '', instruction_file: 'testing-evidence-collector.md' },

  // ANALYTICS
  { id: 'support-analytics-reporter', name: 'Analytics Reporter', title: 'Dashboards, GA4, KPIs', department: 'analytics', capabilities: 'dashboards, statistical-analysis, data-visualization', skills: 'analytics-tracking, revops', instruction_file: 'support-analytics-reporter.md' },
  { id: 'sales-data-extraction-agent', name: 'Sales Data Extractor', title: 'Excel monitoring, MTD/YTD', department: 'analytics', capabilities: 'excel-monitoring, sales-metrics, pipeline-analysis', skills: '', instruction_file: 'sales-data-extraction-agent.md' },
  { id: 'data-consolidation-agent', name: 'Data Consolidator', title: 'Live dashboards consolidation', department: 'analytics', capabilities: 'data-consolidation, live-dashboards', skills: '', instruction_file: 'data-consolidation-agent.md' },
  { id: 'report-distribution-agent', name: 'Report Distributor', title: 'Automated report distribution', department: 'analytics', capabilities: 'automated-distribution, territorial-routing', skills: '', instruction_file: 'report-distribution-agent.md' },
  { id: 'data-analytics-reporter', name: 'Data Analytics Reporter', title: 'Raw data to insights', department: 'analytics', capabilities: 'data-analysis, dashboards, kpi-tracking', skills: '', instruction_file: 'data-analytics-reporter.md' },

  // PRODUCT
  { id: 'product-sprint-prioritizer', name: 'Sprint Prioritizer', title: 'RICE/MoSCoW/Kano, pricing', department: 'product', capabilities: 'rice-moscow-kano, sprint-planning', skills: 'pricing-strategy', instruction_file: 'product-sprint-prioritizer.md' },
  { id: 'product-behavioral-nudge-engine', name: 'Behavioral Nudge Engine', title: 'Behavioral psychology, retention', department: 'product', capabilities: 'behavioral-psychology, user-motivation', skills: 'churn-prevention, onboarding-cro', instruction_file: 'product-behavioral-nudge-engine.md' },
  { id: 'product-trend-researcher', name: 'Trend Researcher', title: 'Market intelligence, trends', department: 'product', capabilities: 'market-research, trend-analysis, competitive-intelligence', skills: 'competitor-alternatives', instruction_file: 'product-trend-researcher.md' },
  { id: 'product-feedback-synthesizer', name: 'Feedback Synthesizer', title: 'Multi-channel feedback to insights', department: 'product', capabilities: 'feedback-collection, sentiment-analysis', skills: '', instruction_file: 'product-feedback-synthesizer.md' },
  { id: 'specialized-cultural-intelligence-strategist', name: 'Cultural Intelligence', title: 'Global inclusion, CQ', department: 'product', capabilities: 'cultural-analysis, bias-detection, global-context', skills: '', instruction_file: 'specialized-cultural-intelligence-strategist.md' },

  // PRODUCTION
  { id: 'project-management-studio-producer', name: 'Studio Producer', title: 'Portfolio orchestration', department: 'production', capabilities: 'portfolio-management, creative-vision-alignment', skills: 'launch-strategy', instruction_file: 'project-management-studio-producer.md' },
  { id: 'project-management-project-shepherd', name: 'Project Shepherd', title: 'Cross-functional coordination', department: 'production', capabilities: 'cross-functional-coordination, timeline-management', skills: '', instruction_file: 'project-management-project-shepherd.md' },
  { id: 'project-management-studio-operations', name: 'Studio Operations', title: 'Daily operations, processes', department: 'production', capabilities: 'daily-operations, process-optimization', skills: '', instruction_file: 'project-management-studio-operations.md' },
  { id: 'project-management-experiment-tracker', name: 'Experiment Tracker', title: 'A/B tests, hypothesis validation', department: 'production', capabilities: 'experiment-design, ab-testing', skills: 'ab-test-setup', instruction_file: 'project-management-experiment-tracker.md' },
  { id: 'project-manager-senior', name: 'Senior PM', title: 'Specs, scope control', department: 'production', capabilities: 'spec-to-tasks, realistic-scope', skills: '', instruction_file: 'project-manager-senior.md' },

  // SUPPORT
  { id: 'support-legal-compliance-checker', name: 'Legal & Compliance', title: 'GDPR/CCPA, contracts', department: 'support', capabilities: 'gdpr-ccpa-hipaa, risk-assessment, privacy-policies', skills: '', instruction_file: 'support-legal-compliance-checker.md' },
  { id: 'support-finance-tracker', name: 'Finance Tracker', title: 'P&L, cash flow, budgeting', department: 'support', capabilities: 'budgeting, cash-flow-management, financial-reporting', skills: '', instruction_file: 'support-finance-tracker.md' },
  { id: 'support-infrastructure-maintainer', name: 'Infrastructure Maintainer', title: 'System reliability, monitoring', department: 'support', capabilities: 'system-reliability, performance-optimization, monitoring', skills: '', instruction_file: 'support-infrastructure-maintainer.md' },
  { id: 'support-executive-summary-generator', name: 'Executive Summary Gen', title: 'McKinsey SCQA, BCG Pyramid', department: 'support', capabilities: 'scqa-framework, pyramid-principle', skills: 'sales-enablement', instruction_file: 'support-executive-summary-generator.md' },
  { id: 'support-support-responder', name: 'Support Responder', title: 'Multi-channel customer support', department: 'support', capabilities: 'multi-channel-support, issue-resolution', skills: '', instruction_file: 'support-support-responder.md' },
];

const ROUTINES = [
  { agent_id: 'marketing-content-creator', title: 'Calendario de contenido semanal', description: 'Crear plan de contenido: posts, stories, reels.', cron_expression: '0 9 * * 1', schedule_label: 'Lunes 9:00' },
  { agent_id: 'product-trend-researcher', title: 'Research de tendencias', description: 'Tendencias emergentes LATAM.', cron_expression: '0 8 * * 2,4', schedule_label: 'Mar/Jue 8:00' },
  { agent_id: 'support-analytics-reporter', title: 'Revision de metricas', description: 'Engagement, alcance, conversiones.', cron_expression: '0 10 * * 3', schedule_label: 'Mie 10:00' },
  { agent_id: 'testing-reality-checker', title: 'QA de entregables', description: 'Tickets done sin QA. Default: NEEDS WORK.', cron_expression: '0 16 * * 1-5', schedule_label: 'L-V 16:00' },
  { agent_id: 'design-brand-guardian', title: 'Auditoria de marca', description: 'Revisar contra brand guidelines.', cron_expression: '0 14 * * 5', schedule_label: 'Vie 14:00' },
  { agent_id: 'support-executive-summary-generator', title: 'Resumen ejecutivo semanal', description: 'Consolidar proyectos, metricas, bloqueadores.', cron_expression: '0 18 * * 5', schedule_label: 'Vie 18:00' },
  { agent_id: 'support-finance-tracker', title: 'Reporte financiero mensual', description: 'P&L, costos, tokens consumidos.', cron_expression: '0 9 1 * *', schedule_label: '1ero/mes 9:00' },
  { agent_id: 'support-infrastructure-maintainer', title: 'Health check infraestructura', description: 'Supabase, Netlify, MCPs, APIs.', cron_expression: '0 7 * * 1-5', schedule_label: 'L-V 7:00' },
  { agent_id: 'testing-workflow-optimizer', title: 'Optimizacion de workflows', description: 'Tiempos, cuellos de botella, automatizacion.', cron_expression: '0 11 * * 5', schedule_label: 'Vie 11:00' },
];

async function main() {
  console.log('Seeding PVB Master Brain...\n');

  // Upsert agents
  console.log(`Inserting ${AGENTS.length} agents...`);
  const { error: agentsError } = await supabase
    .from('brain_agents')
    .upsert(AGENTS, { onConflict: 'id' });

  if (agentsError) {
    console.error('Error inserting agents:', agentsError.message);
    process.exit(1);
  }
  console.log(`  ${AGENTS.length} agents seeded\n`);

  // Insert routines
  console.log(`Inserting ${ROUTINES.length} routines...`);
  const { error: routinesError } = await supabase
    .from('brain_routines')
    .upsert(ROUTINES, { onConflict: 'id', ignoreDuplicates: true });

  // Routines might not have onConflict, so insert if not exists
  if (routinesError) {
    // Try insert ignoring duplicates
    for (const r of ROUTINES) {
      const { error } = await supabase.from('brain_routines').insert(r);
      if (error && !error.message.includes('duplicate')) {
        console.error(`  Error: ${r.title}: ${error.message}`);
      } else {
        console.log(`  ${r.title}`);
      }
    }
  } else {
    console.log(`  ${ROUTINES.length} routines seeded`);
  }

  // Audit log entry
  await supabase.from('brain_audit_log').insert({
    action_type: 'system',
    entity_type: 'seed',
    details: { agents: AGENTS.length, routines: ROUTINES.length, timestamp: new Date().toISOString() },
  });

  console.log('\nDone! PVB Master Brain is seeded.');
  console.log(`  Agents: ${AGENTS.length}`);
  console.log(`  Routines: ${ROUTINES.length}`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
