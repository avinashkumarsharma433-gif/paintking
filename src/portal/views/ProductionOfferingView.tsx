import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { ProductionOfferingReport, ProductionOfferingLineItem } from '../types/portalTypes';
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Printer, 
  FileText, 
  ShieldCheck, 
  UserCheck, 
  AlertCircle, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ProductionOfferingView: React.FC = () => {
  const { 
    productionOfferings, 
    addProductionOffering, 
    signProductionOffering, 
    jobCards, 
    activePlant, 
    activeShift, 
    currentUser 
  } = usePortalStore();

  const [selectedReportId, setSelectedReportId] = useState<string>(
    productionOfferings[0]?.id || 'PRD-OFF-2026-089'
  );
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  const selectedReport = productionOfferings.find(r => r.id === selectedReportId) || productionOfferings[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-[#17191c] via-[#212529] to-[#17191c] rounded-[24px] p-6 sm:p-8 text-white border border-[#30333a] shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c09748]/20 border border-[#c09748]/40 text-[#f4e5be] text-xs font-semibold uppercase tracking-wider mb-3">
              <ClipboardList className="w-3.5 h-3.5 text-[#c09748]" />
              Production Offering Format • Doc No: PK-PRD-OFF-01
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-normal tracking-tight text-white">
              Daily Production Offering & QA Handover
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              1-to-1 digital representation of PaintKing's official paper format (Appendix A.11). Features a 4-tier sign-off chain (Floor Incharge &rarr; Supervisor &rarr; QA &rarr; Plant Head).
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] font-semibold text-xs transition flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <Plus className="w-4 h-4" />
            New Shift Offering
          </button>
        </div>
      </div>

      {/* Reports Navigation Bar */}
      <div className="bg-white rounded-[24px] p-4 border border-slate-200 shadow-xs flex items-center gap-3 overflow-x-auto no-scrollbar">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-2">
          Offering Reports:
        </span>
        {productionOfferings.map((rep) => {
          const isSelected = rep.id === selectedReport?.id;
          return (
            <button
              key={rep.id}
              onClick={() => setSelectedReportId(rep.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition cursor-pointer border ${
                isSelected
                  ? 'bg-[#17191c] text-white border-[#17191c] shadow-sm'
                  : 'bg-[#fafafb] text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="font-mono font-bold">{rep.id}</span>
              <span className="text-[11px] text-slate-400">({rep.date})</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                rep.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-[#faf3e0] text-[#8a6521]'
              }`}>
                {rep.status}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Offering Sheet View */}
      {selectedReport && (
        <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg text-slate-900">{selectedReport.id}</span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521]">
                  {selectedReport.docNo}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  {selectedReport.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                <span>Date: <strong>{selectedReport.date}</strong></span>
                <span>•</span>
                <span>Shift: <strong>{selectedReport.shift}</strong></span>
                <span>•</span>
                <span>Plant: <strong>{selectedReport.plant}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPrintModal(true)}
                className="px-4 py-2 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Format
              </button>
            </div>
          </div>

          {/* Line Items Table (1-to-1 with Format A.11) */}
          <div className="overflow-x-auto rounded-[16px] border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#17191c] text-white">
                <tr>
                  <th className="p-3">Job Card #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Part Description</th>
                  <th className="p-3">Color</th>
                  <th className="p-3 text-right">Offered Qty</th>
                  <th className="p-3 text-right">QC Passed</th>
                  <th className="p-3 text-right">Rejection</th>
                  <th className="p-3 text-right">Rework</th>
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {selectedReport.lineItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{item.jobCardNo}</td>
                    <td className="p-3 font-medium text-slate-800">{item.customer}</td>
                    <td className="p-3 text-slate-700">{item.partDescription}</td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 font-medium text-slate-800">
                        {item.color}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">{item.offeredQty}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">{item.passedQty}</td>
                    <td className="p-3 text-right font-mono font-bold text-rose-700">{item.rejectionQty}</td>
                    <td className="p-3 text-right font-mono font-bold text-amber-700">{item.reworkQty}</td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">{item.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={4} className="p-3 uppercase tracking-wider text-[11px]">Total Roll-up:</td>
                  <td className="p-3 text-right font-mono">{selectedReport.totalOfferedQty}</td>
                  <td className="p-3 text-right font-mono text-emerald-700">{selectedReport.totalPassedQty}</td>
                  <td className="p-3 text-right font-mono text-rose-700">{selectedReport.totalRejectionQty}</td>
                  <td className="p-3 text-right font-mono text-amber-700">{selectedReport.totalReworkQty}</td>
                  <td className="p-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 4-Tier Sign-off Chain */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">
              4-Tier Digital Authorization Chain (Appendix A.11)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Step 1: Prepared by */}
              <div className="p-4 rounded-[16px] bg-[#fafafb] border border-slate-200 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">1. Floor Incharge</span>
                <div className="font-serif text-base font-medium text-slate-900">{selectedReport.preparedBy}</div>
                <div className="text-[11px] text-slate-500">{selectedReport.preparedDate || 'Pending'}</div>
                {!selectedReport.preparedDate && (
                  <button
                    onClick={() => signProductionOffering(selectedReport.id, 'Prepared', currentUser.name)}
                    className="w-full py-1.5 rounded-full bg-[#17191c] text-white font-medium text-[11px] cursor-pointer"
                  >
                    Sign as Floor Incharge
                  </button>
                )}
              </div>

              {/* Step 2: Checked by */}
              <div className="p-4 rounded-[16px] bg-[#fafafb] border border-slate-200 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">2. Prod. Supervisor</span>
                <div className="font-serif text-base font-medium text-slate-900">{selectedReport.checkedBy}</div>
                <div className="text-[11px] text-slate-500">{selectedReport.checkedDate || 'Pending'}</div>
                {!selectedReport.checkedDate && (
                  <button
                    onClick={() => signProductionOffering(selectedReport.id, 'Checked', currentUser.name)}
                    className="w-full py-1.5 rounded-full bg-[#17191c] text-white font-medium text-[11px] cursor-pointer"
                  >
                    Sign as Supervisor
                  </button>
                )}
              </div>

              {/* Step 3: QA Checked */}
              <div className="p-4 rounded-[16px] bg-[#fafafb] border border-slate-200 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">3. QA Inspector</span>
                <div className="font-serif text-base font-medium text-slate-900">{selectedReport.qaCheckedBy}</div>
                <div className="text-[11px] text-slate-500">{selectedReport.qaDate || 'Pending'}</div>
                {!selectedReport.qaDate && (
                  <button
                    onClick={() => signProductionOffering(selectedReport.id, 'QA', currentUser.name)}
                    className="w-full py-1.5 rounded-full bg-[#c09748] text-[#17191c] font-semibold text-[11px] cursor-pointer"
                  >
                    Sign as QA Inspector
                  </button>
                )}
              </div>

              {/* Step 4: Approved by */}
              <div className="p-4 rounded-[16px] bg-[#faf3e0] border border-[#f4e5be] space-y-2">
                <span className="text-[11px] font-semibold text-[#8a6521] uppercase tracking-wider">4. Plant Head / MD</span>
                <div className="font-serif text-base font-medium text-[#17191c]">{selectedReport.approvedBy}</div>
                <div className="text-[11px] text-[#8a6521]">{selectedReport.approvalDate || 'Pending'}</div>
                {!selectedReport.approvalDate && (
                  <button
                    onClick={() => signProductionOffering(selectedReport.id, 'Approved', currentUser.name)}
                    className="w-full py-1.5 rounded-full bg-[#17191c] text-[#f4e5be] font-semibold text-[11px] cursor-pointer"
                  >
                    Approve & Release
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create New Shift Offering Report */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] max-w-xl w-full p-6 space-y-4 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-lg font-serif text-slate-900">Create Production Offering Report</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const newOffering: ProductionOfferingReport = {
                    id: `PRD-OFF-2026-${Math.floor(100 + Math.random() * 900)}`,
                    docNo: 'PK-PRD-OFF-01',
                    date: new Date().toISOString().split('T')[0],
                    shift: activeShift,
                    plant: activePlant,
                    lineItems: jobCards.slice(0, 2).map(jc => ({
                      id: `off_${Math.random().toString(36).substring(7)}`,
                      jobCardNo: jc.jobCardNo,
                      customer: jc.customer,
                      partDescription: jc.partDescription,
                      color: jc.color,
                      offeredQty: jc.goodQty || 250,
                      passedQty: jc.goodQty || 250,
                      rejectionQty: jc.rejectQty || 4,
                      reworkQty: 2,
                      remarks: 'Shift completion offering'
                    })),
                    totalOfferedQty: 950,
                    totalPassedQty: 944,
                    totalRejectionQty: 6,
                    totalReworkQty: 2,
                    preparedBy: currentUser.name,
                    preparedDate: new Date().toLocaleString(),
                    checkedBy: 'Vikram Patel',
                    qaCheckedBy: 'Deepak Joshi',
                    approvedBy: 'Satish Sharma',
                    status: 'Offered to QA'
                  };

                  addProductionOffering(newOffering);
                  setSelectedReportId(newOffering.id);
                  setShowCreateModal(false);
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Plant Location:</label>
                  <input readOnly value={activePlant} className="w-full p-2.5 rounded-[12px] border border-slate-200 bg-slate-50 text-slate-600" />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Shift:</label>
                  <input readOnly value={activeShift} className="w-full p-2.5 rounded-[12px] border border-slate-200 bg-slate-50 text-slate-600" />
                </div>
                <p className="text-slate-500">
                  This action bundles completed shift Job Cards into a formal Offering Sheet and submits to QA Inspector.
                </p>
                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] font-semibold cursor-pointer"
                  >
                    Submit Offering to QA
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
