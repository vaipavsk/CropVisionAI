import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock3,
  FileText,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  Search,
  Eye,
  Activity,
  Layers,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  Cpu,
  Info,
  ExternalLink,
  CheckCircle2,
  Download,
  UserCheck
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../common/Button';
import Modal from '../ui/Modal';
import AuthorizedImage from '../common/AuthorizedImage';
import aiApi from '../../services/aiApi';
import ClaimEvidenceChecklist from '../claims/ClaimEvidenceChecklist';
import ClaimTimeline from '../claims/ClaimTimeline';
import DiseaseTreatmentGuidance from '../claims/DiseaseTreatmentGuidance';
import FinancialStatusSettlement from '../claims/FinancialStatusSettlement';
import ClaimAssessmentReportModal from '../claims/ClaimAssessmentReportModal';
import AIExplanationFeedback from './AIExplanationFeedback';

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

function parseClassification(label) {
  if (typeof label !== 'string' || !label.trim() || label.startsWith('unknown_class_')) {
    return { crop: 'Not available', condition: label || 'Not available' };
  }
  const parts = label.split('_').filter(Boolean);
  return parts.length > 1
    ? { crop: parts[0], condition: parts.slice(1).join(' ') }
    : { crop: 'Not available', condition: label };
}

export default function InspectorInvestigationWorkspace({
  claim = null,
  loading = false,
  error = null,
  onBack,
  onDecision,
  actionLoading = false,
  className = ''
}) {
  const [activeTab, setActiveTab] = useState('summary');
  const [gradcamState, setGradcamState] = useState('idle');
  const [confirmDecision, setConfirmDecision] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const prediction = claim?.prediction || null;
  const upload = claim?.upload || null;
  const parsedClass = parseClassification(prediction?.damage_type || prediction?.classification);
  
  const claimRef = claim?.claim_id || claim?.claim_number || (typeof claim?.id === 'number' ? `CLM-${String(claim.id).padStart(6, '0')}` : 'CLM-UNSET');
  const rawStatus = String(claim?.status || 'SUBMITTED').toUpperCase();
  const isApproved = rawStatus === 'APPROVED';
  const isRejected = rawStatus === 'REJECTED';
  const isFinal = isApproved || isRejected;

  // Track Grad-CAM image state via authenticated API check
  const gradcamUrl = prediction?.gradcam_url ? mediaUrl(prediction.gradcam_url) : null;
  useEffect(() => {
    let active = true;
    if (!prediction || !prediction.gradcam_url) {
      setGradcamState('unavailable');
      return;
    }
    setGradcamState('loading');
    aiApi.get(prediction.gradcam_url, { responseType: 'blob' })
      .then(() => {
        if (active) setGradcamState('loaded');
      })
      .catch(() => {
        if (active) setGradcamState('error');
      });
    return () => {
      active = false;
    };
  }, [prediction?.gradcam_url]);

  if (loading) {
    return (
      <Card hoverable={false} className={`bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200 dark:border-white/5 p-8 shadow-xl text-center ${className}`}>
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-teal-400 mb-3" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
          Loading investigation workspace for claim record...
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Fetching authoritative claim telemetry, evidence images, and prediction history.
        </p>
      </Card>
    );
  }

  if (error || !claim) {
    return (
      <Card hoverable={false} className={`bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200 dark:border-white/5 p-8 shadow-xl ${className}`}>
        <div className="flex flex-col items-center text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {error || 'No Claim Selected for Investigation'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md">
            Select an active claim record from the Smart Review Queue or Inspector Dashboard to open the investigation workspace.
          </p>
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack} icon={ArrowLeft} className="mt-2">
              Back to Review Queue
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // Recommendation value
  const recVal = prediction?.insurance_recommendation || prediction?.recommendation || 'Not available';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* NAVIGATION / TOP BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 transition-colors"
              title="Return to Review Queue"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-black text-teal-400">
                {claimRef}
              </span>
              <Badge variant={isApproved ? 'success' : isRejected ? 'danger' : 'primary'}>
                {rawStatus}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Filed: {formatIsoTimestamp(claim.created_at)} · Backend ID: #{claim.id}
            </p>
          </div>
        </div>

        {/* DECISION ACTION CONTROLS & REPORT EXPORT */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReportModal(true)}
            icon={Download}
            className="text-xs border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
          >
            Export Report (PDF)
          </Button>

          {!isFinal ? (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmDecision('reject')}
                disabled={actionLoading}
                icon={X}
                className="text-xs"
              >
                Reject Claim
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setConfirmDecision('approve')}
                disabled={actionLoading}
                icon={Check}
                className="text-xs"
              >
                Approve Claim
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl border border-white/10 bg-slate-950/60 text-slate-300">
              <ShieldCheck size={14} className={isApproved ? 'text-emerald-400' : 'text-red-400'} />
              <span>Final Status: {rawStatus}</span>
            </div>
          )}
        </div>
      </div>

      {/* WORKSPACE HEADER HUD */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-950/90 p-6 shadow-[0_0_50px_rgba(13,148,136,0.1)] backdrop-blur-2xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="border-r border-white/5 pr-3">
            <span className="text-xs font-bold text-slate-400 block mb-1">
              Crop Specimen
            </span>
            <span className="text-sm font-bold text-white block truncate">
              {parsedClass.crop}
            </span>
            <span className="text-xs text-teal-400 block truncate">
              {parsedClass.condition}
            </span>
          </div>

          <div className="border-r border-white/5 pr-3">
            <span className="text-xs font-bold text-slate-400 block mb-1">
              AI Confidence
            </span>
            <span className="text-sm font-bold text-emerald-400 block">
              {formatConfidence(prediction?.confidence)}
            </span>
            <span className="text-xs text-slate-400 block">
              Severity: {prediction?.severity || 'Not available'}
            </span>
          </div>

          <div className="border-r border-white/5 pr-3">
            <span className="text-xs font-bold text-slate-400 block mb-1">
              Physical Damage
            </span>
            <span className="text-sm font-bold text-amber-400 block">
              {formatDamage(prediction?.damage_percentage)}
            </span>
            <span className="text-xs text-slate-400 block">
              Detections: {prediction?.detections_count ?? 'Not available'}
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-400 block mb-1">
              AI Recommendation
            </span>
            <span className="text-sm font-bold text-slate-200 block truncate">
              {recVal}
            </span>
            <span className="text-xs text-slate-400 block">
              Advisory Signal Only
            </span>
          </div>
        </div>

        <div className="mt-4 border-t border-white/10 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-teal-400" />
            <span className="text-slate-400 font-bold text-xs">Farmer Account:</span>
            <span className="text-white font-bold">{claim.farmer?.full_name || 'Farmer'}</span>
            <span className="text-slate-400 font-mono">({claim.farmer?.email || 'N/A'})</span>
          </div>
          <div className="text-slate-400">
            <span className="font-bold text-xs">Submitted: </span>
            <span className="text-slate-200">{formatIsoTimestamp(claim.created_at)}</span>
          </div>
        </div>
      </div>

      {/* DUAL SPECIMEN & XAI EXPLAINABILITY PANEL */}
      <Card hoverable={false} className="bg-slate-900/80 backdrop-blur-xl border-white/10 p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-teal-400" />
            <h3 className="text-sm font-bold text-white">
              Dual Specimen & Grad-CAM Visual Evidence
            </h3>
          </div>
          <Badge variant="primary" className="text-xs font-bold">
            Specimen ID: #{upload?.id || 'N/A'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ORIGINAL UPLOADED IMAGE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>Farmer Uploaded Crop Specimen</span>
              <span>{upload?.original_name || 'Uploaded File'}</span>
            </div>
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-slate-950/80 shadow-inner flex items-center justify-center">
              <AuthorizedImage
                src={mediaUrl(upload?.image_url)}
                alt="Original uploaded crop image specimen"
                className="h-full w-full object-contain"
                unavailableText="Original uploaded image unavailable"
              />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Persisted crop image captured by farmer. Verified through authenticated JWT access.
            </p>
          </div>

          {/* GRAD-CAM EXPLAINABILITY HEATMAP */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>Grad-CAM Explainability Heatmap</span>
              <span className={gradcamState === 'loaded' ? 'text-emerald-400' : 'text-amber-400'}>
                {gradcamState === 'loaded' ? 'Heatmap Loaded' : gradcamState === 'loading' ? 'Loading Heatmap...' : 'Not Available'}
              </span>
            </div>
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-slate-950/80 shadow-inner flex items-center justify-center">
              {prediction?.gradcam_url ? (
                <AuthorizedImage
                  src={mediaUrl(prediction.gradcam_url)}
                  alt="Grad-CAM explainability heatmap overlay"
                  className="h-full w-full object-contain"
                  unavailableText="Grad-CAM heatmap unavailable"
                  onStateChange={setGradcamState}
                />
              ) : (
                <div className="text-center p-6 text-slate-500">
                  <Cpu className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                  <p className="text-xs font-bold text-slate-400">Grad-CAM Heatmap Not Available</p>
                  <p className="text-xs text-slate-400 mt-1">No explainability overlay path was generated for this prediction record.</p>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong>XAI Note:</strong> Grad-CAM highlights specific pixel regions that influenced the model's classification. It measures feature importance, not physical field area loss or fraud.
            </p>
          </div>
        </div>
      </Card>

      {/* AI EXPLANATION FEEDBACK PANEL */}
      <AIExplanationFeedback
        claimId={claim.id}
        predictionId={prediction?.id}
        initialFeedback={claim.feedback || (claim.feedbacks && claim.feedbacks[0])}
        onFeedbackSaved={(newFb) => {
          claim.feedback = newFb;
          if (claim.feedbacks) {
            const idx = claim.feedbacks.findIndex((f) => f.id === newFb.id || f.inspector_id === newFb.inspector_id);
            if (idx >= 0) claim.feedbacks[idx] = newFb;
            else claim.feedbacks.push(newFb);
          } else {
            claim.feedbacks = [newFb];
          }
        }}
      />

      {/* WORKSPACE TAB SWITCHER */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        {[
          { id: 'summary', label: 'Investigation Summary', icon: FileText },
          { id: 'feedback', label: 'AI Explanation Feedback', icon: Sparkles },
          { id: 'checklist', label: 'Evidence Checklist', icon: ShieldCheck },
          { id: 'timeline', label: 'Claim Timeline', icon: Clock3 },
          { id: 'guidance', label: 'Treatment Guidance', icon: Cpu },
          { id: 'financial', label: 'Settlement Status', icon: FileSpreadsheet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 focus-visible:ring-2 focus-visible:ring-teal-400 ${
                isActive
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ACTIVE TAB CONTENT */}
      {activeTab === 'summary' && (
        <Card hoverable={false} className="bg-slate-900/60 backdrop-blur-xl border-white/10 p-6 shadow-xl space-y-6">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="text-teal-400" size={16} />
              Investigation Evidence Synthesis & AI Findings
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Synthesis of confirmed evidence, advisory AI findings, and field verification requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AVAILABLE EVIDENCE */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
              <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                Confirmed Available Evidence
              </h4>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li>Original crop specimen image uploaded (Upload #{upload?.id || 'N/A'})</li>
                <li>AI Model Classification: <strong>{parsedClass.crop} — {parsedClass.condition}</strong></li>
                <li>Classifier confidence score: <strong>{formatConfidence(prediction?.confidence)}</strong></li>
                <li>Physical damage percentage: <strong>{formatDamage(prediction?.damage_percentage)}</strong></li>
                {gradcamState === 'loaded' && <li>Grad-CAM explainability heatmap overlay available</li>}
                {claim.amount !== null && claim.amount !== undefined && (
                  <li>Claim requested amount recorded: <strong>₹{Number(claim.amount).toLocaleString()}</strong></li>
                )}
              </ul>
            </div>

            {/* MISSING EVIDENCE */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <HelpCircle size={14} />
                Unpopulated / Missing Evidence
              </h4>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                {prediction?.damage_percentage === null || prediction?.damage_percentage === undefined ? (
                  <li>Physical damage percentage not measured by current classification model (requires spatial model).</li>
                ) : null}
                {(gradcamState === 'error' || gradcamState === 'unavailable' || !prediction?.gradcam_url) && (
                  <li>Grad-CAM heatmap overlay path is missing or ungenerated.</li>
                )}
                {gradcamState === 'loading' && (
                  <li>Grad-CAM explainability heatmap verification in progress...</li>
                )}
                {claim.amount === null || claim.amount === undefined ? (
                  <li>Requested claim financial amount is not available in backend record.</li>
                ) : null}
                <li>Farmer identity, GPS coordinates, and bank settlement fields are not present in standard claim payload.</li>
              </ul>
            </div>

            {/* AI ADVISORY FINDINGS */}
            <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4 space-y-2">
              <h4 className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                <Cpu size={14} />
                AI Advisory Findings
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                The classification model identified <strong>{parsedClass.condition}</strong> on <strong>{parsedClass.crop}</strong> with <strong>{formatConfidence(prediction?.confidence)}</strong> confidence. The advisory recommendation signal is <strong>{recVal}</strong>.
              </p>
              {prediction?.recommendation_reason && (
                <p className="text-xs text-slate-400 italic">
                  "{prediction.recommendation_reason}"
                </p>
              )}
            </div>

            {/* MANUAL VERIFICATION FOCUS */}
            <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Activity size={14} />
                Inspector Manual Verification Items
              </h4>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li>Requires physical field inspection to verify actual field crop area damage.</li>
                <li>Verify specimen image authenticity against field visit observations.</li>
                <li>Confirm disease severity with local agricultural extension guidelines.</li>
                <li>Review claim status against official insurer settlement policy.</li>
              </ul>
            </div>
          </div>

          {/* NEUTRAL FRAUD & DECISION DISCLAIMER */}
          <div className="rounded-2xl border border-slate-700/80 bg-slate-950/80 p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-bold text-white">Authoritative Adjudication Notice</p>
              <p className="leading-relaxed text-slate-400">
                AI predictions, confidence scores, and priority heuristics are advisory decision support tools. They do not infer fraud or alter official claim status. Final adjudication rests solely with the authorized human inspector.
              </p>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'feedback' && (
        <AIExplanationFeedback
          claimId={claim.id}
          predictionId={prediction?.id}
          initialFeedback={claim.feedback || (claim.feedbacks && claim.feedbacks[0])}
          onFeedbackSaved={(newFb) => {
            claim.feedback = newFb;
            if (claim.feedbacks) {
              const idx = claim.feedbacks.findIndex((f) => f.id === newFb.id || f.inspector_id === newFb.inspector_id);
              if (idx >= 0) claim.feedbacks[idx] = newFb;
              else claim.feedbacks.push(newFb);
            } else {
              claim.feedbacks = [newFb];
            }
          }}
        />
      )}

      {activeTab === 'checklist' && (
        <ClaimEvidenceChecklist
          claim={claim}
          prediction={prediction}
          gradcamState={gradcamState}
        />
      )}

      {activeTab === 'timeline' && (
        <ClaimTimeline
          claim={claim}
          prediction={prediction}
          gradcamState={gradcamState}
        />
      )}

      {activeTab === 'guidance' && (
        <DiseaseTreatmentGuidance
          classification={prediction?.damage_type || prediction?.classification}
          cropName={prediction?.crop_name}
        />
      )}

      {activeTab === 'financial' && (
        <FinancialStatusSettlement
          claim={claim}
          prediction={prediction}
        />
      )}

      {/* CONFIRMATION DECISION MODAL */}
      <Modal
        isOpen={Boolean(confirmDecision)}
        onClose={() => setConfirmDecision(null)}
        title={`${confirmDecision === 'approve' ? 'Approve' : 'Reject'} Claim ${claimRef}`}
        size="sm"
      >
        <div className="space-y-4 text-left">
          <p className="text-sm leading-relaxed text-slate-300">
            You are about to <strong className={confirmDecision === 'approve' ? 'text-emerald-400' : 'text-red-400'}>{confirmDecision === 'approve' ? 'APPROVE' : 'REJECT'}</strong> backend claim record #{claim.id}. This action will update the official claim status in the database.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <Button
              variant="outline"
              fullWidth={false}
              onClick={() => setConfirmDecision(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant={confirmDecision === 'approve' ? 'primary' : 'danger'}
              fullWidth={false}
              onClick={() => {
                onDecision?.(confirmDecision);
                setConfirmDecision(null);
              }}
              isLoading={actionLoading}
            >
              {confirmDecision === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* CLAIM ASSESSMENT REPORT & PDF EXPORT MODAL */}
      <ClaimAssessmentReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        claim={claim}
        viewMode="inspector"
      />
    </div>
  );
}
