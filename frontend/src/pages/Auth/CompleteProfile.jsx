import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Shield, Sparkles, AlertCircle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useRole from '../../hooks/useRole';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/common/Button';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { syncUserRegistration } = useRole();
  
  const [fullName, setFullName] = useState(user?.displayName || '');
  const [role, setRole] = useState(() => localStorage.getItem('registration_role') || 'FARMER');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }

    setIsLoading(true);
    try {
      const profile = await syncUserRegistration(fullName.trim(), role);
      localStorage.removeItem('registration_role');
      if (profile && profile.role === 'INSPECTOR') {
        navigate('/inspector/dashboard');
      } else {
        navigate('/farmer/dashboard');
      }
    } catch (err) {
      console.error('Profile completion sync error:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError(err.message || 'Failed to complete profile synchronization. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text px-4 py-12">
      {/* Background decorative glows */}
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
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 mb-4">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
            Complete Profile Setup
          </h1>
          <p className="text-xs uppercase tracking-[0.25em] text-amber-500 dark:text-amber-400 font-bold mt-1.5">
            Database Sync Required
          </p>
        </div>

        <Card hoverable={false} className="shadow-2xl border border-slate-200/60 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center leading-relaxed">
            Welcome back! You are authenticated with Firebase, but we need a few details to register your account in our local MySQL database.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="space-y-1">
              <label htmlFor="role" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Account Type
              </label>
              <div className="relative">
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200/80 bg-white/50 dark:border-white/10 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold transition cursor-pointer appearance-none"
                >
                  <option value="FARMER" className="dark:bg-slate-900">Farmer</option>
                  <option value="INSPECTOR" className="dark:bg-slate-900">Insurance Inspector</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <Shield size={16} />
                </div>
              </div>
            </div>

            <Input
              id="fullName"
              type="text"
              label="Full Name"
              placeholder="e.g. Vipin Kumar"
              icon={User}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              required
            />

            <div className="pt-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
              Registered Email: <span className="font-semibold text-slate-600 dark:text-slate-300">{user?.email}</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="mt-4"
            >
              Initialize Account Profile
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
