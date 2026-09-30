import { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock3, FileText, Info, ShieldAlert, UserCheck, Download } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../common/Button';
import ClaimAssessmentReportModal from '../claims/ClaimAssessmentReportModal';
import { getPersistedClaimStatus, getDecisionConflictInfo, isManualReviewRecommendation } from '../../utils/claimStatus';

const statusStyles = {
  draft: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200',
  submitted: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  'under-review': 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  approved: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  rejected: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
  unavailable: 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

const displayTimestamp = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
};

export default function ClaimStatusPanel({ lookup, recommendation, prediction }) {
  const [showReportModal, setShowReportModal] = useState(false);
  const manualReview = isManualReviewRecommendation(recommendation);

  if (lookup.state === 'loading' || lookup.state === 'idle') {
    return (
      <Card hoverable={false} className="border-slate-200 bg-white/70 p-6 shadow-xl backdrop-blur-xl dark:border-white/5 dark:bg-slate-900/60">
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300" role="status" aria-live="polite">
          <Clock3 className="h-5 w-5 animate-spin text-emerald-500" aria-hidden="true" />
          <div><h2 className="font-bold text-slate-800 dark:text-slate-100">Claim status</h2><p className="mt-1 text-sm">Checking your persisted claim record…</p></div>
        </div>
      </Card>
    );
  }

  const isUnauthorized = lookup.state === 'unauthorized';
  const isMissing = lookup.state === 'empty';
  const claimStatus = lookup.state === 'loaded' ? getPersistedClaimStatus(lookup.claim?.status) : getPersistedClaimStatus(null);
  const stateLabel = isUnauthorized
    ? 'Claim status unavailable'
    : isMissing
      ? 'No claim record found'
      : lookup.state === 'error'
        ? 'Claim status unavailable'
        : claimStatus.label;
  const stateDescription = isUnauthorized
    ? 'Viewing your claim status requires a signed-in Farmer account.'
    : isMissing
      ? 'No persisted claim record was returned for this upload. An AI assessment does not create a verified claim by itself.'
      : lookup.state === 'error'
        ? 'The claim service could not be reached. No claim status is being inferred.'
        : claimStatus.description;
  const Icon = lookup.state === 'loaded' && ['approved', 'submitted'].includes(claimStatus.key) ? CheckCircle : lookup.state === 'loaded' ? FileText : AlertTriangle;

  const conflictInfo = lookup.state === 'loaded' && lookup.claim
    ? getDecisionConflictInfo(lookup.claim.status, recommendation)
    : { hasConflict: false, isOverride: false, note: null };

  return (
    <section aria-labelledby="claim-status-title">
      <Card hoverable={false} className="border-slate-200 bg-white/70 p-6 shadow-xl backdrop-blur-xl dark:border-white/5 dark:bg-slate-900/60">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><FileText size={20} aria-hidden="true" /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">Persisted backend record</p>
              <h2 id="claim-status-title" className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">Insurance claim status</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                AI recommendation is advisory and does not determine the final claim decision. Final decision recorded by an authorized Inspector.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start">
            {(lookup.state === 'loaded' || prediction) && (
              <Button
                variant="outline"
                size="sm"
                icon={Download}
                onClick={() => setShowReportModal(true)}
                className="text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              >
                Export Claim Report (PDF)
              </Button>
            )}
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold ${statusStyles[lookup.state === 'loaded' ? claimStatus.key : 'unavailable']}`}>
              <Icon size={15} aria-hidden="true" />{stateLabel}
            </div>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{stateDescription}</p>

        {lookup.state === 'loaded' && lookup.claim && (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/30">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Backend record ID</span>
              <span className="mt-1 block text-sm font-semibold text-slate-800 dark:text-slate-100">{lookup.claim.id ?? 'Not available'}</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/30">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Authoritative Inspector Status</span>
              <span className="mt-1 block text-sm font-bold text-emerald-700 dark:text-emerald-400">{claimStatus.label}</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/30">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Last updated</span>
              <span className="mt-1 block text-sm font-semibold text-slate-800 dark:text-slate-100">{displayTimestamp(lookup.claim.updated_at)}</span>
            </div>
          </div>
        )}

        {/* Advisory AI Recommendation notice */}
        <div className="mt-5 flex gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <p>
            <strong>AI recommendation (Advisory):</strong> {recommendation || 'Not available'}.{' '}
            {manualReview ? 'This is a request for manual review, not a persisted claim decision.' : 'AI recommendation is advisory and does not determine the final claim decision. Final decision recorded by an authorized Inspector.'}
          </p>
        </div>

        {/* Human Inspector Override Banner (Renders transparently when Inspector decision differs from AI recommendation) */}
        {conflictInfo.isOverride && (
          <div className="mt-3 flex gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm leading-relaxed text-cyan-900 dark:text-cyan-200">
            <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
            <div>
              <p className="font-bold">Human Inspector Verification Override</p>
              <p className="mt-0.5 text-xs text-slate-700 dark:text-slate-300">
                The authoritative persisted status (<strong>{lookup.claim?.status}</strong>) was recorded by an authorized Inspector. An authorized Inspector may override the AI recommendation ({recommendation}) based on physical crop inspection, field verification, or additional evidence.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* FARMER CLAIM ASSESSMENT REPORT MODAL */}
      <ClaimAssessmentReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        claim={lookup.claim}
        prediction={prediction}
        viewMode="farmer"
      />
    </section>
  );
}

