import { readFileSync } from 'fs';
import { resolve } from 'path';
import puppeteer from 'puppeteer';
import { AppError } from '../../shared/middleware/error-handler.js';
import { prisma } from '../../shared/db.js';
import * as auditRepo from '../audit/repository.js';

const REQUIRED_AUDIT_TYPES = ['financial', 'time', 'skills', 'risk', 'horizon'] as const;

function loadTemplate(): string {
  return readFileSync(resolve(__dirname, 'template.html'), 'utf-8');
}

function renderStrategiesHtml(strategies: Array<{ name: string; description: string; fitScore: number }>): string {
  if (strategies.length === 0) return '<li>No strategies generated yet.</li>';
  return strategies
    .map(
      (s) => `
      <li>
        <div class="strategy-name">${escapeHtml(s.name)}</div>
        <div class="strategy-description">${escapeHtml(s.description)}</div>
        <span class="strategy-score">${s.fitScore}% fit</span>
      </li>`,
    )
    .join('');
}

function renderInsightsHtml(insights: string[]): string {
  if (insights.length === 0) return '<li>No insights available.</li>';
  return insights.map((i) => `<li>${escapeHtml(i)}</li>`).join('');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateRadarSvg(radarData: Record<string, number>): string {
  const dimensions = Object.entries(radarData);
  const count = dimensions.length;
  if (count === 0) return '<p>No radar data available.</p>';

  const size = 300;
  const center = size / 2;
  const radius = 120;
  const angleStep = (2 * Math.PI) / count;

  // Build polygon points for the data
  const dataPoints = dimensions.map(([, value], i) => {
    const angle = angleStep * i - Math.PI / 2;
    const r = (value / 100) * radius;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  });

  // Build labels
  const labels = dimensions.map(([key], i) => {
    const angle = angleStep * i - Math.PI / 2;
    const labelR = radius + 24;
    const x = center + labelR * Math.cos(angle);
    const y = center + labelR * Math.sin(angle);
    return `<text x="${x}" y="${y}" text-anchor="middle" font-size="11" fill="#555">${key.replace(/_/g, ' ')}</text>`;
  });

  // Build grid circles
  const gridCircles = [0.25, 0.5, 0.75, 1.0]
    .map((pct) => `<circle cx="${center}" cy="${center}" r="${radius * pct}" fill="none" stroke="#E0E0E8" stroke-width="1"/>`)
    .join('');

  // Build axis lines
  const axisLines = dimensions
    .map((_, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const x2 = center + radius * Math.cos(angle);
      const y2 = center + radius * Math.sin(angle);
      return `<line x1="${center}" y1="${center}" x2="${x2}" y2="${y2}" stroke="#E0E0E8" stroke-width="1"/>`;
    })
    .join('');

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    ${gridCircles}
    ${axisLines}
    <polygon points="${dataPoints.join(' ')}" fill="rgba(26,26,46,0.15)" stroke="#1A1A2E" stroke-width="2"/>
    ${labels.join('')}
  </svg>`;
}

export async function generateBlueprint(userId: number, tenantId: number): Promise<Buffer> {
  // Validate all 5 audits completed (uses DISTINCT ON to avoid over-fetching all versions)
  const completedAudits = await auditRepo.getCompletedAuditsForSynthesis(userId, tenantId);

  const completedTypes = new Set(completedAudits.map((a) => a.auditType));
  const missingTypes = REQUIRED_AUDIT_TYPES.filter((t) => !completedTypes.has(t));

  if (missingTypes.length > 0) {
    throw new AppError(
      'VALIDATION_ERROR',
      `All 5 audits must be completed before generating a blueprint. Missing: ${missingTypes.join(', ')}.`,
      400,
    );
  }

  // Get latest identity version
  const identity = await prisma.identityVersion.findFirst({
    where: { userId, tenantId },
    orderBy: { version: 'desc' },
  });

  if (!identity) {
    throw new AppError(
      'VALIDATION_ERROR',
      'No identity profile found. Synthesize your identity before generating a blueprint.',
      400,
    );
  }

  // Get strategies for this identity version
  const strategies = await prisma.strategy.findMany({
    where: { userId, tenantId, identityVersionId: identity.id },
    orderBy: { rank: 'asc' },
  });

  // Build HTML
  const template = loadTemplate();
  const radarData = identity.radarData as Record<string, number>;
  const aiInsights = identity.aiInsights as Record<string, unknown>;
  const insightStrings: string[] = [];

  if (aiInsights && typeof aiInsights === 'object') {
    // Extract top-level string arrays or headline
    if (identity.headlineInsight) {
      insightStrings.push(identity.headlineInsight);
    }
    for (const [, value] of Object.entries(aiInsights)) {
      if (typeof value === 'string') {
        insightStrings.push(value);
      } else if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'string') insightStrings.push(item);
        }
      }
    }
  }

  const html = template
    .replace('{{archetype}}', escapeHtml(identity.archetype))
    .replace('{{readinessScore}}', String(identity.readinessScore))
    .replace('{{radarSvg}}', generateRadarSvg(radarData))
    .replace(
      '{{strategies}}',
      renderStrategiesHtml(
        strategies.map((s) => ({
          name: s.name,
          description: s.description,
          fitScore: s.fitScore,
        })),
      ),
    )
    .replace('{{insights}}', renderInsightsHtml(insightStrings));

  // Generate PDF via Puppeteer
  // TODO: In production, use a browser pool (e.g. puppeteer-cluster) to avoid
  // launching a new browser process per request. Acceptable for MVP.
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
