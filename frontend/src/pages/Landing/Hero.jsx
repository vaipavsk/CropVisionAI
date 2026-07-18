import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Badge from "../../components/ui/Badge";

import {
  ArrowRight,
  BrainCircuit,
  Leaf,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
const featurePills = [
  'YOLOv8 Real-time Detection',
  'Grad-CAM Pixel Saliency Map',
  'MySQL Synced Data Logs',
  'Firebase Secure Portal',
];

export function Hero() {
  return (
    <section id="home" className="relative isolate overflow-hidden min-h-[calc(100vh-80px)] flex items-center bg-slate-950">

      {/* ANIMATED AI BACKGROUND */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Shifting organic blobs */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            x: [0, 20, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-40 left-1/4 h-[550px] w-[550px] rounded-full bg-emerald-500/10 blur-[130px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -40, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-1/4 right-1/4 h-[450px] w-[450px] rounded-full bg-cyan-500/10 blur-[110px]"
        />

        {/* Lidar/Laser scan line running up and down */}
        <motion.div
          animate={{ y: ['-10%', '110%'] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent z-0"
        />

        {/* Digital Tech Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.04)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_75%,transparent_100%)]" />

        {/* Pinging digital node stars */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/3 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" style={{ animationDuration: '4s' }} />
          <div className="absolute top-3/4 left-1/5 h-2 w-2 rounded-full bg-cyan-400 animate-ping" style={{ animationDuration: '6s' }} />
          <div className="absolute top-1/2 left-4/5 h-1.5 w-1.5 rounded-full bg-emerald-300 animate-ping" style={{ animationDuration: '5s' }} />
          <div className="absolute top-1/3 left-3/4 h-2 w-2 rounded-full bg-emerald-500/40 animate-ping" style={{ animationDuration: '4.5s' }} />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 w-full z-10">
        <div className="grid w-full items-center gap-12 lg:grid-cols-12">

          {/* HERO LEFT COLUMN */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="lg:col-span-7 max-w-2xl text-left"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              <Sparkles size={14} className="animate-pulse" />
              M.Tech Research Initiative
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
              Smart Crop Damage Assessment Using
              <span className="block mt-2 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Explainable AI
              </span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              CropVisionAI automates crop insurance verification by analyzing farmer-captured images, detecting visible damage using YOLOv8, and explaining decisions with Grad-CAM saliency heatmaps.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.03] hover:shadow-emerald-500/30"
              >
                Access Mission Control
                <ArrowRight size={16} />
              </Link>
              <a
                href="#features"
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-emerald-400/40 hover:text-emerald-300"
              >
                Explore Technology
              </a>
            </div>

            <div className="mt-10 border-t border-white/5 pt-8">
              <p className="text-xs uppercase font-bold tracking-[0.2em] text-slate-500 mb-4">Core Integrations</p>
              <div className="flex flex-wrap gap-3">
                {featurePills.map((label) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-xl border border-white/5 bg-slate-900/40 px-3.5 py-2 text-xs font-semibold text-slate-300"
                  >
                    <ShieldCheck size={14} className="text-emerald-400" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* HERO RIGHT COLUMN (Mock AI Interface) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="lg:col-span-5 relative"
          >
            {/* Soft background glow */}
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-emerald-500/15 via-transparent to-cyan-500/15 blur-3xl" />

            {/* Premium Outer Card */}
            <div className="relative rounded-[32px] border border-emerald-400/20 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-xl">

              {/* Top Panel bar */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Telemetry Diagnostic</p>
                </div>
                <Badge variant="success">Claim Verified</Badge>
              </div>

              {/* Inside Mock Screen */}
              <div className="relative rounded-2xl border border-white/10 bg-slate-900/60 p-4">

                {/* Simulated Lidar Scan Area */}
                <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-xl border border-emerald-500/20 bg-slate-950">

                  {/* Grid inside monitor */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:16px_16px]" />

                  {/* Neon HUD outline */}
                  <div className="absolute inset-3 rounded-lg border border-dashed border-emerald-400/20 flex flex-col justify-between p-3 font-mono text-[9px] text-slate-500">
                    <div className="flex justify-between">
                      <span>SYS.OK</span>
                      <span>FPS: 60.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SCALE: 1:1</span>
                      <span>HEATMAP: ON</span>
                    </div>
                  </div>

                  {/* Pulsing Target Ring */}
                  <motion.div
                    animate={{ scale: [0.95, 1.08, 0.95] }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    className="absolute h-36 w-36 rounded-full border border-dashed border-emerald-400/40 flex items-center justify-center"
                  >
                    <div className="h-28 w-28 rounded-full border border-emerald-400/10 bg-emerald-500/5" />
                  </motion.div>

                  {/* scanning bar */}
                  <motion.div
                    animate={{ y: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                    className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-neon-emerald"
                  />

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-glass-glow">
                      <Leaf size={20} className="animate-pulse" />
                    </div>
                    <p className="text-xs font-bold text-white tracking-wide font-mono">Tomato_Early_Blight</p>
                    <p className="text-[10px] text-slate-400 tracking-wider">XAI Saliency Layer Active</p>
                  </div>
                </div>

                {/* Score Indicators */}
                <div className="mt-4 grid gap-3 grid-cols-3">
                  <div className="rounded-xl border border-white/5 bg-slate-950/50 p-2.5 text-center">
                    <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">Severity</p>
                    <p className="mt-0.5 text-sm font-bold text-red-400">27.4%</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-slate-950/50 p-2.5 text-center">
                    <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">Confidence</p>
                    <p className="mt-0.5 text-sm font-bold text-white">96.8%</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-slate-950/50 p-2.5 text-center">
                    <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">Claim Action</p>
                    <p className="mt-0.5 text-sm font-bold text-emerald-400">Payout</p>
                  </div>
                </div>

                {/* Grad-CAM prompt explanation */}
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3 text-xs">
                  <BrainCircuit size={16} className="text-emerald-400 flex-shrink-0" />
                  <p className="text-[11px] text-slate-300 leading-normal text-left font-mono">
                    Heatmap points to necrotic leaf lesions in quadrant-B.
                  </p>
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
