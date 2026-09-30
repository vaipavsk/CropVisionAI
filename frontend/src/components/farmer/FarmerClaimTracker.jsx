import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Cpu,
  Download,
  Eye,
  Activity,
  CreditCard,
  Building2,
  ChevronRight,
  UserCheck,
  Lock,
  PlusCircle
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../common/Button';
import Modal from '../ui/Modal';
import AuthorizedImage from '../common/AuthorizedImage';
import ClaimTimeline from '../claims/ClaimTimeline';
import ClaimEvidenceChecklist from '../claims/ClaimEvidenceChecklist';
import ClaimAssessmentReportModal from '../claims/ClaimAssessmentReportModal';

const API_ORIGIN = (import.meta.env.VITE_AI_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const mediaUrl = (path) => (path ? (path.startsWith('http') ? path : `${API_ORIGIN}${path}`) : null);

function formatIsoTimestamp(isoString) {
  if (!isoString) return 'Not available';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return 'Not available';
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Not available';
  }
}

function formatConfidence(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || Number.isNaN(value) || value < 0) return 'Not available';
  if (value <= 1.0) return `${(value * 100).toFixed(1)}%`;
  if (value <= 100.0) return `${value.toFixed(1)}%`;
  return 'Not available';
}

function formatDamage(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || Number.isNaN(value) || value < 0 || value > 100.0) return 'Not measured';
  return `${value.toFixed(0)}%`;
}

function formatCurrency(amount, currency) {
  if (amount === null || amount === undefined || typeof amount !== 'number' || Number.isNaN(amount)) {
    return 'Not recorded';
  }
  const formattedNum = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (currency && typeof currency === 'string' && currency.trim() !== '') {
    return `${currency.trim()} ${formattedNum}`;
  }
  return `₹${formattedNum}`;
}

function parseClassification(label) {
  if (typeof label !== 'string' || !label.trim() || label.startsWith('unknown_class_')) {
    return { crop: 'Not available', condition: label || 'Not available' };
  }
  const parts = label.split('_').filter(Boolean);
  return parts.length > 1
    ? { crop: parts[0], condition: parts.slice(1).join(' ') }
    : { crop: 'Not available', condition: label };
}

const STATUS_GUIDE = [
  {
    key: 'PENDING',
    label: 'Pending Review',
    badgeVariant: 'primary',
    icon: Clock,
    colorClass: 'text-cyan-400',
    description: 'Your claim was submitted and is waiting for inspector review.'
  },
  {
    key: 'UNDER_REVIEW',
    label: 'Under Review',
    badgeVariant: 'warning',
    icon: Activity,
    colorClass: 'text-amber-400',
    description: 'An inspector is reviewing your claim and supporting evidence.'
  },
  {
    key: 'APPROVED',
    label: 'Approved',
    badgeVariant: 'success',
    icon: CheckCircle2,
    colorClass: 'text-emerald-400',
    description: 'An authorized inspector approved your claim.'
  },
  {
    key: 'REJECTED',
    label: 'Rejected',
    badgeVariant: 'danger',
    icon: XCircle,
    colorClass: 'text-red-400',
    description: 'An inspector reviewed your claim and rejected it under the applicable policy rules.'
  }
];

export default function FarmerClaimTracker({
  claims = [],
  state = 'loaded', // loading | loaded | empty | unauthorized | error
  onRefresh,
  onNewClaim,
  selectedClaimId = null,
  className = ''
}) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeClaimDetail, setActiveClaimDetail] = useState(null);
  const [reportModalClaim, setReportModalClaim] = useState(null);

  // Auto-select claim if selectedClaimId prop is provided (e.g. from deep link route param)
  useEffect(() => {
    if (selectedClaimId && Array.isArray(claims) && claims.length > 0) {
      const match = claims.find(
        (c) => String(c.id) === String(selectedClaimId) || String(c.claim_id) === String(selectedClaimId)
      );
      if (match) {
        setActiveClaimDetail(match);
      }
    }
  }, [selectedClaimId, claims]);

  // Filter claims based on status tab and search query
  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      const rawStatus = String(c.status || 'PENDING').toUpperCase();
      if (filterStatus !== 'ALL' && rawStatus !== filterStatus) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const claimRef = String(c.claim_id || c.id || '').toLowerCase();
      const crop = String(c.prediction?.crop_name || '').toLowerCase();
      const disease = String(c.prediction?.damage_type || '').toLowerCase();
      return claimRef.includes(q) || crop.includes(q) || disease.includes(q);
    });
  }, [claims, filterStatus, searchQuery]);

  // Generate real status update feed from database records
  const statusUpdates = useMemo(() => {
    if (!claims || claims.length === 0) return [];
    return [...claims]
      .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
      .slice(0, 5);
  }, [claims]);

  // 1. Loading State
  if (state === 'loading') {
    return (
      <Card hoverable={false} className={`bg-slate-900/80 backdrop-blur-xl border-white/10 p-8 text-center space-y-4 shadow-xl ${className}`}>
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-teal-400" />
        <h3 className="text-base font-bold text-white">Loading Farmer Claim Tracking Telemetry...</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Retrieving authenticated claim records, prediction history, and official status telemetry from backend service.
        </p>
      </Card>
    );
  }

  // 2. Unauthorized State
  if (state === 'unauthorized') {
    return (
      <Card hoverable={false} className={`bg-slate-900/80 backdrop-blur-xl border-amber-500/20 p-8 text-center space-y-4 shadow-xl ${className}`}>
        <ShieldAlert className="mx-auto h-10 w-10 text-amber-400" />
        <h3 className="text-base font-bold text-white">Authentication Required</h3>
        <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
          Viewing and tracking your persisted claim records requires a signed-in, authorized Farmer account.
        </p>
      </Card>
    );
  }

  // 3. Error State
  if (state === 'error') {
    return (
      <Card hoverable={false} className={`bg-slate-900/80 backdrop-blur-xl border-red-500/20 p-8 text-center space-y-4 shadow-xl ${className}`}>
        <AlertTriangle className="mx-auto h-10 w-10 text-red-400" />
        <h3 className="text-base font-bold text-white">Claim Service Unavailable</h3>
        <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
          Unable to retrieve your claim records from the backend claim service. Please check your network connection or try again later.
        </p>
        {onRefresh && (
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={onRefresh} className="mt-2">
            Retry Sync
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* SECTION HEADER & CONTROL BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <FileText className="text-teal-400" size={24} />
            Claims & Financials
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track claim status, review AI findings, and export assessment reports.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onRefresh && (
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={onRefresh} className="text-xs">
              Refresh Status
            </Button>
          )}
          {onNewClaim && (
            <Button variant="primary" size="sm" icon={PlusCircle} onClick={onNewClaim} className="text-xs">
              File New Claim
            </Button>
          )}
        </div>
      </div>

      {/* FEATURE 2 — OFFICIAL CLAIM STATUS GUIDE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {STATUS_GUIDE.map((statusItem) => {
          const IconComponent = statusItem.icon;
          const count = claims.filter((c) => String(c.status || 'PENDING').toUpperCase() === statusItem.key).length;
          return (
            <div
              key={statusItem.key}
              onClick={() => setFilterStatus(filterStatus === statusItem.key ? 'ALL' : statusItem.key)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                filterStatus === statusItem.key
                  ? 'bg-slate-900 border-teal-500/50 shadow-lg shadow-teal-500/10'
                  : 'bg-slate-900/60 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <IconComponent size={16} className={statusItem.colorClass} />
                  <span className="text-xs font-bold text-white">{statusItem.label}</span>
                </div>
                <Badge variant={statusItem.badgeVariant} className="text-xs">
                  {count}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {statusItem.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* FEATURE 5 — LIVE STATUS UPDATES FEED (NOTIFICATIONS SECTION) */}
      <Card hoverable={false} className="bg-slate-900/80 backdrop-blur-xl border-white/10 p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal-400" />
            <h3 className="text-xs font-extrabold text-white">
              Persisted database status updates
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {statusUpdates.length} Recent Event{statusUpdates.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* EXPLICIT BACKEND NOTIFICATION NOTICE */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-slate-400 flex items-start gap-2 leading-relaxed">
          <Info size={14} className="text-teal-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200">System Sync Notice: </strong>
            Live SMS and push alerts are not connected yet. The updates below show real claim status changes saved to your account.
          </div>
        </div>

        {statusUpdates.length > 0 ? (
          <div className="divide-y divide-white/5">
            {statusUpdates.map((c) => {
              const claimRef = c.claim_id || (typeof c.id === 'number' ? `CLM-${String(c.id).padStart(6, '0')}` : 'CLM-UNSET');
              const rawStatus = String(c.status || 'PENDING').toUpperCase();
              return (
                <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal-400">{claimRef}</span>
                    <span className="text-slate-300">
                      Status updated to <strong className="text-white">{rawStatus}</strong>
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {formatIsoTimestamp(c.updated_at || c.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-2 text-center">No recent status update events logged.</p>
        )}
      </Card>

      {/* SEARCH AND FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-white/5">
        {/* STATUS FILTER TABS */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterStatus === st
                  ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-md shadow-teal-700/20'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {st === 'ALL' ? 'All Claims' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* SEARCH INPUT */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search claim ref, crop, disease..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-950/80 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-teal-500/50 focus:outline-none"
          />
        </div>
      </div>

      {/* FEATURE 1 — CLAIMS CARDS LIST */}
      {filteredClaims.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClaims.map((claim) => {
            const prediction = claim?.prediction || null;
            const upload = claim?.upload || null;
            const parsedClass = parseClassification(prediction?.damage_type || prediction?.classification);
            const claimRef = claim.claim_id || (typeof claim.id === 'number' ? `CLM-${String(claim.id).padStart(6, '0')}` : 'CLM-UNSET');
            const rawStatus = String(claim.status || 'PENDING').toUpperCase();
            const isApproved = rawStatus === 'APPROVED';
            const isRejected = rawStatus === 'REJECTED';
            const isUnderReview = rawStatus === 'UNDER_REVIEW';

            return (
              <Card
                key={claim.id}
                hoverable={true}
                className="bg-slate-900/80 backdrop-blur-xl border-white/10 p-5 space-y-4 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* CARD HEADER */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <span className="font-mono text-base font-black text-teal-400 block">
                        {claimRef}
                      </span>
                      <span className="text-xs text-slate-400">
                        Filed: {formatIsoTimestamp(claim.created_at)}
                      </span>
                    </div>

                    <Badge variant={isApproved ? 'success' : isRejected ? 'danger' : isUnderReview ? 'warning' : 'primary'}>
                      {rawStatus}
                    </Badge>
                  </div>

                  {/* CROP & DIAGNOSIS DETAILS */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-white/5">
                    <div>
                      <span className="text-xs font-bold text-slate-400 block">Crop & Disease</span>
                      <strong className="text-white block font-sans truncate">{parsedClass.crop}</strong>
                      <span className="text-teal-400 text-xs block truncate">{parsedClass.condition}</span>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-400 block">Classifier Signals</span>
                      <span className="text-emerald-400 font-bold block">
                        Conf: {formatConfidence(prediction?.confidence)}
                      </span>
                      <span className="text-amber-400 font-bold block">
                        Damage: {formatDamage(prediction?.damage_percentage)}
                      </span>
                    </div>
                  </div>

                  {/* ADVISORY AI RECOMMENDATION */}
                  <div className="text-xs p-2.5 rounded-xl bg-slate-950/40 border border-white/5">
                    <span className="text-xs font-bold text-slate-400 block">
                      AI Advisory Recommendation
                    </span>
                    <span className="font-semibold text-slate-200 block truncate">
                      {prediction?.insurance_recommendation || prediction?.recommendation || 'Not available'}
                    </span>
                  </div>

                  {/* REQUESTED AMOUNT */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">Requested Claim Amount:</span>
                    <strong className="font-mono text-emerald-400">{formatCurrency(claim.amount)}</strong>
                  </div>
                </div>

                {/* CARD ACTIONS */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Download}
                    onClick={() => setReportModalClaim(claim)}
                    className="text-xs border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
                  >
                    PDF Report
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={Eye}
                    onClick={() => setActiveClaimDetail(claim)}
                    className="text-xs"
                  >
                    Inspect Details
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* FEATURE 7 — EMPTY STATE */
        <Card hoverable={false} className="bg-slate-900/60 backdrop-blur-xl border-white/10 p-8 text-center space-y-3">
          <Layers className="mx-auto h-8 w-8 text-slate-500" />
          <h3 className="text-sm font-bold text-white">No Claim Records Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            {searchQuery || filterStatus !== 'ALL'
              ? 'No claims match your selected filter or search query. Try clearing filters.'
              : 'You have not submitted any crop damage claims yet.'}
          </p>
          {onNewClaim && !searchQuery && filterStatus === 'ALL' && (
            <Button variant="primary" size="sm" icon={PlusCircle} onClick={onNewClaim} className="mt-2 text-xs">
              File First Claim
            </Button>
          )}
        </Card>
      )}

      {/* FEATURE 4 — DETAILED CLAIM MODAL VIEW */}
      {activeClaimDetail && (
        <Modal
          isOpen={Boolean(activeClaimDetail)}
          onClose={() => setActiveClaimDetail(null)}
          title={`Claim Progress & Inspection — ${activeClaimDetail.claim_id || `CLM-${activeClaimDetail.id}`}`}
          size="lg"
        >
          <div className="space-y-6 text-left">
            {/* MODAL HEADER INFO */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-teal-400">
                    {activeClaimDetail.claim_id || `CLM-${activeClaimDetail.id}`}
                  </span>
                  <Badge variant={String(activeClaimDetail.status).toUpperCase() === 'APPROVED' ? 'success' : String(activeClaimDetail.status).toUpperCase() === 'REJECTED' ? 'danger' : 'primary'}>
                    {String(activeClaimDetail.status || 'PENDING').toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Filed: {formatIsoTimestamp(activeClaimDetail.created_at)} · Backend ID: #{activeClaimDetail.id}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={Download}
                onClick={() => {
                  setReportModalClaim(activeClaimDetail);
                }}
                className="text-xs border-teal-500/30 text-teal-400"
              >
                Export PDF
              </Button>
            </div>

            {/* VISUAL SPECIMEN & GRAD-CAM OVERLAY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 block">Uploaded Specimen Image</span>
                <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-slate-950 flex items-center justify-center">
                  <AuthorizedImage
                    src={mediaUrl(activeClaimDetail.upload?.image_url)}
                    alt="Original uploaded crop specimen"
                    className="h-full w-full object-contain"
                    unavailableText="Original uploaded image unavailable"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 block">Grad-CAM XAI Heatmap</span>
                <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-slate-950 flex items-center justify-center">
                  {activeClaimDetail.prediction?.gradcam_url ? (
                    <AuthorizedImage
                      src={mediaUrl(activeClaimDetail.prediction.gradcam_url)}
                      alt="Grad-CAM explainability heatmap overlay"
                      className="h-full w-full object-contain"
                      unavailableText="Grad-CAM heatmap unavailable"
                    />
                  ) : (
                    <div className="text-center p-4 text-slate-500 text-xs">
                      Grad-CAM heatmap not available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RECORDED CLAIM TIMELINE */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-teal-400">
                Verified Claim Milestones
              </h4>
              <ClaimTimeline claim={activeClaimDetail} prediction={activeClaimDetail.prediction} />
            </div>

            {/* VERIFIED EVIDENCE CHECKLIST */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-teal-400">
                Verified Evidence Summary
              </h4>
              <ClaimEvidenceChecklist claim={activeClaimDetail} prediction={activeClaimDetail.prediction} />
            </div>
          </div>
        </Modal>
      )}

      {/* PDF REPORT EXPORT MODAL */}
      <ClaimAssessmentReportModal
        isOpen={Boolean(reportModalClaim)}
        onClose={() => setReportModalClaim(null)}
        claim={reportModalClaim}
        viewMode="farmer"
      />
    </div>
  );
}
