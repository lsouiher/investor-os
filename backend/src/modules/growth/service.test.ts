/**
 * Unlock evaluation for growth paths (FR: progressive unlocking).
 * Persistence is mocked; the rules under test are pure decisions.
 */
const mockFindFirst = jest.fn();
const mockActivityCreate = jest.fn().mockResolvedValue({});

jest.mock('../../shared/db.js', () => ({
  prisma: {
    strategy: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
    activityLog: { create: (...args: unknown[]) => mockActivityCreate(...args) },
  },
}));

const mockGetActiveGrowthStrategy = jest.fn();
const mockUnlockPath = jest.fn().mockResolvedValue({});
const mockGetLatestExport = jest.fn();
const mockGetCurrentPath = jest.fn();
const mockUpdateActionItemCompletion = jest.fn();
const mockGetGrowthStrategyById = jest.fn();
jest.mock('./repository.js', () => ({
  getActiveGrowthStrategy: (...args: unknown[]) => mockGetActiveGrowthStrategy(...args),
  unlockPath: (...args: unknown[]) => mockUnlockPath(...args),
  getLatestExport: (...args: unknown[]) => mockGetLatestExport(...args),
  getCurrentPath: (...args: unknown[]) => mockGetCurrentPath(...args),
  updateActionItemCompletion: (...args: unknown[]) => mockUpdateActionItemCompletion(...args),
  getGrowthStrategyById: (...args: unknown[]) => mockGetGrowthStrategyById(...args),
}));

jest.mock('./generation.js', () => ({ recalculateStrategyProgress: jest.fn() }));
jest.mock('../../shared/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import {
  completeActionItem,
  evaluateUnlocks,
  getGrowthStrategy,
  getRefreshSuggestions,
  initiatePathGeneration,
  regeneratePath,
} from './service';
import { checkExportFreshness } from './export';
import { AppError } from '../../shared/middleware/error-handler';

function strategyWithPaths(statuses: Record<string, string>) {
  return {
    id: 1,
    paths: Object.entries(statuses).map(([pathType, status], i) => ({ id: i + 1, pathType, status })),
  };
}

function microPlan(completed: number, total = 3) {
  return {
    microPlan: {
      tasks: Array.from({ length: total }, (_, i) => ({ id: `t${i}`, is_completed: i < completed })),
    },
  };
}

describe('evaluateUnlocks', () => {
  beforeEach(() => {
    mockFindFirst.mockReset();
    mockGetActiveGrowthStrategy.mockReset();
    mockUnlockPath.mockClear();
    mockActivityCreate.mockClear();
  });

  it('returns nothing when the user has no growth strategy', async () => {
    mockGetActiveGrowthStrategy.mockResolvedValue(null);
    await expect(evaluateUnlocks(1, 1)).resolves.toEqual([]);
    expect(mockUnlockPath).not.toHaveBeenCalled();
  });

  it('unlocks Income & Capital organically after 2 completed micro-plan tasks', async () => {
    mockGetActiveGrowthStrategy.mockResolvedValue(
      strategyWithPaths({ portfolio: 'generated', income_capital: 'locked' }),
    );
    mockFindFirst.mockResolvedValue(microPlan(2));

    const unlocked = await evaluateUnlocks(1, 1);

    expect(unlocked).toEqual(['income_capital']);
    expect(mockUnlockPath).toHaveBeenCalledWith(
      2,
      1,
      'organic',
      expect.objectContaining({ completed_count: 2, required_count: 2 }),
    );
    expect(mockActivityCreate).toHaveBeenCalledTimes(1);
  });

  it('keeps Income & Capital locked with fewer than 2 completed tasks', async () => {
    mockGetActiveGrowthStrategy.mockResolvedValue(
      strategyWithPaths({ portfolio: 'generated', income_capital: 'locked' }),
    );
    mockFindFirst.mockResolvedValue(microPlan(1));

    await expect(evaluateUnlocks(1, 1)).resolves.toEqual([]);
    expect(mockUnlockPath).not.toHaveBeenCalled();
  });

  it('keeps Income & Capital locked when there is no active V1 strategy', async () => {
    mockGetActiveGrowthStrategy.mockResolvedValue(
      strategyWithPaths({ portfolio: 'generated', income_capital: 'locked' }),
    );
    mockFindFirst.mockResolvedValue(null);

    await expect(evaluateUnlocks(1, 1)).resolves.toEqual([]);
  });

  it('never re-unlocks paths that are already unlocked or generated', async () => {
    mockGetActiveGrowthStrategy.mockResolvedValue(
      strategyWithPaths({ portfolio: 'generated', income_capital: 'generated' }),
    );
    mockFindFirst.mockResolvedValue(microPlan(3));

    await expect(evaluateUnlocks(1, 1)).resolves.toEqual([]);
    expect(mockUnlockPath).not.toHaveBeenCalled();
  });

  it('stub paths (skills, time) do not unlock organically', async () => {
    mockGetActiveGrowthStrategy.mockResolvedValue(
      strategyWithPaths({ skills_knowledge: 'locked', time_operations: 'locked' }),
    );
    mockFindFirst.mockResolvedValue(microPlan(3));

    await expect(evaluateUnlocks(1, 1)).resolves.toEqual([]);
    expect(mockUnlockPath).not.toHaveBeenCalled();
  });
});

// Sentences the system composes are written in the language of the request that reads them
describe('system sentences', () => {
  const now = new Date();
  const longAgo = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);

  function fullStrategy() {
    const path = (id: number, pathType: string, status: string, version = 1) => ({
      id,
      publicId: `path_${id}`,
      pathType,
      status,
      version,
      progress: 0,
      summary: null,
      unlockedAt: null,
      unlockType: null,
      generatedAt: status === 'generated' ? longAgo : null,
      actionItems: [],
    });
    return {
      id: 1,
      publicId: 'gs_1',
      status: 'active',
      overallProgress: 0,
      growthScore: 0,
      identityVersionId: 5,
      identityVersion: { publicId: 'idv_5', version: 3, archetype: 'House Hacker', readinessScore: 60 },
      paths: [path(1, 'portfolio', 'generated', 2), path(2, 'income_capital', 'locked'), path(3, 'skills_knowledge', 'locked')],
      crossPathLinks: [],
      nextBestAction: null,
      createdAt: now,
    };
  }

  beforeEach(() => {
    mockGetActiveGrowthStrategy.mockReset();
    mockGetLatestExport.mockReset();
    mockGetCurrentPath.mockReset();
  });

  it('writes unlock criteria and staleness reasons in English as before', async () => {
    mockGetActiveGrowthStrategy.mockResolvedValue(fullStrategy());
    mockGetLatestExport.mockResolvedValue({ createdAt: now, pathVersions: { portfolio: 1 }, identityVersion: 2 });

    const strategy = await getGrowthStrategy(1, 1, 'en');

    expect(strategy!.paths.map((p) => p.unlock_criteria)).toEqual([
      undefined,
      'Complete 2+ micro-plan tasks from Portfolio Growth',
      'Coming soon — this path will be available in a future update',
    ]);
    expect(strategy!.export_staleness.changed_since_export).toEqual([
      'Identity updated (v2 → v3)',
      'Portfolio Growth path regenerated (v1 → v2)',
    ]);
  });

  it('writes them in French for a French request', async () => {
    mockGetActiveGrowthStrategy.mockResolvedValue(fullStrategy());
    mockGetLatestExport.mockResolvedValue({ createdAt: now, pathVersions: { portfolio: 1 }, identityVersion: 2 });

    const strategy = await getGrowthStrategy(1, 1, 'fr');

    expect(strategy!.paths[1].unlock_criteria).toBe('Compléter au moins 2 tâches du micro-plan de Croissance du portefeuille');
    expect(strategy!.export_staleness.changed_since_export).toEqual([
      'Identité mise à jour (v2 → v3)',
      'Croissance du portefeuille\u00a0: parcours régénéré (v1 → v2)',
    ]);
  });

  it('names the paths to refresh in the language of the request', async () => {
    mockGetActiveGrowthStrategy.mockResolvedValue(fullStrategy());
    await expect(getRefreshSuggestions(1, 1, 'en')).resolves.toEqual(['Portfolio Growth']);
    await expect(getRefreshSuggestions(1, 1, 'fr')).resolves.toEqual(['Croissance du portefeuille']);
  });

  it('tells a generation cooldown as a duration, which is right in any time zone', async () => {
    mockGetActiveGrowthStrategy.mockResolvedValue(fullStrategy());
    const cooldownUntil = new Date(Date.now() + 12 * 60_000 - 5_000);
    mockGetCurrentPath.mockResolvedValue({ id: 1, status: 'generated', strategyId: null, generationCooldownUntil: cooldownUntil });

    const err: AppError = await initiatePathGeneration(1, 1, 'portfolio').catch((e) => e);

    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('RATE_LIMITED');
    expect(err.statusCode).toBe(429);
    expect(err.render('en')).toEqual({
      message: 'This path was recently generated. Try again in 12 min.',
      details: [{ cooldown_until: cooldownUntil.toISOString() }],
    });
    expect(err.render('fr').message).toBe('Ce parcours vient d’être généré. Réessayez dans 12 min.');
  });

  it('asks to confirm an early unlock with the criteria in the language of the request', async () => {
    mockGetActiveGrowthStrategy.mockResolvedValue(fullStrategy());
    mockGetCurrentPath.mockResolvedValue({ id: 2, status: 'locked', strategyId: null, generationCooldownUntil: null });

    const err: AppError = await initiatePathGeneration(1, 1, 'income_capital').catch((e) => e);

    expect(err.render('en')).toEqual({
      message:
        'This path is most valuable after Complete 2+ micro-plan tasks from Portfolio Growth. Set confirm_early_unlock to true to generate now.',
      details: [{ unlock_criteria: 'Complete 2+ micro-plan tasks from Portfolio Growth' }],
    });
    expect(err.render('fr').details).toEqual([
      { unlock_criteria: 'Compléter au moins 2 tâches du micro-plan de Croissance du portefeuille' },
    ]);
    expect(err.render('fr').message).toContain('Confirmez le déblocage anticipé');
  });

  it('refuses a coming-soon path by its name in the language of the request', async () => {
    const err: AppError = await initiatePathGeneration(1, 1, 'skills_knowledge').catch((e) => e);
    expect(err.message).toBe('Skills & Knowledge is coming soon and not yet available for generation.');
    expect(err.render('fr').message).toContain('Compétences et connaissances');
  });
});

// Value: protects=the unlock message after an action item, and regeneratePath's cooldown (in
// minutes) and coming-soon refusals, are written in the reader's language; fails_when=the locale
// param of completeActionItem is ignored, or the regenerate keys/params change; why_new=the tests
// above cover initiatePathGeneration only; seam=none
// Generated by /ship test coverage audit (pass 2).
describe('action item unlocks and regeneration in the language of the request', () => {
  beforeEach(() => {
    mockGetActiveGrowthStrategy.mockReset().mockResolvedValue(
      strategyWithPaths({ portfolio: 'generated', income_capital: 'locked' }),
    );
    mockGetCurrentPath.mockReset();
    mockFindFirst.mockReset().mockResolvedValue(microPlan(2));
    mockUpdateActionItemCompletion.mockReset().mockResolvedValue({ updatedItem: { id: 'a1', is_completed: true }, progress: 50 });
    mockGetGrowthStrategyById.mockReset().mockResolvedValue({ overallProgress: 25 });
  });

  it('announces a path unlocked by an action item in English and in French', async () => {
    mockGetCurrentPath.mockResolvedValue({ id: 1, status: 'generated' });

    const en = await completeActionItem(1, 1, 'portfolio', 'a1', true, 'en');
    expect(en.unlocksTriggered).toEqual([
      { path_type: 'income_capital', unlock_type: 'organic', message: "You've unlocked Income & Capital!" },
    ]);
    expect(en.pathProgress).toBe(50);
    expect(en.overallProgress).toBe(25);

    const fr = await completeActionItem(1, 1, 'portfolio', 'a1', true, 'fr');
    expect(fr.unlocksTriggered[0].message).toBe('Vous avez débloqué Revenus et capital !');
  });

  it('tells a regeneration cooldown as a duration in the language of the request', async () => {
    const cooldownUntil = new Date(Date.now() + 12 * 60_000 - 5_000);
    mockGetCurrentPath.mockResolvedValue({ id: 1, status: 'generated', strategyId: null, generationCooldownUntil: cooldownUntil });

    const err: AppError = await regeneratePath(1, 1, 'portfolio').catch((e) => e);

    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('RATE_LIMITED');
    expect(err.statusCode).toBe(429);
    expect(err.render('en').message).toBe('Regeneration available in 12 min.');
    expect(err.render('fr').message).toBe('Régénération possible dans 12 min.');
  });

  it('refuses to regenerate a coming-soon path by its name in the language of the request', async () => {
    const err: AppError = await regeneratePath(1, 1, 'skills_knowledge').catch((e) => e);

    expect(err.statusCode).toBe(400);
    expect(err.render('en').message).toBe('Skills & Knowledge is coming soon and cannot be regenerated.');
    expect(err.render('fr').message).toBe(
      'Compétences et connaissances : bientôt disponible. Ce parcours ne peut pas être régénéré.',
    );
    expect(mockGetActiveGrowthStrategy).not.toHaveBeenCalled();
  });
});

// Value: protects=checkExportFreshness keeps its English staleness text byte-identical (with
// '->') and renders it in French; fails_when=the export.staleness keys, params or the ASCII arrow
// change; why_new=only getGrowthStrategy's staleness (growth.staleness keys) was tested; seam=none
// Generated by /ship test coverage audit (pass 2).
describe('checkExportFreshness', () => {
  const exportedAt = new Date('2026-09-01T12:00:00.000Z');
  const strategy = {
    identityVersion: { version: 3 },
    paths: [
      { pathType: 'portfolio', status: 'generated', version: 2 },
      // Newer than the export but not generated: not a change the export missed
      { pathType: 'income_capital', status: 'locked', version: 1 },
    ],
  };

  beforeEach(() => {
    mockGetActiveGrowthStrategy.mockReset().mockResolvedValue(strategy);
    mockGetLatestExport.mockReset().mockResolvedValue({
      createdAt: exportedAt,
      pathVersions: { portfolio: 1 },
      identityVersion: 2,
    });
  });

  it('lists what changed since the export in English, as before', async () => {
    await expect(checkExportFreshness(1, 1, 'en')).resolves.toEqual({
      has_exported: true,
      last_export_at: '2026-09-01T12:00:00.000Z',
      is_stale: true,
      changed_since_export: ['Identity updated (v2 -> v3)', 'Portfolio Growth regenerated (v1 -> v2)'],
    });
  });

  it('lists what changed since the export in French', async () => {
    const freshness = await checkExportFreshness(1, 1, 'fr');

    expect(freshness.changed_since_export).toEqual([
      'Identité mise à jour (v2 → v3)',
      'Croissance du portefeuille : parcours régénéré (v1 → v2)',
    ]);
  });

  it('is not stale when nothing changed, and reports no export when there is none', async () => {
    mockGetActiveGrowthStrategy.mockResolvedValue({
      identityVersion: { version: 2 },
      paths: [{ pathType: 'portfolio', status: 'generated', version: 1 }],
    });
    await expect(checkExportFreshness(1, 1, 'fr')).resolves.toMatchObject({ is_stale: false, changed_since_export: [] });

    mockGetLatestExport.mockResolvedValue(null);
    await expect(checkExportFreshness(1, 1, 'en')).resolves.toEqual({
      has_exported: false,
      last_export_at: null,
      is_stale: false,
      changed_since_export: [],
    });
  });
});
