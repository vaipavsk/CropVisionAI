import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Brain, Check, ChevronLeft, ChevronRight, Eye, FileText, ImageOff, Shield, TrendingUp, X } from 'lucide-react';
import useRole from '../../hooks/useRole';
import InspectorLayout from '../../layouts/InspectorLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/ui/Badge';
import api, { handleApiError } from '../../services/api';

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const imageUrl = (path) => (path ? (path.startsWith('http') ? path : `${API_ORIGIN}${path}`) : null);
const dateText = (value) => (value ? new Date(value).toLocaleString() : 'Not available');
const confidenceText = (value) => (typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : 'Not available');

function StatusBadge({ status }) {
  const normalized = status || 'PENDING';
  const variant = normalized === 'APPROVED' ? 'success' : normalized === 'REJECTED' ? 'danger' : normalized === 'UNDER_REVIEW' ? 'primary' : 'warning';
  return <Badge variant={variant}>{normalized.replace('_', ' ')}</Badge>;
}

export default function InspectorDashboard({ initialTab }) {
  const { roleUser } = useRole();
  const location = useLocation();
  const navigate = useNavigate();
  const tabFromPath = () => initialTab || (location.pathname.includes('/pending') ? 'pending' : location.pathname.includes('/approved') ? 'approved' : location.pathname.includes('/rejected') ? 'rejected' : location.pathname.includes('/reports') ? 'reports' : location.pathname.includes('/profile') ? 'profile' : 'dashboard');
  const [activeTab, setActiveTabState] = useState(tabFromPath);
  const [claims, setClaims] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const loadClaims = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/claims');
      setClaims(data);
    } catch (requestError) {
      try { await handleApiError(requestError); } catch (parsed) { setError(parsed.message); }
    } finally { setLoading(false); }
  };

  useEffect(() => { setActiveTabState(tabFromPath()); setCurrentPage(1); }, [location.pathname, initialTab]);
  useEffect(() => { loadClaims(); }, []);

  const setActiveTab = (tab) => {
    const routes = { dashboard: '/inspector/dashboard', pending: '/inspector/pending', approved: '/inspector/approved', rejected: '/inspector/rejected', reports: '/inspector/reports', profile: '/inspector/profile' };
    navigate(routes[tab]);
  };
  const filtered = useMemo(() => activeTab === 'pending' ? claims.filter((claim) => ['PENDING', 'UNDER_REVIEW'].includes(claim.status)) : activeTab === 'approved' ? claims.filter((claim) => claim.status === 'APPROVED') : activeTab === 'rejected' ? claims.filter((claim) => claim.status === 'REJECTED') : claims, [claims, activeTab]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const page = Math.min(currentPage, pageCount);
  const visibleClaims = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const approvedAmount = claims.filter((claim) => claim.status === 'APPROVED').reduce((total, claim) => total + (claim.amount || 0), 0);

  const openClaim = async (claimId) => {
    setActionError('');
    try {
      const { data } = await api.get(`/claims/${claimId}`);
      setSelectedClaim(data);
    } catch (requestError) {
      try { await handleApiError(requestError); } catch (parsed) { setActionError(parsed.message); }
    }
  };
  const decide = async (decision) => {
    if (!selectedClaim) return;
    setActionError('');
    try {
      const { data } = await api.put(`/claims/${selectedClaim.id}/${decision}`);
      setSelectedClaim(data);
      setClaims((old) => old.map((claim) => claim.id === data.id ? data : claim));
    } catch (requestError) {
      try { await handleApiError(requestError); } catch (parsed) { setActionError(parsed.message); }
    }
  };

  return <InspectorLayout activeTab={activeTab} setActiveTab={setActiveTab}>
    <div className="space-y-8 p-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-400 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">Inspector Dashboard</h1><p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Review live AI assessment records and adjudicate insurance claims.</p></div><div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl"><Shield className="text-emerald-500" size={18}/><span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Inspector Clearance Active</span></div></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Metric label="Pending Reviews" value={claims.filter((c) => ['PENDING', 'UNDER_REVIEW'].includes(c.status)).length} icon={<AlertTriangle size={16}/>} color="amber" />
        <Metric label="Approved Claims" value={claims.filter((c) => c.status === 'APPROVED').length} icon={<Check size={16}/>} color="emerald" />
        <Metric label="Total Claims Processed" value={claims.length} icon={<TrendingUp size={16}/>} color="teal" />
      </div>
      {activeTab === 'reports' ? <Card className="p-8 text-center text-slate-400">Diagnostic reports are derived from the live claim records above.</Card> : activeTab === 'profile' ? <Card className="p-6"><h2 className="font-bold text-slate-800 dark:text-white">{roleUser?.full_name || 'Inspector'}</h2><p className="text-xs text-slate-400">{roleUser?.email || 'Official Underwriter Account'}</p></Card> : <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2"><Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5"><div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><FileText size={18} className="text-slate-400"/>Claims Directory</h2><Button variant="outline" onClick={loadClaims} className="text-xs">Refresh</Button></div>{error && <p className="mb-4 rounded-lg bg-red-500/10 p-3 text-xs text-red-500">{error}</p>}<div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-200 dark:border-white/5 text-slate-400 uppercase"><th className="pb-3">Claim</th><th className="pb-3">Farmer / Crop</th><th className="pb-3">Uploaded</th><th className="pb-3">Confidence</th><th className="pb-3">Severity</th><th className="pb-3">Status</th><th/></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-white/5">{visibleClaims.map((claim) => <tr key={claim.id} className="text-slate-700 dark:text-slate-300"><td className="py-3 font-bold">{claim.claim_id}</td><td className="py-3"><div className="flex items-center gap-2">{imageUrl(claim.upload?.image_url) ? <img src={imageUrl(claim.upload.image_url)} alt="Uploaded crop" className="h-9 w-9 rounded object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <ImageOff size={16} className="text-slate-400"/>}<span><b>{claim.farmer?.name || 'Farmer unavailable'}</b><small className="block text-slate-400">{claim.prediction?.crop_name || 'Unknown crop'} · {claim.prediction?.damage_type || 'Prediction missing'}</small></span></div></td><td className="py-3 text-slate-400">{dateText(claim.upload?.created_at)}</td><td className="py-3 text-emerald-500">{confidenceText(claim.prediction?.confidence)}</td><td className="py-3 text-amber-500">{claim.prediction?.severity || 'Not available'}</td><td className="py-3"><StatusBadge status={claim.status}/></td><td className="py-3 text-right"><Button variant="outline" onClick={() => openClaim(claim.id)} className="px-2 py-1 text-xs"><Eye size={14}/> Review</Button></td></tr>)}{!loading && !visibleClaims.length && <tr><td colSpan="7" className="py-8 text-center text-slate-400">No claims found.</td></tr>}{loading && <tr><td colSpan="7" className="py-8 text-center text-slate-400">Loading live claims…</td></tr>}</tbody></table></div><div className="flex justify-end gap-2 mt-4"><button disabled={page === 1} onClick={() => setCurrentPage(page - 1)} className="p-2 disabled:opacity-40"><ChevronLeft size={16}/></button><span className="text-xs pt-2 text-slate-400">{page} / {pageCount}</span><button disabled={page === pageCount} onClick={() => setCurrentPage(page + 1)} className="p-2 disabled:opacity-40"><ChevronRight size={16}/></button></div></Card></div>
        <ClaimDetails claim={selectedClaim} error={actionError} onApprove={() => decide('approve')} onReject={() => decide('reject')} />
      </div>}
    </div>
  </InspectorLayout>;
}

function Metric({ label, value, icon, color }) { return <Card className="bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950"><div className="flex justify-between text-xs uppercase font-bold tracking-wider text-slate-500"><span>{label}</span><span className={`text-${color}-500`}>{icon}</span></div><p className="text-3xl font-black text-slate-800 dark:text-white mt-2">{value}</p></Card>; }

function ClaimDetails({ claim, error, onApprove, onReject }) {
  if (!claim) return <Card className="p-8 text-center text-slate-400"><Shield size={24} className="mx-auto mb-3 text-emerald-500"/><p className="text-xs">Select a live claim to inspect its original image, Grad-CAM, and AI decision support.</p></Card>;
  const prediction = claim.prediction || {};
  return (
    <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 sticky top-6 space-y-5">
      <div className="flex justify-between">
        <div>
          <h3 className="font-extrabold text-slate-800 dark:text-white">{claim.claim_id}</h3>
          <p className="text-[10px] text-slate-400">Claim Review & AI Diagnostics</p>
        </div>
        <StatusBadge status={claim.status}/>
      </div>
      
      <section>
        <p className="mb-2 text-[10px] font-bold uppercase text-slate-400">Original uploaded crop image</p>
        {imageUrl(claim.upload?.image_url) ? (
          <img src={imageUrl(claim.upload.image_url)} alt="Farmer uploaded crop" className="w-full max-h-48 rounded-xl object-cover" onError={(e) => { e.currentTarget.replaceWith(Object.assign(document.createElement('p'), { textContent: 'Uploaded image not available', className: 'text-xs text-slate-400 p-5' })); }} />
        ) : (
          <p className="rounded-xl bg-slate-950/50 p-5 text-center text-xs text-slate-400">Uploaded image not available</p>
        )}
      </section>
      
      <section>
        <p className="mb-2 text-[10px] font-bold uppercase text-slate-400">Grad-CAM Explanation</p>
        {imageUrl(prediction.gradcam_url) ? (
          <img src={imageUrl(prediction.gradcam_url)} alt="Grad-CAM visualization" className="w-full max-h-48 rounded-xl object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block'; }} />
        ) : null}
        <p className="rounded-xl bg-slate-950/50 p-4 text-center text-xs text-slate-400" style={{ display: imageUrl(prediction.gradcam_url) ? 'none' : 'block' }}>Grad-CAM not available</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 leading-normal">
          Saliency attention heatmap overlays red hotspots on pixels that heavily influenced the AI classification decision.
        </p>
      </section>

      <div className="space-y-2 text-xs">
        <Detail label="Crop" value={prediction.crop_name || 'Unknown crop'}/>
        <Detail label="Detected Issue" value={prediction.damage_type || 'Prediction missing'}/>
        <Detail label="Category" value={prediction.category || 'Unknown'}/>
        <Detail label="Confidence" value={confidenceText(prediction.confidence)}/>
        <Detail label="Severity" value={`${prediction.severity || 'Not available'} (${typeof prediction.damage_percentage === 'number' ? prediction.damage_percentage.toFixed(0) + '%' : 'Not available'})`}/>
        <Detail label="Risk Level" value={prediction.risk_level || 'Low'}/>
        <Detail label="YOLO Detection Status" value={`${prediction.detections_count || 0} spots detected`}/>
        <Detail label="Recommendation" value={prediction.recommendation || 'Not available'}/>
        <Detail label="Recommendation Reason" value={prediction.recommendation_reason || 'Not available'}/>
        <Detail label="Timestamp" value={dateText(prediction.timestamp || claim.upload?.created_at)}/>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      
      <div className="grid grid-cols-2 gap-3">
        <Button variant="danger" onClick={onReject} disabled={claim.status === 'REJECTED'} className="text-xs">
          <X size={14}/> Reject
        </Button>
        <Button variant="primary" onClick={onApprove} disabled={claim.status === 'APPROVED'} className="text-xs">
          <Check size={14}/> Approve
        </Button>
      </div>
    </Card>
  );
}
function Detail({ label, value }) { return <div className="border-b border-slate-100 dark:border-white/5 pb-2"><span className="text-slate-400">{label}: </span><span className="font-semibold text-slate-700 dark:text-slate-200">{value}</span></div>; }
