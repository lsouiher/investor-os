#!/usr/bin/env node
/**
 * Mock Anthropic Messages API for local development and smoke tests.
 *
 * Emulates POST /v1/messages and GET /v1/models/:id, returning schema-valid JSON for each
 * InvestorOS prompt type (detected from the prompt text). No network, no cost, deterministic.
 *
 * Usage:
 *   node scripts/mock-anthropic.mjs                      # listens on :3999
 *   ANTHROPIC_BASE_URL=http://localhost:3999 ANTHROPIC_API_KEY=sk-ant-mock npm run dev
 */
import http from 'node:http';

const PORT = Number(process.env.MOCK_AI_PORT || 3999);

const actionItems = (prefix) => [
  { title: `${prefix}: Define target market and buy box`, description: 'Pick 2 submarkets and write acquisition criteria.', timeframe: '0-3 months', category: 'research', identity_impact: 'Raises goal clarity', priority_score: 90 },
  { title: `${prefix}: Get pre-approved with two lenders`, description: 'Compare DSCR and conventional terms.', timeframe: '0-3 months', category: 'financing', identity_impact: 'Raises capital readiness', priority_score: 85 },
  { title: `${prefix}: Build a 3-contractor bench`, description: 'Interview and get bids from three GCs.', timeframe: '3-6 months', category: 'network', identity_impact: 'Fills contractor gap', priority_score: 70 },
  { title: `${prefix}: Close first deal`, description: 'Execute on the buy box with reserves in place.', timeframe: '6-12 months', category: 'acquisition', identity_impact: 'Unlocks portfolio growth', priority_score: 95 },
];

const responses = {
  identity_synthesis: () => ({
    archetype: 'Analytical Cash Flow Builder',
    readiness_score: 74,
    sub_scores: { financial: 78, time: 62, skills: 70, risk: 80, horizon: 82 },
    radar_data: { capital: 72, time: 60, skills: 68, risk_tolerance: 80, network: 38, goal_clarity: 85 },
    headline_insight: 'You have strong capital and clear goals, but a thin network is your binding constraint.',
    ai_insights: {
      contradictions: ['Wants passive income but prefers hands-on control'],
      feasibility: { first_deal_12_months: 'high', full_time_re_10_years: 'medium' },
      gaps: ['No contractor or lender relationships yet'],
      strengths: ['High savings rate', 'Analytical background'],
      recommendations: ['Start with a turnkey duplex to build operating experience'],
    },
  }),
  strategy_generation: () => ({
    strategies: [
      { name: 'House Hack a Small Multifamily', description: 'Buy a 2-4 unit, live in one, rent the rest.', fit_score: 88, pros: ['Low down payment', 'Learn operations safely'], cons: ['Lifestyle compromise'], rank: 1 },
      { name: 'Turnkey Cash Flow Rentals', description: 'Buy stabilized rentals in cash-flow markets.', fit_score: 76, pros: ['Passive', 'Predictable'], cons: ['Lower upside', 'Remote management'], rank: 2 },
      { name: 'BRRRR Light', description: 'Cosmetic rehabs with refinance to recycle capital.', fit_score: 64, pros: ['Capital recycling'], cons: ['Needs contractor bench you lack today'], rank: 3 },
    ],
  }),
  strategy_activation: () => ({
    action_plan: { items: [
      { title: 'Define buy box', description: 'Write acquisition criteria for 2-4 units.' },
      { title: 'Get pre-approved', description: 'Two lenders, compare FHA vs conventional.' },
      { title: 'Tour 10 properties', description: 'Calibrate pricing and condition.' },
      { title: 'Make first offer', description: null },
    ] },
    roadmap: { milestones: [
      { title: 'Financing secured', description: null, target_date: '2026-11-01T00:00:00Z' },
      { title: 'Under contract', description: null, target_date: '2027-01-15T00:00:00Z' },
      { title: 'Closed and rented', description: null, target_date: '2027-03-31T00:00:00Z' },
    ] },
    micro_plan: { tasks: [
      { title: 'Pull credit report', description: null, estimated_minutes: 15 },
      { title: 'Book lender call', description: null, estimated_minutes: 20 },
      { title: 'Set up MLS alerts', description: null, estimated_minutes: 30 },
    ] },
  }),
  simulation: () => ({
    archetype: 'Capital-Ready Operator',
    readiness_score: 81,
    sub_scores: { financial: 88, time: 62, skills: 70, risk: 80, horizon: 82 },
    radar_data: { capital: 85, time: 60, skills: 68, risk_tolerance: 80, network: 38, goal_clarity: 85 },
    headline_insight: 'More liquid capital moves you from builder to operator.',
    strategy_changes: '1 of 3 strategies would change',
  }),
  insight: () => ({
    insights: [
      { type: 'progress', title: 'Momentum', message: 'You have completed your first action items — keep the streak going.', severity: 'success', action_url: '/tasks' },
      { type: 'network_alert', title: 'Lender gap', message: 'Your active strategy needs a lender relationship you do not have yet.', severity: 'warning', action_url: '/contacts' },
    ],
  }),
  scoring: () => ({ score: 72, breakdown: { completeness: 90, consistency: 65 } }),
  export_summary: () => 'This investor combines solid capital and clear goals with an early-stage network. The plan below sequences a first house hack, reserve building, and lender relationships so each step funds the next. Follow the priority order and revisit after the first closing.',
  growth_path_generation: (text) => {
    const isIncome = /income_capital/.test(text);
    return isIncome
      ? {
          content: {
            capital_acceleration_plan: 'Redirect 25% of income to a deal fund; target $60k in 18 months.',
            income_growth_roadmap: 'Negotiate a raise this cycle; add a consulting side income by Q2.',
            funding_channel_map: [
              { channel: 'Conventional', accessibility_rank: 1, description: '20-25% down', requirements: '700+ credit' },
              { channel: 'DSCR', accessibility_rank: 2, description: 'Qualifies on rent', requirements: '1.2x coverage' },
            ],
            professional_transition_plan: null,
            capital_milestone_targets: [
              { milestone: 'First reserve fund', target_amount: '$25,000', timeline: '6 months', portfolio_phase_link: 'Deal 1' },
              { milestone: 'Second down payment', target_amount: '$60,000', timeline: '18 months', portfolio_phase_link: 'Deal 2' },
            ],
          },
          action_items: actionItems('Capital'),
          summary: 'Grow capital velocity so acquisitions are never blocked by cash.',
        }
      : {
          content: {
            scaling_plan: { year_1_vision: '1 duplex', year_3_vision: '4 doors', year_5_vision: '8 doors, $3k/mo', year_10_vision: '20 doors, replace W-2' },
            reinvestment_strategy: 'Recycle cash flow into reserves first, then the next down payment.',
            diversification_plan: 'Stay residential for 5 years, then add small commercial.',
            exit_framework: 'Hold long-term; 1031 into larger assets at year 7.',
            financing_evolution: 'FHA house hack → conventional → DSCR → portfolio loan.',
            tool_placeholders: [{ tool_name: 'Deal Analyzer', stage: 'acquisition', message: 'Coming soon' }],
          },
          action_items: actionItems('Portfolio'),
          summary: 'Compound from one house hack into a 20-door portfolio over a decade.',
        };
  },
  cross_path_analysis: () => ({
    links: [
      { type: 'prerequisite', source_path_type: 'income_capital', source_item_id: '', source_description: 'Reserve fund built', target_path_type: 'portfolio', target_item_id: '', target_description: 'Close first deal', description: 'Reserves must exist before closing.', resolution: null },
      { type: 'conflict', source_path_type: 'portfolio', source_item_id: '', source_description: 'Contractor bench', target_path_type: 'income_capital', target_item_id: '', target_description: 'Consulting side income', description: 'Both compete for evening hours.', resolution: 'Sequence consulting after the first rehab completes.' },
    ],
    next_best_action: { action_item_id: '', path_type: 'portfolio', title: 'Get pre-approved with two lenders', reason: 'Unblocks both the first deal and the capital plan.', cross_path_impact: ['portfolio', 'income_capital'] },
  }),
};

function detect(text) {
  if (/export document/i.test(text)) return 'export_summary';
  if (/next_best_action/.test(text)) return 'cross_path_analysis';
  if (/scaling_plan|capital_acceleration_plan|growth path/i.test(text)) return 'growth_path_generation';
  if (/strategy_changes/.test(text)) return 'simulation';
  if (/"micro_plan"/.test(text)) return 'strategy_activation';
  if (/"strategies"/.test(text)) return 'strategy_generation';
  if (/"insights"/.test(text)) return 'insight';
  if (/"breakdown"/.test(text)) return 'scoring';
  if (/readiness_score/.test(text)) return 'identity_synthesis';
  return null;
}

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    if (req.method === 'GET' && req.url.startsWith('/v1/models/')) {
      const id = decodeURIComponent(req.url.split('/v1/models/')[1]);
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ id, type: 'model', display_name: `Mock ${id}`, created_at: '2026-01-01T00:00:00Z' }));
    }
    if (req.method !== 'POST' || !req.url.startsWith('/v1/messages')) {
      res.writeHead(404, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ type: 'error', error: { type: 'not_found_error', message: 'Not found' } }));
    }
    let payload;
    try { payload = JSON.parse(body); } catch {
      res.writeHead(400, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ type: 'error', error: { type: 'invalid_request_error', message: 'Bad JSON' } }));
    }
    const system = typeof payload.system === 'string' ? payload.system : (payload.system ?? []).map((b) => b.text ?? '').join('\n');
    const user = (payload.messages ?? []).map((m) => (typeof m.content === 'string' ? m.content : (m.content ?? []).map((b) => b.text ?? '').join('\n'))).join('\n');
    const text = `${system}\n${user}`;
    const kind = detect(text);
    const json = kind ? responses[kind](text) : { error: 'unrecognized prompt' };
    console.log(`[mock-ai] ${kind ?? 'UNKNOWN'} (${text.length} chars)`);
    if (!kind) console.log('[mock-ai] unrecognized prompt:\n' + text.slice(0, 600));
    const out = typeof json === 'string' ? json : JSON.stringify(json);
    const usage = { input_tokens: Math.ceil(text.length / 4), output_tokens: Math.ceil(out.length / 4) };
    const message = {
      id: `msg_mock_${Date.now()}`,
      type: 'message',
      role: 'assistant',
      model: payload.model ?? 'mock',
      content: [{ type: 'text', text: out }],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage,
    };

    if (payload.stream) {
      // The backend streams every call; replay the canned text as server-sent events.
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
      const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify({ type: event, ...data })}\n\n`);
      send('message_start', { message: { ...message, content: [], stop_reason: null, usage: { ...usage, output_tokens: 0 } } });
      send('content_block_start', { index: 0, content_block: { type: 'text', text: '' } });
      for (let i = 0; i < out.length; i += 512) {
        send('content_block_delta', { index: 0, delta: { type: 'text_delta', text: out.slice(i, i + 512) } });
      }
      send('content_block_stop', { index: 0 });
      send('message_delta', { delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: usage.output_tokens } });
      send('message_stop', {});
      return res.end();
    }

    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(message));
  });
});

server.listen(PORT, () => console.log(`[mock-ai] Mock Anthropic API listening on http://localhost:${PORT}`));
