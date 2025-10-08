import { Building2, Mail, MapPin } from 'lucide-react';
import type { User } from '@/lib/types';

export interface UserCardProps {
  user: Pick<User, 'name' | 'title' | 'department' | 'location' | 'email'>;
}

export function UserCard({ user }: UserCardProps) {
  const initials = getInitials(user.name);
  const isDisabled = !user.email;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-200">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
          {initials}
        </span>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-900">{user.name}</h3>
          <p className="text-sm text-slate-500">{user.title ?? 'Title unavailable'}</p>
        </div>
      </div>
      <dl className="grid gap-2 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-400" aria-hidden />
          <dt className="sr-only">Department</dt>
          <dd>{user.department ?? 'Not specified'}</dd>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-400" aria-hidden />
          <dt className="sr-only">Location</dt>
          <dd>{user.location ?? 'Remote'}</dd>
        </div>
      </dl>
      <div>
        <a
          href={isDisabled ? undefined : `mailto:${user.email}`}
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
            isDisabled
              ? 'cursor-not-allowed bg-slate-200 text-slate-500'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : undefined}
          onClick={(event) => {
            if (isDisabled) {
              event.preventDefault();
            }
          }}
        >
          <Mail className="h-4 w-4" aria-hidden />
          Email
        </a>
      </div>
    </article>
  );
}

export function UserCardPlaceholder() {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="h-12 w-12 animate-pulse rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200" />
          <div className="h-3 w-1/2 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-200" />
        <div className="h-3 w-1/3 animate-pulse rounded-full bg-slate-200" />
      </div>
      <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-200" />
    </article>
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
