jest.mock('../db.js', () => ({ prisma: {} }));

import { assemblePrompt } from './prompt-loader';
import { logger } from '../logger';

describe('assemblePrompt', () => {
  it('substitutes every occurrence of a placeholder', () => {
    const out = assemblePrompt('A: {{IDENTITY}} / again: {{IDENTITY}}', { IDENTITY: 'X' });
    expect(out).toBe('A: X / again: X');
  });

  it('is case-sensitive, matching the templates in prisma/seed.ts', () => {
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined as never);
    const out = assemblePrompt('{{AUDIT_DATA}}', { audit_data: 'wrong case' });
    expect(out).toBe('{{AUDIT_DATA}}');
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ leftover: ['{{AUDIT_DATA}}'] }),
      expect.any(String),
    );
  });

  it('does not treat values as regex patterns', () => {
    const out = assemblePrompt('{{JSON}}', { JSON: '{"a": "$1 and $& and \\d"}' });
    expect(out).toBe('{"a": "$1 and $& and \\d"}');
  });
});
