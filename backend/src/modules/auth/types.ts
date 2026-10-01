import type { Locale } from '../../shared/i18n.js';

export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: string;
    locale: Locale;
  };
  token: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  locale: Locale;
  createdAt: string;
}
