import { validateEmail, validatePassword, validateRegisterInput, validateLoginInput, validateResetPasswordInput } from './validation';
import { AppError } from '../../shared/middleware/error-handler';

describe('validateEmail', () => {
  it('accepts a valid email and lowercases it', () => {
    expect(validateEmail('Test@Example.COM')).toBe('test@example.com');
  });

  it('rejects email with leading/trailing whitespace', () => {
    // Regex validates before trim, so spaces cause rejection
    expect(() => validateEmail(' test@example.com ')).toThrow(AppError);
  });

  it('rejects non-string input', () => {
    expect(() => validateEmail(null)).toThrow(AppError);
    expect(() => validateEmail(undefined)).toThrow(AppError);
    expect(() => validateEmail(42)).toThrow(AppError);
  });

  it('rejects email without @', () => {
    expect(() => validateEmail('notanemail')).toThrow(AppError);
  });

  it('rejects email without domain TLD', () => {
    expect(() => validateEmail('user@localhost')).toThrow(AppError);
  });

  it('rejects empty string', () => {
    expect(() => validateEmail('')).toThrow(AppError);
  });
});

describe('validatePassword', () => {
  it('accepts a valid password', () => {
    expect(validatePassword('mypassword123')).toBe('mypassword123');
  });

  it('rejects password shorter than 8 chars', () => {
    expect(() => validatePassword('short')).toThrow(AppError);
  });

  it('rejects password longer than 128 chars', () => {
    expect(() => validatePassword('a'.repeat(129))).toThrow(AppError);
  });

  it('accepts exactly 8 char password', () => {
    expect(validatePassword('12345678')).toBe('12345678');
  });

  it('accepts exactly 128 char password', () => {
    const pwd = 'a'.repeat(128);
    expect(validatePassword(pwd)).toBe(pwd);
  });

  it('rejects non-string input', () => {
    expect(() => validatePassword(null)).toThrow(AppError);
    expect(() => validatePassword(123)).toThrow(AppError);
  });
});

describe('validateRegisterInput', () => {
  it('validates and returns email + password', () => {
    const result = validateRegisterInput({ email: 'Test@EXAMPLE.com', password: 'password123' });
    expect(result).toEqual({ email: 'test@example.com', password: 'password123' });
  });

  it('throws on missing email', () => {
    expect(() => validateRegisterInput({ password: 'password123' })).toThrow(AppError);
  });

  it('throws on missing password', () => {
    expect(() => validateRegisterInput({ email: 'test@example.com' })).toThrow(AppError);
  });
});

describe('validateLoginInput', () => {
  it('validates and returns email + password', () => {
    const result = validateLoginInput({ email: 'user@example.com', password: 'password123' });
    expect(result).toEqual({ email: 'user@example.com', password: 'password123' });
  });
});

describe('validateResetPasswordInput', () => {
  it('validates and returns token + password', () => {
    const result = validateResetPasswordInput({ token: 'abc123', password: 'newpass12' });
    expect(result).toEqual({ token: 'abc123', password: 'newpass12' });
  });

  it('rejects empty token', () => {
    expect(() => validateResetPasswordInput({ token: '', password: 'newpass12' })).toThrow(AppError);
  });

  it('rejects non-string token', () => {
    expect(() => validateResetPasswordInput({ token: 42, password: 'newpass12' })).toThrow(AppError);
  });
});
