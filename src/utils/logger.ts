type LogEnv = {
  DEV?: boolean;
  PROD?: boolean;
  VITE_DEBUG?: string;
};

export function isLoggingEnabled(env: LogEnv = import.meta.env): boolean {
  if (env.VITE_DEBUG === 'true') return true;
  if (env.PROD) return false;
  return true;
}

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  ts: string;
  level: LogLevel;
  module: string;
  message: string;
}

function entry(level: LogLevel, module: string, message: string): LogEntry {
  return {
    ts: new Date().toISOString(),
    level,
    module,
    message,
  };
}

type ErrorSink = (error: unknown, context: { module: string; message: string }) => void;

let errorSink: ErrorSink | null = null;

export function setErrorSink(sink: ErrorSink | null): void {
  errorSink = sink;
}

function emit(level: LogLevel, module: string, message: string, extra?: unknown): void {
  if (level === 'error' && errorSink) {
    errorSink(extra ?? message, { module, message });
  }
  if (!isLoggingEnabled()) return;
  const payload = extra === undefined ? entry(level, module, message) : { ...entry(level, module, message), extra };
  if (level === 'error') console.error(payload);
  else if (level === 'warn') console.warn(payload);
  else console.info(payload);
}

export const log = {
  info: (module: string, message: string, extra?: unknown) => emit('info', module, message, extra),
  warn: (module: string, message: string, extra?: unknown) => emit('warn', module, message, extra),
  error: (module: string, message: string, extra?: unknown) => emit('error', module, message, extra),
};
