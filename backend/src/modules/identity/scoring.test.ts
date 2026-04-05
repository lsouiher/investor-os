import { calculateReadinessScore, buildSubScores, type AuditSubScores } from './scoring';

describe('calculateReadinessScore', () => {
  it('returns 100 for all perfect scores', () => {
    const subScores: AuditSubScores = {
      financial: 100,
      time: 100,
      skills: 100,
      risk: 100,
      horizon: 100,
    };
    expect(calculateReadinessScore(subScores)).toBe(100);
  });

  it('returns 0 for all zero scores', () => {
    const subScores: AuditSubScores = {
      financial: 0,
      time: 0,
      skills: 0,
      risk: 0,
      horizon: 0,
    };
    expect(calculateReadinessScore(subScores)).toBe(0);
  });

  it('applies correct weights', () => {
    // Only financial = 100, rest = 0. Financial weight = 0.20
    const subScores: AuditSubScores = {
      financial: 100,
      time: 0,
      skills: 0,
      risk: 0,
      horizon: 0,
    };
    expect(calculateReadinessScore(subScores)).toBe(20);
  });

  it('horizon has highest weight at 25%', () => {
    const subScores: AuditSubScores = {
      financial: 0,
      time: 0,
      skills: 0,
      risk: 0,
      horizon: 100,
    };
    expect(calculateReadinessScore(subScores)).toBe(25);
  });

  it('time has lowest weight at 15%', () => {
    const subScores: AuditSubScores = {
      financial: 0,
      time: 100,
      skills: 0,
      risk: 0,
      horizon: 0,
    };
    expect(calculateReadinessScore(subScores)).toBe(15);
  });

  it('rounds to nearest integer', () => {
    const subScores: AuditSubScores = {
      financial: 33,
      time: 33,
      skills: 33,
      risk: 33,
      horizon: 33,
    };
    // 33 * (0.20 + 0.15 + 0.20 + 0.20 + 0.25) = 33 * 1.0 = 33
    expect(calculateReadinessScore(subScores)).toBe(33);
  });
});

describe('buildSubScores', () => {
  it('maps audit types to sub-scores', () => {
    const audits = [
      { auditType: 'financial', subScore: 80 },
      { auditType: 'time', subScore: 70 },
      { auditType: 'skills', subScore: 90 },
      { auditType: 'risk', subScore: 60 },
      { auditType: 'horizon', subScore: 85 },
    ];
    const result = buildSubScores(audits);
    expect(result).toEqual({
      financial: 80,
      time: 70,
      skills: 90,
      risk: 60,
      horizon: 85,
    });
  });

  it('defaults missing audit types to 0', () => {
    const audits = [{ auditType: 'financial', subScore: 80 }];
    const result = buildSubScores(audits);
    expect(result).toEqual({
      financial: 80,
      time: 0,
      skills: 0,
      risk: 0,
      horizon: 0,
    });
  });

  it('handles null subScore', () => {
    const audits = [{ auditType: 'financial', subScore: null }];
    const result = buildSubScores(audits);
    expect(result.financial).toBe(0);
  });

  it('handles empty audit list', () => {
    const result = buildSubScores([]);
    expect(result).toEqual({
      financial: 0,
      time: 0,
      skills: 0,
      risk: 0,
      horizon: 0,
    });
  });

  it('ignores unknown audit types', () => {
    const audits = [
      { auditType: 'financial', subScore: 80 },
      { auditType: 'unknown', subScore: 99 },
    ];
    const result = buildSubScores(audits);
    expect(result.financial).toBe(80);
    expect((result as unknown as Record<string, number>)['unknown']).toBeUndefined();
  });
});
