import { validateEmail, validatePassword, validateLocale, validateRegisterInput, validateLoginInput, validateResetPasswordInput } from './validation';
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

describe('messages', () => {
  const thrownBy = (fn: () => unknown): AppError => {
    try {
      fn();
    } catch (err) {
      return err as AppError;
    }
    throw new Error('expected a validation error');
  };

  it('keeps the English text as it was', () => {
    const err = thrownBy(() => validatePassword('short'));
    expect(err.message).toBe('Password too short.');
    expect(err.details).toEqual([{ field: 'password', message: 'Must be at least 8 characters.' }]);
    expect(thrownBy(() => validateEmail('nope')).details).toEqual([{ field: 'email', message: 'Must be a valid email address.' }]);
  });

  it('renders the message and details[].message in French', () => {
    expect(thrownBy(() => validatePassword('a'.repeat(129))).render('fr')).toEqual({
      message: 'Mot de passe trop long.',
      details: [{ field: 'password', message: 'Doit contenir au plus 128 caractères.' }],
    });
    expect(thrownBy(() => validateEmail('nope')).render('fr')).toEqual({
      message: 'Format de courriel non valide.',
      details: [{ field: 'email', message: 'Doit être une adresse courriel valide.' }],
    });
  });
});

describe('validateLocale', () => {
  it('accepts en and fr', () => {
    expect(validateLocale('en')).toBe('en');
    expect(validateLocale('fr')).toBe('fr');
  });

  it('rejects anything else', () => {
    for (const value of ['es', 'fr-CA', 'FR', '', null, undefined, 42, ['fr'], { locale: 'fr' }]) {
      expect(() => validateLocale(value)).toThrow(AppError);
    }
  });

  it('reports a VALIDATION_ERROR on the locale field', () => {
    try {
      validateLocale('es');
      throw new Error('expected validateLocale to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appError = err as AppError;
      expect(appError.code).toBe('VALIDATION_ERROR');
      expect(appError.statusCode).toBe(400);
      expect(appError.details).toEqual([{ field: 'locale', message: 'Must be one of: en, fr.' }]);
    }
  });

  it('is rendered in the language of the request', () => {
    try {
      validateLocale('es');
      throw new Error('expected validateLocale to throw');
    } catch (err) {
      const appError = err as AppError;
      expect(appError.render('en').message).toBe('Invalid language.');
      expect(appError.render('fr').message).toBe('Langue non valide.');
      expect(appError.render('fr').details).toEqual([
        { field: 'locale', message: 'Doit être l’une des valeurs suivantes\u00a0: en, fr.' },
      ]);
    }
  });
});

describe('validateRegisterInput', () => {
  it('validates and returns email + password', () => {
    const result = validateRegisterInput({ email: 'Test@EXAMPLE.com', password: 'password123' });
    expect(result).toEqual({ email: 'test@example.com', password: 'password123', signupSource: null, locale: null });
  });

  it('keeps a supported locale and ignores anything else', () => {
    const base = { email: 'a@b.co', password: 'password123' };
    expect(validateRegisterInput({ ...base, locale: 'fr' }).locale).toBe('fr');
    expect(validateRegisterInput({ ...base, locale: 'en' }).locale).toBe('en');
    expect(validateRegisterInput({ ...base, locale: 'es' }).locale).toBeNull();
    expect(validateRegisterInput({ ...base, locale: 'fr-CA' }).locale).toBeNull();
    expect(validateRegisterInput({ ...base, locale: 42 }).locale).toBeNull();
    expect(validateRegisterInput(base).locale).toBeNull();
  });

  it('keeps a well-formed signup_source and drops anything else', () => {
    expect(validateRegisterInput({ email: 'a@b.co', password: 'password123', signup_source: ' BPCON ' }).signupSource).toBe('bpcon');
    expect(validateRegisterInput({ email: 'a@b.co', password: 'password123', signup_source: '<script>' }).signupSource).toBeNull();
    expect(validateRegisterInput({ email: 'a@b.co', password: 'password123', signup_source: 'x'.repeat(33) }).signupSource).toBeNull();
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
