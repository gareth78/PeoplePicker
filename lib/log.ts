import { randomUUID } from 'node:crypto';

type LogLevel = 'info' | 'error' | 'warn';

type LogPayload = Record<string, unknown> & { message: string; level?: LogLevel };

type RequestContext = {
  requestId?: string;
};

export function withRequestId(context?: RequestContext): string {
  return context?.requestId || randomUUID();
}

export function log(payload: LogPayload, context?: RequestContext) {
  const entry = {
    level: payload.level ?? 'info',
    requestId: withRequestId(context),
    ...payload,
    timestamp: new Date().toISOString()
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
}

export function logError(error: Error, payload: Omit<LogPayload, 'message'> & { message?: string }, context?: RequestContext) {
  const entry = {
    level: 'error' as const,
    requestId: withRequestId(context),
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    ...payload,
    timestamp: new Date().toISOString()
  };
  // eslint-disable-next-line no-console
  console.error(JSON.stringify(entry));
}
