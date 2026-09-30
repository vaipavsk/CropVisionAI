import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  Send,
  RefreshCw,
  Info,
  Clock,
  UserCheck,
  Check,
  AlertTriangle
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../common/Button';
import { submitExplanationFeedback, getClaimFeedback } from '../../services/feedbackApi';

const FEEDBACK_OPTIONS = [
  {
    id: 'RELEVANT',
    title: 'Relevant',
    description: 'The heatmap appears to highlight the affected crop region.',
    icon: CheckCircle2,
    badgeVariant: 'success',
    accentBorder: 'border-emerald-500/30 hover:border-emerald-500/60',
    selectedBg: 'bg-emerald-500/10 border-emerald-500 shadow-emerald-500/20 shadow-md',
    textColor: 'text-emerald-400',
  },
  {
    id: 'PARTIALLY_RELEVANT',
    title: 'Partially Relevant',
    description: 'The heatmap partly highlights the affected crop region.',
    icon: AlertCircle,
    badgeVariant: 'warning',
    accentBorder: 'border-amber-500/30 hover:border-amber-500/60',
    selectedBg: 'bg-amber-500/10 border-amber-500 shadow-amber-500/20 shadow-md',
    textColor: 'text-amber-400',
  },
  {
    id: 'NOT_RELEVANT',
    title: 'Not Relevant',
    description: 'The heatmap does not appear to highlight the expected crop/damage region.',
    icon: XCircle,
    badgeVariant: 'danger',
    accentBorder: 'border-red-500/30 hover:border-red-500/60',
    selectedBg: 'bg-red-500/10 border-red-500 shadow-red-500/20 shadow-md',
    textColor: 'text-red-400',
  },
  {
    id: 'UNABLE_TO_ASSESS',
    title: 'Unable to Assess',
    description: 'The inspector cannot reliably assess the heatmap.',
    icon: HelpCircle,
    badgeVariant: 'secondary',
    accentBorder: 'border-slate-500/30 hover:border-slate-500/60',
    selectedBg: 'bg-slate-500/10 border-slate-400 shadow-slate-500/20 shadow-md',
    textColor: 'text-slate-300',
  },
];

function formatTimestamp(isoString) {
  if (!isoString) return 'Just now';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return 'Recently';
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Recently';
  }
}

export default function AIExplanationFeedback({
  claimId,
  predictionId,
  initialFeedback = null,
  onFeedbackSaved = null,
  className = '',
}) {
  const [selectedLabel, setSelectedLabel] = useState(initialFeedback?.feedback_label || null);
  const [comment, setComment] = useState(initialFeedback?.comment || '');
  const [savedFeedback, setSavedFeedback] = useState(initialFeedback);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Synchronize initialFeedback if passed from parent
  useEffect(() => {
    if (initialFeedback) {
      setSavedFeedback(initialFeedback);
      setSelectedLabel(initialFeedback.feedback_label || null);
      setComment(initialFeedback.comment || '');
    }
  }, [initialFeedback]);

  // If initialFeedback wasn't supplied directly, attempt background fetch
  useEffect(() => {
    let active = true;
    if (claimId && !initialFeedback) {
      getClaimFeedback(claimId)
        .then((res) => {
          if (active && res?.feedbacks?.length > 0) {
            const latest = res.feedbacks[0];
            setSavedFeedback(latest);
            setSelectedLabel(latest.feedback_label);
            setComment(latest.comment || '');
          }
        })
        .catch(() => {
          // Silent fallback
        });
    }
    return () => {
      active = false;
    };
  }, [claimId, initialFeedback]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedLabel) {
      setErrorMessage('Please select one of the four feedback labels.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await submitExplanationFeedback(claimId, {
        feedback_label: selectedLabel,
        comment,
      });

      const updatedRecord = response?.data;
      setSavedFeedback(updatedRecord);
      setSuccessMessage('AI explanation feedback recorded successfully.');
      if (onFeedbackSaved) {
        onFeedbackSaved(updatedRecord);
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to submit feedback.';
      setErrorMessage(typeof msg === 'string' ? msg : 'Unable to record feedback.');
    } finally {
      setLoading(false);
    }
  };

  const isFormDirty =
    selectedLabel !== (savedFeedback?.feedback_label || null) ||
    comment.trim() !== (savedFeedback?.comment || '').trim();

  return (
    <Card hoverable={false} className={`bg-slate-900/80 backdrop-blur-xl border-white/10 p-6 shadow-xl ${className}`}>
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              AI Explanation Feedback (Grad-CAM)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluate whether the Grad-CAM heatmap highlights relevant visual features of crop damage.
            </p>
          </div>
        </div>

        {savedFeedback && (
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="text-xs font-bold py-1 px-3">
              <Check size={12} className="text-teal-400" />
              Assessment Saved: {savedFeedback.feedback_label.replace('_', ' ')}
            </Badge>
          </div>
        )}
      </div>

      {/* PREVIOUS SAVED FEEDBACK HUD (IF AVAILABLE) */}
      {savedFeedback && (
        <div className="mb-5 rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <UserCheck size={14} className="text-teal-400" />
              <span className="font-bold text-white">
                Recorded by {savedFeedback.inspector_name || 'Authorized Inspector'}
              </span>
              <span className="text-slate-400 font-mono">
                ({savedFeedback.inspector_email || 'Inspector ID #' + savedFeedback.inspector_id})
              </span>
            </div>
            {savedFeedback.comment && (
              <p className="text-slate-300 italic text-xs pl-5">
                "{savedFeedback.comment}"
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
            <Clock size={13} className="text-teal-400" />
            <span>Updated: {formatTimestamp(savedFeedback.updated_at || savedFeedback.created_at)}</span>
          </div>
        </div>
      )}

      {/* SUCCESS / ERROR ALERTS */}
      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 font-medium"
        >
          <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 font-medium"
        >
          <AlertTriangle size={16} className="shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* FEEDBACK LABELS SELECTION */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-2.5">
            Select Assessment Rating <span className="text-teal-400">*</span>
          </label>

          <div
            role="radiogroup"
            aria-label="Grad-CAM heatmap relevance rating options"
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {FEEDBACK_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedLabel === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onClick={() => {
                    setSelectedLabel(option.id);
                    setErrorMessage('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setSelectedLabel(option.id);
                      setErrorMessage('');
                    }
                  }}
                  className={`
                    p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950
                    ${isSelected ? option.selectedBg : `bg-slate-950/60 border-white/10 ${option.accentBorder}`}
                  `}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Icon size={16} className={option.textColor} />
                      <span className="text-xs font-bold text-white">
                        {option.title}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* OPTIONAL COMMENT FIELD */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="feedback-comment" className="font-bold text-slate-300">
              Inspector Comments <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <span className="text-slate-500 font-mono text-[11px]">
              {comment.length} / 2000
            </span>
          </div>

          <textarea
            id="feedback-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 2000))}
            placeholder="Provide context regarding heatmap localization, false activations, or edge occlusion..."
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-slate-950/80 p-3 text-xs text-slate-200 placeholder-slate-500
                       focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 transition-colors"
          />
        </div>

        {/* SUBMIT BUTTON & ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-white/10">
          <div className="flex items-start gap-2 max-w-md">
            <Info size={14} className="text-teal-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-slate-400">
              Your feedback records your assessment of the Grad-CAM explanation. It does not automatically retrain the model or determine the insurance claim decision.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth={false}
              isLoading={loading}
              disabled={loading || !selectedLabel || (!isFormDirty && Boolean(savedFeedback))}
              icon={savedFeedback ? RefreshCw : Send}
              className="text-xs px-5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 border-none shadow-lg shadow-teal-500/20"
            >
              {savedFeedback ? 'Update Feedback' : 'Submit Feedback'}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
