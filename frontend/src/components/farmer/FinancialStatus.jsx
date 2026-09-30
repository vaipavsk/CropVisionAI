import { AlertTriangle, CheckCircle, Clock3, CreditCard, DollarSign, FileText, Info, ShieldAlert, ShieldCheck } from 'lucide-react';
import Card from '../ui/Card';

const statusStyles = {
  PENDING: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200',
  UNDER_REVIEW: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  APPROVED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  REJECTED: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
  UNAVAILABLE: 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

const displayCurrency = (amount) => {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return 'Financial information is not available yet.';
  }
  return `₹${Number(amount).toLocaleString()}`;
};

const displayDate = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
};

export default function FinancialStatus({ claim, state = 'idle', recommendation }) {
  // State 1: Loading
  if (state === 'loading' || state === 'idle') {
    return (
      <Card hoverable={false} className="border-slate-200 bg-white/70 p-6 shadow-xl backdrop-blur-xl dark:border-white/5 dark:bg-slate-900/60">
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300" role="status" aria-live="polite">
          <Clock3 className="h-5 w-5 animate-spin text-emerald-500" aria-hidden="true" />
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Financial status & settlement</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Loading claim financial records from backend…</p>
          </div>
        </div>
      </Card>
    );
  }

  // State 2: Unauthorized
  if (state === 'unauthorized') {
    return (
      <Card hoverable={false} className="border-amber-500/30 bg-amber-500/5 p-6 shadow-xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Financial Status Unavailable — Authentication Required</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Viewing financial records and claim settlement details requires a signed-in, authorized Farmer account.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // State 3: API Error
  if (state === 'error') {
    return (
      <Card hoverable={false} className="border-red-500/30 bg-red-500/5 p-6 shadow-xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Financial Status Unavailable — Service Error</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Unable to communicate with the claim backend service. Financial details could not be retrieved.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // State 4: Empty State (No claim record found for upload)
  if (state === 'empty' || !claim) {
    return (
      <Card hoverable={false} className="border-slate-200 bg-white/70 p-6 shadow-xl backdrop-blur-xl dark:border-white/5 dark:bg-slate-900/60">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300">
              <CreditCard size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Claim Financial Transparency</p>
              <h3 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">No Claim Settlement Record</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                No persisted insurance claim record has been filed for this crop specimen upload.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            No Claim Record
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          <p className="font-semibold text-amber-800 dark:text-amber-300">Financial information is not available yet.</p>
          <p className="mt-1">
            An AI diagnostic scan does not create or approve a financial insurance claim automatically. A claim must be created in the system by an authorized user to generate settlement records.
          </p>
        </div>
      </Card>
    );
  }

  // State 5 & 6: Loaded claim record — evaluate field availability
  const hasClaimAmount = claim.amount !== null && claim.amount !== undefined;
  const statusKey = (claim.status || 'PENDING').toUpperCase();
  const statusClass = statusStyles[statusKey] || statusStyles.UNAVAILABLE;

  return (
    <section aria-labelledby="financial-status-title">
      <Card hoverable={false} className="border-emerald-500/20 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:bg-slate-900/70">
        {/* Component Header */}
        <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 dark:border-white/10 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CreditCard size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Real Backend Data Only</p>
              <h3 id="financial-status-title" className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                Financial Status & Claim Settlement
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Official insurance financial records directly linked to Claim #{claim.claim_id || claim.id}.
              </p>
            </div>
          </div>

          <div className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-xs font-bold ${statusClass}`}>
            <FileText size={14} aria-hidden="true" />
            <span>{claim.status || 'PENDING'}</span>
          </div>
        </div>

        {/* Financial Fields Grid (Display Genuinely Available Fields) */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/30">
            <span className="block text-xs font-bold text-slate-500 dark:text-slate-400">
              Claim Reference ID
            </span>
            <span className="mt-1 block font-mono text-sm font-bold text-slate-800 dark:text-slate-100">
              {claim.claim_id || `CLM-${claim.id}`}
            </span>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Persisted database claim identifier.</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/30">
            <span className="block text-xs font-bold text-slate-500 dark:text-slate-400">
              Claim Requested Amount
            </span>
            <span className={`mt-1 block text-sm font-extrabold ${hasClaimAmount ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
              {displayCurrency(claim.amount)}
            </span>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {hasClaimAmount ? 'Amount recorded upon claim filing.' : 'No financial claim amount recorded.'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/30">
            <span className="block text-xs font-bold text-slate-500 dark:text-slate-400">
              Claim Status Date
            </span>
            <span className="mt-1 block text-sm font-semibold text-slate-800 dark:text-slate-100">
              {displayDate(claim.approved_at || claim.rejected_at || claim.updated_at || claim.created_at)}
            </span>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {claim.approved_at ? 'Approved timestamp' : claim.rejected_at ? 'Rejected timestamp' : 'Last status update'}
            </p>
          </div>
        </div>

        {/* Section explicitly detailing fields that DO NOT exist in the backend schema */}
        <div className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
          <div className="flex items-start gap-2.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <div className="space-y-2">
              <p className="font-bold text-amber-800 dark:text-amber-300">
                Financial information is not available yet for external settlement fields:
              </p>
              <ul className="grid grid-cols-1 gap-1 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                <li>• <strong>Premium Amount:</strong> Financial information is not available yet.</li>
                <li>• <strong>Approved Payout Amount:</strong> Financial information is not available yet.</li>
                <li>• <strong>Payment Status:</strong> Financial information is not available yet.</li>
                <li>• <strong>Policy Number:</strong> Financial information is not available yet.</li>
                <li>• <strong>Insurer Information:</strong> Financial information is not available yet.</li>
                <li>• <strong>Bank Settlement Date:</strong> Financial information is not available yet.</li>
                <li>• <strong>Transaction Reference ID:</strong> Financial information is not available yet.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Clear Three-Way Separation Summary */}
        <div className="mt-5 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-950/40 text-xs">
          <div className="font-bold text-slate-500 dark:text-slate-400">
            System Layer Breakdown:
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-white p-3 shadow-xs dark:bg-slate-900 border border-slate-200/60 dark:border-white/5">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">1. AI Damage Assessment</span>
              <p className="text-slate-600 dark:text-slate-300">EfficientNet disease classifier, model confidence & domain-informed severity.</p>
            </div>
            <div className="rounded-lg bg-white p-3 shadow-xs dark:bg-slate-900 border border-slate-200/60 dark:border-white/5">
              <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">2. Claim Recommendation</span>
              <p className="text-slate-600 dark:text-slate-300">These rules help reviewers prioritize claims. They are not final insurance decisions.</p>
            </div>
            <div className="rounded-lg bg-white p-3 shadow-xs dark:bg-slate-900 border border-slate-200/60 dark:border-white/5">
              <span className="font-bold text-cyan-600 dark:text-cyan-400 block mb-1">3. Actual Insurance Financial Status</span>
              <p className="text-slate-600 dark:text-slate-300">Your claim is saved in the system. Payment and policy details are not available yet.</p>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
