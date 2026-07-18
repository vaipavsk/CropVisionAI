import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Sparkles, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/common/Button';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validations
    if (!email) {
      setError('Email is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email);
      setSuccess('A secure password reset email has been dispatched. Please inspect your inbox and spam directories.');
      setEmail('');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('No registered scholar account detected with this email address.');
      } else {
        setError(err.message || 'Failed to dispatch password reset request. Please check input parameters.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text px-4 py-12">
      {/* Premium background decorative glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand logo container */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/25 mb-4">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
            Recover Access
          </h1>
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-500 dark:text-emerald-400 font-bold mt-1.5">
            XAI Recovery Center
          </p>
        </div>

        <Card hoverable={false} className="shadow-2xl border border-slate-200/60 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-100">
            Reset Password
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Enter your registered scholar email address. We will verify your parameters and dispatch password recovery instructions.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-start gap-2.5"
              >
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-start gap-2.5"
              >
                <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{success}</span>
              </motion.div>
            )}

            <Input
              id="email"
              type="email"
              label="Scholar Email Address"
              placeholder="vipin.kumar@research.edu"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="mt-2"
            >
              Dispatch Recovery Instructions
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-200/60 dark:border-white/5 pt-4 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              Return to login portal
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
