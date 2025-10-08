'use client';

import { useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { ZoomIn, ZoomOut, Focus } from 'lucide-react';

export default function OrgToolbar() {
  const reactFlow = useReactFlow();

  const handleZoomIn = useCallback(() => {
    reactFlow.zoomIn({ duration: 200 });
  }, [reactFlow]);

  const handleZoomOut = useCallback(() => {
    reactFlow.zoomOut({ duration: 200 });
  }, [reactFlow]);

  const handleFit = useCallback(() => {
    reactFlow.fitView({ padding: 0.2 });
  }, [reactFlow]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleZoomOut}
        className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:border-primary hover:text-primary"
        aria-label="Zoom out"
      >
        <ZoomOut className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={handleZoomIn}
        className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:border-primary hover:text-primary"
        aria-label="Zoom in"
      >
        <ZoomIn className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={handleFit}
        className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:border-primary hover:text-primary"
        aria-label="Fit to view"
      >
        <Focus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
