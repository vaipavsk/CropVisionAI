import { useState } from 'react';
import { ArrowRight, Menu, Sparkles, X } from 'lucide-react';

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'About', href: '#about' },
];

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <nav className="rounded-full border border-emerald-400/20 bg-slate-900/70 shadow-[0_0_45px_rgba(16,185,129,0.18)] backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <a href="#home" className="flex items-center gap-3" aria-label="CropVisionAI home">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-base font-semibold tracking-wide text-white">CropVisionAI</p>
                <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-300/70">
                  XAI Crop Intelligence
                </p>
              </div>
            </a>

            <div className="hidden items-center gap-2 md:flex">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition-all duration-300 hover:bg-emerald-500/10 hover:text-emerald-300"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <a
                href="#login"
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition-all duration-300 hover:border-emerald-400/40 hover:text-emerald-300"
              >
                Login
              </a>
              <a
                href="#get-started"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-slate-950 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-emerald-500/25"
              >
                Get Started
                <ArrowRight size={16} />
              </a>
            </div>

            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="rounded-full border border-emerald-400/20 bg-white/5 p-2 text-emerald-300 transition hover:border-emerald-400/40 hover:bg-emerald-500/10 md:hidden"
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="border-t border-white/10 px-4 py-4 md:hidden">
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="rounded-2xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-emerald-500/10 hover:text-emerald-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <a
                  href="#login"
                  className="rounded-full border border-white/10 px-4 py-2 text-center text-sm font-medium text-slate-200 transition hover:border-emerald-400/40 hover:text-emerald-300"
                >
                  Login
                </a>
                <a
                  href="#get-started"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  Get Started
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
