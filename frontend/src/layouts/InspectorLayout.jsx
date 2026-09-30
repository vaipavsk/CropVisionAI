import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Sun,
  Moon,
  Menu,
  X,
  Database,
  Cpu,
  Wifi,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '../theme';
import useAuth from '../hooks/useAuth';

export function InspectorLayout({ children, activeTab, setActiveTab }) {
  const { isDark, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pending', label: 'Pending Claims', icon: Clock },
    { id: 'approved', label: 'Approved Claims', icon: CheckCircle },
    { id: 'rejected', label: 'Rejected Claims', icon: XCircle },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/inspector/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const currentTab = activeTab || 'dashboard';

  const getPageTitle = () => {
    const activeItem = sidebarItems.find((item) => item.id === currentTab);
    return activeItem ? activeItem.label : 'Inspector Dashboard';
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text">
      
      {/* BACKGROUND DECORATIVE GLOWS */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[400px] w-[400px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl" />
        <div className="absolute top-1/2 left-[-200px] h-[350px] w-[350px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/5 blur-3xl" />
      </div>

      <div className="flex flex-1 relative overflow-hidden">
        
        {/* DESKTOP SIDEBAR */}
        <aside
          className={`
            hidden md:flex flex-col relative z-20 border-r transition-all duration-300
            bg-white/80 border-slate-200 dark:bg-slate-950/80 dark:border-white/5 backdrop-blur-xl
            ${isSidebarOpen ? 'w-64' : 'w-20'}
          `}
        >
          {/* Sidebar Header */}
          <div className="flex h-20 items-center justify-between px-4 border-b border-slate-200/50 dark:border-white/5">
            <Link to="/inspector/dashboard" className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-md shadow-emerald-500/10">
                <ShieldCheck size={18} />
              </div>
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="whitespace-nowrap"
                >
                  <p className="text-sm font-bold tracking-wide text-slate-900 dark:text-white leading-none">CropVisionAI</p>
                  <span className="text-xs uppercase tracking-wider font-semibold text-emerald-500 dark:text-emerald-400">
                    Inspector Portal
                  </span>
                </motion.div>
              )}
            </Link>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 space-y-1.5 px-3 py-4">
            {sidebarItems.map((item) => {
              const isActive = currentTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  aria-label={`Navigate to ${item.label}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => {
                    if (setActiveTab) setActiveTab(item.id);
                  }}
                  className={`
                    w-full relative flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium tracking-wide transition-all duration-300 outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400
                    ${isActive 
                      ? 'text-emerald-600 dark:text-emerald-300 font-semibold' 
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeInspectorIndicator"
                      className="absolute inset-0 z-0 rounded-xl bg-emerald-500/10 border-l-[3px] border-emerald-500 dark:bg-emerald-500/10"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}

                  <div className={`relative z-10 ${isActive ? 'text-emerald-500 dark:text-emerald-400' : ''}`}>
                    <Icon size={18} />
                  </div>

                  {isSidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="relative z-10 whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between">
            {isSidebarOpen && (
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-8 w-8 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  IP
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold leading-tight text-slate-800 dark:text-white truncate max-w-[120px]">
                    {user?.displayName || user?.email?.split('@')[0] || 'Inspector User'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Claim Inspector</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </aside>

        {/* MOBILE DRAWER SIDEBAR */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-40 md:hidden flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
              />

              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative z-10 w-72 flex flex-col h-full bg-slate-900 border-r border-white/5 text-white"
              >
                <div className="flex h-16 items-center justify-between px-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-md">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold tracking-wide">CropVisionAI</p>
                      <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
                        Inspector Portal
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-white/5 hover:text-white cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <nav className="flex-1 space-y-1.5 px-3 py-4">
                  {sidebarItems.map((item) => {
                    const isActive = currentTab === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        aria-label={`Navigate to ${item.label}`}
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => {
                          if (setActiveTab) setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`
                          w-full relative flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-300 text-left
                          ${isActive 
                            ? 'text-emerald-300 font-semibold bg-emerald-500/10 border-l-[3px] border-emerald-500' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }
                        `}
                      >
                        <Icon size={18} className={isActive ? 'text-emerald-400' : ''} aria-hidden="true" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className="p-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 font-bold text-xs">
                      IP
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-white">Inspector User</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-red-400 cursor-pointer"
                    aria-label="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* MAIN BODY LAYOUT */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          
          {/* TOPBAR */}
          <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b px-6 backdrop-blur-md bg-white/70 border-slate-200/80 dark:bg-slate-950/70 dark:border-white/5">
            
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white md:hidden cursor-pointer"
              aria-label="Open navigation drawer"
            >
              <Menu size={20} />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="opacity-80">Inspector Dashboard</span>
              <span className="opacity-40">/</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{getPageTitle()}</span>
            </div>
            
            <div className="sm:hidden font-bold text-sm tracking-wide text-slate-900 dark:text-white">
              {getPageTitle()}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="rounded-full p-2 border border-slate-200 bg-white/50 text-slate-700 shadow-sm hover:bg-slate-100 dark:border-white/5 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800 transition-all duration-300 cursor-pointer"
                aria-label="Toggle theme mode"
              >
                <motion.div
                  key={isDark ? 'dark' : 'light'}
                  initial={{ rotate: -90, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  exit={{ rotate: 90, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  {isDark ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
                </motion.div>
              </button>

              <div className="h-6 w-[1px] bg-slate-200 dark:bg-white/5" />

              <button
                onClick={handleLogout}
                aria-label="Logout"
                className="flex items-center gap-1 text-xs font-semibold border border-transparent rounded-full px-3 py-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-red-400 cursor-pointer transition-all"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </header>

          {/* MAIN PAGE VIEW CONTENT */}
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </main>

          {/* STATUSBAR */}
          <footer className="h-10 border-t flex items-center justify-between px-4 text-xs font-semibold tracking-wide backdrop-blur-md bg-white/70 border-slate-200/80 dark:bg-slate-950/70 dark:border-white/5 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Wifi size={12} className="text-emerald-500 animate-pulse" />
                FastAPI Gateway: <span className="text-emerald-500 dark:text-emerald-400">Online (12ms)</span>
              </span>
              <span className="hidden sm:inline opacity-40">|</span>
              <span className="hidden sm:flex items-center gap-1.5">
                <Cpu size={12} className="text-cyan-500 animate-pulse" />
                Underwriting Intelligence: <span className="text-cyan-500">Active</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Database size={12} className="text-emerald-500" />
                MySQL Database: <span className="text-emerald-500 dark:text-emerald-400">Synced</span>
              </span>
            </div>
          </footer>

        </div>
      </div>
    </div>
  );
}

export default InspectorLayout;
