import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Layers, FlaskConical, Scale, ArrowRight, Save } from 'lucide-react';
import { PainterAssignment, DefectCategory } from '../types/portalTypes';

interface ShiftCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: PainterAssignment;
  onConfirmClose: (
    assignmentId: string,
    completionData: {
      actualCompletedQty: number;
      rejectReworkQty: number;
      scrapQty?: number;
      stageOkQty: number;
      stageReworkQty: number;
      stageScrapQty: number;
      defectCategory?: DefectCategory | string;
      remarks?: string;
    },
    materialReconciliations?: Array<{
      materialName: string;
      materialType: 'Base Paint' | 'Topcoat' | 'Hardener' | 'Thinner' | 'Cleaning Solvent';
      batchNumber?: string;
      issuedQty: number;
      goodReturnedQty: number;
      floorWastageExpiredQty: number;
      uom: 'Litres' | 'Kg' | 'Pcs';
      standardNormPerPiece?: number;
    }>
  ) => { success: boolean; error?: string };
}

export const ShiftCloseModal: React.FC<ShiftCloseModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onConfirmClose
}) => {
  const [actualCompleted, setActualCompleted] = useState<number>(assignment.dailyTargetQty);
  const [rejectRework, setRejectRework] = useState<number>(0);
  const [scrap, setScrap] = useState<number>(0);
  const [defectCat, setDefectCat] = useState<string>('D02');
  const [remarks, setRemarks] = useState<string>('');

  // Material reconciliation states (Base Paint, Hardener, Thinner, Cleaning Solvent)
  const [paintIssued, setPaintIssued] = useState<number>(10);
  const [paintGoodReturn, setPaintGoodReturn] = useState<number>(2);
  const [paintWastage, setPaintWastage] = useState<number>(0.5);

  const [hardenerIssued, setHardenerIssued] = useState<number>(2.5);
  const [hardenerGoodReturn, setHardenerGoodReturn] = useState<number>(0.5);
  const [hardenerWastage, setHardenerWastage] = useState<number>(0.1);

  const [thinnerIssued, setThinnerIssued] = useState<number>(5);
  const [thinnerGoodReturn, setThinnerGoodReturn] = useState<number>(1);
  const [thinnerWastage, setThinnerWastage] = useState<number>(0.2);

  const [cleanerIssued, setCleanerIssued] = useState<number>(2);
  const [cleanerGoodReturn, setCleanerGoodReturn] = useState<number>(0);
  const [cleanerWastage, setCleanerWastage] = useState<number>(0);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time Net Consumed & Per Piece calculations
  const netPaintConsumed = Math.max(0, paintIssued - paintGoodReturn);
  const perPiecePaint = actualCompleted > 0 ? Number((netPaintConsumed / actualCompleted).toFixed(4)) : 0;
  const standardNorm = 0.0040; // 40 ml per piece standard
  const isHighPaintWastage = perPiecePaint > standardNorm * 1.25;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (actualCompleted < 0) {
      setErrorMsg('Completed OK quantity cannot be negative.');
      return;
    }

    const materialReconciliations = [
      {
        materialName: 'PU Base Paint (Coating Substrate)',
        materialType: 'Base Paint' as const,
        issuedQty: Number(paintIssued),
        goodReturnedQty: Number(paintGoodReturn),
        floorWastageExpiredQty: Number(paintWastage),
        uom: 'Litres' as const,
        standardNormPerPiece: 0.0040
      },
      {
        materialName: 'Polyurethane Hardener (Catalyst)',
        materialType: 'Hardener' as const,
        issuedQty: Number(hardenerIssued),
        goodReturnedQty: Number(hardenerGoodReturn),
        floorWastageExpiredQty: Number(hardenerWastage),
        uom: 'Litres' as const,
        standardNormPerPiece: 0.0010
      },
      {
        materialName: 'PU Reactive Thinner',
        materialType: 'Thinner' as const,
        issuedQty: Number(thinnerIssued),
        goodReturnedQty: Number(thinnerGoodReturn),
        floorWastageExpiredQty: Number(thinnerWastage),
        uom: 'Litres' as const,
        standardNormPerPiece: 0.0020
      },
      {
        materialName: 'Cleaning / Gun Washing Solvent',
        materialType: 'Cleaning Solvent' as const,
        issuedQty: Number(cleanerIssued),
        goodReturnedQty: Number(cleanerGoodReturn),
        floorWastageExpiredQty: Number(cleanerWastage),
        uom: 'Litres' as const,
        standardNormPerPiece: 0.0010
      }
    ];

    const res = onConfirmClose(
      assignment.id,
      {
        actualCompletedQty: Number(actualCompleted),
        rejectReworkQty: Number(rejectRework),
        scrapQty: Number(scrap),
        stageOkQty: Number(actualCompleted),
        stageReworkQty: Number(rejectRework),
        stageScrapQty: Number(scrap),
        defectCategory: rejectRework > 0 ? defectCat : undefined,
        remarks: remarks.trim() || undefined
      },
      materialReconciliations
    );

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to close assignment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-[#ececec] space-y-5 text-xs relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#ececec]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span className="text-[10.5px] font-mono font-bold text-emerald-800 uppercase tracking-wider">
                SHIFT CLOSE & MATERIAL RECONCILIATION
              </span>
            </div>
            <h3 className="text-xl font-serif font-normal text-[#17191c] tracking-tight mt-0.5">
              Close Daily Assignment • {assignment.id}
            </h3>
            <p className="text-xs text-[#777b86] mt-0.5">
              Painter: <strong className="text-[#17191c]">{assignment.painterName}</strong> • {assignment.boothNumber} ({assignment.processStage})
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

        {/* Target vs Completed Banner */}
        <div className="grid grid-cols-3 gap-2.5 p-3 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-center">
          <div>
            <span className="text-[10px] text-[#777b86] block uppercase font-mono">Shift Date</span>
            <strong className="text-xs font-bold text-[#17191c] font-mono">{assignment.assignmentDate}</strong>
          </div>
          <div>
            <span className="text-[10px] text-[#777b86] block uppercase font-mono">Assigned Target</span>
            <strong className="text-sm font-bold text-[#8a6521] font-mono">{assignment.dailyTargetQty.toLocaleString()} Pcs</strong>
          </div>
          <div>
            <span className="text-[10px] text-[#777b86] block uppercase font-mono">Operating Shift</span>
            <strong className="text-xs font-bold text-[#17191c] font-mono truncate block">{assignment.shift.split('(')[0]}</strong>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-[14px] bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SECTION 1: PIECE PRODUCTION YIELD */}
          <div className="space-y-2 p-3.5 rounded-[18px] bg-white border border-[#ececec]">
            <h4 className="font-bold text-xs text-[#17191c] flex items-center gap-1.5 font-mono">
              <Layers className="w-4 h-4 text-[#c09748]" />
              <span>1. Physical Production Yield ({assignment.processStage})</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-emerald-800 font-mono">Completed OK Pieces *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={actualCompleted}
                  onChange={e => setActualCompleted(Number(e.target.value))}
                  className="w-full h-10 px-3.5 rounded-[14px] border border-emerald-300 bg-emerald-50/20 text-xs font-mono font-bold text-emerald-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-amber-800 font-mono">Rework / Re-spray Pieces</label>
                <input
                  type="number"
                  min={0}
                  value={rejectRework}
                  onChange={e => setRejectRework(Number(e.target.value))}
                  className="w-full h-10 px-3.5 rounded-[14px] border border-amber-300 bg-amber-50/20 text-xs font-mono font-bold text-amber-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-rose-800 font-mono">Dead Scrap Pieces</label>
                <input
                  type="number"
                  min={0}
                  value={scrap}
                  onChange={e => setScrap(Number(e.target.value))}
                  className="w-full h-10 px-3.5 rounded-[14px] border border-rose-200 bg-rose-50/20 text-xs font-mono font-bold text-rose-900 focus:outline-none"
                />
              </div>
            </div>

            {rejectRework > 0 && (
              <div className="pt-2 space-y-1">
                <label className="text-[11px] font-bold text-[#17191c] font-mono">Main Defect Category for Rework</label>
                <select
                  value={defectCat}
                  onChange={e => setDefectCat(e.target.value)}
                  className="w-full h-9 px-3 rounded-[12px] border border-[#dcdfe4] bg-white text-xs text-[#17191c]"
                >
                  <option value="D01">D01 - Paint Run / Sagging</option>
                  <option value="D02">D02 - Dust Nibs / Foreign Particles</option>
                  <option value="D03">D03 - Orange Peel Texture</option>
                  <option value="D04">D04 - Low Micron / Light Coat</option>
                  <option value="D05">D05 - Color Shade Mismatch</option>
                </select>
              </div>
            )}
          </div>

          {/* SECTION 2: CHEMICAL & CONSUMABLES RECONCILIATION */}
          <div className="space-y-2.5 p-3.5 rounded-[18px] bg-[#fafafb] border border-[#ececec]">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-[#17191c] flex items-center gap-1.5 font-mono">
                <FlaskConical className="w-4 h-4 text-[#c09748]" />
                <span>2. Painter Material Traceability & Floor Consumption (Litres)</span>
              </h4>
              <span className="text-[10px] text-[#777b86] font-mono">Net = Issued - Good Return</span>
            </div>

            {/* Material Grid Header */}
            <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-[#777b86] uppercase font-mono px-2">
              <div className="col-span-4">Consumable</div>
              <div className="col-span-2 text-center">Issued (L)</div>
              <div className="col-span-3 text-center">Good Return (L)</div>
              <div className="col-span-3 text-center">Floor Waste (L)</div>
            </div>

            {/* Base Paint Row */}
            <div className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-[12px] border border-[#ececec]">
              <div className="col-span-4">
                <span className="font-bold text-xs text-[#17191c] block">Base Paint</span>
                <span className="text-[9.5px] text-[#777b86] font-mono">Substrate Color</span>
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={paintIssued}
                  onChange={e => setPaintIssued(Number(e.target.value))}
                  className="w-full h-8 px-2 text-center rounded-[8px] border border-[#dcdfe4] text-xs font-mono font-bold"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={paintGoodReturn}
                  onChange={e => setPaintGoodReturn(Number(e.target.value))}
                  className="w-full h-8 px-2 text-center rounded-[8px] border border-emerald-300 bg-emerald-50/30 text-xs font-mono font-bold text-emerald-800"
                  title="Unmixed paint returned to store"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={paintWastage}
                  onChange={e => setPaintWastage(Number(e.target.value))}
                  className="w-full h-8 px-2 text-center rounded-[8px] border border-rose-300 bg-rose-50/30 text-xs font-mono font-bold text-rose-800"
                  title="Mixed / pot-life expired scrap"
                />
              </div>
            </div>

            {/* Hardener Row */}
            <div className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-[12px] border border-[#ececec]">
              <div className="col-span-4">
                <span className="font-bold text-xs text-[#17191c] block">Hardener</span>
                <span className="text-[9.5px] text-[#777b86] font-mono">Polyurethane Catalyst</span>
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={hardenerIssued}
                  onChange={e => setHardenerIssued(Number(e.target.value))}
                  className="w-full h-8 px-2 text-center rounded-[8px] border border-[#dcdfe4] text-xs font-mono font-bold"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={hardenerGoodReturn}
                  onChange={e => setHardenerGoodReturn(Number(e.target.value))}
                  className="w-full h-8 px-2 text-center rounded-[8px] border border-emerald-300 bg-emerald-50/30 text-xs font-mono font-bold text-emerald-800"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={hardenerWastage}
                  onChange={e => setHardenerWastage(Number(e.target.value))}
                  className="w-full h-8 px-2 text-center rounded-[8px] border border-rose-300 bg-rose-50/30 text-xs font-mono font-bold text-rose-800"
                />
              </div>
            </div>

            {/* Thinner Row */}
            <div className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-[12px] border border-[#ececec]">
              <div className="col-span-4">
                <span className="font-bold text-xs text-[#17191c] block">Thinner</span>
                <span className="text-[9.5px] text-[#777b86] font-mono">Dilution Thinner</span>
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={thinnerIssued}
                  onChange={e => setThinnerIssued(Number(e.target.value))}
                  className="w-full h-8 px-2 text-center rounded-[8px] border border-[#dcdfe4] text-xs font-mono font-bold"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={thinnerGoodReturn}
                  onChange={e => setThinnerGoodReturn(Number(e.target.value))}
                  className="w-full h-8 px-2 text-center rounded-[8px] border border-emerald-300 bg-emerald-50/30 text-xs font-mono font-bold text-emerald-800"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={thinnerWastage}
                  onChange={e => setThinnerWastage(Number(e.target.value))}
                  className="w-full h-8 px-2 text-center rounded-[8px] border border-rose-300 bg-rose-50/30 text-xs font-mono font-bold text-rose-800"
                />
              </div>
            </div>

            {/* Cleaning Solvent Row */}
            <div className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-[12px] border border-[#ececec]">
              <div className="col-span-4">
                <span className="font-bold text-xs text-[#17191c] block">Cleaning Solvent</span>
                <span className="text-[9.5px] text-[#777b86] font-mono">Gun Wash Solvent</span>
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={cleanerIssued}
                  onChange={e => setCleanerIssued(Number(e.target.value))}
                  className="w-full h-8 px-2 text-center rounded-[8px] border border-[#dcdfe4] text-xs font-mono font-bold"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={cleanerGoodReturn}
                  onChange={e => setCleanerGoodReturn(Number(e.target.value))}
                  className="w-full h-8 px-2 text-center rounded-[8px] border border-emerald-300 bg-emerald-50/30 text-xs font-mono font-bold text-emerald-800"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={cleanerWastage}
                  onChange={e => setCleanerWastage(Number(e.target.value))}
                  className="w-full h-8 px-2 text-center rounded-[8px] border border-rose-300 bg-rose-50/30 text-xs font-mono font-bold text-rose-800"
                />
              </div>
            </div>

            {/* Painter Efficiency & High Wastage Metric */}
            <div className="p-2.5 rounded-[12px] bg-white border border-[#ececec] flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-[10px] text-[#777b86] uppercase block">Net Paint Consumption</span>
                <strong>{netPaintConsumed.toFixed(2)} Litres</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#777b86] uppercase block">Litre / Piece Rate</span>
                <strong className={isHighPaintWastage ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                  {perPiecePaint} L/pc {isHighPaintWastage ? '⚠️ High' : '✓ Normal'}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-[#777b86] uppercase block">Good Return Credited</span>
                <strong className="text-emerald-700">{(paintGoodReturn + hardenerGoodReturn + thinnerGoodReturn).toFixed(1)} L to Store</strong>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#17191c] font-mono">Shift Close Remarks / Handover Notes</label>
            <input
              type="text"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Target met on time, booth line washed, Painter absent tomorrow"
              className="w-full h-10 px-3.5 rounded-[14px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none shadow-2xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#ececec]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Submit & Close Shift Assignment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
