import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  X,
  Search,
  Filter,
  Layers,
  ArrowUpRight,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import useRole from '../../hooks/useRole';
import InspectorLayout from '../../layouts/InspectorLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import AuthorizedImage from '../../components/common/AuthorizedImage';
import SmartClaimReviewQueue from '../../components/inspector/SmartClaimReviewQueue';
import InspectorInvestigationWorkspace from '../../components/inspector/InspectorInvestigationWorkspace';
import AIExplanationFeedback from '../../components/inspector/AIExplanationFeedback';
import aiApi from '../../services/aiApi';
import { getConfidenceFeedback } from '../../utils/predictionFeedback';
import { getDecisionConflictInfo } from '../../utils/claimStatus';

const API_ORIGIN = (import.meta.env.VITE_AI_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const mediaUrl = (path) => (path ? (path.startsWith('http') ? path : `${API_ORIGIN}${path}`) : null);
const dateText = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : 'Not available';
};
const percent = (value) => (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1 ? `${(value * 100).toFixed(1)}%` : 'Not available');
const damageText = (value) => (typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(0)}%` : 'Not available');

function parseClassification(label) {
  if (typeof label !== 'string' || !label.trim() || label.startsWith('unknown_class_')) {
    return { crop: 'Not available', condition: label || 'Not available' };
  }
  const parts = label.split('_').filter(Boolean);
  return parts.length > 1 ? { crop: parts[0], condition: parts.slice(1).join(' ') } : { crop: 'Not available', condition: label };
}

function requestMessage(error) {
  const status = error?.response?.status;
  if (status === 401) return { state: 'unauthorized', message: 'Sign in with a valid Inspector account to access records.' };
  if (status === 403) return { state: 'forbidden', message: 'Your account is not authorized for Inspector adjudication.' };
  if (status === 404) return { state: 'not-found', message: 'The requested claim record was not found.' };
  if (status >= 500) return { state: 'error', message: 'The claim service could not complete the request. Please try again.' };
  return { state: 'error', message: error?.response?.data?.detail || 'Unable to load claim records.' };
}

function StatusBadge({ status }) {
  const value = status || 'UNAVAILABLE';
  const label = value.replace('_', ' ');
  const variant = value === 'APPROVED' ? 'success' : value === 'REJECTED' ? 'danger' : value === 'SUBMITTED' ? 'primary' : value === 'DRAFT' ? 'warning' : 'secondary';
  return <Badge variant={variant}>{label}</Badge>;
}

function EvidenceImage({ src, alt, unavailableText }) {
  return (
    <div className="aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-slate-950/80 shadow-inner">
      <AuthorizedImage src={src} alt={alt} className="h-full w-full object-contain" unavailableText={unavailableText} />
    </div>
  );
}

export default function InspectorDashboard({ initialTab }) {
  const { roleUser } = useRole();
  const location = useLocation();
  const navigate = useNavigate();

  const tabFromPath = () =>
    initialTab ||
    (location.pathname.includes('/pending')
      ? 'pending'
      : location.pathname.includes('/approved')
      ? 'approved'
      : location.pathname.includes('/rejected')
      ? 'rejected'
      : location.pathname.includes('/reports')
      ? 'reports'
      : location.pathname.includes('/profile')
      ? 'profile'
      : 'dashboard');

  const [activeTab, setActiveTabState] = useState(tabFromPath);
  const [claims, setClaims] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [loadState, setLoadState] = useState('loading');
  const [detailState, setDetailState] = useState('idle');
  const [message, setMessage] = useState('');
  const [pendingDecision, setPendingDecision] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const perPage = 6;

  const loadClaims = async () => {
    setLoadState('loading');
    setMessage('');
    try {
      const { data } = await aiApi.get('/claims');
      setClaims(Array.isArray(data) ? data : []);
      setLoadState('ready');
    } catch (error) {
      const result = requestMessage(error);
      setLoadState(result.state);
      setMessage(result.message);
      setClaims([]);
    }
  };

  const params = useParams();

  useEffect(() => {
    setActiveTabState(tabFromPath());
    setCurrentPage(1);
  }, [location.pathname, initialTab]);

  useEffect(() => {
    loadClaims();
  }, [location.pathname, activeTab]);

  useEffect(() => {
    if (params.claimId) {
      openClaim(params.claimId);
    } else {
      setSelectedClaim(null);
    }
  }, [params.claimId]);

  const setActiveTab = (tab) => {
    setSelectedClaim(null);
    navigate(
      {
        dashboard: '/inspector/dashboard',
        pending: '/inspector/pending',
        approved: '/inspector/approved',
        rejected: '/inspector/rejected',
        reports: '/inspector/reports',
        profile: '/inspector/profile',
      }[tab]
    );
  };

  const filtered = useMemo(() => {
    let list = claims;
    if (activeTab === 'pending') {
      list = claims.filter((c) => ['SUBMITTED', 'DRAFT', 'PENDING', 'UNDER_REVIEW'].includes(c.status));
    } else if (activeTab === 'approved') {
      list = claims.filter((c) => c.status === 'APPROVED');
    } else if (activeTab === 'rejected') {
      list = claims.filter((c) => c.status === 'REJECTED');
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (c) =>
        (c.id && String(c.id).toLowerCase().includes(q)) ||
        (c.claim_id && String(c.claim_id).toLowerCase().includes(q)) ||
        (c.farmer?.full_name && c.farmer.full_name.toLowerCase().includes(q)) ||
        (c.farmer?.email && c.farmer.email.toLowerCase().includes(q)) ||
        (c.prediction?.damage_type && c.prediction.damage_type.toLowerCase().includes(q)) ||
        (c.status && c.status.toLowerCase().includes(q))
    );
  }, [claims, activeTab, searchQuery]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const page = Math.min(currentPage, pages);
  const visibleClaims = filtered.slice((page - 1) * perPage, page * perPage);

  const openClaim = async (claimId) => {
    setDetailState('loading');
    setMessage('');
    try {
      const { data } = await aiApi.get(`/claims/${claimId}`);
      setSelectedClaim(data);
      setDetailState('ready');
    } catch (error) {
      const result = requestMessage(error);
      setDetailState(result.state);
      setMessage(result.message);
    }
  };

  const decide = async () => {
    if (!selectedClaim || !pendingDecision) return;
    setActionLoading(true);
    setMessage('');
    try {
      const { data } = await aiApi.put(`/claims/${selectedClaim.id}/${pendingDecision}`);
      setSelectedClaim(data);
      setClaims((items) => items.map((claim) => (claim.id === data.id ? data : claim)));
      setPendingDecision(null);
    } catch (error) {
      const result = requestMessage(error);
      setMessage(result.message);
    } finally {
      setActionLoading(false);
    }
  };

  const isReportView = activeTab === 'reports';
  const pendingCount = claims.filter((claim) => ['SUBMITTED', 'DRAFT', 'PENDING', 'UNDER_REVIEW'].includes(claim.status)).length;
  const approvedCount = claims.filter((claim) => claim.status === 'APPROVED').length;

  return (
    <InspectorLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="space-y-8 text-left p-1">
        
        {/* INSPECTOR HERO ADJUDICATION BANNER */}
        <div className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-950/90 p-8 shadow-[0_0_50px_rgba(13,148,136,0.12)] backdrop-blur-2xl">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-bold text-teal-400">
                  <ShieldCheck size={14} />
                  Adjudication Mission Control
                </span>
              </div>
              <h1 className="text-3xl font-black text-white">
                {isReportView ? 'Inspector Claims Directory' : 'Inspector Review Console'}
              </h1>
              <p className="text-sm text-slate-300 font-medium max-w-3xl leading-relaxed">
                Review real claim records, specimen evidence, and inspector decisions. AI recommendations are advisory and do not replace your decision.
              </p>
            </div>

            <div role="status" className="flex items-center gap-3 rounded-2xl border border-teal-500/30 bg-teal-500/10 px-5 py-3 shadow-lg shadow-teal-500/10 shrink-0">
              <ShieldCheck className="text-teal-400" size={22} aria-hidden="true" />
              <div>
                <span className="text-xs font-bold text-teal-300 block">Inspector access authorized</span>
                <span className="text-xs text-slate-400 font-medium">Inspector access active</span>
              </div>
            </div>
          </div>
        </div>

        {/* REAL METRICS HUD GRID */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-white/10 bg-slate-900/80 p-5 backdrop-blur-xl">
            <div className="flex justify-between text-xs font-extrabold text-slate-400">
              <span>Pending Reviews</span>
              <Clock3 size={18} className="text-amber-400" />
            </div>
            <p className="mt-2 text-3xl font-black text-amber-400">{loadState === 'ready' ? pendingCount : '...'}</p>
          </Card>
          <Card className="border-white/10 bg-slate-900/80 p-5 backdrop-blur-xl">
            <div className="flex justify-between text-xs font-extrabold text-slate-400">
              <span>Approved Claims</span>
              <Check size={18} className="text-emerald-400" />
            </div>
            <p className="mt-2 text-3xl font-black text-emerald-400">{loadState === 'ready' ? approvedCount : '...'}</p>
          </Card>
          <Card className="border-white/10 bg-slate-900/80 p-5 backdrop-blur-xl">
            <div className="flex justify-between text-xs font-extrabold text-slate-400">
              <span>Total Records Loaded</span>
              <FileText size={18} className="text-teal-400" />
            </div>
            <p className="mt-2 text-3xl font-black text-white">{loadState === 'ready' ? claims.length : '...'}</p>
          </Card>
        </div>

        {selectedClaim ? (
          <InspectorInvestigationWorkspace
            claim={selectedClaim}
            loading={detailState === 'loading'}
            error={detailState === 'error' || detailState === 'not-found' ? message : null}
            onBack={() => {
              setSelectedClaim(null);
              navigate('/inspector/dashboard');
            }}
            onDecision={async (decision) => {
              setActionLoading(true);
              setMessage('');
              try {
                const { data } = await aiApi.put(`/claims/${selectedClaim.id}/${decision}`);
                setSelectedClaim(data);
                setClaims((items) => items.map((c) => (c.id === data.id ? data : c)));
              } catch (err) {
                const result = requestMessage(err);
                setMessage(result.message);
              } finally {
                setActionLoading(false);
              }
            }}
            actionLoading={actionLoading}
          />
        ) : activeTab === 'profile' ? (
          <Card className="p-6 border-white/10 bg-slate-900/80 max-w-xl">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center font-black text-2xl">
                {roleUser?.full_name ? roleUser.full_name.substring(0, 2).toUpperCase() : 'IN'}
              </div>
              <div>
                <h2 className="font-extrabold text-lg text-white">{roleUser?.full_name || 'Inspector'}</h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{roleUser?.email || 'Authenticated Inspector Account'}</p>
                <Badge variant="primary" className="mt-2">Authorized Claims Adjudicator</Badge>
              </div>
            </div>
          </Card>
        ) : (
          /* SPLIT-SCREEN ADJUDICATION WORKSPACE (LEFT QUEUE / RIGHT EVIDENCE & DECISION) */
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
            
            {/* LEFT COLUMN (7 COLS): CLAIMS QUEUE & RECORD SELECTOR */}
            <div className="lg:col-span-7 space-y-6">
              <SmartClaimReviewQueue
                claims={claims}
                loading={loadState === 'loading'}
                onSelectClaim={openClaim}
              />
              <Card className="border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-extrabold text-white">
                      <FileText size={18} className="text-teal-400" />
                      {isReportView ? 'Live Claim Report Directory' : 'Adjudication Review Queue'}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Select any claim to view evidence & issue authoritative adjudication.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-44 sm:w-52">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search ID, farmer, crop..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950/60 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-teal-500/50 focus:outline-none"
                      />
                    </div>
                    <Button variant="ghost" size="sm" fullWidth={false} onClick={loadClaims} icon={RefreshCw} aria-label="Refresh claim records">
                      Refresh
                    </Button>
                  </div>
                </div>

                {loadState !== 'ready' && loadState !== 'loading' && <StateMessage message={message} />}

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-xs" aria-label="Live inspector claim records">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 font-bold">
                        <th className="pb-3">Record ID</th>
                        <th className="pb-3">Farmer</th>
                        <th className="pb-3">Crop / Issue</th>
                        <th className="pb-3">AI Conf.</th>
                        <th className="pb-3">Damage / Severity</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans">
                      {visibleClaims.map((claim) => {
                        const classification = parseClassification(claim.prediction?.damage_type);
                        const isSelected = selectedClaim?.id === claim.id;
                        return (
                          <tr
                            key={claim.id}
                            className={`text-slate-300 transition-colors cursor-pointer ${
                              isSelected ? 'bg-teal-500/10 border-l-2 border-teal-400' : 'hover:bg-white/5'
                            }`}
                          >
                            <td className="py-3.5 font-bold font-mono text-teal-400">#{claim.id ?? 'N/A'}</td>
                            <td className="py-3.5">
                              <b className="text-slate-200 block">{claim.farmer?.full_name || 'Farmer'}</b>
                              <span className="text-xs text-slate-400 font-mono">{claim.farmer?.email || 'N/A'}</span>
                            </td>
                            <td className="py-3.5">
                              <b className="text-white block">{classification.crop}</b>
                              <span className="text-xs text-slate-400">{classification.condition}</span>
                            </td>
                            <td className="py-3.5 font-semibold text-emerald-400">{percent(claim.prediction?.confidence)}</td>
                            <td className="py-3.5">
                              <b className="text-amber-400 block">{claim.prediction?.severity || 'Not available'}</b>
                              <span className="text-xs text-slate-400">Damage: {damageText(claim.prediction?.damage_percentage)}</span>
                            </td>
                            <td className="py-3.5">
                              <StatusBadge status={claim.status} />
                            </td>
                            <td className="py-3.5 text-right">
                              <Button
                                variant={isSelected ? 'primary' : 'outline'}
                                size="sm"
                                fullWidth={false}
                                onClick={() => openClaim(claim.id)}
                                aria-label={`Review backend claim record ${claim.id}`}
                              >
                                <Eye size={13} /> {isSelected ? 'Reviewing' : 'Review'}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                      {loadState === 'loading' && (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-slate-400 font-semibold">
                            Loading authorized claim records from backend...
                          </td>
                        </tr>
                      )}
                      {loadState === 'ready' && !visibleClaims.length && (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-slate-400">
                            No persisted claim records match this view.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <nav className="mt-4 flex items-center justify-between border-t border-white/5 pt-3" aria-label="Claim records pagination">
                  <span className="text-xs text-slate-400">
                    Showing Page {page} of {pages} ({filtered.length} total records)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={page === 1}
                      onClick={() => setCurrentPage(page - 1)}
                      aria-label="Previous page"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 disabled:opacity-30"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      disabled={page === pages}
                      onClick={() => setCurrentPage(page + 1)}
                      aria-label="Next page"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 disabled:opacity-30"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </nav>
              </Card>
            </div>

            {/* RIGHT COLUMN (5 COLS): STICKY EVIDENCE & ADJUDICATION PANEL */}
            <div className="lg:col-span-5">
              <ClaimDetails claim={selectedClaim} state={detailState} message={message} onDecision={setPendingDecision} />
            </div>
          </div>
        )}
      </div>

      <DecisionConfirmation
        decision={pendingDecision}
        recordId={selectedClaim?.id}
        loading={actionLoading}
        onCancel={() => setPendingDecision(null)}
        onConfirm={decide}
      />
    </InspectorLayout>
  );
}

function StateMessage({ message }) {
  return (
    <p role="alert" className="mb-4 flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 font-semibold">
      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
      {message || 'Claim records are unavailable.'}
    </p>
  );
}

function ClaimDetails({ claim, state, message, onDecision }) {
  if (state === 'loading') {
    return (
      <Card className="p-8 text-center text-xs text-slate-400 border-white/10 bg-slate-900/80" role="status">
        <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-teal-400" />
        Loading claim evidence details...
      </Card>
    );
  }

  if (!claim) {
    return (
      <Card className="p-10 text-center text-slate-400 border-white/10 bg-slate-900/80">
        <ShieldCheck size={36} className="mx-auto mb-3 text-teal-400" />
        <h2 className="font-extrabold text-white text-base">Select a Claim to Review</h2>
        <p className="text-xs mt-1 text-slate-400 max-w-xs mx-auto leading-relaxed">
          {message || 'Select Review to view image evidence and make the official claim decision.'}
        </p>
      </Card>
    );
  }

  const prediction = claim.prediction || {};
  const classification = parseClassification(prediction.damage_type);
  const confidence = getConfidenceFeedback(prediction.confidence);
  const final = ['APPROVED', 'REJECTED'].includes(claim.status);
  const conflictInfo = getDecisionConflictInfo(claim.status, prediction.recommendation);

  return (
    <Card className="sticky top-6 space-y-5 border border-white/10 bg-slate-900/90 p-6 backdrop-blur-2xl">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <span className="text-xs font-bold text-teal-400">Authenticated Record</span>
          <h2 className="mt-0.5 text-xl font-black text-white">#{claim.id ?? 'N/A'}</h2>
          <p className="mt-1 text-xs text-slate-400">
            Upload #{claim.upload?.id ?? 'N/A'} · {dateText(prediction.timestamp || claim.created_at)}
          </p>
        </div>
        <StatusBadge status={claim.status} />
      </div>

      {/* Dual Specimen Evidence */}
      <section aria-label="Claim evidence images">
        <p className="mb-2 text-xs font-bold text-slate-400">Dual Specimen Evidence</p>
        <div className="grid grid-cols-1 gap-3">
          <figure>
            <EvidenceImage
              src={mediaUrl(claim.upload?.image_url)}
              alt="Original crop image submitted with this claim"
              unavailableText="Original uploaded image unavailable"
            />
            <figcaption className="mt-1 text-xs text-slate-400 font-medium">Original uploaded crop specimen</figcaption>
          </figure>
          <figure>
            <EvidenceImage
              src={mediaUrl(prediction.gradcam_url)}
              alt="Backend-generated Grad-CAM overlay"
              unavailableText="Grad-CAM image unavailable"
            />
            <figcaption className="mt-1 text-xs text-slate-400 font-medium">
              Grad-CAM heatmap overlay: highlights classifier feature influence (not physical loss).
            </figcaption>
          </figure>
        </div>
      </section>

      {/* AI Explanation Feedback */}
      <AIExplanationFeedback
        claimId={claim.id}
        predictionId={prediction.id}
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

      {/* AI Assessment & Financial Details */}
      <section aria-label="AI assessment evidence">
        <p className="mb-2 text-xs font-bold text-slate-400">Telemetry & Claim Evidence</p>
        <dl className="text-xs space-y-1.5 border-t border-white/5 pt-2">
          <Detail label="Crop Specimen" value={classification.crop} />
          <Detail label="AI Classification" value={classification.condition} />
          <Detail
            label="Model Confidence"
            value={confidence.percentage === null ? 'Not available' : `${confidence.percentage.toFixed(1)}% — ${confidence.label}`}
          />
          <Detail label="Damage / Severity" value={`${damageText(prediction.damage_percentage)} · ${prediction.severity || 'Not available'}`} />
          <Detail
            label="Claim Requested Amount"
            value={claim.amount !== null && claim.amount !== undefined ? `₹${Number(claim.amount).toLocaleString()}` : 'Financial information is not available yet.'}
          />
          <Detail label="Bank Settlement Fields" value="Financial information is not available yet." />
          <Detail label="AI Recommendation (Advisory)" value={prediction.recommendation || 'Not available'} />
          <Detail label="Timestamp" value={dateText(prediction.timestamp || claim.created_at)} />
        </dl>
        <p className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 p-3 text-xs leading-relaxed text-slate-300">
          {confidence.description} Model confidence indicates classification certainty. Severity represents domain-informed agronomic threat level, not physical damaged area. Physical damage percentage is not measured.
        </p>
      </section>

      {/* Authoritative Inspector Decision Indicator */}
      <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex gap-2.5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-xs leading-relaxed text-slate-200">
            <strong>Inspector Decision (Authoritative):</strong> {final ? `The persisted record is ${claim.status}.` : 'No final Inspector decision has been recorded yet.'} AI recommendations are advisory decision support.
          </p>
        </div>
      </section>

      {/* Decision Override Notice */}
      {conflictInfo.isOverride && (
        <section className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-4 text-xs text-teal-200">
          <p className="font-bold text-teal-300">Human Inspector Verification Override</p>
          <p className="mt-1 leading-relaxed">
            The recorded Inspector decision (<strong>{claim.status}</strong>) differs from the advisory AI recommendation ({prediction.recommendation}). As an authorized Inspector, your physical field verification overrides advisory AI recommendations.
          </p>
        </section>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => onDecision('reject')}
          disabled={final}
          aria-label="Request confirmation to reject this claim"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 hover:bg-red-800 px-4 py-3 text-xs font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-40 shadow-lg shadow-red-700/20 transition cursor-pointer"
        >
          <X size={15} /> Reject Claim
        </button>
        <button
          onClick={() => onDecision('approve')}
          disabled={final}
          aria-label="Request confirmation to approve this claim"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-3 text-xs font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-40 shadow-lg shadow-emerald-700/20 transition cursor-pointer"
        >
          <Check size={15} /> Approve Claim
        </button>
      </div>
    </Card>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b border-white/5 py-1.5 last:border-0">
      <dt className="shrink-0 text-slate-400">{label}</dt>
      <dd className="text-right font-bold text-white">{value || 'Not available'}</dd>
    </div>
  );
}

function DecisionConfirmation({ decision, recordId, loading, onCancel, onConfirm }) {
  const approve = decision === 'approve';
  return (
    <Modal isOpen={Boolean(decision)} onClose={onCancel} title={`${approve ? 'Approve' : 'Reject'} Backend Claim Record`} size="sm">
      <div className="space-y-4 text-left">
        <p className="text-sm leading-relaxed text-slate-300">
          You are about to <strong className={approve ? 'text-emerald-400' : 'text-red-400'}>{approve ? 'APPROVE' : 'REJECT'}</strong> backend record #{recordId ?? 'N/A'}. This explicit action will update the authoritative claim status in the SQL database.
        </p>
        <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
          <Button variant="outline" fullWidth={false} onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant={approve ? 'primary' : 'danger'} fullWidth={false} onClick={onConfirm} isLoading={loading}>
            {approve ? 'Confirm Approval' : 'Confirm Rejection'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
