/**
 * The "get started" nudge is a sentence the system writes: it follows the language of the
 * request and is never served from the cache. Persistence and the model are mocked.
 */
const mockIdentityFindFirst = jest.fn();
const mockUserFindFirst = jest.fn();

jest.mock('../../shared/db.js', () => ({
  prisma: {
    identityVersion: { findFirst: (...args: unknown[]) => mockIdentityFindFirst(...args) },
    user: { findFirst: (...args: unknown[]) => mockUserFindFirst(...args), update: jest.fn().mockResolvedValue({}) },
  },
}));
jest.mock('../../shared/ai/retry.js', () => ({ callClaudeWithRetry: jest.fn(), parseJsonResponse: jest.fn() }));
jest.mock('../../shared/ai/prompt-loader.js', () => ({ loadActiveTemplate: jest.fn(), assemblePrompt: jest.fn() }));
jest.mock('../../shared/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { getInsights, getStartedInsight } from './service';

describe('getStartedInsight', () => {
  it('is written in the requested language, with the same type, severity and link', () => {
    expect(getStartedInsight('en')).toEqual({
      type: 'progress',
      title: 'Get Started',
      message: 'Complete all 5 audits to unlock your investor identity and personalized insights.',
      severity: 'info',
      actionUrl: '/audits',
    });
    expect(getStartedInsight('fr')).toMatchObject({
      type: 'progress',
      title: 'Pour commencer',
      severity: 'info',
      actionUrl: '/audits',
    });
    expect(getStartedInsight('fr').message).toContain('Complétez les 5 audits');
  });
});

describe('getInsights', () => {
  it('gives a user without an identity the nudge in the language of the request, not a cached one', async () => {
    mockIdentityFindFirst.mockResolvedValue(null);
    mockUserFindFirst.mockResolvedValue({
      insightsCache: [getStartedInsight('en')],
      insightsGeneratedAt: new Date(),
    });

    await expect(getInsights(1, 1, 'fr')).resolves.toEqual([getStartedInsight('fr')]);
    await expect(getInsights(1, 1, 'en')).resolves.toEqual([getStartedInsight('en')]);
  });

  it('serves the cached insights of a user who has an identity', async () => {
    const cached = [{ type: 'milestone', title: 'First door', message: 'Closed.', severity: 'success' }];
    mockIdentityFindFirst.mockResolvedValue({ id: 9 });
    mockUserFindFirst.mockResolvedValue({ insightsCache: cached, insightsGeneratedAt: new Date() });

    await expect(getInsights(1, 1, 'fr')).resolves.toEqual(cached);
  });
});
