import { NextRequest, NextResponse } from 'next/server';
import { log } from './log';

export function getRequestId(req: NextRequest): string {
  return req.headers.get('x-request-id') ?? crypto.randomUUID();
}

export function jsonResponse<T>(data: T, status = 200): NextResponse<T> {
  const response = NextResponse.json(data, {
    status,
    headers: {
      'cache-control': 'no-store'
    }
  });
  return response;
}

export function badGateway(message: string) {
  return jsonResponse({ error: message }, 502);
}

export function logTiming({
  requestId,
  path,
  method,
  status,
  durationMs,
  oktaStatus
}: {
  requestId: string;
  path: string;
  method: string;
  status: number;
  durationMs: number;
  oktaStatus?: number;
}) {
  log({
    message: 'api_request',
    path,
    method,
    status,
    durationMs,
    oktaStatus
  }, { requestId });
}
