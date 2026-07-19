import { useState } from 'react';
import { Shield, Check, X, Eye, FileText, User, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/ui/Badge';

export default function InspectorDashboard() {
  const [claims, setClaims] = useState([
    { id: 'CLM-0194', farmer: 'Rajesh Patel', crop: 'Rice', disease: 'Bacterial Blight', severity: '78%', requested: 25000, status: 'PENDING' },
    { id: 'CLM-0195', farmer: 'Amit Sharma', crop: 'Wheat', disease: 'Leaf Rust', severity: '42%', requested: 12000, status: 'PENDING' },
    { id: 'CLM-0196', farmer: 'Kiran Devi', crop: 'Corn', disease: 'Common Rust', severity: '15%', requested: 4500, status: 'APPROVED' },
    { id: 'CLM-0197', farmer: 'Suresh Kumar', crop: 'Potato', disease: 'Late Blight', severity: '92%', requested: 45000, status: 'PENDING' }
  ]);

  const [selectedClaim, setSelectedClaim] = useState(null);
  const [actionNotes, setActionNotes] = useState('');

  const handleAction = (claimId, action) => {
    setClaims(prevClaims =>
      prevClaims.map(claim =>
        claim.id === claimId ? { ...claim, status: action } : claim
      )
    );
    if (selectedClaim && selectedClaim.id === claimId) {
      setSelectedClaim(prev => ({ ...prev, status: action }));
    }
    setActionNotes('');
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
    <div className="space-y-8 p-1">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-400 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
            Claims Underwriting Cockpit
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Review AI recommendation payloads, assess damage severities, and adjudicate insurance payouts.
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
            {claims.filter(c => c.status === 'PENDING').length}
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Approved Adjudications</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Check size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white mt-2">
            {claims.filter(c => c.status === 'APPROVED').length}
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
            ₹{claims.filter(c => c.status === 'APPROVED').reduce((sum, c) => sum + c.requested, 0).toLocaleString()}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Claims Table List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-slate-400" />
              Incoming Claims Queue
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/5 text-slate-400 uppercase font-bold tracking-wider">
                    <th className="pb-3">Claim ID</th>
                    <th className="pb-3">Farmer</th>
                    <th className="pb-3">Crop / Issue</th>
                    <th className="pb-3">Severity</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {claims.map((claim) => (
                    <tr key={claim.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 font-bold text-slate-800 dark:text-slate-200">{claim.id}</td>
                      <td className="py-4">{claim.farmer}</td>
                      <td className="py-4">
                        <span className="font-semibold">{claim.crop}</span>
                        <span className="block text-[10px] text-slate-400">{claim.disease}</span>
                      </td>
                      <td className="py-4 font-semibold text-amber-500">{claim.severity}</td>
                      <td className="py-4">{getStatusBadge(claim.status)}</td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => setSelectedClaim(claim)}
                          className="p-1.5 text-slate-400 hover:text-emerald-500 transition-colors"
                          title="View Assessment Details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Claim Review Details Sidebar */}
        <div className="lg:col-span-1">
          {selectedClaim ? (
            <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 sticky top-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-200">{selectedClaim.id}</h3>
                  <p className="text-[10px] text-slate-400">Claim Details & AI recommendation</p>
                </div>
                {getStatusBadge(selectedClaim.status)}
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <User size={13} /> Farmer:
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedClaim.farmer}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                  <span className="text-slate-400">Crop Type:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedClaim.crop}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                  <span className="text-slate-400">AI Diagnosed Issue:</span>
                  <span className="font-semibold text-red-500">{selectedClaim.disease}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                  <span className="text-slate-400">AI Severity Rating:</span>
                  <span className="font-semibold text-amber-500">{selectedClaim.severity}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                  <span className="text-slate-400">Requested Claim Amount:</span>
                  <span className="font-extrabold text-emerald-500">₹{selectedClaim.requested.toLocaleString()}</span>
                </div>
              </div>

              {selectedClaim.status === 'PENDING' && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Decision Notes / Overrides</label>
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
                      onClick={() => handleAction(selectedClaim.id, 'REJECTED')}
                      className="flex items-center justify-center gap-1.5 py-2 text-xs"
                    >
                      <X size={14} /> Reject
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleAction(selectedClaim.id, 'APPROVED')}
                      className="flex items-center justify-center gap-1.5 py-2 text-xs"
                    >
                      <Check size={14} /> Approve
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="bg-white/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/5 p-8 text-center text-slate-400 dark:text-slate-500">
              <Shield size={24} className="mx-auto mb-3 opacity-60" />
              <p className="text-xs">Select a claim from the queue to inspect damage records and perform adjudication.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
