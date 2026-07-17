import { motion } from 'framer-motion';

export function Card({
  children,
  className = '',
  hoverable = true,
  glow = false,
  onClick,
  ...props
}) {
  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      onClick={onClick}
      className={`
        relative text-left overflow-hidden rounded-2xl border transition-all duration-300 w-full
        bg-light-surface-glass border-light-border backdrop-blur-md shadow-sm
        dark:bg-dark-surface-glass dark:border-dark-border dark:shadow-glass
        ${glow ? 'shadow-neon-emerald dark:border-primary-500/25 border-emerald-400/30' : ''}
        ${onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/50' : ''}
        ${className}
      `}
      whileHover={hoverable ? { 
        y: -4, 
        boxShadow: glow 
          ? '0 0 25px rgba(16, 185, 129, 0.45)' 
          : '0 12px 30px -10px rgba(0, 0, 0, 0.15), 0 0 20px rgba(16, 185, 129, 0.05)',
        borderColor: 'rgba(16, 185, 129, 0.45)'
      } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      {...props}
    >
      {/* Premium organic accent glow line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary-400/50 to-transparent opacity-0 dark:opacity-100" />
      <div className="p-5 md:p-6">{children}</div>
    </Component>
  );
}

export default Card;
