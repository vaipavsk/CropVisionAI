import { motion } from 'framer-motion';
import { BrainCircuit, Leaf, ScanSearch, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import Card from '../../components/ui/Card';

const features = [
  {
    icon: ScanSearch,
    title: 'AI Crop Scanning',
    description: 'Analyze farmer-captured images with high-accuracy visual inspection powered by custom YOLOv8 computer vision weights.',
  },
  {
    icon: BrainCircuit,
    title: 'Explainable AI heatmaps',
    description: 'Reveal precisely which visual pixels and leaf zones influenced the diagnostic results using Grad-CAM saliency extraction.',
  },
  {
    icon: ShieldCheck,
    title: 'Insurance-Ready Auditing',
    description: 'Generate immutable verification tokens and confidence ratings to feed claims adjudication systems.',
  },
  {
    icon: Leaf,
    title: 'Crop Health Logs',
    description: 'Track plant stress indicators, blight lesions, and pest damage severity thresholds through our diagnostic logs.',
  },
  {
    icon: TrendingUp,
    title: 'Risk Underwriting Support',
    description: 'Provide historical, regional disease density telemetry reports to build smarter agricultural insurance products.',
  },
  {
    icon: Sparkles,
    title: 'Premium Control Center',
    description: 'Empower scholars, claims adjusters, and agronomists through a clean, unified, glassmorphic cockpit.',
  },
];

export function Features() {
  return (
    <section id="features" className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-12 max-w-2xl text-left">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
          <Sparkles size={14} />
          Platform Capabilities
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Built for trustworthy agricultural claims.
        </h2>
        <p className="mt-4 text-base text-slate-500 dark:text-slate-400 leading-relaxed">
          CropVisionAI fuses deep learning and model explainability layers to deliver transparent crop damage analysis.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="flex"
            >
              <Card hoverable={true} className="flex flex-col h-full border-white/5 dark:bg-slate-950/40 bg-white/60">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-glass-glow">
                  <Icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400 flex-1">{feature.description}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export default Features;
