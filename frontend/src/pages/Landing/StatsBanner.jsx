import { motion } from 'framer-motion';
import { Leaf, Cpu, ScanLine, FileCheck } from 'lucide-react';
import Card from '../../components/ui/Card';

const stats = [
  {
    value: '98.4%',
    label: 'Mean Average Precision',
    description: 'YOLOv8 leaf lesion detection MAP',
    icon: ScanLine,
    color: 'text-emerald-400',
  },
  {
    value: '45ms',
    label: 'Inference Latency',
    description: 'Average GPU detection response time',
    icon: Cpu,
    color: 'text-cyan-400',
  },
  {
    value: '24,000+',
    label: 'Diagnostics Synced',
    description: 'Scans saved to MySQL backend',
    icon: Leaf,
    color: 'text-emerald-400',
  },
  {
    value: '100%',
    label: 'Explainable Heatmaps',
    description: 'Grad-CAM pixels visual explanations',
    icon: FileCheck,
    color: 'text-amber-400',
  },
];

export function StatsBanner() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card hoverable={true} className="h-full border-white/5 dark:bg-slate-950/40 bg-white/60">
                <div className="flex flex-col h-full justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                      {stat.value}
                    </span>
                    <div className={`h-8 w-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center ${stat.color}`}>
                      <Icon size={16} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      {stat.label}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                      {stat.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export default StatsBanner;
