import { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';

export function SearchBar({
  value = '',
  onChange,
  onClear,
  placeholder = 'Search crops, diseases, or reports...',
  onSubmit,
  className = '',
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const handleClear = () => {
    if (onClear) onClear();
    if (onChange) onChange({ target: { value: '' } });
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(value);
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className={`
        relative flex items-center w-full transition-all duration-300 rounded-full border px-4 py-2
        bg-white/60 border-slate-300
        focus-within:border-primary-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-primary-500/10
        dark:bg-slate-950/40 dark:border-white/10
        dark:focus-within:border-primary-400 dark:focus-within:bg-slate-950/80 dark:focus-within:ring-primary-500/10
        ${isFocused ? 'shadow-md shadow-primary-500/5' : 'shadow-sm'}
        ${className}
      `}
      {...props}
    >
      <Search className="h-5 w-5 text-slate-400 dark:text-slate-500 mr-2 flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full bg-transparent text-sm text-slate-900 outline-none border-none placeholder-slate-400 dark:text-white dark:placeholder-slate-500"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-white flex-shrink-0 cursor-pointer ml-1"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}

export default SearchBar;
