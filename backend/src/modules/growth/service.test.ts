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
jest.mock('./repository.js', () => ({
  getActiveGrowthStrategy: (...args: unknown[]) => mockGetActiveGrowthStrategy(...args),
  unlockPath: (...args: unknown[]) => mockUnlockPath(...args),
  getLatestExport: (...args: unknown[]) => mockGetLatestExport(...args),
  getCurrentPath: (...args: unknown[]) => mockGetCurrentPath(...args),
}));

jest.mock('./generation.js', () => ({ recalculateStrategyProgress: jest.fn() }));
jest.mock('../../shared/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { evaluateUnlocks, getGrowthStrategy, getRefreshSuggestions, initiatePathGeneration } from './service';
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
