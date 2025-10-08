'use client';

import { useCallback } from 'react';
import { Mail, Phone, MapPin, X } from 'lucide-react';
import type { User, UserLite } from '@/lib/types';

interface ProfileDrawerProps {
  user: UserLite | null;
  profile: User | null;
  loading: boolean;
  onClose: () => void;
}

export default function ProfileDrawer({ user, profile, loading, onClose }: ProfileDrawerProps) {
  const handleCopy = useCallback((value?: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value).catch(() => {});
  }, []);

  if (!user) {
    return (
      <aside className="hidden w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm lg:flex">
        <p>Select a person in the org chart to view their profile.</p>
      </aside>
    );
  }

  return (
    <aside className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{user.name}</h2>
          <p className="text-sm text-slate-500">{profile?.title ?? user.title ?? 'Title unavailable'}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-200 p-1 text-slate-500 hover:text-slate-700"
          aria-label="Close profile"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="space-y-3 text-sm text-slate-600">
        {(profile?.department || user.department) && (
          <p>
            <span className="font-semibold text-slate-500">Department:</span> {profile?.department ?? user.department}
          </p>
        )}
        {(profile?.location || user.location) && (
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400" aria-hidden />
            <span>{profile?.location ?? user.location}</span>
          </p>
        )}
        {profile?.email ? (
          <button
            type="button"
            onClick={() => handleCopy(profile.email)}
            className="flex items-center gap-2 text-left text-primary hover:underline"
          >
            <Mail className="h-4 w-4" aria-hidden />
            <span>{profile.email}</span>
          </button>
        ) : null}
        {profile?.phone ? (
          <button
            type="button"
            onClick={() => handleCopy(profile.phone)}
            className="flex items-center gap-2 text-left text-primary hover:underline"
          >
            <Phone className="h-4 w-4" aria-hidden />
            <span>{profile.phone}</span>
          </button>
        ) : null}
        {loading ? <p className="text-xs text-slate-400">Loading details…</p> : null}
      </div>
    </aside>
  );
}
