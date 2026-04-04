import { validateAuditType, validateCompletionRequirements } from './validation';
import { AppError } from '../../shared/middleware/error-handler';

describe('validateAuditType', () => {
  it.each(['financial', 'time', 'skills', 'risk', 'horizon'])('accepts valid type: %s', (type) => {
    expect(validateAuditType(type)).toBe(type);
  });

  it('rejects invalid audit type', () => {
    expect(() => validateAuditType('invalid')).toThrow(AppError);
  });

  it('rejects empty string', () => {
    expect(() => validateAuditType('')).toThrow(AppError);
  });
});

describe('validateCompletionRequirements', () => {
  it('passes with all financial sections having at least one field', () => {
    const responses = {
      income: { primary_income: '100000' },
      assets: { liquid_cash: '50000' },
      liabilities: { total_monthly_debt: '2000' },
      credit: { credit_score_range: '750' },
      tax: { effective_tax_rate: '22' },
    };
    expect(() => validateCompletionRequirements('financial', responses)).not.toThrow();
  });

  it('fails when a required section is missing', () => {
    const responses = {
      income: { primary_income: '100000' },
      assets: { liquid_cash: '50000' },
      // missing liabilities, credit, tax
    };
    try {
      validateCompletionRequirements('financial', responses);
      fail('Expected AppError');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).code).toBe('VALIDATION_ERROR');
    }
  });

  it('fails when all fields in a section are empty', () => {
    const responses = {
      income: { primary_income: null, secondary_income: '' },
      assets: { liquid_cash: '50000' },
      liabilities: { total_monthly_debt: '2000' },
      credit: { credit_score_range: '750' },
      tax: { effective_tax_rate: '22' },
    };
    try {
      validateCompletionRequirements('financial', responses);
      fail('Expected AppError');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
    }
  });

  it('passes when section has mix of filled and empty fields', () => {
    const responses = {
      income: { primary_income: '100000', secondary_income: null },
      assets: { liquid_cash: '50000' },
      liabilities: { total_monthly_debt: '2000' },
      credit: { credit_score_range: '750' },
      tax: { effective_tax_rate: '22' },
    };
    expect(() => validateCompletionRequirements('financial', responses)).not.toThrow();
  });

  it('throws for unknown audit type', () => {
    expect(() => validateCompletionRequirements('unknown', {})).toThrow(AppError);
  });

  it('validates time audit sections', () => {
    const responses = {
      availability: { hours: '10' },
      flexibility: { schedule: 'flexible' },
      preference: { involvement: 'active' },
      runway: { months: '12' },
    };
    expect(() => validateCompletionRequirements('time', responses)).not.toThrow();
  });
});
