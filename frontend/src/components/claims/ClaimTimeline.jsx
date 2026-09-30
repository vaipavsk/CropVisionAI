import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  User,
  Cpu,
  ShieldCheck,
  FileText,
  ImageIcon,
  Search,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  Database
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

function formatConfidence(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || Number.isNaN(value)) return null;
  if (value < 0) return null;
  if (value <= 1.0) {
    const pct = value * 100;
    return `${pct.toFixed(1)}%`;
  }
  if (value <= 100.0) {
    return `${value.toFixed(1)}%`;
  }
  return null;
}

function formatDamagePercentage(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || Number.isNaN(value)) return null;
  if (value < 0 || value > 100.0) return null;
  return `${value.toFixed(1)}%`;
}

function validateTimestamp(isoString) {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    return Number.isNaN(d.getTime()) ? null : isoString;
  } catch {
    return null;
  }
}

function formatIsoTimestamp(isoString) {
  const validIso = validateTimestamp(isoString);
  if (!validIso) return 'Timestamp unavailable';
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
    return 'Timestamp unavailable';
  }
}

function getRawTime(isoString) {
  const validIso = validateTimestamp(isoString);
  if (!validIso) return null;
  try {
    const t = new Date(validIso).getTime();
    return Number.isNaN(t) ? null : t;
  } catch {
    return null;
  }
}

export default function ClaimTimeline({
  prediction = null,
  claim = null,
  imageInspection = null,
  gradcamState = 'idle',
  loading = false,
  error = null,
  className = ''
}) {
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'audit'
  const [auditSearch, setAuditSearch] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  // 1. Specimen Upload Evidence (requires explicit backend upload confirmation ID)
  const confirmedUploadId = prediction?.upload_id || prediction?.upload?.id || claim?.upload_id || claim?.upload?.id || null;
  const hasUpload = Boolean(confirmedUploadId);
  const uploadTimestamp = validateTimestamp(claim?.upload?.created_at || prediction?.upload?.created_at || null);

  // 2. Image Quality Status
  let imageQualityStatus = 'not_available';
  let imageQualityValue = 'Quality check pending specimen upload';

  if (imageInspection && typeof imageInspection === 'object') {
    if (imageInspection.readable === false) {
      imageQualityStatus = 'incomplete';
      imageQualityValue = 'Image failed readability validation';
    } else if (
      imageInspection.readable === true &&
      typeof imageInspection.width === 'number' &&
      typeof imageInspection.height === 'number' &&
      imageInspection.width > 0 &&
      imageInspection.height > 0
    ) {
      imageQualityStatus = 'complete';
      imageQualityValue = `${imageInspection.width} × ${imageInspection.height} px`;
    } else if (imageInspection.readable === true) {
      imageQualityStatus = 'complete';
      imageQualityValue = 'Format & readability validated';
    }
  }

  // 3. AI Prediction Diagnostic Payload
  const classificationName = prediction?.classification || prediction?.damage_type || null;
  const rawConfidence = prediction?.classification_confidence ?? prediction?.confidence;
  const formattedConfidence = formatConfidence(rawConfidence);
  const rawDamagePct = prediction?.damage_percentage;
  const formattedDamage = formatDamagePercentage(rawDamagePct);
  const severityVal = prediction?.severity || null;
  const recommendationVal = prediction?.insurance_recommendation || prediction?.recommendation || null;
  const assessmentTimestamp = validateTimestamp(prediction?.timestamp || null);

  // 4. Stored Claim Reference Validation
  const storedClaimId = claim?.claim_id || (claim?.claim_number ? claim.claim_number : null);
  const claimRef = storedClaimId || (typeof claim?.id === 'number' ? `CLM-${String(claim.id).padStart(6, '0')}` : null);
  const claimStatus = claim?.status ? String(claim.status).toUpperCase() : null;
  const claimFilingTimestamp = validateTimestamp(claim?.created_at || null);

  // 5. Grad-CAM Generation & Accessibility Status
  const gradcamPath = prediction?.gradcam_image_path || prediction?.gradcam_url;
  const processingTimeMs = prediction?.processing_time_ms;

  let gradcamStatus = 'not_available';
  let gradcamValue = 'Grad-CAM explainability heatmap unavailable';

  if (!gradcamPath) {
    gradcamStatus = 'unavailable';
    gradcamValue = 'No Grad-CAM heatmap path generated for this assessment';
  } else if (gradcamState === 'loaded') {
    gradcamStatus = 'complete';
    gradcamValue = `Grad-CAM heatmap generated and verified${processingTimeMs ? ` (${processingTimeMs}ms latency)` : ''}`;
  } else if (gradcamState === 'loading') {
    gradcamStatus = 'incomplete';
    gradcamValue = 'Grad-CAM heatmap loading or verification pending';
  } else if (gradcamState === 'error') {
    gradcamStatus = 'incomplete';
    gradcamValue = 'Grad-CAM image loading or verification failed';
  } else if (gradcamState === 'unavailable') {
    gradcamStatus = 'unavailable';
    gradcamValue = 'Grad-CAM image file inaccessible or unavailable';
  } else if (gradcamState === 'idle') {
    gradcamStatus = 'incomplete';
    gradcamValue = 'Grad-CAM verification pending';
  }

  // 6. Inspector Review Verification
  const hasInspectorDecision = claimStatus === 'APPROVED' || claimStatus === 'REJECTED';
  const hasInspectorTimestamp = Boolean(claim?.approved_at || claim?.rejected_at || claim?.reviewed_at);
  const isInspectorReviewed = hasInspectorDecision || hasInspectorTimestamp;
  const inspectorTimestamp = validateTimestamp(
    claim?.approved_at || claim?.rejected_at || claim?.reviewed_at || (hasInspectorDecision ? claim?.updated_at : null)
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // A. RECORDED AUDIT EVENTS (Strictly events supported by actual database data)
  // ─────────────────────────────────────────────────────────────────────────────
  const recordedEvents = [];

  // 1. Upload Event (if upload data exists)
  if (hasUpload) {
    recordedEvents.push({
      id: 'rec_upload',
      type: 'image_uploaded',
      title: 'Crop Specimen Uploaded',
      description: 'Crop specimen image received and stored in secure gateway.',
      timestamp: uploadTimestamp,
      status: 'completed',
      actor: 'Farmer',
      actorIcon: User,
      icon: ImageIcon,
      metadata: {
        UploadID: confirmedUploadId || 'Recorded',
        FileSize: imageInspection?.fileSizeBytes ? `${(imageInspection.fileSizeBytes / 1024).toFixed(1)} KB` : 'Recorded'
      }
    });
  }

  // 2. AI Assessment Event (if prediction data exists)
  if (prediction && (classificationName || assessmentTimestamp)) {
    recordedEvents.push({
      id: 'rec_ai_assessment',
      type: 'ai_assessment',
      title: 'AI Diagnostic Assessment Completed',
      description: `EfficientNet-B0 diagnosed issue: ${classificationName || 'Processed'}.${formattedConfidence ? ` Model confidence: ${formattedConfidence}.` : ''}${severityVal ? ` Domain severity: ${severityVal}.` : ''}${formattedDamage ? ` Physical damage: ${formattedDamage}.` : ''}`,
      timestamp: assessmentTimestamp,
      status: 'completed',
      actor: 'AI System',
      actorIcon: Cpu,
      icon: Cpu,
      metadata: {
        Classification: classificationName || 'Diagnosed',
        Confidence: formattedConfidence || 'Recorded',
        Severity: severityVal || 'Recorded',
        Recommendation: recommendationVal || 'Advisory'
      }
    });
  }

  // 3. Claim Filing Event (if claim filing record exists)
  if (claimRef) {
    recordedEvents.push({
      id: 'rec_claim_filed',
      type: 'claim_submitted',
      title: 'Official Insurance Claim Filed',
      description: `Crop insurance claim submitted with reference ID ${claimRef}.`,
      timestamp: claimFilingTimestamp,
      status: 'completed',
      actor: 'Farmer',
      actorIcon: User,
      icon: FileText,
      metadata: {
        ClaimID: claimRef,
        ClaimAmount: claim?.amount
          ? (claim?.currency ? `${claim.currency} ${claim.amount}` : `Amount: ${claim.amount}`)
          : 'Recorded'
      }
    });
  }

  // 4. Inspector Adjudication Event (ONLY when actual inspector review/decision data exists)
  if (isInspectorReviewed) {
    recordedEvents.push({
      id: 'rec_inspector_decision',
      type: 'inspector_review',
      title: claimStatus === 'APPROVED' ? 'Inspector Claim Approval' : claimStatus === 'REJECTED' ? 'Inspector Claim Rejection' : 'Inspector Adjudication',
      description: claimStatus === 'APPROVED'
        ? 'Authoritative claim approval granted by authorized Inspector.'
        : claimStatus === 'REJECTED'
        ? 'Claim decision rejected by authorized Inspector.'
        : 'Inspector adjudication recorded.',
      timestamp: inspectorTimestamp,
      status: 'completed',
      actor: 'Inspector',
      actorIcon: ShieldCheck,
      icon: ShieldCheck,
      metadata: {
        AuthoritativeDecision: claimStatus || 'Recorded',
        ReviewTimestamp: inspectorTimestamp ? formatIsoTimestamp(inspectorTimestamp) : 'Recorded'
      }
    });
  }

  // Sort recorded audit events chronologically
  const sortedRecordedEvents = [...recordedEvents].sort((a, b) => {
    const timeA = getRawTime(a.timestamp);
    const timeB = getRawTime(b.timestamp);
    if (timeA !== null && timeB !== null) return timeA - timeB;
    if (timeA !== null) return -1;
    if (timeB !== null) return 1;
    return 0;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // B. WORKFLOW PROGRESS MILESTONES (Pipeline progress visualization)
  // ─────────────────────────────────────────────────────────────────────────────
  const workflowMilestones = [
    {
      id: 'wf_upload',
      stageOrder: 1,
      title: 'Specimen Upload',
      description: hasUpload ? 'Specimen image uploaded & validated.' : 'No crop specimen uploaded yet.',
      timestamp: uploadTimestamp,
      status: hasUpload ? 'completed' : 'pending',
      actor: 'Farmer',
      actorIcon: User,
      icon: ImageIcon,
    },
    {
      id: 'wf_ai_diagnostics',
      stageOrder: 2,
      title: 'AI Diagnostic Assessment',
      description: classificationName ? `Diagnosed ${classificationName}${formattedConfidence ? ` (${formattedConfidence} confidence)` : ''}` : 'AI assessment pending specimen scan.',
      timestamp: assessmentTimestamp,
      status: classificationName ? 'completed' : 'pending',
      actor: 'AI System',
      actorIcon: Cpu,
      icon: Cpu,
    },
    {
      id: 'wf_gradcam',
      stageOrder: 3,
      title: 'Grad-CAM Explainability',
      description: gradcamValue,
      timestamp: assessmentTimestamp,
      status: gradcamStatus === 'complete' ? 'completed' : gradcamState === 'error' || gradcamState === 'unavailable' ? 'failed' : gradcamPath ? 'incomplete' : 'unavailable',
      actor: 'AI System',
      actorIcon: Cpu,
      icon: HelpCircle,
    },
    {
      id: 'wf_claim_filing',
      stageOrder: 4,
      title: 'Insurance Claim Filing',
      description: claimRef ? `Claim filed with reference ID ${claimRef}.` : 'No claim filed yet for this specimen.',
      timestamp: claimFilingTimestamp,
      status: claimRef ? 'completed' : 'pending',
      actor: 'Farmer',
      actorIcon: User,
      icon: FileText,
    },
    {
      id: 'wf_inspector_review',
      stageOrder: 5,
      title: 'Inspector Adjudication',
      description: claimStatus === 'APPROVED'
        ? 'Authoritative approval granted by authorized Inspector.'
        : claimStatus === 'REJECTED'
        ? 'Claim decision rejected by authorized Inspector.'
        : claimStatus === 'UNDER_REVIEW'
        ? 'Claim queued for human inspector review.'
        : claimRef
        ? 'Awaiting inspector review.'
        : 'Inspector review pending claim filing.',
      timestamp: inspectorTimestamp,
      status: isInspectorReviewed ? 'completed' : claimStatus === 'UNDER_REVIEW' || claimRef ? 'current' : 'pending',
      actor: 'Inspector',
      actorIcon: ShieldCheck,
      icon: ShieldCheck,
    },
    {
      id: 'wf_settlement',
      stageOrder: 6,
      title: 'Financial Settlement',
      description: 'Financial settlement information is not available yet.',
      timestamp: null,
      status: 'unavailable',
      actor: 'System',
      actorIcon: Cpu,
      icon: Database,
    },
  ];

  // Filter audit events by search text
  const filteredAuditEvents = sortedRecordedEvents.filter((ev) => {
    if (!auditSearch.trim()) return true;
    const q = auditSearch.toLowerCase();
    return (
      ev.title.toLowerCase().includes(q) ||
      ev.description.toLowerCase().includes(q) ||
      ev.actor.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <Card hoverable={false} className={`bg-slate-900/60 p-6 border-white/5 ${className}`}>
        <div className="flex items-center gap-3 text-slate-400">
          <Clock className="h-5 w-5 animate-spin text-teal-400" />
          <span className="text-sm font-semibold">Loading claim timeline & audit history...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card hoverable={false} className={`bg-slate-900/60 p-6 border-red-500/20 ${className}`}>
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      </Card>
    );
  }

  return (
    <Card
      hoverable={false}
      className={`bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200 dark:border-white/5 shadow-xl p-6 ${className}`}
    >
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-200/80 dark:border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-teal-400" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Claim Activity Timeline & Audit Log
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Chronological audit log of recorded events and pipeline workflow progression.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-white/5">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all focus-visible:ring-2 focus-visible:ring-teal-400 ${
                activeTab === 'timeline'
                  ? 'bg-teal-700 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Workflow Timeline
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all focus-visible:ring-2 focus-visible:ring-teal-400 ${
                activeTab === 'audit'
                  ? 'bg-teal-700 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Audit Log ({sortedRecordedEvents.length} Recorded)
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg border border-white/5 focus-visible:ring-2 focus-visible:ring-teal-400"
            aria-label="Toggle section expansion"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* TAB 1: WORKFLOW TIMELINE PROGRESSION */}
          {activeTab === 'timeline' && (
            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-white/10">
              {workflowMilestones.map((event) => {
                const EventIcon = event.icon;
                const ActorIcon = event.actorIcon;
                const isComplete = event.status === 'completed';
                const isCurrent = event.status === 'current';
                const isFailed = event.status === 'failed' || event.status === 'incomplete';
                const isUnavailable = event.status === 'unavailable';

                return (
                  <div key={event.id} className="relative group">
                    {/* Circle Node Icon on Vertical Line */}
                    <div
                      className={`absolute -left-6 sm:-left-8 top-0.5 h-6 w-6 rounded-full border flex items-center justify-center -translate-x-1/2 transition-colors ${
                        isComplete
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                          : isCurrent
                          ? 'border-amber-400 bg-amber-400/20 text-amber-300 animate-pulse'
                          : isFailed
                          ? 'border-red-500 bg-red-500/20 text-red-400'
                          : 'border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-slate-950 text-slate-400'
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 size={13} className="stroke-[2.5]" />
                      ) : isCurrent ? (
                        <Clock size={13} className="stroke-[2.5]" />
                      ) : isFailed ? (
                        <XCircle size={13} className="stroke-[2.5]" />
                      ) : (
                        <EventIcon size={12} />
                      )}
                    </div>

                    {/* Content Box */}
                    <div className="rounded-2xl border border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/40 p-4 transition-all hover:border-slate-300 dark:hover:border-white/10">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {event.title}
                          </h4>

                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                            <ActorIcon size={10} />
                            {event.actor}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                            {formatIsoTimestamp(event.timestamp)}
                          </span>

                          <Badge
                            variant={
                              isComplete
                                ? 'success'
                                : isCurrent
                                ? 'warning'
                                : isFailed
                                ? 'danger'
                                : 'secondary'
                            }
                            className="text-xs font-bold"
                          >
                            {event.status}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: RECORDED AUDIT LOG TABLE VIEW */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    aria-label="Search recorded audit events"
                    placeholder="Search recorded audit events..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                  />
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Showing {filteredAuditEvents.length} recorded audit events
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/40">
                <table className="w-full text-left text-xs tracking-wide">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold h-10 bg-slate-100/50 dark:bg-slate-900/50">
                      <th className="py-2 px-3">Recorded Event</th>
                      <th className="py-2 px-3">Actor</th>
                      <th className="py-2 px-3">Recorded Timestamp</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Recorded Metadata / Telemetry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-white/5 font-mono text-slate-700 dark:text-slate-300">
                    {filteredAuditEvents.map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-100/50 dark:hover:bg-white/5">
                        <td className="py-3 px-3 font-sans font-bold text-slate-900 dark:text-white">
                          {ev.title}
                        </td>
                        <td className="py-3 px-3 font-sans font-medium text-teal-600 dark:text-teal-400">
                          {ev.actor}
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-500 dark:text-slate-400">
                          {formatIsoTimestamp(ev.timestamp)}
                        </td>
                        <td className="py-3 px-3 font-sans">
                          <Badge variant="success" className="text-xs font-bold">
                            Recorded
                          </Badge>
                        </td>
                        <td className="py-3 px-3 font-sans text-xs text-slate-600 dark:text-slate-300">
                          {ev.description}
                        </td>
                      </tr>
                    ))}
                    {filteredAuditEvents.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-400 font-sans">
                          {sortedRecordedEvents.length === 0
                            ? 'No recorded audit events are available yet.'
                            : 'No recorded audit events match your search query.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
