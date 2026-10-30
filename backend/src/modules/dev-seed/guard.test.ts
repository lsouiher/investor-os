import type { Request, Response } from 'express';
import { devSeedEnabled, requireDevSeed } from './guard';

const ORIGINAL = { NODE_ENV: process.env.NODE_ENV, ENABLE_DEV_SEED: process.env.ENABLE_DEV_SEED };

function setEnv(nodeEnv: string | undefined, flag: string | undefined) {
  if (nodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = nodeEnv;
  if (flag === undefined) delete process.env.ENABLE_DEV_SEED;
  else process.env.ENABLE_DEV_SEED = flag;
}

afterAll(() => setEnv(ORIGINAL.NODE_ENV, ORIGINAL.ENABLE_DEV_SEED));

describe('devSeedEnabled', () => {
  it.each([
    ['production', 'true', false],
    ['production', undefined, false],
    ['development', undefined, false],
    ['development', 'false', false],
    ['development', '1', false],
    ['development', 'true', true],
    ['test', 'true', true],
    [undefined, 'true', true],
  ])('NODE_ENV=%s ENABLE_DEV_SEED=%s → %s', (nodeEnv, flag, expected) => {
    setEnv(nodeEnv, flag);
    expect(devSeedEnabled()).toBe(expected);
  });
});

describe('requireDevSeed', () => {
  it('answers 404 when the gate is closed', () => {
    setEnv('production', 'true');
    const next = jest.fn();
    requireDevSeed({} as Request, {} as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
  });

  it('passes through when the gate is open', () => {
    setEnv('development', 'true');
    const next = jest.fn();
    requireDevSeed({} as Request, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });
});
