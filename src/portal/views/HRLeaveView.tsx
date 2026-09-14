import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { HRLeaveRecord } from '../types/portalTypes';
import { 
  UserCheck, 
  Plus, 
  Printer, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  FileText, 
  Building2, 
  Check, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const HRLeaveView: React.FC = () => {
  const { hrLeaves, addHRLeave, approveHRLeave, currentUser, activePlant } = usePortalStore();

  const [selectedLeaveId, setSelectedLeaveId] = useState<string>(
    hrLeaves[0]?.id || 'LV-2026-044'
  );
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  const selectedLeave = hrLeaves.find(l => l.id === selectedLeaveId) || hrLeaves[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-[#17191c] via-[#212529] to-[#17191c] rounded-[24px] p-6 sm:p-8 text-white border border-[#30333a] shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c09748]/20 border border-[#c09748]/40 text-[#f4e5be] text-xs font-semibold uppercase tracking-wider mb-3">
              <UserCheck className="w-3.5 h-3.5 text-[#c09748]" />
              HR Administration • Leave Application Format (Appendix A.12)
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-normal tracking-tight text-white">
              Employee Leave Application & Multi-tier Sanction
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              1-to-1 digital representation of PaintKing's official Leave Application Form (PK-HR-LV-01) with multi-tier workflow (Employee &rarr; Dept Incharge &rarr; HR &rarr; MD / Gurprit Sir).
            </p>
          </div>

          <button
            onClick={() => setShowApplyModal(true)}
            className="px-5 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] font-semibold text-xs transition flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Apply for Leave
          </button>
        </div>
      </div>

      {/* Applications List Bar */}
      <div className="bg-white rounded-[24px] p-4 border border-slate-200 shadow-xs flex items-center gap-3 overflow-x-auto no-scrollbar">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-2">
          Leave Slips:
        </span>
        {hrLeaves.map((lv) => {
          const isSelected = lv.id === selectedLeave?.id;
          return (
            <button
              key={lv.id}
              onClick={() => setSelectedLeaveId(lv.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition cursor-pointer border ${
                isSelected
                  ? 'bg-[#17191c] text-white border-[#17191c] shadow-sm'
                  : 'bg-[#fafafb] text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="font-mono font-bold">{lv.id}</span>
              <span>{lv.employeeName}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                lv.finalStatus === 'Sanctioned' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : lv.finalStatus === 'Rejected'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-[#faf3e0] text-[#8a6521]'
              }`}>
                {lv.finalStatus}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detailed Leave Document View (Format Appendix A.12) */}
      {selectedLeave && (
        <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg text-slate-900">{selectedLeave.id}</span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521]">
                  {selectedLeave.docNo}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  selectedLeave.finalStatus === 'Sanctioned' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedLeave.finalStatus}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Applicant: <strong className="text-slate-900">{selectedLeave.employeeName}</strong> ({selectedLeave.employeeId}) • Applied on: {selectedLeave.employeeSignatureDate}
              </div>
            </div>

            <button
              onClick={() => setShowPrintModal(true)}
              className="px-4 py-2 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Leave Slip
            </button>
          </div>

          {/* Form Fields Grid 1-to-1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div className="p-4 rounded-[16px] bg-[#fafafb] border border-slate-200 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Employee Information (कर्मचारी विवरण)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400">Employee Name:</span>
                    <div className="font-semibold text-slate-900 mt-0.5">{selectedLeave.employeeName}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Father's Name:</span>
                    <div className="font-semibold text-slate-900 mt-0.5">{selectedLeave.fatherName}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Department:</span>
                    <div className="font-semibold text-slate-900 mt-0.5">{selectedLeave.department}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Designation:</span>
                    <div className="font-semibold text-slate-900 mt-0.5">{selectedLeave.designation}</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-[16px] bg-[#fafafb] border border-slate-200 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Addresses (पते)
                </div>
                <div>
                  <span className="text-slate-400">Current Residential Address:</span>
                  <div className="font-medium text-slate-800 mt-0.5">{selectedLeave.currentAddress}</div>
                </div>
                <div>
                  <span className="text-slate-400">Permanent Native Address:</span>
                  <div className="font-medium text-slate-800 mt-0.5">{selectedLeave.permanentAddress}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-[16px] bg-[#fafafb] border border-slate-200 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  3. Leave Schedule & Reason (छुट्टी का कारण एवं अवधि)
                </div>
                <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-[12px] border border-slate-200">
                  <div>
                    <span className="text-slate-400">Leave From:</span>
                    <div className="font-mono font-bold text-slate-900 mt-0.5">{selectedLeave.leaveFromDate}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Leave To:</span>
                    <div className="font-mono font-bold text-slate-900 mt-0.5">{selectedLeave.leaveToDate}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Days:</span>
                    <div className="font-mono font-bold text-[#c09748] text-base mt-0.5">{selectedLeave.totalDays} Days</div>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Reason for Leave (छुट्टी का कारण):</span>
                  <div className="font-medium text-slate-800 mt-0.5 bg-white p-3 rounded-[12px] border border-slate-200 leading-relaxed">
                    {selectedLeave.reasonForLeave}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-tier Approval Chain (Format Appendix A.12) */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">
              Multi-Tier Digital Leave Sanction Chain
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Stage 1: Department Incharge */}
              <div className="p-4 rounded-[16px] bg-[#fafafb] border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">1. Dept Incharge</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    selectedLeave.deptInchargeStatus === 'Recommended' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedLeave.deptInchargeStatus}
                  </span>
                </div>
                <div className="font-serif text-base font-medium text-slate-900">{selectedLeave.deptInchargeName || 'Pending'}</div>
                <p className="text-[11px] text-slate-500">{selectedLeave.deptInchargeRemarks || 'Shift arrangement'}</p>
                {selectedLeave.deptInchargeStatus === 'Pending' && (
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => approveHRLeave(selectedLeave.id, 'Dept Incharge', 'Approved', 'Recommended. Shift covered.', currentUser.name)}
                      className="flex-1 py-1.5 rounded-full bg-emerald-600 text-white font-medium text-[11px] cursor-pointer"
                    >
                      Recommend
                    </button>
                    <button
                      onClick={() => approveHRLeave(selectedLeave.id, 'Dept Incharge', 'Rejected', 'High shift load.', currentUser.name)}
                      className="px-3 py-1.5 rounded-full border border-slate-300 text-slate-700 text-[11px] cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Stage 2: HR Admin */}
              <div className="p-4 rounded-[16px] bg-[#fafafb] border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">2. HR Administration</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    selectedLeave.hrStatus === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedLeave.hrStatus}
                  </span>
                </div>
                <div className="font-serif text-base font-medium text-slate-900">{selectedLeave.hrName || 'Pending'}</div>
                <p className="text-[11px] text-slate-500">{selectedLeave.hrRemarks || 'Leave balance verification'}</p>
                {selectedLeave.hrStatus === 'Pending' && (
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => approveHRLeave(selectedLeave.id, 'HR', 'Approved', 'Leave balance verified: 8 days available.', currentUser.name)}
                      className="flex-1 py-1.5 rounded-full bg-[#c09748] text-[#17191c] font-semibold text-[11px] cursor-pointer"
                    >
                      Verify Balance
                    </button>
                  </div>
                )}
              </div>

              {/* Stage 3: MD Sanction */}
              <div className="p-4 rounded-[16px] bg-[#faf3e0] border border-[#f4e5be] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#8a6521] uppercase tracking-wider">3. MD Sanction</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    selectedLeave.mdStatus === 'Sanctioned' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedLeave.mdStatus}
                  </span>
                </div>
                <div className="font-serif text-base font-medium text-[#17191c]">{selectedLeave.mdName || 'Pending'}</div>
                <p className="text-[11px] text-[#8a6521]">{selectedLeave.mdSignDate || 'Executive Director / Plant Head sign'}</p>
                {selectedLeave.mdStatus === 'Pending' && (
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => approveHRLeave(selectedLeave.id, 'MD', 'Approved', 'Sanctioned.', currentUser.name)}
                      className="flex-1 py-1.5 rounded-full bg-[#17191c] text-[#f4e5be] font-semibold text-[11px] cursor-pointer"
                    >
                      Sanction Leave
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Apply for Leave */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-lg font-serif text-slate-900">Leave Application Form (PK-HR-LV-01)</h3>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const newLv: HRLeaveRecord = {
                    id: `LV-2026-${Math.floor(100 + Math.random() * 900)}`,
                    docNo: 'PK-HR-LV-01',
                    employeeId: (form.elements.namedItem('empId') as HTMLInputElement).value,
                    employeeName: (form.elements.namedItem('empName') as HTMLInputElement).value,
                    fatherName: (form.elements.namedItem('fatherName') as HTMLInputElement).value,
                    department: (form.elements.namedItem('dept') as HTMLInputElement).value,
                    designation: (form.elements.namedItem('designation') as HTMLInputElement).value,
                    currentAddress: (form.elements.namedItem('currAddr') as HTMLInputElement).value,
                    permanentAddress: (form.elements.namedItem('permAddr') as HTMLInputElement).value,
                    reasonForLeave: (form.elements.namedItem('reason') as HTMLTextAreaElement).value,
                    leaveFromDate: (form.elements.namedItem('fromDate') as HTMLInputElement).value,
                    leaveToDate: (form.elements.namedItem('toDate') as HTMLInputElement).value,
                    totalDays: Number((form.elements.namedItem('totalDays') as HTMLInputElement).value),
                    employeeSignatureDate: new Date().toISOString().split('T')[0],

                    deptInchargeStatus: 'Pending',
                    hrStatus: 'Pending',
                    mdStatus: 'Pending',
                    finalStatus: 'Submitted'
                  };

                  addHRLeave(newLv);
                  setSelectedLeaveId(newLv.id);
                  setShowApplyModal(false);
                }}
                className="space-y-3 text-xs"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">Employee Name:</label>
                    <input name="empName" defaultValue={currentUser.name} required className="w-full p-2.5 rounded-[12px] border border-slate-300" />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">Employee / Worker ID:</label>
                    <input name="empId" defaultValue="PK-EMP-042" required className="w-full p-2.5 rounded-[12px] border border-slate-300 font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">Father's Name:</label>
                    <input name="fatherName" required placeholder="Father's full name" className="w-full p-2.5 rounded-[12px] border border-slate-300" />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">Department:</label>
                    <input name="dept" defaultValue="Production / Booth" required className="w-full p-2.5 rounded-[12px] border border-slate-300" />
                  </div>
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Designation:</label>
                  <input name="designation" defaultValue={currentUser.roleTitle} required className="w-full p-2.5 rounded-[12px] border border-slate-300" />
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Current Residential Address:</label>
                  <input name="currAddr" required placeholder="Current local room/house address" className="w-full p-2.5 rounded-[12px] border border-slate-300" />
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Permanent Native Address:</label>
                  <input name="permAddr" required placeholder="Permanent village / town address" className="w-full p-2.5 rounded-[12px] border border-slate-300" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">From Date:</label>
                    <input type="date" name="fromDate" required className="w-full p-2 rounded-[12px] border border-slate-300" />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">To Date:</label>
                    <input type="date" name="toDate" required className="w-full p-2 rounded-[12px] border border-slate-300" />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">Total Days:</label>
                    <input type="number" name="totalDays" min="1" defaultValue="3" required className="w-full p-2 rounded-[12px] border border-slate-300 font-mono" />
                  </div>
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Reason for Leave (छुट्टी का कारण):</label>
                  <textarea name="reason" rows={2} required placeholder="Detailed reason for leave request..." className="w-full p-2.5 rounded-[12px] border border-slate-300" />
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="px-4 py-2 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] font-semibold cursor-pointer"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Printable Leave Format */}
      <AnimatePresence>
        {showPrintModal && selectedLeave && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] max-w-2xl w-full p-8 space-y-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar print:p-0 print:border-none print:shadow-none"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
                <span className="font-serif font-medium text-slate-800 text-lg">
                  Leave Application Format (PK-HR-LV-01)
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-full bg-[#c09748] text-[#17191c] font-semibold text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Printable Format */}
              <div className="border-2 border-slate-800 p-6 space-y-5 text-xs text-slate-900 font-sans">
                <div className="text-center border-b-2 border-slate-800 pb-3">
                  <div className="text-2xl font-serif font-bold">PAINTKING SURFACE SOLUTIONS</div>
                  <div className="font-semibold text-xs mt-0.5 uppercase tracking-wider">
                    LEAVE APPLICATION FORM / अवकाश आवेदन पत्र (PK-HR-LV-01)
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div><strong>Application No:</strong> {selectedLeave.id}</div>
                  <div className="text-right"><strong>Date:</strong> {selectedLeave.employeeSignatureDate}</div>
                </div>

                <div className="space-y-2 border border-slate-300 p-4 rounded-lg bg-slate-50">
                  <div><strong>1. Employee Name:</strong> {selectedLeave.employeeName} ({selectedLeave.employeeId})</div>
                  <div><strong>2. Father's Name:</strong> {selectedLeave.fatherName}</div>
                  <div><strong>3. Department / Designation:</strong> {selectedLeave.department} / {selectedLeave.designation}</div>
                  <div><strong>4. Current Address:</strong> {selectedLeave.currentAddress}</div>
                  <div><strong>5. Permanent Address:</strong> {selectedLeave.permanentAddress}</div>
                  <div><strong>6. Reason:</strong> {selectedLeave.reasonForLeave}</div>
                  <div><strong>7. Leave Period:</strong> {selectedLeave.leaveFromDate} to {selectedLeave.leaveToDate} ({selectedLeave.totalDays} Days)</div>
                </div>

                {/* Approvals */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t-2 border-slate-800 text-center">
                  <div className="border border-slate-300 p-3 rounded-lg">
                    <div className="text-slate-400 mb-6">Dept Incharge</div>
                    <div className="font-bold">{selectedLeave.deptInchargeName || 'Pending'}</div>
                    <div className="text-[10px] text-emerald-700 font-semibold">{selectedLeave.deptInchargeStatus}</div>
                  </div>
                  <div className="border border-slate-300 p-3 rounded-lg">
                    <div className="text-slate-400 mb-6">HR Admin</div>
                    <div className="font-bold">{selectedLeave.hrName || 'Pending'}</div>
                    <div className="text-[10px] text-emerald-700 font-semibold">{selectedLeave.hrStatus}</div>
                  </div>
                  <div className="border border-slate-300 p-3 rounded-lg bg-[#faf3e0]/50">
                    <div className="text-[#8a6521] mb-6">Director / MD</div>
                    <div className="font-bold text-[#17191c]">{selectedLeave.mdName || 'Pending'}</div>
                    <div className="text-[10px] text-[#8a6521] font-semibold">{selectedLeave.mdStatus}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
