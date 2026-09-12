import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { CustodyHandover, ProductionStage } from '../types/portalTypes';
import { 
  ArrowRightLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Plus, 
  User, 
  ArrowRight,
  Check
} from 'lucide-react';

const STAGES: ProductionStage[] = [
  'Raw Stores',
  'Surface Prep & Jigging',
  'Base Coat Painting',
  'Hydrographic Dipping / UV',
  'Clear Lacquer / Top Coat',
  'Oven Curing & De-jigging',
  'Final QA & Packing'
];

export const CustodyHandoverView: React.FC = () => {
  const { 
    handovers, 
    sendHandover, 
    receiveHandover, 
    resolveHandoverDiscrepancy, 
    currentUser, 
    activePlant 
  } = usePortalStore();

  const [showSendModal, setShowSendModal] = useState<boolean>(false);
  const [selectedHandoverForReceive, setSelectedHandoverForReceive] = useState<CustodyHandover | null>(null);
  const [selectedHandoverForResolve, setSelectedHandoverForResolve] = useState<CustodyHandover | null>(null);

  // Send Form State
  const [sendForm, setSendForm] = useState({
    woNo: 'WO-1042',
    jobCardNo: 'JC-1042-RED',
    partCode: 'RP-8841',
    color: 'Monza Red Gloss',
    fromStage: 'Base Coat Painting' as ProductionStage,
    toStage: 'Hydrographic Dipping / UV' as ProductionStage,
    senderName: currentUser.name,
    senderQty: 300
  });

  // Receive Form State
  const [receiveForm, setReceiveForm] = useState({
    receiverName: currentUser.name,
    receiverQty: 300,
    discrepancyReason: 'Left in Drying/Oven Rack' as CustodyHandover['discrepancyReason'],
    discrepancyNote: ''
  });

  // Supervisor Resolve Form State
  const [resolveAction, setResolveAction] = useState('');

  const handleOpenReceive = (h: CustodyHandover) => {
    setSelectedHandoverForReceive(h);
    setReceiveForm({
      receiverName: currentUser.name,
      receiverQty: h.senderQty,
      discrepancyReason: 'Left in Drying/Oven Rack',
      discrepancyNote: ''
    });
  };

  const handleConfirmReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHandoverForReceive) return;

    receiveHandover(
      selectedHandoverForReceive.transferId,
      receiveForm.receiverName,
      Number(receiveForm.receiverQty),
      receiveForm.discrepancyReason,
      receiveForm.discrepancyNote
    );
    setSelectedHandoverForReceive(null);
  };

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendHandover(sendForm);
    setShowSendModal(false);
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHandoverForResolve) return;
    resolveHandoverDiscrepancy(selectedHandoverForResolve.transferId, resolveAction, currentUser.name);
    setSelectedHandoverForResolve(null);
    setResolveAction('');
  };

  return (
    <div className="space-y-6">
      {/* ISO Header Banner */}
      <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-PRD-TRF-001 • CUSTODY CONTROL
            </span>
            <span className="text-xs text-[#777b86]">
              Digital Chain-of-Custody & Inter-Stage Handover
            </span>
          </div>
          <h1 className="text-3xl font-serif font-normal text-[#17191c] tracking-tight">
            Inter-Stage Material Handover Ledger
          </h1>
          <p className="text-xs text-[#777b86] mt-1">
            Eliminates unaccounted loss between workstations • Mandatory two-way verification handshake
          </p>
        </div>

        <button
          onClick={() => setShowSendModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-semibold shadow-sm transition cursor-pointer w-full md:w-auto"
        >
          <Plus className="w-4 h-4 text-[#17191c]" />
          <span>Send Batch to Next Station</span>
        </button>
      </div>

      {/* Visual Station Sequence Pipeline */}
      <div className="bg-white rounded-[24px] p-5 border border-[#ececec] shadow-sm overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-bold text-[#777b86] uppercase tracking-[0.16em]">
            Manufacturing Stage Handover Sequence
          </div>
          <span className="text-[11px] text-[#a3a6af] font-medium sm:hidden">
            Swipe →
          </span>
        </div>
        <div className="flex items-center gap-1.5 min-w-[780px]">
          {STAGES.map((stage, idx) => (
            <React.Fragment key={stage}>
              <div className="flex-1 p-3 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-center hover:border-[#c09748] transition">
                <div className="text-[10px] font-mono text-[#c09748] font-bold">Stage {idx + 1}</div>
                <div className="text-xs font-medium text-[#17191c] truncate mt-0.5">{stage}</div>
              </div>
              {idx < STAGES.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-[#a3a6af] shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Active Handover Records */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#777b86]">
            Active Handovers & Station Transcripts ({handovers.length})
          </h3>
          <span className="text-xs text-[#c09748] font-mono font-medium">
            Plant: {activePlant}
          </span>
        </div>

        <div className="space-y-3">
          {handovers.map((h) => {
            const hasDiscrepancy = h.status === 'Discrepancy Halt';
            const isMatch = h.status === 'Accepted (Match)';
            const isPending = h.status === 'Pending Receipt';
            const isResolved = h.status === 'Supervisor Resolved';

            return (
              <div
                key={h.transferId}
                className={`p-5 rounded-[24px] border transition shadow-sm ${
                  hasDiscrepancy 
                    ? 'bg-[#fff9f9] border-red-300' 
                    : isResolved
                    ? 'bg-[#faf3e0]/40 border-[#f4e5be]'
                    : isMatch 
                    ? 'bg-white border-[#ececec]' 
                    : 'bg-white border-[#ececec]'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-[#f2f2f3]">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="font-mono text-xs font-bold text-[#c09748] whitespace-nowrap">
                      {h.transferId}
                    </span>
                    <span className="text-xs text-[#a3a6af] shrink-0">•</span>
                    <span className="text-xs font-semibold text-[#17191c] whitespace-nowrap">{h.woNo}</span>
                    <span className="text-xs text-[#777b86] font-mono whitespace-nowrap">({h.jobCardNo})</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#f2f2f3] text-[#17191c] text-[10px] font-medium whitespace-nowrap shrink-0">
                      {h.color}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
                    <span className="text-xs text-[#777b86] flex items-center gap-1 font-mono shrink-0">
                      <Clock className="w-3.5 h-3.5 text-[#a3a6af]" />
                      {h.date} {h.time}
                    </span>

                    {hasDiscrepancy && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold animate-pulse whitespace-nowrap shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Discrepancy Halt ({Math.abs(h.discrepancyQty || 0)} Pcs {(h.discrepancyQty || 0) < 0 ? 'Excess' : 'Missing'})
                      </span>
                    )}

                    {isMatch && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold whitespace-nowrap shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Verified (100% Match)
                      </span>
                    )}

                    {isPending && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-xs font-semibold whitespace-nowrap shrink-0">
                        <Clock className="w-3.5 h-3.5 text-[#c09748]" />
                        Awaiting Receiver Count
                      </span>
                    )}

                    {isResolved && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-xs font-semibold whitespace-nowrap shrink-0">
                        <Check className="w-3.5 h-3.5 text-[#8a6521]" />
                        Supervisor Resolved
                      </span>
                    )}
                  </div>
                </div>

                {/* Sender vs Receiver Comparison Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3.5">
                  {/* Sender Side */}
                  <div className="p-4 rounded-[16px] bg-[#fafafb] border border-[#ececec]">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[#777b86] font-medium flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#c09748]" /> Sender Station:
                      </span>
                      <span className="font-semibold text-[#17191c]">{h.fromStage}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#777b86]">{h.senderName}</span>
                      <span className="font-serif text-xl font-normal text-[#17191c]">
                        {h.senderQty} pcs sent
                      </span>
                    </div>
                  </div>

                  {/* Receiver Side */}
                  <div className={`p-4 rounded-[16px] border ${
                    hasDiscrepancy 
                      ? 'bg-red-50/70 border-red-300' 
                      : isMatch 
                      ? 'bg-emerald-50/40 border-emerald-200' 
                      : 'bg-[#fafafb] border-[#ececec]'
                  }`}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[#777b86] font-medium flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#c09748]" /> Receiver Station:
                      </span>
                      <span className="font-semibold text-[#17191c]">{h.toStage}</span>
                    </div>
                    
                    {h.receiverName ? (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#777b86]">{h.receiverName}</span>
                        <div className="text-right">
                          <span className={`font-serif text-xl font-normal ${
                            hasDiscrepancy ? 'text-red-700 font-bold' : 'text-emerald-700'
                          }`}>
                            {h.receiverQty} pcs counted
                          </span>
                          {h.discrepancyQty !== undefined && h.discrepancyQty !== 0 && (
                            <div className="text-[11px] font-bold text-red-600">
                              {h.discrepancyQty > 0 ? `Shortage: ${h.discrepancyQty} pcs` : `Excess: ${Math.abs(h.discrepancyQty)} pcs`}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                        <span className="text-xs text-[#777b86] font-medium">Pending tray verification</span>
                        <button
                          onClick={() => handleOpenReceive(h)}
                          className="w-full sm:w-auto text-center px-4 py-2 sm:py-1.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-semibold transition cursor-pointer shadow-sm"
                        >
                          Receive & Verify Count
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Discrepancy Breakdown & Supervisor Resolution Log */}
                {(hasDiscrepancy || isResolved) && (
                  <div className={`mt-3.5 p-4 border rounded-[16px] text-xs space-y-1.5 ${
                    isResolved ? 'bg-[#faf3e0]/60 border-[#f4e5be] text-[#8a6521]' : 'bg-red-100/50 border border-red-200 text-red-950'
                  }`}>
                    <div className={`font-bold flex items-center gap-1.5 ${isResolved ? 'text-[#8a6521]' : 'text-red-800'}`}>
                      <ShieldAlert className={`w-4 h-4 ${isResolved ? 'text-[#c09748]' : 'text-red-600'}`} />
                      Discrepancy Reason: {h.discrepancyReason || 'Floor Discrepancy'}
                    </div>
                    {h.discrepancyNote && (
                      <p className={isResolved ? 'text-[#777b86] leading-relaxed' : 'text-red-900 leading-relaxed'}>
                        {h.discrepancyNote}
                      </p>
                    )}
                    
                    {h.supervisorAction ? (
                      <div className="pt-2 border-t border-[#f4e5be] font-medium text-[#17191c] space-y-0.5">
                        <div>
                          <strong className="text-[#8a6521]">Supervisor Resolution:</strong> {h.supervisorAction}
                        </div>
                        <div className="text-[11px] text-[#777b86]">
                          Approved by: <strong className="text-[#17191c]">{h.supervisorApprovedBy || 'Supervisor'}</strong>
                          {h.resolvedAt && <span> • Resolved on {h.resolvedAt}</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => setSelectedHandoverForResolve(h)}
                          className="px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition cursor-pointer"
                        >
                          Supervisor Review & Sign-Off
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Send Batch */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
              <h3 className="text-base font-serif font-normal text-[#17191c]">
                Initiate Inter-Stage Batch Handover
              </h3>
              <button 
                onClick={() => setShowSendModal(false)}
                className="text-[#979799] hover:text-[#17191c] text-base font-bold cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Work Order</label>
                  <input
                    type="text"
                    value={sendForm.woNo}
                    onChange={e => setSendForm({ ...sendForm, woNo: e.target.value })}
                    className="w-full p-2.5 rounded-[16px] border border-[#ececec] font-mono text-[#17191c] focus:border-[#c09748] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Job Card</label>
                  <input
                    type="text"
                    value={sendForm.jobCardNo}
                    onChange={e => setSendForm({ ...sendForm, jobCardNo: e.target.value })}
                    className="w-full p-2.5 rounded-[16px] border border-[#ececec] font-mono text-[#17191c] focus:border-[#c09748] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Part Description</label>
                  <input
                    type="text"
                    value={sendForm.partCode}
                    onChange={e => setSendForm({ ...sendForm, partCode: e.target.value })}
                    className="w-full p-2.5 rounded-[16px] border border-[#ececec] text-[#17191c] focus:border-[#c09748] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Color Shade</label>
                  <input
                    type="text"
                    value={sendForm.color}
                    onChange={e => setSendForm({ ...sendForm, color: e.target.value })}
                    className="w-full p-2.5 rounded-[16px] border border-[#ececec] text-[#17191c] focus:border-[#c09748] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">From Station (Sender)</label>
                  <select
                    value={sendForm.fromStage}
                    onChange={e => setSendForm({ ...sendForm, fromStage: e.target.value as ProductionStage })}
                    className="w-full p-2.5 rounded-[16px] border border-[#ececec] bg-white text-[#17191c] focus:border-[#c09748] focus:outline-none cursor-pointer"
                  >
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">To Station (Receiver)</label>
                  <select
                    value={sendForm.toStage}
                    onChange={e => setSendForm({ ...sendForm, toStage: e.target.value as ProductionStage })}
                    className="w-full p-2.5 rounded-[16px] border border-[#ececec] bg-white text-[#17191c] focus:border-[#c09748] focus:outline-none cursor-pointer"
                  >
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Sender Name</label>
                  <input
                    type="text"
                    value={sendForm.senderName}
                    onChange={e => setSendForm({ ...sendForm, senderName: e.target.value })}
                    className="w-full p-2.5 rounded-[16px] border border-[#ececec] text-[#17191c] focus:border-[#c09748] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#777b86] font-medium mb-1">Dispatched Quantity (Pcs)</label>
                  <input
                    type="number"
                    value={sendForm.senderQty}
                    onChange={e => setSendForm({ ...sendForm, senderQty: Math.max(1, Number(e.target.value)) })}
                    className="w-full p-2.5 rounded-[16px] border border-[#ececec] font-serif font-normal text-base text-[#17191c] focus:border-[#c09748] focus:outline-none"
                    min={1}
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="px-5 py-2 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer hover:bg-[#fafafb] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#c09748] text-[#17191c] font-semibold shadow-sm hover:bg-[#a97e35] cursor-pointer transition"
                >
                  Confirm & Dispatch Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Receive & Verify Count */}
      {selectedHandoverForReceive && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
              <div>
                <h3 className="text-base font-serif font-normal text-[#17191c]">
                  Physical Count Verification Handshake
                </h3>
                <p className="text-xs text-[#777b86]">
                  {selectedHandoverForReceive.fromStage} ➔ {selectedHandoverForReceive.toStage}
                </p>
              </div>
              <button 
                onClick={() => setSelectedHandoverForReceive(null)}
                className="text-[#979799] hover:text-[#17191c] text-base font-bold cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-[#fafafb] border border-[#ececec] rounded-[16px] text-xs flex justify-between items-center">
              <div>
                <span className="text-[#777b86] font-medium">Dispatched by Sender:</span>
                <div className="font-semibold text-[#17191c]">{selectedHandoverForReceive.senderName}</div>
              </div>
              <div className="text-right">
                <span className="text-[#777b86] font-medium">Sender Claimed:</span>
                <div className="text-xl font-serif font-normal text-[#17191c]">
                  {selectedHandoverForReceive.senderQty} Pcs
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmReceive} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#777b86] font-medium mb-1">Receiver Name</label>
                <input
                  type="text"
                  value={receiveForm.receiverName}
                  onChange={e => setReceiveForm({ ...receiveForm, receiverName: e.target.value })}
                  className="w-full p-2.5 rounded-[16px] border border-[#ececec] text-[#17191c] focus:border-[#c09748] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[#777b86] font-medium mb-1">
                  Physically Counted Quantity in Tray / Trolley
                </label>
                <input
                  type="number"
                  value={receiveForm.receiverQty}
                  onChange={e => setReceiveForm({ ...receiveForm, receiverQty: Math.max(0, Number(e.target.value)) })}
                  className="w-full p-3 rounded-[16px] border-2 border-[#c09748] font-serif text-xl font-normal text-[#17191c] focus:outline-none"
                  min={0}
                  required
                />
              </div>

              {/* Show Discrepancy Warning if count does not match */}
              {Number(receiveForm.receiverQty) !== selectedHandoverForReceive.senderQty && (
                <div className="p-4 bg-red-50/70 border border-red-300 rounded-[16px] space-y-2.5">
                  <div className="flex items-center gap-1.5 text-red-700 font-bold">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>
                      Count Mismatch: {selectedHandoverForReceive.senderQty - Number(receiveForm.receiverQty) > 0
                        ? `${selectedHandoverForReceive.senderQty - Number(receiveForm.receiverQty)} Pieces Shortage`
                        : `${Number(receiveForm.receiverQty) - selectedHandoverForReceive.senderQty} Pieces Excess`}!
                    </span>
                  </div>
                  <div>
                    <label className="block text-red-900 font-medium mb-1">
                      Mandatory Discrepancy Categorization:
                    </label>
                    <select
                      value={receiveForm.discrepancyReason}
                      onChange={e => setReceiveForm({ ...receiveForm, discrepancyReason: e.target.value as CustodyHandover['discrepancyReason'] })}
                      className="w-full p-2.5 rounded-[12px] border border-red-300 bg-white text-xs font-medium cursor-pointer"
                    >
                      <option value="Left in Drying/Oven Rack">Left in Drying/Oven Rack</option>
                      <option value="Dropped / In-Transit Damage">Dropped / In-Transit Breakage</option>
                      <option value="Booth Scrap">Booth Scrap (Not Reported)</option>
                      <option value="Unaccounted Loss">Unaccounted Floor Loss</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-red-900 font-medium mb-1">Floor Investigation Note</label>
                    <textarea
                      value={receiveForm.discrepancyNote}
                      onChange={e => setReceiveForm({ ...receiveForm, discrepancyNote: e.target.value })}
                      placeholder="e.g. 15 found stuck on upper rack, 10 dropped, 5 missing..."
                      className="w-full p-2.5 rounded-[12px] border border-red-300 bg-white text-xs focus:outline-none"
                      rows={2}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedHandoverForReceive(null)}
                  className="px-5 py-2 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer hover:bg-[#fafafb] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2 rounded-full font-semibold text-white transition cursor-pointer ${
                    Number(receiveForm.receiverQty) !== selectedHandoverForReceive.senderQty
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  {Number(receiveForm.receiverQty) !== selectedHandoverForReceive.senderQty
                    ? 'Submit Discrepancy Halt'
                    : 'Confirm 100% Match'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Supervisor Resolve */}
      {selectedHandoverForResolve && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
              <h3 className="text-base font-serif font-normal text-[#17191c]">
                Supervisor Floor Loss Sign-Off
              </h3>
              <button 
                onClick={() => setSelectedHandoverForResolve(null)}
                className="text-[#979799] hover:text-[#17191c] text-base font-bold cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-[#777b86]">
              Transfer ID: <strong className="text-[#17191c] font-mono">{selectedHandoverForResolve.transferId}</strong> • 
              Discrepancy: <strong className="text-red-600 font-bold">{Math.abs(selectedHandoverForResolve.discrepancyQty || 0)} Pcs {(selectedHandoverForResolve.discrepancyQty || 0) < 0 ? 'Excess' : 'Missing'}</strong>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#777b86] font-medium mb-1">
                  Supervisor Corrective Action & Penalty Allocation
                </label>
                <textarea
                  value={resolveAction}
                  onChange={e => setResolveAction(e.target.value)}
                  placeholder="e.g. 15 pieces retrieved from oven rack. 10 scrap logged to Booth #2. 5 pieces shrinkage penalty assigned."
                  className="w-full p-3 rounded-[16px] border border-[#ececec] text-[#17191c] focus:border-[#c09748] focus:outline-none"
                  rows={3}
                  required
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedHandoverForResolve(null)}
                  className="px-5 py-2 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer hover:bg-[#fafafb] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#c09748] text-[#17191c] font-semibold shadow-sm hover:bg-[#a97e35] cursor-pointer transition"
                >
                  Authorize Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
