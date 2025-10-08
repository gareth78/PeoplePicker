'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';

interface PingResponse {
  ok: boolean;
  ms: number;
}

type Status = 'loading' | 'ok' | 'degraded' | 'error';

type StatusMeta = {
  label: string;
  tone: string;
  icon: JSX.Element;
};

const REFRESH_INTERVAL_MS = 60_000;

export default function OktaStatusPill() {
  const [status, setStatus] = useState<Status>('loading');
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function ping() {
      try {
        const started = performance.now();
        const response = await fetch('/api/okta/ping', {
          cache: 'no-store',
          signal: controller.signal
        });
        const elapsed = performance.now() - started;

        if (!isMounted) return;

        if (!response.ok) {
          throw new Error('Request failed');
        }

        const data = (await response.json()) as PingResponse;
        const totalMs = Number.isFinite(data.ms) ? data.ms : elapsed;

        setLatency(totalMs);
        setStatus(data.ok ? (totalMs > 1500 ? 'degraded' : 'ok') : 'error');
      } catch (error) {
        if (!isMounted) return;
        setStatus('error');
        setLatency(null);
      }
    }

    void ping();
    const interval = setInterval(() => void ping(), REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const meta = useMemo<StatusMeta>(() => {
    switch (status) {
      case 'ok':
        return {
          label: 'Okta healthy',
          tone: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
          icon: <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        };
      case 'degraded':
        return {
          label: 'Okta slow',
          tone: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
          icon: <ShieldQuestion className="h-3.5 w-3.5" aria-hidden />
        };
      case 'error':
        return {
          label: 'Okta unavailable',
          tone: 'bg-red-100 text-red-700 ring-1 ring-red-200',
          icon: <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
        };
      default:
        return {
          label: 'Checking Okta…',
          tone: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
          icon: <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        };
    }
  }, [status]);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${meta.tone}`}
      role="status"
      aria-live="polite"
    >
      {meta.icon}
      <span>{meta.label}</span>
      {latency != null ? (
        <span className="font-medium text-[10px] leading-none text-current">
          {Math.round(latency)}ms
        </span>
      ) : null}
    </span>
  );
}
