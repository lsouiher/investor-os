/**
 * A synthesis runs without a request. When it fails, the reason is kept as a dictionary key
 * and written in the language of the request that polls GET /identity/status.
 */
const mockGetCompletedAudits = jest.fn();
const mockCallClaude = jest.fn();

jest.mock('./repository.js', () => ({ getLatestIdentity: jest.fn().mockResolvedValue(null) }));
jest.mock('../audit/repository.js', () => ({
  getCompletedAuditsForSynthesis: (...args: unknown[]) => mockGetCompletedAudits(...args),
}));
jest.mock('../../shared/ai/prompt-loader.js', () => ({
  loadActiveTemplate: jest.fn().mockResolvedValue({ id: 1, templateContent: '{{AUDIT_DATA}}' }),
  assemblePrompt: jest.fn().mockReturnValue('prompt'),
}));
jest.mock('../../shared/ai/retry.js', () => ({
  callClaudeWithRetry: (...args: unknown[]) => mockCallClaude(...args),
  parseJsonResponse: jest.fn(),
}));
jest.mock('../../shared/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { getSynthesisStatus, startSynthesis } from './service';
import { AppError } from '../../shared/middleware/error-handler';

// startSynthesis does not return its promise; let the rejection reach its handler
const settle = () => new Promise((resolve) => setImmediate(resolve));

describe('getSynthesisStatus', () => {
  it('renders a failed synthesis in the language of the request that reads it', async () => {
    mockGetCompletedAudits.mockResolvedValue([]);

    startSynthesis(1, 1);
    await settle();

    await expect(getSynthesisStatus(1, 1, 'en')).resolves.toEqual({
      generating: false,
      latestVersion: null,
      lastError: 'At least one audit must be completed before identity synthesis.',
    });
    const french = await getSynthesisStatus(1, 1, 'fr');
    expect(french.lastError).toBe('Au moins un audit doit être complété avant la synthèse de l’identité.');
  });

  it('falls back to the generic AI message for an unexpected failure', async () => {
    mockGetCompletedAudits.mockResolvedValue([{ auditType: 'financial', version: 1, subScore: 50, responses: {} }]);
    mockCallClaude.mockRejectedValue(new Error('socket hang up'));

    startSynthesis(2, 1);
    await settle();

    expect((await getSynthesisStatus(2, 1, 'en')).lastError).toBe("We couldn't process your request right now. Please try again.");
    expect((await getSynthesisStatus(2, 1, 'fr')).lastError).toBe(
      'Nous n’avons pas pu traiter votre demande pour le moment. Veuillez réessayer.',
    );
  });

  it('keeps a developer-facing failure as written', async () => {
    mockGetCompletedAudits.mockResolvedValue([{ auditType: 'financial', version: 1, subScore: 50, responses: {} }]);
    mockCallClaude.mockRejectedValue(new AppError('INTERNAL_ERROR', 'No active prompt template found for service type: identity_synthesis'));

    startSynthesis(3, 1);
    await settle();

    expect((await getSynthesisStatus(3, 1, 'fr')).lastError).toBe(
      'No active prompt template found for service type: identity_synthesis',
    );
  });

  it('reports no error for a user whose synthesis has not failed', async () => {
    await expect(getSynthesisStatus(99, 1, 'fr')).resolves.toEqual({ generating: false, latestVersion: null, lastError: null });
  });
});
