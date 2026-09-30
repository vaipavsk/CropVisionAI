import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  FileText,
  ChevronRight,
  Sparkles,
  Info,
  RefreshCw,
  Layers,
  Cpu,
  UserCheck
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../common/Button';

// Safe confidence formatter
function formatConfidence(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || Number.isNaN(value)) return 'Not available';
  if (value < 0) return 'Not available';
  if (value <= 1.0) {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (value <= 100.0) {
    return `${value.toFixed(1)}%`;
  }
  return 'Not available';
}

// Safe damage percentage formatter
function formatDamage(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || Number.isNaN(value)) return 'Not measured';
  if (value < 0 || value > 100.0) return 'Not measured';
  return `${value.toFixed(0)}%`;
}

// Safe timestamp formatter
function formatIsoTimestamp(isoString) {
  if (!isoString) return 'Date unavailable';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return 'Date unavailable';
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

// Classification parser helper
function parseClassification(label) {
  if (typeof label !== 'string' || !label.trim() || label.startsWith('unknown_class_')) {
    return { crop: 'Crop Unspecified', condition: label || 'Diagnostic Pending' };
  }
  const parts = label.split('_').filter(Boolean);
  return parts.length > 1
    ? { crop: parts[0], condition: parts.slice(1).join(' ') }
    : { crop: 'Crop Unspecified', condition: label };
}

// Transparent UI Priority Scoring Engine
function calculatePriority(claim) {
  if (!claim) return { score: 0, label: 'LOW', variant: 'secondary' };

  let score = 0;
  const status = String(claim.status || '').toUpperCase();
  const prediction = claim.prediction || {};
  const severity = String(prediction.severity || '').toLowerCase();
  const recommendation = String(prediction.insurance_recommendation || prediction.recommendation || '').toLowerCase();
  const damagePct = typeof prediction.damage_percentage === 'number' ? prediction.damage_percentage : 0;

  const rawConf = prediction.classification_confidence ?? prediction.confidence;
  const confidence = typeof rawConf === 'number' && Number.isFinite(rawConf) ? rawConf : null;

  // 1. Unreviewed status weight (+30 pts)
  if (status === 'PENDING' || status === 'UNDER_REVIEW' || status === 'DRAFT') {
    score += 30;
  }

  // 2. Severity & Damage weight
  if (severity === 'high' || severity === 'severe') {
    score += 25;
  } else if (severity === 'moderate') {
    score += 15;
  }
  if (damagePct > 50) {
    score += 15;
  }

  // 3. AI Recommendation weight
  if (recommendation.includes('manual') || recommendation.includes('review')) {
    score += 20;
  } else if (recommendation.includes('approve')) {
    score += 10;
  } else if (recommendation.includes('reject')) {
    score += 5;
  }

  // 4. Low AI Confidence weight (+10 pts)
  if (confidence !== null && (confidence < 0.60 || confidence < 60)) {
    score += 10;
  }

  score = Math.min(100, Math.max(0, score));

  if (score >= 70) return { score, label: 'URGENT', variant: 'danger' };
  if (score >= 50) return { score, label: 'HIGH', variant: 'warning' };
  if (score >= 30) return { score, label: 'NORMAL', variant: 'primary' };
  return { score, label: 'LOW', variant: 'secondary' };
}

export default function SmartClaimReviewQueue({
  claims = [],
  loading = false,
  onSelectClaim,
  className = ''
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [recommendationFilter, setRecommendationFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('priority_desc');
  const [showFilters, setShowFilters] = useState(false);

  // Enhance claims with frontend UI priority metadata
  const processedClaims = useMemo(() => {
    return claims.map((claim) => {
      const priorityInfo = calculatePriority(claim);
      const parsedClass = parseClassification(claim.prediction?.classification || claim.prediction?.damage_type);
      const claimRef = claim.claim_number || claim.claim_id || (typeof claim.id === 'number' ? `CLM-${String(claim.id).padStart(6, '0')}` : 'CLM-REC');
      return {
        ...claim,
        priorityInfo,
        parsedClass,
        claimRef
      };
    });
  }, [claims]);

  // Filtering & Search
  const filteredClaims = useMemo(() => {
    return processedClaims.filter((item) => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = item.claimRef.toLowerCase().includes(q);
        const matchesCrop = item.parsedClass.crop.toLowerCase().includes(q);
        const matchesCond = item.parsedClass.condition.toLowerCase().includes(q);
        const matchesStatus = String(item.status || '').toLowerCase().includes(q);
        if (!matchesRef && !matchesCrop && !matchesCond && !matchesStatus) return false;
      }

      // Status Filter
      if (statusFilter !== 'ALL') {
        const itemStatus = String(item.status || '').toUpperCase();
        if (itemStatus !== statusFilter) {
          return false;
        }
      }

      // Priority Filter
      if (priorityFilter !== 'ALL' && item.priorityInfo.label !== priorityFilter) {
        return false;
      }

      // Severity Filter
      if (severityFilter !== 'ALL') {
        const itemSev = String(item.prediction?.severity || '').toUpperCase();
        if (severityFilter === 'HIGH') {
          if (itemSev !== 'HIGH' && itemSev !== 'SEVERE') return false;
        } else if (itemSev !== severityFilter.toUpperCase()) {
          return false;
        }
      }

      // Recommendation Filter
      if (recommendationFilter !== 'ALL') {
        const itemRec = String(item.prediction?.insurance_recommendation || item.prediction?.recommendation || '').toLowerCase();
        if (!itemRec.includes(recommendationFilter.toLowerCase())) return false;
      }

      return true;
    });
  }, [processedClaims, searchQuery, statusFilter, priorityFilter, severityFilter, recommendationFilter]);

  // Sorting
  const sortedClaims = useMemo(() => {
    return [...filteredClaims].sort((a, b) => {
      if (sortBy === 'priority_desc') {
        return b.priorityInfo.score - a.priorityInfo.score;
      }
      if (sortBy === 'date_desc') {
        const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tB - tA;
      }
      if (sortBy === 'date_asc') {
        const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tA - tB;
      }
      if (sortBy === 'damage_desc') {
        const dA = typeof a.prediction?.damage_percentage === 'number' ? a.prediction.damage_percentage : -1;
        const dB = typeof b.prediction?.damage_percentage === 'number' ? b.prediction.damage_percentage : -1;
        return dB - dA;
      }
      if (sortBy === 'confidence_asc') {
        const cA = typeof (a.prediction?.classification_confidence ?? a.prediction?.confidence) === 'number' ? (a.prediction?.classification_confidence ?? a.prediction?.confidence) : 999;
        const cB = typeof (b.prediction?.classification_confidence ?? b.prediction?.confidence) === 'number' ? (b.prediction?.classification_confidence ?? b.prediction?.confidence) : 999;
        return cA - cB;
      }
      return 0;
    });
  }, [filteredClaims, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setSeverityFilter('ALL');
    setRecommendationFilter('ALL');
    setSortBy('priority_desc');
  };

  if (loading) {
    return (
      <Card hoverable={false} className={`bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200 dark:border-white/5 shadow-xl p-6 ${className}`}>
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <Clock className="h-5 w-5 animate-spin text-teal-400" />
          <span className="text-sm font-semibold">Loading smart claim review queue...</span>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-200/80 dark:border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Smart Claim Review Queue
            </h2>
            <Badge variant="primary" className="text-xs font-bold ml-2">
              {sortedClaims.length} Claims Queued
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
            Claims are sorted by damage severity, AI guidance, and review status.
          </p>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              aria-label="Search claims by ID, crop, or status"
              placeholder="Search claim ID, crop, status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            />
          </div>

          {/* Sort Selector */}
          <select
            id="claim-sort-by"
            aria-label="Sort claims queue"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:border-teal-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            <option value="priority_desc">Sort: UI Priority (High → Low)</option>
            <option value="date_desc">Sort: Date (Newest First)</option>
            <option value="date_asc">Sort: Date (Oldest First)</option>
            <option value="damage_desc">Sort: Damage % (High → Low)</option>
            <option value="confidence_asc">Sort: AI Confidence (Low → High)</option>
          </select>

          {/* Toggle Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-label="Toggle filter options"
            className={`p-1.5 px-3 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
              showFilters || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || severityFilter !== 'ALL'
                ? 'bg-teal-700 hover:bg-teal-800 text-white border-teal-700'
                : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR DROPDOWN */}
      {showFilters && (
        <div className="mb-6 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label htmlFor="claim-status-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Claim Status
            </label>
            <select
              id="claim-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-1.5 text-xs text-slate-700 dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="DRAFT">Draft</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <label htmlFor="claim-priority-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              UI Priority Tier
            </label>
            <select
              id="claim-priority-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-1.5 text-xs text-slate-700 dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent (&gt;=70)</option>
              <option value="HIGH">High (50-69)</option>
              <option value="NORMAL">Normal (30-49)</option>
              <option value="LOW">Low (&lt;30)</option>
            </select>
          </div>

          <div>
            <label htmlFor="claim-severity-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Severity Level
            </label>
            <select
              id="claim-severity-filter"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-1.5 text-xs text-slate-700 dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              <option value="ALL">All Severities</option>
              <option value="HIGH">High (&gt;70%)</option>
              <option value="MODERATE">Moderate (15-70%)</option>
              <option value="LOW">Low (0-15%)</option>
            </select>
          </div>

          <div>
            <label htmlFor="claim-recommendation-filter" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              AI Recommendation
            </label>
            <select
              id="claim-recommendation-filter"
              value={recommendationFilter}
              onChange={(e) => setRecommendationFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-1.5 text-xs text-slate-700 dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              <option value="ALL">All Recommendations</option>
              <option value="Manual Review">Manual Review</option>
              <option value="Approve">Approve</option>
              <option value="Reject">Reject</option>
            </select>
          </div>

          <div className="col-span-2 sm:col-span-4 flex justify-end mt-1">
            <button
              onClick={resetFilters}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-500 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg px-2 py-1"
            >
              <RefreshCw size={12} />
              Reset All Filters
            </button>
          </div>
        </div>
      )}

      {/* NO CLAIMS AT ALL STATE */}
      {claims.length === 0 && (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
          <FileText className="mx-auto h-10 w-10 text-slate-400 mb-3 opacity-50" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No claims are currently available for review.
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-400">
            When farmers submit crop damage claims, they will populate here for inspector adjudication.
          </p>
        </div>
      )}

      {/* FILTER MISMATCH STATE */}
      {claims.length > 0 && sortedClaims.length === 0 && (
        <div className="py-10 text-center text-slate-500 dark:text-slate-400">
          <AlertCircle className="mx-auto h-9 w-9 text-amber-400 mb-2 opacity-70" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No claims match the selected filters.
          </p>
          <button
            onClick={resetFilters}
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg px-2 py-1"
          >
            Clear filters and search query
          </button>
        </div>
      )}

      {/* QUEUE CARDS LIST */}
      {sortedClaims.length > 0 && (
        <div className="space-y-4">
          {sortedClaims.map((item) => {
            const rawStatus = String(item.status || 'SUBMITTED').toUpperCase();
            const isApproved = rawStatus === 'APPROVED';
            const isRejected = rawStatus === 'REJECTED';
            const isSubmitted = rawStatus === 'SUBMITTED';
            const isDraft = rawStatus === 'DRAFT';
            const isPending = !isApproved && !isRejected;

            const recVal = item.prediction?.insurance_recommendation || item.prediction?.recommendation || null;

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/40 p-4 transition-all hover:border-slate-300 dark:hover:border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* LEFT INFO BLOCK */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                      {item.claimRef}
                    </span>

                    {/* UI Priority Score Badge */}
                    <Badge variant={item.priorityInfo.variant} className="text-xs font-bold">
                      UI Priority: {item.priorityInfo.label} ({item.priorityInfo.score} pt)
                    </Badge>

                    {/* Inspector Claim Status Badge */}
                    <Badge
                      variant={isApproved ? 'success' : isRejected ? 'danger' : isSubmitted ? 'primary' : isDraft ? 'warning' : 'secondary'}
                      className="text-xs font-bold"
                    >
                      {rawStatus}
                    </Badge>

                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono ml-auto lg:ml-0">
                      Filed: {formatIsoTimestamp(item.created_at)}
                    </span>
                  </div>

                  {/* Crop & Diagnosis Details */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700 dark:text-slate-300">
                    <div>
                      Crop: <strong className="text-slate-900 dark:text-white">{item.parsedClass.crop}</strong>
                    </div>
                    <div>
                      Condition: <strong className="text-teal-600 dark:text-teal-400">{item.parsedClass.condition}</strong>
                    </div>
                  </div>

                  {/* AI Telemetry Strip */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300 pt-1">
                    <span>
                      Confidence: <strong>{formatConfidence(item.prediction?.classification_confidence ?? item.prediction?.confidence)}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Damage Area: <strong>{formatDamage(item.prediction?.damage_percentage)}</strong>
                    </span>
                    {item.prediction?.severity && (
                      <>
                        <span>•</span>
                        <span>
                          Severity: <strong className={
                            ['HIGH', 'SEVERE'].includes(String(item.prediction.severity).toUpperCase())
                              ? 'text-red-500'
                              : String(item.prediction.severity).toUpperCase() === 'MODERATE'
                              ? 'text-amber-500'
                              : 'text-emerald-500'
                          }>{item.prediction.severity}</strong>
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span>
                      AI Advisory: <strong className="text-slate-700 dark:text-slate-300">{recVal || 'Not available'}</strong>
                    </span>
                  </div>
                </div>

                {/* RIGHT ACTION BUTTON */}
                <div className="flex items-center gap-3 self-end lg:self-center flex-shrink-0">
                  <Button
                    variant={isPending ? 'primary' : 'outline'}
                    onClick={() => onSelectClaim?.(item.id)}
                    icon={Eye}
                    className="text-xs py-1.5 px-3"
                  >
                    {isPending ? 'Inspect & Adjudicate' : 'View Record'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TRANSPARENT PRIORITY DISCLAIMER */}
      <div className="mt-6 border-t border-slate-200/80 dark:border-white/5 pt-4 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
        <Info size={14} className="text-teal-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Review Priority Disclaimer:</strong> Priority scores are calculated in the frontend to help sort the review queue. They are only guidance. They do not change claim status, replace inspector judgment, or indicate fraud.
        </p>
      </div>
    </Card>
  );
}
