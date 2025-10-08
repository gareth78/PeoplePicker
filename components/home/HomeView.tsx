'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import FiltersPane from './FiltersPane';
import ResultsList from './ResultsList';
import EmptyState from './EmptyState';
import ErrorBox from './ErrorBox';
import OktaStatusPill from './OktaStatusPill';
import type { User, UsersResponse } from '@/lib/types';
import { fetchJson } from '@/lib/client';

export default function HomeView() {
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLists();
    loadUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLists = useCallback(async () => {
    try {
      const [deptResponse, locResponse] = await Promise.all([
        fetchJson<{ items: string[] }>('/api/departments'),
        fetchJson<{ items: string[] }>('/api/locations')
      ]);
      setDepartments(deptResponse.items);
      setLocations(locResponse.items);
    } catch (error) {
      // Non-blocking failure; lists remain empty
    }
  }, []);

  const buildQueryString = useCallback(
    (cursor?: string) => {
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      if (department) params.set('department', department);
      if (location) params.set('location', location);
      params.set('limit', '30');
      if (cursor) params.set('cursor', cursor);
      return `/api/users?${params.toString()}`;
    },
    [query, department, location]
  );

  const loadUsers = useCallback(
    async (reset: boolean) => {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await fetchJson<UsersResponse>(buildQueryString(reset ? undefined : nextCursor));
        setUsers((prev) => (reset ? response.items : [...prev, ...response.items]));
        setNextCursor(response.nextCursor);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to fetch users';
        setError(message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildQueryString, nextCursor]
  );

  const handleApply = useCallback(() => {
    setNextCursor(undefined);
    loadUsers(true);
  }, [loadUsers]);

  const handleLoadMore = useCallback(() => {
    if (!nextCursor) return;
    loadUsers(false);
  }, [loadUsers, nextCursor]);

  const resultsSummary = useMemo(() => {
    if (loading && users.length === 0) {
      return 'Loading results…';
    }
    return `${users.length} result${users.length === 1 ? '' : 's'}`;
  }, [loading, users.length]);

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-8 lg:flex-row">
      <FiltersPane
        query={query}
        department={department}
        location={location}
        departments={departments}
        locations={locations}
        onQueryChange={setQuery}
        onDepartmentChange={setDepartment}
        onLocationChange={setLocation}
        onSubmit={handleApply}
      />
      <main className="flex-1 space-y-6">
        <header className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">OrgContact Directory</h1>
            <p className="text-sm text-slate-500">Search colleagues, explore teams, and connect quickly.</p>
          </div>
          <OktaStatusPill />
        </header>
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-5 py-3 shadow-sm">
            <span className="text-sm font-medium text-slate-600">{resultsSummary}</span>
            {nextCursor ? (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            ) : null}
          </div>
          {error ? <ErrorBox message={error} onRetry={() => loadUsers(true)} /> : null}
          {!error && users.length === 0 && !loading ? (
            <EmptyState title="No people found" message="Try adjusting your filters or search for a different colleague." />
          ) : null}
          {loading && users.length === 0 ? (
            <div className="flex items-center justify-center rounded-2xl bg-white p-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
            </div>
          ) : null}
          {users.length > 0 ? <ResultsList users={users} /> : null}
          {nextCursor && users.length > 0 ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:bg-slate-200"
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
