import React, { useState, useEffect, useMemo } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { 
  MaterialRequisitionNote, 
  RequisitionLineItem, 
  StockCategory, 
  FifoOverrideReasonCode, 
  BatchIssueLine,
  StockBatch
} from '../types/portalTypes';
import { 
  suggestBatches, 
  detectFifoOverrides, 
  validateIssue,
  isChemicalConsumable,
  calculateBatchShelfLife
} from '../utils/stockEngine';
import { 
  X, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Clock, 
  ShieldAlert, 
  CheckSquare, 
  ArrowRight,
  Warehouse,
  Flame,
  Boxes,
  Lock
} from 'lucide-react';

interface IssueWizardModalProps {
  isOpen: boolean;
  mrn: MaterialRequisitionNote | null;
  onClose: () => void;
  onSuccess: (minNo: string) => void;
}

interface EditableLineState {
  requisitionLineId: string;
  itemName: string;
  category: StockCategory;
  materialType?: string;
  partCode?: string;
  colour?: string;
  customer?: string;
  requestedQty: number;
  uom: string;
  batchLines: Array<{
    batchId: string;
    supplierBatchNo: string;
    grnNo: string;
    issuedQty: number;
    expiryDate?: string;
    availableBalance: number;
  }>;
  isOverride: boolean;
  warningMessage?: string;
}

const FIFO_OVERRIDE_REASONS: FifoOverrideReasonCode[] = [
  'Older batch on QC Hold',
  'Older batch quantity insufficient',
  'Older batch container damaged or opened',
  'Customer specific batch requirement',
  'Other'
];

export const IssueWizardModal: React.FC<IssueWizardModalProps> = ({
  isOpen,
  mrn,
  onClose,
  onSuccess
}) => {
  const { 
    stockBatches, 
    jobCards,
    activePlant, 
    currentUser, 
    issueMaterialRequisitionWithBatches 
  } = usePortalStore();

  const linkedJobCard = useMemo(() => {
    if (!mrn?.jobCardNo) return null;
    return jobCards.find(j => j.jobCardNo === mrn.jobCardNo) || null;
  }, [jobCards, mrn]);

  const [lines, setLines] = useState<EditableLineState[]>([]);
  const [storeInchargeName, setStoreInchargeName] = useState<string>(currentUser?.name || 'Manoj Tiwari (Stores)');
  const [storeRemarks, setStoreRemarks] = useState<string>('');
  const [overrideReasonCode, setOverrideReasonCode] = useState<FifoOverrideReasonCode>('Older batch quantity insufficient');
  const [overrideRemark, setOverrideRemark] = useState<string>('');
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Role validation: only Store Incharge / Plant Head / Director can issue
  const isAuthorizedToIssue = useMemo(() => {
    const role = currentUser?.role;
    return role === 'STORES' || role === 'PLANT_HEAD' || role === 'DIRECTOR';
  }, [currentUser]);

  // Available batches matching plant
  const plantBatches = useMemo(() => {
    return stockBatches.filter(b => !activePlant || b.plant.toLowerCase() === activePlant.toLowerCase());
  }, [stockBatches, activePlant]);

  // Initialize lines from MRN
  useEffect(() => {
    if (!isOpen || !mrn) {
      setLines([]);
      setSubmissionError(null);
      return;
    }

    setStoreInchargeName(currentUser?.name || 'Manoj Tiwari (Stores)');
    setStoreRemarks('');
    setSubmissionError(null);

    // Build demand lines: use requisitionLines if present, else fallback to single MRN item
    const demandItems: Array<{
      id: string;
      itemName: string;
      category: StockCategory;
      materialType?: string;
      partCode?: string;
      colour?: string;
      customer?: string;
      requestedQty: number;
      uom: string;
    }> = [];

    if (mrn.requisitionLines && mrn.requisitionLines.length > 0) {
      mrn.requisitionLines.forEach(rl => {
        demandItems.push({
          id: rl.id,
          itemName: rl.itemName,
          category: rl.category,
          materialType: rl.materialType,
          partCode: rl.partCode || mrn.partCode,
          colour: rl.colour || mrn.colorName,
          customer: rl.customer || mrn.customer,
          requestedQty: rl.requestedQty,
          uom: rl.uom
        });
      });
    } else {
      // Legacy single-item MRN
      const isChem = isChemicalConsumable(undefined, undefined, mrn.partDescription);
      demandItems.push({
        id: 'line_legacy_1',
        itemName: mrn.partDescription,
        category: isChem ? 'COMPANY_CONSUMABLE' : 'PARTY_MATERIAL',
        materialType: isChem ? 'paint' : 'substrate',
        partCode: mrn.partCode,
        colour: mrn.colorName,
        customer: mrn.customer,
        requestedQty: mrn.requestedQty,
        uom: mrn.uom
      });
    }

    // Run suggestBatches for each line to auto-fill ideal FIFO/FEFO allocations
    const initialLines: EditableLineState[] = demandItems.map(item => {
      const suggestion = suggestBatches(
        {
          itemName: item.itemName,
          category: item.category,
          materialType: item.materialType,
          customer: item.customer,
          partCode: item.partCode,
          colour: item.colour,
          requestedQty: item.requestedQty,
          plant: activePlant
        },
        plantBatches
      );

      const mappedBatchLines = suggestion.suggestedLines.map(sl => {
        const matchingBatch = plantBatches.find(b => b.batchId === sl.batchId);
        return {
          batchId: sl.batchId,
          supplierBatchNo: sl.supplierBatchNo,
          grnNo: sl.grnNo || linkedJobCard?.sourceGrnNo || mrn.sourceGrnNo || '',
          issuedQty: sl.issuedQty,
          expiryDate: sl.expiryDate,
          availableBalance: matchingBatch ? matchingBatch.balanceQty : sl.issuedQty
        };
      });

      if (mappedBatchLines.length === 0) {
        const fallbackGrn = linkedJobCard?.sourceGrnNo || mrn.sourceGrnNo || 'PK-GRN-2026';
        const fallbackBatch = plantBatches.find(b => b.grnNo === fallbackGrn) || plantBatches[0];
        mappedBatchLines.push({
          batchId: fallbackBatch?.batchId || `batch_${item.id}`,
          supplierBatchNo: fallbackBatch?.supplierBatchNo || linkedJobCard?.batchLotNo || mrn.partCode || 'LOT-INW',
          grnNo: fallbackGrn,
          issuedQty: item.requestedQty,
          expiryDate: fallbackBatch?.expiryDate,
          availableBalance: fallbackBatch?.balanceQty || item.requestedQty
        });
      }

      return {
        requisitionLineId: item.id,
        itemName: item.itemName,
        category: item.category,
        materialType: item.materialType,
        partCode: item.partCode,
        colour: item.colour,
        customer: item.customer,
        requestedQty: item.requestedQty,
        uom: item.uom,
        batchLines: mappedBatchLines,
        isOverride: false
      };
    });

    setLines(initialLines);
  }, [isOpen, mrn, plantBatches, activePlant, currentUser]);

  // Check FIFO/FEFO deviation across all lines
  const hasAnyFifoOverride = useMemo(() => {
    return lines.some(l => l.isOverride);
  }, [lines]);

  // Helper to re-evaluate FIFO override on a line
  const reEvaluateOverride = (lineState: EditableLineState): { isOverride: boolean; warning?: string } => {
    const formattedChosen: BatchIssueLine[] = lineState.batchLines.map(bl => ({
      batchId: bl.batchId,
      grnNo: bl.grnNo,
      supplierBatchNo: bl.supplierBatchNo,
      issuedQty: bl.issuedQty,
      expiryDate: bl.expiryDate,
      uom: lineState.uom
    }));

    const check = detectFifoOverrides(
      formattedChosen,
      {
        itemName: lineState.itemName,
        category: lineState.category,
        materialType: lineState.materialType,
        customer: lineState.customer,
        partCode: lineState.partCode,
        colour: lineState.colour,
        requestedQty: lineState.requestedQty,
        plant: activePlant
      },
      plantBatches
    );

    return {
      isOverride: check.isOverride,
      warning: check.warningMessage
    };
  };

  // Handler: Change quantity for a batch line
  const handleUpdateBatchQty = (lineIndex: number, batchIndex: number, newQty: number) => {
    setLines(prev => {
      const next = [...prev];
      const targetLine = { ...next[lineIndex] };
      const targetBatches = [...targetLine.batchLines];

      const current = targetBatches[batchIndex];
      targetBatches[batchIndex] = {
        ...current,
        issuedQty: Math.max(0, newQty)
      };

      targetLine.batchLines = targetBatches;
      const evalResult = reEvaluateOverride(targetLine);
      targetLine.isOverride = evalResult.isOverride;
      targetLine.warningMessage = evalResult.warning;

      next[lineIndex] = targetLine;
      return next;
    });
  };

  // Confirm and Execute Issue
  const handleConfirmIssue = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (!mrn) return;

    if (!isAuthorizedToIssue) {
      setSubmissionError('Access Denied: Only Store Incharge or Plant Head can issue materials.');
      return;
    }

    // Prepare line allocations
    const lineAllocations = lines.map(l => ({
      requisitionLineId: l.requisitionLineId,
      itemName: l.itemName,
      batchLines: l.batchLines.map(bl => ({
        batchId: bl.batchId,
        grnNo: bl.grnNo,
        supplierBatchNo: bl.supplierBatchNo,
        issuedQty: bl.issuedQty,
        expiryDate: bl.expiryDate,
        uom: l.uom
      }))
    }));

    // If override, validate reason
    if (hasAnyFifoOverride) {
      if (!overrideReasonCode) {
        setSubmissionError('FIFO Override Reason is mandatory when bypassing older/earlier-expiry batches.');
        return;
      }
      if (overrideReasonCode === 'Other' && !overrideRemark.trim()) {
        setSubmissionError('Supervisor remark is mandatory when selecting "Other" override reason.');
        return;
      }
    }

    const result = issueMaterialRequisitionWithBatches({
      mrnNo: mrn.mrnNo,
      storeInchargeName,
      storeRemarks: storeRemarks.trim() || undefined,
      lineAllocations,
      fifoStatus: hasAnyFifoOverride ? 'FIFO Override' : 'FIFO OK',
      overrideReasonCode: hasAnyFifoOverride ? overrideReasonCode : undefined,
      overrideRemark: hasAnyFifoOverride ? (overrideRemark.trim() || overrideReasonCode) : undefined
    });

    if (!result.success) {
      setSubmissionError(result.error || 'Failed to issue material.');
      return;
    }

    onSuccess(result.minNo);
  };

  if (!isOpen || !mrn) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-[24px] max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 max-h-[94vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-150 relative">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#ececec] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#faf3e0] border border-[#f4e5be] flex items-center justify-center text-[#8a6521] shrink-0">
              <Layers className="w-5 h-5 text-[#c09748]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#8a6521] px-2 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be]">
                  {mrn.mrnNo}
                </span>
                <h3 className="font-serif font-normal text-lg sm:text-xl text-[#17191c]">
                  Store Material Issue Wizard (FIFO / FEFO)
                </h3>
              </div>
              <p className="text-xs text-[#777b86] mt-0.5">
                Target Job Card: <strong className="text-[#17191c] font-mono">{mrn.jobCardNo}</strong> | Customer: <strong>{mrn.customer}</strong>
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

        {/* Unauthorized Role Warning */}
        {!isAuthorizedToIssue && (
          <div className="p-3 rounded-[16px] bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Read-Only Mode:</strong> Logged in as <strong>{currentUser?.name} ({currentUser?.role})</strong>. Only <strong>Store Incharge</strong> or <strong>Plant Head</strong> can confirm material issuance.
            </span>
          </div>
        )}

        {/* Global Error Banner */}
        {submissionError && (
          <div className="p-3 rounded-[16px] bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="font-medium leading-relaxed">{submissionError}</div>
          </div>
        )}

        <form onSubmit={handleConfirmIssue} className="space-y-4">
          {/* ========================================================================= */}
          {/* DEMAND LINES GROUP (PARTY SUBSTRATES & COMPANY CONSUMABLES)               */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            {lines.map((line, lineIdx) => {
              const isChem = isChemicalConsumable(line.materialType, line.category, line.itemName);
              const totalAllocatedForLine = line.batchLines.reduce((sum, b) => sum + Number(b.issuedQty || 0), 0);
              const pendingQty = Math.max(0, line.requestedQty - totalAllocatedForLine);

              return (
                <div 
                  key={line.requisitionLineId || lineIdx}
                  className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-3 shadow-2xs"
                >
                  {/* Line Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#ececec]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold border ${
                        isChem
                          ? 'bg-[#faf3e0] text-[#8a6521] border-[#f4e5be]'
                          : 'bg-white text-[#777b86] border-[#ececec]'
                      }`}>
                        {isChem ? 'Chemical Consumable (FEFO)' : 'Party Substrate (FIFO)'}
                      </span>
                      <h4 className="text-xs sm:text-sm font-semibold text-[#17191c] truncate">
                        {line.itemName}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                      <span className="text-[#777b86]">Demanded:</span>
                      <strong className="text-[#17191c] font-bold">{line.requestedQty} {line.uom}</strong>
                      <span>•</span>
                      <span className={pendingQty === 0 ? 'text-emerald-700 font-bold' : 'text-amber-800 font-bold'}>
                        {totalAllocatedForLine} Allocated
                      </span>
                    </div>
                  </div>

                  {/* Inline FIFO Override Warning Card */}
                  {line.isOverride && (
                    <div className="p-3 rounded-[16px] bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2 animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed">
                        {line.warningMessage || 'FEFO/FIFO Deviation Detected: An older or earlier-expiring available batch was bypassed. A mandatory reason code must be documented.'}
                      </div>
                    </div>
                  )}

                  {/* Linked GRN Allocation & Material Issue Statement (No Dropdown - Tied to Job Card GRN) */}
                  <div className="space-y-2.5">
                    <div className="text-[10px] font-mono font-bold text-[#777b86] uppercase tracking-wider flex items-center justify-between">
                      <span>Linked GRN Lot Allocation</span>
                      <span className="text-[#8a6521] font-semibold">Pre-Allocated From Job Card</span>
                    </div>

                    {line.batchLines.map((batchLine, batchIdx) => {
                      const balanceAfter = Math.max(0, batchLine.availableBalance - batchLine.issuedQty);
                      const matchingBatch = plantBatches.find(b => b.batchId === batchLine.batchId);
                      const shelf = matchingBatch ? calculateBatchShelfLife(matchingBatch) : null;
                      const grnDisplay = batchLine.grnNo || linkedJobCard?.sourceGrnNo || mrn?.sourceGrnNo || matchingBatch?.grnNo || 'PK-GRN-2026';
                      const lotDisplay = batchLine.supplierBatchNo || matchingBatch?.supplierBatchNo || linkedJobCard?.batchLotNo || 'LOT-INW';
                      const totalReceivedInGrn = matchingBatch?.receivedQty || (batchLine.availableBalance >= line.requestedQty ? batchLine.availableBalance : line.requestedQty);

                      return (
                        <div
                          key={batchLine.batchId || batchIdx}
                          className="p-3.5 rounded-[18px] bg-white border border-[#ececec] shadow-2xs space-y-3"
                        >
                          {/* GRN & Batch Identity Meta Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-1 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] font-mono font-bold text-xs flex items-center gap-1.5 shadow-2xs">
                                <Warehouse className="w-3.5 h-3.5 text-[#c09748]" />
                                <span>GRN: {grnDisplay}</span>
                              </span>
                              <span className="px-2.5 py-1 rounded-full bg-[#fafafb] border border-[#ececec] text-[#17191c] font-mono font-bold text-xs">
                                Lot / Batch: {lotDisplay}
                              </span>
                              {matchingBatch?.storageBay && (
                                <span className="px-2 py-0.5 rounded-full bg-white border border-[#ececec] text-[#777b86] font-mono text-[11px] flex items-center gap-1">
                                  <Layers className="w-3 h-3 text-[#777b86]" />
                                  <span>{matchingBatch.storageBay}</span>
                                </span>
                              )}
                            </div>

                            {/* Expiry / Age indicator */}
                            <div className="text-[11px] font-mono text-[#777b86]">
                              {shelf ? (
                                <span className={shelf.isExpired ? 'text-rose-700 font-bold' : shelf.isNearExpiry ? 'text-amber-800 font-bold' : 'text-[#777b86]'}>
                                  {batchLine.expiryDate ? `Exp: ${batchLine.expiryDate} (${shelf.daysLeft}d left)` : `${shelf.daysSinceReceived}d in store`}
                                </span>
                              ) : (
                                <span>Verified Lot</span>
                              )}
                            </div>
                          </div>

                          {/* 4-Box Metric Flow: Received in GRN -> Available in Store -> Issue Now Input -> Balance After */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                            {/* 1. Received in this GRN */}
                            <div className="p-2.5 rounded-[14px] bg-[#fafafb] border border-[#ececec]">
                              <div className="text-[9.5px] font-mono uppercase text-[#777b86] tracking-wider">
                                Received In GRN
                              </div>
                              <div className="text-sm font-mono font-bold text-[#17191c] mt-0.5">
                                {totalReceivedInGrn} <span className="text-xs font-normal text-[#777b86]">{line.uom}</span>
                              </div>
                              <div className="text-[10px] text-[#777b86] mt-0.5">Total Inward Lot</div>
                            </div>

                            {/* 2. Available in Store */}
                            <div className="p-2.5 rounded-[14px] bg-[#fafafb] border border-[#ececec]">
                              <div className="text-[9.5px] font-mono uppercase text-[#777b86] tracking-wider">
                                Available in Store
                              </div>
                              <div className="text-sm font-mono font-bold text-emerald-800 mt-0.5">
                                {batchLine.availableBalance} <span className="text-xs font-normal text-[#777b86]">{line.uom}</span>
                              </div>
                              <div className="text-[10px] text-emerald-700 mt-0.5">Current Stock</div>
                            </div>

                            {/* 3. Issue Qty Now (Editable input) */}
                            <div className="p-2.5 rounded-[14px] bg-white border-2 border-[#c09748]/60 shadow-2xs">
                              <label className="block text-[9.5px] font-mono uppercase font-bold text-[#8a6521] tracking-wider">
                                Issue Qty Now *
                              </label>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <input
                                  type="number"
                                  min="0"
                                  max={batchLine.availableBalance}
                                  step="any"
                                  value={batchLine.issuedQty}
                                  onChange={e => handleUpdateBatchQty(lineIdx, batchIdx, Number(e.target.value))}
                                  className="w-full h-7 px-2 rounded-[8px] border border-[#dcdfe4] font-mono font-bold text-sm text-[#17191c] bg-white focus:outline-none focus:border-[#c09748]"
                                />
                                <span className="text-xs font-mono font-semibold text-[#17191c] shrink-0">{line.uom}</span>
                              </div>
                              <div className="text-[10px] text-[#777b86] mt-0.5">
                                {line.requestedQty === batchLine.issuedQty ? 'Full Demanded Qty' : `${batchLine.issuedQty} of ${line.requestedQty} Demanded`}
                              </div>
                            </div>

                            {/* 4. Balance After Issue */}
                            <div className="p-2.5 rounded-[14px] bg-[#fafafb] border border-[#ececec]">
                              <div className="text-[9.5px] font-mono uppercase text-[#777b86] tracking-wider">
                                Balance After Issue
                              </div>
                              <div className="text-sm font-mono font-bold text-[#17191c] mt-0.5">
                                {balanceAfter} <span className="text-xs font-normal text-[#777b86]">{line.uom}</span>
                              </div>
                              <div className="text-[10px] text-[#777b86] mt-0.5">
                                {balanceAfter === 0 ? 'Lot Exhausted' : 'Retained in Store'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* MANDATORY FIFO OVERRIDE REASON (IF ANY DEVIATION DETECTED)                */}
          {/* ========================================================================= */}
          {hasAnyFifoOverride && (
            <div className="p-4 rounded-[20px] bg-[#faf7ed] border border-[#f4e5be] space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-[#8a6521] uppercase tracking-wider font-mono">
                <ShieldAlert className="w-4 h-4 text-[#c09748]" />
                <span>Document FIFO / FEFO Deviation Reason (Mandatory Compliance)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="block text-[10.5px] font-semibold text-[#777b86] uppercase font-mono">
                    Deviation Reason Code *
                  </label>
                  <select
                    value={overrideReasonCode}
                    onChange={e => setOverrideReasonCode(e.target.value as FifoOverrideReasonCode)}
                    className="w-full h-10 px-3 rounded-[12px] border border-[#dcdfe4] text-xs font-semibold text-[#17191c] bg-white focus:outline-none focus:border-[#c09748]"
                    required
                  >
                    {FIFO_OVERRIDE_REASONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10.5px] font-semibold text-[#777b86] uppercase font-mono">
                    Supervisor Authorization Remark {overrideReasonCode === 'Other' && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={overrideRemark}
                    onChange={e => setOverrideRemark(e.target.value)}
                    placeholder="e.g. Approved by Plant Head due to specific gloss run requirement."
                    className="w-full h-10 px-3 rounded-[12px] border border-[#dcdfe4] text-xs text-[#17191c] bg-white focus:outline-none focus:border-[#c09748]"
                    required={overrideReasonCode === 'Other'}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Store Incharge Sign-off & Storage Remarks */}
          <div className="p-3.5 rounded-[18px] bg-[#fafafb] border border-[#ececec] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="block text-[10.5px] font-semibold text-[#777b86] uppercase font-mono">
                Store Incharge Custody Sign-off
              </label>
              <input
                type="text"
                value={storeInchargeName}
                onChange={e => setStoreInchargeName(e.target.value)}
                className="w-full h-9 px-3 rounded-[12px] border border-[#dcdfe4] text-xs font-semibold text-[#17191c] bg-white focus:outline-none focus:border-[#c09748]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10.5px] font-semibold text-[#777b86] uppercase font-mono">
                Dispatch / Staging Notes (Optional)
              </label>
              <input
                type="text"
                value={storeRemarks}
                onChange={e => setStoreRemarks(e.target.value)}
                placeholder="e.g. Delivered to Booth #1 staging rack via trolley #2."
                className="w-full h-9 px-3 rounded-[12px] border border-[#dcdfe4] text-xs text-[#17191c] bg-white focus:outline-none focus:border-[#c09748]"
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
              disabled={!isAuthorizedToIssue}
              className={`px-6 py-2.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95 ${
                isAuthorizedToIssue
                  ? 'bg-[#17191c] hover:bg-black text-[#c09748]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-[#c09748]" />
              <span>Confirm Issue &amp; Generate MIN Slip</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
