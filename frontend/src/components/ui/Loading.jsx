import { motion, AnimatePresence } from 'framer-motion';
import { Leaf } from 'lucide-react';
import Spinner from './Spinner';

export function Loading({
  visible = true,
  message = 'Initializing crop intelligence systems...',
  submessage = 'Connecting to YOLOv8 & EfficientNet services',
  fullPage = true,
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`
            z-[999] flex flex-col items-center justify-center p-6 text-center backdrop-blur-md
            ${fullPage 
              ? 'fixed inset-0 bg-slate-950/80' 
              : 'relative w-full min-h-[300px] bg-slate-900/40 rounded-2xl border border-emerald-500/10'
            }
          `}
        >
          {/* Animated pulse halo for agricultural theme */}
          <div className="relative mb-6">
            <motion.div
              animate={{ 
                scale: [1, 1.4, 1],
                opacity: [0.15, 0.4, 0.15]
              }}
              transition={{ 
                repeat: Infinity,
                duration: 2.5,
                ease: 'easeInOut'
              }}
              className="absolute -inset-4 rounded-full bg-primary-500/30 blur-xl"
            />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-primary-500/30 bg-slate-900 shadow-glass-glow">
              <Leaf className="h-9 w-9 text-primary-400 animate-pulse" />
            </div>
            {/* Spinning ring outside */}
            <div className="absolute inset-0">
              <Spinner size="lg" color="primary" className="absolute -inset-1 h-22 w-22 opacity-80" />
            </div>
          </div>

          <motion.h3 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg font-semibold tracking-wide text-white"
          >
            {message}
          </motion.h3>
          
          {submessage && (
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 0.7 }}
              transition={{ delay: 0.2 }}
              className="mt-2 text-sm text-emerald-300/70 tracking-wider uppercase font-medium"
            >
              {submessage}
            </motion.p>
          )}

          {/* Futuristic scanner line animation */}
          <div className="mt-8 w-48 h-[1px] bg-emerald-500/20 relative overflow-hidden rounded-full">
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary-400 to-transparent"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Loading;
