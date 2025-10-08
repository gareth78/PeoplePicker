'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { fetchJson } from '@/lib/client';

type Status = 'loading' | 'healthy' | 'degraded' | 'error';

type PingResponse = {
  ok: boolean;
  status: number;
  ms: number;
};

export default function OktaStatusPill() {
  const [status, setStatus] = useState<Status>('loading');
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const result = await fetchJson<PingResponse>('/api/okta/ping');
        if (!mounted) return;
        setLatency(result.ms);
        if (result.ok) {
          setStatus(result.ms < 1500 ? 'healthy' : 'degraded');
        } else {
          setStatus('error');
        }
      } catch (error) {
        if (!mounted) return;
        setStatus('error');
      }
    }

    run();
    const interval = setInterval(run, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const { label, icon, colorClass } = getStatusMeta(status);

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${colorClass}`}>
      {icon}
      <span>{label}</span>
      {latency != null ? <span className="font-normal text-[10px]">{Math.round(latency)}ms</span> : null}
    </span>
  );
}

function getStatusMeta(status: Status) {
  switch (status) {
    case 'healthy':
      return {
        label: 'Okta connected',
        icon: <ShieldCheck className="h-3.5 w-3.5" aria-hidden />,
        colorClass: 'bg-emerald-100 text-emerald-700'
      };
    case 'degraded':
      return {
        label: 'Okta slow',
        icon: <Shield className="h-3.5 w-3.5" aria-hidden />,
        colorClass: 'bg-amber-100 text-amber-700'
      };
    case 'error':
      return {
        label: 'Okta unavailable',
        icon: <ShieldAlert className="h-3.5 w-3.5" aria-hidden />,
        colorClass: 'bg-red-100 text-red-700'
      };
    default:
      return {
        label: 'Checking Okta…',
        icon: <Shield className="h-3.5 w-3.5" aria-hidden />,
        colorClass: 'bg-slate-100 text-slate-600'
      };
  }
}
