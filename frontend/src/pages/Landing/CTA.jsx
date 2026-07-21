import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export function CTA() {
  return (
    <section id="get-started" className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[32px] border border-emerald-400/20 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl sm:p-10 lg:p-12"
      >
        {/* Glow rings in CTA background */}
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="max-w-2xl text-left">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              <Sparkles size={14} className="animate-pulse" />
              Research Sandbox
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl leading-tight">
              Ready to explore crop diagnostics?
            </h2>
            <p className="mt-4 text-base text-slate-300 leading-relaxed">
              Access CropVisionAI portals to analyze crop disease symptoms, submit insurance claims, or inspect underwriting diagnostics.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <Link
              to="/farmer/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-md shadow-emerald-500/15 hover:scale-[1.02] transition"
            >
              Farmer Portal
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/inspector/login"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-6 py-3.5 text-sm font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
            >
              Inspector Portal
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default CTA;
