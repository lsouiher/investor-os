/**
 * Persona eval harness: seed → synthesize → strategies → (activate) for each persona × n, price every
 * call, run the fixture's must_include / must_exclude assertions, and write
 *
 *   docs/evals/results/<model>/<timestamp>/raw/<persona>-<run>.json   (gitignored: full outputs)
 *   docs/evals/results/<model>/<timestamp>/summary.json               (committed)
 *   docs/evals/results/<model>/<timestamp>/SUMMARY.md                 (committed: the ten-row table)
 *
 *   npm run eval:personas -- [--n 1] [--persona A,I] [--activate] [--model <id>] [--keep] --yes
 *   npm run eval:personas -- --dry [--from docs/evals/results/<model>/<timestamp>]
 *
 * --dry replays the stored raw outputs through the assertions (no seeding, no model call) and
 * rewrites that directory's SUMMARY.md / summary.json. Without --yes the harness prints the model
 * and the estimated cost and stops. Gated like the seed CLI (NODE_ENV != production, ENABLE_DEV_SEED=true).
 */
// A CLI, not the server: no pretty request logs, no Prisma query echo (see seed-persona.ts)
process.env.NODE_ENV ??= 'script';
process.env.LOG_LEVEL ??= 'warn';

import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { assertDevSeedEnabled } from '../src/modules/dev-seed/guard.js';
import { evaluateFixture, summarizeResults, type AssertionResult, type EvalOutput } from '../src/modules/dev-seed/assertions.js';
import { PERSONA_LETTERS, loadPersona, normalizeLetter, type PersonaLetter } from '../src/modules/dev-seed/fixtures.js';

const REPO_ROOT = path.resolve(__dirname, '../..');
const RESULTS_ROOT = path.join(REPO_ROOT, 'docs/evals/results');
const PRICING_FILE = path.join(__dirname, '../config/ai-pricing.json');

// Rough per-call token shapes for the estimate only; the summary uses real usage
const ESTIMATE = {
  identity_synthesis: { input: 5000, output: 3000 },
  strategy_generation: { input: 2000, output: 1500 },
  insight: { input: 2000, output: 1000 },
  strategy_activation: { input: 2500, output: 2500 },
};

interface Pricing { input: number; output: number }
interface CallRecord { service_type: string; model: string; input_tokens: number; output_tokens: number; cost_usd: number; latency_ms: number; stop_reason: string | null; success: boolean; error?: string }
interface RawRun {
  persona: PersonaLetter;
  label: string;
  run: number;
  model: string;
  started_at: string;
  user: { email: string; public_id: string } | null;
  calls: CallRecord[];
  output: EvalOutput;
}
interface SummaryRow {
  persona: PersonaLetter;
  label: string;
  run: number;
  archetype: string | null;
  readiness: number | null;
  sub_scores: Record<string, number> | null;
  strategies: string[];
  assertions: ReturnType<typeof summarizeResults>;
  results: AssertionResult[];
  calls: CallRecord[];
  cost_usd: number;
  latency_ms: number;
}

function parseArgs(argv: string[]) {
  const opts = { n: 1, personas: [...PERSONA_LETTERS] as PersonaLetter[], dry: false, from: '', yes: false, activate: false, model: '', keep: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--n') opts.n = Math.max(1, parseInt(next(), 10) || 1);
    else if (a === '--persona') opts.personas = next().split(',').map(normalizeLetter);
    else if (a === '--dry') opts.dry = true;
    else if (a === '--from') opts.from = next();
    else if (a === '--yes') opts.yes = true;
    else if (a === '--activate') opts.activate = true;
    else if (a === '--model') opts.model = next();
    else if (a === '--keep') opts.keep = true;
    else throw new Error(`Unknown argument ${a}`);
  }
  return opts;
}

function loadPricing(): Record<string, Pricing> {
  const raw = JSON.parse(readFileSync(PRICING_FILE, 'utf8')) as Record<string, Pricing | string>;
  return Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith('_'))) as Record<string, Pricing>;
}

function price(p: Pricing, input: number, output: number): number {
  return (input * p.input + output * p.output) / 1_000_000;
}

function money(n: number): string {
  return `$${n.toFixed(4)}`;
}

function timestamp(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z').replace('T', '-');
}

function safeModelDir(model: string): string {
  return model.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function latestResultsDir(): string | null {
  if (!existsSync(RESULTS_ROOT)) return null;
  const dirs: string[] = [];
  for (const model of readdirSync(RESULTS_ROOT)) {
    const modelDir = path.join(RESULTS_ROOT, model);
    if (!statSync(modelDir).isDirectory()) continue;
    for (const ts of readdirSync(modelDir)) {
      const d = path.join(modelDir, ts);
      if (statSync(d).isDirectory() && existsSync(path.join(d, 'raw'))) dirs.push(d);
    }
  }
  dirs.sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
  return dirs.at(-1) ?? null;
}

function summarizeRun(raw: RawRun): SummaryRow {
  const results = evaluateFixture(loadPersona(raw.persona), raw.output);
  return {
    persona: raw.persona,
    label: raw.label,
    run: raw.run,
    archetype: raw.output.identity?.archetype ?? null,
    readiness: raw.output.identity?.readiness_score ?? null,
    sub_scores: raw.output.identity?.sub_scores ?? null,
    strategies: [...raw.output.strategies].sort((a, b) => a.rank - b.rank).map((s) => s.name),
    assertions: summarizeResults(results),
    results,
    calls: raw.calls,
    cost_usd: raw.calls.reduce((s, c) => s + c.cost_usd, 0),
    latency_ms: raw.calls.reduce((s, c) => s + c.latency_ms, 0),
  };
}

function writeSummary(dir: string, model: string, rows: SummaryRow[], meta: Record<string, unknown>) {
  const totalCost = rows.reduce((s, r) => s + r.cost_usd, 0);
  const passed = rows.reduce((s, r) => s + r.assertions.passed, 0);
  const total = rows.reduce((s, r) => s + r.assertions.total, 0);
  const skipped = rows.reduce((s, r) => s + r.assertions.skipped, 0);
  const failedRows = rows.filter((r) => r.assertions.failed > 0).length;

  writeFileSync(path.join(dir, 'summary.json'), JSON.stringify({ model, ...meta, totals: { cost_usd: totalCost, assertions_passed: passed, assertions_total: total, assertions_skipped: skipped }, rows }, null, 2) + '\n');

  const esc = (s: string | null | undefined) => (s ?? '—').replace(/\|/g, '\\|');
  const lines = [
    `# Persona eval — ${model}`,
    '',
    `Run: ${meta.started_at} · n=${meta.n} · activate=${meta.activate} · base URL: ${meta.base_url}`,
    `Assertions: ${passed}/${total} passed (${skipped} skipped${meta.activate ? '' : ', action-plan checks need --activate'}) · rows with a failure: ${failedRows}/${rows.length} · cost ${money(totalCost)}`,
    '',
    meta.mock ? '> **Mock run.** The mock server answers every persona with the same identity and strategies, so content assertions fail by design; this run proves the plumbing, not the prompts.' : '',
    '',
    '| Persona | Run | Archetype | Readiness | Strategy 1 | Strategy 2 | Strategy 3 | Assertions | Cost |',
    '|---|---|---|---|---|---|---|---|---|',
    ...rows.map((r) =>
      `| ${r.persona} — ${esc(r.label)} | ${r.run} | ${esc(r.archetype)} | ${r.readiness ?? '—'} | ${esc(r.strategies[0])} | ${esc(r.strategies[1])} | ${esc(r.strategies[2])} | ${r.assertions.passed}/${r.assertions.total - r.assertions.skipped}${r.assertions.failed ? ' ✗' : ' ✓'} | ${money(r.cost_usd)} |`,
    ),
    '',
    '## Failed assertions',
    '',
    ...rows.flatMap((r) => r.results.filter((x) => x.status === 'fail').map((x) => `- **${r.persona}** run ${r.run} — must ${x.kind}: ${x.detail}`)),
    '',
    '## Calls',
    '',
    '| Persona | Run | Call | In | Out | Latency | Cost | Stop |',
    '|---|---|---|---|---|---|---|---|',
    ...rows.flatMap((r) => r.calls.map((c) => `| ${r.persona} | ${r.run} | ${c.service_type}${c.success ? '' : ' (failed)'} | ${c.input_tokens} | ${c.output_tokens} | ${(c.latency_ms / 1000).toFixed(1)} s | ${money(c.cost_usd)} | ${c.stop_reason ?? '—'} |`)),
    '',
  ];
  writeFileSync(path.join(dir, 'SUMMARY.md'), lines.filter((l, i, arr) => !(l === '' && arr[i - 1] === '')).join('\n'));
}

async function dryRun(opts: ReturnType<typeof parseArgs>) {
  const dir = opts.from ? path.resolve(opts.from) : latestResultsDir();
  if (!dir || !existsSync(path.join(dir, 'raw'))) throw new Error(`No stored run found${opts.from ? ` at ${opts.from}` : ' under docs/evals/results'}`);
  const files = readdirSync(path.join(dir, 'raw')).filter((f) => f.endsWith('.json')).sort();
  const raws = files.map((f) => JSON.parse(readFileSync(path.join(dir, 'raw', f), 'utf8')) as RawRun).filter((r) => opts.personas.includes(r.persona));
  if (raws.length === 0) throw new Error(`No raw outputs for ${opts.personas.join(',')} in ${dir}`);
  const previous = existsSync(path.join(dir, 'summary.json')) ? JSON.parse(readFileSync(path.join(dir, 'summary.json'), 'utf8')) : {};
  const rows = raws.map(summarizeRun);
  const model = raws[0].model;
  writeSummary(dir, model, rows, { ...previous, model: undefined, totals: undefined, rows: undefined, replayed_at: new Date().toISOString(), dry: true });
  console.log(`Replayed ${rows.length} run(s) from ${path.relative(REPO_ROOT, dir)} — no model call.`);
  for (const r of rows) console.log(`  ${r.persona} run ${r.run}: ${r.assertions.passed}/${r.assertions.total - r.assertions.skipped} assertions passed${r.assertions.failed ? ` (${r.assertions.failed} failed)` : ''}`);
  console.log(`SUMMARY.md rewritten in ${path.relative(REPO_ROOT, dir)}`);
}

async function liveRun(opts: ReturnType<typeof parseArgs>) {
  if (opts.model) process.env.ANTHROPIC_MODEL = opts.model; // must precede the client import: AI_MODEL is read at load
  const { AI_MODEL } = await import('../src/shared/ai/client.js');
  const seeding = await import('../src/modules/dev-seed/seeding.js');
  const { prisma } = await import('../src/shared/db.js');

  const pricing = loadPricing();
  const p = pricing[AI_MODEL];
  const baseUrl = process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com';
  const mock = /localhost|127\.0\.0\.1/.test(baseUrl);
  const runs = opts.personas.length * opts.n;
  const perPersona: Array<keyof typeof ESTIMATE> = ['identity_synthesis', 'strategy_generation', 'insight', ...(opts.activate ? (['strategy_activation'] as const) : [])];

  console.log(`Model:    ${AI_MODEL}${opts.model ? ' (overridden for this run)' : ' (ANTHROPIC_MODEL)'}`);
  console.log(`Base URL: ${baseUrl}${mock ? '  ← mock, no cost' : ''}`);
  console.log(`Runs:     ${opts.personas.join(',')} × n=${opts.n} = ${runs}, ${perPersona.length} calls each${opts.activate ? ' (with activation)' : ''}`);
  if (!p) {
    console.error(`No prices for "${AI_MODEL}" in config/ai-pricing.json — add them before running.`);
    process.exit(1);
  }
  const estPerRun = perPersona.reduce((s, t) => s + price(p, ESTIMATE[t].input, ESTIMATE[t].output), 0);
  console.log(`Estimate: ${money(estPerRun)} per run → ${money(estPerRun * runs)} total at $${p.input}/$${p.output} per MTok${mock ? ' (would-be cost; the mock is free)' : ''}`);
  if (!opts.yes) {
    console.log('Refusing to run without --yes.');
    process.exit(2);
  }

  seeding.loadDotEnv();
  const startedAt = new Date();
  const dir = path.join(RESULTS_ROOT, safeModelDir(AI_MODEL), timestamp());
  mkdirSync(path.join(dir, 'raw'), { recursive: true });
  console.log(`Writing to ${path.relative(REPO_ROOT, dir)}\n`);

  const rows: SummaryRow[] = [];
  try {
    for (const letter of opts.personas) {
      const fixture = loadPersona(letter);
      for (let run = 1; run <= opts.n; run++) {
        const tag = `${startedAt.getTime().toString(36)}-r${run}`;
        console.log(`[${letter} run ${run}] ${fixture.label}`);
        const user = await seeding.createPersonaUser(letter, tag);
        const raw: RawRun = { persona: letter, label: fixture.label, run, model: AI_MODEL, started_at: new Date().toISOString(), user: { email: user.email, public_id: user.publicId }, calls: [], output: { identity: null, strategies: [], action_plan: null } };
        try {
          await seeding.completeAudits(user, fixture);
          const calls = await seeding.generateForUser(user, { activate: opts.activate, log: (l) => console.log(`  ${l}`) });
          raw.calls = calls.map((c) => ({
            service_type: c.serviceType,
            model: c.model,
            input_tokens: c.inputTokens,
            output_tokens: c.outputTokens,
            cost_usd: price(pricing[c.model] ?? p, c.inputTokens, c.outputTokens),
            latency_ms: c.latencyMs,
            stop_reason: c.stopReason,
            success: c.success,
            ...(c.error ? { error: c.error } : {}),
          }));
          raw.output = await seeding.collectOutput(user);
        } catch (err) {
          console.error(`  FAILED: ${(err as Error).message}`);
          raw.calls.push({ service_type: 'pipeline', model: AI_MODEL, input_tokens: 0, output_tokens: 0, cost_usd: 0, latency_ms: 0, stop_reason: null, success: false, error: (err as Error).message });
        }
        writeFileSync(path.join(dir, 'raw', `${letter}-${run}.json`), JSON.stringify(raw, null, 2) + '\n');
        const row = summarizeRun(raw);
        rows.push(row);
        console.log(`  → ${row.archetype ?? '—'} / ${row.readiness ?? '—'} · ${row.assertions.passed}/${row.assertions.total - row.assertions.skipped} assertions · ${money(row.cost_usd)}\n`);
        if (!opts.keep) await seeding.deletePersonaUser(user.userId);
      }
    }
  } finally {
    writeSummary(dir, AI_MODEL, rows, { started_at: startedAt.toISOString(), n: opts.n, personas: opts.personas, activate: opts.activate, base_url: baseUrl, mock, model_overridden: Boolean(opts.model), kept_users: opts.keep });
    await prisma.$disconnect();
  }
  const total = rows.reduce((s, r) => s + r.cost_usd, 0);
  console.log(`Done. ${rows.length} run(s), ${money(total)}. Summary: ${path.relative(REPO_ROOT, path.join(dir, 'SUMMARY.md'))}`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.dry) {
    await dryRun(opts);
    return;
  }
  // Env first (the model id may come from .env), then the gate
  const { loadDotEnv } = await import('../src/modules/dev-seed/seeding.js');
  loadDotEnv();
  assertDevSeedEnabled();
  await liveRun(opts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
