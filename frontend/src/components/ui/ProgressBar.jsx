import { motion } from 'framer-motion';

export function ProgressBar({
  value = 0,
  max = 100,
  variant = 'primary',
  showLabel = true,
  size = 'md',
  className = '',
}) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

  const gradients = {
    primary: 'from-emerald-500 to-emerald-400 dark:from-emerald-600 dark:to-emerald-400',
    secondary: 'from-amber-500 to-yellow-400 dark:from-amber-600 dark:to-yellow-400',
    cyan: 'from-accent-cyan to-teal-400 dark:from-accent-cyan dark:to-teal-500',
    danger: 'from-red-500 to-red-400 dark:from-red-600 dark:to-red-400',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-3',
    lg: 'h-5',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-light-text dark:text-dark-text">
          <span className="opacity-80">Progress</span>
          <span className="text-primary-500 dark:text-primary-400">{Math.round(percentage)}%</span>
        </div>
      )}
      <div 
        className={`
          w-full overflow-hidden rounded-full border bg-slate-200/50 border-slate-300/30
          dark:bg-slate-800/40 dark:border-white/5 shadow-inner
          ${sizes[size] || sizes.md}
        `}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`
            h-full rounded-full bg-gradient-to-r shadow-neon-emerald
            ${gradients[variant] || gradients.primary}
          `}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
