import { afterEach, describe, expect, it, vi } from 'vitest';
import { isLoggingEnabled, log, setErrorSink } from './logger';

describe('isLoggingEnabled', () => {
  it('is on in development', () => {
    expect(isLoggingEnabled({ DEV: true, PROD: false })).toBe(true);
  });

  it('is off in production unless VITE_DEBUG is true', () => {
    expect(isLoggingEnabled({ DEV: false, PROD: true })).toBe(false);
    expect(isLoggingEnabled({ DEV: false, PROD: true, VITE_DEBUG: 'true' })).toBe(true);
  });
});

describe('log', () => {
  afterEach(() => {
    setErrorSink(null);
    vi.restoreAllMocks();
  });

  it('writes a tagged info record in non-production', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    log.info('App', 'Auto-Backup triggered');
    expect(info).toHaveBeenCalledTimes(1);
    const payload = info.mock.calls[0][0] as { module: string; message: string; level: string };
    expect(payload.module).toBe('App');
    expect(payload.message).toBe('Auto-Backup triggered');
    expect(payload.level).toBe('info');
  });

  it('forwards errors to the error sink even when console is used', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const sink = vi.fn();
    setErrorSink(sink);
    const err = new Error('boom');
    log.error('smsService', 'SMS permission error', err);
    expect(sink).toHaveBeenCalledWith(err, { module: 'smsService', message: 'SMS permission error' });
  });
});
