import { motion } from 'framer-motion';
import {
  ArrowRight,
  BrainCircuit,
  Leaf,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const featurePills = [
  'YOLOv8 Detection',
  'Grad-CAM Explainability',
  'Insurance Ready',
];

function Hero() {
  return (
    <section id="home" className="relative isolate overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.24),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.16),_transparent_30%)]" />

      <div className="mx-auto flex min-h-[calc(100vh-88px)] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-8 rounded-[32px] border border-white/10 bg-slate-900/60 p-6 shadow-[0_25px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr] lg:p-10 xl:p-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
              <Sparkles size={16} />
              AI Powered Crop Insurance
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Smart Crop Damage Assessment Using Explainable AI
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
              CropVisionAI automates crop insurance verification by analyzing farmer-captured images, detecting visible damage, and explaining every decision with transparent AI insights.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <motion.a
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                href="#get-started"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-slate-950 transition"
              >
                Get Started
                <ArrowRight size={16} />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                href="#learn-more"
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-emerald-400/40 hover:text-emerald-300"
              >
                Learn More
              </motion.a>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {featurePills.map((label) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300"
                >
                  <ShieldCheck size={15} className="text-emerald-300" />
                  {label}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1, repeat: Infinity, repeatType: 'mirror', duration: 3.5 }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-emerald-500/20 via-transparent to-cyan-400/20 blur-3xl" />
            <div className="relative rounded-[28px] border border-emerald-400/20 bg-slate-950/70 p-5 shadow-2xl shadow-emerald-500/10">
              <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(16,185,129,0.06))] p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-300">AI Scan Status</p>
                    <p className="text-xl font-semibold text-white">Damage Analysis Active</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                    <ScanSearch size={22} />
                  </div>
                </div>

                <div className="mt-6 rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
                  <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-[20px] border border-emerald-400/20 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.22),_transparent_45%),linear-gradient(135deg,_rgba(2,6,23,1),_rgba(15,23,42,0.95))]">
                    <div className="absolute inset-4 rounded-[18px] border border-dashed border-emerald-400/20" />
                    <div className="absolute left-8 top-8 h-20 w-20 rounded-full border border-emerald-400/20 bg-emerald-500/10" />
                    <div className="absolute bottom-8 right-8 h-16 w-16 rounded-full border border-cyan-400/20 bg-cyan-400/10" />
                    <div className="relative flex flex-col items-center text-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                        <Leaf size={24} />
                      </div>
                      <p className="text-sm font-semibold text-white">Crop Image Placeholder</p>
                      <p className="mt-1 text-sm text-slate-400">Visual inspection in progress</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3 text-center">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Damage</p>
                    <p className="mt-1 text-lg font-semibold text-white">27%</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3 text-center">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Confidence</p>
                    <p className="mt-1 text-lg font-semibold text-white">94%</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3 text-center">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Claim</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-300">Approved</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
                    <BrainCircuit size={16} />
                    Explainable AI Output
                  </div>
                  <div className="rounded-full bg-slate-950/70 px-3 py-1 text-sm text-slate-200">
                    Verified
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
