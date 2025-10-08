import { NextRequest } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache';
import { getRequestId, jsonResponse, badGateway, logTiming } from '@/lib/http';
import { oktaFetch } from '@/lib/okta';
import type { User, UsersResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const CACHE_TTL_SECONDS = 600;

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  const started = Date.now();

  try {
    const { searchParams } = req.nextUrl;
    const query = sanitize(searchParams.get('query') ?? '');
    const department = sanitize(searchParams.get('department') ?? '');
    const location = sanitize(searchParams.get('location') ?? '');
    const cursor = sanitize(searchParams.get('cursor') ?? '');
    const limitParam = Number(searchParams.get('limit') ?? DEFAULT_LIMIT);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), MAX_LIMIT) : DEFAULT_LIMIT;

    const cacheKey = cursor
      ? `users:cursor:${cursor}`
      : `users:query:${query}:dept:${department}:loc:${location}:limit:${limit}`;

    if (!cursor) {
      const cached = await cacheGet<UsersResponse>(cacheKey);
      if (cached) {
        logTiming({ requestId, path: req.nextUrl.pathname, method: 'GET', status: 200, durationMs: Date.now() - started });
        return jsonResponse(cached);
      }
    }

    const oktaPath = buildOktaPath({ query, department, location, limit, cursor });
    const result = await oktaFetch<OktaUsersResponse>({ path: oktaPath, requestId });
    const { data, response } = result;
    const users = (data ?? []).map(mapOktaUser);
    const nextCursor = parseCursor(response.headers.get('link'));
    const payload: UsersResponse = {
      items: users,
      nextCursor
    };

    if (!cursor) {
      await cacheSet(cacheKey, payload, CACHE_TTL_SECONDS);
    }

    const duration = Date.now() - started;
    logTiming({
      requestId,
      path: req.nextUrl.pathname,
      method: 'GET',
      status: 200,
      durationMs: duration,
      oktaStatus: response.status
    });

    return jsonResponse(payload);
  } catch (error) {
    const duration = Date.now() - started;
    const err = error as Error & { status?: number };
    logTiming({
      requestId,
      path: req.nextUrl.pathname,
      method: 'GET',
      status: 502,
      durationMs: duration,
      oktaStatus: err.status
    });
    return badGateway('Failed to load users');
  }
}

type OktaUser = {
  id: string;
  status?: string;
  profile: {
    firstName?: string;
    lastName?: string;
    email?: string;
    login?: string;
    title?: string;
    department?: string;
    city?: string;
    countryCode?: string;
    mobilePhone?: string;
    primaryPhone?: string;
    managerId?: string;
  };
};

type OktaUsersResponse = OktaUser[];

function mapOktaUser(entry: OktaUser): User {
  const { profile } = entry;
  const firstName = profile.firstName?.trim();
  const lastName = profile.lastName?.trim();
  const name = [firstName, lastName].filter(Boolean).join(' ') || profile.email || entry.id;
  const location = buildLocation(profile.city, profile.countryCode);

  return {
    id: entry.id,
    status: entry.status,
    name,
    firstName,
    lastName,
    email: profile.email,
    login: profile.login,
    title: profile.title,
    department: profile.department,
    location,
    phone: profile.primaryPhone ?? profile.mobilePhone,
    managerId: profile.managerId
  };
}

function buildLocation(city?: string, country?: string) {
  const parts = [city?.trim(), country?.trim()].filter(Boolean);
  return parts.join(', ') || undefined;
}

function buildOktaPath({
  query,
  department,
  location,
  limit,
  cursor
}: {
  query: string;
  department: string;
  location: string;
  limit: number;
  cursor: string;
}) {
  const params = new URLSearchParams();
  params.set('limit', String(limit));

  if (cursor) {
    params.set('after', cursor);
  }

  const filterParts: string[] = [];
  if (department) {
    filterParts.push(`profile.department eq \"${escapeQuotes(department)}\"`);
  }
  if (location) {
    // Assumes city field holds canonical location. Adjust attribute names if your tenant differs.
    const [city] = location.split(',');
    if (city) {
      filterParts.push(`profile.city eq \"${escapeQuotes(city.trim())}\"`);
    }
  }
  if (filterParts.length > 0) {
    params.set('filter', filterParts.join(' and '));
  }

  if (query) {
    const safeQuery = escapeQuotes(query);
    const searchTerms = [
      `profile.firstName sw \"${safeQuery}\"`,
      `profile.lastName sw \"${safeQuery}\"`,
      `profile.email sw \"${safeQuery}\"`,
      `profile.title sw \"${safeQuery}\"`
    ];
    params.set('search', searchTerms.join(' or '));
  }

  params.set('sortBy', 'profile.lastName');
  params.set('sortOrder', 'asc');

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

function sanitize(value: string) {
  return value.replace(/[^\w\s@.\-,&]/g, '').trim().slice(0, 200);
}

function escapeQuotes(value: string) {
  return value.replace(/"/g, '\\"');
}
