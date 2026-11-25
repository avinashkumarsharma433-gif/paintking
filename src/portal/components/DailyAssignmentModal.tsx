import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  User,
  Layers,
  Target,
  AlertCircle,
  Plus,
  PackageCheck,
  FlaskConical,
  Trash2,
  Sparkles,
  Split,
  Palette
} from 'lucide-react';
import { usePortalStore } from '../context/PortalStoreContext';
import { matchesPlant } from '../utils/portalAuth';
import {
  JobCard,
  JobCardOrderLineItem,
  PainterProfile,
  PaintingBooth,
  AssignmentProcessStage,
  AssignmentShiftType,
  PainterAssignment,
  PainterDailyMaterialAllocation,
  PainterBatchTaskLine,
  resolveJobCardInwardParts,
  computeAssignmentBalance
} from '../types/portalTypes';

interface DailyMaterialDraftRow extends PainterDailyMaterialAllocation {
  id: string;
}

interface TaskDraftRow {
  id: string;
  partCode: string;
  partDescription: string;
  colorShade: string;
  dailyTargetQty: number;
}

interface DailyAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterJobCard: JobCard;
  inwardParts?: JobCardOrderLineItem[];
  existingAssignments?: PainterAssignment[];
  availablePainters?: PainterProfile[];
  painters?: PainterProfile[];
  availableBooths?: PaintingBooth[];
  booths?: PaintingBooth[];
  onAssignBatch?: (batchData: {
    masterJobCardNo: string;
    assignmentDate: string;
    shift: AssignmentShiftType | string;
    painterId: string;
    painterName: string;
    boothNumber: string;
    processStage: AssignmentProcessStage;
    taskLines: PainterBatchTaskLine[];
    plannedMaterials?: PainterDailyMaterialAllocation[];
    remarks?: string;
  }) => { success: boolean; error?: string; assignments?: PainterAssignment[]; mrnNo?: string } | void;
  onAssign?: (data: {
    masterJobCardNo: string;
    assignmentDate: string;
    shift: AssignmentShiftType | string;
    painterId: string;
    painterName: string;
    boothNumber: string;
    processStage: AssignmentProcessStage;
    partCode?: string;
    partDescription?: string;
    colorShade?: string;
    dailyTargetQty: number;
    plannedMaterials?: PainterDailyMaterialAllocation[];
    remarks?: string;
  }) => { success: boolean; error?: string } | void;
}

export const DailyAssignmentModal: React.FC<DailyAssignmentModalProps> = ({
  isOpen,
  onClose,
  masterJobCard,
  inwardParts,
  existingAssignments,
  availablePainters,
  painters,
  availableBooths,
  booths,
  onAssignBatch,
  onAssign
}) => {
  const { stockBatches, activePlant } = usePortalStore();
  const safePainters = availablePainters || painters || [];
  const safeBooths = availableBooths || booths || [];

  const availableCompanyBatches = useMemo(
    () =>
      stockBatches.filter(
        b =>
          b.category === 'COMPANY_CONSUMABLE' &&
          b.status === 'Available' &&
          Number(b.balanceQty) > 0 &&
          matchesPlant(b.plant, masterJobCard?.plant || activePlant)
      ),
    [stockBatches, masterJobCard, activePlant]
  );

  const partsList = useMemo<JobCardOrderLineItem[]>(() => {
    if (inwardParts && inwardParts.length > 0) return inwardParts;
    return resolveJobCardInwardParts(masterJobCard);
  }, [inwardParts, masterJobCard]);

  const masterBalance = useMemo(
    () => computeAssignmentBalance(masterJobCard, existingAssignments || [], partsList),
    [masterJobCard, existingAssignments, partsList]
  );

  const partBalancesMap = useMemo(() => {
    const map = new Map<string, number>();
    partsList.forEach(p => {
      const bal = computeAssignmentBalance(masterJobCard, existingAssignments || [], partsList, p.partCode);
      map.set(p.partCode.trim().toLowerCase(), bal.balancePending);
    });
    return map;
  }, [masterJobCard, existingAssignments, partsList]);

  const todayDateStr = new Date().toISOString().slice(0, 10);
  const defaultShift: AssignmentShiftType = 'General Day Shift (08:30 - 18:30)';
  const defaultProcessStage: AssignmentProcessStage = 'Full Coating System';
  const defaultCardColor =
    masterJobCard?.color && masterJobCard.color !== 'Multi-Colour / Painter-Wise'
      ? masterJobCard.color
      : '';

  const [selectedPainterId, setSelectedPainterId] = useState<string>(safePainters[0]?.id || '');
  const [selectedBoothName, setSelectedBoothName] = useState<string>(safeBooths[0]?.name || 'Booth #1');
  const [taskRows, setTaskRows] = useState<TaskDraftRow[]>([]);
  const [plannedMaterials, setPlannedMaterials] = useState<DailyMaterialDraftRow[]>([]);
  const [remarks, setRemarks] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const firstPartWithBal =
        partsList.find(p => (partBalancesMap.get(p.partCode.trim().toLowerCase()) || 0) > 0) ||
        partsList[0];
      const initialBal = firstPartWithBal
        ? (partsList.length > 1
            ? (partBalancesMap.get(firstPartWithBal.partCode.trim().toLowerCase()) || 0)
            : masterBalance.masterBalancePending)
        : masterBalance.masterBalancePending;

      setTaskRows([
        {
          id: `trow_${Date.now()}`,
          partCode: firstPartWithBal?.partCode || masterJobCard?.partCode || 'PART-01',
          partDescription: firstPartWithBal?.partDescription || masterJobCard?.partDescription || 'Raw Substrate',
          colorShade: defaultCardColor,
          dailyTargetQty: Math.min(initialBal, 2000)
        }
      ]);
      setErrorMsg(null);
    } else {
      setTaskRows([]);
      setPlannedMaterials([]);
      setRemarks('');
      setErrorMsg(null);
    }
  }, [isOpen, masterJobCard?.jobCardNo]);

  if (!isOpen) return null;

  const selectedPainter =
    safePainters.find(p => p.id === selectedPainterId) ||
    safePainters[0] || { id: 'unknown', name: 'Floor Technician', boothNo: 'Booth #1' };

  const getPartKey = (partCode: string) => partCode.trim().toLowerCase();

  const getPartOrderPending = (partCode: string): number => {
    if (partsList.length <= 1) return masterBalance.masterBalancePending;
    return partBalancesMap.get(getPartKey(partCode)) ?? masterBalance.masterBalancePending;
  };

  const getAllocatedInRowsForPart = (partCode: string, excludeRowId?: string): number => {
    const targetKey = getPartKey(partCode);
    return taskRows.reduce((sum, r) => {
      if (r.id === excludeRowId) return sum;
      return getPartKey(r.partCode) === targetKey ? sum + Number(r.dailyTargetQty || 0) : sum;
    }, 0);
  };

  const getTotalAllocatedInRows = (excludeRowId?: string): number => {
    return taskRows.reduce((sum, r) => (r.id === excludeRowId ? sum : sum + Number(r.dailyTargetQty || 0)), 0);
  };

  const getRemainingForPartInModal = (partCode: string, excludeRowId?: string): number => {
    const partPending = getPartOrderPending(partCode);
    const otherPartAllocated = getAllocatedInRowsForPart(partCode, excludeRowId);
    const otherTotalAllocated = getTotalAllocatedInRows(excludeRowId);
    const masterRemaining = Math.max(0, masterBalance.masterBalancePending - otherTotalAllocated);
    return Math.max(0, Math.min(partPending - otherPartAllocated, masterRemaining));
  };

  const totalBatchQty = getTotalAllocatedInRows();
  const remainingMasterAfterBatch = Math.max(0, masterBalance.masterBalancePending - totalBatchQty);
  const distinctSelectedModels = new Set(taskRows.map(r => getPartKey(r.partCode))).size;
  const distinctEnteredColors: string[] = Array.from(
    new Set<string>(taskRows.map(r => r.colorShade.trim()).filter(Boolean))
  );

  const handleAddModelRow = (partOverride?: JobCardOrderLineItem) => {
    const fallbackPart =
      partOverride ||
      partsList.find(p => getRemainingForPartInModal(p.partCode) > 0) ||
      partsList[0];

    const partCode = fallbackPart?.partCode || masterJobCard?.partCode || 'PART-01';
    const partDescription = fallbackPart?.partDescription || masterJobCard?.partDescription || 'Raw Substrate';
    const avail = getRemainingForPartInModal(partCode);
    const reuseColor = distinctEnteredColors.length === 1 ? distinctEnteredColors[0] : defaultCardColor;

    setTaskRows(prev => [
      ...prev,
      {
        id: `trow_${Date.now()}_${prev.length}`,
        partCode,
        partDescription,
        colorShade: reuseColor,
        dailyTargetQty: avail > 0 ? Math.min(avail, 2000) : 0
      }
    ]);
  };

  const handleSelectAllAvailableModels = () => {
    const newRows: TaskDraftRow[] = [];
    const runningByPart = new Map<string, number>();
    let runningTotal = 0;

    taskRows.forEach(r => {
      const k = getPartKey(r.partCode);
      runningByPart.set(k, (runningByPart.get(k) || 0) + Number(r.dailyTargetQty || 0));
      runningTotal += Number(r.dailyTargetQty || 0);
    });

    const reuseColor = distinctEnteredColors[0] || defaultCardColor;

    partsList.forEach((part, idx) => {
      const k = getPartKey(part.partCode);
      const partPending = getPartOrderPending(part.partCode);
      const alreadyForPart = runningByPart.get(k) || 0;
      const masterAvail = Math.max(0, masterBalance.masterBalancePending - runningTotal);
      const avail = Math.max(0, Math.min(partPending - alreadyForPart, masterAvail));

      if (avail > 0) {
        runningByPart.set(k, alreadyForPart + avail);
        runningTotal += avail;
        newRows.push({
          id: `trow_all_${Date.now()}_${idx}`,
          partCode: part.partCode,
          partDescription: part.partDescription,
          colorShade: reuseColor,
          dailyTargetQty: avail
        });
      }
    });

    if (newRows.length > 0) {
      setTaskRows(prev => {
        const cleanedPrev = prev.filter(r => Number(r.dailyTargetQty) > 0 || r.colorShade.trim());
        return [...cleanedPrev, ...newRows];
      });
    }
  };

  const handleSplitRowColour = (row: TaskDraftRow) => {
    const remaining = getRemainingForPartInModal(row.partCode);
    if (remaining > 0) {
      setTaskRows(prev => {
        const idx = prev.findIndex(r => r.id === row.id);
        const nextRow: TaskDraftRow = {
          id: `trow_split_${Date.now()}`,
          partCode: row.partCode,
          partDescription: row.partDescription,
          colorShade: '',
          dailyTargetQty: remaining
        };
        const copy = [...prev];
        copy.splice(idx + 1, 0, nextRow);
        return copy;
      });
      return;
    }

    // If all pending qty of this part is already sitting in this row, split it 50/50 cleanly
    if (row.dailyTargetQty > 1) {
      const firstHalf = Math.ceil(row.dailyTargetQty / 2);
      const secondHalf = row.dailyTargetQty - firstHalf;
      setTaskRows(prev => {
        const idx = prev.findIndex(r => r.id === row.id);
        const copy = prev.map(r => (r.id === row.id ? { ...r, dailyTargetQty: firstHalf } : r));
        copy.splice(idx + 1, 0, {
          id: `trow_split_${Date.now()}`,
          partCode: row.partCode,
          partDescription: row.partDescription,
          colorShade: '',
          dailyTargetQty: secondHalf
        });
        return copy;
      });
    }
  };

  const handleApplyColorToEmptyRows = (colorVal: string) => {
    if (!colorVal.trim()) return;
    setTaskRows(prev =>
      prev.map(r => (!r.colorShade.trim() ? { ...r, colorShade: colorVal.trim() } : r))
    );
  };

  const handleAddDailyMaterial = (preset?: {
    materialName: string;
    materialType: PainterDailyMaterialAllocation['materialType'];
    qty: number;
    uom: 'Litres' | 'Kg' | 'Pcs';
    stockBatchId?: string;
    batchNumber?: string;
    colour?: string;
  }) => {
    const baseQty = Math.max(1, totalBatchQty || 100);
    const scaledPaint = Math.max(0.5, Number((baseQty * 0.015).toFixed(2)));
    setPlannedMaterials(prev => [
      ...prev,
      {
        id: `dmat_${Date.now()}_${prev.length}`,
        materialName: preset?.materialName ?? '',
        materialType: preset?.materialType ?? 'Base Paint',
        qty: preset?.qty ?? scaledPaint,
        uom: preset?.uom ?? 'Litres',
        stockBatchId: preset?.stockBatchId,
        batchNumber: preset?.batchNumber,
        colour: preset?.colour ?? (distinctEnteredColors.length === 1 ? distinctEnteredColors[0] : undefined)
      }
    ]);
  };

  const handleAutoEstimateMaterials = () => {
    const qtyByColor = new Map<string, { label: string; qty: number }>();
    let totalPcs = 0;

    taskRows.forEach(r => {
      const q = Number(r.dailyTargetQty || 0);
      if (q <= 0) return;
      totalPcs += q;
      const cLabel = r.colorShade.trim();
      const cKey = cLabel.toLowerCase();
      if (cLabel) {
        const prev = qtyByColor.get(cKey);
        if (prev) prev.qty += q;
        else qtyByColor.set(cKey, { label: cLabel, qty: q });
      }
    });

    const effectiveTotal = Math.max(1, totalPcs || masterBalance.masterBalancePending || 100);
    const estimatedRows: DailyMaterialDraftRow[] = [];
    let totalPaintLtr = 0;

    if (qtyByColor.size > 0) {
      Array.from(qtyByColor.values()).forEach((entry, idx) => {
        const paintLtr = Math.max(0.25, Number((entry.qty * 0.012).toFixed(2)));
        totalPaintLtr += paintLtr;
        estimatedRows.push({
          id: `dmat_p_${Date.now()}_${idx}`,
          materialName: `Basecoat 2K PU Paint (${entry.label})`,
          materialType: 'Base Paint',
          qty: paintLtr,
          uom: 'Litres',
          colour: entry.label
        });
      });
    } else {
      const paintLtr = Math.max(0.5, Number((effectiveTotal * 0.012).toFixed(2)));
      totalPaintLtr = paintLtr;
      estimatedRows.push({
        id: `dmat_p_${Date.now()}`,
        materialName: 'Basecoat 2K PU Paint',
        materialType: 'Base Paint',
        qty: paintLtr,
        uom: 'Litres'
      });
    }

    const hardenerLtr = Math.max(0.25, Number((totalPaintLtr * 0.25).toFixed(2)));
    const thinnerLtr = Math.max(0.25, Number((totalPaintLtr * 0.35).toFixed(2)));

    estimatedRows.push(
      {
        id: `dmat_h_${Date.now()}`,
        materialName: '2K PU Hardener',
        materialType: 'Hardener',
        qty: hardenerLtr,
        uom: 'Litres'
      },
      {
        id: `dmat_t_${Date.now()}`,
        materialName: 'PU Thinner 400 Solvent',
        materialType: 'Thinner',
        qty: thinnerLtr,
        uom: 'Litres'
      }
    );

    setPlannedMaterials(estimatedRows);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const activeRows = taskRows.filter(r => Number(r.dailyTargetQty) > 0);
    if (activeRows.length === 0) {
      setErrorMsg('Kam se kam ek Model aur Daily Target Qty (> 0) add karein.');
      return;
    }

    if (activeRows.some(r => !r.colorShade.trim())) {
      setErrorMsg('Har model / split row ke saamne Colour / Shade zaroor fill karein.');
      return;
    }

    if (totalBatchQty > masterBalance.masterBalancePending) {
      setErrorMsg(
        `Total Assigned Qty (${totalBatchQty} pcs) Master Balance Pending (${masterBalance.masterBalancePending} pcs) se zyada hai.`
      );
      return;
    }

    if (partsList.length > 1) {
      const sumByPart = new Map<string, { desc: string; sum: number }>();
      activeRows.forEach(r => {
        const k = getPartKey(r.partCode);
        const prev = sumByPart.get(k);
        if (prev) prev.sum += Number(r.dailyTargetQty);
        else sumByPart.set(k, { desc: r.partDescription, sum: Number(r.dailyTargetQty) });
      });

      for (const [k, info] of sumByPart.entries()) {
        const avail = getPartOrderPending(k);
        if (info.sum > avail) {
          setErrorMsg(
            `${info.desc} ke sabhi splits ka total (${info.sum} pcs) uske pending balance (${avail} pcs) se zyada hai.`
          );
          return;
        }
      }
    }

    if (!selectedPainter) {
      setErrorMsg('Please select an active painter.');
      return;
    }

    const validMaterials: PainterDailyMaterialAllocation[] = plannedMaterials
      .filter(m => m.materialName.trim() && Number(m.qty) > 0)
      .map(({ id: _id, ...rest }) => ({
        ...rest,
        materialName: rest.materialName.trim(),
        qty: Number(rest.qty)
      }));

    if (validMaterials.length === 0) {
      setErrorMsg('Aaj ke kaam ke liye kam se kam ek Company Material (Paint / Thinner / Hardener) mention karein.');
      return;
    }

    const taskLines: PainterBatchTaskLine[] = activeRows.map(r => ({
      partCode: r.partCode,
      partDescription: r.partDescription,
      colorShade: r.colorShade.trim(),
      dailyTargetQty: Number(r.dailyTargetQty)
    }));

    if (onAssignBatch) {
      const res = onAssignBatch({
        masterJobCardNo: masterJobCard.jobCardNo,
        assignmentDate: todayDateStr,
        shift: defaultShift,
        painterId: selectedPainter.id,
        painterName: selectedPainter.name,
        boothNumber: selectedBoothName,
        processStage: defaultProcessStage,
        taskLines,
        plannedMaterials: validMaterials,
        remarks: remarks.trim() || undefined
      });
      if (!res || res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to create painter task assignments.');
      }
      return;
    }

    if (onAssign) {
      const primary = taskLines[0];
      const res = onAssign({
        masterJobCardNo: masterJobCard.jobCardNo,
        assignmentDate: todayDateStr,
        shift: defaultShift,
        painterId: selectedPainter.id,
        painterName: selectedPainter.name,
        boothNumber: selectedBoothName,
        processStage: defaultProcessStage,
        partCode: primary.partCode,
        partDescription: primary.partDescription,
        colorShade: primary.colorShade,
        dailyTargetQty: primary.dailyTargetQty,
        plannedMaterials: validMaterials,
        remarks: remarks.trim() || undefined
      });
      if (!res || res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to create daily assignment.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#fafafb] flex flex-col w-screen h-dvh overflow-hidden text-xs animate-in fade-in duration-150">
      {/* Sticky Full-Screen Top Header */}
      <header className="shrink-0 bg-white border-b border-[#ececec] px-4 sm:px-8 py-3 sm:py-4 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c09748] shrink-0" />
              <span className="text-[10px] sm:text-[10.5px] font-mono font-bold text-[#8a6521] uppercase tracking-wider truncate">
                TIER-2 DAILY TASK ALLOCATION
              </span>
            </div>
            <h3 className="text-lg sm:text-2xl font-serif font-normal text-[#17191c] tracking-tight mt-0.5 truncate">
              Assign Daily Target to Painter
            </h3>
            <p className="text-[11px] sm:text-xs text-[#777b86] mt-0.5 truncate">
              Master Order: <strong className="text-[#17191c]">{masterJobCard.jobCardNo}</strong> • {masterJobCard.customer} (
              {partsList.length > 1
                ? `${partsList.length} Material Types`
                : (partsList[0]?.partDescription || masterJobCard.partDescription)}
              )
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition shadow-2xs shrink-0 active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Form wrapping Scrollable Body + Sticky Bottom Footer */}
      <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 overflow-y-auto px-3 sm:px-8 py-4 sm:py-6">
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Balance Status Card */}
            <div className="p-3 sm:p-4 rounded-[20px] bg-white border border-[#ececec] shadow-2xs space-y-2">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div>
                  <span className="text-[9.5px] sm:text-[10px] text-[#777b86] block uppercase font-mono">Total Master Order</span>
                  <strong className="text-xs sm:text-base font-bold text-[#17191c] font-mono">
                    {masterBalance.totalOrder.toLocaleString('en-IN')} Pcs
                  </strong>
                </div>
                <div>
                  <span className="text-[9.5px] sm:text-[10px] text-emerald-700 block uppercase font-mono">Completed OK</span>
                  <strong className="text-xs sm:text-base font-bold text-emerald-800 font-mono">
                    {masterBalance.completedOk.toLocaleString('en-IN')} Pcs
                  </strong>
                </div>
                <div>
                  <span className="text-[9.5px] sm:text-[10px] text-amber-700 block uppercase font-mono">Master Pending</span>
                  <strong className="text-xs sm:text-base font-bold text-amber-900 font-mono">
                    {masterBalance.masterBalancePending.toLocaleString('en-IN')} Pcs
                  </strong>
                </div>
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#777b86] font-mono text-center pt-1.5 border-t border-[#f2f2f3] flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                <span>
                  Selected Now: <strong className="text-[#17191c]">{totalBatchQty.toLocaleString('en-IN')} Pcs</strong> ({distinctSelectedModels} Model{distinctSelectedModels !== 1 ? 's' : ''}, {taskRows.length} Task{taskRows.length !== 1 ? 's' : ''})
                </span>
                <span className="hidden sm:inline">•</span>
                <span>
                  Remaining After Assign: <strong className="text-[#8a6521]">{remainingMasterAfterBatch.toLocaleString('en-IN')} Pcs</strong>
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-[14px] bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Auto-Registered Today Date Pill */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-[14px] bg-[#faf7ed] border border-[#f4e5be] text-[10.5px] sm:text-[11px] font-mono">
              <span className="flex items-center gap-1.5 font-bold text-[#8a6521]">
                <Calendar className="w-3.5 h-3.5 text-[#c09748] shrink-0" />
                <span>Working Date: {todayDateStr} (Auto-Today)</span>
              </span>
              <span className="text-[#777b86]">Single Day Shift • All 3 Stages</span>
            </div>

          {/* Row 1: Painter & Booth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#17191c] flex items-center gap-1 font-mono">
                <User className="w-3.5 h-3.5 text-[#c09748]" />
                <span>1. Assigned Floor Painter *</span>
              </label>
              <select
                value={selectedPainterId}
                onChange={e => setSelectedPainterId(e.target.value)}
                className="w-full h-10 px-3 rounded-[14px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-xs font-bold text-[#17191c] focus:border-[#c09748] focus:outline-none shadow-2xs"
              >
                {safePainters.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code || 'PTR'}) • {p.boothNo?.split('(')[0] || 'Line'}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#17191c] flex items-center gap-1 font-mono">
                <Layers className="w-3.5 h-3.5 text-[#c09748]" />
                <span>2. Spray Booth / Conveyor Line *</span>
              </label>
              <select
                value={selectedBoothName}
                onChange={e => setSelectedBoothName(e.target.value)}
                className="w-full h-10 px-3 rounded-[14px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-xs font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none shadow-2xs"
              >
                {safeBooths.map(b => (
                  <option key={b.id} value={b.name}>
                    {b.name} ({b.type})
                  </option>
                ))}
                {safeBooths.length === 0 && (
                  <option value="Booth #1 (Continuous Conveyor Line)">Booth #1 (Continuous Conveyor Line)</option>
                )}
              </select>
            </div>
          </div>

          {/* Section 3: Multi-Model & Colour Split Task Builder */}
          <div className="p-4 rounded-[18px] bg-[#fafafb] border border-[#ececec] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#ececec]">
              <div>
                <label className="text-[11px] font-bold text-[#17191c] flex items-center gap-1.5 font-mono uppercase">
                  <PackageCheck className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>3. Models, Daily Target Qty &amp; Colour Splits *</span>
                </label>
                <p className="text-[10.5px] text-[#777b86] mt-0.5">
                  Ek saath multiple models add karein, ya <strong>&quot;Split Colour&quot;</strong> se ek hi model ko alag colours me divide karein.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {partsList.length > 1 && remainingMasterAfterBatch > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllAvailableModels}
                    className="px-2.5 py-1 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-[10px] font-bold cursor-pointer flex items-center gap-1 transition shadow-2xs active:scale-95"
                  >
                    <Sparkles className="w-3 h-3 text-[#c09748]" />
                    <span>+ Select All Pending ({partsList.length})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleAddModelRow()}
                  disabled={remainingMasterAfterBatch <= 0}
                  className="px-2.5 py-1 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] disabled:opacity-45 text-[#17191c] border border-[#dcdfe4] text-[10px] font-semibold cursor-pointer flex items-center gap-1 transition shadow-2xs active:scale-95"
                >
                  <Plus className="w-3 h-3 text-[#c09748]" />
                  <span>Add Model Row</span>
                </button>
              </div>
            </div>

            {/* Quick Click Model Chips (when multiple inward parts exist) */}
            {partsList.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {partsList.map(part => {
                  const avail = getRemainingForPartInModal(part.partCode);
                  return (
                    <button
                      key={part.partCode}
                      type="button"
                      disabled={avail <= 0}
                      onClick={() => handleAddModelRow(part)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition flex items-center gap-1 ${
                        avail > 0
                          ? 'bg-white hover:bg-[#faf3e0] text-[#17191c] border-[#dcdfe4] hover:border-[#f4e5be] cursor-pointer'
                          : 'bg-[#f2f2f3] text-[#777b86] border-[#ececec] opacity-75 cursor-default'
                      }`}
                    >
                      <span>{avail > 0 ? `+ ${part.partDescription}` : `✓ ${part.partDescription}`}</span>
                      <span className="font-mono text-[9.5px] text-[#8a6521]">
                        {avail > 0 ? `(${avail} Bal)` : '(Full)'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Quick Colour Reuse Strip */}
            {taskRows.length > 1 && distinctEnteredColors.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-mono font-bold text-[#777b86] flex items-center gap-1">
                  <Palette className="w-3 h-3 text-[#c09748]" />
                  <span>Quick Apply Colour to Empty Rows:</span>
                </span>
                {distinctEnteredColors.map(clr => (
                  <button
                    key={clr}
                    type="button"
                    onClick={() => handleApplyColorToEmptyRows(clr)}
                    className="px-2 py-0.5 rounded-full bg-white hover:bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-semibold cursor-pointer transition"
                  >
                    Fill Empty: {clr}
                  </button>
                ))}
              </div>
            )}

            {/* Dynamic Task Rows */}
            <div className="space-y-2 p-1">
              {taskRows.map((row, idx) => {
                const maxForRow = getRemainingForPartInModal(row.partCode, row.id);
                const canSplit =
                  getRemainingForPartInModal(row.partCode) > 0 || Number(row.dailyTargetQty) > 1;

                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-2 sm:grid-cols-12 gap-2.5 items-end bg-white p-3 rounded-[16px] border border-[#ececec] shadow-2xs"
                  >
                    {/* Model Picker */}
                    <div className="col-span-2 sm:col-span-5 space-y-1">
                      <label className="text-[10px] font-mono font-bold text-[#777b86] uppercase flex items-center justify-between">
                        <span>Model #{idx + 1}</span>
                        <span className="text-[9.5px] text-[#8a6521]">Max: {maxForRow} Pcs</span>
                      </label>
                      {partsList.length > 1 ? (
                        <select
                          value={row.partCode}
                          onChange={e => {
                            const picked = partsList.find(p => p.partCode === e.target.value);
                            if (!picked) return;
                            const nextMax = getRemainingForPartInModal(picked.partCode, row.id);
                            setTaskRows(prev =>
                              prev.map(r =>
                                r.id === row.id
                                  ? {
                                      ...r,
                                      partCode: picked.partCode,
                                      partDescription: picked.partDescription,
                                      dailyTargetQty:
                                        r.dailyTargetQty > 0
                                          ? Math.min(r.dailyTargetQty, nextMax)
                                          : nextMax
                                    }
                                  : r
                              )
                            );
                          }}
                          className="w-full h-9 px-2.5 rounded-[12px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-xs font-bold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                        >
                          {partsList.map(p => (
                            <option key={p.partCode} value={p.partCode}>
                              {p.partDescription} ({p.partCode}) — Bal: {getPartOrderPending(p.partCode)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full h-9 px-2.5 rounded-[12px] border border-[#ececec] bg-[#fafafb] text-xs font-semibold text-[#17191c] flex items-center justify-between gap-2">
                          <span className="truncate">{row.partDescription}</span>
                          <span className="font-mono text-[10px] text-[#777b86] shrink-0">{row.partCode}</span>
                        </div>
                      )}
                    </div>

                    {/* Qty Input */}
                    <div className="col-span-1 sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-mono font-bold text-[#777b86] uppercase block">
                        Qty (Pcs) *
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={Math.max(1, maxForRow)}
                        value={row.dailyTargetQty === 0 ? '' : row.dailyTargetQty}
                        onChange={e => {
                          const raw = e.target.value;
                          if (raw === '') {
                            setTaskRows(prev => prev.map(r => (r.id === row.id ? { ...r, dailyTargetQty: 0 } : r)));
                            return;
                          }
                          const parsed = Math.max(0, Math.floor(Number(raw) || 0));
                          setTaskRows(prev =>
                            prev.map(r =>
                              r.id === row.id ? { ...r, dailyTargetQty: Math.min(maxForRow, parsed) } : r
                            )
                          );
                        }}
                        className="w-full h-9 px-2.5 rounded-[12px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-xs font-mono font-bold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                      />
                    </div>

                    {/* Colour / Shade Input */}
                    <div className="col-span-1 sm:col-span-3 space-y-1">
                      <label className="text-[10px] font-mono font-bold text-[#777b86] uppercase block">
                        Colour / Shade *
                      </label>
                      <input
                        type="text"
                        required
                        value={row.colorShade}
                        onChange={e =>
                          setTaskRows(prev =>
                            prev.map(r => (r.id === row.id ? { ...r, colorShade: e.target.value } : r))
                          )
                        }
                        placeholder="e.g. Black / Red"
                        className="w-full h-9 px-2.5 rounded-[12px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-xs font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                      />
                    </div>

                    {/* Row Actions: Split Colour + Delete */}
                    <div className="col-span-2 sm:col-span-2 flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        disabled={!canSplit}
                        onClick={() => handleSplitRowColour(row)}
                        title="Split this model into another colour row"
                        className="h-9 px-2.5 rounded-full bg-[#faf7ed] hover:bg-[#faf3e0] disabled:opacity-40 text-[#8a6521] border border-[#f4e5be] text-[10.5px] font-bold cursor-pointer flex items-center gap-1 transition"
                      >
                        <Split className="w-3 h-3 text-[#c09748]" />
                        <span>Split</span>
                      </button>

                      {taskRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setTaskRows(prev => prev.filter(r => r.id !== row.id))}
                          title="Remove row"
                          className="w-9 h-9 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center cursor-pointer transition shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Daily Company Materials (Today's Basis Only) */}
          <div className="p-4 rounded-[18px] bg-[#faf7ed]/70 border border-[#f4e5be] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#f4e5be]">
              <div>
                <label className="text-[11px] font-bold text-[#8a6521] flex items-center gap-1.5 font-mono uppercase">
                  <FlaskConical className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>4. Daily Company Materials (Today&apos;s Basis Only) *</span>
                </label>
                <p className="text-[10.5px] text-[#777b86] mt-0.5">
                  Aaj ke {totalBatchQty || 0} Pcs ({distinctEnteredColors.length || 1} colour) ke liye Paints, Thinners &amp; Hardeners — Store ko Floor Demand jayegi.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAutoEstimateMaterials}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-bold cursor-pointer flex items-center gap-1 transition shadow-2xs active:scale-95"
                >
                  <Sparkles className="w-3 h-3 text-[#c09748]" />
                  <span>Auto-Estimate ({totalBatchQty || 0} Pcs)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddDailyMaterial()}
                  className="px-2.5 py-1 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-[10px] font-semibold cursor-pointer flex items-center gap-1 transition shadow-2xs active:scale-95"
                >
                  <Plus className="w-3 h-3 text-[#c09748]" />
                  <span>Add Item</span>
                </button>
              </div>
            </div>

            {/* Quick Presets + Available Store Stock Pickers */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                {
                  label: '+ Basecoat PU Paint',
                  materialName: distinctEnteredColors[0] ? `Basecoat 2K PU Paint (${distinctEnteredColors[0]})` : 'Basecoat 2K PU Paint',
                  materialType: 'Base Paint' as const,
                  qty: Math.max(0.5, Number(((totalBatchQty || 100) * 0.012).toFixed(2))),
                  uom: 'Litres' as const,
                  colour: distinctEnteredColors[0]
                },
                {
                  label: '+ 2K PU Hardener',
                  materialName: '2K PU Hardener',
                  materialType: 'Hardener' as const,
                  qty: Math.max(0.25, Number(((totalBatchQty || 100) * 0.003).toFixed(2))),
                  uom: 'Litres' as const
                },
                {
                  label: '+ PU Thinner 400',
                  materialName: 'PU Thinner 400 Solvent',
                  materialType: 'Thinner' as const,
                  qty: Math.max(0.25, Number(((totalBatchQty || 100) * 0.004).toFixed(2))),
                  uom: 'Litres' as const
                },
                {
                  label: '+ 2K Clear Coat',
                  materialName: '2K Clear Lacquer Topcoat',
                  materialType: 'Topcoat' as const,
                  qty: Math.max(0.5, Number(((totalBatchQty || 100) * 0.01).toFixed(2))),
                  uom: 'Litres' as const
                }
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleAddDailyMaterial(preset)}
                  className="px-2.5 py-0.5 rounded-full bg-white hover:bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-semibold cursor-pointer transition"
                >
                  {preset.label}
                </button>
              ))}
              {availableCompanyBatches.slice(0, 4).map(batch => (
                <button
                  key={batch.batchId}
                  type="button"
                  onClick={() =>
                    handleAddDailyMaterial({
                      materialName: batch.itemName,
                      materialType:
                        batch.materialType === 'hardener'
                          ? 'Hardener'
                          : batch.materialType === 'thinner'
                            ? 'Thinner'
                            : batch.materialType === 'clear_coat'
                              ? 'Topcoat'
                              : 'Base Paint',
                      qty: Math.min(batch.balanceQty, Math.max(0.5, Number(((totalBatchQty || 100) * 0.01).toFixed(2)))),
                      uom: batch.uom === 'Kg' || batch.uom === 'Pcs' ? batch.uom : 'Litres',
                      stockBatchId: batch.batchId,
                      batchNumber: batch.supplierBatchNo
                    })
                  }
                  className="px-2.5 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-semibold cursor-pointer transition"
                  title={`Store Avail: ${batch.balanceQty} ${batch.uom} (${batch.supplierBatchNo})`}
                >
                  Store: {batch.itemName} ({batch.balanceQty} {batch.uom})
                </button>
              ))}
            </div>

            {plannedMaterials.length === 0 ? (
              <div className="p-3 rounded-[14px] bg-white border border-dashed border-[#f4e5be] text-center text-[11px] text-[#777b86]">
                Upar se quick presets ya <strong>&quot;Auto-Estimate&quot;</strong> click karein, ya <strong>&quot;Add Item&quot;</strong> se aaj ka exact chemical quantity add karein.
              </div>
            ) : (
              <div className="space-y-2 p-1">
                {plannedMaterials.map((mat, idx) => (
                  <div
                    key={mat.id}
                    className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-[14px] border border-[#ececec]"
                  >
                    <div className="col-span-2 sm:col-span-3">
                      <select
                        value={mat.materialType}
                        onChange={e =>
                          setPlannedMaterials(prev =>
                            prev.map((r, rIdx) =>
                              rIdx === idx ? { ...r, materialType: e.target.value as PainterDailyMaterialAllocation['materialType'] } : r
                            )
                          )
                        }
                        className="w-full h-9 px-2 rounded-[10px] border border-[#dcdfe4] bg-[#fafafb] text-[11px] font-semibold text-[#17191c]"
                      >
                        <option value="Base Paint">Base Paint</option>
                        <option value="Topcoat">Topcoat</option>
                        <option value="Hardener">Hardener</option>
                        <option value="Thinner">Thinner</option>
                        <option value="Cleaning Solvent">Cleaning Solvent</option>
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-4 space-y-1">
                      <input
                        type="text"
                        required
                        value={mat.materialName}
                        onChange={e =>
                          setPlannedMaterials(prev =>
                            prev.map((r, rIdx) => (rIdx === idx ? { ...r, materialName: e.target.value } : r))
                          )
                        }
                        placeholder="Chemical / Paint Name *"
                        className="w-full h-9 px-2.5 rounded-[10px] border border-[#dcdfe4] bg-[#fafafb] text-xs font-semibold text-[#17191c]"
                      />
                      {distinctEnteredColors.length > 1 && (mat.materialType === 'Base Paint' || mat.materialType === 'Topcoat') && (
                        <select
                          value={mat.colour || ''}
                          onChange={e =>
                            setPlannedMaterials(prev =>
                              prev.map((r, rIdx) => (rIdx === idx ? { ...r, colour: e.target.value || undefined } : r))
                            )
                          }
                          className="w-full h-7 px-2 rounded-[8px] border border-[#f4e5be] bg-[#faf7ed] text-[10px] font-semibold text-[#8a6521]"
                        >
                          <option value="">Shared across all colours</option>
                          {distinctEnteredColors.map(c => (
                            <option key={c} value={c}>
                              For Colour: {c}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <input
                        type="number"
                        required
                        min="0.1"
                        step="0.1"
                        value={mat.qty}
                        onChange={e =>
                          setPlannedMaterials(prev =>
                            prev.map((r, rIdx) => (rIdx === idx ? { ...r, qty: Math.max(0, Number(e.target.value)) } : r))
                          )
                        }
                        placeholder="Qty"
                        className="w-full h-9 px-2.5 rounded-[10px] border border-[#dcdfe4] bg-[#fafafb] text-xs font-mono font-bold text-[#17191c]"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <select
                        value={mat.uom}
                        onChange={e =>
                          setPlannedMaterials(prev =>
                            prev.map((r, rIdx) => (rIdx === idx ? { ...r, uom: e.target.value as 'Litres' | 'Kg' | 'Pcs' } : r))
                          )
                        }
                        className="w-full h-9 px-2 rounded-[10px] border border-[#dcdfe4] bg-[#fafafb] text-xs font-mono text-[#17191c]"
                      >
                        <option value="Litres">Ltr</option>
                        <option value="Kg">Kg</option>
                        <option value="Pcs">Pcs</option>
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setPlannedMaterials(prev => prev.filter((_, rIdx) => rIdx !== idx))}
                        className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center cursor-pointer transition"
                        title="Remove Chemical"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Remarks */}
          <div className="p-4 rounded-[20px] bg-white border border-[#ececec] shadow-2xs space-y-1.5">
            <label className="text-[11px] font-bold text-[#17191c] font-mono">
              5. Remarks / Floor Instructions (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Day 1 target, maintain 25 microns DFT"
              className="w-full h-10 px-3.5 rounded-[14px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none shadow-2xs"
            />
          </div>
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <footer className="shrink-0 bg-white border-t border-[#ececec] px-4 sm:px-8 py-3 sm:py-3.5 shadow-xs">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="hidden sm:inline text-[10.5px] font-mono text-[#777b86]">
              Exact Store Floor Demand auto-generated on save
            </span>
            <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold cursor-pointer shadow-2xs active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={masterBalance.masterBalancePending <= 0 || totalBatchQty <= 0 || totalBatchQty > masterBalance.masterBalancePending}
                className="flex-1 sm:flex-initial justify-center px-5 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-95"
              >
                <Target className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  Assign {taskRows.length} Task{taskRows.length !== 1 ? 's' : ''} ({totalBatchQty.toLocaleString('en-IN')} Pcs) &amp; Send Floor Demand
                </span>
              </button>
            </div>
          </div>
        </footer>
      </form>
    </div>
  );
};
