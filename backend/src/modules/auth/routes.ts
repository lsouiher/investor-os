import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../shared/middleware/auth.js';
import { authLimiter, forgotPasswordLimiter, resetPasswordLimiter } from '../../shared/middleware/rate-limiter.js';
import { validateRegisterInput, validateLoginInput, validateResetPasswordInput, validateEmail } from './validation.js';
import * as authService from './service.js';

const router = Router();

router.post('/register', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = validateRegisterInput(req.body);
    const result = await authService.register(email, password);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/login', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = validateLoginInput(req.body);
    const result = await authService.login(email, password);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await authService.getProfile(req.user!.userId);
    res.status(200).json({ data: profile });
  } catch (err) {
    next(err);
  }
});

router.post('/forgot-password', forgotPasswordLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = validateEmail(req.body.email);
    await authService.forgotPassword(email);
    res.status(200).json({ data: { message: 'If an account exists, a reset email has been sent.' } });
  } catch (err) {
    next(err);
  }
});

router.post('/reset-password', resetPasswordLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = validateResetPasswordInput(req.body);
    await authService.resetPassword(token, password);
    res.status(200).json({ data: { message: 'Password has been reset.' } });
  } catch (err) {
    next(err);
  }
});

export default router;
