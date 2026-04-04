import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { prisma } from './shared/db.js';
import { errorHandler } from './shared/middleware/error-handler.js';
import { requestLogger } from './shared/middleware/request-logger.js';
import { generalLimiter } from './shared/middleware/rate-limiter.js';
import { authenticate } from './shared/middleware/auth.js';
import { setTenantContext } from './shared/middleware/tenant-context.js';
import { logger } from './shared/logger.js';
import authRoutes from './modules/auth/routes.js';
import adminRoutes from './modules/admin/routes.js';
import auditRoutes from './modules/audit/routes.js';
import identityRoutes from './modules/identity/routes.js';
import strategyRoutes from './modules/strategy/routes.js';
import simulationRoutes from './modules/simulation/routes.js';
import blueprintRoutes from './modules/blueprint/routes.js';
import contactRoutes from './modules/contact/routes.js';
import taskRoutes from './modules/task/routes.js';
import dashboardRoutes from './modules/dashboard/routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for accurate IP in rate limiting behind load balancers
app.set('trust proxy', 1);

// Global middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true,
}));
app.use(express.json({ limit: '50kb' }));
app.use(requestLogger);
app.use(generalLimiter);

// Health check (no auth)
app.get('/api/v1/health', async (_req, res) => {
  const checks = { db: false, ai: false, encryption: false };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = true;
  } catch { /* db unreachable */ }

  checks.ai = !!process.env.ANTHROPIC_API_KEY;
  checks.encryption = !!process.env.AUDIT_ENCRYPTION_KEY_V1 && !!process.env.CURRENT_ENCRYPTION_KEY_VERSION;

  const allOk = Object.values(checks).every(Boolean);
  const anyOk = Object.values(checks).some(Boolean);
  const status = allOk ? 'ok' : anyOk ? 'degraded' : 'down';

  res.status(allOk ? 200 : 503).json({ data: { status, checks } });
});

// Public routes (no auth)
app.use('/api/v1/auth', authRoutes);

// Authenticated routes — apply auth + tenant context
app.use('/api/v1', authenticate, setTenantContext);

// Module routes (auth required)
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/audits', auditRoutes);
app.use('/api/v1/identity', identityRoutes);
app.use('/api/v1/strategies', strategyRoutes);
app.use('/api/v1/simulations', simulationRoutes);
app.use('/api/v1/blueprint', blueprintRoutes);
app.use('/api/v1/contacts', contactRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Error handler (must be last)
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

export default app;
