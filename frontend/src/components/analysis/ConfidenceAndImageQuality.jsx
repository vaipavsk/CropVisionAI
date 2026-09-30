import { AlertTriangle, CheckCircle, ImageIcon, Info } from 'lucide-react';
import Card from '../ui/Card';
import { getConfidenceFeedback, getImageInputFeedback } from '../../utils/predictionFeedback';

const formatBytes = (value) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'Not available';
  return value < 1024 * 1024 ? `${Math.max(1, Math.round(value / 1024))} KB` : `${(value / (1024 * 1024)).toFixed(2)} MB`;
};

const confidenceStyle = {
  high: 'bg-emerald-500 text-emerald-700 dark:text-emerald-300',
  moderate: 'bg-amber-500 text-amber-700 dark:text-amber-300',
  low: 'bg-red-500 text-red-700 dark:text-red-300',
  unavailable: 'bg-slate-400 text-slate-600 dark:text-slate-300',
};

export function ImageInputChecks({ inspection }) {
  const feedback = getImageInputFeedback(inspection);
  const isIssue = feedback.key === 'unreadable' || feedback.key === 'small';

  return (
    <Card hoverable={false} className="mt-5 border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/30">
      <div className="flex gap-3">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isIssue ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
          {isIssue ? <AlertTriangle size={16} aria-hidden="true" /> : <ImageIcon size={16} aria-hidden="true" />}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Image input checks</h3>
          <p className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">{feedback.label}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Dimensions: {feedback.dimensions ? `${feedback.dimensions.width} × ${feedback.dimensions.height}px` : 'Not available'}</span>
            <span>File size: {formatBytes(feedback.fileSizeBytes)}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{feedback.recommendation}</p>
        </div>
      </div>
    </Card>
  );
}

export default function ConfidenceAndImageQuality({ confidence }) {
  const feedback = getConfidenceFeedback(confidence);
  const isValid = feedback.percentage !== null;

  return (
    <Card hoverable={false} className="border-slate-200 bg-white/70 p-6 shadow-xl backdrop-blur-xl dark:border-white/5 dark:bg-slate-900/60">
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${confidenceStyle[feedback.key].split(' ').slice(0, 1).join(' ')}/10 ${confidenceStyle[feedback.key].split(' ').slice(1).join(' ')}`}>
          {feedback.key === 'unavailable' ? <Info size={18} aria-hidden="true" /> : <CheckCircle size={18} aria-hidden="true" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Classification confidence</h3>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white">{isValid ? `${feedback.percentage.toFixed(1)}%` : 'Not available'}</span>
          </div>
          <p className={`mt-1 text-sm font-bold ${confidenceStyle[feedback.key].split(' ').slice(1).join(' ')}`}>{feedback.label}</p>
          {isValid && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" aria-label={`${feedback.label}: ${feedback.percentage.toFixed(1)} percent`}>
              <div className={`h-full rounded-full ${confidenceStyle[feedback.key].split(' ').slice(0, 1).join(' ')}`} style={{ width: `${feedback.percentage}%` }} />
            </div>
          )}
          <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{feedback.description}</p>
          <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 dark:border-white/10 dark:bg-slate-950/30 dark:text-slate-300"><strong>Recommended next step:</strong> {feedback.recommendation}</p>
          <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">Bands: High ≥80%; Moderate ≥60% and &lt;80%; Low &lt;60%. This is the model&apos;s classification confidence, not guaranteed correctness.</p>
        </div>
      </div>
    </Card>
  );
}
