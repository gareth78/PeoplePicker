'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Filter, Users } from 'lucide-react';
import SearchBox from './SearchBox';
import OktaStatusPill from './OktaStatusPill';
import { UserCard, UserCardPlaceholder } from './UserCard';
import type { User, UsersResponse } from '@/lib/types';

const departments = ['Engineering', 'Product', 'Design', 'People Ops', 'Finance'];
const locations = ['San Francisco', 'New York', 'Remote', 'Austin', 'London'];

type Filters = {
  query?: string;
  department?: string;
  location?: string;
};

export default function DirectoryShell() {
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFilters, setLastFilters] = useState<Filters>({});

  const loadUsers = useCallback(async (filters: Filters) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.query) params.set('query', filters.query);
      if (filters.department) params.set('department', filters.department);
      if (filters.location) params.set('location', filters.location);
      params.set('limit', '12');

      const queryString = params.toString();
      const response = await fetch(queryString ? `/api/users?${queryString}` : '/api/users', {
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error(`Unable to load users (${response.status})`);
      }

      const data = (await response.json()) as UsersResponse;
      setUsers(data.items ?? []);
      setLastFilters(filters);
    } catch (err) {
      console.error(err);
      setUsers([]);
      setError('We could not load users right now. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers({});
  }, [loadUsers]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const filters: Filters = {
      query: query.trim() || undefined,
      department: department || undefined,
      location: location || undefined
    };
    void loadUsers(filters);
  };

  const resultSummary = useMemo(() => {
    if (loading) {
      return 'Loading people…';
    }

    if (users.length === 0) {
      return 'No matches';
    }

    return `${users.length} result${users.length === 1 ? '' : 's'}`;
  }, [loading, users.length]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6 lg:space-y-8">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">OrgContact Directory</h1>
          <p className="mt-1 text-sm text-slate-500">
            Search for colleagues, explore teams, and jump into conversations faster.
          </p>
        </div>
        <OktaStatusPill />
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
        <aside className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Filter className="h-4 w-4 text-slate-400" aria-hidden />
            Filters
          </div>
          <p className="mt-2 text-xs text-slate-500">Refine your search to narrow down results.</p>
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="search" className="text-sm font-medium text-slate-700">
                Search
              </label>
              <SearchBox
                id="search"
                name="search"
                placeholder="Search by name, title, or email"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="department" className="text-sm font-medium text-slate-700">
                Department
              </label>
              <select
                id="department"
                name="department"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="">All departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium text-slate-700">
                Location
              </label>
              <select
                id="location"
                name="location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="">All locations</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <Filter className="h-4 w-4" aria-hidden />
              Apply filters
            </button>
          </form>
        </aside>

        <main className="space-y-5">
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Users className="h-4 w-4 text-slate-400" aria-hidden />
              <span>{resultSummary}</span>
            </div>
            <div className="text-xs text-slate-400">Page 1 of 1</div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              <p className="font-semibold">Something went wrong</p>
              <p className="mt-1 text-red-600">{error}</p>
            </div>
          ) : null}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <UserCardPlaceholder key={index} />
              ))}
            </div>
          ) : null}

          {!loading && !error && users.length === 0 ? <EmptyState filters={lastFilters} /> : null}

          {!loading && users.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {users.map((user) => (
                <UserCard key={user.id} user={{
                  name: user.name,
                  title: user.title,
                  department: user.department,
                  location: user.location,
                  email: user.email
                }} />
              ))}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function EmptyState({ filters }: { filters: Filters }) {
  const hasFilters = Boolean(filters.query || filters.department || filters.location);

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
      <Users className="h-10 w-10 text-slate-300" aria-hidden />
      <div>
        <p className="font-semibold text-slate-600">No people found</p>
        <p className="mt-1 text-xs text-slate-500">
          {hasFilters
            ? 'We could not find anyone that matches those filters. Try broadening your search.'
            : 'Start by applying a filter or searching for a teammate to see results here.'}
        </p>
      </div>
    </div>
  );
}
