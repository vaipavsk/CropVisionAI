import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export function Modal({
  isOpen = false,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
}) {
  // Close on Esc key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full m-4',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          {/* Modal Content container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className={`
              relative w-full overflow-hidden rounded-2xl border shadow-xl backdrop-blur-lg z-10
              bg-white/90 border-slate-200 text-slate-900
              dark:bg-slate-900/90 dark:border-emerald-500/15 dark:text-white
              ${sizes[size] || sizes.md}
              ${className}
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/50 p-4 dark:border-white/5 sm:px-6">
              {title && (
                <h3 className="text-lg font-bold tracking-wide text-slate-900 dark:text-white">
                  {title}
                </h3>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5 dark:hover:text-white cursor-pointer"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable body content */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
