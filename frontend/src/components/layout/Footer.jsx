import { Github, Mail, MapPin, Sparkles } from 'lucide-react';

const footerLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Get Started', href: '#get-started' },
];

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">CropVisionAI</p>
                <p className="text-sm text-slate-400">XAI-driven crop damage assessment</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Empowering modern insurance verification with transparent AI insights from farmer-captured crop images.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Navigate</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-400">
                {footerLinks.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="transition hover:text-emerald-300">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Contact</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <Mail size={15} className="text-emerald-300" />
                  support@cropvisionai.com
                </li>
                <li className="flex items-center gap-2">
                  <MapPin size={15} className="text-emerald-300" />
                  Remote • Global Reach
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Community</h3>
              <a
                href="#"
                className="mt-4 flex items-center gap-2 text-sm text-slate-400 transition hover:text-emerald-300"
              >
                <Github size={15} className="text-emerald-300" />
                GitHub Placeholder
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 CropVisionAI. All rights reserved.</p>
          <p>Built for AI-powered agricultural insurance workflows.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
