import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sprout,
  Activity,
  Database,
  PlusCircle,
  RefreshCw,
  FileSpreadsheet,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import FarmerLayout from '../../layouts/FarmerLayout';
import Analysis from '../Analysis/Analysis';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Loading from '../../components/ui/Loading';
import ProgressBar from '../../components/ui/ProgressBar';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/common/Button';

// Mock Recent Uploads Data
const initialUploads = [
  {
    id: 'CV-9481',
    crop: 'Tomato',
    disease: 'Tomato Early Blight',
    severity: 28,
    confidence: 96,
    time: '12 mins ago',
    status: 'success',
  },
  {
    id: 'CV-9480',
    crop: 'Potato',
    disease: 'Potato Late Blight',
    severity: 64,
    confidence: 93,
    time: '1 hour ago',
    status: 'danger',
  },
  {
    id: 'CV-9479',
    crop: 'Corn',
    disease: 'Healthy Corn Specimen',
    severity: 0,
    confidence: 99,
    time: '3 hours ago',
    status: 'success',
  },
  {
    id: 'CV-9478',
    crop: 'Tomato',
    disease: 'Tomato Septoria Leaf Spot',
    severity: 42,
    confidence: 89,
    time: 'Yesterday',
    status: 'warning',
  },
];

// Mock Historical Predictions Logs
const initialHistory = [
  { id: 'CV-9481', timestamp: '2026-07-17 15:02', crop: 'Tomato', disease: 'Early Blight', severity: '28%', confidence: '96%', claim: 'Approved' },
  { id: 'CV-9480', timestamp: '2026-07-17 14:10', crop: 'Potato', disease: 'Late Blight', severity: '64%', confidence: '93%', claim: 'Approved' },
  { id: 'CV-9479', timestamp: '2026-07-17 12:45', crop: 'Corn', disease: 'Healthy', severity: '0%', confidence: '99%', claim: 'Ignored' },
  { id: 'CV-9478', timestamp: '2026-07-16 18:22', crop: 'Tomato', disease: 'Septoria Spot', severity: '42%', confidence: '89%', claim: 'Pending' },
  { id: 'CV-9477', timestamp: '2026-07-16 11:15', crop: 'Potato', disease: 'Early Blight', severity: '18%', confidence: '91%', claim: 'Approved' },
];

// Mock Farmer Claims
const initialClaims = [
  { id: 'CLM-0194', crop: 'Rice', disease: 'Bacterial Blight', severity: '78%', requestedAmount: 25000, date: '2026-07-20', status: 'PENDING', recommendation: 'Eligible for 80% Payout' },
  { id: 'CLM-0195', crop: 'Wheat', disease: 'Leaf Rust', severity: '42%', requestedAmount: 12000, date: '2026-07-19', status: 'PENDING', recommendation: 'Partial Claim Approved' },
  { id: 'CLM-0196', crop: 'Corn', disease: 'Common Rust', severity: '15%', requestedAmount: 4500, date: '2026-07-15', status: 'APPROVED', recommendation: 'Minor Damage Coverage' },
  { id: 'CLM-0197', crop: 'Potato', disease: 'Late Blight', severity: '92%', requestedAmount: 45000, date: '2026-07-10', status: 'APPROVED', recommendation: 'Full Payout Sanctioned' },
];

export default function FarmerDashboard({ initialTab }) {
  const location = useLocation();
  const navigate = useNavigate();

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

  // Claims state
  const [claims, setClaims] = useState(initialClaims);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [newClaimCrop, setNewClaimCrop] = useState('');
  const [newClaimDisease, setNewClaimDisease] = useState('');
  const [newClaimSeverity, setNewClaimSeverity] = useState('');
  const [newClaimAmount, setNewClaimAmount] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalClaims: 147,
    avgSeverity: 24.8,
    meanLatency: 43,
  });

  const handleRunTelemetry = () => {
    setIsLoading(true);
    setLoadingMsg('Running hardware inference latency check...');
    setTimeout(() => {
      setLoadingMsg('Querying SQL databases & prediction logs...');
    }, 1000);
    setTimeout(() => {
      setIsLoading(false);
      alert('Telemetry Diagnostic Passed: FastAPI Gateway Online, YOLOv8 Loaded, MySQL Sync OK.');
    }, 2000);
  };

  const handleSyncDatabase = () => {
    setIsLoading(true);
    setLoadingMsg('Syncing claim logs with MySQL backend database...');
    setTimeout(() => {
      setIsLoading(false);
      setStats(prev => ({
        ...prev,
        totalClaims: prev.totalClaims + 3
      }));
      alert('Database Synchronization Completed: 3 new diagnostic records mapped.');
    }, 1500);
  };

  const handleCreateClaimSubmit = (e) => {
    e.preventDefault();
    if (!newClaimCrop || !newClaimDisease || !newClaimAmount) {
      alert('Please fill in all required claim details.');
      return;
    }
    const newClaimObj = {
      id: `CLM-0${Math.floor(1000 + Math.random() * 9000)}`,
      crop: newClaimCrop,
      disease: newClaimDisease,
      severity: newClaimSeverity || '45%',
      requestedAmount: Number(newClaimAmount),
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      recommendation: 'Submitted for Inspector Adjudication'
    };
    setClaims([newClaimObj, ...claims]);
    setIsClaimModalOpen(false);
    setNewClaimCrop('');
    setNewClaimDisease('');
    setNewClaimSeverity('');
    setNewClaimAmount('');
    alert(`Claim ${newClaimObj.id} successfully submitted!`);
  };

  return (
    <FarmerLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <Loading visible={isLoading} message={loadingMsg} submessage="XAI Engine Diagnostic Monitor" />

      {/* TAB 1: DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 pb-12 text-left">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
                Farmer Dashboard
              </h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
                Crop Telemetry, AI Diagnostics, and Insurance Claim Records.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('upload')}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-sm px-5 py-3 shadow-md hover:shadow-emerald-500/20 transition cursor-pointer"
            >
              <PlusCircle size={16} />
              Upload Crop Image
            </button>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card hoverable={true}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Claims Logged</span>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <FileSpreadsheet size={16} />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{claims.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                <TrendingUp size={12} className="text-emerald-500" />
                <span>Active farmer submissions</span>
              </p>
            </Card>

            <Card hoverable={true}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Avg Severity</span>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Sprout size={16} />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.avgSeverity}%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Average crop tissue damage score
              </p>
            </Card>

            <Card hoverable={true}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Model Latency</span>
                <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                  <Activity size={16} />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.meanLatency}ms</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                FastAPI + YOLOv8 inference time
              </p>
            </Card>

            <Card hoverable={true}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Database Sync</span>
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Database size={16} />
                </div>
              </div>
              <p className="text-3xl font-black text-emerald-500 dark:text-emerald-400">SQL OK</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                MySQL Tables synchronized
              </p>
            </Card>
          </div>

          {/* Quick Operations Bar */}
          <Card title="Quick Diagnostic Operations" className="bg-slate-100 dark:bg-slate-900/40">
            <div className="flex flex-wrap gap-4 items-center">
              <button
                onClick={handleRunTelemetry}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-semibold text-xs px-4 py-2.5 shadow-xs cursor-pointer"
              >
                <Activity size={14} className="text-emerald-500" />
                Check Telemetry Latency
              </button>

              <button
                onClick={handleSyncDatabase}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-semibold text-xs px-4 py-2.5 shadow-xs cursor-pointer"
              >
                <RefreshCw size={14} className="text-cyan-500" />
                Force MySQL Sync
              </button>

              <button
                onClick={() => setIsClaimModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-semibold text-xs px-4 py-2.5 shadow-xs cursor-pointer"
              >
                <PlusCircle size={14} className="text-amber-500" />
                Submit New Claim
              </button>
            </div>
          </Card>

          {/* Recent Uploads & AI Diagnostics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Crop Scans</h3>
                <span className="text-xs text-slate-400 font-medium">Realtime feed</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {initialUploads.map((upload) => (
                  <Card key={upload.id} hoverable={true} className="border-slate-100">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{upload.crop}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">{upload.id}</span>
                      </div>
                      <Badge variant={upload.severity > 50 ? 'danger' : upload.severity > 20 ? 'warning' : 'success'}>
                        {upload.severity}% Damage
                      </Badge>
                    </div>
                    
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono mb-4 min-h-[32px]">
                      {upload.disease}
                    </p>

                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span>XAI Confidence:</span>
                        <span className="text-emerald-500">{upload.confidence}%</span>
                      </div>
                      <ProgressBar value={upload.confidence} showLabel={false} size="sm" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Inference Diagnostics */}
            <div className="lg:col-span-5 space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Inference Diagnostics</h3>
              
              <Card>
                <div className="border-b border-slate-200/50 dark:border-white/5 pb-3 mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Disease Class Distribution</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Diagnosed crop specimen metrics</p>
                  </div>
                  <Sparkles size={16} className="text-emerald-500 animate-pulse" />
                </div>

                <div className="flex justify-center items-center h-48 relative">
                  <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="4.2" strokeDasharray="50 100" strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4.2" strokeDasharray="30 100" strokeDashoffset="-50" />
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#06b6d4" strokeWidth="4.2" strokeDasharray="20 100" strokeDashoffset="-80" />
                  </svg>
                  
                  <div className="absolute right-0 top-6 space-y-2 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span>Tomato (50%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <span>Potato (30%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                      <span>Corn (20%)</span>
                    </div>
                  </div>
                </div>
              </Card>
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
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
              Prediction Audit History Logs
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Complete log of all past crop image scans, YOLOv8 detections, and EfficientNet classifications.
            </p>
          </div>

          <Card>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs tracking-wide">
                <thead>
                  <tr className="border-b border-slate-200/50 dark:border-white/5 text-slate-400 uppercase font-bold h-10">
                    <th className="pb-3 px-3">Scan ID</th>
                    <th className="pb-3 px-3">Timestamp</th>
                    <th className="pb-3 px-3">Crop</th>
                    <th className="pb-3 px-3">Diagnosed Issue</th>
                    <th className="pb-3 px-3">Severity</th>
                    <th className="pb-3 px-3">Confidence</th>
                    <th className="pb-3 px-3">Claim Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/30 dark:divide-white/5 font-mono">
                  {initialHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/3 font-semibold text-slate-700 dark:text-slate-300">
                      <td className="py-3.5 px-3 text-emerald-500">{item.id}</td>
                      <td className="py-3.5 px-3">{item.timestamp}</td>
                      <td className="py-3.5 px-3">{item.crop}</td>
                      <td className="py-3.5 px-3">{item.disease}</td>
                      <td className="py-3.5 px-3 text-red-400">{item.severity}</td>
                      <td className="py-3.5 px-3 text-emerald-500">{item.confidence}</td>
                      <td className="py-3.5 px-3">
                        <Badge variant={item.claim === 'Approved' ? 'success' : item.claim === 'Pending' ? 'warning' : 'primary'}>
                          {item.claim}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: CLAIMS VIEW */}
      {activeTab === 'claims' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
                Insurance Claims Status
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Track and manage submitted crop damage claim filings and payout statuses.
              </p>
            </div>
            <Button variant="primary" icon={PlusCircle} onClick={() => setIsClaimModalOpen(true)}>
              Submit New Claim
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/5 text-slate-400 uppercase font-bold tracking-wider">
                    <th className="pb-3">Claim ID</th>
                    <th className="pb-3">Crop / Issue</th>
                    <th className="pb-3">Severity</th>
                    <th className="pb-3">Requested Amount</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">AI Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {claims.map((claim) => (
                    <tr key={claim.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 font-bold text-slate-800 dark:text-slate-200">{claim.id}</td>
                      <td className="py-4">
                        <span className="font-semibold">{claim.crop}</span>
                        <span className="block text-[10px] text-slate-400">{claim.disease}</span>
                      </td>
                      <td className="py-4 font-semibold text-amber-500">{claim.severity}</td>
                      <td className="py-4 font-bold text-emerald-500">₹{claim.requestedAmount.toLocaleString()}</td>
                      <td className="py-4">{claim.date}</td>
                      <td className="py-4">
                        <Badge variant={claim.status === 'APPROVED' ? 'success' : claim.status === 'REJECTED' ? 'danger' : 'warning'}>
                          {claim.status}
                        </Badge>
                      </td>
                      <td className="py-4 text-[11px] text-slate-400">{claim.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: PROFILE VIEW */}
      {activeTab === 'profile' && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
              Farmer Profile Settings
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Manage your personal credentials, contact info, and notification preferences.
            </p>
          </div>

          <Card className="space-y-4">
            <div className="flex items-center gap-4 border-b border-slate-200 dark:border-white/5 pb-4">
              <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-xl">
                FP
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Farmer User</h3>
                <p className="text-xs text-slate-400">Authenticated via Firebase Security Portal</p>
              </div>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Portal Status:</span>
                <span className="text-emerald-500 font-bold">Farmer Clearances Active</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Registered Specimen Scans:</span>
                <span className="text-slate-700 dark:text-slate-200 font-bold">{claims.length} Records Logged</span>
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
            label="Diagnosed Disease / Issue"
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

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60 dark:border-white/5">
            <Button variant="outline" type="button" onClick={() => setIsClaimModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              File Claim
            </Button>
          </div>
        </form>
      </Modal>
    </FarmerLayout>
  );
}
