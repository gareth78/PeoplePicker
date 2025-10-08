'use client';

import { Users } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  message: string;
}

export default function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
      <Users className="h-10 w-10 text-slate-300" aria-hidden />
      <h3 className="text-base font-semibold text-slate-700">{title}</h3>
      <p className="max-w-md text-sm text-slate-500">{message}</p>
    </div>
  );
}
