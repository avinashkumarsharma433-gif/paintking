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
    balanceReturnSlips,
    createBalanceReturnSlip, 
    acceptBalanceReturnSlip 
  } = usePortalStore();

  const [selectedJobCardNo, setSelectedJobCardNo] = useState<string>('');
  const [returnLines, setReturnLines] = useState<ReturnLineFormItem[]>([]);
  const [returnedBy, setReturnedBy] = useState<string>('');
  const [receivedByStore, setReceivedByStore] = useState<string>(currentUser?.name || 'Manoj Tiwari (Stores)');
  const [generalRemarks, setGeneralRemarks] = useState<string>('');
  const [supervisorDecision, setSupervisorDecision] = useState<string>('Restocked to active inventory with supervisor sign-off');
  const [directRestock, setDirectRestock] = useState<boolean>(false);
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
      setDirectRestock(false);
      return;
    }

    const targetJcNo = preselectedJobCardNo || eligibleJobCards[0]?.jobCardNo || '';
    setSelectedJobCardNo(targetJcNo);
    setReceivedByStore(currentUser?.name || 'Manoj Tiwari (Stores)');
  }, [isOpen, preselectedJobCardNo, eligibleJobCards, currentUser]);

  // Real-time End-of-Job Reconciliation Metrics
  const metrics = useMemo(() => {
    if (!selectedJobCard) return null;
    const target = selectedJobCard.targetQty || 0;
    const good = selectedJobCard.goodQty || 0;
    const scrap = selectedJobCard.rejectQty || 0;
    const completed = good + scrap;

    // Previous unpainted substrate returns (exclude scrap to avoid double deducting)
    const prevReturnedRaw = balanceReturnSlips
      .filter(r => r.jobCardNo === selectedJobCard.jobCardNo)
      .flatMap(r => r.lines)
      .filter(l => (l.category === 'PARTY_MATERIAL' || l.uom === 'Pcs') && l.condition !== 'Damaged / Scrapped')
      .reduce((sum, l) => sum + Number(l.storeCountedQty || l.returnedQtyClaimed || 0), 0);

    // Previous scrap returns
    const prevReturnedScrap = balanceReturnSlips
      .filter(r => r.jobCardNo === selectedJobCard.jobCardNo)
      .flatMap(r => r.lines)
      .filter(l => (l.category === 'PARTY_MATERIAL' || l.uom === 'Pcs') && l.condition === 'Damaged / Scrapped')
      .reduce((sum, l) => sum + Number(l.storeCountedQty || l.returnedQtyClaimed || 0), 0);

    const unpaintedBalance = Math.max(0, target - completed - prevReturnedRaw);
    const unreturnedScrap = Math.max(0, scrap - prevReturnedScrap);

    // Company Consumables Analysis (system checks whether any paint/material was unused)
    const materialsAnalysis = (selectedJobCard.issuedMaterials || []).map((m, idx) => {
      const isChem = m.materialType === 'paint' || m.materialType === 'thinner' || /paint|basecoat|thinner|hardener|clear/i.test(m.itemDescription);
      let consumed = m.consumedQty !== undefined ? m.consumedQty : 0;
      let floorBal = m.floorBalanceQty !== undefined ? m.floorBalanceQty : 0;

      // If user did not manually update usage, auto-calculate consumption proportional to pieces produced
      if (m.floorBalanceQty === undefined && (m.consumedQty === undefined || m.consumedQty === 0)) {
        const ratio = target > 0 ? Math.min(1, completed / target) : 1;
        consumed = Number((m.qty * ratio).toFixed(2));
        floorBal = Math.max(0, Number((m.qty - consumed).toFixed(2)));
      } else if (m.floorBalanceQty !== undefined) {
        floorBal = m.floorBalanceQty;
        consumed = Math.max(0, Number((m.qty - floorBal).toFixed(2)));
      } else {
        consumed = m.consumedQty || 0;
        floorBal = Math.max(0, Number((m.qty - consumed).toFixed(2)));
      }

      return {
        id: m.id || `mat_${idx + 1}`,
        itemDescription: m.itemDescription,
        qty: Number(m.qty || 0),
        consumed: Number(consumed || 0),
        floorBal: Number(floorBal || 0),
        uom: m.uom || 'Litres',
        isChem,
        materialType: m.materialType,
        batchNo: m.batchNo,
        grnNo: m.grnNo,
        batchLines: m.batchLines
      };
    });

    const totalUnusedChemicals = materialsAnalysis.reduce((acc, m) => acc + m.floorBal, 0);

    return {
      target,
      good,
      scrap,
      completed,
      unpaintedBalance,
      unreturnedScrap,
      materialsAnalysis,
      totalUnusedChemicals
    };
  }, [selectedJobCard, balanceReturnSlips]);

  // When job card changes, build available return lines for BOTH Party Substrates and Company Consumables
  useEffect(() => {
    if (!selectedJobCard || !metrics) {
      setReturnLines([]);
      setReturnedBy('');
      return;
    }

    setReturnedBy(selectedJobCard.assignedPainterName || selectedJobCard.painterName || 'Floor Painter');

    const lines: ReturnLineFormItem[] = [];

    // 1. Unpainted Raw Substrate Pieces (if any raw unpainted pieces remain)
    if (metrics.unpaintedBalance > 0 && (selectedJobCard.partDescription || selectedJobCard.partCode)) {
      lines.push({
        id: 'rtn_substrate_line',
        itemName: `${selectedJobCard.partDescription || `Part ${selectedJobCard.partCode} Substrate`} (Unpainted Raw Pieces)`,
        batchId: selectedJobCard.sourceGrnNo || `LOT-${selectedJobCard.partCode || 'SUB'}-${selectedJobCard.jobCardNo}`,
        grnNo: selectedJobCard.sourceGrnNo || 'PK-GRN-RETURN',
        supplierBatchNo: selectedJobCard.sourceGrnNo || `LOT-${selectedJobCard.partCode || 'SUB'}`,
        category: 'PARTY_MATERIAL',
        materialType: 'substrate',
        uom: 'Pcs',
        issuedQty: metrics.target,
        processedQty: metrics.completed,
        returnedQtyClaimed: metrics.unpaintedBalance,
        storeCountedQty: metrics.unpaintedBalance,
        condition: 'Unopened / Intact',
        variance: 0,
        remarks: 'Unpainted raw balance pieces returned to store'
      });
    }

    // 2. Dead Rejection Scrap Pieces (system auto-checks dead scrap pieces produced)
    if (metrics.unreturnedScrap > 0 && (selectedJobCard.partDescription || selectedJobCard.partCode)) {
      lines.push({
        id: 'rtn_scrap_line',
        itemName: `${selectedJobCard.partDescription || `Part ${selectedJobCard.partCode} Substrate`} (Dead Rejection Scrap)`,
        batchId: selectedJobCard.sourceGrnNo || `LOT-${selectedJobCard.partCode || 'SUB'}-${selectedJobCard.jobCardNo}`,
        grnNo: selectedJobCard.sourceGrnNo || 'PK-GRN-SCRAP',
        supplierBatchNo: selectedJobCard.sourceGrnNo || `LOT-${selectedJobCard.partCode || 'SUB'}`,
        category: 'PARTY_MATERIAL',
        materialType: 'substrate',
        uom: 'Pcs',
        issuedQty: metrics.target,
        processedQty: metrics.target,
        returnedQtyClaimed: metrics.unreturnedScrap,
        storeCountedQty: metrics.unreturnedScrap,
        condition: 'Damaged / Scrapped',
        variance: 0,
        remarks: 'Dead rejection scrap pieces logged for store verification & disposal'
      });
    }

    // 3. Company Chemical Consumables Lines - system auto-checks unused paint/thinner/hardener
    metrics.materialsAnalysis.forEach((m, idx) => {
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

      // Only show if there is actually unused paint or consumable stock left on the floor
      if (m.floorBal > 0) {
        lines.push({
          id: `rtn_chem_${idx + 1}`,
          itemName: `${m.itemDescription} (Unused Floor Stock)`,
          batchId,
          grnNo,
          supplierBatchNo,
          category: 'COMPANY_CONSUMABLE',
          materialType: m.materialType || 'paint',
          uom: m.uom,
          issuedQty: m.qty,
          processedQty: m.consumed,
          returnedQtyClaimed: m.floorBal,
          storeCountedQty: m.floorBal,
          condition: m.floorBal === m.qty ? 'Unopened / Intact' : 'Opened - Usable',
          variance: 0,
          remarks: 'Unused chemical floor balance returned to store'
        });
      }
    });

    // 4. Fallback if 100% target met with 0 scrap and complete paint consumption
    if (lines.length === 0) {
      lines.push({
        id: 'rtn_zero_balance_close',
        itemName: `${selectedJobCard.partDescription || 'Substrate Pieces'} (100% Target Met - Zero Leftover)`,
        batchId: selectedJobCard.sourceGrnNo || `LOT-${selectedJobCard.jobCardNo}`,
        grnNo: selectedJobCard.sourceGrnNo || 'PK-GRN-RETURN',
        supplierBatchNo: selectedJobCard.sourceGrnNo || 'LOT-DONE',
        category: 'PARTY_MATERIAL',
        materialType: 'substrate',
        uom: 'Pcs',
        issuedQty: metrics.target,
        processedQty: metrics.target,
        returnedQtyClaimed: 0,
        storeCountedQty: 0,
        condition: 'Unopened / Intact',
        variance: 0,
        remarks: 'Order fully finished with zero dead scrap and all paint consumed. Job Card closed.'
      });
    }

    setReturnLines(lines);
  }, [selectedJobCard, metrics, stockBatches]);

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

    const linesToSubmit = activeReturns.length > 0 ? activeReturns : returnLines;
    if (linesToSubmit.length === 0) {
      setSubmissionError('No materials or pieces found to reconcile on this Job Card.');
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
      lines: linesToSubmit.map(l => ({
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

    // If Store Incharge or Plant Head and direct restock is enabled, restock immediately
    if (isAuthorized && directRestock) {
      acceptBalanceReturnSlip(
        newSlip.rtnNo,
        linesToSubmit.map(l => ({
          lineId: l.id,
          storeCountedQty: l.storeCountedQty,
          condition: l.condition,
          remarks: l.remarks
        })),
        receivedByStore,
        hasDiscrepancy ? supervisorDecision : 'Full verified count match - Restocked'
      );
    }

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
                Job Card Final Return to Store (Reconciliation &amp; Restock)
              </h3>
              <p className="text-xs text-[#777b86] mt-0.5">
                Official end-of-job return slip for unpainted pieces and leftover chemical floor stock.
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

        {/* Handover & Authorization Mode Banner */}
        {!isAuthorized ? (
          <div className="p-3 rounded-[16px] bg-[#faf7ed] border border-[#f4e5be] text-[#8a6521] text-xs flex items-center gap-2 font-mono">
            <Boxes className="w-4 h-4 text-[#c09748] shrink-0" />
            <span>
              <strong>Floor Handover Mode:</strong> This return slip will be dispatched to the <strong>Stores Desk</strong> with status <em>Pending Store Verification</em>.
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-[16px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 font-mono">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Store / Head Authority:</strong> Restock immediately or dispatch to store desk.</span>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-emerald-900 shrink-0">
              <input
                type="checkbox"
                checked={directRestock}
                onChange={e => setDirectRestock(e.target.checked)}
                className="rounded accent-emerald-600"
              />
              <span>Immediate Restock into Batch</span>
            </label>
          </div>
        )}

        {/* Submission Error Banner */}
        {submissionError && (
          <div className="p-3 rounded-[16px] bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="font-medium">{submissionError}</div>
          </div>
        )}

        {/* End-of-Job Real-Time Reconciliation KPI Overview */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-[#fafafb] p-3 rounded-[16px] border border-[#ececec]">
              <span className="text-[10px] text-[#777b86] uppercase font-mono block font-semibold">Total Target Base</span>
              <span className="font-mono font-bold text-base text-[#17191c] mt-0.5 block">{metrics.target.toLocaleString('en-IN')} Pcs</span>
              <span className="text-[10px] text-[#777b86] font-mono">100% Demand</span>
            </div>
            <div className="bg-emerald-50/70 p-3 rounded-[16px] border border-emerald-200">
              <span className="text-[10px] text-emerald-800 uppercase font-mono block font-semibold">Good Output</span>
              <span className="font-mono font-bold text-base text-emerald-800 mt-0.5 block">{metrics.good.toLocaleString('en-IN')} Pcs</span>
              <span className="text-[10px] text-emerald-700 font-mono font-bold">
                {metrics.target > 0 ? Math.round((metrics.good / metrics.target) * 100) : 0}% Target Yield
              </span>
            </div>
            <div className="bg-rose-50/70 p-3 rounded-[16px] border border-rose-200">
              <span className="text-[10px] text-rose-800 uppercase font-mono block font-semibold">Dead Rejection Scrap</span>
              <span className="font-mono font-bold text-base text-rose-800 mt-0.5 block">{metrics.scrap.toLocaleString('en-IN')} Pcs</span>
              <span className="text-[10px] text-rose-700 font-mono font-bold">
                {metrics.target > 0 ? ((metrics.scrap / metrics.target) * 100).toFixed(1) : 0}% Rejection Rate
              </span>
            </div>
            <div className="bg-[#faf7ed] p-3 rounded-[16px] border border-[#f4e5be]">
              <span className="text-[10px] text-[#8a6521] uppercase font-mono block font-semibold">Company Consumables</span>
              <span className="font-mono font-bold text-base text-[#8a6521] mt-0.5 block">
                {metrics.totalUnusedChemicals > 0 ? `${metrics.totalUnusedChemicals.toFixed(2)} L` : '0.00 L'}
              </span>
              <span className={`text-[10px] font-mono font-bold ${metrics.totalUnusedChemicals > 0 ? 'text-[#8a6521]' : 'text-emerald-700'}`}>
                {metrics.totalUnusedChemicals > 0 ? 'To Return to Store' : '✓ 100% Consumed'}
              </span>
            </div>
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

            {preselectedJobCardNo && selectedJobCard ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[16px] bg-white border border-[#ececec]">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-[#17191c] px-3 py-1 rounded-full bg-[#fafafb] border border-[#dcdfe4]">
                    {selectedJobCard.jobCardNo}
                  </span>
                  <div>
                    <div className="font-bold text-xs text-[#17191c]">{selectedJobCard.customer}</div>
                    <div className="text-[11px] text-[#777b86] font-mono">
                      Part: <strong>{selectedJobCard.partCode}</strong> ({selectedJobCard.color}) • Painter: <strong>{selectedJobCard.assignedPainterName || selectedJobCard.painterName || 'Floor Painter'}</strong>
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] flex items-center gap-1 self-start sm:self-auto shrink-0">
                  <Lock className="w-3 h-3 text-[#c09748]" />
                  <span>Linked to Current Job Card</span>
                </span>
              </div>
            ) : (
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
            )}
          </div>

          {/* ========================================================================= */}
          {/* STEP 2: MATERIAL RETURN VERIFICATION & CONDITION RATING                   */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-[#c09748] uppercase tracking-[0.16em] font-mono">
                Step 2: Material Return Verification &amp; Condition Rating
              </div>
              <span className="text-[10px] text-[#777b86] font-mono">
                Verified end-of-job return to Stores Desk
              </span>
            </div>

            {/* BLOCK 1: CUSTOMER SUBSTRATES & DEAD REJECTION SCRAP */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#ececec] pb-1.5">
                <span className="font-mono text-xs font-bold text-[#17191c] uppercase flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>Customer Substrates &amp; Dead Scrap Handover</span>
                </span>
                <span className="text-[10.5px] font-mono text-[#777b86]">
                  Total Order Base: <strong>{metrics?.target || 0} Pcs</strong>
                </span>
              </div>

              {(() => {
                const substrateLines = returnLines.filter(l => l.category === 'PARTY_MATERIAL' || l.uom === 'Pcs');

                return (
                  <div className="space-y-3">
                    {substrateLines.filter(l => l.id !== 'rtn_zero_balance_close').map(line => {
                      const isScrap = line.condition === 'Damaged / Scrapped' || line.id === 'rtn_scrap_line';

                      return (
                        <div
                          key={line.id}
                          className={`p-3.5 sm:p-4 rounded-[18px] border transition space-y-3 ${
                            isScrap 
                              ? 'bg-rose-50/40 border-rose-200 shadow-2xs' 
                              : 'bg-white border-[#dcdfe4] shadow-2xs'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#ececec]">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                isScrap 
                                  ? 'bg-rose-100/90 text-rose-800 border-rose-300' 
                                  : 'bg-[#faf3e0] text-[#8a6521] border-[#f4e5be]'
                              }`}>
                                {isScrap ? '🔴 DEAD REJECTION SCRAP LOSS' : '📦 UNPAINTED RAW BALANCE'}
                              </span>
                              <span className="font-semibold text-xs text-[#17191c]">
                                {line.itemName}
                              </span>
                            </div>

                            <div className="text-[11px] font-mono text-[#777b86]">
                              {isScrap ? (
                                <span className="text-rose-800 font-bold">Scrap Loss: {line.returnedQtyClaimed} Pcs</span>
                              ) : (
                                <span>Unpainted Leftover: <strong className="text-[#17191c]">{line.returnedQtyClaimed} Pcs</strong></span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-mono text-[#777b86] uppercase">
                                Floor Claimed Qty ({line.uom})
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={metrics?.target || line.issuedQty}
                                step="any"
                                value={line.returnedQtyClaimed}
                                onChange={e => handleUpdateLine(line.id, 'returnedQtyClaimed', Number(e.target.value))}
                                className="w-full h-9 px-2.5 rounded-[10px] border border-[#dcdfe4] font-mono font-bold text-xs text-[#17191c] bg-white focus:outline-none focus:border-[#c09748]"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] font-mono text-[#777b86] uppercase">
                                Store Counted Qty ({line.uom}) *
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={metrics?.target || line.issuedQty}
                                step="any"
                                value={line.storeCountedQty}
                                onChange={e => handleUpdateLine(line.id, 'storeCountedQty', Number(e.target.value))}
                                className="w-full h-9 px-2.5 rounded-[10px] border border-[#dcdfe4] font-mono font-bold text-xs text-[#17191c] bg-white focus:outline-none focus:border-[#c09748]"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] font-mono text-[#777b86] uppercase">
                                Physical Condition *
                              </label>
                              <select
                                value={line.condition}
                                onChange={e => handleUpdateLine(line.id, 'condition', e.target.value as BalanceReturnCondition)}
                                className="w-full h-9 px-2 rounded-[10px] border border-[#dcdfe4] text-[11px] font-semibold text-[#17191c] bg-white focus:outline-none focus:border-[#c09748]"
                              >
                                {isScrap ? (
                                  <>
                                    <option value="Damaged / Scrapped">Dead Rejection Scrap (Scrap Bin)</option>
                                    <option value="Mixed or Pot-life Expired - Scrap">Unusable / Scrap</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="Unopened / Intact">Unopened / Intact (Raw Restock)</option>
                                    <option value="Opened - Usable">Opened - Usable (Raw Restock)</option>
                                  </>
                                )}
                              </select>
                            </div>

                            <div className="space-y-1 text-right">
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

                          <div className={`p-2.5 rounded-[12px] text-xs font-mono flex items-center justify-between border ${
                            isScrap 
                              ? 'bg-rose-100/60 text-rose-900 border-rose-300' 
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
                                  ? `Scrap Loss Handover: ${line.storeCountedQty} Pcs logged in Store Scrap Ledger for customer disposal verification (Zero restock credit).`
                                  : `Auto Restock Credit: +${line.storeCountedQty} Pcs clean unpainted substrates will be returned to raw inventory.`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Unpainted 0 reassurance chip */}
                    {metrics && metrics.unpaintedBalance === 0 && (
                      <div className="p-3 rounded-[14px] bg-white border border-[#ececec] text-xs font-mono text-[#777b86] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>0 Unpainted Raw Substrates Leftover:</strong> All {metrics.target} pieces were processed on the floor ({metrics.good} Good Output + {metrics.scrap} Dead Scrap).
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* BLOCK 2: COMPANY CHEMICALS & CONSUMABLES */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-[#ececec] pb-1.5">
                <span className="font-mono text-xs font-bold text-[#17191c] uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>Company Paints &amp; Chemical Floor Stock Handover</span>
                </span>
                <span className="text-[10.5px] font-mono text-[#777b86]">
                  Floor Balance: <strong className={metrics && metrics.totalUnusedChemicals > 0 ? "text-[#8a6521]" : "text-emerald-700"}>{metrics && metrics.totalUnusedChemicals > 0 ? `${metrics.totalUnusedChemicals.toFixed(2)} Litres Unused` : '0.00 L (100% Consumed)'}</strong>
                </span>
              </div>

              {/* If unused chemicals exist to return */}
              {(() => {
                const chemicalLines = returnLines.filter(l => l.category !== 'PARTY_MATERIAL' && l.uom !== 'Pcs' && l.id !== 'rtn_zero_balance_close');

                if (chemicalLines.length > 0) {
                  return (
                    <div className="space-y-3">
                      {chemicalLines.map(line => (
                        <div
                          key={line.id}
                          className="p-3.5 sm:p-4 rounded-[18px] border bg-white border-[#dcdfe4] shadow-2xs space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#ececec]">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]">
                                🎨 UNUSED CHEMICAL FLOOR BALANCE
                              </span>
                              <span className="font-semibold text-xs text-[#17191c]">
                                {line.itemName}
                              </span>
                            </div>

                            <div className="text-[11px] font-mono text-[#777b86]">
                              Issued: <strong className="text-[#17191c]">{line.issuedQty} {line.uom}</strong> • Consumed: <strong className="text-[#17191c]">{line.processedQty} {line.uom}</strong>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-mono text-[#777b86] uppercase">
                                Floor Claimed Unused ({line.uom})
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

                            <div className="space-y-1">
                              <label className="block text-[10px] font-mono text-[#777b86] uppercase">
                                Physical Condition *
                              </label>
                              <select
                                value={line.condition}
                                onChange={e => handleUpdateLine(line.id, 'condition', e.target.value as BalanceReturnCondition)}
                                className="w-full h-9 px-2 rounded-[10px] border border-[#dcdfe4] text-[11px] font-semibold text-[#17191c] bg-white focus:outline-none focus:border-[#c09748]"
                              >
                                <option value="Opened - Usable">Opened - Usable (Restock)</option>
                                <option value="Unopened / Intact">Unopened / Intact (Restock)</option>
                                <option value="Mixed or Pot-life Expired - Scrap">Mixed / Pot-life Expired (Scrap)</option>
                              </select>
                            </div>

                            <div className="space-y-1 text-right">
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

                          <div className="p-2.5 rounded-[12px] bg-[#faf7ed] border border-[#f4e5be] text-[#8a6521] text-xs font-mono flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-[#c09748] shrink-0" />
                            <span>
                              Auto Restock Credit: +{line.storeCountedQty} {line.uom} will be credited back to Batch &quot;{line.supplierBatchNo || line.batchId}&quot;.
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }

                // If ALL company chemicals were 100% consumed (0 unused)
                return (
                  <div className="p-4 rounded-[18px] bg-emerald-50/70 border border-emerald-200 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-mono text-xs font-bold text-emerald-900">
                        ✓ All Issued Company Paints &amp; Chemicals 100% Consumed (0.00 Litres Unused)
                      </span>
                    </div>
                    <p className="text-[11.5px] text-emerald-800">
                      System verified that all company materials issued for this Job Card were fully consumed during floor processing. Zero leftover chemical stock remains to be returned to store.
                    </p>
                    {metrics && metrics.materialsAnalysis.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-200/80">
                        {metrics.materialsAnalysis.map((m, idx) => (
                          <div key={idx} className="p-2.5 rounded-[12px] bg-white border border-emerald-200 text-xs font-mono flex items-center justify-between">
                            <div className="truncate max-w-[130px]">
                              <span className="font-bold text-[#17191c] block truncate">{m.itemDescription}</span>
                              <span className="text-[10px] text-[#777b86] uppercase">{m.materialType || 'Chemical'}</span>
                            </div>
                            <span className="text-emerald-800 font-bold text-xs shrink-0">
                              {m.consumed} / {m.qty} {m.uom}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
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
              disabled={activeReturns.length === 0}
              className={`px-6 py-2.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95 ${
                activeReturns.length > 0
                  ? 'bg-[#17191c] hover:bg-black text-[#c09748]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-[#c09748]" />
              <span>
                {isAuthorized && directRestock
                  ? 'Confirm Return & Restock to Batch'
                  : 'Dispatch Return Slip to Stores Desk'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
