import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  ImageIcon,
  Cpu,
  Activity,
  FileText,
  Layers,
  HelpCircle
} from 'lucide-react';
import Card from '../ui/Card';

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

function formatBytes(bytes) {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || Number.isNaN(bytes) || bytes <= 0) return null;
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function ClaimEvidenceChecklist({
  prediction = null,
  claim = null,
  imageInspection = null,
  gradcamState = 'idle',
  className = ''
}) {
  // 1. Explicit, trustworthy upload detection
  const hasUpload = Boolean(
    prediction?.upload_id ||
    prediction?.upload?.id ||
    prediction?.id ||
    (typeof imageInspection?.fileSizeBytes === 'number' && imageInspection.fileSizeBytes > 0)
  );

  // 2. Image Quality Status based strictly on confirmed validation results
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
      imageQualityValue = `Readable dimensions: ${imageInspection.width} × ${imageInspection.height} px`;
    } else if (imageInspection.readable === true) {
      imageQualityStatus = 'complete';
      imageQualityValue = 'Image format & readability validated';
    }
  }

  // 3. Classification / Prediction label
  const classificationName = prediction?.classification || prediction?.damage_type || null;

  // 4. Model confidence formatting & bounds check
  const rawConfidence = prediction?.classification_confidence ?? prediction?.confidence;
  const formattedConfidence = formatConfidence(rawConfidence);

  // 5. Physical damage percentage formatting & bounds check
  const rawDamagePct = prediction?.damage_percentage;
  const formattedDamage = formatDamagePercentage(rawDamagePct);

  // 6. Severity & AI Recommendation
  const severityVal = prediction?.severity || null;
  const recommendationVal = prediction?.insurance_recommendation || prediction?.recommendation || null;

  // 7. Stored Claim Reference validation
  const storedClaimId = claim?.claim_id || (claim?.claim_number ? claim.claim_number : null);
  const claimRef = storedClaimId || (typeof claim?.id === 'number' ? `CLM-${String(claim.id).padStart(6, '0')}` : null);

  // 8. Grad-CAM generation & accessibility status
  const gradcamPath = prediction?.gradcam_image_path || prediction?.gradcam_url;
  const processingTimeMs = prediction?.processing_time_ms;

  let gradcamStatus = 'not_available';
  let gradcamValue = 'Grad-CAM explainability heatmap unavailable';

  if (gradcamPath && gradcamState === 'loaded') {
    gradcamStatus = 'complete';
    gradcamValue = `Grad-CAM heatmap generated and verified${processingTimeMs ? ` (${processingTimeMs}ms latency)` : ''}`;
  } else if (gradcamPath && gradcamState === 'loading') {
    gradcamStatus = 'incomplete';
    gradcamValue = 'Grad-CAM heatmap loading or verification pending';
  } else if (gradcamPath && gradcamState === 'idle') {
    gradcamStatus = 'incomplete';
    gradcamValue = 'Grad-CAM verification pending';
  } else if (gradcamState === 'error' || gradcamState === 'unavailable') {
    gradcamStatus = 'incomplete';
    gradcamValue = 'Grad-CAM image generation failed or inaccessible';
  } else if (prediction) {
    gradcamStatus = 'incomplete';
    gradcamValue = 'Grad-CAM heatmap not generated for this prediction';
  } else {
    gradcamStatus = 'not_available';
    gradcamValue = 'Grad-CAM explainability heatmap unavailable';
  }

  // Build 9 items array
  const items = [
    {
      id: 'crop_image',
      title: 'Crop Image Uploaded',
      icon: ImageIcon,
      status: hasUpload ? 'complete' : 'incomplete',
      value: hasUpload
        ? imageInspection?.fileSizeBytes
          ? `Specimen received (${formatBytes(imageInspection.fileSizeBytes)})`
          : 'Specimen image received & stored'
        : 'No image specimen uploaded',
    },
    {
      id: 'image_quality',
      title: 'Image Quality Checked',
      icon: Layers,
      status: imageQualityStatus,
      value: imageQualityValue,
    },
    {
      id: 'disease_prediction',
      title: 'Disease Prediction Available',
      icon: Cpu,
      status: classificationName ? 'complete' : 'not_available',
      value: classificationName ? classificationName : 'Classification not performed',
    },
    {
      id: 'model_confidence',
      title: 'Model Confidence Available',
      icon: Activity,
      status: formattedConfidence !== null ? 'complete' : 'not_available',
      value: formattedConfidence !== null ? `${formattedConfidence} classifier confidence` : 'Confidence score not available',
    },
    {
      id: 'damage_percentage',
      title: 'Physical Damage Percentage',
      icon: Activity,
      status: formattedDamage !== null ? 'complete' : 'not_available',
      value: formattedDamage !== null ? `${formattedDamage} measured damage` : 'Physical damage percentage not measured by current model',
    },
    {
      id: 'severity_level',
      title: 'Severity Level Available',
      icon: AlertCircle,
      status: severityVal ? 'complete' : 'not_available',
      value: severityVal ? `${severityVal} Severity Category` : 'Severity level not available',
    },
    {
      id: 'ai_recommendation',
      title: 'AI Recommendation Available',
      icon: ShieldCheck,
      status: recommendationVal ? 'complete' : 'not_available',
      value: recommendationVal ? `Advisory Signal: ${recommendationVal}` : 'AI recommendation not available',
    },
    {
      id: 'claim_reference',
      title: 'Claim Reference Available',
      icon: FileText,
      status: claimRef ? 'complete' : 'incomplete',
      value: claimRef ? `Claim ID: ${claimRef}` : 'No claim filed yet for this specimen',
    },
    {
      id: 'supporting_info',
      title: 'Supporting Information',
      icon: HelpCircle,
      status: gradcamStatus,
      value: gradcamValue,
    },
  ];

  const completedCount = items.filter((i) => i.status === 'complete').length;

  return (
    <Card
      hoverable={false}
      className={`bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200 dark:border-white/5 shadow-xl p-6 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-200/80 dark:border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Claim Evidence Checklist
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Real-data verification of required specimen artifacts and assessment telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-400">
            {completedCount} / {items.length} Complete
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {items.map((item) => {
          const ItemIcon = item.icon;
          const isComplete = item.status === 'complete';
          const isIncomplete = item.status === 'incomplete';

          return (
            <div
              key={item.id}
              className={`rounded-xl border p-3.5 transition-colors ${
                isComplete
                  ? 'border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-950/20'
                  : isIncomplete
                  ? 'border-amber-500/25 bg-amber-500/5 dark:bg-amber-950/20'
                  : 'border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <ItemIcon
                    className={`h-4 w-4 shrink-0 ${
                      isComplete
                        ? 'text-emerald-500'
                        : isIncomplete
                        ? 'text-amber-500'
                        : 'text-slate-400'
                    }`}
                  />
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {item.title}
                  </h4>
                </div>

                <div className="shrink-0">
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 stroke-[2.5]" />
                  ) : isIncomplete ? (
                    <AlertCircle className="h-4 w-4 text-amber-500 stroke-[2.5]" />
                  ) : (
                    <XCircle className="h-4 w-4 text-slate-400 stroke-[2]" />
                  )}
                </div>
              </div>

              <p className="text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                {item.value}
              </p>

              <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/50 dark:border-white/5 pt-2 text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-400">Status</span>
                <span
                  className={
                    isComplete
                      ? 'text-emerald-500 dark:text-emerald-400'
                      : isIncomplete
                      ? 'text-amber-500 dark:text-amber-400'
                      : 'text-slate-400'
                  }
                >
                  {isComplete
                    ? 'Complete'
                    : isIncomplete
                    ? 'Incomplete'
                    : 'Not Available'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
