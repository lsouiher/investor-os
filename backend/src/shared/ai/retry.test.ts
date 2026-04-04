import { parseJsonResponse } from './retry';
import { z } from 'zod';
import { AppError } from '../middleware/error-handler';

describe('parseJsonResponse', () => {
  it('parses plain JSON', () => {
    const result = parseJsonResponse('{"name":"test"}');
    expect(result).toEqual({ name: 'test' });
  });

  it('strips ```json code fence', () => {
    const result = parseJsonResponse('```json\n{"name":"test"}\n```');
    expect(result).toEqual({ name: 'test' });
  });

  it('strips ``` code fence without language', () => {
    const result = parseJsonResponse('```\n{"name":"test"}\n```');
    expect(result).toEqual({ name: 'test' });
  });

  it('handles whitespace around JSON', () => {
    const result = parseJsonResponse('  \n{"name":"test"}\n  ');
    expect(result).toEqual({ name: 'test' });
  });

  it('throws AI_PARSE_ERROR on invalid JSON', () => {
    expect(() => parseJsonResponse('not json at all')).toThrow(AppError);
    try {
      parseJsonResponse('not json at all');
    } catch (err) {
      expect((err as AppError).code).toBe('AI_PARSE_ERROR');
    }
  });

  it('returns parsed object without schema', () => {
    const result = parseJsonResponse('{"a":1,"b":"two"}');
    expect(result).toEqual({ a: 1, b: 'two' });
  });

  it('validates against Zod schema when provided', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const result = parseJsonResponse('{"name":"test","age":25}', schema);
    expect(result).toEqual({ name: 'test', age: 25 });
  });

  it('throws ZodError when schema validation fails', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    expect(() => parseJsonResponse('{"name":"test","age":"not-a-number"}', schema)).toThrow();
  });

  it('handles nested JSON objects', () => {
    const json = '{"strategies":[{"name":"Buy and Hold","rank":1}]}';
    const result = parseJsonResponse(json);
    expect(result).toEqual({ strategies: [{ name: 'Buy and Hold', rank: 1 }] });
  });
});
