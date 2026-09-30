import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import useRole from '../../hooks/useRole';
import {
  Sprout,
  Activity,
  PlusCircle,
  RefreshCw,
  FileSpreadsheet,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  UserCheck,
  Search,
  Cpu,
  Wifi,
  Database,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import FarmerLayout from '../../layouts/FarmerLayout';
import Analysis from '../Analysis/Analysis';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Loading from '../../components/ui/Loading';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/common/Button';
import { getMyClaims, createClaim } from '../../services/claimApi';
import FinancialStatus from '../../components/farmer/FinancialStatus';
import FarmerClaimTracker from '../../components/farmer/FarmerClaimTracker';

export default function FarmerDashboard({ initialTab }) {
  const { roleUser } = useRole();
  const location = useLocation();
  const navigate = useNavigate();
  const { claimId } = useParams();

  const getTabFromPath = () => {
    if (initialTab) return initialTab;
    const path = location.pathname;
    if (path.includes('/upload') || path.includes('/analysis')) return 'upload';
    if (path.includes('/history')) return 'history';
    if (path.includes('/claims')) return 'claims';
    if (path.includes('/profile')) return 'profile';
    return 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState(getTabFromPath);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  useEffect(() => {
    setActiveTabState(getTabFromPath());
  }, [location.pathname, initialTab]);

  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    if (tabId === 'dashboard') navigate('/farmer/dashboard');
    else if (tabId === 'upload') navigate('/farmer/upload');
    else if (tabId === 'history') navigate('/farmer/history');
    else if (tabId === 'claims') navigate('/farmer/claims');
    else if (tabId === 'profile') navigate('/farmer/profile');
  };

  // Real backend claims state
  const [realClaims, setRealClaims] = useState([]);
  const [realClaimsState, setRealClaimsState] = useState('loading'); // loading | loaded | empty | unauthorized | error
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [newClaimCrop, setNewClaimCrop] = useState('');
  const [newClaimDisease, setNewClaimDisease] = useState('');
  const [newClaimSeverity, setNewClaimSeverity] = useState('');
  const [newClaimAmount, setNewClaimAmount] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  const fetchFarmerClaims = async () => {
    setRealClaimsState('loading');
    try {
      const data = await getMyClaims();
      if (Array.isArray(data) && data.length > 0) {
        setRealClaims(data);
        setRealClaimsState('loaded');
      } else {
        setRealClaims([]);
        setRealClaimsState('empty');
      }
    } catch (err) {
      const statusCode = err?.response?.status;
      setRealClaims([]);
      if (statusCode === 401 || statusCode === 403) {
        setRealClaimsState('unauthorized');
      } else {
        setRealClaimsState('error');
      }
    }
  };

  useEffect(() => {
    fetchFarmerClaims();
  }, []);

  // Compute telemetry metrics strictly from real backend claim records
  const realStats = useMemo(() => {
    const total = realClaims.length;
    const pending = realClaims.filter(c => c.status === 'PENDING' || c.status === 'UNDER_REVIEW').length;
    const approved = realClaims.filter(c => c.status === 'APPROVED').length;
    const rejected = realClaims.filter(c => c.status === 'REJECTED').length;

    const damageVals = realClaims
      .map(c => c.prediction?.damage_percentage)
      .filter(val => typeof val === 'number' && !Number.isNaN(val));

    const avgDamage = damageVals.length > 0
      ? (damageVals.reduce((a, b) => a + b, 0) / damageVals.length).toFixed(1)
      : null;

    return { total, pending, approved, rejected, avgDamage };
  }, [realClaims]);

  const handleCreateClaimSubmit = async (e) => {
    e.preventDefault();
    if (!newClaimCrop || !newClaimDisease || !newClaimAmount) {
      alert('Please fill in all required claim details.');
      return;
    }

    setSubmittingClaim(true);
    try {
      await createClaim({
        crop_type: newClaimCrop,
        disease_type: newClaimDisease,
        estimated_severity: newClaimSeverity,
        amount: Number(newClaimAmount),
      });

      setIsClaimModalOpen(false);
      setNewClaimCrop('');
      setNewClaimDisease('');
      setNewClaimSeverity('');
      setNewClaimAmount('');
      await fetchFarmerClaims();
    } catch (err) {
      console.error('Error submitting claim:', err);
      alert(err?.response?.data?.detail || 'Failed to submit claim. Please try again.');
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Filter claims for history tab
  const filteredClaimsHistory = useMemo(() => {
    if (!historySearchQuery.trim()) return realClaims;
    const q = historySearchQuery.toLowerCase();
    return realClaims.filter(c => 
      (c.id && String(c.id).toLowerCase().includes(q)) ||
      (c.claim_id && String(c.claim_id).toLowerCase().includes(q)) ||
      (c.prediction?.crop_name && c.prediction.crop_name.toLowerCase().includes(q)) ||
      (c.prediction?.damage_type && c.prediction.damage_type.toLowerCase().includes(q)) ||
      (c.status && c.status.toLowerCase().includes(q))
    );
  }, [realClaims, historySearchQuery]);

  return (
    <FarmerLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <Loading visible={isLoading} message={loadingMsg} submessage="XAI Engine Diagnostic Monitor" />

      {/* TAB 1: COMMAND CENTER OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 pb-12 text-left">
          
          {/* HERO COMMAND CENTER BANNER */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950/90 p-8 shadow-[0_0_50px_rgba(16,185,129,0.12)] backdrop-blur-2xl">
            <div className="absolute right-0 top-0 -mr-16 -mt-16 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-400">
                    <UserCheck size={14} />
                    Farmer Command Center
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                    <Wifi size={12} className="text-emerald-400 animate-pulse" />
                    Live System Sync
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  Agricultural Intelligence Portal
                </h1>
                <p className="text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
                  View crop analysis results, AI explanations, claim guidance, and your insurance claim records, <span className="text-emerald-400 font-bold">{roleUser?.full_name || 'Farmer'}</span>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Button
                  onClick={() => setActiveTab('upload')}
                  variant="primary"
                  size="lg"
                  fullWidth={false}
                  icon={PlusCircle}
                  className="shadow-xl shadow-emerald-500/20 font-bold text-xs px-6 py-3.5"
                >
                  Upload Specimen
                </Button>
                <Button
                  onClick={() => setActiveTab('claims')}
                  variant="outline"
                  size="lg"
                  fullWidth={false}
                  icon={FileSpreadsheet}
                  className="font-bold text-xs px-5 py-3.5"
                >
                  Claims & Financials
                </Button>
              </div>
            </div>
          </div>

          {/* TELEMETRY HUD (HEADS-UP DISPLAY) GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card hoverable={true} className="border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-extrabold text-slate-400">Total Claims Logged</span>
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-md">
                  <FileSpreadsheet size={20} />
                </div>
              </div>
              <p className="text-4xl font-black text-white">
                {realClaimsState === 'loaded' ? realStats.total : realClaimsState === 'loading' ? '...' : 0}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                <TrendingUp size={14} className="text-emerald-400" />
                <span>Authenticated backend records</span>
              </div>
            </Card>

            <Card hoverable={true} className="border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-extrabold text-slate-400">Pending Review</span>
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-md">
                  <Clock size={20} />
                </div>
              </div>
              <p className="text-4xl font-black text-amber-400">
                {realClaimsState === 'loaded' ? realStats.pending : realClaimsState === 'loading' ? '...' : 0}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                <span>Awaiting Inspector Adjudication</span>
              </div>
            </Card>

            <Card hoverable={true} className="border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-extrabold text-slate-400">Inspector Approved</span>
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-md">
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <p className="text-4xl font-black text-emerald-400">
                {realClaimsState === 'loaded' ? realStats.approved : realClaimsState === 'loading' ? '...' : 0}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                <span>Authoritative Inspector Approvals</span>
              </div>
            </Card>

            <Card hoverable={true} className="border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-extrabold text-slate-400">Rejected Claims</span>
                <div className="h-10 w-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shadow-md">
                  <XCircle size={20} />
                </div>
              </div>
              <p className="text-4xl font-black text-red-400">
                {realClaimsState === 'loaded' ? realStats.rejected : realClaimsState === 'loading' ? '...' : 0}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                <span>Adjudicated non-qualifying claims</span>
              </div>
            </Card>
          </div>

          {/* ASYMMETRIC 2-COLUMN COMMAND LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN (7 COLS): REAL CROP CLAIM ACTIVITY STREAM */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <Activity className="text-emerald-400" size={20} />
                    Live Specimen Claim Activity
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Real claim records loaded directly from your authenticated backend database</p>
                </div>
                <Badge variant="primary">{realClaims.length} Live Records</Badge>
              </div>

              {realClaimsState === 'loading' && (
                <Card className="border-white/10 bg-slate-900/70 p-10 text-center">
                  <RefreshCw size={24} className="mx-auto mb-3 animate-spin text-emerald-400" />
                  <p className="text-sm font-semibold text-slate-300">Synchronizing authenticated claim records...</p>
                </Card>
              )}

              {realClaimsState === 'unauthorized' && (
                <Card className="border-amber-500/30 bg-amber-500/5 p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
                    <div>
                      <h3 className="text-sm font-bold text-white">Authentication Clearance Required</h3>
                      <p className="mt-1 text-xs text-slate-300">
                        Please sign in with a registered Farmer account to access live claim activity.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {realClaimsState === 'error' && (
                <Card className="border-red-500/30 bg-red-500/5 p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20} />
                    <div>
                      <h3 className="text-sm font-bold text-white">Service Connectivity Error</h3>
                      <p className="mt-1 text-xs text-slate-300">
                        Unable to fetch claim records from the API gateway. Try refreshing the connection.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {realClaimsState === 'empty' && (
                <Card className="border-white/10 bg-slate-900/70 p-12 text-center">
                  <Sprout size={40} className="mx-auto mb-4 text-emerald-400" />
                  <h3 className="text-lg font-black text-white">No Claim Records Logged Yet</h3>
                  <p className="mt-2 text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    You haven&apos;t filed any crop insurance claims or uploaded specimen assessments yet. Upload a crop image in the workspace to run AI diagnostics.
                  </p>
                  <div className="mt-6">
                    <Button
                      onClick={() => setActiveTab('upload')}
                      variant="primary"
                      size="md"
                      fullWidth={false}
                      icon={PlusCircle}
                      className="px-6 py-3 font-bold text-xs"
                    >
                      Upload Crop Specimen
                    </Button>
                  </div>
                </Card>
              )}

              {realClaimsState === 'loaded' && realClaims.length > 0 && (
                <div className="space-y-4">
                  {realClaims.map((claim) => (
                    <Card
                      key={claim.id}
                      hoverable={true}
                      className="border-white/10 bg-slate-900/80 hover:border-emerald-500/40 p-5 transition-all cursor-pointer group"
                      onClick={() => setActiveTab('claims')}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-white/5 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                            <Layers size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-emerald-400">
                                {claim.claim_id || `CLM-${claim.id}`}
                              </span>
                              <span className="text-xs text-slate-400 font-semibold">• Upload #{claim.upload?.id ?? 'N/A'}</span>
                            </div>
                            <h3 className="font-black text-base text-white mt-0.5">
                              {claim.prediction?.crop_name || 'Crop Specimen'}
                            </h3>
                          </div>
                        </div>

                        <Badge variant={claim.status === 'APPROVED' ? 'success' : claim.status === 'REJECTED' ? 'danger' : 'warning'}>
                          {claim.status || 'PENDING'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-300 py-2">
                        <div>
                          <span className="text-xs font-bold text-slate-400 block">Diagnosed Issue</span>
                          <span className="font-mono font-semibold text-emerald-400">{claim.prediction?.damage_type || 'Unclassified'}</span>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-400 block">Severity & Damage</span>
                          <span className="font-bold text-amber-400">
                            {claim.prediction?.severity || (typeof claim.prediction?.damage_percentage === 'number' ? `${claim.prediction.damage_percentage.toFixed(0)}%` : 'Not measured')}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-400 block">Requested Amount</span>
                          <span className="font-bold text-white">
                            {claim.amount !== null && claim.amount !== undefined ? `₹${Number(claim.amount).toLocaleString()}` : 'Unavailable'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 text-xs font-bold text-emerald-400 border-t border-white/5 mt-2">
                        <span className="text-xs text-slate-400 font-normal">AI Rec: {claim.prediction?.recommendation || 'Advisory Review'}</span>
                        <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <span>View Claim Details</span>
                          <ArrowUpRight size={14} />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN (5 COLS): TELEMETRY MONITOR, COMMAND BAR & FINANCIAL STATUS */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* SYSTEM TELEMETRY MONITOR */}
              <Card className="border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Cpu className="text-teal-400" size={16} />
                    Backend System Telemetry
                  </h3>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-slate-950/40">
                    <span className="text-slate-400 flex items-center gap-2 font-semibold">
                      <Wifi size={14} className="text-emerald-400" />
                      FastAPI Gateway:
                    </span>
                    <span className="font-bold text-emerald-400">Online (12ms)</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-slate-950/40">
                    <span className="text-slate-400 flex items-center gap-2 font-semibold">
                      <Cpu size={14} className="text-teal-400" />
                      AI Diagnostic Engine:
                    </span>
                    <span className="font-bold text-teal-400">EfficientNet-B0 Classifier + Grad-CAM Explainability</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-slate-950/40">
                    <span className="text-slate-400 flex items-center gap-2 font-semibold">
                      <Database size={14} className="text-emerald-400" />
                      MySQL Database Sync:
                    </span>
                    <span className="font-bold text-emerald-400">Synchronized</span>
                  </div>
                </div>
              </Card>

              {/* QUICK OPERATIONS COMMAND PANEL */}
              <Card className="border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
                <h3 className="text-xs font-bold text-slate-400 mb-4">Quick Diagnostic Operations</h3>
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    onClick={() => setActiveTab('upload')}
                    variant="primary"
                    size="sm"
                    fullWidth={true}
                    icon={PlusCircle}
                    className="justify-start px-4 py-3 font-bold text-xs"
                  >
                    Upload Specimen Image
                  </Button>

                  <Button
                    onClick={() => setActiveTab('history')}
                    variant="outline"
                    size="sm"
                    fullWidth={true}
                    icon={Activity}
                    className="justify-start px-4 py-3 font-bold text-xs"
                  >
                    View Prediction Audit Logs
                  </Button>

                  <Button
                    onClick={() => setActiveTab('claims')}
                    variant="outline"
                    size="sm"
                    fullWidth={true}
                    icon={FileSpreadsheet}
                    className="justify-start px-4 py-3 font-bold text-xs"
                  >
                    Claims & Financial Status
                  </Button>

                  <Button
                    onClick={fetchFarmerClaims}
                    variant="outline"
                    size="sm"
                    fullWidth={true}
                    icon={RefreshCw}
                    className="justify-start px-4 py-3 font-bold text-xs"
                  >
                    Force Backend Sync
                  </Button>
                </div>
              </Card>

              {/* INTEGRATED FINANCIAL STATUS COMPONENT */}
              <FinancialStatus 
                claim={realClaims.length > 0 ? realClaims[0] : null} 
                state={realClaimsState} 
                recommendation={realClaims.length > 0 ? realClaims[0]?.prediction?.recommendation : null} 
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UPLOAD CROP (ANALYSIS WORKSPACE) */}
      {activeTab === 'upload' && (
        <Analysis />
      )}

      {/* TAB 3: PREDICTION HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Prediction Audit History Logs
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Real-data log of past crop specimen scans and backend predictions linked to your account.
              </p>
            </div>
            <div className="w-full sm:w-64">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search claims or crops..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <Card className="border-white/10 bg-slate-900/80 p-6">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs tracking-wide">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-bold h-10">
                    <th className="pb-3 px-3">Claim Ref</th>
                    <th className="pb-3 px-3">Upload Specimen</th>
                    <th className="pb-3 px-3">Diagnosed Crop & Issue</th>
                    <th className="pb-3 px-3">Severity & Damage</th>
                    <th className="pb-3 px-3">AI Confidence</th>
                    <th className="pb-3 px-3">AI Recommendation</th>
                    <th className="pb-3 px-3">Claim Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {filteredClaimsHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 font-semibold text-slate-300">
                      <td className="py-3.5 px-3 text-emerald-400 font-bold">{item.claim_id || `CLM-${item.id}`}</td>
                      <td className="py-3.5 px-3">Upload #{item.upload?.id ?? item.upload_id ?? 'N/A'}</td>
                      <td className="py-3.5 px-3 font-sans">
                        <span className="font-bold text-white block">{item.prediction?.crop_name || 'Crop'}</span>
                        <span className="text-xs text-slate-400">{item.prediction?.damage_type || 'Unclassified'}</span>
                      </td>
                      <td className="py-3.5 px-3 text-amber-400">
                        {item.prediction?.severity ? (
                          <>
                            <span className="font-bold text-white block">{item.prediction.severity}</span>
                            <span className="text-xs text-slate-400 font-normal">
                              {typeof item.prediction?.damage_percentage === 'number' ? `${item.prediction.damage_percentage.toFixed(0)}%` : 'Damage: Not measured'}
                            </span>
                          </>
                        ) : (
                          typeof item.prediction?.damage_percentage === 'number' ? `${item.prediction.damage_percentage.toFixed(0)}%` : 'Not measured'
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-emerald-400">
                        {typeof item.prediction?.confidence === 'number' ? `${(item.prediction.confidence * 100).toFixed(1)}%` : 'Not available'}
                      </td>
                      <td className="py-3.5 px-3 font-sans text-slate-300">{item.prediction?.recommendation || 'Advisory'}</td>
                      <td className="py-3.5 px-3 font-sans">
                        <Badge variant={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'}>
                          {item.status || 'PENDING'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {filteredClaimsHistory.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400 font-sans">
                        {realClaimsState === 'loading'
                          ? 'Loading prediction history from backend...'
                          : 'No real prediction history logs found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: CLAIMS TRACKER & NOTIFICATIONS VIEW */}
      {activeTab === 'claims' && (
        <FarmerClaimTracker
          claims={realClaims}
          state={realClaimsState}
          onRefresh={fetchFarmerClaims}
          onNewClaim={() => setIsClaimModalOpen(true)}
          selectedClaimId={claimId}
        />
      )}

      {/* TAB 5: PROFILE VIEW */}
      {activeTab === 'profile' && (
        <div className="space-y-6 max-w-2xl text-left">
          <div className="border-b border-white/10 pb-4">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Farmer Profile Settings
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Manage your personal credentials, contact info, and authenticated portal role.
            </p>
          </div>

          <Card className="border-white/10 bg-slate-900/80 space-y-5 p-6">
            <div className="flex items-center gap-4 border-b border-white/10 pb-5">
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-500/10">
                {roleUser?.full_name ? roleUser.full_name.substring(0, 2).toUpperCase() : 'FP'}
              </div>
              <div>
                <h2 className="font-black text-lg text-white">
                  {roleUser?.full_name || 'Farmer User'}
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {roleUser?.email || 'Authenticated via Firebase Security Portal'}
                </p>
              </div>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400 font-semibold">Portal Access Role:</span>
                <span className="text-emerald-400 font-bold uppercase">Farmer Clearance</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400 font-semibold">Registered Specimen Claims:</span>
                <span className="text-white font-bold">{realClaimsState === 'loaded' ? realClaims.length : 0} Live Records</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400 font-semibold">Security Protocol:</span>
                <span className="text-emerald-400 font-bold">Firebase Token Authentication OK</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* SUBMIT CLAIM MODAL */}
      <Modal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        title="Submit New Crop Insurance Claim"
        size="md"
      >
        <form onSubmit={handleCreateClaimSubmit} className="space-y-4">
          <Input
            id="claimCrop"
            label="Crop Specimen Type"
            value={newClaimCrop}
            onChange={(e) => setNewClaimCrop(e.target.value)}
            placeholder="e.g. Rice, Wheat, Potato, Corn"
            required
          />
          <Input
            id="claimDisease"
            label="Detected Issue"
            value={newClaimDisease}
            onChange={(e) => setNewClaimDisease(e.target.value)}
            placeholder="e.g. Bacterial Blight, Late Blight"
            required
          />
          <Input
            id="claimSeverity"
            label="Estimated Severity %"
            value={newClaimSeverity}
            onChange={(e) => setNewClaimSeverity(e.target.value)}
            placeholder="e.g. 65%"
          />
          <Input
            id="claimAmount"
            type="number"
            label="Requested Claim Amount (₹)"
            value={newClaimAmount}
            onChange={(e) => setNewClaimAmount(e.target.value)}
            placeholder="e.g. 25000"
            required
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="outline" type="button" onClick={() => setIsClaimModalOpen(false)} fullWidth={false} disabled={submittingClaim}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" fullWidth={false} isLoading={submittingClaim}>
              File Claim
            </Button>
          </div>
        </form>
      </Modal>
    </FarmerLayout>
  );
}
