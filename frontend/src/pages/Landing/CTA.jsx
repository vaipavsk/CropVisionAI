import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

function CTA() {
  return (
    <section id="get-started" className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
        className="rounded-[32px] border border-emerald-400/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(15,23,42,0.95))] p-8 shadow-[0_25px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-10 lg:p-12"
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
              <Sparkles size={16} />
              Ready to Deploy
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Start using CropVisionAI to streamline crop damage assessment and claim verification.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Bring explainable AI into your insurance workflow today and help farmers and insurers make faster, better decisions.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <motion.a
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              href="#home"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition"
            >
              Get Started
              <ArrowRight size={16} />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              href="#features"
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-emerald-400/40 hover:text-emerald-300"
            >
              Explore Features
            </motion.a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default CTA;
