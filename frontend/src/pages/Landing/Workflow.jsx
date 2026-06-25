import { motion } from 'framer-motion';
import { ArrowRight, Camera, CheckCircle2, FileText, ShieldCheck } from 'lucide-react';

const steps = [
  {
    icon: Camera,
    title: '1. Capture Image',
    description: 'Farmers upload clear crop photos directly from the field using any mobile device.',
  },
  {
    icon: ShieldCheck,
    title: '2. AI Analysis',
    description: 'CropVisionAI detects damage regions and explains the model’s reasoning with visual evidence.',
  },
  {
    icon: FileText,
    title: '3. Claim Review',
    description: 'Insurers receive structured recommendations and confidence scores for faster verification.',
  },
  {
    icon: CheckCircle2,
    title: '4. Approval Outcome',
    description: 'The workflow ends with a transparent recommendation ready for insurance processing.',
  },
];

function Workflow() {
  return (
    <section id="workflow" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-2xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
          <ShieldCheck size={16} />
          Claim Workflow
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          A simple four-step path from image to claim decision.
        </h2>
        <p className="mt-4 text-lg leading-8 text-slate-300">
          Every stage is designed to reduce friction for farmers, agents, and insurers while keeping the process explainable.
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 hidden h-full w-px bg-gradient-to-b from-emerald-400/40 via-cyan-400/20 to-transparent md:block" />

        <div className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.article
                key={step.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="relative rounded-[24px] border border-white/10 bg-slate-900/60 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.25)] backdrop-blur-xl md:ml-10"
              >
                <div className="absolute -left-2 top-7 hidden h-5 w-5 rounded-full border-4 border-slate-950 bg-emerald-400 md:block" />
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-400/20 text-emerald-300">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">{step.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
                    Continue
                    <ArrowRight size={16} />
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Workflow;
