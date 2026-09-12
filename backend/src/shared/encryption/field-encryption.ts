import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { logger } from '../logger.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(version: number): Buffer {
  const key = process.env[`AUDIT_ENCRYPTION_KEY_V${version}`];
  if (!key) {
    throw new Error(`KeyVersionNotFound: No encryption key found for version ${version}`);
  }
  return Buffer.from(key, 'hex');
}

function getCurrentKeyVersion(): number {
  const version = process.env.CURRENT_ENCRYPTION_KEY_VERSION;
  if (!version) {
    throw new Error('CURRENT_ENCRYPTION_KEY_VERSION not set');
  }
  return parseInt(version, 10);
}

export function encryptField(plaintext: string): string {
  const version = getCurrentKeyVersion();
  const key = getEncryptionKey(version);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `v${version}:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptField(ciphertext: string): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted field format');
  }

  const version = parseInt(parts[0].slice(1), 10);
  const iv = Buffer.from(parts[1], 'base64');
  const authTag = Buffer.from(parts[2], 'base64');
  const encrypted = Buffer.from(parts[3], 'base64');

  const key = getEncryptionKey(version);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

// Sensitive fields within financial audit responses that require encryption
const SENSITIVE_FINANCIAL_FIELDS = [
  'primary_income',
  'secondary_income',
  'liquid_cash',
  'retirement_accounts',
  'existing_re_equity',
  'other_investments',
  'business_equity',
  'total_monthly_debt',
  'mortgage_rent',
  'student_loans',
  'auto_loans',
  'credit_card_balances',
  'credit_score_range',
  'effective_tax_rate',
];

export function encryptSensitiveFields(responses: Record<string, unknown>, auditType: string): Record<string, unknown> {
  if (auditType !== 'financial') return responses;

  const result = JSON.parse(JSON.stringify(responses));
  for (const section of Object.values(result)) {
    if (typeof section !== 'object' || section === null) continue;
    for (const [key, value] of Object.entries(section as Record<string, unknown>)) {
      if (SENSITIVE_FINANCIAL_FIELDS.includes(key) && typeof value === 'string') {
        (section as Record<string, unknown>)[key] = encryptField(value);
      }
    }
  }
  return result;
}

export function decryptSensitiveFields(responses: Record<string, unknown>, auditType: string): Record<string, unknown> {
  if (auditType !== 'financial') return responses;

  const result = JSON.parse(JSON.stringify(responses));
  for (const section of Object.values(result)) {
    if (typeof section !== 'object' || section === null) continue;
    for (const [key, value] of Object.entries(section as Record<string, unknown>)) {
      if (SENSITIVE_FINANCIAL_FIELDS.includes(key) && typeof value === 'string' && value.startsWith('v')) {
        try {
          (section as Record<string, unknown>)[key] = decryptField(value);
        } catch (err) {
          // Field may not be encrypted (e.g., legacy plain text data).
          // If it looks like an encrypted value (v\d:...) but fails, log a warning.
          if (/^v\d+:/.test(value)) {
            logger.warn({ field: key, err }, 'Failed to decrypt field that appears encrypted');
          }
        }
      }
    }
  }
  return result;
}
