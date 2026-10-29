import React, { useState, useEffect } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { JobCard, IPQCRecord, IPQCTimeSlotKey, IPQCSlotObservation } from '../types/portalTypes';
import { 
  Clock, 
  CheckCircle2, 
  X, 
  Download, 
  Layers, 
  Paintbrush, 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  Check, 
  Calendar, 
  User, 
  Sliders,
  Lock,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { downloadStandardIPQCPdf, formatDateDDMMYYYY } from '../utils/pdfStandardHeader';

interface IPQCModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobCard?: JobCard | null;
  onSuccess?: () => void;
}

export const TIME_SLOTS: { key: IPQCTimeSlotKey; label: string; shift: 'Shift A' | 'Shift B' }[] = [
  { key: 'slot_08_11', label: '8:00 - 11:00', shift: 'Shift A' },
  { key: 'slot_11_14', label: '11:00 - 14:00', shift: 'Shift A' },
  { key: 'slot_14_17', label: '14:00 - 17:00', shift: 'Shift A' },
  { key: 'slot_17_20', label: '17:00 - 20:00', shift: 'Shift A' },
  { key: 'slot_20_23', label: '20:00 - 23:00', shift: 'Shift B' },
  { key: 'slot_23_02', label: '23:00 - 2:00', shift: 'Shift B' },
  { key: 'slot_02_05', label: '2:00 - 5:00', shift: 'Shift B' },
  { key: 'slot_05_08', label: '5:00 - 8:00', shift: 'Shift B' }
];

export interface SlotTimeInfo {
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;
  startHourLabel: string;
  endHourLabel: string;
}

export const getSlotTimeInfo = (slotKey: IPQCTimeSlotKey, now = new Date()): SlotTimeInfo => {
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeDec = currentHour + currentMinute / 60;

  // Manufacturing day runs from 08:00 AM (8.0) to next day 08:00 AM (32.0)
  const slotBounds: Record<IPQCTimeSlotKey, { start: number; end: number; startLbl: string; endLbl: string }> = {
    slot_08_11: { start: 8.0, end: 11.0, startLbl: '08:00', endLbl: '11:00' },
    slot_11_14: { start: 11.0, end: 14.0, startLbl: '11:00', endLbl: '14:00' },
    slot_14_17: { start: 14.0, end: 17.0, startLbl: '14:00', endLbl: '17:00' },
    slot_17_20: { start: 17.0, end: 20.0, startLbl: '17:00', endLbl: '20:00' },
    slot_20_23: { start: 20.0, end: 23.0, startLbl: '20:00', endLbl: '23:00' },
    slot_23_02: { start: 23.0, end: 26.0, startLbl: '23:00', endLbl: '02:00' },
    slot_02_05: { start: 26.0, end: 29.0, startLbl: '02:00', endLbl: '05:00' },
    slot_05_08: { start: 29.0, end: 32.0, startLbl: '05:00', endLbl: '08:00' }
  };

  const effectiveTime = currentTimeDec < 8.0 ? currentTimeDec + 24.0 : currentTimeDec;
  const bound = slotBounds[slotKey];

  const isCurrent = effectiveTime >= bound.start && effectiveTime < bound.end;
  const isPast = effectiveTime >= bound.end;
  const isFuture = effectiveTime < bound.start;

  return {
    isCurrent,
    isPast,
    isFuture,
    startHourLabel: bound.startLbl,
    endHourLabel: bound.endLbl
  };
};

export const getDefaultActiveSlotKey = (now = new Date()): IPQCTimeSlotKey => {
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeDec = currentHour + currentMinute / 60;
  const effectiveTime = currentTimeDec < 8.0 ? currentTimeDec + 24.0 : currentTimeDec;

  if (effectiveTime >= 8.0 && effectiveTime < 11.0) return 'slot_08_11';
  if (effectiveTime >= 11.0 && effectiveTime < 14.0) return 'slot_11_14';
  if (effectiveTime >= 14.0 && effectiveTime < 17.0) return 'slot_14_17';
  if (effectiveTime >= 17.0 && effectiveTime < 20.0) return 'slot_17_20';
  if (effectiveTime >= 20.0 && effectiveTime < 23.0) return 'slot_20_23';
  if (effectiveTime >= 23.0 && effectiveTime < 26.0) return 'slot_23_02';
  if (effectiveTime >= 26.0 && effectiveTime < 29.0) return 'slot_02_05';
  return 'slot_05_08';
};

export const IPQCModal: React.FC<IPQCModalProps> = ({
  isOpen,
  onClose,
  jobCard,
  onSuccess
}) => {
  const { addIPQCRecord, activePlant, currentUser, materialRequisitions } = usePortalStore();

  // Header & Job identification
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [docNo, setDocNo] = useState<string>('PK-QA-IPQ-001');
  const [issueDate, setIssueDate] = useState<string>('01.01.2021');
  const [revNo, setRevNo] = useState<string>('00');
  const [revDate, setRevDate] = useState<string>('00');

  const [partDescription, setPartDescription] = useState<string>('Car AC Vent Bezel Substrate (ABS)');
  const [partCode, setPartCode] = useState<string>('RP-8841');
  const [family, setFamily] = useState<string>('Auto Vent Bezel Family (Mould-01)');
  const [customer, setCustomer] = useState<string>('ROOP POLYMERS LTD');
  const [woNo, setWoNo] = useState<string>('WO-1042');
  const [color, setColor] = useState<string>('Monza Red Gloss');

  // Paint Mix Details
  const [paintDescription, setPaintDescription] = useState<string>('Monza Red 2K PU Basecoat Paint (PPG)');
  const [paintBatchNumber, setPaintBatchNumber] = useState<string>('');
  const [thinnerBatchNumber, setThinnerBatchNumber] = useState<string>('');
  const [paintViscosity, setPaintViscosity] = useState<string | number>(15);
  const [paintingBooth, setPaintingBooth] = useState<string>('Booth #1 (Enclosed Conveyor Line)');
  const [painter, setPainter] = useState<string>('Ramesh Kumar (P1)');

  // Supervisors
  const [supervisorShiftA, setSupervisorShiftA] = useState<string>('Vikram Patel (Shift A Lead)');
  const [supervisorShiftB, setSupervisorShiftB] = useState<string>('Dinesh Sharma (Shift B Lead)');

  // Active Time Slot Tab (Auto-selected according to current live plant time)
  const [activeSlotKey, setActiveSlotKey] = useState<IPQCTimeSlotKey>(() => getDefaultActiveSlotKey());

  // 8 Time-Slot Observations
  const [timeSlots, setTimeSlots] = useState<Record<IPQCTimeSlotKey, IPQCSlotObservation>>({
    slot_08_11: {
      bubble: 'OK',
      dustSpot: 'OK',
      overPaint: 'OK',
      paintMissing: 'OK',
      L: 42.15,
      a: 54.30,
      b: 28.10,
      deltaE: 0.38,
      overallFinishing: 'Perfect',
      adhesionTest: '100% (Pass)'
    },
    slot_11_14: {
      bubble: 'OK',
      dustSpot: 'OK',
      overPaint: 'OK',
      paintMissing: 'OK',
      L: 42.18,
      a: 54.28,
      b: 28.14,
      deltaE: 0.40,
      overallFinishing: 'Perfect',
      adhesionTest: '100% (Pass)'
    },
    slot_14_17: {
      bubble: '',
      dustSpot: '',
      overPaint: '',
      paintMissing: '',
      L: '',
      a: '',
      b: '',
      deltaE: '',
      overallFinishing: '',
      adhesionTest: ''
    },
    slot_17_20: {
      bubble: '',
      dustSpot: '',
      overPaint: '',
      paintMissing: '',
      L: '',
      a: '',
      b: '',
      deltaE: '',
      overallFinishing: '',
      adhesionTest: ''
    },
    slot_20_23: {
      bubble: '',
      dustSpot: '',
      overPaint: '',
      paintMissing: '',
      L: '',
      a: '',
      b: '',
      deltaE: '',
      overallFinishing: '',
      adhesionTest: ''
    },
    slot_23_02: {
      bubble: '',
      dustSpot: '',
      overPaint: '',
      paintMissing: '',
      L: '',
      a: '',
      b: '',
      deltaE: '',
      overallFinishing: '',
      adhesionTest: ''
    },
    slot_02_05: {
      bubble: '',
      dustSpot: '',
      overPaint: '',
      paintMissing: '',
      L: '',
      a: '',
      b: '',
      deltaE: '',
      overallFinishing: '',
      adhesionTest: ''
    },
    slot_05_08: {
      bubble: '',
      dustSpot: '',
      overPaint: '',
      paintMissing: '',
      L: '',
      a: '',
      b: '',
      deltaE: '',
      overallFinishing: '',
      adhesionTest: ''
    }
  });
  // Comments & Signatures
  const [commentOfQualityEngineer, setCommentOfQualityEngineer] = useState<string>(
    'Visual and Spectrometer checks pass all parameters. Surface finish clean, atomization and 100% tape adhesion verified. Authorized for mass run.'
  );
  const [inspectedByShiftA, setInspectedByShiftA] = useState<string>(currentUser?.name || 'Amit Verma (QA Auditor)');
  const [inspectedByShiftB, setInspectedByShiftB] = useState<string>('Kailash Yadav (QA Auditor)');
  const [verifiedBy, setVerifiedBy] = useState<string>('Satish Sharma (Quality / Plant Head)');

  // Result state after creation
  const [createdIpqc, setCreatedIpqc] = useState<IPQCRecord | null>(null);

  useEffect(() => {
    // Auto-select the current live time slot on opening
    setActiveSlotKey(getDefaultActiveSlotKey());

    if (jobCard) {
      setWoNo(jobCard.woNo || jobCard.wNo || 'WO-1042');
      setPartCode(jobCard.partCode || 'RP-8841');
      setPartDescription(jobCard.partDescription || `${jobCard.partCode || 'RP-8841'} Component`);
      setFamily(jobCard.family || `${jobCard.partDescription || jobCard.partCode || 'Auto'} Family`);
      setCustomer(jobCard.customer || 'ROOP POLYMERS LTD');
      setColor(jobCard.color || 'Monza Red Gloss');
      setPaintDescription(jobCard.paintDescription || `${jobCard.color || '2K PU'} Basecoat`);
      const paintMat = jobCard.issuedMaterials?.find(m => 
        m.materialType === 'paint' || 
        (m.category === 'COMPANY_CONSUMABLE' && /paint|basecoat|topcoat|pu/i.test(m.itemDescription)) ||
        /paint|basecoat|topcoat/i.test(m.itemDescription)
      ) || jobCard.issuedMaterials?.[1];

      const thinnerMat = jobCard.issuedMaterials?.find(m => 
        m.materialType === 'thinner' || 
        /thinner|solvent|reducer/i.test(m.itemDescription)
      ) || jobCard.issuedMaterials?.[2];

      const matchingRequisition = materialRequisitions.find(r => r.jobCardNo === jobCard.jobCardNo);

      const resolvedPaintBatch = 
        jobCard.paintBatch || 
        matchingRequisition?.issuedBatchLines?.find(b => !/thinner|solvent|reducer/i.test(b.supplierBatchNo || ''))?.supplierBatchNo ||
        paintMat?.batchNo || 
        paintMat?.batchLines?.[0]?.supplierBatchNo || 
        '';

      const resolvedThinnerBatch = 
        jobCard.thinnerBatch || 
        matchingRequisition?.issuedBatchLines?.find(b => /thinner|solvent|reducer/i.test(b.supplierBatchNo || ''))?.supplierBatchNo ||
        thinnerMat?.batchNo || 
        thinnerMat?.batchLines?.[0]?.supplierBatchNo || 
        '';

      setPaintBatchNumber(resolvedPaintBatch);
      setThinnerBatchNumber(resolvedThinnerBatch);
      setPainter(jobCard.assignedPainterName || jobCard.painterName || 'Ramesh Kumar (P1)');
      setPaintingBooth(jobCard.boothNo || 'Booth #1');
      setCreatedIpqc(null);
    }
  }, [jobCard, isOpen]);

  if (!isOpen) return null;

  const handleUpdateSlotField = (slotKey: IPQCTimeSlotKey, field: keyof IPQCSlotObservation, value: any) => {
    setTimeSlots(prev => ({
      ...prev,
      [slotKey]: {
        ...prev[slotKey],
        [field]: value
      }
    }));
  };

  const handleQuickFillCurrentSlot = (slotKey: IPQCTimeSlotKey) => {
    setTimeSlots(prev => ({
      ...prev,
      [slotKey]: {
        bubble: 'OK',
        dustSpot: 'OK',
        overPaint: 'OK',
        paintMissing: 'OK',
        L: 42.15,
        a: 54.30,
        b: 28.10,
        deltaE: 0.38,
        overallFinishing: 'Perfect',
        adhesionTest: '100% (Pass)'
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const reportNo = `PK-IPQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const currentActiveSlot = timeSlots[activeSlotKey];

    const newRecord: IPQCRecord = {
      reportNo,
      date,
      plant: activePlant,
      docNo,
      issueDate,
      revNo,
      revDate,
      partDescription,
      partCode,
      family,
      customer,
      workOrderNo: woNo,
      woNo,
      jobCardNo: jobCard?.jobCardNo,
      color,
      paintDescription,
      paintBatchNumber,
      paintBatch: paintBatchNumber,
      thinnerBatchNumber,
      thinnerBatch: thinnerBatchNumber,
      paintViscosity,
      viscositySec: Number(paintViscosity) || 15,
      paintingBooth,
      booth: paintingBooth,
      painter,
      supervisorShiftA,
      supervisorShiftB,
      timeSlots,
      commentOfQualityEngineer,
      remarks: commentOfQualityEngineer,
      inspectedByShiftA,
      inspectedByShiftB,
      verifiedBy,
      // Backward compatibility summary values
      shift: 'Day 12H',
      checkTime: TIME_SLOTS.find(s => s.key === activeSlotKey)?.label || '08:00 - 11:00',
      bubble: (currentActiveSlot?.bubble === 'OK' || currentActiveSlot?.bubble === 'Pass') ? 'Pass' : 'Fail',
      dustSpot: (currentActiveSlot?.dustSpot === 'OK' || currentActiveSlot?.dustSpot === 'Pass') ? 'Pass' : 'Fail',
      overPaint: (currentActiveSlot?.overPaint === 'OK' || currentActiveSlot?.overPaint === 'Pass') ? 'Pass' : 'Fail',
      paintMissing: (currentActiveSlot?.paintMissing === 'OK' || currentActiveSlot?.paintMissing === 'Pass') ? 'Pass' : 'Fail',
      L: Number(currentActiveSlot?.L) || 42.15,
      a: Number(currentActiveSlot?.a) || 54.30,
      b: Number(currentActiveSlot?.b) || 28.10,
      deltaE: Number(currentActiveSlot?.deltaE) || 0.38,
      overallFinishing: 'Pass',
      adhesionTest: 'Pass',
      result: 'Pass',
      inspector: inspectedByShiftA
    };

    addIPQCRecord(newRecord);
    setCreatedIpqc(newRecord);

    if (onSuccess) {
      onSuccess();
    }
  };

  const currentSlotData = timeSlots[activeSlotKey] || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-[28px] max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-150 relative text-xs">
        
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#f4f4f6] hover:bg-[#ececee] text-[#777b86] hover:text-[#17191c] flex items-center justify-center cursor-pointer transition z-10 active:scale-95"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ========================================================================= */}
        {/* VIEW 1: SUCCESS CONFIRMATION & PDF READY                                 */}
        {/* ========================================================================= */}
        {createdIpqc ? (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-5 rounded-[22px] bg-[#faf7ed] border border-[#f4e5be] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#c09748] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] font-mono bg-emerald-100 text-emerald-900">
                      ✓ IN-PROCESS INSPECTION RECORDED
                    </span>
                    <span className="font-mono text-xs text-[#8a6521] font-bold">
                      {createdIpqc.reportNo}
                    </span>
                  </div>
                  <h3 className="font-serif font-normal text-lg text-[#17191c] mt-0.5">
                    In-Process Inspection Report Ready!
                  </h3>
                  <p className="text-xs text-[#777b86]">
                    Customer: <strong>{createdIpqc.customer}</strong> • Part: <strong>{createdIpqc.partCode}</strong> • WO: <strong>{createdIpqc.woNo}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => downloadStandardIPQCPdf(createdIpqc)}
                  className="px-4 py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-[#8a6521]" />
                  <span>Download In-Process Report PDF</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#ececec]">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-[#17191c] hover:bg-black text-white font-semibold text-xs transition cursor-pointer shadow-xs active:scale-95"
              >
                Return to Quality View
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: FULL IN-PROCESS INSPECTION REPORT FORM                           */
          /* ========================================================================= */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Modal Header */}
            <div className="space-y-1 pb-3 border-b border-[#ececec] pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-mono font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#c09748]" />
                  <span>PK-QA-IPQ-001 • IN-PROCESS INSPECTION</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#17191c] text-[10px] font-mono font-semibold">
                  Issue Date: 01.01.2021 • Rev: 00
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif text-[#17191c] font-normal tracking-tight">
                In-Process Inspection Report (IPQC)
              </h2>
              <p className="text-xs text-[#777b86]">
                Record hourly line audits across Shift A (08:00 - 20:00) and Shift B (20:00 - 08:00) for visual defects, colorimetry (LAB), and coating adhesion.
              </p>
            </div>

            {/* PART 1: IDENTIFICATION & PAINT MIX DETAILS (SCREENSHOT TOP SECTION) */}
            <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#c09748]" />
                  <span>1. Job Identification & Paint Mixing Parameters</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                  ✓ Pre-filled from Batch
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-semibold text-[#17191c] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Part Description</label>
                  <input
                    type="text"
                    value={partDescription}
                    onChange={e => setPartDescription(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-semibold text-[#17191c] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Part Code</label>
                  <input
                    type="text"
                    value={partCode}
                    onChange={e => setPartCode(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-mono font-bold text-[#17191c] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Component Family</label>
                  <input
                    type="text"
                    value={family}
                    onChange={e => setFamily(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-semibold text-[#17191c] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Customer Name</label>
                  <input
                    type="text"
                    value={customer}
                    onChange={e => setCustomer(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-semibold text-[#17191c] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Work Order No</label>
                  <input
                    type="text"
                    value={woNo}
                    onChange={e => setWoNo(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-mono font-bold text-[#17191c] outline-none"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="block text-[10px] font-semibold text-[#777b86]">Paint Batch Number</label>
                    <span className="text-[9px] font-mono font-bold text-[#8a6521] bg-[#faf7ed] border border-[#f4e5be] px-1.5 py-0.2 rounded">
                      ✓ MIN Batch
                    </span>
                  </div>
                  <input
                    type="text"
                    value={paintBatchNumber}
                    onChange={e => setPaintBatchNumber(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-mono font-bold text-[#17191c] outline-none"
                    placeholder="e.g. BATCH-PPG-RED-001"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="block text-[10px] font-semibold text-[#777b86]">Thinner Batch Number</label>
                    <span className="text-[9px] font-mono font-bold text-[#8a6521] bg-[#faf7ed] border border-[#f4e5be] px-1.5 py-0.2 rounded">
                      ✓ MIN Batch
                    </span>
                  </div>
                  <input
                    type="text"
                    value={thinnerBatchNumber}
                    onChange={e => setThinnerBatchNumber(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-mono font-bold text-[#17191c] outline-none"
                    placeholder="e.g. BATCH-THN-PU-001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Paint Viscosity (FC4 sec)</label>
                  <input
                    type="number"
                    value={paintViscosity}
                    onChange={e => setPaintViscosity(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-mono font-bold text-[#17191c] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Painting Booth</label>
                  <input
                    type="text"
                    value={paintingBooth}
                    onChange={e => setPaintingBooth(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-semibold text-[#17191c] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Painter Name</label>
                  <input
                    type="text"
                    value={painter}
                    onChange={e => setPainter(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-semibold text-[#17191c] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Color Tone / Shade</label>
                  <input
                    type="text"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-semibold text-[#17191c] outline-none"
                    required
                  />
                </div>
              </div>

              {/* Shift Supervisors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-[#ececec]">
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Supervisor - (A Shift)</label>
                  <input
                    type="text"
                    value={supervisorShiftA}
                    onChange={e => setSupervisorShiftA(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-medium text-[#17191c]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Supervisor - (B Shift)</label>
                  <input
                    type="text"
                    value={supervisorShiftB}
                    onChange={e => setSupervisorShiftB(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-medium text-[#17191c]"
                    required
                  />
                </div>
              </div>
            </div>

            {/* PART 2: 8 TIME-SLOT MATRIX OBSERVATION (SCREENSHOT TABLE SECTION) */}
            <div className="p-4 rounded-[20px] bg-white border border-[#ececec] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#c09748]" />
                    <span>2. 10-Parameter Inspection Matrix across 8 Shift Slots</span>
                  </span>
                  <div className="text-[10px] text-[#777b86] flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 text-[#c09748]" />
                    <span>Live Plant Window: <strong className="text-[#17191c]">{TIME_SLOTS.find(s => s.key === getDefaultActiveSlotKey())?.label} ({TIME_SLOTS.find(s => s.key === getDefaultActiveSlotKey())?.shift})</strong></span>
                  </div>
                </div>
                {!getSlotTimeInfo(activeSlotKey).isFuture && (
                  <button
                    type="button"
                    onClick={() => handleQuickFillCurrentSlot(activeSlotKey)}
                    className="px-3 py-1 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-bold hover:bg-[#f4e5be] transition cursor-pointer self-start sm:self-auto"
                  >
                    ★ Quick Pass Active Slot
                  </button>
                )}
              </div>

              {/* Time Slot Selector Pills with Smart Live, Missing & Locked Indicators */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#777b86] uppercase">Inspection Shift Time Slots:</span>
                  <span className="text-[10px] text-[#777b86] italic">Future slots are strictly locked until start time</span>
                </div>

                <div className="grid grid-cols-2 xs:grid-cols-4 sm:grid-cols-8 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = activeSlotKey === slot.key;
                    const slotData = timeSlots[slot.key];
                    const hasValues = !!(slotData?.bubble || slotData?.L);
                    const slotInfo = getSlotTimeInfo(slot.key);

                    // Future Slot (Locked)
                    if (slotInfo.isFuture) {
                      return (
                        <div
                          key={slot.key}
                          title="Future time slot is locked until the scheduled inspection window begins"
                          className="p-2 rounded-[14px] text-center border border-dashed border-[#e2e4e8] bg-[#f8f9fa] opacity-60 cursor-not-allowed select-none space-y-0.5"
                        >
                          <div className="text-[9px] font-medium text-[#979799] uppercase">{slot.shift}</div>
                          <div className="text-[10px] font-mono font-bold text-[#979799]">{slot.label}</div>
                          <div className="inline-flex items-center gap-0.5 text-[8px] text-[#979799] font-semibold bg-[#eef0f2] px-1.5 py-0.5 rounded-full mt-0.5">
                            <Lock className="w-2.5 h-2.5 text-[#979799]" />
                            <span>Locked</span>
                          </div>
                        </div>
                      );
                    }

                    // Current Live Active Slot
                    if (slotInfo.isCurrent) {
                      return (
                        <button
                          key={slot.key}
                          type="button"
                          onClick={() => setActiveSlotKey(slot.key)}
                          className={`p-2 rounded-[14px] text-center transition cursor-pointer border relative ${
                            isSelected
                              ? 'bg-[#faf3e0] text-[#8a6521] border-2 border-[#c09748] shadow-xs'
                              : 'bg-amber-50/60 text-[#8a6521] border border-[#f4e5be] hover:border-[#c09748]'
                          }`}
                        >
                          <div className="text-[9px] font-bold uppercase">{slot.shift}</div>
                          <div className="text-[10px] font-mono font-bold mt-0.5">{slot.label}</div>
                          <div className="inline-flex items-center gap-1 text-[8px] font-bold text-[#8a6521] bg-[#f4e5be]/70 px-1.5 py-0.5 rounded-full mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#c09748] animate-pulse"></span>
                            <span>{hasValues ? '✓ Live (Logged)' : '● Live Now'}</span>
                          </div>
                        </button>
                      );
                    }

                    // Past Slot with Logged Data
                    if (hasValues) {
                      return (
                        <button
                          key={slot.key}
                          type="button"
                          onClick={() => setActiveSlotKey(slot.key)}
                          className={`p-2 rounded-[14px] text-center transition cursor-pointer border ${
                            isSelected
                              ? 'bg-[#faf3e0] text-[#8a6521] border-2 border-[#c09748] shadow-xs'
                              : 'bg-emerald-50/70 border-emerald-300 text-emerald-900 hover:border-emerald-400'
                          }`}
                        >
                          <div className="text-[9px] font-bold uppercase">{slot.shift}</div>
                          <div className="text-[10px] font-mono font-bold mt-0.5">{slot.label}</div>
                          <div className="inline-flex items-center gap-0.5 text-[8px] text-emerald-700 font-bold bg-emerald-100/80 px-1.5 py-0.5 rounded-full mt-0.5">
                            <Check className="w-2.5 h-2.5 text-emerald-700" />
                            <span>Logged</span>
                          </div>
                        </button>
                      );
                    }

                    // Past Slot with MISSING Data (Overdue Alert)
                    return (
                      <button
                        key={slot.key}
                        type="button"
                        onClick={() => setActiveSlotKey(slot.key)}
                        title="Inspection was not logged during this past window. Click to record overdue report."
                        className={`p-2 rounded-[14px] text-center transition cursor-pointer border ${
                          isSelected
                            ? 'bg-[#faf3e0] text-[#8a6521] border-2 border-[#c09748] shadow-xs'
                            : 'bg-rose-50/80 border-2 border-rose-300 text-rose-900 hover:border-rose-400'
                        }`}
                      >
                        <div className="text-[9px] font-bold uppercase text-rose-700">{slot.shift}</div>
                        <div className="text-[10px] font-mono font-bold mt-0.5 text-rose-900">{slot.label}</div>
                        <div className="inline-flex items-center gap-0.5 text-[8px] text-rose-700 font-bold bg-rose-100 px-1.5 py-0.5 rounded-full mt-0.5 animate-pulse">
                          <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                          <span>Missing</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Slot Form Grid (Parameters 1 to 10) */}
              <div className="p-3.5 rounded-[16px] bg-[#fafafb] border border-[#ececec] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#ececec]">
                  <span className="font-bold text-xs text-[#17191c] font-mono flex items-center gap-2">
                    <span>Editing Slot:</span>
                    <strong className="text-[#c09748]">{TIME_SLOTS.find(s => s.key === activeSlotKey)?.label}</strong>
                    <span className="text-[#777b86]">({TIME_SLOTS.find(s => s.key === activeSlotKey)?.shift})</span>
                    {getSlotTimeInfo(activeSlotKey).isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] text-[10px] font-bold border border-[#f4e5be]">
                        ● Current Live Window
                      </span>
                    )}
                    {getSlotTimeInfo(activeSlotKey).isPast && !timeSlots[activeSlotKey]?.bubble && !timeSlots[activeSlotKey]?.L && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
                        ⚠️ Overdue Missing Slot
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-[#777b86]">Standard 10 Parameters</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Parameter 1: Bubble */}
                  <div className="p-2.5 rounded-[12px] bg-white border border-[#ececec] space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#17191c]">1. Bubble</span>
                      <span className="text-gray-400 font-mono">Visual</span>
                    </div>
                    <select
                      value={currentSlotData.bubble || 'OK'}
                      onChange={e => handleUpdateSlotField(activeSlotKey, 'bubble', e.target.value)}
                      className="w-full p-1.5 rounded-[8px] border border-[#ececec] text-xs font-bold text-emerald-800 bg-white"
                    >
                      <option value="OK">OK (Nil)</option>
                      <option value="Not Allowed">Not Allowed (Fail)</option>
                    </select>
                  </div>

                  {/* Parameter 2: Dust Spot */}
                  <div className="p-2.5 rounded-[12px] bg-white border border-[#ececec] space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#17191c]">2. Dust Spot</span>
                      <span className="text-gray-400 font-mono">Visual</span>
                    </div>
                    <select
                      value={currentSlotData.dustSpot || 'OK'}
                      onChange={e => handleUpdateSlotField(activeSlotKey, 'dustSpot', e.target.value)}
                      className="w-full p-1.5 rounded-[8px] border border-[#ececec] text-xs font-bold text-emerald-800 bg-white"
                    >
                      <option value="OK">OK (Nil)</option>
                      <option value="Not Allowed">Not Allowed (Fail)</option>
                    </select>
                  </div>

                  {/* Parameter 3: Over Paint */}
                  <div className="p-2.5 rounded-[12px] bg-white border border-[#ececec] space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#17191c]">3. Over Paint</span>
                      <span className="text-gray-400 font-mono">Visual</span>
                    </div>
                    <select
                      value={currentSlotData.overPaint || 'OK'}
                      onChange={e => handleUpdateSlotField(activeSlotKey, 'overPaint', e.target.value)}
                      className="w-full p-1.5 rounded-[8px] border border-[#ececec] text-xs font-bold text-emerald-800 bg-white"
                    >
                      <option value="OK">OK (Nil)</option>
                      <option value="Not Allowed">Not Allowed (Fail)</option>
                    </select>
                  </div>

                  {/* Parameter 4: Paint Missing */}
                  <div className="p-2.5 rounded-[12px] bg-white border border-[#ececec] space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#17191c]">4. Paint Missing</span>
                      <span className="text-gray-400 font-mono">Visual</span>
                    </div>
                    <select
                      value={currentSlotData.paintMissing || 'OK'}
                      onChange={e => handleUpdateSlotField(activeSlotKey, 'paintMissing', e.target.value)}
                      className="w-full p-1.5 rounded-[8px] border border-[#ececec] text-xs font-bold text-emerald-800 bg-white"
                    >
                      <option value="OK">OK (Nil)</option>
                      <option value="Not Allowed">Not Allowed (Fail)</option>
                    </select>
                  </div>

                  {/* Parameter 5: L */}
                  <div className="p-2.5 rounded-[12px] bg-white border border-[#ececec] space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#17191c]">5. L (Lightness)</span>
                      <span className="text-[#8a6521] font-mono">Spectrometer</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={currentSlotData.L ?? 42.15}
                      onChange={e => handleUpdateSlotField(activeSlotKey, 'L', e.target.value)}
                      className="w-full p-1.5 rounded-[8px] border border-[#ececec] text-xs font-mono font-bold text-[#17191c]"
                    />
                  </div>

                  {/* Parameter 6: A */}
                  <div className="p-2.5 rounded-[12px] bg-white border border-[#ececec] space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#17191c]">6. A (Red/Green)</span>
                      <span className="text-[#8a6521] font-mono">Spectrometer</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={currentSlotData.a ?? 54.30}
                      onChange={e => handleUpdateSlotField(activeSlotKey, 'a', e.target.value)}
                      className="w-full p-1.5 rounded-[8px] border border-[#ececec] text-xs font-mono font-bold text-[#17191c]"
                    />
                  </div>

                  {/* Parameter 7: B */}
                  <div className="p-2.5 rounded-[12px] bg-white border border-[#ececec] space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#17191c]">7. B (Yellow/Blue)</span>
                      <span className="text-[#8a6521] font-mono">Spectrometer</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={currentSlotData.b ?? 28.10}
                      onChange={e => handleUpdateSlotField(activeSlotKey, 'b', e.target.value)}
                      className="w-full p-1.5 rounded-[8px] border border-[#ececec] text-xs font-mono font-bold text-[#17191c]"
                    />
                  </div>

                  {/* Parameter 8: Delta-E */}
                  <div className="p-2.5 rounded-[12px] bg-[#faf7ed] border border-[#f4e5be] space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#8a6521]">8. ΔE (Delta Value)</span>
                      <span className="text-[#8a6521] font-mono">≤ 0.70</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={currentSlotData.deltaE ?? 0.38}
                      onChange={e => handleUpdateSlotField(activeSlotKey, 'deltaE', e.target.value)}
                      className="w-full p-1.5 rounded-[8px] border border-[#f4e5be] bg-white text-xs font-mono font-bold text-[#17191c]"
                    />
                  </div>

                  {/* Parameter 9: Overall Finishing */}
                  <div className="p-2.5 rounded-[12px] bg-white border border-[#ececec] space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#17191c]">9. Overall Finishing</span>
                      <span className="text-gray-400 font-mono">Visual</span>
                    </div>
                    <select
                      value={currentSlotData.overallFinishing || 'Perfect'}
                      onChange={e => handleUpdateSlotField(activeSlotKey, 'overallFinishing', e.target.value)}
                      className="w-full p-1.5 rounded-[8px] border border-[#ececec] text-xs font-bold text-emerald-800 bg-white"
                    >
                      <option value="Perfect">Perfect</option>
                      <option value="OK">OK</option>
                      <option value="Defective">Defective</option>
                    </select>
                  </div>

                  {/* Parameter 10: Adhesion Test */}
                  <div className="p-2.5 rounded-[12px] bg-white border border-[#ececec] space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#17191c]">10. Adhesion Test</span>
                      <span className="text-gray-400 font-mono">Physical</span>
                    </div>
                    <select
                      value={currentSlotData.adhesionTest || 'Perfect'}
                      onChange={e => handleUpdateSlotField(activeSlotKey, 'adhesionTest', e.target.value)}
                      className="w-full p-2.5 rounded-[8px] border border-[#ececec] text-xs font-bold text-emerald-800 bg-white"
                    >
                      <option value="Perfect">Perfect (100%)</option>
                      <option value="Pass">Pass</option>
                      <option value="Fail">Fail</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* PART 3: COMMENTS & MULTI-SHIFT SIGNATURES (SCREENSHOT BOTTOM SECTION) */}
            <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-[#777b86] mb-1">
                  Comment of Quality Engineer :-
                </label>
                <input
                  type="text"
                  value={commentOfQualityEngineer}
                  onChange={e => setCommentOfQualityEngineer(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-[12px] bg-white border border-[#ececec] text-xs text-[#17191c] font-medium outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Inspected By : (Shift A)</label>
                  <input
                    type="text"
                    value={inspectedByShiftA}
                    onChange={e => setInspectedByShiftA(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-medium text-[#17191c]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Inspected By : (Shift B)</label>
                  <input
                    type="text"
                    value={inspectedByShiftB}
                    onChange={e => setInspectedByShiftB(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-medium text-[#17191c]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Verified By :-</label>
                  <input
                    type="text"
                    value={verifiedBy}
                    onChange={e => setVerifiedBy(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-medium text-[#17191c]"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#ececec]">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full bg-[#f4f4f6] hover:bg-[#ececee] text-[#17191c] text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-white font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ Save In-Process Inspection Report</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

