export function Badge({
  children,
  variant = 'primary',
  className = '',
  ...props
}) {
  const styles = {
    primary: 'bg-primary-500/10 text-primary-700 border-primary-500/20 dark:text-primary-300 dark:bg-primary-500/15',
    secondary: 'bg-secondary-500/10 text-secondary-700 border-secondary-500/20 dark:text-secondary-300 dark:bg-secondary-500/15',
    success: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300 dark:bg-emerald-500/15',
    warning: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300 dark:bg-amber-500/15',
    danger: 'bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-300 dark:bg-red-500/15',
    info: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/25 dark:text-accent-cyan dark:bg-accent-cyan/15',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold
        tracking-wide backdrop-blur-xs transition-all duration-300
        ${styles[variant] || styles.primary}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
