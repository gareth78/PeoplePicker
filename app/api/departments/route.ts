import { NextRequest } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache';
import { badGateway, getRequestId, jsonResponse, logTiming } from '@/lib/http';
import { oktaFetch } from '@/lib/okta';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CACHE_KEY = 'lists:departments';
const CACHE_TTL_SECONDS = 600;
const PAGE_LIMIT = 200;

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  const started = Date.now();

  try {
    const cached = await cacheGet<string[]>(CACHE_KEY);
    if (cached) {
      logTiming({ requestId, path: req.nextUrl.pathname, method: 'GET', status: 200, durationMs: Date.now() - started });
      return jsonResponse({ items: cached });
    }

    const departments = new Set<string>();
    let cursor = '';
    let pageCount = 0;
    let lastStatus = 200;

    do {
      const path = buildPath(cursor);
      const { data, response } = await oktaFetch<OktaUser[]>({ path, requestId });
      lastStatus = response.status;
      data.forEach((user) => {
        const dept = user.profile?.department?.trim();
        if (dept) {
          departments.add(dept);
        }
      });
      cursor = parseCursor(response.headers.get('link')) ?? '';
      pageCount += 1;
      if (pageCount > 10) {
        break; // safeguard against runaway pagination
      }
    } while (cursor);

    const items = Array.from(departments).sort((a, b) => a.localeCompare(b));
    await cacheSet(CACHE_KEY, items, CACHE_TTL_SECONDS);

    const duration = Date.now() - started;
    logTiming({ requestId, path: req.nextUrl.pathname, method: 'GET', status: 200, durationMs: duration, oktaStatus: lastStatus });
    return jsonResponse({ items });
  } catch (error) {
    const duration = Date.now() - started;
    const err = error as Error & { status?: number };
    logTiming({ requestId, path: req.nextUrl.pathname, method: 'GET', status: 502, durationMs: duration, oktaStatus: err.status });
    return badGateway('Failed to load departments');
  }
}

type OktaUser = {
  profile?: {
    department?: string;
  };
};

function buildPath(cursor: string) {
  const params = new URLSearchParams();
  params.set('limit', String(PAGE_LIMIT));
  if (cursor) {
    params.set('after', cursor);
  }
  params.set('fields', 'profile.department');
  params.set('filter', 'status eq "ACTIVE"');
  return `/api/v1/users?${params.toString()}`;
}

function parseCursor(linkHeader: string | null): string | undefined {
  if (!linkHeader) return undefined;
  const parts = linkHeader.split(',');
  for (const part of parts) {
    const [urlPart, relPart] = part.split(';').map((item) => item.trim());
    if (!urlPart || !relPart) continue;
    if (relPart === 'rel="next"') {
      const match = urlPart.match(/after=([^&>]+)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }
  }
  return undefined;
}
