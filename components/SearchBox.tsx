import { forwardRef, InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';

export interface SearchBoxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(function SearchBox(
  { className = '', label = 'Search', ...props },
  ref
) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" aria-hidden />
      <input
        ref={ref}
        {...props}
        aria-label={props['aria-label'] ?? label}
        className="w-full rounded-xl border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100"
        type={props.type ?? 'search'}
      />
    </div>
  );
});

export default SearchBox;
