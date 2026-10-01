/**
 * A simulation runs as a job after its request has been answered. A failure is kept as a
 * dictionary key so GET /simulations/jobs/:jobId can write it in the reader's language.
 */
const mockCount = jest.fn();
const mockIdentityFindFirst = jest.fn();
const mockCallClaude = jest.fn();

jest.mock('./repository.js', () => ({
  getSimulationCountLast24h: (...args: unknown[]) => mockCount(...args),
}));
jest.mock('../../shared/db.js', () => ({
  prisma: { identityVersion: { findFirst: (...args: unknown[]) => mockIdentityFindFirst(...args) } },
}));
jest.mock('../../shared/ai/prompt-loader.js', () => ({
  loadActiveTemplate: jest.fn().mockResolvedValue({ id: 1, templateContent: '' }),
  assemblePrompt: jest.fn().mockReturnValue('prompt'),
}));
jest.mock('../../shared/ai/retry.js', () => ({
  callClaudeWithRetry: (...args: unknown[]) => mockCallClaude(...args),
  parseJsonResponse: jest.fn(),
}));

import { getSimulationJob, startSimulation } from './service';
import { AppError } from '../../shared/middleware/error-handler';
import { render } from '../../shared/i18n';

const settle = () => new Promise((resolve) => setImmediate(resolve));
const identity = { id: 1, archetype: 'House Hacker', readinessScore: 60, subScores: {}, radarData: {}, headlineInsight: '' };

describe('simulation jobs', () => {
  beforeEach(() => {
    mockCount.mockReset().mockResolvedValue(0);
    mockIdentityFindFirst.mockReset().mockResolvedValue(identity);
    mockCallClaude.mockReset();
  });

  it('keeps the key of a failure and renders it for whoever reads the job', async () => {
    mockCallClaude.mockRejectedValue(AppError.localized('AI_SERVICE_ERROR', 'ai.unavailable', {}, 503));

    const { jobId } = await startSimulation(1, 1, { capital: 80 });
    await settle();

    const job = getSimulationJob(jobId, 1)!;
    expect(job.status).toBe('failed');
    expect(job.error!.code).toBe('AI_SERVICE_ERROR');
    expect(render('en', job.error!.message)).toBe("We couldn't process your request right now. Please try again.");
    expect(render('fr', job.error!.message)).toBe('Nous n’avons pas pu traiter votre demande pour le moment. Veuillez réessayer.');
  });

  it('uses the generic AI message for an unexpected failure', async () => {
    mockCallClaude.mockRejectedValue(new Error('socket hang up'));

    const { jobId } = await startSimulation(1, 1, { capital: 80 });
    await settle();

    const job = getSimulationJob(jobId, 1)!;
    expect(job.error).toEqual({ code: 'AI_SERVICE_ERROR', message: { key: 'ai.unavailable' } });
  });

  it('refuses a fourth simulation in 24 hours in the language of the request', async () => {
    mockCount.mockResolvedValue(3);

    const err: AppError = await startSimulation(1, 1, { capital: 80 }).catch((e) => e);

    expect(err.code).toBe('RATE_LIMITED');
    expect(err.message).toBe('Maximum 3 simulations per 24 hours. Please try again later.');
    expect(err.render('fr').message).toBe('Maximum de 3 simulations par période de 24 heures. Veuillez réessayer plus tard.');
  });

  it('does not show a job to another user', async () => {
    mockCallClaude.mockRejectedValue(new Error('x'));
    const { jobId } = await startSimulation(1, 1, { capital: 80 });
    expect(getSimulationJob(jobId, 2)).toBeNull();
  });
});
