'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import type { User } from '@/lib/types';
import { useCallback } from 'react';

interface UserCardProps {
  user: User;
}

export default function UserCard({ user }: UserCardProps) {
  const handleCopy = useCallback((value?: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value).catch(() => {
      // noop: clipboard errors are non-critical
    });
  }, []);

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary/60 hover:shadow-md">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{user.name}</h3>
        <p className="text-sm text-slate-600">{user.title || 'Title unavailable'}</p>
      </div>
      <dl className="space-y-2 text-sm text-slate-600">
        {user.department ? (
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-500">Department:</span>
            <span>{user.department}</span>
          </div>
        ) : null}
        {user.location ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400" aria-hidden />
            <span>{user.location}</span>
          </div>
        ) : null}
        {user.email ? (
          <button
            type="button"
            onClick={() => handleCopy(user.email)}
            className="flex items-center gap-2 text-left text-primary hover:underline"
          >
            <Mail className="h-4 w-4" aria-hidden />
            <span>{user.email}</span>
          </button>
        ) : null}
        {user.phone ? (
          <button
            type="button"
            onClick={() => handleCopy(user.phone)}
            className="flex items-center gap-2 text-left text-primary hover:underline"
          >
            <Phone className="h-4 w-4" aria-hidden />
            <span>{user.phone}</span>
          </button>
        ) : null}
      </dl>
      <div className="mt-auto flex justify-end">
        <Link
          href={`/org/${user.id}`}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
        >
          View in Org Chart
        </Link>
      </div>
    </article>
  );
}
