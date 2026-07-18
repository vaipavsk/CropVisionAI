import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import Spinner from '../ui/Spinner';

export const Button = forwardRef(({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  endIcon: EndIcon,
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary-500/10 disabled:opacity-50 disabled:cursor-not-allowed select-none w-full';

  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 border border-transparent shadow-sm dark:shadow-neon-emerald/20 hover:scale-[1.01] active:scale-[0.99]',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 border border-transparent hover:scale-[1.01] active:scale-[0.99]',
    outline: 'border border-slate-200 bg-white/50 dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:hover:border-emerald-500/30 hover:scale-[1.01] active:scale-[0.99]',
    danger: 'bg-red-500 hover:bg-red-600 text-white border border-transparent hover:scale-[1.01] active:scale-[0.99]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      whileTap={(!disabled && !isLoading) ? { scale: 0.98 } : undefined}
      whileHover={(!disabled && !isLoading) ? { scale: 1.01 } : undefined}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <Spinner size="sm" color={variant === 'primary' || variant === 'danger' ? 'white' : 'primary'} />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      ) : null}
      
      <span>{children}</span>
      
      {!isLoading && EndIcon && (
        <EndIcon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';
export default Button;
