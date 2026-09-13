/**
 * Beta funnel, straight from the database. Run against production:
 *
 *   npm run funnel            # everyone
 *   npm run funnel -- 7       # accounts created in the last 7 days
 *
 * Prints, overall and per signup_source: registered → all five audits complete → identity
 * revealed → strategy activated → growth strategy created → came back a week later, plus
 * ratings and every free-text feedback so far. Audit completion is the number that decides
 * whether the twenty-minute ask is worth it to a stranger.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FunnelRow {
  source: string;
  registered: number;
  audits_complete: number;
  identity: number;
  activated: number;
  growth: number;
  returned_week2: number;
}

async function main() {
  const days = Number(process.argv[2]);
  const since = Number.isFinite(days) && days > 0 ? new Date(Date.now() - days * 86_400_000) : new Date(0);

  const rows = await prisma.$queryRaw<FunnelRow[]>`
    WITH u AS (
      SELECT id, tenant_id, coalesce(signup_source, 'direct') AS source, created_at, last_login_at
      FROM users
      WHERE deleted_at IS NULL AND created_at >= ${since}
    ),
    audits AS (
      SELECT user_id FROM audits WHERE status = 'completed'
      GROUP BY user_id HAVING count(DISTINCT audit_type) >= 5
    ),
    identity AS (SELECT DISTINCT user_id FROM identity_versions),
    activated AS (SELECT DISTINCT user_id FROM strategies WHERE is_active),
    growth AS (SELECT DISTINCT user_id FROM growth_strategies)
    SELECT
      u.source,
      count(*)::int AS registered,
      count(a.user_id)::int AS audits_complete,
      count(i.user_id)::int AS identity,
      count(s.user_id)::int AS activated,
      count(g.user_id)::int AS growth,
      count(*) FILTER (WHERE u.last_login_at >= u.created_at + interval '7 days')::int AS returned_week2
    FROM u
    LEFT JOIN audits a ON a.user_id = u.id
    LEFT JOIN identity i ON i.user_id = u.id
    LEFT JOIN activated s ON s.user_id = u.id
    LEFT JOIN growth g ON g.user_id = u.id
    GROUP BY ROLLUP (u.source)
    ORDER BY u.source NULLS FIRST
  `;

  const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}%` : '-');
  console.log(`Funnel${days ? ` (last ${days} days)` : ''}\n`);
  console.log('source        registered  5 audits  identity  activated  growth  back wk2');
  for (const r of rows) {
    const name = (r.source ?? 'ALL').padEnd(12);
    console.log(
      `${name}  ${String(r.registered).padStart(10)}  ${String(r.audits_complete).padStart(4)} ${pct(r.audits_complete, r.registered).padStart(4)}` +
        `  ${String(r.identity).padStart(4)} ${pct(r.identity, r.registered).padStart(4)}  ${String(r.activated).padStart(5)} ${pct(r.activated, r.registered).padStart(4)}` +
        `  ${String(r.growth).padStart(4)}  ${String(r.returned_week2).padStart(5)} ${pct(r.returned_week2, r.registered).padStart(4)}`,
    );
  }

  const ratings = await prisma.identityVersion.aggregate({
    where: { userRating: { not: null }, user: { deletedAt: null, createdAt: { gte: since } } },
    _avg: { userRating: true },
    _count: { userRating: true },
  });
  console.log(`\nIdentity rating: ${ratings._count.userRating} ratings, avg ${ratings._avg.userRating?.toFixed(2) ?? '-'} / 5`);

  const feedback = await prisma.identityVersion.findMany({
    where: { userFeedback: { not: null }, user: { deletedAt: null, createdAt: { gte: since } } },
    select: { userRating: true, userFeedback: true, archetype: true, generatedAt: true },
    orderBy: { generatedAt: 'desc' },
    take: 50,
  });
  if (feedback.length) {
    console.log('\nWhat people wrote:');
    for (const f of feedback) {
      console.log(`- [${f.userRating}/5, ${f.archetype}, ${f.generatedAt.toISOString().slice(0, 10)}] ${f.userFeedback}`);
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
