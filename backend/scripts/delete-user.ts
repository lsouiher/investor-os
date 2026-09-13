/**
 * Erase a user's data on request and deactivate the account.
 *
 *   npm run delete-user -- someone@example.com
 *
 * The beta terms promise "we erase your audit answers and generated results right away and
 * deactivate the account". Rows stay (append-only tables, foreign keys, funnel counts) but
 * every field that carries the person's answers, generated content or contact details is
 * blanked, the email is replaced so it can be used to register again, and the account is
 * soft-deleted with all sessions invalidated.
 */
import { randomBytes } from 'crypto';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const EMPTY: Prisma.InputJsonValue = {};

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error('Usage: npm run delete-user -- <email>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No account for ${email}`);
    process.exit(1);
  }
  const where = { userId: user.id, tenantId: user.tenantId };
  const now = new Date();

  const counts = await prisma.$transaction(async (tx) => {
    const audits = await tx.audit.updateMany({ where, data: { responses: EMPTY } });
    const identities = await tx.identityVersion.updateMany({
      where,
      data: { archetype: 'deleted', headlineInsight: '', aiInsights: EMPTY, subScores: EMPTY, radarData: EMPTY, userFeedback: null },
    });
    const strategies = await tx.strategy.updateMany({
      where,
      data: { description: '', pros: [], cons: [], actionPlan: Prisma.DbNull, roadmap: Prisma.DbNull, microPlan: Prisma.DbNull },
    });
    const simulations = await tx.simulation.updateMany({ where, data: { modifiedParameters: EMPTY, resultDelta: EMPTY } });
    const growthPaths = await tx.growthPath.updateMany({ where, data: { content: EMPTY, actionItems: [], summary: null } });
    const growthStrategies = await tx.growthStrategy.updateMany({ where, data: { crossPathLinks: [], nextBestAction: Prisma.DbNull } });
    const aiLogs = await tx.aiCallLog.updateMany({ where, data: { fullPrompt: '', fullResponse: '' } });
    const contacts = await tx.contact.updateMany({
      where,
      data: { name: 'deleted', email: null, phone: null, notes: null, deletedAt: now },
    });
    const tasks = await tx.task.updateMany({ where, data: { title: 'deleted', description: null, deletedAt: now } });
    await tx.user.update({
      where: { id: user.id },
      data: {
        email: `deleted-${user.id}@deleted.invalid`,
        passwordHash: randomBytes(32).toString('hex'),
        insightsCache: Prisma.DbNull,
        insightsGeneratedAt: null,
        deletedAt: now,
        tokenInvalidatedAt: now,
      },
    });
    return {
      audits: audits.count,
      identities: identities.count,
      strategies: strategies.count,
      simulations: simulations.count,
      growthPaths: growthPaths.count,
      growthStrategies: growthStrategies.count,
      aiLogs: aiLogs.count,
      contacts: contacts.count,
      tasks: tasks.count,
    };
  });

  console.log(`Erased and deactivated ${email} (user ${user.publicId}):`, counts);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
