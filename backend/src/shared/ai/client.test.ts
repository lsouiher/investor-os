/**
 * callClaude streams the response and enforces its own overall deadline. The Anthropic API is
 * replaced by a local SSE server; persistence and encryption are mocked.
 */
import http from 'node:http';
import type { AddressInfo } from 'node:net';

const mockLogCreate = jest.fn().mockResolvedValue({});
jest.mock('../db.js', () => ({
  prisma: { aiCallLog: { create: (...args: unknown[]) => mockLogCreate(...args) } },
}));
jest.mock('../encryption/field-encryption.js', () => ({ encryptField: (v: string) => v }));
jest.mock('../logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// The Anthropic client is created lazily on the first call, after beforeAll has pointed it at the local server.
import { callClaude } from './client';

type Handler = (res: http.ServerResponse) => void;
let server: http.Server;
let handler: Handler;

const sse = (res: http.ServerResponse, event: string, data: Record<string, unknown>) =>
  res.write(`event: ${event}\ndata: ${JSON.stringify({ type: event, ...data })}\n\n`);

function startStream(res: http.ServerResponse) {
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  sse(res, 'message_start', {
    message: {
      id: 'msg_1', type: 'message', role: 'assistant', model: 'test', content: [],
      stop_reason: null, stop_sequence: null, usage: { input_tokens: 40, output_tokens: 0 },
    },
  });
  sse(res, 'content_block_start', { index: 0, content_block: { type: 'text', text: '' } });
}

beforeAll(async () => {
  server = http.createServer((_req, res) => handler(res));
  await new Promise<void>((resolve) => server.listen(0, resolve));
  process.env.ANTHROPIC_BASE_URL = `http://localhost:${(server.address() as AddressInfo).port}`;
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

const baseOptions = {
  tenantId: 1,
  userId: 1,
  serviceType: 'insight' as const,
  systemPrompt: 'system',
  userContent: 'user',
};

describe('callClaude', () => {
  it('assembles streamed text deltas and reports usage', async () => {
    handler = (res) => {
      startStream(res);
      sse(res, 'content_block_delta', { index: 0, delta: { type: 'text_delta', text: '{"a":' } });
      sse(res, 'content_block_delta', { index: 0, delta: { type: 'text_delta', text: '1}' } });
      sse(res, 'content_block_stop', { index: 0 });
      sse(res, 'message_delta', { delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 6 } });
      sse(res, 'message_stop', {});
      res.end();
    };

    const result = await callClaude({ ...baseOptions, timeoutMs: 5000 });

    expect(result.content).toBe('{"a":1}');
    expect(result.tokensUsed).toBe(46);
    expect(mockLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ success: true, tokensUsed: 46 }) }),
    );
  });

  it('aborts a stream that stalls past the deadline', async () => {
    let open: http.ServerResponse | undefined;
    handler = (res) => {
      startStream(res); // first bytes arrive, then nothing
      open = res;
    };

    const started = Date.now();
    await expect(callClaude({ ...baseOptions, timeoutMs: 300 })).rejects.toThrow(/timed out after 300ms/);
    expect(Date.now() - started).toBeLessThan(3000);
    expect(mockLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ success: false, errorMessage: expect.stringContaining('timed out') }),
      }),
    );
    open?.end();
  });
});
