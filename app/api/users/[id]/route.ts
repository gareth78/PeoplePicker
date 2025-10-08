import { NextRequest } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache';
import { badGateway, getRequestId, jsonResponse, logTiming } from '@/lib/http';
import { oktaFetch } from '@/lib/okta';
import type { User } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CACHE_TTL_SECONDS = 600;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const requestId = getRequestId(req);
  const started = Date.now();
  const userId = params.id;
  const cacheKey = `user:${userId}`;

  try {
    const cached = await cacheGet<User>(cacheKey);
    if (cached) {
      logTiming({ requestId, path: req.nextUrl.pathname, method: 'GET', status: 200, durationMs: Date.now() - started });
      return jsonResponse(cached);
    }

    const result = await oktaFetch<OktaUser>({ path: `/api/v1/users/${encodeURIComponent(userId)}`, requestId });
    const { data, response } = result;
    const user = mapOktaUser(data);

    await cacheSet(cacheKey, user, CACHE_TTL_SECONDS);

    const duration = Date.now() - started;
    logTiming({ requestId, path: req.nextUrl.pathname, method: 'GET', status: 200, durationMs: duration, oktaStatus: response.status });
    return jsonResponse(user);
  } catch (error) {
    const duration = Date.now() - started;
    const err = error as Error & { status?: number };
    logTiming({ requestId, path: req.nextUrl.pathname, method: 'GET', status: 502, durationMs: duration, oktaStatus: err.status });
    return badGateway('Failed to load user');
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
