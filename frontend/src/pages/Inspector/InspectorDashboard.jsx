import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useRole from '../../hooks/useRole';
import {
  Shield,
  Check,
  X,
  Eye,
  FileText,
  TrendingUp,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Brain,
  MessageSquare,
} from 'lucide-react';
import InspectorLayout from '../../layouts/InspectorLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/ui/Badge';

// Initial Mock Claims Dataset for Inspector Portal
const initialInspectorClaims = [
  { id: 'CLM-0194', farmer: 'Rajesh Patel', crop: 'Rice', disease: 'Bacterial Blight', severity: 78, requested: 25000, status: 'PENDING', aiRecommendation: 'Approve 80% Payout', gradcamPath: null },
  { id: 'CLM-0195', farmer: 'Amit Sharma', crop: 'Wheat', disease: 'Leaf Rust', severity: 42, requested: 12000, status: 'PENDING', aiRecommendation: 'Partial Payout Approved', gradcamPath: null },
  { id: 'CLM-0196', farmer: 'Kiran Devi', crop: 'Corn', disease: 'Common Rust', severity: 15, requested: 4500, status: 'APPROVED', aiRecommendation: 'Low Severity - Minor Coverage', gradcamPath: null },
  { id: 'CLM-0197', farmer: 'Suresh Kumar', crop: 'Potato', disease: 'Late Blight', severity: 92, requested: 45000, status: 'PENDING', aiRecommendation: 'Full Payout Recommended', gradcamPath: null },
  { id: 'CLM-0198', farmer: 'Ramesh Singh', crop: 'Tomato', disease: 'Early Blight', severity: 65, requested: 18500, status: 'PENDING', aiRecommendation: 'Approve Standard Claim', gradcamPath: null },
  { id: 'CLM-0199', farmer: 'Pooja Verma', crop: 'Potato', disease: 'Early Blight', severity: 30, requested: 8000, status: 'APPROVED', aiRecommendation: 'Partial Payout Approved', gradcamPath: null },
  { id: 'CLM-0200', farmer: 'Sunil Yadav', crop: 'Corn', disease: 'Healthy Corn', severity: 0, requested: 10000, status: 'REJECTED', aiRecommendation: 'No Damage Detected - Reject', gradcamPath: null },
  { id: 'CLM-0201', farmer: 'Anita Roy', crop: 'Tomato', disease: 'Septoria Leaf Spot', severity: 55, requested: 16000, status: 'PENDING', aiRecommendation: 'Approve 60% Payout', gradcamPath: null },
  { id: 'CLM-0202', farmer: 'Vikram Joshi', crop: 'Wheat', disease: 'Bacterial Spot', severity: 70, requested: 28000, status: 'PENDING', aiRecommendation: 'Approve Claim', gradcamPath: null },
  { id: 'CLM-0203', farmer: 'Meena Kumari', crop: 'Rice', disease: 'Blast Disease', severity: 88, requested: 36000, status: 'PENDING', aiRecommendation: 'High Severity - Full Payout', gradcamPath: null },
  { id: 'CLM-0204', farmer: 'Deepak Gupta', crop: 'Potato', disease: 'Late Blight', severity: 82, requested: 40000, status: 'PENDING', aiRecommendation: 'Full Payout Recommended', gradcamPath: null },
  { id: 'CLM-0205', farmer: 'Geeta Rani', crop: 'Tomato', disease: 'Target Spot', severity: 38, requested: 9500, status: 'APPROVED', aiRecommendation: 'Partial Payout Approved', gradcamPath: null },
  { id: 'CLM-0206', farmer: 'Harish Chandra', crop: 'Corn', disease: 'Gray Leaf Spot', severity: 48, requested: 14000, status: 'PENDING', aiRecommendation: 'Approve Standard Claim', gradcamPath: null },
  { id: 'CLM-0207', farmer: 'Sanjay Dutt', crop: 'Wheat', disease: 'Healthy Wheat', severity: 2, requested: 5000, status: 'REJECTED', aiRecommendation: 'No Damage - Reject Claim', gradcamPath: null },
  { id: 'CLM-0208', farmer: 'Priya Nair', crop: 'Rice', disease: 'Sheath Blight', severity: 60, requested: 22000, status: 'PENDING', aiRecommendation: 'Approve 65% Payout', gradcamPath: null },
  { id: 'CLM-0209', farmer: 'Manoj Bajpayee', crop: 'Tomato', disease: 'Yellow Leaf Curl', severity: 75, requested: 30000, status: 'PENDING', aiRecommendation: 'Approve Claim', gradcamPath: null },
  { id: 'CLM-0210', farmer: 'Kavita Rao', crop: 'Potato', disease: 'Black Scurf', severity: 25, requested: 7000, status: 'APPROVED', aiRecommendation: 'Minor Payout Approved', gradcamPath: null },
  { id: 'CLM-0211', farmer: 'Nitin Gadkari', crop: 'Corn', disease: 'Common Rust', severity: 50, requested: 15000, status: 'PENDING', aiRecommendation: 'Approve Standard Claim', gradcamPath: null },
  { id: 'CLM-0212', farmer: 'Aarti Mishra', crop: 'Rice', disease: 'Bacterial Blight', severity: 85, requested: 32000, status: 'PENDING', aiRecommendation: 'Full Payout Recommended', gradcamPath: null },
  { id: 'CLM-0213', farmer: 'Vijay Verma', crop: 'Wheat', disease: 'Leaf Rust', severity: 12, requested: 3000, status: 'REJECTED', aiRecommendation: 'Negligible Damage - Reject', gradcamPath: null },
];

export default function InspectorDashboard({ initialTab }) {
  const { roleUser } = useRole();
  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromPath = () => {
    if (initialTab) return initialTab;
    const path = location.pathname;
    if (path.includes('/pending')) return 'pending';
    if (path.includes('/approved')) return 'approved';
    if (path.includes('/rejected')) return 'rejected';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/profile')) return 'profile';
    return 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState(getTabFromPath);

  useEffect(() => {
    setActiveTabState(getTabFromPath());
  }, [location.pathname, initialTab]);

  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    setCurrentPage(1);
    if (tabId === 'dashboard') navigate('/inspector/dashboard');
    else if (tabId === 'pending') navigate('/inspector/pending');
    else if (tabId === 'approved') navigate('/inspector/approved');
    else if (tabId === 'rejected') navigate('/inspector/rejected');
    else if (tabId === 'reports') navigate('/inspector/reports');
    else if (tabId === 'profile') navigate('/inspector/profile');
  };

  const [claims, setClaims] = useState(initialInspectorClaims);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  
  // Dynamic Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filter claims based on activeTab
  const filteredClaims = useMemo(() => {
    if (activeTab === 'pending') {
      return claims.filter((c) => c.status === 'PENDING');
    }
    if (activeTab === 'approved') {
      return claims.filter((c) => c.status === 'APPROVED');
    }
    if (activeTab === 'rejected') {
      return claims.filter((c) => c.status === 'REJECTED');
    }
    return claims;
  }, [claims, activeTab]);

  const totalItems = filteredClaims.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedClaims = filteredClaims.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDecision = (claimId, newStatus) => {
    setClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: newStatus, remarks: actionNotes } : c))
    );
    if (selectedClaim && selectedClaim.id === claimId) {
      setSelectedClaim((prev) => ({ ...prev, status: newStatus, remarks: actionNotes }));
    }
    setActionNotes('');
    alert(`Claim ${claimId} marked as ${newStatus}!`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="warning">Pending Review</Badge>;
    }
  };

  return (
    <InspectorLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="space-y-8 p-1">
        
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-400 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
              Inspector Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Review AI recommendation payloads, inspect Grad-CAM saliency heatmaps, and adjudicate insurance claim payouts.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 px-4 py-2.5 rounded-xl">
            <Shield className="text-emerald-500 dark:text-emerald-400" size={18} />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Inspector Clearance Active
            </span>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 border border-slate-200/60 dark:border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Pending Reviews</span>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                <AlertTriangle size={16} />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-800 dark:text-white mt-2">
              {claims.filter((c) => c.status === 'PENDING').length}
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 border border-slate-200/60 dark:border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Approved Claims</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Check size={16} />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-800 dark:text-white mt-2">
              {claims.filter((c) => c.status === 'APPROVED').length}
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 border border-slate-200/60 dark:border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Total Underwritten Value</span>
              <div className="h-8 w-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-500">
                <TrendingUp size={16} />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-800 dark:text-white mt-2">
              ₹{claims.filter((c) => c.status === 'APPROVED').reduce((sum, c) => sum + c.requested, 0).toLocaleString()}
            </p>
          </Card>
        </div>

        {/* CLAIMS TABLE & REVIEW PANEL */}
        {activeTab !== 'reports' && activeTab !== 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Claims Table List */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <FileText size={18} className="text-slate-400" />
                    Claims Directory ({activeTab.toUpperCase()})
                  </h2>
                  <span className="text-xs font-medium text-slate-400">
                    Showing {totalItems > 0 ? startIndex + 1 : 0}–{endIndex} of {totalItems} claims
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/5 text-slate-400 uppercase font-bold tracking-wider">
                        <th className="pb-3">Claim ID</th>
                        <th className="pb-3">Farmer</th>
                        <th className="pb-3">Crop</th>
                        <th className="pb-3">Severity</th>
                        <th className="pb-3">AI Recommendation</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {paginatedClaims.map((claim) => (
                        <tr key={claim.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                          <td className="py-4 font-bold text-slate-800 dark:text-slate-200">{claim.id}</td>
                          <td className="py-4 font-medium">{claim.farmer}</td>
                          <td className="py-4">
                            <span className="font-semibold">{claim.crop}</span>
                            <span className="block text-[10px] text-slate-400">{claim.disease}</span>
                          </td>
                          <td className="py-4 font-bold text-amber-500">{claim.severity}%</td>
                          <td className="py-4 text-[11px] text-slate-400">{claim.aiRecommendation}</td>
                          <td className="py-4">{getStatusBadge(claim.status)}</td>
                          <td className="py-4 text-right">
                            <Button
                              variant="outline"
                              onClick={() => setSelectedClaim(claim)}
                              className="px-2.5 py-1 text-xs inline-flex items-center gap-1"
                            >
                              <Eye size={14} /> Review
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {paginatedClaims.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No claims found in this category.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* DYNAMIC PAGINATION CONTROLS */}
                <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-white/5 pt-4 mt-4 text-xs font-semibold text-slate-400">
                  <span>
                    Showing {totalItems > 0 ? startIndex + 1 : 0}–{endIndex} of {totalItems} claims
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                      Previous
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`h-8 w-8 rounded-lg font-bold transition ${
                          currentPage === pageNum
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                            : 'border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

              </Card>
            </div>

            {/* CLAIM REVIEW PANEL */}
            <div className="lg:col-span-1">
              {selectedClaim ? (
                <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 sticky top-6 space-y-6">
                  
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-4">
                    <div>
                      <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-base">{selectedClaim.id}</h3>
                      <p className="text-[10px] text-slate-400">Claim Review & AI Diagnostics</p>
                    </div>
                    {getStatusBadge(selectedClaim.status)}
                  </div>

                  {/* Uploaded Image & Grad-CAM Visual Inspection Box */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Uploaded Specimen & Grad-CAM Heatmap
                    </span>
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-950/60 min-h-[160px] flex items-center justify-center p-3 text-center">
                      <div className="relative z-10 space-y-2">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto animate-pulse">
                          <Brain size={20} />
                        </div>
                        <p className="text-xs font-bold text-white font-mono">{selectedClaim.crop} ({selectedClaim.disease})</p>
                        <p className="text-[10px] text-emerald-400 font-mono">XAI Attention Heatmap Active</p>
                      </div>
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:16px_16px]" />
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                      <span className="text-slate-400">Farmer:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedClaim.farmer}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                      <span className="text-slate-400">AI Detection Result:</span>
                      <span className="font-bold text-red-500">{selectedClaim.disease}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                      <span className="text-slate-400">Damage Severity %:</span>
                      <span className="font-bold text-amber-500">{selectedClaim.severity}%</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                      <span className="text-slate-400">AI Recommendation:</span>
                      <span className="font-bold text-emerald-500">{selectedClaim.aiRecommendation}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                      <span className="text-slate-400">Requested Payout Amount:</span>
                      <span className="font-extrabold text-emerald-500">₹{selectedClaim.requested.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Action Remarks & Buttons */}
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                        <MessageSquare size={12} /> Inspector Remarks
                      </label>
                      <textarea
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        placeholder="Add payout justification or rejection reasons..."
                        className="w-full h-20 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/50 p-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="danger"
                        onClick={() => handleDecision(selectedClaim.id, 'REJECTED')}
                        className="flex items-center justify-center gap-1.5 py-2.5 text-xs"
                      >
                        <X size={14} /> Reject Claim
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleDecision(selectedClaim.id, 'APPROVED')}
                        className="flex items-center justify-center gap-1.5 py-2.5 text-xs"
                      >
                        <Check size={14} /> Approve Claim
                      </Button>
                    </div>
                  </div>

                </Card>
              ) : (
                <Card className="bg-white/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/5 p-8 text-center text-slate-400 dark:text-slate-500">
                  <Shield size={24} className="mx-auto mb-3 opacity-60 text-emerald-500" />
                  <p className="text-xs">Select a claim from the table to inspect damage records, view Grad-CAM overlay, and submit decision.</p>
                </Card>
              )}
            </div>

          </div>
        )}

        {/* REPORTS VIEW */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-400 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
              Underwriting Diagnostic Reports
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Access past agricultural inspection audits, disease severity distributions, and Grad-CAM log history.
            </p>
            <Card className="text-center p-8 text-slate-400">
              Diagnostic reports fully synchronized with MySQL logs.
            </Card>
          </div>
        )}

        {/* PROFILE VIEW */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-2xl">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-400 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
              Inspector Profile Settings
            </h1>
            <Card className="space-y-4 p-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl">
                  {roleUser?.full_name ? roleUser.full_name.substring(0, 2).toUpperCase() : 'IP'}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                    {roleUser?.full_name || 'Inspector Clearance User'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {roleUser?.email || 'Official Underwriter Account'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

      </div>
    </InspectorLayout>
  );
}
