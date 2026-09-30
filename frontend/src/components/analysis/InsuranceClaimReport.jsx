import { FileText, Printer, ShieldCheck } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../common/Button';

const NOT_AVAILABLE = 'Not available';

const displayValue = (value) => (
  value === null || value === undefined || value === '' ? NOT_AVAILABLE : value
);

const formatPercent = (value) => (
  typeof value === 'number' && Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : NOT_AVAILABLE
);

const formatDamageEstimate = (value) => (
  typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(0)}%` : NOT_AVAILABLE
);

const formatTimestamp = (value) => {
  if (!value) return NOT_AVAILABLE;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? NOT_AVAILABLE : date.toLocaleString();
};

const parseClassifierLabel = (classification) => {
  if (typeof classification !== 'string' || !classification.trim() || classification.startsWith('unknown_class_')) {
    return { crop: NOT_AVAILABLE, condition: displayValue(classification) };
  }

  const parts = classification.split('_').filter(Boolean);
  if (parts.length < 2) return { crop: NOT_AVAILABLE, condition: classification };

  return {
    crop: parts[0],
    condition: parts.slice(1).join(' '),
  };
};

function ReportField({ label, value, provenance }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/30">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">{displayValue(value)}</dd>
      {provenance && <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{provenance}</p>}
    </div>
  );
}

export default function InsuranceClaimReport({ prediction }) {
  if (!prediction) return null;

  const { crop, condition } = parseClassifierLabel(prediction.classification);
  const hasConsistencyFlag = typeof prediction.fraud_risk === 'number' && Number.isFinite(prediction.fraud_risk);
  const consistencyLabel = !hasConsistencyFlag
    ? NOT_AVAILABLE
    : prediction.fraud_risk > 0.4
      ? 'Verification required'
      : 'No rule conflict';
  const reference = prediction.upload_id === null || prediction.upload_id === undefined
    ? NOT_AVAILABLE
    : `Upload #${prediction.upload_id}`;

  return (
    <section aria-labelledby="insurance-claim-report-title" className="print:break-before-page">
      <Card hoverable={false} className="border-emerald-500/20 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:bg-slate-900/70 print:border-slate-300 print:bg-white print:shadow-none">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-white/10 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileText size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">CropVisionAI assessment</p>
              <h2 id="insurance-claim-report-title" className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">Insurance Claim Report</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">AI assessment summary only — not a verified, submitted, or approved insurance claim.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:flex-col md:items-end">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left dark:border-white/10 dark:bg-slate-950/40 md:text-right">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Report reference</span>
              <span className="mt-0.5 block text-sm font-bold text-slate-800 dark:text-slate-100">{reference}</span>
            </div>
            <Button variant="outline" size="sm" fullWidth={false} icon={Printer} onClick={() => window.print()} className="print:hidden">
              Print report
            </Button>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ReportField label="Crop" value={crop} provenance="Parsed from the classifier label; no separate crop field is returned by the API." />
          <ReportField label="Detected condition" value={condition} provenance="AI classification result." />
          <ReportField label="Model confidence" value={formatPercent(prediction.classification_confidence)} provenance="Classifier output, not a claim-verification score." />
          <ReportField label="Physical damage percentage" value={formatDamageEstimate(prediction.damage_percentage)} provenance="Physical damage percentage is not measured by the current model." />
          <ReportField label="Domain-informed severity" value={prediction.severity} provenance="Severity represents domain-informed agronomic threat level, not physical damaged area." />
          <ReportField label="Processing status" value={prediction.pipeline_status} provenance="Prediction pipeline status returned by the API." />
          <ReportField label="Insurance recommendation" value={prediction.insurance_recommendation} provenance="Rule-based reviewer-triage recommendation, not underwriting or approval." />
          <ReportField label="Recommendation rationale" value={prediction.recommendation_reason} provenance="Available only when returned by the prediction service." />
          <ReportField label="Consistency flag" value={hasConsistencyFlag ? `${formatPercent(prediction.fraud_risk)} — ${consistencyLabel}` : NOT_AVAILABLE} provenance="Rule-based consistency signal, not a fraud probability." />
          <ReportField label="Prediction timestamp" value={formatTimestamp(prediction.timestamp)} provenance="Timestamp returned by the prediction service." />
        </dl>

        <div className="mt-5 flex gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200 print:border-slate-300 print:bg-white">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <p><strong>Interpretation:</strong> AI classification, domain-informed severity, and rule-based recommendation are shown separately above. No policy, payout, insurer, farmer identity, claim number, or claim-verification result is available in this prediction response.</p>
        </div>
      </Card>
    </section>
  );
}
