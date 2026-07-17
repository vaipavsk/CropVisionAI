import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout,
  Activity,
  Database,
  PlusCircle,
  Download,
  RefreshCw,
  AlertTriangle,
  FileSpreadsheet,
  Clock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Loading from '../../components/ui/Loading';
import ProgressBar from '../../components/ui/ProgressBar';
import Modal from '../../components/ui/Modal';
import Tooltip from '../../components/ui/Tooltip';
import Input from '../../components/ui/Input';

// Recent Uploads Mock Data
const recentUploads = [
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

// Historical Predictions Logs
const predictionHistory = [
  { id: 'CV-9481', timestamp: '2026-07-17 15:02', crop: 'Tomato', disease: 'Early Blight', severity: '28%', confidence: '96%', claim: 'Approved' },
  { id: 'CV-9480', timestamp: '2026-07-17 14:10', crop: 'Potato', disease: 'Late Blight', severity: '64%', confidence: '93%', claim: 'Approved' },
  { id: 'CV-9479', timestamp: '2026-07-17 12:45', crop: 'Corn', disease: 'Healthy', severity: '0%', confidence: '99%', claim: 'Ignored' },
  { id: 'CV-9478', timestamp: '2026-07-16 18:22', crop: 'Tomato', disease: 'Septoria Spot', severity: '42%', confidence: '89%', claim: 'Pending' },
  { id: 'CV-9477', timestamp: '2026-07-16 11:15', crop: 'Potato', disease: 'Early Blight', severity: '18%', confidence: '91%', claim: 'Approved' },
];

export function Dashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCropName, setNewCropName] = useState('');
  const [newCropDisease, setNewCropDisease] = useState('');
  
  // Simulated stats
  const [stats, setStats] = useState({
    totalClaims: 147,
    avgSeverity: 24.8,
    meanLatency: 43,
  });

  // Action: Trigger mock diagnostic telemetry test
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

  // Action: Trigger Database synchronization
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

  const handleAddNewRecord = (e) => {
    e.preventDefault();
    if (!newCropName || !newCropDisease) {
      alert('Please fill out all fields.');
      return;
    }
    setIsModalOpen(false);
    alert(`Successfully registered specimen record: ${newCropName} (${newCropDisease})`);
    setNewCropName('');
    setNewCropDisease('');
  };

  return (
    <div className="space-y-8 pb-12 text-left">
      {/* Loading Overlay */}
      <Loading visible={isLoading} message={loadingMsg} submessage="XAI Engine Diagnostic Monitor" />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
            Mission Control Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium">
            Project Telemetry, Explainable Diagnostics, and Claim Verification Records.
          </p>
        </div>

        {/* Quick Action Button */}
        <button
          onClick={() => navigate('/analysis')}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-sm px-5 py-3 shadow-md hover:shadow-emerald-500/20 transition cursor-pointer"
        >
          <PlusCircle size={16} />
          New Crop Scan Analysis
        </button>
      </div>

      {/* METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1 */}
        <Card hoverable={true}>
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Claims Logged</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <FileSpreadsheet size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalClaims}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
            <TrendingUp size={12} className="text-emerald-500" />
            <span>+12% vs last month</span>
          </p>
        </Card>

        {/* Metric 2 */}
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

        {/* Metric 3 */}
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

        {/* Metric 4 */}
        <Card hoverable={true}>
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Database Sync</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Database size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-500 dark:text-emerald-400">SQL OK</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            MySQL Tables fully synchronized
          </p>
        </Card>

      </div>

      {/* QUICK OPERATIONS BAR */}
      <Card title="Quick Diagnostic Operations" className="bg-slate-100 dark:bg-slate-900/40">
        <div className="flex flex-wrap gap-4 items-center">
          
          <button
            onClick={handleRunTelemetry}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-semibold text-xs px-4 py-2.5 shadow-xs cursor-pointer"
          >
            <Activity size={14} className="text-primary-500" />
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
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-semibold text-xs px-4 py-2.5 shadow-xs cursor-pointer"
          >
            <PlusCircle size={14} className="text-amber-500" />
            Log Manual Specimen
          </button>

          <button
            onClick={() => alert('Diagnostic Reports downloaded (Mock PDF).')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-semibold text-xs px-4 py-2.5 shadow-xs cursor-pointer"
          >
            <Download size={14} className="text-emerald-500" />
            Export Diagnostics CSV
          </button>

        </div>
      </Card>

      {/* RECENT UPLOADS GRID & SVG ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Column 1: Recent Uploads (7/12) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent diagnostic Uploads</h3>
            <span className="text-xs text-slate-400 font-medium">Realtime feed</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentUploads.map((upload) => (
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
                    <span className="text-primary-500">{upload.confidence}%</span>
                  </div>
                  <ProgressBar value={upload.confidence} showLabel={false} size="sm" />
                </div>
                
                <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                  <Clock size={11} />
                  <span>{upload.time}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Column 2: Analytics Placeholders (5/12) */}
        <div className="lg:col-span-5 space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Inference Engine Diagnostics</h3>
          
          <Card>
            <div className="border-b border-slate-200/50 dark:border-white/5 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Disease Class Distribution</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Diagnosed crop specimen metrics</p>
              </div>
              <Sparkles size={16} className="text-emerald-500 animate-pulse" />
            </div>

            {/* Custom SVG Distribution Chart */}
            <div className="flex justify-center items-center h-48 relative">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 36 36">
                {/* Background circle */}
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                {/* Segment Tomato (50%) */}
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="4.2" strokeDasharray="50 100" strokeDashoffset="0" />
                {/* Segment Potato (30%) */}
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4.2" strokeDasharray="30 100" strokeDashoffset="-50" />
                {/* Segment Corn (20%) */}
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#06b6d4" strokeWidth="4.2" strokeDasharray="20 100" strokeDashoffset="-80" />
              </svg>
              
              {/* Legend overlay inside panel */}
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

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4 text-xs font-semibold text-slate-400 dark:text-slate-500">
              <span>Total validation images: 147</span>
              <span>Explainable Grad-CAM: 100%</span>
            </div>
          </Card>
        </div>

      </div>

      {/* PREDICTION HISTORY TABLE */}
      <Card title="Prediction Audit History Logs">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs tracking-wide">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-white/5 text-slate-400 uppercase font-bold h-10">
                <th className="pb-3 px-3">Claim ID</th>
                <th className="pb-3 px-3">Timestamp</th>
                <th className="pb-3 px-3">Specimen</th>
                <th className="pb-3 px-3">Diagnosed Class</th>
                <th className="pb-3 px-3">Severity</th>
                <th className="pb-3 px-3">Confidence</th>
                <th className="pb-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/30 dark:divide-white/5 font-mono">
              {predictionHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/3 font-semibold text-slate-700 dark:text-slate-300">
                  <td className="py-3.5 px-3 text-emerald-500">{item.id}</td>
                  <td className="py-3.5 px-3">{item.timestamp}</td>
                  <td className="py-3.5 px-3">{item.crop}</td>
                  <td className="py-3.5 px-3">{item.disease}</td>
                  <td className="py-3.5 px-3 text-red-400">{item.severity}</td>
                  <td className="py-3.5 px-3 text-primary-500">{item.confidence}</td>
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

        {/* Mock Pagination */}
        <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-white/5 pt-4 mt-4 text-xs font-semibold text-slate-400">
          <span>Showing 5 of {stats.totalClaims} logged scans</span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/3 cursor-pointer">Previous</button>
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/3 cursor-pointer">Next</button>
          </div>
        </div>
      </Card>

      {/* ADD SPECIMEN MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Manual Crop Specimen Diagnostic"
        size="md"
      >
        <form onSubmit={handleAddNewRecord} className="space-y-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manually log a verified agricultural specimen disease class into the MySQL prediction tables.
          </p>

          <Input
            id="cropNameField"
            label="Crop Species"
            value={newCropName}
            onChange={(e) => setNewCropName(e.target.value)}
            placeholder="e.g. Potato, Corn, Tomato"
            required
          />

          <Input
            id="cropDiseaseField"
            label="Diagnosed Class / Condition"
            value={newCropDisease}
            onChange={(e) => setNewCropDisease(e.target.value)}
            placeholder="e.g. Healthy, Rust Leaf, Late Blight"
            required
          />

          <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-white/5 pt-4 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5 text-sm font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold cursor-pointer"
            >
              Sync Record
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

export default Dashboard;
