import { motion } from 'framer-motion';
import { BrainCircuit, Leaf, ScanSearch, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: ScanSearch,
    title: 'AI Crop Scanning',
    description: 'Analyze farmer-captured images with high-accuracy visual inspection powered by modern computer vision models.',
  },
  {
    icon: BrainCircuit,
    title: 'Explainable Insights',
    description: 'Reveal which visual regions influenced the damage score so every decision remains transparent and traceable.',
  },
  {
    icon: ShieldCheck,
    title: 'Insurance-Ready Validation',
    description: 'Generate structured evidence for claim review workflows with clear confidence and recommendation outputs.',
  },
  {
    icon: Leaf,
    title: 'Crop Health Monitoring',
    description: 'Track crop stress and damage severity across uploaded images to support faster assessment decisions.',
  },
  {
    icon: TrendingUp,
    title: 'Risk Intelligence',
    description: 'Surface patterns in damage severity to support better underwriting, prioritization, and operational insights.',
  },
  {
    icon: Sparkles,
    title: 'Premium Workflow UX',
    description: 'Deliver a polished, modern experience for insurers, agents, and farmers through a clean AI dashboard.',
  },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-2xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
          <Sparkles size={16} />
          Platform Capabilities
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Built for fast, trustworthy crop claim assessment.
        </h2>
        <p className="mt-4 text-lg leading-8 text-slate-300">
          CropVisionAI combines modern vision models and explainable AI to support reliable, scalable verification workflows.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className="rounded-[24px] border border-white/10 bg-slate-900/60 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.25)] backdrop-blur-xl"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-400/20 text-emerald-300">
                <Icon size={20} />
              </div>
              <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

export default Features;
