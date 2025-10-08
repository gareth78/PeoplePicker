'use client';

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Users, ChevronDown } from 'lucide-react';
import type { NodeProps } from 'reactflow';
import type { UserLite } from '@/lib/types';

type OrgNodeData = {
  user: UserLite;
  onSelect: (id: string) => void;
  onExpand: (id: string) => void;
  canExpand: boolean;
  isLoading: boolean;
};

function OrgNode({ data }: NodeProps<OrgNodeData>) {
  const initials = getInitials(data.user.name);

  return (
    <div className="group relative flex min-w-[220px] max-w-xs flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary/70 hover:shadow-md">
      <button
        type="button"
        onClick={() => data.onSelect(data.user.id)}
        className="text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
            {initials}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{data.user.name}</h3>
            <p className="text-xs text-slate-500">{data.user.title ?? 'Title unavailable'}</p>
          </div>
        </div>
        <dl className="mt-3 space-y-1 text-xs text-slate-500">
          {data.user.department ? (
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-slate-400" aria-hidden />
              <span>{data.user.department}</span>
            </div>
          ) : null}
          {data.user.location ? <p>{data.user.location}</p> : null}
        </dl>
      </button>
      {data.canExpand ? (
        <button
          type="button"
          onClick={() => data.onExpand(data.user.id)}
          className="inline-flex items-center gap-2 self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-primary/10 hover:text-primary"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition ${data.isLoading ? 'animate-spin' : ''}`} aria-hidden />
          {data.isLoading ? 'Loading…' : 'Expand team'}
        </button>
      ) : null}
      <Handle type="target" position={Position.Top} className="!h-2 !w-12 !rounded-full !bg-slate-300" />
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-12 !rounded-full !bg-slate-300" />
    </div>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  const [first, second] = parts;
  return (first?.[0] ?? '') + (second?.[0] ?? '');
}

export default memo(OrgNode);
