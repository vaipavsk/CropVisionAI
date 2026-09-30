import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Sprout,
  History,
  FileSpreadsheet,
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
  Sparkles,
  UserCheck,
  Activity
} from 'lucide-react';
import { useTheme } from '../theme';
import useAuth from '../hooks/useAuth';

export function FarmerLayout({ children, activeTab, setActiveTab }) {
  const { isDark, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sidebarItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard, path: '/farmer/dashboard' },
    { id: 'upload', label: 'Specimen Workspace', icon: Sprout, path: '/farmer/upload' },
    { id: 'history', label: 'Prediction Logs', icon: History, path: '/farmer/history' },
    { id: 'claims', label: 'Claims & Financials', icon: FileSpreadsheet, path: '/farmer/claims' },
    { id: 'profile', label: 'Farmer Profile', icon: User, path: '/farmer/profile' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/farmer/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const currentTab = activeTab || 'dashboard';

  const getPageTitle = () => {
    const activeItem = sidebarItems.find((item) => item.id === currentTab);
    return activeItem ? activeItem.label : 'Farmer Command Center';
  };

  const handleItemClick = (item) => {
    if (setActiveTab) {
      setActiveTab(item.id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      {/* Background Decorative Lighting */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute top-1/3 -left-40 h-[450px] w-[450px] rounded-full bg-teal-500/10 blur-[140px]" />
      </div>

      <div className="flex flex-1 relative z-10 overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside
          className={`
            hidden md:flex flex-col relative z-20 border-r transition-all duration-300
            bg-slate-950/80 border-white/10 backdrop-blur-xl
            ${isSidebarOpen ? 'w-64' : 'w-20'}
          `}
        >
          {/* Sidebar Header */}
          <div className="flex h-20 items-center justify-between px-4 border-b border-white/10">
            <Link to="/farmer/dashboard" className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/20">
                <Sparkles size={20} />
              </div>
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="whitespace-nowrap text-left"
                >
                  <p className="text-sm font-black tracking-wide text-white leading-none">CropVisionAI</p>
                  <span className="text-xs uppercase tracking-wider font-bold text-emerald-400">
                    Farmer Portal
                  </span>
                </motion.div>
              )}
            </Link>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 space-y-1.5 px-3 py-6">
            {sidebarItems.map((item) => {
              const isActive = currentTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Navigate to ${item.label}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleItemClick(item)}
                  className={`
                    w-full relative flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-xs font-bold transition-all duration-300 outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400
                    ${isActive 
                      ? 'text-emerald-300 font-extrabold' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFarmerIndicator"
                      className="absolute inset-0 z-0 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border-l-4 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}

                  <div className={`relative z-10 ${isActive ? 'text-emerald-400' : ''}`}>
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
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            {isSidebarOpen && (
              <div className="flex items-center gap-3 overflow-hidden text-left">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-xs shadow-md">
                  FP
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white truncate max-w-[120px]">
                    {user?.displayName || user?.email?.split('@')[0] || 'Farmer User'}
                  </p>
                  <span className="text-xs text-emerald-400 font-semibold block">Authorized Farmer</span>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400"
              aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
              />

              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative z-10 w-72 flex flex-col h-full bg-slate-950 border-r border-white/10 text-white"
              >
                <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-bold">
                      <Sparkles size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold">CropVisionAI</p>
                      <span className="text-xs uppercase tracking-wider font-bold text-emerald-400">
                        Farmer Portal
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="Close navigation menu"
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
                        type="button"
                        onClick={() => {
                          handleItemClick(item);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`
                          w-full relative flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-xs font-bold transition-all duration-300 text-left cursor-pointer
                          ${isActive 
                            ? 'text-emerald-300 font-extrabold bg-emerald-500/10 border-l-4 border-emerald-400' 
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }
                        `}
                      >
                        <Icon size={18} className={isActive ? 'text-emerald-400' : ''} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className="p-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                      FP
                    </div>
                    <p className="text-xs font-bold text-white">Farmer Account</p>
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

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* TOPBAR */}
          <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b px-6 backdrop-blur-xl bg-slate-950/80 border-white/10">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white md:hidden cursor-pointer"
              aria-label="Open navigation drawer"
            >
              <Menu size={20} />
            </button>

            <div className="hidden sm:flex items-center gap-3 text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <UserCheck size={14} />
                Farmer Portal
              </span>
              <span className="opacity-30">/</span>
              <span className="text-white font-extrabold">{getPageTitle()}</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-3 rounded-full border border-white/10 bg-slate-900/80 px-4 py-1.5 text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Wifi size={13} className="animate-pulse" />
                  FastAPI Gateway: Online
                </span>
                <span className="opacity-30">|</span>
                <span className="flex items-center gap-1.5 text-teal-400">
                  <Database size={13} />
                  MySQL: Synced
                </span>
              </div>

              <button
                onClick={toggleTheme}
                className="rounded-full p-2.5 border border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-800 transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label="Toggle theme mode"
              >
                {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
              </button>

              <div className="h-6 w-[1px] bg-white/10" />

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs font-bold rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-red-400"
                aria-label="Logout"
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
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </main>

          {/* STATUSBAR */}
          <footer className="h-10 border-t border-white/10 flex items-center justify-between px-6 text-xs font-semibold backdrop-blur-xl bg-slate-950/90 text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Wifi size={12} className="animate-pulse" />
                API Status: Healthy
              </span>
              <span className="hidden sm:inline opacity-30">|</span>
              <span className="hidden sm:flex items-center gap-1.5 text-teal-400">
                <Cpu size={12} />
                Models: EfficientNet-B0 Classifier + Grad-CAM XAI
              </span>
            </div>
            <div>
              <span>CropVisionAI Mission Control v2.5</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default FarmerLayout;
