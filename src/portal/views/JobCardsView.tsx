import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { JobCard } from '../types/portalTypes';
import { 
  AlertTriangle, 
  Plus, 
  Printer, 
  FileText, 
  CheckCircle2, 
  Layers, 
  Send 
} from 'lucide-react';
import { JobCardModal } from '../components/JobCardModal';

export const JobCardsView: React.FC = () => {
  const { jobCards, updateJobCardSprayed, defects, activePlant } = usePortalStore();
  const [selectedJobCardForProgress, setSelectedJobCardForProgress] = useState<JobCard | null>(null);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [addedSprayed, setAddedSprayed] = useState<number>(50);
  const [addedReject, setAddedReject] = useState<number>(2);
  const [selectedDefectCategory, setSelectedDefectCategory] = useState<string>('D02');

  // Job Card Create/View Modal State
  const [showJobCardModal, setShowJobCardModal] = useState<boolean>(false);
  const [selectedJobCardForView, setSelectedJobCardForView] = useState<JobCard | null>(null);

  const handleOpenBatchModal = (jc: JobCard) => {
    setSelectedJobCardForProgress(jc);
    setShowBatchModal(true);
  };

  const handleCloseBatchModal = () => {
    setShowBatchModal(false);
    setSelectedJobCardForProgress(null);
  };

  const handleProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobCardForProgress) return;
    updateJobCardSprayed(selectedJobCardForProgress.jobCardNo, addedSprayed, addedReject, selectedDefectCategory);
    handleCloseBatchModal();
  };

  const handleCreateNewJobCard = () => {
    setSelectedJobCardForView(null);
    setShowJobCardModal(true);
  };

  const handleViewJobCard = (jc: JobCard) => {
    setSelectedJobCardForView(jc);
    setShowJobCardModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-PRD-JCR-001 • PRODUCTION FLOOR DISPATCHER
            </span>
            <span className="text-xs text-[#777b86]">
              Job Card Cubic Paint Frame (Doc No: 001) & Material Issue Details
            </span>
          </div>
          <h1 className="text-3xl font-serif font-normal text-[#17191c] tracking-tight">
            Job Cards & Material Issue Management
          </h1>
          <p className="text-xs text-[#777b86] mt-1">
            Tracks initial process, issued materials (substance, paints, thinners), 3-stage process counts & target caps.
          </p>
        </div>

        <button
          onClick={handleCreateNewJobCard}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-semibold shadow-sm transition cursor-pointer w-full md:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Job Card & Issue Material (Doc No: 001)</span>
        </button>
      </div>

      {/* Target Cap Guardrail Explainer */}
      <div className="bg-[#faf3e0]/60 border border-[#f4e5be] rounded-[24px] p-5 text-xs text-[#8a6521] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-white text-[#c09748] shadow-sm">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-[#17191c]">Shop Floor Rule: Target Cap & Material Issue Traceability</div>
            <div className="text-[#777b86] mt-0.5 leading-relaxed">
              Every Job Card defines exact raw substrates, basecoat paints, thinners, and lacquer issued by Store Manager. 
              Operators spray up to the exact target cap to prevent paint over-run waste.
            </div>
          </div>
        </div>
      </div>

      {/* Active Job Cards Grid (Exact Image 1 Schema) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {jobCards.map(jc => {
          const isOverrun = jc.status === 'Over-Run Flagged';
          const isTargetMet = jc.status === 'Target Met';
          const progressPercent = Math.min(100, Math.round((jc.sprayedQty / jc.targetQty) * 100));

          return (
            <div
              key={jc.jobCardNo}
              className={`p-6 rounded-[24px] border transition shadow-sm space-y-4 ${
                isOverrun 
                  ? 'bg-[#faf3e0]/40 border-[#f4e5be]' 
                  : isTargetMet 
                  ? 'bg-emerald-50/30 border-emerald-200' 
                  : 'bg-white border-[#ececec]'
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 pb-3 border-b border-[#f2f2f3]">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#c09748] px-2.5 py-0.5 rounded-full bg-[#faf7ed] border border-[#f4e5be] whitespace-nowrap">
                      {jc.jobCardNo}
                    </span>
                    <span className="text-xs text-[#777b86] font-mono whitespace-nowrap">W.No: <strong>{jc.wNo || jc.woNo}</strong></span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-mono font-bold text-gray-700">
                      {jc.docNo || 'Doc No: 001'}
                    </span>
                  </div>
                  <h3 className="font-serif font-normal text-lg text-[#17191c]">{jc.customer}</h3>
                  <div className="text-xs text-[#777b86]">{jc.partDescription} • Dept: <strong className="text-[#17191c]">{jc.dept || 'Cubic Line'}</strong></div>
                </div>

                <div className="self-start sm:self-auto shrink-0">
                  {isOverrun ? (
                    <span className="px-3 py-1 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-xs font-bold animate-pulse whitespace-nowrap inline-block">
                      ⚠️ Over-Run Flagged
                    </span>
                  ) : isTargetMet ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold whitespace-nowrap inline-block">
                      ✓ Target Met
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-[#f2f2f3] text-[#17191c] text-xs font-medium whitespace-nowrap inline-block">
                      In Process
                    </span>
                  )}
                </div>
              </div>

              {/* INITIAL PROCESS SUMMARY */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-[11px]">
                <div>
                  <span className="text-[#777b86] block text-[10px] uppercase font-bold">Painter Name</span>
                  <strong className="text-[#17191c] font-semibold">{jc.painterName || 'Ramesh Sharma'}</strong>
                </div>
                <div>
                  <span className="text-[#777b86] block text-[10px] uppercase font-bold">Issue Date/Time</span>
                  <span className="font-mono text-[#17191c]">{jc.issueDate || '2026-09-12'} {jc.issueTime}</span>
                </div>
                <div>
                  <span className="text-[#777b86] block text-[10px] uppercase font-bold">Lead Time</span>
                  <span className="text-[#17191c]">{jc.leadTime || '4 Hours'}</span>
                </div>
                <div>
                  <span className="text-[#777b86] block text-[10px] uppercase font-bold">Checking Person</span>
                  <span className="text-emerald-800 font-semibold">{jc.checkingPerson || 'Amit Verma'}</span>
                </div>
              </div>

              {/* ISSUE MATERIAL DETAILS TABLE SUMMARY (Image 1 Middle Table) */}
              {jc.issuedMaterials && jc.issuedMaterials.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-[#777b86] uppercase tracking-wider block font-mono">
                    Issue Material Details (Store Released Items):
                  </span>
                  <div className="space-y-1 border border-[#ececec] rounded-[12px] p-2 bg-gray-50/50">
                    {jc.issuedMaterials.map((mat, idx) => (
                      <div key={mat.id || idx} className="flex items-center justify-between text-xs p-1 bg-white rounded border border-[#ececec]">
                        <span className="font-medium text-[#17191c] truncate max-w-[200px]" title={mat.itemDescription}>
                          {idx + 1}. {mat.itemDescription}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded bg-[#faf3e0] text-[#8a6521] text-[10px] font-bold">
                            {mat.colour}
                          </span>
                          <span className="font-mono font-bold text-[#17191c]">
                            {mat.qty} {mat.uom}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Shade & Target Cap Counter */}
              <div className="p-4 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-xs space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${jc.color.includes('Red') ? 'bg-red-500' : 'bg-[#17191c]'}`} />
                    <span className="font-semibold text-[#17191c] text-sm">{jc.color}</span>
                  </div>
                  <div className="font-mono text-xs whitespace-nowrap">
                    Target Cap: <strong className="text-base font-serif font-normal text-[#17191c]">{jc.targetQty} Pcs</strong>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#f2f2f3] rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${
                      isOverrun ? 'bg-[#c09748]' : isTargetMet ? 'bg-emerald-600' : 'bg-[#c09748]'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#777b86]">
                  <span className="whitespace-nowrap">Sprayed: <strong className="font-mono text-sm text-[#17191c]">{jc.sprayedQty}</strong> pcs</span>
                  <span className="whitespace-nowrap">Good: <strong className="text-emerald-800 font-mono">{jc.goodQty}</strong></span>
                  <span className="whitespace-nowrap">Rejection: <strong className="text-red-600 font-mono">{jc.rejectQty}</strong></span>
                </div>
              </div>

              {/* 3-STAGE PRODUCTION PROCESS SUMMARY (Image 1 Bottom Table) */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono border border-[#ececec] rounded-[12px] p-2 bg-[#fafafb]">
                <div className="border-r border-[#ececec]">
                  <div className="font-bold text-[#777b86] uppercase">1st (Base Coat)</div>
                  <div className="text-emerald-800 font-bold mt-0.5">{jc.stageProcessFirst?.okQty || jc.goodQty || 0} OK / {jc.stageProcessFirst?.totalQty || jc.targetQty}</div>
                </div>
                <div className="border-r border-[#ececec]">
                  <div className="font-bold text-[#777b86] uppercase">2nd (Dipping)</div>
                  <div className="text-emerald-800 font-bold mt-0.5">{jc.stageProcessSecond?.okQty || jc.goodQty || 0} OK / {jc.stageProcessSecond?.totalQty || jc.targetQty}</div>
                </div>
                <div>
                  <div className="font-bold text-[#777b86] uppercase">3rd (Lacquer)</div>
                  <div className="text-emerald-800 font-bold mt-0.5">{jc.stageProcessThird?.okQty || jc.goodQty || 0} OK / {jc.stageProcessThird?.totalQty || jc.targetQty}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#ececec]">
                <button
                  onClick={() => handleViewJobCard(jc)}
                  className="px-4 py-2 rounded-full border border-[#ececec] bg-white text-[#17191c] text-xs font-semibold hover:bg-gray-50 transition flex items-center gap-1.5 cursor-pointer w-full sm:w-auto"
                >
                  <Printer className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>View / Print Job Sheet (Doc No: 001)</span>
                </button>

                <button
                  onClick={() => handleOpenBatchModal(jc)}
                  className="px-5 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-bold transition shadow-sm cursor-pointer w-full sm:w-auto flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Log Shift Progress (+Qty)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal 1: Log Shift Progress */}
      {showBatchModal && selectedJobCardForProgress && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-4 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 text-xs max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-[#ececec]">
              <div>
                <h3 className="text-base font-serif font-normal text-[#17191c]">
                  Log Floor Shift Batch Progress
                </h3>
                <p className="text-[11px] text-[#777b86]">
                  Job Card: <strong className="font-mono text-[#c09748]">{selectedJobCardForProgress.jobCardNo}</strong>
                </p>
              </div>
              <button 
                onClick={handleCloseBatchModal} 
                className="font-bold text-[#979799] hover:text-[#17191c] cursor-pointer text-base"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-[#fafafb] rounded-[16px] border border-[#ececec] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#777b86]">Color Shade:</span>
                <strong className="text-[#17191c]">{selectedJobCardForProgress.color}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777b86]">Target Cap:</span>
                <strong className="text-[#17191c] font-mono">{selectedJobCardForProgress.targetQty} pcs</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777b86]">Currently Sprayed:</span>
                <strong className="text-[#17191c] font-mono">{selectedJobCardForProgress.sprayedQty} pcs</strong>
              </div>
            </div>

            <form onSubmit={handleProgressSubmit} className="space-y-3">
              <div>
                <label className="block text-[#777b86] font-medium mb-1">Additional Sprayed Pcs</label>
                <input
                  type="number"
                  value={addedSprayed}
                  onChange={e => setAddedSprayed(Math.max(0, Number(e.target.value)))}
                  className="w-full p-2.5 rounded-[16px] border border-[#ececec] font-serif text-lg font-normal text-[#17191c] focus:border-[#c09748] focus:outline-none"
                  min={0}
                  required
                />
              </div>

              <div>
                <label className="block text-[#777b86] font-medium mb-1">Shift Rejection Pcs</label>
                <input
                  type="number"
                  value={addedReject}
                  onChange={e => setAddedReject(Math.max(0, Number(e.target.value)))}
                  className="w-full p-2.5 rounded-[16px] border border-[#ececec] font-serif text-lg font-normal text-red-600 focus:border-red-400 focus:outline-none"
                  min={0}
                  required
                />
              </div>

              <div>
                <label className="block text-[#777b86] font-medium mb-1">
                  Defect Category (PK_Master Defect Library)
                </label>
                <select
                  value={selectedDefectCategory}
                  onChange={e => setSelectedDefectCategory(e.target.value)}
                  className="w-full p-2.5 rounded-[16px] border border-[#ececec] bg-white text-[#17191c] text-xs font-medium focus:border-[#c09748] focus:outline-none cursor-pointer"
                >
                  {defects.map(d => (
                    <option key={d.code} value={d.code}>
                      {d.code} - {d.name} ({d.severity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseBatchModal}
                  className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer hover:bg-[#fafafb] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] font-semibold shadow-sm cursor-pointer transition"
                >
                  Update Job Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create / View Full Excel Job Card (Doc No: 001) */}
      {showJobCardModal && (
        <JobCardModal
          isOpen={showJobCardModal}
          onClose={() => {
            setShowJobCardModal(false);
            setSelectedJobCardForView(null);
          }}
          initialData={selectedJobCardForView || undefined}
        />
      )}
    </div>
  );
};
