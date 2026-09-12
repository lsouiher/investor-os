import { calculateSubScore } from './scoring';

describe('calculateSubScore', () => {
  it('returns 100 for fully completed financial audit', () => {
    const responses = {
      income: { primary_income: '100000', secondary_income: '5000' },
      assets: { liquid_cash: '50000', retirement_accounts: '20000' },
      liabilities: { total_monthly_debt: '2000' },
      credit: { credit_score_range: '750' },
      tax: { effective_tax_rate: '22' },
    };
    expect(calculateSubScore('financial', responses)).toBe(100);
  });

  it('returns 0 for empty responses', () => {
    expect(calculateSubScore('financial', {})).toBe(0);
  });

  it('returns 0 for unknown audit type', () => {
    expect(calculateSubScore('unknown', { something: { field: 'value' } })).toBe(0);
  });

  it('calculates partial completion correctly', () => {
    const responses = {
      income: { primary_income: '100000', secondary_income: null },
      assets: { liquid_cash: '', retirement_accounts: undefined },
      liabilities: {},
      credit: {},
      tax: {},
    };
    // 1 filled out of 4 total fields across existing sections
    const score = calculateSubScore('financial', responses);
    expect(score).toBe(25); // 1/4 = 25%
  });

  it('handles time audit type', () => {
    const responses = {
      availability: { hours_per_week: '10' },
      flexibility: { schedule: 'flexible' },
      preferences: { involvement: 'active' },
      runway: { months: '12' },
    };
    expect(calculateSubScore('time', responses)).toBe(100);
  });

  it('handles skills audit type', () => {
    const responses = {
      re_experience: { years: '5' },
      professional: { field: 'engineering' },
      transferable: { skill: 'negotiation' },
      education: { degree: 'MBA' },
      network: { contacts: '50' },
    };
    expect(calculateSubScore('skills', responses)).toBe(100);
  });

  it('handles risk audit type', () => {
    const responses = {
      self_assessment: { risk_tolerance: 'moderate' },
      scenarios: { answer: 'hold' },
      safety: { emergency_fund: 'yes' },
      behavioral: { past_decisions: 'conservative' },
      comfort_zones: { max_loss: '20%' },
    };
    expect(calculateSubScore('risk', responses)).toBe(100);
  });

  it('handles horizon audit type', () => {
    const responses = {
      objectives: { goal: 'retirement' },
      financial_targets: { target_income: '100000' },
      timeline: { years: '10' },
      lifestyle: { preference: 'passive' },
      constraints: { limits: 'none' },
    };
    expect(calculateSubScore('horizon', responses)).toBe(100);
  });

  it('ignores non-object sections', () => {
    const responses = {
      income: 'not an object',
      assets: null,
      liabilities: { total_monthly_debt: '2000' },
      credit: {},
      tax: {},
    };
    const score = calculateSubScore('financial', responses);
    expect(score).toBe(100); // only liabilities section counted (1/1)
  });
});
