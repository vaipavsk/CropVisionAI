import { useState } from 'react';
import {
  Sparkles,
  Activity,
  Cpu,
  Search,
  CheckCircle,
  AlertTriangle,
  Play,
  FileText,
  Info,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import Loading from '../components/ui/Loading';
import ProgressBar from '../components/ui/ProgressBar';
import Modal from '../components/ui/Modal';
import Tooltip from '../components/ui/Tooltip';
import Input from '../components/ui/Input';
import SearchBar from '../components/ui/SearchBar';

export function DashboardShowcase() {
  // Search bar state
  const [searchVal, setSearchVal] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Loading overlay state
  const [isLoadingActive, setIsLoadingActive] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Running AI model prediction...');

  // Input states
  const [cropType, setCropType] = useState('Tomato');
  const [inputError, setInputError] = useState('');

  // Handle temporary full-screen loading demo
  const triggerLoadingDemo = () => {
    setIsLoadingActive(true);
    setLoadingMsg('Running YOLOv8 leaf detection...');
    
    setTimeout(() => {
      setLoadingMsg('Running EfficientNet disease classifier...');
    }, 1200);

    setTimeout(() => {
      setLoadingMsg('Generating Grad-CAM attention heatmap...');
    }, 2400);

    setTimeout(() => {
      setIsLoadingActive(false);
    }, 3600);
  };

  const handleSaveCrop = () => {
    if (!cropType.trim()) {
      setInputError('Crop type cannot be empty');
    } else {
      setInputError('');
      setIsModalOpen(false);
      alert(`Saved crop: ${cropType}`);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Loading Overlay demo */}
      <Loading visible={isLoadingActive} message={loadingMsg} submessage="XAI Engine v1.4.0" />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
            Mission Control Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Real-time crop diagnostic intelligence system and explainable AI outputs.
          </p>
        </div>

        {/* Top search bar integration */}
        <div className="w-full md:w-80">
          <SearchBar
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onClear={() => setSearchVal('')}
            placeholder="Search diagnostics..."
          />
        </div>
      </div>

      {/* SECTION 1: METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Model 1 Card */}
        <Card glow={true}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">YOLOv8 Detector</h3>
                <p className="text-[10px] uppercase font-semibold text-emerald-500 tracking-wider">Object detection</p>
              </div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-3xl font-extrabold tracking-tight">98.4%</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Mean Average Precision (mAP)</span>
            </div>
            <ProgressBar value={98.4} showLabel={false} />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detects leaf lesions, stem rust, and insect pests in under 45ms.
            </p>
          </div>
        </Card>

        {/* Model 2 Card */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center text-accent-cyan border border-accent-cyan/25">
                <Cpu size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">EfficientNet Classifier</h3>
                <p className="text-[10px] uppercase font-semibold text-accent-cyan tracking-wider">Classification</p>
              </div>
            </div>
            <Badge variant="info">Optimized</Badge>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-3xl font-extrabold tracking-tight">94.2%</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Accuracy rate</span>
            </div>
            <ProgressBar value={94.2} variant="cyan" showLabel={false} />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Categorizes 18 crop diseases across potato, tomato, and corn leaves.
            </p>
          </div>
        </Card>

        {/* System Health Card */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary-500/10 flex items-center justify-center text-secondary-500 border border-secondary-500/20">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">Grad-CAM Map</h3>
                <p className="text-[10px] uppercase font-semibold text-secondary-500 tracking-wider">Explainability</p>
              </div>
            </div>
            <Badge variant="warning">Ready</Badge>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-3xl font-extrabold tracking-tight">100%</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Saliency generation</span>
            </div>
            <ProgressBar value={100} variant="secondary" showLabel={false} />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Renders heatmaps highlighting leaf regions that influenced the model prediction.
            </p>
          </div>
        </Card>

      </div>

      {/* SECTION 2: INTERACTIVE CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Component Sandbox Card */}
        <Card title="Interactive Components Sandbox">
          <div className="border-b border-slate-200/50 dark:border-white/5 pb-3 mb-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Explainable AI Actions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Trigger real-time prediction overlays and configuration settings.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Modal & Loading Triggers</h4>
              <div className="flex flex-wrap gap-4">
                
                {/* Trigger Modal Button */}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-500 hover:bg-primary-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-sm px-4 py-2.5 shadow-sm transition cursor-pointer"
                >
                  <CheckCircle size={16} />
                  Configure Analysis Settings
                </button>

                {/* Trigger Loading Button */}
                <button
                  onClick={triggerLoadingDemo}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/50 dark:border-white/10 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-semibold text-sm px-4 py-2.5 shadow-sm transition cursor-pointer"
                >
                  <Play size={16} />
                  Run AI Pipeline Test
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Tooltips & Indicators</h4>
              <div className="flex items-center gap-4 flex-wrap">
                
                <Tooltip content="YOLOv8 analyzes local plant tissue coordinates" position="top">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-white/5 px-3 py-2 cursor-help">
                    <Info size={14} className="text-primary-500" />
                    Hover for YOLO Info
                  </span>
                </Tooltip>

                <Tooltip content="Grad-CAM generates red heatspots for critical areas" position="bottom">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-white/5 px-3 py-2 cursor-help">
                    <Info size={14} className="text-accent-cyan" />
                    Hover for Grad-CAM Info
                  </span>
                </Tooltip>

                <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2">
                  <span>Spinner states:</span>
                  <Spinner size="sm" />
                  <Spinner size="md" color="cyan" />
                </div>

              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Pill Badges Overview</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="primary">Standard</Badge>
                <Badge variant="success">Tomato Healthy</Badge>
                <Badge variant="warning">Early Blight</Badge>
                <Badge variant="danger">Late Blight</Badge>
                <Badge variant="info">System Processing</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Explainability / Status Card */}
        <Card>
          <div className="border-b border-slate-200/50 dark:border-white/5 pb-3 mb-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Explainable AI (XAI) diagnostics
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live logging from the Grad-CAM saliency layer.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl p-4 bg-slate-100 dark:bg-slate-950/40 border border-slate-200/50 dark:border-white/5 space-y-3 font-mono text-xs text-slate-600 dark:text-slate-300">
              <p className="flex items-center gap-2">
                <span className="text-primary-500 font-bold">[15:10:04]</span>
                <span>Connecting to YOLOv8 inference port 8000... success</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-primary-500 font-bold">[15:10:05]</span>
                <span>Initialized GPU layer memory for Grad-CAM map generation</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-amber-500 font-bold">[15:10:07]</span>
                <span>SQL Synced: Loaded 147 diagnosis logs from tables</span>
              </p>
              <p className="flex items-center gap-2 text-slate-400">
                <span className="text-emerald-500 font-bold">[15:10:08]</span>
                <span>Ready to receive high-res crop images...</span>
              </p>
            </div>
            
            <div className="flex items-center gap-3 rounded-xl border p-4 bg-amber-500/5 border-amber-500/20 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="text-xs font-semibold">
                Alert: MySQL Database tables must not be modified, replaced, or migrated to PostgreSQL/MongoDB per system requirements.
              </p>
            </div>
          </div>
        </Card>

      </div>

      {/* SETTINGS MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Diagnostic Options Configuration"
        size="md"
      >
        <div className="space-y-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure target crop type and active diagnostic confidence parameters for your CropVisionAI research analysis.
          </p>

          <Input
            id="cropTypeInput"
            label="Target Crop Specimen"
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
            error={inputError}
            placeholder="e.g. Potato, Corn, Tomato"
            helperText="The type of plant specimen being analyzed."
          />

          <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-white/5 pt-4 mt-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5 text-sm font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCrop}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

export default DashboardShowcase;
