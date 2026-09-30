import { useState } from 'react';
import { ArrowRight, Menu, Sparkles, X, LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useRole from '../../hooks/useRole';

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'About', href: '#about' },
];

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { role } = useRole();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      // Gracefully catch logout issues
    }
  };

  const isInspectorRole = role === 'INSPECTOR' || role === 'ADMIN';
  const dashboardPath = isInspectorRole ? '/inspector/dashboard' : '/farmer/dashboard';

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <nav className="rounded-full border border-emerald-500/20 bg-slate-950/80 shadow-[0_0_50px_rgba(16,185,129,0.15)] backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center gap-3" aria-label="CropVisionAI home">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/25">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-base font-bold tracking-wide text-white">CropVisionAI</p>
                <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-400/80 font-semibold">
                  XAI Crop Intelligence
                </p>
              </div>
            </Link>

            <div className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 transition-all duration-300 hover:bg-emerald-500/10 hover:text-emerald-300"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              {user ? (
                <>
                  <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-400">
                    {isInspectorRole ? <ShieldCheck size={14} /> : <UserCheck size={14} />}
                    <span>{isInspectorRole ? 'Inspector Portal' : 'Farmer Portal'}</span>
                  </div>
                  <Link
                    to={dashboardPath}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-200 transition-all duration-300 hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:text-emerald-300"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-slate-950 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25 cursor-pointer"
                  >
                    Logout
                    <LogOut size={14} />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/farmer/login"
                    className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-300 transition-all duration-300 hover:bg-emerald-500/20"
                  >
                    Farmer Portal
                  </Link>
                  <Link
                    to="/inspector/login"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-slate-950 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25"
                  >
                    Inspector Portal
                    <ArrowRight size={14} />
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="rounded-full border border-emerald-400/20 bg-white/5 p-2 text-emerald-300 transition hover:border-emerald-400/40 hover:bg-emerald-500/10 lg:hidden"
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="border-t border-white/10 px-4 py-4 lg:hidden">
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="rounded-2xl px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 transition hover:bg-emerald-500/10 hover:text-emerald-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {user ? (
                  <>
                    <div className="flex items-center justify-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400">
                      {isInspectorRole ? <ShieldCheck size={14} /> : <UserCheck size={14} />}
                      <span>{isInspectorRole ? 'Inspector Portal' : 'Farmer Portal'}</span>
                    </div>
                    <Link
                      to={dashboardPath}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-slate-200 transition hover:border-emerald-400/40 hover:text-emerald-300"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleLogout();
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-slate-950 cursor-pointer"
                    >
                      Logout
                      <LogOut size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/farmer/login"
                      className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-500/20"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Farmer Portal
                    </Link>
                    <Link
                      to="/inspector/login"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-center text-xs font-extrabold uppercase tracking-wider text-slate-950"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Inspector Portal
                      <ArrowRight size={14} />
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
