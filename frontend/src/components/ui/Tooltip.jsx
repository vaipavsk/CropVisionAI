import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Tooltip({
  children,
  content,
  position = 'top',
  className = '',
}) {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const animations = {
    top: { initial: { opacity: 0, y: 4, scale: 0.95 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 4, scale: 0.95 } },
    bottom: { initial: { opacity: 0, y: -4, scale: 0.95 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -4, scale: 0.95 } },
    left: { initial: { opacity: 0, x: 4, scale: 0.95 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: 4, scale: 0.95 } },
    right: { initial: { opacity: 0, x: -4, scale: 0.95 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: -4, scale: 0.95 } },
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            initial={animations[position].initial}
            animate={animations[position].animate}
            exit={animations[position].exit}
            transition={{ duration: 0.15 }}
            className={`
              absolute z-[999] whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-md backdrop-blur-md pointer-events-none
              bg-slate-900/90 border-slate-700 text-slate-100
              dark:bg-slate-950/95 dark:border-primary-500/20 dark:text-emerald-300
              ${positions[position]}
              ${className}
            `}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Tooltip;
