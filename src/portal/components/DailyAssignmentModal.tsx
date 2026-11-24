import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, User, Layers, Target, AlertCircle, Plus, PackageCheck, FlaskConical, Trash2, Sparkles } from 'lucide-react';
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
  resolveJobCardInwardParts,
  computeAssignmentBalance
} from '../types/portalTypes';

interface DailyMaterialDraftRow extends PainterDailyMaterialAllocation {
  id: string;
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
  onAssign: (data: {
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

  const [selectedPartCode, setSelectedPartCode] = useState<string>(() => partsList[0]?.partCode || '');

  useEffect(() => {
    if (isOpen && partsList.length > 0) {
      const stillValid = partsList.some(p => p.partCode === selectedPartCode);
      if (!stillValid) {
        setSelectedPartCode(partsList[0].partCode);
      }
    }
  }, [isOpen, partsList, selectedPartCode]);

  const {
    totalOrder,
    completedOk: currentCompleted,
    balancePending,
    masterBalancePending,
    isPartScoped,
    selectedPart
  } = useMemo(
    () => computeAssignmentBalance(masterJobCard, existingAssignments || [], partsList, selectedPartCode),
    [masterJobCard, existingAssignments, partsList, selectedPartCode]
  );

  const todayDateStr = new Date().toISOString().slice(0, 10);
  const defaultShift: AssignmentShiftType = 'General Day Shift (08:30 - 18:30)';
  const defaultProcessStage: AssignmentProcessStage = 'Full Coating System';
  const [selectedPainterId, setSelectedPainterId] = useState<string>(safePainters[0]?.id || '');
  const [selectedBoothName, setSelectedBoothName] = useState<string>(safeBooths[0]?.name || 'Booth #1');
  const [colorShade, setColorShade] = useState<string>(masterJobCard?.color && masterJobCard.color !== 'Multi-Colour / Painter-Wise' ? masterJobCard.color : '');
  const [targetQty, setTargetQty] = useState<number>(() => Math.min(balancePending, 2000));
  const [plannedMaterials, setPlannedMaterials] = useState<DailyMaterialDraftRow[]>([]);
  const [remarks, setRemarks] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTargetQty(prev => {
        if (prev <= 0 && balancePending > 0) return Math.min(balancePending, 2000);
        return Math.min(balancePending, prev);
      });
    } else {
      setPlannedMaterials([]);
      setErrorMsg(null);
    }
  }, [isOpen, balancePending]);

  if (!isOpen) return null;

  const selectedPainter = safePainters.find(p => p.id === selectedPainterId) || safePainters[0] || { id: 'unknown', name: 'Floor Technician', boothNo: 'Booth #1' };

  const handleAddDailyMaterial = (preset?: {
    materialName: string;
    materialType: PainterDailyMaterialAllocation['materialType'];
    qty: number;
    uom: 'Litres' | 'Kg' | 'Pcs';
    stockBatchId?: string;
    batchNumber?: string;
  }) => {
    const scaledPaint = Math.max(0.5, Number(((targetQty || 100) * 0.015).toFixed(2)));
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
        colour: colorShade.trim() || undefined
      }
    ]);
  };

  const handleAutoEstimateMaterials = () => {
    const qty = Math.max(1, targetQty || balancePending || 100);
    const paintLtr = Math.max(0.5, Number((qty * 0.012).toFixed(2)));
    const hardenerLtr = Math.max(0.25, Number((paintLtr * 0.25).toFixed(2)));
    const thinnerLtr = Math.max(0.25, Number((paintLtr * 0.35).toFixed(2)));
    setPlannedMaterials([
      {
        id: `dmat_p_${Date.now()}`,
        materialName: colorShade.trim() ? `Basecoat 2K PU Paint (${colorShade.trim()})` : 'Basecoat 2K PU Paint',
        materialType: 'Base Paint',
        qty: paintLtr,
        uom: 'Litres',
        colour: colorShade.trim() || undefined
      },
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
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (targetQty <= 0) {
      setErrorMsg('Daily Party Material Qty must be greater than zero.');
      return;
    }

    if (targetQty > balancePending) {
      setErrorMsg(`Target Quantity (${targetQty} pcs) exceeds pending balance (${balancePending} pcs).`);
      return;
    }

    if (!selectedPainter) {
      setErrorMsg('Please select an active painter.');
      return;
    }

    if (!colorShade.trim()) {
      setErrorMsg('Please specify the colour / shade for this painter assignment.');
      return;
    }

    const validMaterials: PainterDailyMaterialAllocation[] = plannedMaterials
      .filter(m => m.materialName.trim() && Number(m.qty) > 0)
      .map(({ id: _id, ...rest }) => ({
        ...rest,
        materialName: rest.materialName.trim(),
        qty: Number(rest.qty),
        colour: rest.colour || colorShade.trim()
      }));

    if (validMaterials.length === 0) {
      setErrorMsg('Aaj ke kaam ke liye kam se kam ek Company Material (Paint / Thinner / Hardener) mention karein.');
      return;
    }

    const activePart = selectedPart || partsList[0];
    const res = onAssign({
      masterJobCardNo: masterJobCard.jobCardNo,
      assignmentDate: todayDateStr,
      shift: defaultShift,
      painterId: selectedPainter.id,
      painterName: selectedPainter.name,
      boothNumber: selectedBoothName,
      processStage: defaultProcessStage,
      partCode: activePart?.partCode || masterJobCard.partCode,
      partDescription: activePart?.partDescription || masterJobCard.partDescription,
      colorShade: colorShade.trim(),
      dailyTargetQty: Number(targetQty),
      plannedMaterials: validMaterials,
      remarks: remarks.trim() || undefined
    });

    if (!res || res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to create daily assignment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-[#ececec] space-y-5 text-xs relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#ececec]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c09748]" />
              <span className="text-[10.5px] font-mono font-bold text-[#8a6521] uppercase tracking-wider">
                TIER-2 DAILY TASK ALLOCATION
              </span>
            </div>
            <h3 className="text-xl font-serif font-normal text-[#17191c] tracking-tight mt-0.5">
              Assign Daily Target to Painter
            </h3>
            <p className="text-xs text-[#777b86] mt-0.5">
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
            className="w-8 h-8 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] flex items-center justify-center cursor-pointer transition shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Balance Status Card */}
        <div className="p-3 rounded-[16px] bg-[#fafafb] border border-[#ececec] space-y-1.5">
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div>
              <span className="text-[10px] text-[#777b86] block uppercase font-mono">
                {isPartScoped ? 'Part Order Qty' : 'Total Order'}
              </span>
              <strong className="text-sm font-bold text-[#17191c] font-mono">{totalOrder.toLocaleString()} Pcs</strong>
            </div>
            <div>
              <span className="text-[10px] text-emerald-700 block uppercase font-mono">Completed OK</span>
              <strong className="text-sm font-bold text-emerald-800 font-mono">{currentCompleted.toLocaleString()} Pcs</strong>
            </div>
            <div>
              <span className="text-[10px] text-amber-700 block uppercase font-mono">Balance Pending</span>
              <strong className="text-sm font-bold text-amber-900 font-mono">{balancePending.toLocaleString()} Pcs</strong>
            </div>
          </div>
          {isPartScoped && (
            <div className="text-[10px] text-[#777b86] font-mono text-center pt-1 border-t border-[#ececec]">
              Selected Material: <strong className="text-[#17191c]">{selectedPart?.partDescription} ({selectedPart?.partCode})</strong> • Master Balance Remaining: <strong className="text-[#17191c]">{masterBalancePending.toLocaleString()} Pcs</strong>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-[14px] bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Auto-Registered Today Date Pill */}
          <div className="flex items-center justify-between px-3.5 py-2 rounded-[14px] bg-[#faf7ed] border border-[#f4e5be] text-[11px] font-mono">
            <span className="flex items-center gap-1.5 font-bold text-[#8a6521]">
              <Calendar className="w-3.5 h-3.5 text-[#c09748]" />
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

          {/* Row 2: Part / Material Selection */}
          {partsList.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#17191c] flex items-center gap-1 font-mono">
                  <PackageCheck className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>3. Part / Material Type ({partsList.length > 1 ? 'Select Inward Type *' : 'Inward Substrate'})</span>
                </label>
                {partsList.length > 1 && (
                  <span className="text-[10px] font-mono text-[#8a6521] font-bold">
                    {partsList.length} Types in Inward
                  </span>
                )}
              </div>
              {partsList.length > 1 ? (
                <select
                  value={selectedPartCode}
                  onChange={e => setSelectedPartCode(e.target.value)}
                  className="w-full h-10 px-3 rounded-[14px] border border-[#f4e5be] bg-[#faf7ed] hover:bg-white focus:bg-white text-xs font-bold text-[#17191c] focus:border-[#c09748] focus:outline-none shadow-2xs"
                >
                  {partsList.map(part => {
                    const partBal = computeAssignmentBalance(masterJobCard, existingAssignments || [], partsList, part.partCode);
                    return (
                      <option key={part.partCode} value={part.partCode}>
                        {part.partDescription} ({part.partCode}) — Order: {part.targetQty.toLocaleString('en-IN')} Pcs • Bal: {partBal.balancePending.toLocaleString('en-IN')} Pcs
                      </option>
                    );
                  })}
                </select>
              ) : (
                <div className="w-full min-h-10 px-3.5 py-2 rounded-[14px] border border-[#ececec] bg-[#fafafb] text-xs font-semibold text-[#17191c] flex items-center justify-between gap-2">
                  <span>{partsList[0].partDescription}</span>
                  <span className="font-mono text-[11px] text-[#777b86]">{partsList[0].partCode}</span>
                </div>
              )}
            </div>
          )}

          {/* Row 3: Daily Target Qty & Assigned Colour */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#17191c] flex items-center gap-1 font-mono">
                  <Target className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>4. Daily Target Qty (Pcs) *</span>
                </label>
                <span className="text-[10px] text-[#777b86] font-mono">Max: {balancePending} Pcs</span>
              </div>
              <input
                type="number"
                required
                min={balancePending > 0 ? 1 : 0}
                max={balancePending}
                value={targetQty === 0 && balancePending > 0 ? '' : targetQty}
                onChange={e => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setTargetQty(0);
                    return;
                  }
                  const parsed = Math.max(0, Math.floor(Number(raw) || 0));
                  setTargetQty(Math.min(balancePending, parsed));
                }}
                className="w-full h-10 px-3.5 rounded-[14px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-xs font-mono font-bold text-[#17191c] focus:border-[#c09748] focus:outline-none shadow-2xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#17191c] font-mono">
                5. Assigned Colour / Shade *
              </label>
              <input
                type="text"
                required
                value={colorShade}
                onChange={e => setColorShade(e.target.value)}
                placeholder="e.g. Monza Red Gloss, Piano Black, Pearl White"
                className="w-full h-10 px-3.5 rounded-[14px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-xs font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* Row 4: Daily Company Materials (Today's Basis Only) */}
          <div className="p-4 rounded-[18px] bg-[#faf7ed]/70 border border-[#f4e5be] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#f4e5be]">
              <div>
                <label className="text-[11px] font-bold text-[#8a6521] flex items-center gap-1.5 font-mono uppercase">
                  <FlaskConical className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>6. Daily Company Materials (Today&apos;s Basis Only) *</span>
                </label>
                <p className="text-[10.5px] text-[#777b86] mt-0.5">
                  Aaj ke {targetQty || 0} Pcs kaam ke liye zaroori Paints, Thinners &amp; Hardeners — Store ko Floor Demand jayegi.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAutoEstimateMaterials}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-bold cursor-pointer flex items-center gap-1 transition shadow-2xs active:scale-95"
                >
                  <Sparkles className="w-3 h-3 text-[#c09748]" />
                  <span>Auto-Estimate ({targetQty || 0} Pcs)</span>
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
                { label: '+ Basecoat PU Paint', materialName: colorShade.trim() ? `Basecoat 2K PU Paint (${colorShade.trim()})` : 'Basecoat 2K PU Paint', materialType: 'Base Paint' as const, qty: Math.max(0.5, Number(((targetQty || 100) * 0.012).toFixed(2))), uom: 'Litres' as const },
                { label: '+ 2K PU Hardener', materialName: '2K PU Hardener', materialType: 'Hardener' as const, qty: Math.max(0.25, Number(((targetQty || 100) * 0.003).toFixed(2))), uom: 'Litres' as const },
                { label: '+ PU Thinner 400', materialName: 'PU Thinner 400 Solvent', materialType: 'Thinner' as const, qty: Math.max(0.25, Number(((targetQty || 100) * 0.004).toFixed(2))), uom: 'Litres' as const },
                { label: '+ 2K Clear Coat', materialName: '2K Clear Lacquer Topcoat', materialType: 'Topcoat' as const, qty: Math.max(0.5, Number(((targetQty || 100) * 0.01).toFixed(2))), uom: 'Litres' as const }
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
                      qty: Math.min(batch.balanceQty, Math.max(0.5, Number(((targetQty || 100) * 0.01).toFixed(2)))),
                      uom: (batch.uom === 'Kg' || batch.uom === 'Pcs' ? batch.uom : 'Litres'),
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
                  <div key={mat.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-[14px] border border-[#ececec]">
                    <div className="sm:col-span-3">
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
                    <div className="sm:col-span-4">
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
                    </div>
                    <div className="sm:col-span-2">
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
                    <div className="sm:col-span-2">
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
                    <div className="sm:col-span-1 flex justify-end">
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

          {/* Row 5: Remarks */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#17191c] font-mono">
              7. Remarks / Floor Instructions (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Day 1 target, maintain 25 microns DFT"
              className="w-full h-10 px-3.5 rounded-[14px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none shadow-2xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-[#ececec]">
            <span className="text-[10.5px] font-mono text-[#777b86]">
              Exact Store Floor Demand auto-generated on save
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={balancePending <= 0 || targetQty <= 0 || targetQty > balancePending}
                className="px-5 py-2 rounded-full bg-[#c09748] hover:bg-[#a97e35] disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Assign &amp; Send Floor Demand</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
