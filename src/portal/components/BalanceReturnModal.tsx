import React, { useState, useEffect, useMemo } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { 
  JobCard, 
  BalanceReturnCondition, 
  BalanceReturnLine, 
  BalanceReturnSlip,
  StockBatch 
} from '../types/portalTypes';
import { 
  X, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  CheckSquare, 
  Plus, 
  Trash2, 
  Boxes, 
  Flame, 
  Warehouse, 
  ArrowRight,
  Sparkles,
  Lock
} from 'lucide-react';

interface BalanceReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedJobCardNo?: string;
  onSuccess?: (rtnNo: string) => void;
}

interface ReturnLineFormItem {
  id: string;
  itemName: string;
  batchId: string;
  grnNo: string;
  supplierBatchNo?: string;
  category?: 'PARTY_MATERIAL' | 'COMPANY_CONSUMABLE';
  materialType?: string;
  uom: string;
  issuedQty: number;
  processedQty: number;
  returnedQtyClaimed: number;
  storeCountedQty: number;
  condition: BalanceReturnCondition;
  variance: number;
  remarks: string;
}

export const BalanceReturnModal: React.FC<BalanceReturnModalProps> = ({
  isOpen,
  onClose,
  preselectedJobCardNo,
  onSuccess
}) => {
  const { 
    jobCards, 
    stockBatches, 
    activePlant, 
    currentUser, 
    createBalanceReturnSlip, 
    acceptBalanceReturnSlip 
  } = usePortalStore();

  const [selectedJobCardNo, setSelectedJobCardNo] = useState<string>('');
  const [returnLines, setReturnLines] = useState<ReturnLineFormItem[]>([]);
  const [returnedBy, setReturnedBy] = useState<string>('');
  const [receivedByStore, setReceivedByStore] = useState<string>(currentUser?.name || 'Manoj Tiwari (Stores)');
  const [generalRemarks, setGeneralRemarks] = useState<string>('');
  const [supervisorDecision, setSupervisorDecision] = useState<string>('Restocked to active inventory with supervisor sign-off');
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Role validation: Store Incharge, Plant Head, Director
  const isAuthorized = useMemo(() => {
    const role = currentUser?.role;
    return role === 'STORES' || role === 'PLANT_HEAD' || role === 'DIRECTOR';
  }, [currentUser]);

  // Filter job cards for this plant
  const eligibleJobCards = useMemo(() => {
    return jobCards.filter(jc => !activePlant || !jc.plant || jc.plant.toLowerCase() === activePlant.toLowerCase());
  }, [jobCards, activePlant]);

  // Selected Job Card object
  const selectedJobCard = useMemo(() => {
    return eligibleJobCards.find(jc => jc.jobCardNo === selectedJobCardNo);
  }, [eligibleJobCards, selectedJobCardNo]);

  // Initialize selected job card when opened
  useEffect(() => {
    if (!isOpen) {
      setSelectedJobCardNo('');
      setReturnLines([]);
      setSubmissionError(null);
      return;
    }

    const targetJcNo = preselectedJobCardNo || eligibleJobCards[0]?.jobCardNo || '';
    setSelectedJobCardNo(targetJcNo);
    setReceivedByStore(currentUser?.name || 'Manoj Tiwari (Stores)');
  }, [isOpen, preselectedJobCardNo, eligibleJobCards, currentUser]);

  // When job card changes, build available return lines from its issued materials
  useEffect(() => {
    if (!selectedJobCard) {
      setReturnLines([]);
      setReturnedBy('');
      return;
    }

    setReturnedBy(selectedJobCard.assignedPainterName || selectedJobCard.painterName || 'Floor Painter');

    const lines: ReturnLineFormItem[] = (selectedJobCard.issuedMaterials || []).map((m, idx) => {
      // Find matching batch in stockBatches or extract from batchLines/grnNo
      const batchLine = m.batchLines?.[0];
      const foundBatch = stockBatches.find(b => 
        (batchLine && b.batchId === batchLine.batchId) || 
        (m.batchNo && (b.supplierBatchNo === m.batchNo || b.batchId === m.batchNo)) ||
        (m.grnNo && b.grnNo === m.grnNo) ||
        b.itemName.toLowerCase().includes(m.itemDescription.toLowerCase())
      );

      const batchId = batchLine?.batchId || foundBatch?.batchId || `SB-RETURN-${idx + 1}`;
      const supplierBatchNo = batchLine?.supplierBatchNo || foundBatch?.supplierBatchNo || m.batchNo || 'LOT-RETURN';
      const grnNo = batchLine?.grnNo || foundBatch?.grnNo || m.grnNo || 'PK-GRN-RETURN';
      const isChem = m.materialType === 'paint' || m.materialType === 'thinner' || /paint|basecoat|thinner/i.test(m.itemDescription);

      return {
        id: `rtn_line_${idx + 1}`,
        itemName: m.itemDescription,
        batchId,
        grnNo,
        supplierBatchNo,
        category: (m.category || (isChem ? 'COMPANY_CONSUMABLE' : 'PARTY_MATERIAL')) as any,
        materialType: m.materialType || (isChem ? 'paint' : 'substrate'),
        uom: m.uom || 'Pcs',
        issuedQty: Number(m.qty || 0),
        processedQty: Number(m.qty || 0), // Default assume processed until claimed
        returnedQtyClaimed: 0,
        storeCountedQty: 0,
        condition: 'Opened - Usable',
        variance: 0,
        remarks: ''
      };
    });

    setReturnLines(lines);
  }, [selectedJobCard, stockBatches]);

  // Update line field
  const handleUpdateLine = (id: string, field: keyof ReturnLineFormItem, val: any) => {
    setReturnLines(prev => prev.map(line => {
      if (line.id !== id) return line;

      const updated = { ...line, [field]: val };
      if (field === 'returnedQtyClaimed' || field === 'storeCountedQty') {
        const claimed = Number(field === 'returnedQtyClaimed' ? val : line.returnedQtyClaimed) || 0;
        const counted = Number(field === 'storeCountedQty' ? val : line.storeCountedQty) || 0;
        updated.variance = claimed - counted;
        updated.processedQty = Math.max(0, line.issuedQty - claimed);
      }
      return updated;
    }));
  };

  // Check if any line has returned quantity > 0
  const activeReturns = useMemo(() => {
    return returnLines.filter(l => l.returnedQtyClaimed > 0 || l.storeCountedQty > 0);
  }, [returnLines]);

  // Check for discrepancies
  const hasDiscrepancy = useMemo(() => {
    return activeReturns.some(l => l.variance !== 0);
  }, [activeReturns]);

  // Submit Handler
  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (!selectedJobCard) {
      setSubmissionError('Please select a valid Job Card.');
      return;
    }

    if (activeReturns.length === 0) {
      setSubmissionError('Please enter a returned quantity for at least one material line.');
      return;
    }

    if (!isAuthorized) {
      setSubmissionError('Access Denied: Only Store Incharge or Plant Head can accept material returns.');
      return;
    }

    // Create the slip
    const newSlip = createBalanceReturnSlip({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      plant: activePlant,
      jobCardNo: selectedJobCard.jobCardNo,
      mrnNo: selectedJobCard.linkedMrnNo || `MRN-FOR-${selectedJobCard.jobCardNo}`,
      minNo: selectedJobCard.linkedMinNo || `MIN-FOR-${selectedJobCard.jobCardNo}`,
      returnedBy,
      receivedByStore,
      lines: activeReturns.map(l => ({
        id: l.id,
        itemName: l.itemName,
        batchId: l.batchId,
        grnNo: l.grnNo,
        supplierBatchNo: l.supplierBatchNo,
        category: l.category,
        materialType: l.materialType,
        issuedQty: l.issuedQty,
        processedQty: l.processedQty,
        returnedQtyClaimed: l.returnedQtyClaimed,
        storeCountedQty: l.storeCountedQty,
        uom: l.uom,
        condition: l.condition,
        variance: l.variance,
        remarks: l.remarks
      })),
      remarks: generalRemarks.trim() || undefined
    });

    // Accept slip and restock eligible lines
    acceptBalanceReturnSlip(
      newSlip.rtnNo,
      activeReturns.map(l => ({
        lineId: l.id,
        storeCountedQty: l.storeCountedQty,
        condition: l.condition,
        remarks: l.remarks
      })),
      receivedByStore,
      hasDiscrepancy ? supervisorDecision : 'Full verified count match - Restocked'
    );

    if (onSuccess) {
      onSuccess(newSlip.rtnNo);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-[24px] max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 max-h-[94vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-150 relative">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#ececec] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#faf3e0] border border-[#f4e5be] flex items-center justify-center text-[#8a6521] shrink-0">
              <RotateCcw className="w-5 h-5 text-[#c09748]" />
            </div>
            <div>
              <h3 className="font-serif font-normal text-lg sm:text-xl text-[#17191c]">
                Return to Store (Unused Balance Restock &amp; Reconciliation)
              </h3>
              <p className="text-xs text-[#777b86] mt-0.5">
                Restocks verified usable materials directly into their origin batches. Scraps non-reusable paint.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#fafafb] hover:bg-[#f2f2f3] text-[#777b86] hover:text-[#17191c] border border-[#ececec] flex items-center justify-center cursor-pointer transition active:scale-95"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Read-only Alert if not stores */}
        {!isAuthorized && (
          <div className="p-3 rounded-[16px] bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Read-Only Mode:</strong> Only <strong>Store Incharge</strong> or <strong>Plant Head</strong> can accept and credit return slips.
            </span>
          </div>
        )}

        {/* Submission Error Banner */}
        {submissionError && (
          <div className="p-3 rounded-[16px] bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="font-medium">{submissionError}</div>
          </div>
        )}

        <form onSubmit={handleSubmitReturn} className="space-y-4">
          {/* ========================================================================= */}
          {/* STEP 1: JOB CARD & SOURCE HANDSHAKE META                                  */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-3">
            <div className="text-[11px] font-bold text-[#c09748] uppercase tracking-[0.16em] font-mono">
              Step 1: Origin Job Card &amp; Production Lot
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[10.5px] font-semibold text-[#777b86] uppercase font-mono">
                  Select Origin Job Card *
                </label>
                <select
                  value={selectedJobCardNo}
                  onChange={e => setSelectedJobCardNo(e.target.value)}
                  className="w-full h-10 px-3 rounded-[12px] border border-[#dcdfe4] text-xs font-mono font-bold text-[#17191c] bg-white focus:outline-none focus:border-[#c09748]"
                  required
                >
                  <option value="">-- Choose Job Card --</option>
                  {eligibleJobCards.map(jc => (
                    <option key={jc.jobCardNo} value={jc.jobCardNo}>
                      {jc.jobCardNo} ({jc.customer} | {jc.partCode} - {jc.color})
                    </option>
                  ))}
                </select>
              </div>

              {selectedJobCard && (
                <div className="p-2.5 rounded-[12px] bg-white border border-[#ececec] space-y-1 font-mono text-[11px]">
                  <div className="text-[#777b86]">
                    Customer: <strong className="text-[#17191c]">{selectedJobCard.customer}</strong>
                  </div>
                  <div className="text-[#777b86]">
                    Part: <strong className="text-[#17191c]">{selectedJobCard.partCode}</strong> ({selectedJobCard.color})
                  </div>
                  <div className="text-[#777b86]">
                    Painter: <strong className="text-[#17191c]">{selectedJobCard.assignedPainterName || selectedJobCard.painterName || 'N/A'}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* STEP 2: MATERIAL RETURN LINES TABLE                                       */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-[#c09748] uppercase tracking-[0.16em] font-mono">
                Step 2: Material Return Verification &amp; Condition Rating
              </div>
              <span className="text-[10px] text-[#777b86] font-mono">
                Only lines with returned qty &gt; 0 will be processed
              </span>
            </div>

            {returnLines.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-[16px] border border-[#ececec] text-[#777b86] text-xs">
                No issued materials found on this job card.
              </div>
            ) : (
              <div className="space-y-3">
                {returnLines.map((line, idx) => {
                  const isBeingReturned = line.returnedQtyClaimed > 0 || line.storeCountedQty > 0;
                  const isScrap = line.condition === 'Mixed or Pot-life Expired - Scrap';

                  return (
                    <div
                      key={line.id}
                      className={`p-3.5 sm:p-4 rounded-[18px] border transition space-y-3 ${
                        isBeingReturned ? 'bg-white border-[#dcdfe4] shadow-2xs' : 'bg-[#f8f8f9] border-[#ececec]'
                      }`}
                    >
                      {/* Line Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#ececec]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#8a6521] px-2 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be]">
                            Batch: {line.supplierBatchNo || line.batchId}
                          </span>
                          <span className="font-semibold text-xs text-[#17191c]">
                            {line.itemName}
                          </span>
                        </div>

                        <div className="text-[11px] font-mono text-[#777b86]">
                          Issued from Store: <strong className="text-[#17191c]">{line.issuedQty} {line.uom}</strong>
                        </div>
                      </div>

                      {/* Inputs Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        {/* Claimed by Floor */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono text-[#777b86] uppercase">
                            Floor Claimed Qty ({line.uom})
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={line.issuedQty}
                            step="any"
                            value={line.returnedQtyClaimed}
                            onChange={e => handleUpdateLine(line.id, 'returnedQtyClaimed', Number(e.target.value))}
                            className="w-full h-9 px-2.5 rounded-[10px] border border-[#dcdfe4] font-mono font-bold text-xs text-[#17191c] bg-white focus:outline-none focus:border-[#c09748]"
                          />
                        </div>

                        {/* Store Physical Count */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono text-[#777b86] uppercase">
                            Store Counted Qty ({line.uom}) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={line.issuedQty}
                            step="any"
                            value={line.storeCountedQty}
                            onChange={e => handleUpdateLine(line.id, 'storeCountedQty', Number(e.target.value))}
                            className="w-full h-9 px-2.5 rounded-[10px] border border-[#dcdfe4] font-mono font-bold text-xs text-[#17191c] bg-white focus:outline-none focus:border-[#c09748]"
                          />
                        </div>

                        {/* Condition Dropdown */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono text-[#777b86] uppercase">
                            Physical Condition *
                          </label>
                          <select
                            value={line.condition}
                            onChange={e => handleUpdateLine(line.id, 'condition', e.target.value as BalanceReturnCondition)}
                            className="w-full h-9 px-2 rounded-[10px] border border-[#dcdfe4] text-[11px] font-semibold text-[#17191c] bg-white focus:outline-none focus:border-[#c09748]"
                          >
                            <option value="Unopened / Intact">Unopened / Intact (Restock)</option>
                            <option value="Opened - Usable">Opened - Usable (Restock)</option>
                            <option value="Mixed or Pot-life Expired - Scrap">Mixed / Pot-life Expired (Scrap)</option>
                          </select>
                        </div>

                        {/* Variance Display */}
                        <div className="space-y-1 text-right sm:text-right">
                          <label className="block text-[10px] font-mono text-[#777b86] uppercase">
                            Variance / Discrepancy
                          </label>
                          <div className={`h-9 px-2.5 rounded-[10px] font-mono font-bold text-xs flex items-center justify-end border ${
                            line.variance === 0 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}>
                            {line.variance === 0 ? '✓ Match (0)' : `${line.variance > 0 ? `-${line.variance}` : `+${Math.abs(line.variance)}`} ${line.uom}`}
                          </div>
                        </div>
                      </div>

                      {/* Restock Engine Live Guidance */}
                      {isBeingReturned && (
                        <div className={`p-2.5 rounded-[12px] text-xs font-mono flex items-center justify-between border ${
                          isScrap 
                            ? 'bg-rose-50 text-rose-800 border-rose-200' 
                            : 'bg-[#faf7ed] text-[#8a6521] border-[#f4e5be]'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            {isScrap ? (
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            ) : (
                              <Sparkles className="w-4 h-4 text-[#c09748] shrink-0" />
                            )}
                            <span>
                              {isScrap
                                ? `Scrap Material: ${line.storeCountedQty} ${line.uom} logged as floor loss. Zero restock credit.`
                                : `Auto Restock Credit: +${line.storeCountedQty} ${line.uom} will be returned directly to origin Batch "${line.supplierBatchNo}".`}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#777b86]">
                            Processed Qty: {line.processedQty} {line.uom}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* MANDATORY SUPERVISOR SIGN-OFF (IF DISCREPANCY FLAG)                       */}
          {/* ========================================================================= */}
          {hasDiscrepancy && (
            <div className="p-4 rounded-[20px] bg-rose-50 border border-rose-200 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-800 uppercase tracking-wider font-mono">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Count Discrepancy Flagged — Mandatory Supervisor Sign-off Required</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                The physically counted quantity in Stores does not match the floor claimed quantity. Supervisor authorization is required to resolve this discrepancy.
              </p>

              <div className="space-y-1 text-xs">
                <label className="block text-[10.5px] font-semibold text-rose-900 uppercase font-mono">
                  Supervisor Decision &amp; Corrective Action *
                </label>
                <input
                  type="text"
                  value={supervisorDecision}
                  onChange={e => setSupervisorDecision(e.target.value)}
                  className="w-full h-10 px-3 rounded-[12px] border border-rose-300 text-xs font-semibold text-[#17191c] bg-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Custody Signatures & Remarks */}
          <div className="p-3.5 rounded-[18px] bg-[#fafafb] border border-[#ececec] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="block text-[10.5px] font-semibold text-[#777b86] uppercase font-mono">
                Returned by (Floor / Painter)
              </label>
              <input
                type="text"
                value={returnedBy}
                onChange={e => setReturnedBy(e.target.value)}
                className="w-full h-9 px-3 rounded-[12px] border border-[#dcdfe4] text-xs font-semibold text-[#17191c] bg-white focus:outline-none focus:border-[#c09748]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10.5px] font-semibold text-[#777b86] uppercase font-mono">
                Received &amp; Verified by (Stores)
              </label>
              <input
                type="text"
                value={receivedByStore}
                onChange={e => setReceivedByStore(e.target.value)}
                className="w-full h-9 px-3 rounded-[12px] border border-[#dcdfe4] text-xs font-semibold text-[#17191c] bg-white focus:outline-none focus:border-[#c09748]"
                required
              />
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-[#ececec]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-[#fafafb] hover:bg-[#f2f2f3] text-[#777b86] hover:text-[#17191c] border border-[#ececec] text-xs font-semibold cursor-pointer transition active:scale-95"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!isAuthorized || activeReturns.length === 0}
              className={`px-6 py-2.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95 ${
                isAuthorized && activeReturns.length > 0
                  ? 'bg-[#17191c] hover:bg-black text-[#c09748]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-[#c09748]" />
              <span>Confirm Return &amp; Restock to Batch</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
