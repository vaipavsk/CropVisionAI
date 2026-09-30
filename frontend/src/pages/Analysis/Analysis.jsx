import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Brain,
  Sprout,
  ShieldAlert,
  Sparkles,
  ImageIcon,
  Play,
  FileText,
  Cpu,
  Activity,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { uploadImage } from '../../services/uploadApi';
import { predict } from '../../services/predictionApi';
import { AI_API_BASE_URL } from '../../services/aiApi';
import { getMyClaims } from '../../services/claimApi';
import { findClaimForUpload } from '../../utils/claimStatus';
import Card from '../../components/ui/Card';
import Button from '../../components/common/Button';
import AuthorizedImage from '../../components/common/AuthorizedImage';
import InsuranceClaimReport from '../../components/analysis/InsuranceClaimReport';
import ConfidenceAndImageQuality, { ImageInputChecks } from '../../components/analysis/ConfidenceAndImageQuality';
import ClaimStatusPanel from '../../components/analysis/ClaimStatusPanel';
import FinancialStatus from '../../components/farmer/FinancialStatus';
import ClaimEvidenceChecklist from '../../components/claims/ClaimEvidenceChecklist';
import ClaimTimeline from '../../components/claims/ClaimTimeline';
import DiseaseTreatmentGuidance from '../../components/claims/DiseaseTreatmentGuidance';
import FinancialStatusSettlement from '../../components/claims/FinancialStatusSettlement';

// Configuration constants
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png'];

const PIPELINE_STAGES = [
  { key: 'upload', label: 'Uploading Specimen to Secure Gateway' },
  { key: 'yolo', label: 'YOLOv8 Generic Object Context (COCO)' },
  { key: 'efficientnet', label: 'EfficientNet Crop Disease Classifier' },
  { key: 'gradcam', label: 'Grad-CAM XAI Heatmap Synthesis' },
  { key: 'severity', label: 'Damage Severity & Risk Analysis' },
  { key: 'recommendation', label: 'Insurance Decision Synthesis' }
];

export default function Analysis() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  // Pipeline processing state
  const [status, setStatus] = useState('idle'); // idle | processing | success | error
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [predictionData, setPredictionData] = useState(null);
  const [gradcamImageState, setGradcamImageState] = useState('idle');
  const [originalImageFailed, setOriginalImageFailed] = useState(false);
  const [imageInspection, setImageInspection] = useState({ readable: null, width: null, height: null, fileSizeBytes: null });
  const [claimLookup, setClaimLookup] = useState({ state: 'idle', claim: null });

  const fileInputRef = useRef(null);
  const stageTimerRef = useRef(null);
  const imageInspectionIdRef = useRef(0);

  // Clean up object URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle step-by-step loading animation ticks
  useEffect(() => {
    if (status === 'processing') {
      // Tick through stages every 1.5 seconds, up to the last stage (recommendation)
      stageTimerRef.current = setInterval(() => {
        setCurrentStageIndex((prevIndex) => {
          if (prevIndex < PIPELINE_STAGES.length - 1) {
            return prevIndex + 1;
          }
          return prevIndex;
        });
      }, 1500);
    } else {
      if (stageTimerRef.current) {
        clearInterval(stageTimerRef.current);
      }
    }

    return () => {
      if (stageTimerRef.current) {
        clearInterval(stageTimerRef.current);
      }
    };
  }, [status]);

  useEffect(() => {
    if (status !== 'success' || !predictionData?.upload_id) return undefined;

    let active = true;
    const uploadId = predictionData.upload_id;
    setClaimLookup({ state: 'loading', claim: null });

    getMyClaims()
      .then((claims) => {
        if (!active) return;
        const matchingClaim = findClaimForUpload(claims, uploadId);
        setClaimLookup(matchingClaim ? { state: 'loaded', claim: matchingClaim } : { state: 'empty', claim: null });
      })
      .catch((requestError) => {
        if (!active) return;
        const statusCode = requestError?.response?.status;
        setClaimLookup({ state: statusCode === 401 || statusCode === 403 ? 'unauthorized' : 'error', claim: null });
      });

    return () => {
      active = false;
    };
  }, [status, predictionData?.upload_id]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (selectedFile) => {
    setError('');
    if (!selectedFile) return false;

    if (!ALLOWED_FORMATS.includes(selectedFile.type)) {
      setError('Unsupported file type. Please upload a JPG, JPEG, or PNG image.');
      return false;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setError('File is too large. Specimen files must not exceed 10 MB.');
      return false;
    }

    return true;
  };

  const inspectImageInput = (selectedFile) => {
    const inspectionId = ++imageInspectionIdRef.current;
    setImageInspection({ readable: null, width: null, height: null, fileSizeBytes: selectedFile.size });

    const metadataUrl = URL.createObjectURL(selectedFile);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(metadataUrl);
      if (inspectionId !== imageInspectionIdRef.current) return;
      setImageInspection({
        readable: true,
        width: image.naturalWidth,
        height: image.naturalHeight,
        fileSizeBytes: selectedFile.size,
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(metadataUrl);
      if (inspectionId !== imageInspectionIdRef.current) return;
      setImageInspection({ readable: false, width: null, height: null, fileSizeBytes: selectedFile.size });
    };
    image.src = metadataUrl;
  };

  const selectFile = (selectedFile) => {
    if (!validateFile(selectedFile)) return;
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setOriginalImageFailed(false);
    inspectImageInput(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      selectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      selectFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    imageInspectionIdRef.current += 1;
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError('');
    setStatus('idle');
    setPredictionData(null);
    setGradcamImageState('idle');
    setOriginalImageFailed(false);
    setImageInspection({ readable: null, width: null, height: null, fileSizeBytes: null });
    setClaimLookup({ state: 'idle', claim: null });
    setCurrentStageIndex(0);
  };

  const startAnalysis = async () => {
    if (!file) return;
    if (imageInspection.readable !== true) {
      setError(imageInspection.readable === false
        ? 'The selected image could not be decoded in this browser. Please choose another JPG or PNG file.'
        : 'Image metadata is still loading. Please wait a moment and try again.');
      return;
    }

    setStatus('processing');
    setCurrentStageIndex(0);
    setError('');
    setClaimLookup({ state: 'idle', claim: null });

    try {
      // Stage 1: Uploading Specimen (index 0)
      const uploadRes = await uploadImage(file);

      if (!uploadRes.success || !uploadRes.data?.upload_id) {
        throw new Error(uploadRes.message || 'Image upload failed.');
      }

      const uploadId = uploadRes.data.upload_id;

      // Automatically fast-forward to YOLO stage
      setCurrentStageIndex(1);

      // Stages 2-6: Prediction analysis pipeline runs in parallel
      const predictionRes = await predict(uploadId);

      if (!predictionRes.success || !predictionRes.data) {
        throw new Error(predictionRes.message || 'AI prediction pipeline failed.');
      }

      // Fast forward loading index to the end and show success
      setCurrentStageIndex(PIPELINE_STAGES.length - 1);
      setGradcamImageState(predictionRes.data.gradcam_image_path ? 'loading' : 'unavailable');

      // Delay slightly for premium UX flow
      setTimeout(() => {
        setPredictionData(predictionRes.data);
        setStatus('success');
      }, 500);

    } catch (err) {
      setError(err.message || 'An error occurred during pipeline execution. Please try again.');
      setStatus('error');
    }
  };

  const getGradcamImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('/media/heatmaps/')) return `${AI_API_BASE_URL}${path}`;
    const filename = path.split(/[\\/]/).pop();
    return filename ? `${AI_API_BASE_URL}/media/heatmaps/${encodeURIComponent(filename)}` : null;
  };

  const formatPercent = (value, digits = 1) => (
    typeof value === 'number' && Number.isFinite(value) ? `${(value * 100).toFixed(digits)}%` : 'Not available'
  );

  const formatDamage = (value) => (
    typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(0)}%` : 'Not measured'
  );

  const formatMilliseconds = (value) => (
    typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(0)} ms` : 'Not available'
  );

  const formatTimestamp = (value) => {
    if (!value) return 'Not available';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
          Crop Analysis Workspace
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Upload crop images for EfficientNet disease classification and Grad-CAM explainability heatmaps.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* IDLE / UPLOAD VIEW */}
        {status === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Upload Zone Card */}
            <div className="lg:col-span-2">
              <Card hoverable={false} className="h-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200 dark:border-white/5 shadow-xl">
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">
                      Specimen Image Upload
                    </h2>

                    {error && (
                      <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold mb-4 flex items-start gap-2">
                        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Drag and Drop Container */}
                    {!previewUrl ? (
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label="Upload crop specimen image by clicking or dragging a file here"
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                          border-2 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-300 min-h-[300px]
                          ${dragActive
                            ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-neon-emerald'
                            : 'border-slate-300 dark:border-white/10 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/20'
                          }
                        `}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          className="hidden"
                          aria-label="Upload crop image file"
                          onChange={handleFileChange}
                        />
                        <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 border border-emerald-500/25 shadow-glass-glow animate-pulse">
                          <Upload size={28} />
                        </div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          Drag and drop crop specimen image here
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                          Or <span className="text-emerald-500 font-bold underline">browse local directory</span>
                        </p>
                        <div className="flex gap-3 justify-center mt-6 text-xs uppercase tracking-wider text-slate-400 font-bold">
                          <span>PNG</span>
                          <span>•</span>
                          <span>JPG</span>
                          <span>•</span>
                          <span>JPEG</span>
                          <span>•</span>
                          <span>MAX 10MB</span>
                        </div>
                      </div>
                    ) : (
                      /* Preview Box */
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-950/20 max-h-[360px] flex items-center justify-center p-4">
                        <img
                          src={previewUrl}
                          alt="Specimen preview"
                          className="max-w-full max-h-[320px] rounded-xl object-contain shadow-glass"
                          onError={() => {
                            setOriginalImageFailed(true);
                            setImageInspection((current) => ({ ...current, readable: false, width: null, height: null }));
                          }}
                        />
                        <button
                          onClick={removeFile}
                          aria-label="Remove selected image"
                          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-900/80 hover:bg-red-500 text-white flex items-center justify-center transition cursor-pointer"
                        >
                          <X size={16} aria-hidden="true" />
                        </button>
                      </div>
                    )}

                    {previewUrl && <ImageInputChecks inspection={imageInspection} />}
                  </div>

                  {previewUrl && (
                    <div className="flex gap-4 mt-6">
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        icon={RefreshCw}
                        className="w-1/3"
                      >
                        Replace Image
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <Button
                        variant="primary"
                        onClick={startAnalysis}
                        icon={Play}
                        className="w-2/3"
                      >
                        Run AI Diagnostic Pipeline
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Instruction Card */}
            <div className="lg:col-span-1">
              <Card hoverable={false} className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200 dark:border-white/5 shadow-xl p-6 h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                    <Brain className="text-emerald-500" size={20} />
                    Pipeline Specifications
                  </h3>
                  <div className="space-y-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 flex-shrink-0">
                        1
                      </div>
                      <p>
                        <strong>YOLOv8 context model</strong> may return generic COCO objects. These are not crop-damage or lesion detections.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 flex-shrink-0">
                        2
                      </div>
                      <p>
                        <strong>EfficientNet classification model</strong> determines the precise crop disease class and health categorization.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 flex-shrink-0">
                        3
                      </div>
                      <p>
                        <strong>Grad-CAM engine</strong> exposes the model attention patterns, mapping neural network focus onto visual pixels.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 flex-shrink-0">
                        4
                      </div>
                      <p>
                        <strong>Recommendation rules</strong> provide reviewer triage only; they are not insurance underwriting decisions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-200/60 dark:border-white/5 pt-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    Authentication-protected analysis workflow
                  </span>
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {/* LOADING / PROCESSING VIEW */}
        {status === 'processing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-2xl mx-auto py-12"
          >
            <Card hoverable={false} className="bg-slate-900/80 border-emerald-500/25 p-8 text-center shadow-glass-glow relative overflow-hidden backdrop-blur-xl">

              {/* Agricultural scanner grid effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

              {/* Pulse scan ring */}
              <div className="relative mb-8 flex justify-center">
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.15, 0.35, 0.15]
                  }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className="absolute h-24 w-24 rounded-full bg-emerald-500/20 blur-xl"
                />
                <div className="relative h-20 w-20 rounded-full border border-emerald-500/30 bg-slate-950 flex items-center justify-center shadow-neon-emerald">
                  <Brain className="h-9 w-9 text-emerald-400 animate-pulse" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-white mb-2">
                Running Crop Intelligence Diagnostics...
              </h2>
              <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-8">
                Stage {currentStageIndex + 1} of {PIPELINE_STAGES.length}
              </p>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-950 rounded-full mb-8 overflow-hidden border border-white/5 relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  animate={{ width: `${((currentStageIndex + 1) / PIPELINE_STAGES.length) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
                {/* Scan line shine */}
                <motion.div
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />
              </div>

              {/* Step checklist */}
              <div className="space-y-3.5 max-w-md mx-auto text-left">
                {PIPELINE_STAGES.map((stage, idx) => {
                  const isCompleted = idx < currentStageIndex;
                  const isActive = idx === currentStageIndex;

                  return (
                    <div
                      key={stage.key}
                      className={`flex items-center gap-3 transition-opacity duration-300 ${isCompleted || isActive ? 'opacity-100' : 'opacity-35'}`}
                    >
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                            <CheckCircle size={12} className="stroke-[3]" />
                          </div>
                        ) : isActive ? (
                          <div className="h-5 w-5 rounded-full border border-emerald-500 flex items-center justify-center">
                            <motion.div
                              animate={{ scale: [0.7, 1.2, 0.7] }}
                              transition={{ repeat: Infinity, duration: 1.2 }}
                              className="h-2 w-2 rounded-full bg-emerald-400"
                            />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border border-white/10 flex items-center justify-center bg-slate-950" />
                        )}
                      </div>
                      <span className={`text-xs font-semibold ${isActive ? 'text-emerald-400 font-bold' : isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>

            </Card>
          </motion.div>
        )}

        {/* ERROR / FAILURE VIEW */}
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md mx-auto py-12"
          >
            <Card hoverable={false} className="bg-slate-900 border-red-500/30 p-8 text-center shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <div className="h-16 w-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-5 border border-red-500/25">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-lg font-bold text-white mb-3">
                Diagnostic Pipeline Interrupted
              </h2>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                {error || 'The model was unable to complete assessment verification due to a gateway or pipeline error.'}
              </p>
              <div className="flex gap-4">
                <Button variant="outline" onClick={removeFile} className="w-1/3">
                  Cancel
                </Button>
                <Button variant="primary" onClick={startAnalysis} className="w-2/3" icon={RefreshCw}>
                  Retry Diagnostic
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* SUCCESS / RESULTS VIEW */}
        {status === 'success' && predictionData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Top overview result card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* The paired images always use the uploaded file and the API-generated Grad-CAM asset. */}
              <div className="lg:col-span-2">
                <Card hoverable={false} className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200 dark:border-white/5 shadow-xl p-6">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <ImageIcon size={18} className="text-emerald-500" />
                    Explainable AI: Grad-CAM comparison
                  </h3>
                  <p className="mt-1 mb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    Grad-CAM highlights the image areas that influenced the model prediction. Compare your uploaded image with the classifier&apos;s generated Grad-CAM overlay.
                  </p>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {/* Original image block */}
                    <figure className="min-w-0">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Original uploaded image</h4>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">Input</span>
                      </div>
                      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-950/20 p-2 dark:border-white/10">
                        {previewUrl && !originalImageFailed ? (
                          <img
                            src={previewUrl}
                            alt="Original crop image submitted for classification"
                            className="h-full w-full rounded-lg object-contain"
                            onError={() => setOriginalImageFailed(true)}
                          />
                        ) : (
                          <div className="max-w-xs px-6 text-center" role="status">
                            <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-amber-500" aria-hidden="true" />
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Original image unavailable</p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">The uploaded preview could not be displayed in this browser.</p>
                          </div>
                        )}
                      </div>
                      <figcaption className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">The source image supplied to this assessment.</figcaption>
                    </figure>

                    {/* GradCAM image block */}
                    <figure className="min-w-0">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Classifier Grad-CAM overlay</h4>
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">Model output</span>
                      </div>
                      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-950/20 p-2 dark:border-white/10">
                        {predictionData.gradcam_image_path && (
                          <AuthorizedImage
                            src={getGradcamImageUrl(predictionData.gradcam_image_path)}
                            alt="Grad-CAM overlay showing image regions that influenced the classifier output"
                            className={`h-full w-full rounded-lg object-contain transition-opacity ${gradcamImageState === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                            unavailableText="Grad-CAM unavailable for this assessment"
                            onStateChange={setGradcamImageState}
                          />
                        )}
                        {gradcamImageState === 'loading' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center" role="status" aria-live="polite">
                            <RefreshCw className="mb-2 h-5 w-5 animate-spin text-emerald-500" aria-hidden="true" />
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Loading generated Grad-CAM…</p>
                          </div>
                        )}
                        {!predictionData.gradcam_image_path && (
                          <div className="max-w-xs px-6 text-center" role="status">
                            <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-amber-500" aria-hidden="true" />
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Grad-CAM unavailable</p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">The classifier did not provide a viewable Grad-CAM image for this assessment.</p>
                          </div>
                        )}
                      </div>
                      <figcaption className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">Generated by the backend classifier from this image—colour intensity represents relative influence on its predicted class.</figcaption>
                    </figure>
                  </div>

                  <p className="mt-5 rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-4 py-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    Grad-CAM is an explanation of the model&apos;s decision, not a diagnosis by itself. Use it to understand classifier attention alongside the confidence and assessment details.
                  </p>
                </Card>
              </div>

              {/* Assessment Stats card */}
              <div className="lg:col-span-1">
                <Card hoverable={false} className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200 dark:border-white/5 shadow-xl p-6 h-full flex flex-col justify-between">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
                        <Activity size={18} className="text-emerald-500" />
                        AI Analysis Payload
                      </h3>

                      {/* Diagnostic Class Pill */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 mb-4 text-center">
                        <span className="text-xs uppercase font-bold text-slate-400 block mb-1">
                          Detected Issue
                        </span>
                        <span className="text-lg font-black text-slate-800 dark:text-white block">
                          {predictionData.classification || 'Not available'}
                        </span>
                        {predictionData.category && (
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mt-1">
                            Category: {predictionData.category}
                          </span>
                        )}
                        <div className="flex items-center justify-center gap-1.5 mt-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs text-emerald-500 font-bold">
                            {formatPercent(predictionData.classification_confidence)} model confidence
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Severity & Physical Damage Indicator */}
                    <div className="flex items-center gap-6">
                      <div className="relative h-20 w-20 flex-shrink-0 flex items-center justify-center">
                        {/* Circular ring indicator */}
                        <svg className="absolute inset-0 h-20 w-20 -rotate-90">
                          <circle cx="40" cy="40" r="32" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="8" fill="none" />
                          <motion.circle
                            cx="40" cy="40" r="32"
                            stroke={
                              ['HIGH', 'SEVERE'].includes(String(predictionData.severity || '').toUpperCase())
                                ? '#ef4444'
                                : String(predictionData.severity || '').toUpperCase() === 'MODERATE'
                                ? '#f59e0b'
                                : '#10b981'
                            }
                            strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 32}
                            initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                            animate={{ strokeDashoffset: 0 }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            strokeLinecap="round"
                            fill="none"
                          />
                        </svg>
                        <span className={`text-[11px] font-black uppercase text-center px-1 leading-tight ${
                          ['HIGH', 'SEVERE'].includes(String(predictionData.severity || '').toUpperCase())
                            ? 'text-red-500'
                            : String(predictionData.severity || '').toUpperCase() === 'MODERATE'
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                        }`}>
                          {predictionData.severity || 'LOW'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs uppercase font-bold text-slate-400 block mb-0.5">
                          Domain-Informed Severity
                        </span>
                        <span className={`text-lg font-extrabold block uppercase tracking-wider ${
                          ['HIGH', 'SEVERE'].includes(String(predictionData.severity || '').toUpperCase())
                            ? 'text-red-500'
                            : String(predictionData.severity || '').toUpperCase() === 'MODERATE'
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                        }`}>
                          {predictionData.severity || 'Not available'}
                        </span>
                        <span className="text-xs text-slate-400 block mt-0.5">
                          Risk Level: <strong className={predictionData.risk_level === 'High' ? 'text-red-500' : predictionData.risk_level === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}>{predictionData.risk_level || 'Not available'}</strong>
                        </span>
                        <span className="text-xs text-slate-400 block mt-1">
                          Physical Damage: <strong className="text-slate-600 dark:text-slate-300">{formatDamage(predictionData.damage_percentage)}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Metadata detail grid */}
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-200/60 dark:border-white/5 pt-4 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Latency</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                          <Cpu size={12} className="text-emerald-500" />
                          {formatMilliseconds(predictionData.processing_time_ms)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Pipeline Status</span>
                        <span className="font-bold text-emerald-500 flex items-center gap-1">
                          <CheckCircle size={12} />
                          {predictionData.pipeline_status || 'Not available'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button variant="outline" onClick={removeFile} icon={RefreshCw}>
                      Scan Another Specimen
                    </Button>
                  </div>
                </Card>
              </div>

            </div>

            <Card hoverable={false} className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200 dark:border-white/5 shadow-xl p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Assessment details</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Severity represents domain-informed agronomic threat level, not physical damaged area. Physical damage percentage is not measured by the current model.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3 md:min-w-[58%]">
                  <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-slate-950/30 p-3">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Assessed</span>
                    <span className="mt-1 block font-semibold text-slate-700 dark:text-slate-200">{formatTimestamp(predictionData.timestamp)}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-slate-950/30 p-3">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Upload ID</span>
                    <span className="mt-1 block font-semibold text-slate-700 dark:text-slate-200">{predictionData.upload_id ?? 'Not available'}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-slate-950/30 p-3">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Preprocessing</span>
                    <span className="mt-1 block font-semibold text-slate-700 dark:text-slate-200">{predictionData.preprocessing_status || 'Not available'}</span>
                  </div>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                <strong className="text-amber-700 dark:text-amber-300">Object Context:</strong>{' '}
                YOLOv8 may detect general objects. These results are not direct crop-damage or lesion measurements.
              </div>
            </Card>

            <InsuranceClaimReport prediction={predictionData} />

            <ClaimEvidenceChecklist prediction={predictionData} claim={claimLookup.claim} imageInspection={imageInspection} gradcamState={gradcamImageState} />

            <ClaimTimeline prediction={predictionData} claim={claimLookup.claim} imageInspection={imageInspection} gradcamState={gradcamImageState} />

            <DiseaseTreatmentGuidance prediction={predictionData} />

            <ConfidenceAndImageQuality confidence={predictionData.classification_confidence} />

            <ClaimStatusPanel lookup={claimLookup} recommendation={predictionData.insurance_recommendation} prediction={predictionData} />

            <FinancialStatusSettlement claim={claimLookup.claim} lookupState={claimLookup.state} prediction={predictionData} />

            {/* Insurance Decision / Underwriting Recommendations */}
            <Card hoverable={false} className="bg-gradient-to-r from-slate-900/90 to-slate-950/90 border border-emerald-500/20 shadow-neon-emerald/10 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <ShieldCheck size={14} />
                    </div>
                    <span className="text-xs tracking-widest text-emerald-400 font-extrabold">
                      Insurance Recommendation
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-white">
                    {predictionData.insurance_recommendation || 'Not available'}
                  </h4>

                  {predictionData.recommendation_reason && (
                    <p className="text-xs font-semibold text-emerald-400">
                      Reason: {predictionData.recommendation_reason}
                    </p>
                  )}

                  <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                    These rules provide review guidance only. They do not make final insurance decisions.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/50 border border-white/5 text-center flex-shrink-0 min-w-[160px]">
                  <span className="text-xs uppercase font-bold text-slate-500 block mb-1">
                    Consistency Flag
                  </span>
                  <span className={`text-xl font-black block ${predictionData.fraud_risk > 0.4 ? 'text-red-500' : 'text-emerald-500'
                    }`}>
                    {formatPercent(predictionData.fraud_risk)}
                  </span>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mt-1">
                    {typeof predictionData.fraud_risk !== 'number'
                      ? 'Not available'
                      : predictionData.fraud_risk > 0.4 ? 'Verification Required' : 'No Rule Conflict'}
                  </span>
                </div>
              </div>
            </Card>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
