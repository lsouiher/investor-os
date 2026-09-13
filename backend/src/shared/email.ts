import { Resend } from 'resend';
import { logger } from './logger.js';

// Transactional email through Resend. Without RESEND_API_KEY (local dev, tests) nothing is
// sent and the message is logged instead, so the password-reset flow still works end to end.
let client: Resend | null = null;

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export function appUrl(): string {
  return (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resetUrl = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const resend = getClient();

  if (!resend) {
    logger.warn({ to, resetUrl }, 'RESEND_API_KEY not set — password reset link logged instead of emailed');
    return;
  }

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'InvestorOS <onboarding@resend.dev>',
    to,
    subject: 'Reset your InvestorOS password',
    text: [
      'Someone asked to reset the password for this InvestorOS account.',
      '',
      `Reset it here (the link works for one hour): ${resetUrl}`,
      '',
      "If that wasn't you, ignore this email and your password stays the same.",
    ].join('\n'),
  });

  if (error) {
    // The caller already answered "if an account exists, an email was sent"; log loudly and move on.
    logger.error({ err: error, to }, 'Password reset email failed to send');
  }
}
