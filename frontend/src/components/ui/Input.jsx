import { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  endIcon: EndIcon,
  className = '',
  id,
  ...props
}, ref) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-semibold tracking-wide uppercase text-light-text dark:text-dark-text opacity-85"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-slate-400 dark:text-slate-500">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          id={id}
          className={`
            w-full rounded-xl border px-4 py-2.5 text-sm transition-all duration-300 outline-none
            bg-white/60 border-slate-300 text-slate-900 placeholder-slate-400
            focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10
            dark:bg-slate-950/40 dark:border-white/10 dark:text-white dark:placeholder-slate-500
            dark:focus:border-primary-400 dark:focus:bg-slate-950/80 dark:focus:ring-primary-500/10
            ${Icon ? 'pl-11' : ''}
            ${EndIcon ? 'pr-11' : ''}
            ${error 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10 dark:border-red-500/40 dark:focus:border-red-500' 
              : ''
            }
          `}
          {...props}
        />
        {EndIcon && (
          <div className="absolute right-3.5 text-slate-400 dark:text-slate-500">
            <EndIcon size={18} />
          </div>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-500 tracking-wide">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
