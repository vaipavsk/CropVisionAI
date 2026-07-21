import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import useAuth from '../../hooks/useAuth';
import useRole from '../../hooks/useRole';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/common/Button';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { syncUserRegistration } = useRole();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password strength calculation
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: 'None', color: 'bg-slate-300 dark:bg-slate-700' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score === 2 || score === 3) return { score, label: 'Medium', color: 'bg-amber-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }
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
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Firebase auth register
      const userCredential = await register(email, password);
      
      // 2. Set the displayName in the Firebase user profile
      if (userCredential?.user) {
        await updateProfile(userCredential.user, {
          displayName: fullName.trim()
        });
      }

      // 3. Synchronize user profile into MySQL database
      await syncUserRegistration(fullName.trim());

      navigate('/farmer/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      // Firebase standard auth errors mapping
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email address already exists.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (err.code === 'auth/weak-password') {
        setError('The password is too weak. Please use at least 6 characters.');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.request && !err.response) {
        setError('Unable to connect to backend server. Please verify the API backend is running.');
      } else {
        setError(err.message || 'Failed to create an account. Please try again.');
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
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/25 mb-4">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
            Create Farmer Account
          </h1>
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-500 dark:text-emerald-400 font-bold mt-1.5">
            Farmer Registration
          </p>
        </div>

        <Card hoverable={false} className="shadow-2xl border border-slate-200/60 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-5 text-slate-800 dark:text-slate-100">
            Register
          </h2>

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

            <Input
              id="fullName"
              type="text"
              label="Full Name"
              placeholder="Vipin Kumar"
              icon={User}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              required
            />

            <Input
              id="email"
              type="email"
              label="Farmer Email"
              placeholder="farmer@example.com"
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
                label="Secure Password"
                placeholder="Min 6 characters"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
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

            {/* Password strength indicator UI */}
            {password && (
              <div className="space-y-1.5 px-1">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-slate-400">Password Strength:</span>
                  <span className={
                    strength.label === 'Weak' ? 'text-red-500' :
                    strength.label === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
                  }>{strength.label}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  <div className={`h-1.5 rounded-full transition-colors duration-300 ${strength.score >= 1 ? strength.color : 'bg-slate-200 dark:bg-slate-800'}`} />
                  <div className={`h-1.5 rounded-full transition-colors duration-300 ${strength.score >= 2 ? strength.color : 'bg-slate-200 dark:bg-slate-800'}`} />
                  <div className={`h-1.5 rounded-full transition-colors duration-300 ${strength.score >= 3 ? strength.color : 'bg-slate-200 dark:bg-slate-800'}`} />
                  <div className={`h-1.5 rounded-full transition-colors duration-300 ${strength.score >= 4 ? strength.color : 'bg-slate-200 dark:bg-slate-800'}`} />
                </div>
              </div>
            )}

            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                label="Confirm Password"
                placeholder="Re-enter password"
                icon={Lock}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                tabIndex="-1"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-[32px] text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition cursor-pointer"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="mt-4"
            >
              Register & Initialize Dashboard
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            <span>Already have a farmer account? </span>
            <Link
              to="/farmer/login"
              className="font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition"
            >
              Sign in instead
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
