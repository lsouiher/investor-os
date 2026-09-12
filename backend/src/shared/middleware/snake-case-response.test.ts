import { snakeCaseKeys, toSnakeCase } from './snake-case-response';

describe('toSnakeCase', () => {
  it('converts camelCase keys', () => {
    expect(toSnakeCase('readinessScore')).toBe('readiness_score');
    expect(toSnakeCase('identityImpactScore')).toBe('identity_impact_score');
    expect(toSnakeCase('v1StrategyId')).toBe('v1_strategy_id');
  });

  it('leaves snake_case and single words alone', () => {
    expect(toSnakeCase('readiness_score')).toBe('readiness_score');
    expect(toSnakeCase('id')).toBe('id');
  });
});

describe('snakeCaseKeys', () => {
  it('walks nested objects and arrays', () => {
    const input = {
      data: {
        readinessScore: 72,
        subScores: { financial: 68 },
        topTasks: [{ dueDate: null, isCompleted: false }],
      },
    };
    expect(snakeCaseKeys(input)).toEqual({
      data: {
        readiness_score: 72,
        sub_scores: { financial: 68 },
        top_tasks: [{ due_date: null, is_completed: false }],
      },
    });
  });

  it('does not touch Dates, Buffers, or primitives', () => {
    const date = new Date('2026-01-01T00:00:00Z');
    const buf = Buffer.from('x');
    expect(snakeCaseKeys({ createdAt: date, raw: buf, n: 1, s: 'x', b: null })).toEqual({
      created_at: date,
      raw: buf,
      n: 1,
      s: 'x',
      b: null,
    });
  });

  it('preserves the error envelope', () => {
    const err = { error: { code: 'VALIDATION_ERROR', message: 'x', details: [{ missingSections: ['a'] }] } };
    expect(snakeCaseKeys(err)).toEqual({
      error: { code: 'VALIDATION_ERROR', message: 'x', details: [{ missing_sections: ['a'] }] },
    });
  });
});
