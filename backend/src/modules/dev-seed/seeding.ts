/**
 * Shared by the seed CLI (scripts/seed-persona.ts) and the eval harness (scripts/eval-personas.ts):
 * create a persona user, complete its five audits, run the AI pipeline for it, collect the
 * output the assertions look at, and remove it again.
 *
 * Audits are completed with the three steps auditService.saveAudit runs on `complete: true`
 * (validation → sub-score → auditRepo.completeAudit) but without its fire-and-forget triggers,
 * so a plain seed makes no model call; `generate` runs synthesis and strategies explicitly.
 */
import { randomBytes } from 'node:crypto';
import { prisma } from '../../shared/db.js';
import { aiCallEvents, type AiCallEvent } from '../../shared/ai/client.js';
import * as authService from '../auth/service.js';
import * as authRepo from '../auth/repository.js';
import * as auditRepo from '../audit/repository.js';
import { validateCompletionRequirements } from '../audit/validation.js';
import { calculateSubScore } from '../audit/scoring.js';
import * as identityService from '../identity/service.js';
import * as strategyService from '../strategy/service.js';
import * as strategyRepo from '../strategy/repository.js';
import { AUDIT_TYPES, type PersonaFixture, type PersonaLetter } from './fixtures.js';
import type { EvalOutput } from './assertions.js';

/** users.signup_source for every seeded persona — the identifier seed:clean removes by. */
export const PERSONA_SIGNUP_SOURCE = 'persona-seed';
export const PERSONA_EMAIL_DOMAIN = 'seed.investoros.local';

export interface SeededUser {
  letter: PersonaLetter;
  userId: number;
  tenantId: number;
  publicId: string;
  email: string;
  password: string;
}

/** The scripts run without a process manager; pick up backend/.env the way `npm run dev` relies on the shell to. */
export function loadDotEnv(): void {
  if (process.env.DATABASE_URL) return;
  try {
    process.loadEnvFile('.env');
  } catch {
    /* no .env — the caller fails on the missing variable with a clear message */
  }
}

export async function createPersonaUser(letter: PersonaLetter, tag: string = Date.now().toString(36)): Promise<SeededUser> {
  const email = `persona+${letter.toLowerCase()}-${tag}@${PERSONA_EMAIL_DOMAIN}`;
  const password = `Persona-${letter}-${randomBytes(6).toString('hex')}`;
  await authService.register(email, password, PERSONA_SIGNUP_SOURCE);
  const user = await authRepo.findUserByEmail(email);
  if (!user) throw new Error(`persona user ${email} was not created`);
  // The Growth Strategy Engine queues Bull jobs (Redis) that the eval does not measure; keep it off
  // for seeded tenants regardless of GROWTH_STRATEGY_DEFAULT_ENABLED.
  await prisma.tenant.update({ where: { id: user.tenantId }, data: { featureFlags: { growth_strategy_enabled: false } } });
  return { letter, userId: user.id, tenantId: user.tenantId, publicId: user.publicId, email, password };
}

export async function completeAudits(user: SeededUser, fixture: PersonaFixture): Promise<Array<{ auditType: string; version: number; subScore: number }>> {
  const done = [];
  for (const type of AUDIT_TYPES) {
    const responses = fixture.audits[type];
    validateCompletionRequirements(type, responses);
    const subScore = calculateSubScore(type, responses);
    const audit = await auditRepo.completeAudit(user.userId, user.tenantId, type, responses, subScore);
    done.push({ auditType: type, version: audit.version, subScore });
  }
  return done;
}

/** Collects every AI call made for one user, so the harness can price them and wait for the chained ones. */
export function recordAiCalls(userId: number) {
  const calls: AiCallEvent[] = [];
  const listener = (e: AiCallEvent) => {
    if (e.userId === userId) calls.push(e);
  };
  aiCallEvents.on('call', listener);
  return {
    calls,
    stop: () => aiCallEvents.off('call', listener),
    /** Resolves with the call once seen (already recorded or arriving later); null on timeout. */
    waitFor(serviceType: AiCallEvent['serviceType'], timeoutMs: number): Promise<AiCallEvent | null> {
      const seen = calls.find((c) => c.serviceType === serviceType);
      if (seen) return Promise.resolve(seen);
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          aiCallEvents.off('call', onCall);
          resolve(null);
        }, timeoutMs);
        const onCall = (e: AiCallEvent) => {
          if (e.userId === userId && e.serviceType === serviceType) {
            clearTimeout(timer);
            aiCallEvents.off('call', onCall);
            resolve(e);
          }
        };
        aiCallEvents.on('call', onCall);
      });
    },
  };
}

export interface GenerateOptions {
  activate?: boolean;
  /** How long to wait for the chained calls (insight warm-up, activation plan). Real calls take minutes. */
  chainedTimeoutMs?: number;
  log?: (line: string) => void;
}

/**
 * Synthesis → strategies → (chained insight warm-up) → optional activation of the rank-1 strategy.
 * Returns the recorded AI calls. Synthesis chains the strategy generation itself; generateStrategies
 * joins that in-flight run rather than paying for a second one.
 */
export async function generateForUser(user: SeededUser, options: GenerateOptions = {}): Promise<AiCallEvent[]> {
  const { activate = false, chainedTimeoutMs = 150_000, log = () => {} } = options;
  const recorder = recordAiCalls(user.userId);
  try {
    log('synthesizing identity…');
    const identity = await identityService.synthesizeIdentity(user.userId, user.tenantId);
    log(`identity v${identity.version}: ${identity.archetype} (readiness ${identity.readinessScore})`);

    // Synthesis chains a strategy generation of its own. Against the real API that run is still in
    // flight here and generateStrategies joins it; against the instant mock it may already be done,
    // so ask for the stored set first rather than paying for (and storing) a second one.
    log('generating strategies…');
    let { strategies } = await strategyService.getStrategies(user.userId, user.tenantId);
    if (strategies.length === 0) strategies = await strategyService.generateStrategies(user.userId, user.tenantId);
    log(`strategies: ${strategies.map((s) => s.name).join(' | ')}`);

    // The insight warm-up is chained to synthesis and not awaited by the app; wait so the process
    // does not exit mid-call and the cost is counted.
    const insight = await recorder.waitFor('insight', chainedTimeoutMs);
    if (!insight) log('insight warm-up not observed within the wait budget (continuing)');

    if (activate) {
      const first = strategies.find((s) => s.rank === 1) ?? strategies[0];
      log(`activating "${first.name}"…`);
      await strategyService.activateStrategy(first.id, user.userId, user.tenantId);
      const plan = await recorder.waitFor('strategy_activation', chainedTimeoutMs * 2);
      if (!plan) log('activation plan not observed within the wait budget');
      else if (!plan.success) log(`activation plan failed: ${plan.error}`);
    }
    return recorder.calls;
  } finally {
    recorder.stop();
  }
}

/** The slice of the app's stored output that the assertions read (see assertions.ts). */
export async function collectOutput(user: SeededUser): Promise<EvalOutput> {
  const identity = await identityService.getLatestIdentity(user.userId, user.tenantId);
  const { strategies } = await strategyService.getStrategies(user.userId, user.tenantId);
  const active = await strategyRepo.getActiveStrategy(user.userId, user.tenantId);
  const actionPlan = active?.actionPlan as { items: Array<{ title: string; description: string | null }> } | null | undefined;
  return {
    identity: identity
      ? {
          archetype: identity.archetype,
          readiness_score: identity.readinessScore,
          sub_scores: identity.subScores,
          headline_insight: identity.headlineInsight,
          ai_insights: identity.aiInsights,
        }
      : null,
    strategies: strategies.map((s) => ({ name: s.name, description: s.description, rank: s.rank, fit_score: s.fitScore, is_active: s.isActive })),
    action_plan: actionPlan ?? null,
  };
}

/** Hard delete: these are synthetic users, not people, so nothing is kept for the funnel. */
export async function deletePersonaUser(userId: number): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  if (user.signupSource !== PERSONA_SIGNUP_SOURCE) throw new Error(`user ${userId} is not a persona user; refusing to delete`);
  const where = { userId: user.id, tenantId: user.tenantId };
  await prisma.$transaction(async (tx) => {
    await tx.aiCallLog.deleteMany({ where });
    await tx.exportHistory.deleteMany({ where });
    await tx.growthPath.deleteMany({ where });
    await tx.growthStrategy.deleteMany({ where });
    await tx.simulation.deleteMany({ where });
    await tx.task.deleteMany({ where });
    await tx.contact.deleteMany({ where });
    await tx.strategy.deleteMany({ where });
    await tx.identityVersion.deleteMany({ where });
    await tx.audit.deleteMany({ where });
    await tx.recsDeal.deleteMany({ where });
    await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await tx.activityLog.deleteMany({ where: { tenantId: user.tenantId } });
    await tx.user.delete({ where: { id: user.id } });
    await tx.tenant.delete({ where: { id: user.tenantId } });
  });
}

export async function listPersonaUsers() {
  return prisma.user.findMany({ where: { signupSource: PERSONA_SIGNUP_SOURCE }, select: { id: true, email: true, createdAt: true } });
}

export async function cleanPersonaUsers(): Promise<number> {
  const users = await listPersonaUsers();
  for (const u of users) await deletePersonaUser(u.id);
  return users.length;
}
