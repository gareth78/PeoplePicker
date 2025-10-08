'use client';

import { useEffect } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import SearchBox from './SearchBox';

interface FiltersPaneProps {
  query: string;
  department: string;
  location: string;
  departments: string[];
  locations: string[];
  onQueryChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSubmit: () => void;
}

export default function FiltersPane({
  query,
  department,
  location,
  departments,
  locations,
  onQueryChange,
  onDepartmentChange,
  onLocationChange,
  onSubmit
}: FiltersPaneProps) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        onSubmit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSubmit]);

  return (
    <aside className="flex w-full flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm lg:w-72">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-primary" aria-hidden />
        <h2 className="text-sm font-semibold text-slate-700">Filters</h2>
      </div>
      <SearchBox value={query} onChange={onQueryChange} onSubmit={onSubmit} />
      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-500" htmlFor="department">
          Department
        </label>
        <select
          id="department"
          value={department}
          onChange={(event) => onDepartmentChange(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
        <label className="block text-xs font-medium text-slate-500" htmlFor="location">
          Location
        </label>
        <select
          id="location"
          value={location}
          onChange={(event) => onLocationChange(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All locations</option>
          {locations.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={onSubmit}
        className="mt-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
      >
        Apply filters
      </button>
    </aside>
  );
}
