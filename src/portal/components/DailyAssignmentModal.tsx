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
  Palette,
  ArrowLeft,
  ArrowRight,
  CheckCircle2
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

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedPainterId, setSelectedPainterId] = useState<string>(safePainters[0]?.id || '');
  const [selectedBoothName, setSelectedBoothName] = useState<string>(safeBooths[0]?.name || 'Booth #1');
  const [taskRows, setTaskRows] = useState<TaskDraftRow[]>([]);
  const [plannedMaterials, setPlannedMaterials] = useState<DailyMaterialDraftRow[]>([]);
  const [remarks, setRemarks] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
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
      setCurrentStep(1);
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

  const validateStep1 = (): boolean => {
    setErrorMsg(null);
    if (masterBalance.masterBalancePending <= 0) {
      setErrorMsg('Is Master Job Card me koi pending balance nahi bacha hai.');
      return false;
    }
    if (!selectedPainter || selectedPainter.id === 'unknown') {
      setErrorMsg('Please select an active floor painter.');
      return false;
    }
    if (!selectedBoothName.trim()) {
      setErrorMsg('Please select a Spray Booth / Conveyor Line.');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    setErrorMsg(null);
    const activeRows = taskRows.filter(r => Number(r.dailyTargetQty) > 0);
    if (activeRows.length === 0) {
      setErrorMsg('Kam se kam ek Model aur Daily Target Qty (> 0) add karein.');
      return false;
    }
    if (activeRows.some(r => !r.colorShade.trim())) {
      setErrorMsg('Har model / split row ke saamne Colour / Shade zaroor fill karein.');
      return false;
    }
    if (totalBatchQty > masterBalance.masterBalancePending) {
      setErrorMsg(
        `Total Assigned Qty (${totalBatchQty} pcs) Master Balance Pending (${masterBalance.masterBalancePending} pcs) se zyada hai.`
      );
      return false;
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
          return false;
        }
      }
    }
    return true;
  };

  const goToStep = (step: 1 | 2 | 3) => {
    if (step === 1) {
      setErrorMsg(null);
      setCurrentStep(1);
      return;
    }
    if (step === 2) {
      if (validateStep1()) setCurrentStep(2);
      return;
    }
    if (validateStep1() && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 1) {
      goToStep(2);
      return;
    }
    if (currentStep === 2) {
      goToStep(3);
      return;
    }
    if (!validateStep1() || !validateStep2()) return;

    const activeRows = taskRows.filter(r => Number(r.dailyTargetQty) > 0);
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

  const allocatedPercent =
    masterBalance.totalOrder > 0
      ? Math.min(100, Math.round(((masterBalance.completedOk + totalBatchQty) / masterBalance.totalOrder) * 100))
      : 0;
  const activeTaskRows = taskRows.filter(r => Number(r.dailyTargetQty) > 0);
  const totalChemicalQty = plannedMaterials.reduce((s, m) => s + Number(m.qty || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-[#fafafb] flex flex-col w-screen h-dvh overflow-hidden text-sm animate-in fade-in duration-150">
      {/* Sticky Full-Screen Top Header + Connected 3-Step Pill Stepper */}
      <header className="shrink-0 bg-white border-b border-[#ececec] px-4 sm:px-8 lg:px-10 py-3.5 sm:py-4 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#c09748] shrink-0" />
                <span className="text-xs font-mono font-bold text-[#8a6521] uppercase tracking-wider truncate">
                  TIER-2 DAILY TASK ALLOCATION • STEP {currentStep} OF 3
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-normal text-[#17191c] tracking-tight mt-0.5 truncate">
                Assign Daily Target to Painter
              </h3>
              <p className="text-xs sm:text-sm text-[#777b86] mt-0.5 truncate">
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
              className="lg:hidden w-10 h-10 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition shadow-2xs shrink-0 active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Connected Pill Stepper + Desktop Close */}
          <div className="flex items-center justify-between lg:justify-end gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
              {[
                { step: 1 as const, label: '1. Job & Painter' },
                { step: 2 as const, label: '2. Material & Colour' },
                { step: 3 as const, label: '3. Company Materials' }
              ].map((item, idx) => {
                const isActive = currentStep === item.step;
                const isDone = currentStep > item.step;

                return (
                  <React.Fragment key={item.step}>
                    {idx > 0 && (
                      <div
                        className={`h-[2px] w-3 sm:w-6 rounded-full shrink-0 ${
                          isDone || isActive ? 'bg-[#c09748]' : 'bg-[#ececec]'
                        }`}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => goToStep(item.step)}
                      className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold cursor-pointer transition flex items-center gap-1.5 shrink-0 border ${
                        isActive
                          ? 'bg-[#faf3e0] text-[#8a6521] border-[#f4e5be] font-bold shadow-2xs'
                          : isDone
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-[#f2f2f3] text-[#777b86] border-[#dcdfe4] hover:bg-white'
                      }`}
                    >
                      {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      <span>{item.label}</span>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="hidden lg:flex w-10 h-10 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] items-center justify-center cursor-pointer transition shadow-2xs shrink-0 active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Form wrapping Two-Column Full-Screen Workspace + Sticky Bottom Footer */}
      <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-10 py-5 sm:py-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT 8-COLUMN MAIN STEP CANVAS */}
            <div className="lg:col-span-8 space-y-5">
              {errorMsg && (
                <div className="p-3.5 rounded-[16px] bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* ============================================================ */}
              {/* PART 1: JOB DETAILS + PAINTER & BOOTH CARDS                  */}
              {/* ============================================================ */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Job Context + Date Strip */}
                  <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#ececec] shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#f2f2f3]">
                      <div>
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8a6521] block">
                          Step 1 • Master Job Card &amp; Shift Details
                        </span>
                        <h4 className="text-lg sm:text-xl font-serif text-[#17191c] font-normal mt-0.5">
                          {masterJobCard.customer} • {masterJobCard.jobCardNo}
                        </h4>
                      </div>
                      <span className="px-3.5 py-1.5 rounded-full bg-[#faf7ed] border border-[#f4e5be] text-xs font-mono font-bold text-[#8a6521] flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#c09748]" />
                        <span>{todayDateStr} (Auto-Today) • Single Day Shift</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
                      <div className="p-3.5 rounded-[18px] bg-[#fafafb] border border-[#ececec]">
                        <span className="text-xs text-[#777b86] block font-medium">Total Order</span>
                        <strong className="text-base sm:text-xl font-serif font-bold text-[#17191c] mt-0.5 block">
                          {masterBalance.totalOrder.toLocaleString('en-IN')} Pcs
                        </strong>
                      </div>
                      <div className="p-3.5 rounded-[18px] bg-emerald-50/60 border border-emerald-200/80">
                        <span className="text-xs text-emerald-700 block font-medium">Completed OK</span>
                        <strong className="text-base sm:text-xl font-serif font-bold text-emerald-800 mt-0.5 block">
                          {masterBalance.completedOk.toLocaleString('en-IN')} Pcs
                        </strong>
                      </div>
                      <div className="p-3.5 rounded-[18px] bg-[#faf7ed] border border-[#f4e5be]">
                        <span className="text-xs text-[#8a6521] block font-medium">Balance Pending</span>
                        <strong className="text-base sm:text-xl font-serif font-bold text-[#8a6521] mt-0.5 block">
                          {masterBalance.masterBalancePending.toLocaleString('en-IN')} Pcs
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Visual Painter Selection Grid */}
                  <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#ececec] shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#f2f2f3]">
                      <label className="text-sm font-bold text-[#17191c] flex items-center gap-2">
                        <User className="w-4 h-4 text-[#c09748]" />
                        <span>1. Select Floor Painter *</span>
                      </label>
                      <span className="text-xs text-[#777b86]">
                        {safePainters.length} Active Painter{safePainters.length !== 1 ? 's' : ''} in Plant
                      </span>
                    </div>

                    {safePainters.length <= 9 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {safePainters.map(p => {
                          const isSelected = selectedPainter.id === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setSelectedPainterId(p.id)}
                              className={`p-3.5 rounded-[18px] border text-left cursor-pointer transition flex items-start justify-between gap-2 ${
                                isSelected
                                  ? 'bg-[#faf7ed] border-[#c09748] ring-2 ring-[#c09748]/20 shadow-2xs'
                                  : 'bg-[#fafafb] hover:bg-white border-[#ececec] hover:border-[#dcdfe4]'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="font-semibold text-sm text-[#17191c] truncate">{p.name}</div>
                                <div className="text-xs text-[#777b86] mt-0.5 truncate">
                                  {p.code || 'PTR'} • {p.boothNo?.split('(')[0] || 'Floor Line'}
                                </div>
                              </div>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-[#c09748] shrink-0 mt-0.5" />}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <select
                        value={selectedPainterId}
                        onChange={e => setSelectedPainterId(e.target.value)}
                        className="w-full h-12 px-4 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-sm font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                      >
                        {safePainters.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.code || 'PTR'}) • {p.boothNo?.split('(')[0] || 'Line'}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Booth Selector */}
                    <div className="pt-2 space-y-2.5">
                      <label className="text-sm font-bold text-[#17191c] flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#c09748]" />
                        <span>2. Select Spray Booth / Conveyor Line *</span>
                      </label>
                      {safeBooths.length > 0 && safeBooths.length <= 6 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {safeBooths.map(b => {
                            const isBoothActive = selectedBoothName === b.name;
                            return (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => setSelectedBoothName(b.name)}
                                className={`p-3.5 rounded-[18px] border text-left cursor-pointer transition flex items-center justify-between gap-2 ${
                                  isBoothActive
                                    ? 'bg-[#faf7ed] border-[#c09748] ring-2 ring-[#c09748]/20'
                                    : 'bg-[#fafafb] hover:bg-white border-[#ececec] hover:border-[#dcdfe4]'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="font-semibold text-sm text-[#17191c] truncate">{b.name}</div>
                                  <div className="text-xs text-[#777b86] truncate">{b.type}</div>
                                </div>
                                {isBoothActive && <CheckCircle2 className="w-4 h-4 text-[#c09748] shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <select
                          value={selectedBoothName}
                          onChange={e => setSelectedBoothName(e.target.value)}
                          className="w-full h-12 px-4 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-sm font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none"
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
                      )}
                    </div>

                    {/* Optional Instructions */}
                    <div className="pt-2 space-y-1.5">
                      <label className="text-xs sm:text-sm font-semibold text-[#17191c] block">
                        3. Floor Instructions / Remarks (Optional)
                      </label>
                      <input
                        type="text"
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                        placeholder="e.g. Day 1 target, maintain 25 microns DFT, double coat on edges"
                        className="w-full h-11 px-4 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-sm text-[#17191c] focus:border-[#c09748] focus:outline-none shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* PART 2: MATERIAL & COLOUR CONFIGURATION                      */}
              {/* ============================================================ */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#ececec] shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#f2f2f3]">
                      <div>
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8a6521] block">
                          Step 2 • Model, Quantity &amp; Colour Allocation
                        </span>
                        <h4 className="text-lg sm:text-xl font-serif text-[#17191c] font-normal mt-0.5 flex items-center gap-2">
                          <PackageCheck className="w-5 h-5 text-[#c09748]" />
                          <span>Select Inward Models &amp; Colour Splits</span>
                        </h4>
                        <p className="text-xs sm:text-sm text-[#777b86] mt-0.5">
                          Multiple models add karein, ya <strong>&quot;Split Colour&quot;</strong> se ek hi model ko alag colours (jaise Black + Red) me divide karein.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {partsList.length > 1 && remainingMasterAfterBatch > 0 && (
                          <button
                            type="button"
                            onClick={handleSelectAllAvailableModels}
                            className="px-3.5 py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs sm:text-sm font-bold cursor-pointer flex items-center gap-1.5 transition shadow-2xs active:scale-95"
                          >
                            <Sparkles className="w-4 h-4 text-[#c09748]" />
                            <span>+ Select All Pending ({partsList.length})</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAddModelRow()}
                          disabled={remainingMasterAfterBatch <= 0}
                          className="px-3.5 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] disabled:opacity-45 text-[#17191c] border border-[#dcdfe4] text-xs sm:text-sm font-semibold cursor-pointer flex items-center gap-1.5 transition shadow-2xs active:scale-95"
                        >
                          <Plus className="w-4 h-4 text-[#c09748]" />
                          <span>Add Model Row</span>
                        </button>
                      </div>
                    </div>

                    {/* Readable Model Chips Grid */}
                    {partsList.length > 1 && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-[#777b86] block">
                          Quick Add from Inward Models ({partsList.length} Types):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {partsList.map(part => {
                            const avail = getRemainingForPartInModal(part.partCode);
                            return (
                              <button
                                key={part.partCode}
                                type="button"
                                disabled={avail <= 0}
                                onClick={() => handleAddModelRow(part)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 ${
                                  avail > 0
                                    ? 'bg-[#fafafb] hover:bg-[#faf3e0] text-[#17191c] border-[#dcdfe4] hover:border-[#f4e5be] cursor-pointer'
                                    : 'bg-[#f2f2f3] text-[#777b86] border-[#ececec] opacity-75 cursor-default'
                                }`}
                              >
                                <span>{avail > 0 ? `+ ${part.partDescription}` : `✓ ${part.partDescription}`}</span>
                                <span className="font-mono text-xs text-[#8a6521]">
                                  {avail > 0 ? `(${avail} Bal)` : '(Full)'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quick Colour Reuse Strip */}
                    {taskRows.length > 1 && distinctEnteredColors.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs font-semibold text-[#777b86] flex items-center gap-1.5">
                          <Palette className="w-4 h-4 text-[#c09748]" />
                          <span>Quick Fill Empty Colour Rows:</span>
                        </span>
                        {distinctEnteredColors.map(clr => (
                          <button
                            key={clr}
                            type="button"
                            onClick={() => handleApplyColorToEmptyRows(clr)}
                            className="px-3 py-1 rounded-full bg-[#faf7ed] hover:bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-xs font-semibold cursor-pointer transition"
                          >
                            Apply &quot;{clr}&quot;
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Spacious Dynamic Task Rows */}
                    <div className="space-y-3 p-1">
                      {taskRows.map((row, idx) => {
                        const maxForRow = getRemainingForPartInModal(row.partCode, row.id);
                        const canSplit =
                          getRemainingForPartInModal(row.partCode) > 0 || Number(row.dailyTargetQty) > 1;

                        return (
                          <div
                            key={row.id}
                            className="grid grid-cols-2 sm:grid-cols-12 gap-3 items-end bg-[#fafafb] p-4 rounded-[18px] border border-[#ececec]"
                          >
                            {/* Model Picker */}
                            <div className="col-span-2 sm:col-span-5 space-y-1.5">
                              <label className="text-xs font-semibold text-[#17191c] flex items-center justify-between">
                                <span>Model #{idx + 1}</span>
                                <span className="font-mono text-xs text-[#8a6521]">Max: {maxForRow} Pcs</span>
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
                                  className="w-full h-11 px-3 rounded-[14px] border border-[#dcdfe4] bg-white text-sm font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                                >
                                  {partsList.map(p => (
                                    <option key={p.partCode} value={p.partCode}>
                                      {p.partDescription} ({p.partCode}) — Bal: {getPartOrderPending(p.partCode)} Pcs
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="w-full h-11 px-3.5 rounded-[14px] border border-[#ececec] bg-white text-sm font-semibold text-[#17191c] flex items-center justify-between gap-2">
                                  <span className="truncate">{row.partDescription}</span>
                                  <span className="font-mono text-xs text-[#777b86] shrink-0">{row.partCode}</span>
                                </div>
                              )}
                            </div>

                            {/* Qty Input */}
                            <div className="col-span-1 sm:col-span-2 space-y-1.5">
                              <label className="text-xs font-semibold text-[#17191c] block">Qty (Pcs) *</label>
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
                                className="w-full h-11 px-3 rounded-[14px] border border-[#dcdfe4] bg-white text-sm font-mono font-bold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                              />
                            </div>

                            {/* Colour / Shade Input */}
                            <div className="col-span-1 sm:col-span-3 space-y-1.5">
                              <label className="text-xs font-semibold text-[#17191c] block">Colour / Shade *</label>
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
                                className="w-full h-11 px-3 rounded-[14px] border border-[#dcdfe4] bg-white text-sm font-medium text-[#17191c] focus:border-[#c09748] focus:outline-none"
                              />
                            </div>

                            {/* Row Actions: Split Colour + Delete */}
                            <div className="col-span-2 sm:col-span-2 flex items-center justify-end gap-2">
                              <button
                                type="button"
                                disabled={!canSplit}
                                onClick={() => handleSplitRowColour(row)}
                                title="Split this model into another colour row"
                                className="h-11 px-3 rounded-full bg-[#faf7ed] hover:bg-[#faf3e0] disabled:opacity-40 text-[#8a6521] border border-[#f4e5be] text-xs font-bold cursor-pointer flex items-center gap-1.5 transition"
                              >
                                <Split className="w-3.5 h-3.5 text-[#c09748]" />
                                <span>Split</span>
                              </button>

                              {taskRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setTaskRows(prev => prev.filter(r => r.id !== row.id))}
                                  title="Remove row"
                                  className="w-11 h-11 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center cursor-pointer transition shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* PART 3: INTERNAL COMPANY MATERIALS                           */}
              {/* ============================================================ */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-[#ececec] shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#f2f2f3]">
                      <div>
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8a6521] block">
                          Step 3 • Store Material Demand (Today&apos;s Basis Only)
                        </span>
                        <h4 className="text-lg sm:text-xl font-serif text-[#17191c] font-normal mt-0.5 flex items-center gap-2">
                          <FlaskConical className="w-5 h-5 text-[#c09748]" />
                          <span>Assign Internal Company Materials *</span>
                        </h4>
                        <p className="text-xs sm:text-sm text-[#777b86] mt-0.5">
                          Aaj ke {totalBatchQty || 0} Pcs ({distinctEnteredColors.length || 1} colour) ke liye Paints, Thinners &amp; Hardeners — Store ko Floor Demand jayegi.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAutoEstimateMaterials}
                          className="px-3.5 py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs sm:text-sm font-bold cursor-pointer flex items-center gap-1.5 transition shadow-2xs active:scale-95"
                        >
                          <Sparkles className="w-4 h-4 text-[#c09748]" />
                          <span>Auto-Estimate ({totalBatchQty || 0} Pcs)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddDailyMaterial()}
                          className="px-3.5 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs sm:text-sm font-semibold cursor-pointer flex items-center gap-1.5 transition shadow-2xs active:scale-95"
                        >
                          <Plus className="w-4 h-4 text-[#c09748]" />
                          <span>Add Item</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Presets + Available Store Stock Pickers */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-[#777b86] block">
                        Quick Chemical Presets &amp; Store Batches:
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
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
                            className="px-3 py-1.5 rounded-full bg-[#faf7ed] hover:bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-xs font-semibold cursor-pointer transition"
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
                            className="px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-mono font-semibold cursor-pointer transition"
                            title={`Store Avail: ${batch.balanceQty} ${batch.uom} (${batch.supplierBatchNo})`}
                          >
                            Store: {batch.itemName} ({batch.balanceQty} {batch.uom})
                          </button>
                        ))}
                      </div>
                    </div>

                    {plannedMaterials.length === 0 ? (
                      <div className="p-6 rounded-[18px] bg-[#fafafb] border border-dashed border-[#dcdfe4] text-center text-sm text-[#777b86]">
                        Upar se <strong>&quot;Auto-Estimate&quot;</strong> click karein (sabhi colours ke hisaab se auto-calculate ho jayega) ya <strong>&quot;Add Item&quot;</strong> se chemicals add karein.
                      </div>
                    ) : (
                      <div className="space-y-2.5 p-1">
                        {plannedMaterials.map((mat, idx) => (
                          <div
                            key={mat.id}
                            className="grid grid-cols-2 sm:grid-cols-12 gap-2.5 items-start bg-[#fafafb] p-3.5 rounded-[18px] border border-[#ececec]"
                          >
                            <div className="col-span-2 sm:col-span-3 space-y-1">
                              <label className="text-xs font-semibold text-[#777b86] block">Type</label>
                              <select
                                value={mat.materialType}
                                onChange={e =>
                                  setPlannedMaterials(prev =>
                                    prev.map((r, rIdx) =>
                                      rIdx === idx ? { ...r, materialType: e.target.value as PainterDailyMaterialAllocation['materialType'] } : r
                                    )
                                  )
                                }
                                className="w-full h-11 px-3 rounded-[12px] border border-[#dcdfe4] bg-white text-xs sm:text-sm font-semibold text-[#17191c]"
                              >
                                <option value="Base Paint">Base Paint</option>
                                <option value="Topcoat">Topcoat</option>
                                <option value="Hardener">Hardener</option>
                                <option value="Thinner">Thinner</option>
                                <option value="Cleaning Solvent">Cleaning Solvent</option>
                              </select>
                            </div>
                            <div className="col-span-2 sm:col-span-4 space-y-1.5">
                              <label className="text-xs font-semibold text-[#777b86] block">Chemical / Paint Name *</label>
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
                                className="w-full h-11 px-3 rounded-[12px] border border-[#dcdfe4] bg-white text-sm font-semibold text-[#17191c]"
                              />
                              {distinctEnteredColors.length > 1 && (mat.materialType === 'Base Paint' || mat.materialType === 'Topcoat') && (
                                <select
                                  value={mat.colour || ''}
                                  onChange={e =>
                                    setPlannedMaterials(prev =>
                                      prev.map((r, rIdx) => (rIdx === idx ? { ...r, colour: e.target.value || undefined } : r))
                                    )
                                  }
                                  className="w-full h-8 px-2.5 rounded-[10px] border border-[#f4e5be] bg-[#faf7ed] text-xs font-semibold text-[#8a6521]"
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
                            <div className="col-span-1 sm:col-span-2 space-y-1">
                              <label className="text-xs font-semibold text-[#777b86] block">Qty *</label>
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
                                className="w-full h-11 px-3 rounded-[12px] border border-[#dcdfe4] bg-white text-sm font-mono font-bold text-[#17191c]"
                              />
                            </div>
                            <div className="col-span-1 sm:col-span-2 space-y-1">
                              <label className="text-xs font-semibold text-[#777b86] block">Unit</label>
                              <select
                                value={mat.uom}
                                onChange={e =>
                                  setPlannedMaterials(prev =>
                                    prev.map((r, rIdx) => (rIdx === idx ? { ...r, uom: e.target.value as 'Litres' | 'Kg' | 'Pcs' } : r))
                                  )
                                }
                                className="w-full h-11 px-2.5 rounded-[12px] border border-[#dcdfe4] bg-white text-sm font-mono text-[#17191c]"
                              >
                                <option value="Litres">Ltr</option>
                                <option value="Kg">Kg</option>
                                <option value="Pcs">Pcs</option>
                              </select>
                            </div>
                            <div className="col-span-2 sm:col-span-1 flex justify-end sm:pt-6">
                              <button
                                type="button"
                                onClick={() => setPlannedMaterials(prev => prev.filter((_, rIdx) => rIdx !== idx))}
                                className="w-10 h-10 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center cursor-pointer transition"
                                title="Remove Chemical"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT 4-COLUMN LIVE ALLOCATION SUMMARY PANEL */}
            <aside className="lg:col-span-4 lg:sticky lg:top-0 space-y-4">
              <div className="p-5 rounded-[24px] bg-white border border-[#ececec] shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f3]">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8a6521]">
                    Live Allocation Ledger
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-xs font-mono font-bold">
                    {allocatedPercent}% Plan
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#777b86]">Selected This Shift</span>
                    <strong className="font-mono text-sm text-[#17191c]">{totalBatchQty.toLocaleString('en-IN')} Pcs</strong>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#f2f2f3] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#c09748] transition-all duration-300"
                      style={{ width: `${allocatedPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#777b86]">
                    <span>Remaining Balance After Save</span>
                    <strong className="font-mono text-[#8a6521]">{remainingMasterAfterBatch.toLocaleString('en-IN')} Pcs</strong>
                  </div>
                </div>

                {/* Step 1 Summary */}
                <div className="p-3.5 rounded-[16px] bg-[#fafafb] border border-[#ececec] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#777b86]">Painter &amp; Line</span>
                    {currentStep !== 1 && (
                      <button
                        type="button"
                        onClick={() => goToStep(1)}
                        className="text-xs font-semibold text-[#8a6521] hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-[#17191c]">{selectedPainter.name}</div>
                  <div className="text-xs text-[#777b86]">{selectedBoothName}</div>
                  {remarks.trim() && (
                    <div className="text-xs text-[#8a6521] pt-1 border-t border-[#ececec] truncate">
                      Note: {remarks.trim()}
                    </div>
                  )}
                </div>

                {/* Step 2 Summary */}
                <div className="p-3.5 rounded-[16px] bg-[#fafafb] border border-[#ececec] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#777b86]">
                      Models &amp; Colours ({activeTaskRows.length})
                    </span>
                    {currentStep !== 2 && (
                      <button
                        type="button"
                        onClick={() => goToStep(2)}
                        className="text-xs font-semibold text-[#8a6521] hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {activeTaskRows.length === 0 ? (
                    <div className="text-xs text-[#777b86]">No models allocated yet.</div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {activeTaskRows.map(r => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-[#17191c] truncate">{r.partDescription}</div>
                            <div className="text-xs text-[#8a6521] truncate">
                              {r.colorShade.trim() || 'Colour pending'}
                            </div>
                          </div>
                          <strong className="font-mono text-[#17191c] shrink-0">
                            {Number(r.dailyTargetQty).toLocaleString('en-IN')} Pcs
                          </strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Step 3 Summary */}
                <div className="p-3.5 rounded-[16px] bg-[#faf7ed] border border-[#f4e5be] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#8a6521]">Store Floor Demand (MRN)</span>
                    <span className="font-mono font-bold text-[#8a6521]">
                      {plannedMaterials.length} Chemical{plannedMaterials.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-xs text-[#777b86]">
                    {plannedMaterials.length > 0
                      ? `Total Chemicals: ${totalChemicalQty.toFixed(2)} Ltr/Kg across ${distinctEnteredColors.length || 1} colour(s)`
                      : 'Step 3 me Paints & Thinners assign honge.'}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <footer className="shrink-0 bg-white border-t border-[#ececec] px-4 sm:px-8 lg:px-10 py-3.5 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="hidden sm:inline text-xs font-mono text-[#777b86]">
              {currentStep === 1 && 'Step 1 of 3 • Review order balance & select Painter / Booth'}
              {currentStep === 2 && 'Step 2 of 3 • Configure inward models, quantities & colour splits'}
              {currentStep === 3 && 'Step 3 of 3 • Consolidated Store Floor Demand (MRN) auto-generated on save'}
            </span>
            <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
              {currentStep === 1 ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs sm:text-sm font-semibold cursor-pointer shadow-2xs active:scale-95"
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => goToStep((currentStep - 1) as 1 | 2)}
                  className="px-5 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs sm:text-sm font-semibold cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}

              {currentStep === 1 && (
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  disabled={masterBalance.masterBalancePending <= 0}
                  className="flex-1 sm:flex-initial justify-center px-6 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition cursor-pointer shadow-2xs flex items-center gap-2 active:scale-95"
                >
                  <span>Next: Material &amp; Colour</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="flex-1 sm:flex-initial justify-center px-6 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-white text-xs sm:text-sm font-bold transition cursor-pointer shadow-2xs flex items-center gap-2 active:scale-95"
                >
                  <span>Next: Company Materials</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {currentStep === 3 && (
                <button
                  type="submit"
                  disabled={masterBalance.masterBalancePending <= 0 || totalBatchQty <= 0 || totalBatchQty > masterBalance.masterBalancePending}
                  className="flex-1 sm:flex-initial justify-center px-6 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition cursor-pointer shadow-2xs flex items-center gap-2 active:scale-95"
                >
                  <Target className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    Assign {activeTaskRows.length} Task{activeTaskRows.length !== 1 ? 's' : ''} ({totalBatchQty.toLocaleString('en-IN')} Pcs) &amp; Send Floor Demand
                  </span>
                </button>
              )}
            </div>
          </div>
        </footer>
      </form>
    </div>
  );
};
