import { Response } from 'express';
import archiver from 'archiver';
import { logger } from '../../shared/logger.js';
import { decryptField } from '../../shared/encryption/field-encryption.js';
import { callClaudeWithRetry } from '../../shared/ai/retry.js';
import { loadActiveTemplate, assemblePrompt } from '../../shared/ai/prompt-loader.js';
import * as growthRepo from './repository.js';
import type {
  ActionItem,
  PortfolioContent,
  IncomeCapitalContent,
  SkillsKnowledgeContent,
  TimeOperationsContent,
  PathContent,
} from './types.js';

// --- Types ---

interface IdentityData {
  publicId: string;
  version: number;
  archetype: string;
  readinessScore: number;
  subScores: Record<string, number> | null;
  headlineInsight: string | null;
  createdAt: Date;
}

interface StrategyData {
  publicId: string;
  status: string;
  overallProgress: number;
  growthScore: number;
  createdAt: Date;
}

interface PathData {
  publicId: string;
  pathType: string;
  status: string;
  version: number;
  progress: number;
  summary: string | null;
  content: PathContent | Record<string, never> | null;
  actionItems: ActionItem[];
  generatedAt: Date | null;
}

interface ExportFile {
  name: string;
  content: string;
}

// --- Path name formatting ---

const PATH_NAMES: Record<string, string> = {
  portfolio: 'Portfolio Growth',
  income_capital: 'Income & Capital',
  skills_knowledge: 'Skills & Knowledge',
  time_operations: 'Time & Operations',
};

function formatPathName(pathType: string): string {
  return PATH_NAMES[pathType] || pathType;
}

function toIso(date: Date | null | undefined): string {
  return date ? date.toISOString() : 'N/A';
}

// --- Render functions ---

/**
 * Generate the entry-point markdown file with YAML frontmatter and a narrative summary.
 */
export function renderEntryPoint(
  identity: IdentityData,
  strategy: StrategyData,
  narrativeSummary: string,
): string {
  const now = new Date().toISOString();
  return `---
type: entry-point
generated_at: "${now}"
identity_version: ${identity.version}
archetype: "${identity.archetype}"
readiness_score: ${identity.readinessScore}
strategy_progress: ${strategy.overallProgress}
growth_score: ${strategy.growthScore}
---

# InvestorOS Growth Strategy Export

${narrativeSummary}

## Quick Reference

| Attribute | Value |
|-----------|-------|
| Archetype | ${identity.archetype} |
| Readiness Score | ${identity.readinessScore}/100 |
| Strategy Progress | ${strategy.overallProgress}% |
| Growth Score | ${strategy.growthScore} |
| Identity Version | v${identity.version} |
| Generated | ${now} |

## Files in This Export

- \`00-entry-point.md\` — This file (start here)
- \`01-identity.md\` — Your investor identity profile
- \`02-strategy-overview.md\` — Growth strategy summary
- \`03-portfolio-growth.md\` — Portfolio Growth path
- \`04-income-capital.md\` — Income & Capital path
- \`05-action-plan.md\` — Priority-ordered action items
`;
}

/**
 * Render identity data as markdown with YAML frontmatter.
 */
export function renderIdentityDetail(identity: IdentityData): string {
  const dimensions = identity.subScores ?? {};
  const dimensionRows = Object.entries(dimensions)
    .map(([dim, score]) => `| ${dim} | ${score}/100 |`)
    .join('\n');

  return `---
type: identity
version: ${identity.version}
archetype: "${identity.archetype}"
readiness_score: ${identity.readinessScore}
generated_at: "${toIso(identity.createdAt)}"
---

# Investor Identity Profile

**Archetype:** ${identity.archetype}
**Readiness Score:** ${identity.readinessScore}/100
**Version:** ${identity.version}

## Dimension Scores

| Dimension | Score |
|-----------|-------|
${dimensionRows || '| No dimension data available | - |'}

## Synthesis Narrative

${identity.headlineInsight || '*No synthesis narrative available.*'}
`;
}

/**
 * Render growth strategy overview.
 */
export function renderStrategyOverview(strategy: StrategyData, paths: PathData[]): string {
  const pathRows = paths
    .map((p) => {
      const statusIcon = p.status === 'generated' ? '[x]' : p.status === 'locked' ? '[ ]' : '[-]';
      return `| ${statusIcon} | ${formatPathName(p.pathType)} | ${p.status} | ${p.progress}% | v${p.version} |`;
    })
    .join('\n');

  return `---
type: strategy-overview
status: "${strategy.status}"
overall_progress: ${strategy.overallProgress}
growth_score: ${strategy.growthScore}
generated_at: "${toIso(strategy.createdAt)}"
---

# Growth Strategy Overview

**Status:** ${strategy.status}
**Overall Progress:** ${strategy.overallProgress}%
**Growth Score:** ${strategy.growthScore}

## Growth Paths

| Done | Path | Status | Progress | Version |
|------|------|--------|----------|---------|
${pathRows}
`;
}

/**
 * Render individual path content as markdown.
 * For income_capital paths, decrypts sensitive financial data.
 * If decryption fails, excludes the path content and logs a warning.
 */
export function renderPathFile(path: PathData): string {
  const header = `---
type: path
path_type: "${path.pathType}"
status: "${path.status}"
version: ${path.version}
progress: ${path.progress}
generated_at: "${toIso(path.generatedAt)}"
---

# ${formatPathName(path.pathType)}

**Status:** ${path.status}
**Progress:** ${path.progress}%
**Version:** ${path.version}

`;

  if (path.status !== 'generated' || !path.content || 'coming_soon' in path.content) {
    return header + `*This path has not been generated yet.*\n`;
  }

  const summarySection = path.summary ? `## Summary\n\n${path.summary}\n\n` : '';

  try {
    const contentSection = renderPathContent(path.pathType, path.content);
    const actionSection = renderPathActions(path.actionItems);

    return header + summarySection + contentSection + actionSection;
  } catch (err) {
    logger.warn({ err, pathType: path.pathType }, 'Failed to render path content (possible decryption failure)');
    return header + `*Path content could not be rendered. This may be due to a decryption error with sensitive financial data.*\n`;
  }
}

function renderPathContent(pathType: string, content: PathContent | Record<string, never>): string {
  switch (pathType) {
    case 'portfolio':
      return renderPortfolioContent(content as PortfolioContent);
    case 'income_capital':
      return renderIncomeCapitalContent(content as IncomeCapitalContent);
    case 'skills_knowledge':
      return renderSkillsKnowledgeContent(content as SkillsKnowledgeContent);
    case 'time_operations':
      return renderTimeOperationsContent(content as TimeOperationsContent);
    default:
      return `## Content\n\n*Unsupported path type.*\n\n`;
  }
}

function renderPortfolioContent(c: PortfolioContent): string {
  let md = `## Scaling Plan\n\n`;
  if (c.scaling_plan) {
    md += `- **Year 1:** ${c.scaling_plan.year_1_vision}\n`;
    md += `- **Year 3:** ${c.scaling_plan.year_3_vision}\n`;
    md += `- **Year 5:** ${c.scaling_plan.year_5_vision}\n`;
    md += `- **Year 10:** ${c.scaling_plan.year_10_vision}\n`;
  }

  md += `\n## Reinvestment Strategy\n\n${c.reinvestment_strategy || 'N/A'}\n`;
  md += `\n## Diversification Plan\n\n${c.diversification_plan || 'N/A'}\n`;
  md += `\n## Exit Framework\n\n${c.exit_framework || 'N/A'}\n`;
  md += `\n## Financing Evolution\n\n${c.financing_evolution || 'N/A'}\n`;

  return md + '\n';
}

function renderIncomeCapitalContent(c: IncomeCapitalContent): string {
  let md = `## Capital Acceleration Plan\n\n${tryDecrypt(c.capital_acceleration_plan)}\n`;
  md += `\n## Income Growth Roadmap\n\n${tryDecrypt(c.income_growth_roadmap)}\n`;

  if (c.funding_channel_map?.length) {
    md += `\n## Funding Channels\n\n`;
    md += `| Channel | Rank | Description | Requirements |\n`;
    md += `|---------|------|-------------|--------------|\n`;
    for (const ch of c.funding_channel_map) {
      md += `| ${tryDecrypt(ch.channel)} | ${ch.accessibility_rank} | ${tryDecrypt(ch.description)} | ${tryDecrypt(ch.requirements)} |\n`;
    }
  }

  if (c.professional_transition_plan) {
    md += `\n## Professional Transition Plan\n\n${tryDecrypt(c.professional_transition_plan)}\n`;
  }

  if (c.capital_milestone_targets?.length) {
    md += `\n## Capital Milestones\n\n`;
    md += `| Milestone | Target | Timeline | Portfolio Link |\n`;
    md += `|-----------|--------|----------|----------------|\n`;
    for (const m of c.capital_milestone_targets) {
      md += `| ${tryDecrypt(m.milestone)} | ${tryDecrypt(m.target_amount)} | ${m.timeline} | ${m.portfolio_phase_link} |\n`;
    }
  }

  return md + '\n';
}

function renderSkillsKnowledgeContent(c: SkillsKnowledgeContent): string {
  let md = `## Learning Roadmap\n\n${c.learning_roadmap || 'N/A'}\n`;

  if (c.skill_gap_analysis?.length) {
    md += `\n## Skill Gap Analysis\n\n`;
    md += `| Skill | Current | Target | Priority | Portfolio Link |\n`;
    md += `|-------|---------|--------|----------|----------------|\n`;
    for (const sg of c.skill_gap_analysis) {
      md += `| ${sg.skill} | ${sg.current_level} | ${sg.target_level} | ${sg.priority_rank} | ${sg.portfolio_phase_link} |\n`;
    }
  }

  if (c.resource_recommendations?.length) {
    md += `\n## Recommended Resources\n\n`;
    for (const r of c.resource_recommendations) {
      const link = r.url ? ` — [Link](${r.url})` : '';
      md += `- **${r.name}** (${r.type})${link}: ${r.relevance}\n`;
    }
  }

  md += `\n## Network Building\n\n${c.network_building_plan || 'N/A'}\n`;
  md += `\n## Mentorship Strategy\n\n${c.mentorship_strategy || 'N/A'}\n`;

  if (c.certification_roadmap) {
    md += `\n## Certification Roadmap\n\n${c.certification_roadmap}\n`;
  }

  return md + '\n';
}

function renderTimeOperationsContent(c: TimeOperationsContent): string {
  let md = '';

  if (c.time_audit_reality_check) {
    const ta = c.time_audit_reality_check;
    md += `## Time Audit Reality Check\n\n`;
    md += `- **Stated Hours:** ${ta.stated_hours}h/week\n`;
    md += `- **Estimated Actual:** ${ta.estimated_actual_hours}h/week\n`;
    md += `- **Gap Analysis:** ${ta.gap_analysis}\n`;
  }

  md += `\n## Time Recapture Plan\n\n${c.time_recapture_plan || 'N/A'}\n`;
  md += `\n## Delegation Roadmap\n\n${c.delegation_roadmap || 'N/A'}\n`;
  md += `\n## Systems & Tools Plan\n\n${c.systems_and_tools_plan || 'N/A'}\n`;
  md += `\n## Active-to-Passive Transition\n\n${c.active_to_passive_transition || 'N/A'}\n`;
  md += `\n## Burnout Prevention\n\n${c.burnout_prevention || 'N/A'}\n`;

  return md + '\n';
}

/**
 * Attempt to decrypt a field value. If the value looks encrypted (v\d:...),
 * try decryption. On failure, throw to trigger the path-level error handler.
 */
function tryDecrypt(value: string | null | undefined): string {
  if (!value) return 'N/A';
  if (/^v\d+:/.test(value)) {
    return decryptField(value);
  }
  return value;
}

function renderPathActions(actionItems: ActionItem[]): string {
  if (!actionItems.length) return '';

  let md = `## Action Items\n\n`;
  const sorted = [...actionItems].sort((a, b) => b.priority_score - a.priority_score);

  for (const item of sorted) {
    const check = item.is_completed ? '[x]' : '[ ]';
    md += `- ${check} **${item.title}** (Priority: ${item.priority_score})\n`;
    md += `  ${item.description}\n`;
    md += `  *Timeframe:* ${item.timeframe} | *Category:* ${item.category}\n`;
    if (item.identity_impact) {
      md += `  *Identity Impact:* ${item.identity_impact}\n`;
    }
    md += '\n';
  }

  return md;
}

/**
 * Render a priority-ordered action plan across all paths.
 */
export function renderActionPlan(paths: PathData[]): string {
  const allItems: Array<ActionItem & { pathType: string }> = [];

  for (const path of paths) {
    if (path.status !== 'generated' || !path.actionItems?.length) continue;
    for (const item of path.actionItems) {
      allItems.push({ ...item, pathType: path.pathType });
    }
  }

  allItems.sort((a, b) => b.priority_score - a.priority_score);

  const completedCount = allItems.filter((i) => i.is_completed).length;
  const now = new Date().toISOString();

  let md = `---
type: action-plan
total_items: ${allItems.length}
completed_items: ${completedCount}
generated_at: "${now}"
---

# Action Plan

**Total Items:** ${allItems.length}
**Completed:** ${completedCount}/${allItems.length}

`;

  if (!allItems.length) {
    return md + '*No action items available yet. Generate growth paths to see action items.*\n';
  }

  // Group by completion status
  const pending = allItems.filter((i) => !i.is_completed);
  const completed = allItems.filter((i) => i.is_completed);

  if (pending.length) {
    md += `## Pending (${pending.length})\n\n`;
    for (const item of pending) {
      md += `### ${item.title}\n\n`;
      md += `- **Path:** ${formatPathName(item.pathType)}\n`;
      md += `- **Priority:** ${item.priority_score}\n`;
      md += `- **Timeframe:** ${item.timeframe}\n`;
      md += `- **Category:** ${item.category}\n`;
      md += `- **Identity Impact:** ${item.identity_impact}\n\n`;
      md += `${item.description}\n\n`;
    }
  }

  if (completed.length) {
    md += `## Completed (${completed.length})\n\n`;
    for (const item of completed) {
      md += `- ~~${item.title}~~ (${formatPathName(item.pathType)}) — completed ${item.completed_at ?? 'N/A'}\n`;
    }
    md += '\n';
  }

  return md;
}

/**
 * Generate a lightweight AI narrative summary for the export entry point.
 * Uses ~200 input + ~150 output tokens.
 */
export async function generateExportSummary(
  tenantId: number,
  userId: number,
  identity: IdentityData,
): Promise<string> {
  try {
    const template = await loadActiveTemplate('insight');

    const systemPrompt = 'You are an investment advisor writing a brief summary for an investor export document. Be encouraging but realistic. Respond with plain text only — no markdown.';
    const userContent = `Write a single concise paragraph (3-4 sentences) summarizing this investor's growth strategy export. The investor is a "${identity.archetype}" archetype with a readiness score of ${identity.readinessScore}/100, identity version ${identity.version}. This paragraph will introduce their exported strategy document.`;

    const result = await callClaudeWithRetry({
      tenantId,
      userId,
      serviceType: 'insight',
      promptTemplateId: template.id,
      systemPrompt,
      userContent,
      timeoutMs: 90_000,
    });

    return result.content.trim();
  } catch (err) {
    logger.warn({ err }, 'Failed to generate export summary, using fallback');
    return `This export contains your complete investor identity profile and growth strategy as a ${identity.archetype} with a readiness score of ${identity.readinessScore}/100. Review each section to track your progress and identify your next best actions.`;
  }
}

/**
 * Assemble files into a zip archive and stream to Express response.
 */
export function assembleZip(files: ExportFile[], res: Response): Promise<void> {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="investoros-growth-strategy.zip"');

    archive.on('error', (err) => {
      logger.error({ err }, 'Zip archive error');
      reject(err);
    });

    archive.on('end', () => {
      resolve();
    });

    archive.pipe(res);

    for (const file of files) {
      archive.append(file.content, { name: file.name });
    }

    archive.finalize();
  });
}

/**
 * Compare current identity version and path versions against last export record.
 * Returns staleness info for the export status endpoint.
 */
export async function checkExportFreshness(
  userId: number,
  tenantId: number,
): Promise<{
  has_exported: boolean;
  last_export_at: string | null;
  is_stale: boolean;
  changed_since_export: string[];
}> {
  const latestExport = await growthRepo.getLatestExport(userId, tenantId);

  if (!latestExport) {
    return {
      has_exported: false,
      last_export_at: null,
      is_stale: false,
      changed_since_export: [],
    };
  }

  const strategy = await growthRepo.getActiveGrowthStrategy(userId, tenantId);
  if (!strategy) {
    return {
      has_exported: true,
      last_export_at: latestExport.createdAt.toISOString(),
      is_stale: false,
      changed_since_export: [],
    };
  }

  const changedSinceExport: string[] = [];
  const exportPathVersions = (latestExport.pathVersions ?? {}) as Record<string, number>;
  const exportIdentityVersion = latestExport.identityVersion;

  // Check identity version
  if (strategy.identityVersion.version > exportIdentityVersion) {
    changedSinceExport.push(
      `Identity updated (v${exportIdentityVersion} -> v${strategy.identityVersion.version})`,
    );
  }

  // Check path versions
  for (const path of strategy.paths) {
    const exportVersion = exportPathVersions[path.pathType] ?? 0;
    if (path.version > exportVersion && path.status === 'generated') {
      changedSinceExport.push(
        `${formatPathName(path.pathType)} regenerated (v${exportVersion} -> v${path.version})`,
      );
    }
  }

  return {
    has_exported: true,
    last_export_at: latestExport.createdAt.toISOString(),
    is_stale: changedSinceExport.length > 0,
    changed_since_export: changedSinceExport,
  };
}
