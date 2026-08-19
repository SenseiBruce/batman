import { setErrorSink } from './logger';

export async function initErrorTracking(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  const Sentry = await import('@sentry/browser');
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0,
  });

  setErrorSink((error, context) => {
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { module: context.module },
      extra: { message: context.message },
    });
  });

  window.addEventListener('error', (event) => {
    Sentry.captureException(event.error ?? event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    Sentry.captureException(event.reason);
  });
}
