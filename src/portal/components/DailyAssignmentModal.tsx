import React, { useState } from 'react';
import { X, Calendar, User, Clock, Layers, Target, AlertCircle, Plus } from 'lucide-react';
import { JobCard, PainterProfile, PaintingBooth, AssignmentProcessStage, AssignmentShiftType } from '../types/portalTypes';

interface DailyAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterJobCard: JobCard;
  availablePainters: PainterProfile[];
  availableBooths: PaintingBooth[];
  onAssign: (data: {
    masterJobCardNo: string;
    assignmentDate: string;
    shift: AssignmentShiftType | string;
    painterId: string;
    painterName: string;
    boothNumber: string;
    processStage: AssignmentProcessStage;
    dailyTargetQty: number;
    remarks?: string;
  }) => { success: boolean; error?: string };
}

export const DailyAssignmentModal: React.FC<DailyAssignmentModalProps> = ({
  isOpen,
  onClose,
  masterJobCard,
  availablePainters,
  availableBooths,
  onAssign
}) => {
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState<AssignmentShiftType>('General Day Shift (08:30 - 18:30)');
  const [selectedPainterId, setSelectedPainterId] = useState<string>(availablePainters[0]?.id || '');
  const [selectedBoothName, setSelectedBoothName] = useState<string>(availableBooths[0]?.name || 'Booth #1');
  const [processStage, setProcessStage] = useState<AssignmentProcessStage>('Basecoat');
  const [targetQty, setTargetQty] = useState<number>(() => {
    const pending = Math.max(0, masterJobCard.targetQty - (masterJobCard.goodQty || 0));
    return Math.min(pending, 2000);
  });
  const [remarks, setRemarks] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentCompleted = masterJobCard.goodQty || 0;
  const balancePending = Math.max(0, masterJobCard.targetQty - currentCompleted);

  const selectedPainter = availablePainters.find(p => p.id === selectedPainterId) || availablePainters[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (targetQty <= 0) {
      setErrorMsg('Target Quantity must be greater than zero.');
      return;
    }

    if (targetQty > balancePending) {
      setErrorMsg(`Target Quantity (${targetQty} pcs) exceeds Master Job Card pending balance (${balancePending} pcs).`);
      return;
    }

    if (!selectedPainter) {
      setErrorMsg('Please select an active painter.');
      return;
    }

    const res = onAssign({
      masterJobCardNo: masterJobCard.jobCardNo,
      assignmentDate: date,
      shift,
      painterId: selectedPainter.id,
      painterName: selectedPainter.name,
      boothNumber: selectedBoothName,
      processStage,
      dailyTargetQty: Number(targetQty),
      remarks: remarks.trim() || undefined
    });

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to create daily assignment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-[#ececec] space-y-5 text-xs relative max-h-[90vh] overflow-y-auto">
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
              Master Order: <strong className="text-[#17191c]">{masterJobCard.jobCardNo}</strong> • {masterJobCard.customer} ({masterJobCard.partDescription})
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
        <div className="grid grid-cols-3 gap-2.5 p-3 rounded-[16px] bg-[#fafafb] border border-[#ececec] text-center">
          <div>
            <span className="text-[10px] text-[#777b86] block uppercase font-mono">Total Order</span>
            <strong className="text-sm font-bold text-[#17191c] font-mono">{masterJobCard.targetQty.toLocaleString()} Pcs</strong>
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

        {errorMsg && (
          <div className="p-3 rounded-[14px] bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Date & Shift */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#17191c] flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-[#c09748]" />
                <span>1. Assignment Date</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full h-10 px-3.5 rounded-[14px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-xs font-mono font-bold text-[#17191c] focus:border-[#c09748] focus:outline-none shadow-2xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#17191c] flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-[#c09748]" />
                <span>2. Shift Allocation</span>
              </label>
              <select
                value={shift}
                onChange={e => setShift(e.target.value as AssignmentShiftType)}
                className="w-full h-10 px-3 rounded-[14px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-xs font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none shadow-2xs"
              >
                <option value="General Day Shift (08:30 - 18:30)">General Day Shift (08:30 - 18:30)</option>
                <option value="Day 12H">Day 12H (Extended Day)</option>
                <option value="Night 12H">Night 12H (Night Shift)</option>
                <option value="Rotational Shift">Rotational / Floating Replacement</option>
              </select>
            </div>
          </div>

          {/* Row 2: Painter & Booth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#17191c] flex items-center gap-1 font-mono">
                <User className="w-3.5 h-3.5 text-[#c09748]" />
                <span>3. Assigned Floor Painter</span>
              </label>
              <select
                value={selectedPainterId}
                onChange={e => setSelectedPainterId(e.target.value)}
                className="w-full h-10 px-3 rounded-[14px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-xs font-bold text-[#17191c] focus:border-[#c09748] focus:outline-none shadow-2xs"
              >
                {availablePainters.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code || 'PTR'}) • {p.boothNo?.split('(')[0] || 'Line'}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#17191c] flex items-center gap-1 font-mono">
                <Layers className="w-3.5 h-3.5 text-[#c09748]" />
                <span>4. Spray Booth / Conveyor Line</span>
              </label>
              <select
                value={selectedBoothName}
                onChange={e => setSelectedBoothName(e.target.value)}
                className="w-full h-10 px-3 rounded-[14px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-xs font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none shadow-2xs"
              >
                {availableBooths.map(b => (
                  <option key={b.id} value={b.name}>
                    {b.name} ({b.type})
                  </option>
                ))}
                {availableBooths.length === 0 && (
                  <option value="Booth #1 (Continuous Conveyor Line)">Booth #1 (Continuous Conveyor Line)</option>
                )}
              </select>
            </div>
          </div>

          {/* Row 3: Process Stage & Daily Target Qty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#17191c] flex items-center gap-1 font-mono">
                <span>5. Coating Process Stage</span>
              </label>
              <select
                value={processStage}
                onChange={e => setProcessStage(e.target.value as AssignmentProcessStage)}
                className="w-full h-10 px-3 rounded-[14px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-xs font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none shadow-2xs"
              >
                <option value="Basecoat">Basecoat Application</option>
                <option value="Primer">Primer / Pre-treatment</option>
                <option value="Topcoat / Clear Coat">Topcoat / Clear 2K Lacquer</option>
                <option value="Full Coating System">Full System (Primer + Base + Top)</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#17191c] flex items-center gap-1 font-mono">
                  <Target className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>6. Daily Target Qty (Pcs)</span>
                </label>
                <span className="text-[10px] text-[#777b86] font-mono">Max: {balancePending} Pcs</span>
              </div>
              <input
                type="number"
                required
                min={1}
                max={balancePending}
                value={targetQty}
                onChange={e => setTargetQty(Number(e.target.value))}
                className="w-full h-10 px-3.5 rounded-[14px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-xs font-mono font-bold text-[#17191c] focus:border-[#c09748] focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#17191c] font-mono">
              7. Remarks / Floor Instructions (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Day 1 target, maintain 25 microns DFT, flash-off 10 mins"
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
              className="px-5 py-2 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-white text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Shift Assignment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
