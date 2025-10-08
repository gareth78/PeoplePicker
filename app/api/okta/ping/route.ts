import { oktaFetch } from '@/lib/okta';
import { getRequestId, jsonResponse, logTiming } from '@/lib/http';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  const started = Date.now();

  try {
    const result = await oktaFetch<{ _embedded?: { users?: Array<{ id: string }> } }>({
      path: '/api/v1/users?limit=1',
      timeoutMs: 8000,
      retry: 1,
      requestId
    });
    const duration = Date.now() - started;
    logTiming({ requestId, path: req.nextUrl.pathname, method: 'GET', status: 200, durationMs: duration, oktaStatus: result.response.status });
    const sample = result.data?._embedded?.users?.[0]?.id;
    return jsonResponse({ ok: true, status: result.response.status, ms: duration, sample });
  } catch (error) {
    const duration = Date.now() - started;
    const err = error as Error & { status?: number };
    const oktaStatus = err.status ?? 502;
    logTiming({ requestId, path: req.nextUrl.pathname, method: 'GET', status: 200, durationMs: duration, oktaStatus });
    return jsonResponse({ ok: false, status: oktaStatus, ms: duration, error: err.message });
  }
}
