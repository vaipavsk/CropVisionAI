import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useRole from '../../hooks/useRole';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/common/Button';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { fetchRoleProfile } = useRole();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('remembered_email');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
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
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      
      // Save or clear remembered email
      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      // Fetch backend database profile to verify status and role
      const userProfile = await fetchRoleProfile();

      if (!userProfile) {
        setError('User account not found in database. Please complete registration.');
        return;
      }

      if (userProfile.status === 'INACTIVE') {
        setError('User account is deactivated. Please contact administration.');
        return;
      }

      // Navigate based on backend role clearance
      if (userProfile.role === 'ADMIN') {
        navigate('/admin');
      } else if (userProfile.role === 'INSPECTOR') {
        navigate('/inspector');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      // Firebase standard auth errors mapping
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Account temporarily disabled due to too many failed login attempts. Please try again later.');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError(err.message || 'Failed to sign in. Please try again.');
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
            Welcome to CropVisionAI
          </h1>
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-500 dark:text-emerald-400 font-bold mt-1.5">
            XAI Claim Verification Gateway
          </p>
        </div>

        <Card hoverable={false} className="shadow-2xl border border-slate-200/60 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-100">
            Sign In
          </h2>

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

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                label="Secure Access Password"
                placeholder="••••••••"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                endIcon={showPassword ? EyeOff : Eye}
              />
              {/* Overlay button for endIcon functionality */}
              <button
                type="button"
                tabIndex="-1"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-[32px] text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="rounded border-slate-300 dark:border-white/10 text-emerald-500 focus:ring-emerald-500 bg-white/50 dark:bg-slate-900/50 h-4 w-4 transition cursor-pointer"
                />
                Remember Me
              </label>

              <Link
                to="/forgot-password"
                className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="mt-2"
            >
              Sign In to Mission Control
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            <span>New user or claim inspector? </span>
            <Link
              to="/register"
              className="font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition"
            >
              Register here
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
