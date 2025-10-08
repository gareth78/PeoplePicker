import { NextRequest } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache';
import { badGateway, getRequestId, jsonResponse, logTiming } from '@/lib/http';
import { oktaFetch } from '@/lib/okta';
import type { OrgResponse, UserLite } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CACHE_TTL_SECONDS = 600;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const requestId = getRequestId(req);
  const started = Date.now();
  const { searchParams } = req.nextUrl;
  const userId = params.id;
  const pageSize = clamp(Number(searchParams.get('pageSize') ?? 50), 1, 100);
  const cursor = sanitize(searchParams.get('cursor') ?? '');

  try {
    const [node, reports] = await Promise.all([
      getUserLite(userId, requestId),
      getReports({ userId, pageSize, cursor, requestId })
    ]);

    const duration = Date.now() - started;
    logTiming({
      requestId,
      path: req.nextUrl.pathname,
      method: 'GET',
      status: 200,
      durationMs: duration,
      oktaStatus: reports.oktaStatus
    });

    const payload: OrgResponse = {
      node,
      reports: reports.items,
      hasMore: Boolean(reports.nextCursor),
      nextCursor: reports.nextCursor
    };

    return jsonResponse(payload);
  } catch (error) {
    const duration = Date.now() - started;
    const err = error as Error & { status?: number };
    logTiming({ requestId, path: req.nextUrl.pathname, method: 'GET', status: 502, durationMs: duration, oktaStatus: err.status });
    return badGateway('Failed to load org data');
  }
}

type OktaUser = {
  id: string;
  profile: {
    firstName?: string;
    lastName?: string;
    email?: string;
    title?: string;
    department?: string;
    city?: string;
    countryCode?: string;
    managerId?: string;
  };
};

type ReportsResult = {
  items: UserLite[];
  nextCursor?: string;
  oktaStatus: number;
};

async function getUserLite(userId: string, requestId: string): Promise<UserLite> {
  const cacheKey = `user:${userId}:lite`;
  const cached = await cacheGet<UserLite>(cacheKey);
  if (cached) return cached;

  const { data } = await oktaFetch<OktaUser>({ path: `/api/v1/users/${encodeURIComponent(userId)}`, requestId });
  const lite = mapUser(data);
  await cacheSet(cacheKey, lite, CACHE_TTL_SECONDS);
  return lite;
}

async function getReports({
  userId,
  pageSize,
  cursor,
  requestId
}: {
  userId: string;
  pageSize: number;
  cursor: string;
  requestId: string;
}): Promise<ReportsResult> {
  const cacheKey = `reports:${userId}:page:${cursor || 'root'}:${pageSize}`;
  const cached = await cacheGet<ReportsResult>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams();
  params.set('limit', String(pageSize));
  params.set('filter', `profile.managerId eq \"${escapeQuotes(userId)}\"`);
  if (cursor) {
    params.set('after', cursor);
  }

  const path = `/api/v1/users?${params.toString()}`;
  const { data, response } = await oktaFetch<OktaUser[]>({ path, requestId });
  const items = data.map(mapUser);
  const nextCursor = parseCursor(response.headers.get('link'));

  const result: ReportsResult = {
    items,
    nextCursor,
    oktaStatus: response.status
  };

  await cacheSet(cacheKey, result, CACHE_TTL_SECONDS);
  return result;
}

function mapUser(entry: OktaUser): UserLite {
  const firstName = entry.profile.firstName?.trim();
  const lastName = entry.profile.lastName?.trim();
  const name = [firstName, lastName].filter(Boolean).join(' ') || entry.profile.email || entry.id;
  const location = buildLocation(entry.profile.city, entry.profile.countryCode);
  return {
    id: entry.id,
    name,
    title: entry.profile.title,
    department: entry.profile.department,
    location,
    managerId: entry.profile.managerId
  };
}

function buildLocation(city?: string, country?: string) {
  const parts = [city?.trim(), country?.trim()].filter(Boolean);
  return parts.join(', ') || undefined;
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

function sanitize(value: string) {
  return value.replace(/[^\w\s@.\-,&]/g, '').trim().slice(0, 200);
}

function escapeQuotes(value: string) {
  return value.replace(/"/g, '\\"');
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}
