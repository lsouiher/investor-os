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
jest.mock('./repository.js', () => ({
  getActiveGrowthStrategy: (...args: unknown[]) => mockGetActiveGrowthStrategy(...args),
  unlockPath: (...args: unknown[]) => mockUnlockPath(...args),
}));

jest.mock('./generation.js', () => ({ recalculateStrategyProgress: jest.fn() }));
jest.mock('../../shared/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { evaluateUnlocks } from './service';

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
