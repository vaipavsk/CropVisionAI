import { motion } from 'framer-motion';
import { ArrowRight, Camera, CheckCircle2, FileText, ShieldCheck, Sparkles } from 'lucide-react';
import Card from '../../components/ui/Card';

const steps = [
  {
    icon: Camera,
    step: '01',
    title: 'Capture Crop Specimen',
    description: 'Farmers upload clear crop photos from the field. Location details and crop types are verified instantly.',
  },
  {
    icon: ShieldCheck,
    step: '02',
    title: 'Run AI Diagnostics',
    description: 'YOLOv8 highlights damage zones, and EfficientNet classifies disease classes in under 45ms.',
  },
  {
    icon: FileText,
    step: '03',
    title: 'Generate Grad-CAM Saliency',
    description: 'The explainable AI engine computes pixel heatmaps, illustrating what details drove the model decision.',
  },
  {
    icon: CheckCircle2,
    step: '04',
    title: 'Process Verification',
    description: 'Insurers audit structured reports with confidence scoring, accelerating claim settlements.',
  },
];

export function Workflow() {
  return (
    <section id="workflow" className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="mb-12 max-w-2xl text-left">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
          <ShieldCheck size={14} />
          Verification Pipeline
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Four steps to explainable claims.
        </h2>
        <p className="mt-4 text-base text-slate-500 dark:text-slate-400 leading-relaxed">
          From field photography to verified payout decision, the workflow remains completely transparent.
        </p>
      </div>

      {/* Grid Timeline */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex"
            >
              <Card hoverable={true} className="flex flex-col h-full border-white/5 dark:bg-slate-950/40 bg-white/60 relative">
                {/* Step Index Badge */}
                <div className="absolute top-4 right-5 text-3xl font-black text-emerald-500/10 dark:text-emerald-500/10 select-none">
                  {step.step}
                </div>

                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Icon size={18} />
                </div>
                
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 pr-8">{step.title}</h3>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 flex-1">{step.description}</p>
                
                {index < 3 && (
                  <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 mt-4 uppercase tracking-wider">
                    Next step
                    <ArrowRight size={12} className="animate-pulse" />
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export default Workflow;
