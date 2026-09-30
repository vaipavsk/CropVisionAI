import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  X,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Layers,
  Cpu,
  CheckCircle2,
  HelpCircle,
  Activity,
  Info,
  CreditCard,
  Building2,
  AlertTriangle
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../common/Button';
import Badge from '../ui/Badge';
import AuthorizedImage from '../common/AuthorizedImage';
import { fetchAuthenticatedImageDataUrl, exportReportElementToPDF } from '../../utils/pdfExport';

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

export default function ClaimAssessmentReportModal({
  isOpen = false,
  onClose,
  claim = null,
  prediction: rawPrediction = null,
  upload: rawUpload = null,
  viewMode = 'inspector' // 'inspector' | 'farmer'
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [origImageBase64, setOrigImageBase64] = useState(null);
  const [gradcamImageBase64, setGradcamImageBase64] = useState(null);
  const [imagesLoading, setImagesLoading] = useState(false);
  const reportRef = useRef(null);

  const prediction = claim?.prediction || rawPrediction || null;
  const upload = claim?.upload || rawUpload || null;
  const parsedClass = parseClassification(prediction?.damage_type || prediction?.classification);

  const claimRef = claim?.claim_id || claim?.claim_number || (typeof claim?.id === 'number' ? `CLM-${String(claim.id).padStart(6, '0')}` : 'CLM-UNSET');
  const rawStatus = String(claim?.status || 'PENDING').toUpperCase();
  const isApproved = rawStatus === 'APPROVED';
  const isRejected = rawStatus === 'REJECTED';
  const isInspector = viewMode === 'inspector';

  // Fetch image base64 data for authenticated PDF export
  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setImagesLoading(true);
    setExportError(null);

    const origPath = upload?.image_url;
    const gradcamPath = prediction?.gradcam_url;

    Promise.all([
      fetchAuthenticatedImageDataUrl(origPath),
      fetchAuthenticatedImageDataUrl(gradcamPath)
    ]).then(([origBase64, gradcamBase64]) => {
      if (!active) return;
      setOrigImageBase64(origBase64);
      setGradcamImageBase64(gradcamBase64);
      setImagesLoading(false);
    }).catch(() => {
      if (!active) return;
      setImagesLoading(false);
    });

    return () => {
      active = false;
    };
  }, [isOpen, upload?.image_url, prediction?.gradcam_url]);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    setExportError(null);

    try {
      const filename = `CropVisionAI_Claim_Report_${claimRef}.pdf`;
      await exportReportElementToPDF(reportRef.current, filename);
    } catch (err) {
      console.error('PDF export failed:', err);
      setExportError('Failed to generate PDF document. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const reportGenDate = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Claim Assessment Report — ${claimRef}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* TOP MODAL ACTIONS */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-400" />
            <span className="text-xs font-bold text-slate-300">
              {isInspector ? 'Inspector Evaluation Document' : 'Farmer Claim Summary'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={handleExportPDF}
              isLoading={isExporting}
              disabled={isExporting || imagesLoading}
            >
              {isExporting ? 'Generating PDF...' : 'Download PDF Report'}
            </Button>
          </div>
        </div>

        {exportError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{exportError}</span>
          </div>
        )}

        {/* PRINTABLE REPORT DOCUMENT CONTAINER */}
        <div
          ref={reportRef}
          id="claim-assessment-report-document"
          className="bg-slate-950 text-slate-100 p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6 font-sans select-text"
        >
          {/* HEADER BRANDING & METADATA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center font-black text-slate-950 text-sm shadow-md">
                  CV
                </div>
                <div>
                  <h1 className="text-lg font-black text-white tracking-wide">
                    CropVisionAI
                  </h1>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-teal-400">
                    Automated Insurance Claim Verification Platform
                  </p>
                </div>
              </div>
              <h2 className="text-sm font-bold text-slate-300 mt-2">
                Official Claim Assessment & Advisory Report
              </h2>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-400 space-y-1 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Report Ref: </span>
                <strong className="font-mono text-teal-400">{claimRef}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Generated: </span>
                <span className="text-slate-300">{reportGenDate}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Scope: </span>
                <span className="text-slate-300">{isInspector ? 'Full Inspector Investigation' : 'Farmer Claim Summary'}</span>
              </div>
            </div>
          </div>

          {/* 1. CLAIM IDENTIFICATION & OFFICIAL STATUS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Claim Number
              </span>
              <span className="font-mono text-sm font-bold text-teal-400 block">
                {claimRef}
              </span>
              <span className="text-[10px] text-slate-500">
                Backend ID: #{claim?.id ?? 'Not available'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Official Adjudication Status
              </span>
              <Badge variant={isApproved ? 'success' : isRejected ? 'danger' : 'primary'} className="text-xs">
                {rawStatus}
              </Badge>
              <span className="text-[10px] text-slate-500 block mt-1">
                Persisted in carrier database
              </span>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Submission Date
              </span>
              <span className="text-slate-200 block font-semibold">
                {formatIsoTimestamp(claim?.created_at)}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Last Status Update
              </span>
              <span className="text-slate-200 block font-semibold">
                {formatIsoTimestamp(claim?.updated_at || claim?.approved_at || claim?.rejected_at)}
              </span>
            </div>
          </div>

          {/* 2. CROP SPECIMEN & AI ASSESSMENT FINDINGS */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-teal-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Cpu size={14} />
              AI Specimen Assessment & Advisory Signals
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Crop Specimen & Condition
                </span>
                <div className="font-bold text-slate-100 text-sm">{parsedClass.crop}</div>
                <div className="text-teal-400 text-xs">{parsedClass.condition}</div>
                {prediction?.category && (
                  <div className="text-[10px] text-slate-400 mt-1">Category: {prediction.category}</div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Classifier Confidence & Severity
                </span>
                <div className="font-bold text-emerald-400 text-sm">
                  {formatConfidence(prediction?.confidence)}
                </div>
                <div className="text-slate-300 text-xs">
                  Severity: {prediction?.severity || 'Not available'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Detections: {prediction?.detections_count ?? 'Not available'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Physical Damage & AI Recommendation
                </span>
                <div className="font-bold text-amber-400 text-sm">
                  {formatDamage(prediction?.damage_percentage)}
                </div>
                <div className="text-slate-200 text-xs truncate">
                  {prediction?.insurance_recommendation || prediction?.recommendation || 'Not available'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Advisory decision support signal</div>
              </div>
            </div>

            {prediction?.recommendation_reason && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
                <span className="font-bold text-slate-200">Recommendation Rationale: </span>
                <span className="italic">{prediction.recommendation_reason}</span>
              </div>
            )}
          </div>

          {/* 3. VISUAL SPECIMEN & GRAD-CAM EXPLAINABILITY */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-teal-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Layers size={14} />
              Visual Evidence & Grad-CAM Heatmap
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* ORIGINAL UPLOADED SPECIMEN */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                  <span>1. Uploaded Crop Specimen</span>
                  <span>{upload?.original_name || 'Specimen File'}</span>
                </div>
                <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center p-1">
                  {origImageBase64 ? (
                    <img
                      src={origImageBase64}
                      alt="Original uploaded specimen"
                      className="h-full w-full object-contain rounded-lg"
                    />
                  ) : upload?.image_url ? (
                    <AuthorizedImage
                      src={mediaUrl(upload.image_url)}
                      alt="Original uploaded specimen"
                      className="h-full w-full object-contain rounded-lg"
                      unavailableText="Original uploaded image unavailable"
                    />
                  ) : (
                    <div className="text-center p-4 text-slate-500 text-xs">
                      Original uploaded image not available
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Farmer-captured image specimen stored with JWT authorization.
                </p>
              </div>

              {/* GRAD-CAM HEATMAP OVERLAY */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                  <span>2. Grad-CAM Explainability Heatmap</span>
                  <span className={prediction?.gradcam_url ? 'text-emerald-400' : 'text-amber-400'}>
                    {prediction?.gradcam_url ? 'Heatmap Available' : 'Not Available'}
                  </span>
                </div>
                <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center p-1">
                  {gradcamImageBase64 ? (
                    <img
                      src={gradcamImageBase64}
                      alt="Grad-CAM explainability heatmap"
                      className="h-full w-full object-contain rounded-lg"
                    />
                  ) : prediction?.gradcam_url ? (
                    <AuthorizedImage
                      src={mediaUrl(prediction.gradcam_url)}
                      alt="Grad-CAM explainability heatmap"
                      className="h-full w-full object-contain rounded-lg"
                      unavailableText="Grad-CAM heatmap unavailable"
                    />
                  ) : (
                    <div className="text-center p-4 text-slate-500 text-xs">
                      Grad-CAM heatmap not available
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  <strong>XAI Note:</strong> Highlights activation regions influencing the model classification.
                </p>
              </div>
            </div>
          </div>

          {/* 4. EVIDENCE CHECKLIST & TIMELINE SUMMARY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* EVIDENCE SUMMARY */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h4 className="font-extrabold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-400" />
                Verified Evidence Summary
              </h4>
              <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                <li>Uploaded specimen image: <strong>{upload?.id ? `Upload #${upload.id}` : 'Not available'}</strong></li>
                <li>AI classification: <strong>{parsedClass.crop} — {parsedClass.condition}</strong></li>
                <li>Model confidence: <strong>{formatConfidence(prediction?.confidence)}</strong></li>
                <li>Grad-CAM overlay: <strong>{prediction?.gradcam_url ? 'Available' : 'Not available'}</strong></li>
                <li>Claim requested amount: <strong>{formatCurrency(claim?.amount)}</strong></li>
              </ul>
            </div>

            {/* TIMELINE SUMMARY */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h4 className="font-extrabold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1">
                <Clock size={13} className="text-teal-400" />
                Claim Milestone Timeline
              </h4>
              <ul className="space-y-1 text-slate-300 text-[11px]">
                <li className="flex justify-between">
                  <span>1. Claim Submitted:</span>
                  <strong className="font-mono">{formatIsoTimestamp(claim?.created_at)}</strong>
                </li>
                <li className="flex justify-between">
                  <span>2. Inspector Review:</span>
                  <strong className="font-mono">{formatIsoTimestamp(claim?.approved_at || claim?.rejected_at || claim?.updated_at)}</strong>
                </li>
                <li className="flex justify-between">
                  <span>3. Official Decision:</span>
                  <strong className="font-mono text-teal-400">{rawStatus}</strong>
                </li>
                <li className="flex justify-between">
                  <span>4. Settlement Record:</span>
                  <strong className="font-mono">{typeof claim?.settlement_amount === 'number' ? 'Recorded' : 'Not recorded'}</strong>
                </li>
              </ul>
            </div>
          </div>

          {/* 5. FINANCIAL STATUS SUMMARY (ONLY RECORDED FIELDS) */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
            <h4 className="font-extrabold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <CreditCard size={14} className="text-emerald-400" />
              Recorded Financial & Settlement Status
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div>
                <span className="text-slate-400 block">Requested Amount:</span>
                <span className="font-mono font-bold text-slate-100">{formatCurrency(claim?.amount)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Approved Payout:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {typeof claim?.approved_amount === 'number' ? formatCurrency(claim.approved_amount) : isRejected ? 'Not applicable' : 'Not recorded'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Settlement Payout:</span>
                <span className="font-mono font-bold text-slate-100">
                  {typeof claim?.settlement_amount === 'number' ? formatCurrency(claim.settlement_amount) : isRejected ? 'Not applicable' : 'Not recorded'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Payment Execution:</span>
                <span className="font-bold text-slate-200">{claim?.payment_status ? String(claim.payment_status) : 'Not recorded'}</span>
              </div>
            </div>
          </div>

          {/* 6. INSPECTOR MANUAL VERIFICATION NOTES (INSPECTOR VIEW ONLY) */}
          {isInspector && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
              <h4 className="font-extrabold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Activity size={14} className="text-amber-400" />
                Inspector Verification Checklist & Missing Data Safeguards
              </h4>
              <ul className="text-slate-300 text-[11px] space-y-1 list-disc list-inside">
                <li>Confirm physical crop damage in field against specimen image upload.</li>
                <li>Verify local disease outbreak telemetry with extension officer reports.</li>
                <li>Farmer identity, GPS field boundaries, and bank transfer routing are not present in standard claim telemetry; verify manually if required by policy.</li>
              </ul>
            </div>
          )}

          {/* 7. OFFICIAL ADVISORY DISCLAIMER */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2.5 leading-relaxed">
            <Info size={16} className="shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong className="font-bold block text-white mb-0.5">Authoritative Legal & Advisory Notice</strong>
              AI findings (classification, confidence scores, domain-informed severity, and Grad-CAM activation heatmaps) are advisory decision-support tools provided by CropVisionAI. They do not constitute a final underwriting decision or guarantee financial payout. Official adjudication and payout approval rest solely with the authorized human inspector and insurance carrier.
            </div>
          </div>

        </div>
      </div>
    </Modal>
  );
}
