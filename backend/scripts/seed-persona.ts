/**
 * Seed one persona (or all ten) as a fresh user with its five audits completed.
 *
 *   npm run seed:persona -- A                 # user + audits, no model call
 *   npm run seed:persona -- A --generate      # + identity synthesis and strategies (2 model calls + insight warm-up)
 *   npm run seed:persona -- A --activate      # + activate the rank-1 strategy (the activation plan is a further call)
 *   npm run seed:personas [-- --generate]     # all ten
 *   npm run seed:clean                        # remove every seeded persona user
 *
 * Gated on NODE_ENV != production AND ENABLE_DEV_SEED=true (modules/dev-seed/guard.ts). Runs against
 * whatever ANTHROPIC_BASE_URL points at — the mock server (scripts/mock-anthropic.mjs) costs nothing.
 */
// A CLI, not the server: no pretty request logs, no Prisma query echo. .env values never override
// what is already set (process.loadEnvFile semantics), so these defaults win over NODE_ENV=development there.
process.env.NODE_ENV ??= 'script';
process.env.LOG_LEVEL ??= 'warn';

import { assertDevSeedEnabled } from '../src/modules/dev-seed/guard.js';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const positional = args.filter((a) => !a.startsWith('--'));

async function main() {
  const seeding = await import('../src/modules/dev-seed/seeding.js');
  seeding.loadDotEnv();
  assertDevSeedEnabled();
  const { PERSONA_LETTERS, loadPersona, normalizeLetter } = await import('../src/modules/dev-seed/fixtures.js');
  const { prisma } = await import('../src/shared/db.js');

  try {
    if (flags.has('--clean')) {
      const n = await seeding.cleanPersonaUsers();
      console.log(`Removed ${n} persona user(s).`);
      return;
    }

    const which = positional[0] ?? 'all';
    const letters = which === 'all' ? [...PERSONA_LETTERS] : which.split(',').map(normalizeLetter);
    const generate = flags.has('--generate') || flags.has('--activate');
    const activate = flags.has('--activate');
    if (generate) {
      const { AI_MODEL } = await import('../src/shared/ai/client.js');
      console.log(`Model: ${AI_MODEL}  base URL: ${process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com'}`);
    }

    for (const letter of letters) {
      const fixture = loadPersona(letter);
      const user = await seeding.createPersonaUser(letter);
      const audits = await seeding.completeAudits(user, fixture);
      console.log(`\n[${letter}] ${fixture.label}`);
      console.log(`  email:    ${user.email}`);
      console.log(`  password: ${user.password}`);
      console.log(`  user id:  ${user.publicId}`);
      console.log(`  audits:   ${audits.map((a) => `${a.auditType} v${a.version} (${a.subScore})`).join(', ')}`);
      if (generate) {
        const calls = await seeding.generateForUser(user, { activate, log: (l) => console.log(`  ${l}`) });
        for (const c of calls) {
          console.log(`  call: ${c.serviceType} ${c.success ? 'ok' : 'FAILED'} in=${c.inputTokens} out=${c.outputTokens} ${c.latencyMs} ms`);
        }
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
