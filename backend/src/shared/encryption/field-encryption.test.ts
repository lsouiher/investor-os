import { encryptField, decryptField, encryptSensitiveFields, decryptSensitiveFields } from './field-encryption';

// Set up encryption environment before tests
beforeAll(() => {
  // 32-byte hex key for AES-256
  const testKey = 'a'.repeat(64);
  process.env.AUDIT_ENCRYPTION_KEY_V1 = testKey;
  process.env.CURRENT_ENCRYPTION_KEY_VERSION = '1';
});

afterAll(() => {
  delete process.env.AUDIT_ENCRYPTION_KEY_V1;
  delete process.env.CURRENT_ENCRYPTION_KEY_VERSION;
});

describe('encryptField / decryptField', () => {
  it('encrypts and decrypts a string round-trip', () => {
    const plaintext = 'sensitive-data-123';
    const encrypted = encryptField(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(decryptField(encrypted)).toBe(plaintext);
  });

  it('produces versioned ciphertext format v1:iv:tag:data', () => {
    const encrypted = encryptField('test');
    const parts = encrypted.split(':');
    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe('v1');
  });

  it('produces different ciphertext for same plaintext (random IV)', () => {
    const a = encryptField('same');
    const b = encryptField('same');
    expect(a).not.toBe(b);
    // But both decrypt to the same value
    expect(decryptField(a)).toBe('same');
    expect(decryptField(b)).toBe('same');
  });

  it('handles empty string', () => {
    const encrypted = encryptField('');
    expect(decryptField(encrypted)).toBe('');
  });

  it('throws on malformed ciphertext (wrong number of parts)', () => {
    expect(() => decryptField('not:valid')).toThrow('Invalid encrypted field format');
  });

  it('throws on tampered auth tag', () => {
    const encrypted = encryptField('test');
    const parts = encrypted.split(':');
    parts[2] = Buffer.from('tampered-tag-val').toString('base64');
    expect(() => decryptField(parts.join(':'))).toThrow();
  });

  it('throws when key version not found', () => {
    const encrypted = encryptField('test');
    const parts = encrypted.split(':');
    parts[0] = 'v99'; // non-existent key version
    expect(() => decryptField(parts.join(':'))).toThrow('KeyVersionNotFound');
  });
});

describe('encryptSensitiveFields', () => {
  it('encrypts sensitive fields in financial audit', () => {
    const responses = {
      income: { primary_income: '100000', secondary_income: '5000', description: 'salary' },
      assets: { liquid_cash: '50000' },
    };
    const encrypted = encryptSensitiveFields(responses, 'financial');

    // Sensitive fields should be encrypted (start with v1:)
    expect((encrypted.income as Record<string, string>).primary_income).toMatch(/^v1:/);
    expect((encrypted.income as Record<string, string>).secondary_income).toMatch(/^v1:/);
    expect((encrypted.assets as Record<string, string>).liquid_cash).toMatch(/^v1:/);

    // Non-sensitive field should remain plain
    expect((encrypted.income as Record<string, string>).description).toBe('salary');
  });

  it('passes through non-financial audits unchanged', () => {
    const responses = { availability: { hours: '10' } };
    const result = encryptSensitiveFields(responses, 'time');
    expect(result).toEqual(responses);
  });

  it('handles null sections gracefully', () => {
    const responses = { income: null, assets: { liquid_cash: '50000' } };
    const result = encryptSensitiveFields(responses, 'financial');
    expect((result.assets as Record<string, string>).liquid_cash).toMatch(/^v1:/);
  });
});

describe('decryptSensitiveFields', () => {
  it('decrypts encrypted financial fields round-trip', () => {
    const original = {
      income: { primary_income: '100000', description: 'salary' },
    };
    const encrypted = encryptSensitiveFields(original, 'financial');
    const decrypted = decryptSensitiveFields(encrypted, 'financial');

    expect((decrypted.income as Record<string, string>).primary_income).toBe('100000');
    expect((decrypted.income as Record<string, string>).description).toBe('salary');
  });

  it('passes through non-financial audits unchanged', () => {
    const responses = { availability: { hours: '10' } };
    const result = decryptSensitiveFields(responses, 'time');
    expect(result).toEqual(responses);
  });

  it('handles legacy non-encrypted data gracefully', () => {
    const responses = {
      income: { primary_income: '100000' }, // not encrypted, just plain text
    };
    // Should not throw — the try/catch handles non-encrypted values
    const result = decryptSensitiveFields(responses, 'financial');
    expect((result.income as Record<string, string>).primary_income).toBe('100000');
  });
});
