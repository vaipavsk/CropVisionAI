import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ShieldCheck,
  FileText,
  Info,
  ChevronDown,
  ChevronUp,
  Cpu,
  UserCheck,
  ShieldAlert,
  Building2,
  Lock
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

// Helper to format currency safely without hardcoding $, INR, or USD
function formatCurrency(amount, currency) {
  if (amount === null || amount === undefined || typeof amount !== 'number' || Number.isNaN(amount)) {
    return 'Amount unavailable';
  }
  const formattedNum = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (currency && typeof currency === 'string' && currency.trim() !== '') {
    return `${currency.trim()} ${formattedNum}`;
  }
  return formattedNum;
}

// Helper to validate ISO timestamp strings
function validateTimestamp(isoString) {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    return Number.isNaN(d.getTime()) ? null : isoString;
  } catch {
    return null;
  }
}

// Helper to format ISO timestamps into human-readable strings
function formatIsoTimestamp(isoString) {
  const validIso = validateTimestamp(isoString);
  if (!validIso) return 'Date unavailable';
  try {
    const d = new Date(validIso);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Date unavailable';
  }
}

export default function FinancialStatusSettlement({
  claim = null,
  lookupState = 'idle',
  prediction = null,
  className = ''
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  // 1. Loading State
  if (lookupState === 'loading') {
    return (
      <Card hoverable={false} className={`bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200 dark:border-white/5 shadow-xl p-6 ${className}`}>
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <Clock className="h-5 w-5 animate-spin text-teal-400" />
          <span className="text-sm font-semibold">Loading claim financial records & settlement status...</span>
        </div>
      </Card>
    );
  }

  // 2. Unauthorized State
  if (lookupState === 'unauthorized') {
    return (
      <Card hoverable={false} className={`bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-amber-500/20 shadow-xl p-6 ${className}`}>
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Financial Access Restricted — Authentication Required
            </h4>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Viewing financial records and claim settlement details requires a signed-in, authorized Farmer account.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // 3. Error State
  if (lookupState === 'error') {
    return (
      <Card hoverable={false} className={`bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-red-500/20 shadow-xl p-6 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Financial Status Unavailable — Gateway Error
            </h4>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Unable to retrieve persisted claim financial details from the backend service. Please try again later.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Evaluated claim properties
  const storedClaimId = claim?.claim_id || (claim?.claim_number ? claim.claim_number : null);
  const claimRef = storedClaimId || (typeof claim?.id === 'number' ? `CLM-${String(claim.id).padStart(6, '0')}` : null);
  const claimStatus = claim?.status ? String(claim.status).toUpperCase() : null;

  const isApproved = claimStatus === 'APPROVED';
  const isRejected = claimStatus === 'REJECTED';
  const isUnderReview = claimStatus === 'UNDER_REVIEW' || claimStatus === 'SUBMITTED';
  const hasClaim = Boolean(claimRef || claim);

  const hasAmount = typeof claim?.amount === 'number' && !Number.isNaN(claim.amount);
  const hasApprovedAmount = typeof claim?.approved_amount === 'number' && !Number.isNaN(claim.approved_amount);
  const hasSettlementAmount = typeof claim?.settlement_amount === 'number' && !Number.isNaN(claim.settlement_amount);
  const currencyVal = claim?.currency || null;

  // Formatted financial amounts (Strictly backed by actual object fields, no inferred amounts)
  const requestedAmountStr = hasAmount ? formatCurrency(claim.amount, currencyVal) : 'Not recorded';
  const approvedAmountStr = hasApprovedAmount
    ? formatCurrency(claim.approved_amount, currencyVal)
    : isRejected
    ? 'Not applicable'
    : 'Not recorded';
  const settlementAmountStr = hasSettlementAmount
    ? formatCurrency(claim.settlement_amount, currencyVal)
    : isRejected
    ? 'Not applicable'
    : 'Not recorded';
  const paymentStatusStr = claim?.payment_status ? String(claim.payment_status) : 'Not recorded';

  // Timestamps
  const submissionDateStr = formatIsoTimestamp(claim?.created_at);
  const reviewDateStr = formatIsoTimestamp(
    claim?.approved_at || claim?.rejected_at || claim?.reviewed_at
  );
  const settlementDateStr = formatIsoTimestamp(claim?.settled_at || claim?.settlement_date);
  const paymentDateStr = formatIsoTimestamp(claim?.payment_date || claim?.paid_at);

  // 5-Stage Settlement Progress Checklist
  const settlementStages = [
    {
      id: 'stg_submitted',
      title: '1. Claim Submitted',
      status: hasClaim ? 'completed' : 'pending',
      timestamp: claim?.created_at,
      description: hasClaim ? `Claim filed with reference ID ${claimRef}.` : 'No claim filed yet for this specimen.'
    },
    {
      id: 'stg_reviewed',
      title: '2. Claim Reviewed',
      status: (isApproved || isRejected) ? 'completed' : (isUnderReview || hasClaim) ? 'current' : 'pending',
      timestamp: claim?.approved_at || claim?.rejected_at || claim?.reviewed_at,
      description: isApproved
        ? 'Authoritative review granted by Inspector.'
        : isRejected
        ? 'Claim decision rejected by Inspector.'
        : hasClaim
        ? 'Awaiting human inspector review.'
        : 'Review pending claim filing.'
    },
    {
      id: 'stg_decision',
      title: '3. Decision Recorded',
      status: (isApproved || isRejected) ? 'completed' : 'pending',
      timestamp: claim?.approved_at || claim?.rejected_at,
      description: isApproved
        ? 'Claim approval decision recorded in database.'
        : isRejected
        ? 'Claim rejection decision recorded in database.'
        : 'Decision pending inspector adjudication.'
    },
    {
      id: 'stg_settlement',
      title: '4. Settlement Recorded',
      status: hasSettlementAmount ? 'completed' : 'pending',
      timestamp: claim?.settled_at || claim?.settlement_date,
      description: hasSettlementAmount
        ? `Settlement recorded: ${settlementAmountStr}`
        : 'Not recorded in backend database schema.'
    },
    {
      id: 'stg_payment',
      title: '5. Payment Completed',
      status: claim?.payment_status === 'COMPLETED' ? 'completed' : 'pending',
      timestamp: claim?.payment_date || claim?.paid_at,
      description: claim?.payment_status === 'COMPLETED'
        ? 'Payment transaction completed.'
        : 'Not recorded in backend database schema.'
    }
  ];

  return (
    <Card
      hoverable={false}
      className={`bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200 dark:border-white/5 shadow-xl p-6 ${className}`}
    >
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-200/80 dark:border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Financial Status & Claim Settlement
            </h3>
            <Badge
              variant={isApproved ? 'success' : isRejected ? 'danger' : hasClaim ? 'warning' : 'secondary'}
              className="text-xs font-bold ml-2"
            >
              {claimStatus || 'NO CLAIM RECORD'}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Persisted insurance claim financial metadata, 5-stage settlement progression, and payment status breakdown.
          </p>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg border border-slate-200 dark:border-white/5 self-start sm:self-auto focus-visible:ring-2 focus-visible:ring-teal-400"
          aria-label="Toggle financial status section"
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-6">

          {/* 4. FINANCIAL METADATA GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Claim Ref */}
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/5">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-xs block mb-1">
                Claim Reference ID
              </span>
              <span className="font-mono text-sm font-extrabold text-slate-800 dark:text-white block">
                {claimRef || 'Not filed'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                {hasClaim ? 'Persisted backend claim record' : 'No claim filed for this specimen'}
              </span>
            </div>

            {/* Requested Amount */}
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/5">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-xs block mb-1">
                Requested Claim Amount
              </span>
              <span className={`font-mono text-sm font-extrabold block ${hasAmount ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                {requestedAmountStr}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                {hasAmount ? 'Claim amount recorded upon filing' : 'No financial claim amount recorded'}
              </span>
            </div>

            {/* Approved Amount */}
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/5">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-xs block mb-1">
                Approved Payout Amount
              </span>
              <span className={`font-mono text-sm font-extrabold block ${isApproved ? 'text-emerald-600 dark:text-emerald-400' : isRejected ? 'text-red-500' : 'text-slate-600 dark:text-slate-400'}`}>
                {approvedAmountStr}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                {isApproved ? 'Authoritative inspector approval granted' : isRejected ? 'Claim rejected by inspector' : 'Awaiting inspector adjudication'}
              </span>
            </div>

            {/* Settlement Status */}
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/5">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-xs block mb-1">
                Settlement Status
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                {settlementAmountStr}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                External settlement breakdown state
              </span>
            </div>

            {/* Payment Status */}
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/5">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-xs block mb-1">
                Payment Execution Status
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                {paymentStatusStr}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                Banking transaction verification state
              </span>
            </div>

            {/* Relevant Financial Dates */}
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/5">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-xs block mb-1">
                Filing / Review Dates
              </span>
              <div className="space-y-0.5 text-xs text-slate-700 dark:text-slate-300">
                <div>Filed: <strong>{submissionDateStr}</strong></div>
                <div>Adjudicated: <strong>{reviewDateStr}</strong></div>
              </div>
            </div>
          </div>

          {/* 5-STAGE SETTLEMENT PROGRESS SECTION */}
          <div className="space-y-3 border-t border-slate-200/80 dark:border-white/5 pt-4">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Building2 size={14} className="text-teal-400" />
              Claim Settlement Progression
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {settlementStages.map((stage) => {
                const isComplete = stage.status === 'completed';
                const isCurrent = stage.status === 'current';
                const isPending = stage.status === 'pending' || stage.status === 'incomplete';

                return (
                  <div
                    key={stage.id}
                    className={`p-3 rounded-xl border transition-all text-xs ${
                      isComplete
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : isCurrent
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 animate-pulse'
                        : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-white/5 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {isComplete ? (
                        <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                      ) : isCurrent ? (
                        <Clock size={13} className="text-amber-500 flex-shrink-0" />
                      ) : (
                        <Lock size={12} className="text-slate-400 flex-shrink-0" />
                      )}
                      <strong className="font-bold text-xs block truncate">
                        {stage.title}
                      </strong>
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 block leading-tight">
                      {stage.description}
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 block mt-1">
                      {formatIsoTimestamp(stage.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4-LAYER SYSTEM BREAKDOWN CARDS */}
          <div className="space-y-3 border-t border-slate-200/80 dark:border-white/5 pt-4">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Cpu size={14} className="text-emerald-400" />
              Four-Layer System Separation
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-white/5">
                <span className="font-bold text-teal-600 dark:text-teal-400 block mb-1">
                  1. AI Diagnostic Recommendation
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Advisory triage output ({prediction?.insurance_recommendation || 'Advisory'}). Not an insurance underwriting decision.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-white/5">
                <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">
                  2. Inspector Adjudication
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Authoritative human inspector status ({claimStatus || 'UNREVIEWED'}). Persisted in MySQL database.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-white/5">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                  3. Financial Settlement Status
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isApproved ? 'Queued for settlement breakdown' : isRejected ? 'Claim rejected' : hasClaim ? 'Pending adjudication' : 'No claim filed'}.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-white/5">
                <span className="font-bold text-cyan-600 dark:text-cyan-400 block mb-1">
                  4. Payment Execution Status
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Not recorded. External banking transfer is executed independently by the insurance carrier.
                </p>
              </div>
            </div>
          </div>

          {/* DISCLAIMER BANNER */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-3">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-500" />
            <div className="space-y-1">
              <strong className="font-bold block">Settlement & Payment Disclaimer</strong>
              <p className="leading-relaxed text-xs">
                Financial information is based on recorded claim data. Settlement and payment status may require confirmation from the insurer. CropVisionAI provides claim evidence verification and does not directly execute banking transfers or guarantee third-party payouts.
              </p>
            </div>
          </div>

        </div>
      )}
    </Card>
  );
}
