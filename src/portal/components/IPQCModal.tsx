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
  AlertCircle,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { downloadStandardIPQCPdf, formatDateDDMMYYYY } from '../utils/pdfStandardHeader';
import { PaintkingDatePicker } from './PaintkingDatePicker';

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
  const { addIPQCRecord, activePlant, currentUser, materialRequisitions, ipqcRecords, paintMixing, fpaRecords } = usePortalStore();

  // Multi-step Wizard Navigation: Exactly 2 Parts
  // Part 1: Inspection Observation Matrix (Kya kya check ho rha hai)
  // Part 2: Personnel Sign-Off & Verification (Kisne check kiya - Shift A, Shift B, Verified By)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Header & Job identification
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [docNo, setDocNo] = useState<string>('PK-QA-IPQ-001');
  const [issueDate, setIssueDate] = useState<string>('01.01.2021');
  const [revNo, setRevNo] = useState<string>('00');
  const [revDate, setRevDate] = useState<string>('00');

  const [partDescription, setPartDescription] = useState<string>('');
  const [partCode, setPartCode] = useState<string>('');
  const [customer, setCustomer] = useState<string>('');
  const [woNo, setWoNo] = useState<string>('');
  const [color, setColor] = useState<string>('');

  // Paint Mix Details
  const [paintDescription, setPaintDescription] = useState<string>('');
  const [paintBatchNumber, setPaintBatchNumber] = useState<string>('');
  const [thinnerBatchNumber, setThinnerBatchNumber] = useState<string>('');
  const [paintViscosity, setPaintViscosity] = useState<string | number>(15);
  const [paintingBooth, setPaintingBooth] = useState<string>('');
  const [painter, setPainter] = useState<string>('');

  // Supervisors
  const [supervisorShiftA, setSupervisorShiftA] = useState<string>(currentUser?.name || '');
  const [supervisorShiftB, setSupervisorShiftB] = useState<string>('');

  // Active Time Slot Tab (Auto-selected according to current live plant time)
  const [activeSlotKey, setActiveSlotKey] = useState<IPQCTimeSlotKey>(() => getDefaultActiveSlotKey());

  // Existing IPQC records for this job card / work order
  const existingJobReports = ipqcRecords.filter(r => {
    const jcNo = jobCard?.jobCardNo;
    const wNum = woNo || jobCard?.woNo || jobCard?.wNo;
    return (jcNo && r.jobCardNo === jcNo) || (wNum && (r.woNo === wNum || r.workOrderNo === wNum));
  });

  // Helper: check if a specific time slot already has an official recorded report
  const isSlotAlreadyLogged = (slotKey: IPQCTimeSlotKey): boolean => {
    return existingJobReports.some(r => {
      if (r.loggedSlotKey === slotKey) return true;
      const slotData = r.timeSlots?.[slotKey];
      return !!(slotData && (slotData.bubble || slotData.L));
    });
  };

  // Helper: get the existing recorded report for this slot if any
  const getExistingReportForSlot = (slotKey: IPQCTimeSlotKey): IPQCRecord | undefined => {
    return existingJobReports.find(r => {
      if (r.loggedSlotKey === slotKey) return true;
      const slotData = r.timeSlots?.[slotKey];
      return !!(slotData && (slotData.bubble || slotData.L));
    });
  };

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
      const matchingPmx = paintMixing.find(p => p.woNo === jobCard.woNo || p.color === jobCard.color);

      const resolvedPaintBatch = 
        jobCard.paintBatch || 
        matchingRequisition?.issuedBatchLines?.find(b => !/thinner|solvent|reducer/i.test(b.supplierBatchNo || ''))?.supplierBatchNo ||
        matchingPmx?.batchNo ||
        paintMat?.batchNo || 
        paintMat?.batchLines?.[0]?.supplierBatchNo || 
        'BAT-PPG-2609-R4';

      const resolvedThinnerBatch = 
        jobCard.thinnerBatch || 
        matchingRequisition?.issuedBatchLines?.find(b => /thinner|solvent|reducer/i.test(b.supplierBatchNo || ''))?.supplierBatchNo ||
        thinnerMat?.batchNo || 
        thinnerMat?.batchLines?.[0]?.supplierBatchNo || 
        'THN-2609-02';

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
    const now = new Date();
    const exactAuditTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    const generatedTimestamp = `${formatDateDDMMYYYY(date)}, ${exactAuditTime}`;

    // Lookup matching approved FPA record for Master LAB benchmark
    const activeFpa = fpaRecords.find(f => 
      (jobCard?.jobCardNo && f.jobCardNo === jobCard.jobCardNo) ||
      (woNo && (f.woNo === woNo || (f as any).workOrderNo === woNo))
    );
    const masterL = activeFpa?.masterLab?.masterL ?? activeFpa?.masterL ?? 42.00;
    const masterA = activeFpa?.masterLab?.masterA ?? activeFpa?.masterA ?? 54.00;
    const masterB = activeFpa?.masterLab?.masterB ?? activeFpa?.masterB ?? 28.00;
    const masterPlaqueRef = activeFpa?.masterLab?.masterPlaqueRef || 'OEM Approved Plaque #01';

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
      loggedSlotKey: activeSlotKey,
      commentOfQualityEngineer,
      remarks: commentOfQualityEngineer,
      inspectedByShiftA,
      inspectedByShiftB,
      verifiedBy,
      // Master Colorimetry Benchmark
      masterL,
      masterA,
      masterB,
      masterPlaqueRef,
      // Backward compatibility summary values
      shift: 'Day 12H',
      checkTime: exactAuditTime,
      exactAuditTime,
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
      inspector: inspectedByShiftA,
      generatedTimestamp,
      createdAt: now.toISOString()
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
            
            {/* MODAL HEADER (CLEAN EDITORIAL AESTHETIC) */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#ececec]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#faf3e0] border border-[#f4e5be] flex items-center justify-center shrink-0 shadow-2xs">
                  <Clock className="w-5 h-5 text-[#c09748]" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono font-bold uppercase tracking-wider mb-0.5">
                    DOC: PK-QA-IPQ-001 • QUALITY GATE 3
                  </div>
                  <h2 className="text-xl font-serif text-[#17191c] font-normal tracking-tight">
                    In-Process Inspection Report
                  </h2>
                </div>
              </div>

              {/* Clean Active Job Info Pill (Replaces old Rev No/Date box) */}
              <div className="hidden sm:flex items-center gap-2 pr-10">
                <div className="px-3 py-1.5 rounded-full bg-[#fafafb] border border-[#dcdfe4] text-[11px] font-mono text-[#17191c] flex items-center gap-2 shadow-2xs">
                  <span className="text-[#777b86]">Job:</span>
                  <span className="font-bold text-[#c09748]">{woNo || jobCard?.jobCardNo}</span>
                  <span className="w-1 h-1 rounded-full bg-[#cbd0d8]"></span>
                  <span className="text-[#777b86]">Part:</span>
                  <span className="font-bold">{partCode}</span>
                </div>
              </div>
            </div>

            {/* 2-PART RESPONSIVE STEPPER CARDS (EXACT REQUIREMENT: CHECKS + SIGN-OFF) */}
            <div className="py-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full">
                {[
                  { num: 1, part: 'PART 1', title: 'Inspection Observations', subtitle: '10 Quality Parameters across Shift Slots' },
                  { num: 2, part: 'PART 2', title: 'Inspector & Shift Sign-Off', subtitle: 'Comments & Department Verification' }
                ].map(s => {
                  const isActive = currentStep === s.num;
                  return (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => setCurrentStep(s.num as any)}
                      className={`p-3 rounded-[16px] text-left transition cursor-pointer border flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-[#faf3e0]/70 border-[#c09748] shadow-2xs ring-1 ring-[#c09748]/30'
                          : 'bg-[#fafafb] border-[#e2e4e9] hover:border-[#cbd0d8]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-[#c09748] text-white shadow-2xs' : 'bg-gray-200 text-[#777b86]'
                        }`}>
                          {s.num}
                        </span>
                        <div>
                          <div className="text-[10px] font-mono text-[#777b86] uppercase font-bold">{s.part}</div>
                          <div className="text-xs font-bold text-[#17191c]">{s.title}</div>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#777b86] hidden sm:inline text-right">{s.subtitle}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PART 1: 10-PARAMETER MATRIX OBSERVATION ACROSS SHIFT SLOTS */}
            {currentStep === 1 && (
            <div className="p-4 rounded-[20px] bg-white border border-[#ececec] space-y-3.5 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#f2f2f3]">
                <div>
                  <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#c09748]" />
                    <span>Part 1: 10-Parameter Inspection Matrix (Hourly Quality Audits)</span>
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
                    const slotInfo = getSlotTimeInfo(slot.key);
                    const alreadyLogged = isSlotAlreadyLogged(slot.key);

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

                    // Already Logged Slot (Official Report Created -> Locked from duplicate generation)
                    if (alreadyLogged) {
                      return (
                        <button
                          key={slot.key}
                          type="button"
                          onClick={() => setActiveSlotKey(slot.key)}
                          title="Report already generated for this time slot. Click to view logged data."
                          className={`p-2 rounded-[14px] text-center transition cursor-pointer border ${
                            isSelected
                              ? 'bg-emerald-100 text-emerald-950 border-2 border-emerald-600 shadow-xs ring-1 ring-emerald-500/30'
                              : 'bg-emerald-50/80 border-emerald-300 text-emerald-900 hover:border-emerald-500'
                          }`}
                        >
                          <div className="text-[9px] font-bold uppercase">{slot.shift}</div>
                          <div className="text-[10px] font-mono font-bold mt-0.5">{slot.label}</div>
                          <div className="inline-flex items-center gap-0.5 text-[8px] text-emerald-800 font-bold bg-emerald-200/70 px-1.5 py-0.5 rounded-full mt-0.5">
                            <Check className="w-2.5 h-2.5 text-emerald-800" />
                            <span>Logged</span>
                          </div>
                        </button>
                      );
                    }

                    // Current Live Active Slot (Pending Report)
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
                            <span>● Live Now</span>
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
              <div className="p-3.5 rounded-[16px] bg-[#fafafb] border border-[#ececec] space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-[#ececec]">
                  <span className="font-bold text-xs text-[#17191c] font-mono flex items-center gap-2">
                    <span>Editing Slot:</span>
                    <strong className="text-[#c09748]">{TIME_SLOTS.find(s => s.key === activeSlotKey)?.label}</strong>
                    <span className="text-[#777b86]">({TIME_SLOTS.find(s => s.key === activeSlotKey)?.shift})</span>
                    {isSlotAlreadyLogged(activeSlotKey) ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold border border-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span>Official Report Recorded (Locked)</span>
                      </span>
                    ) : getSlotTimeInfo(activeSlotKey).isCurrent ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] text-[10px] font-bold border border-[#f4e5be]">
                        ● Current Live Window
                      </span>
                    ) : getSlotTimeInfo(activeSlotKey).isPast ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
                        ⚠️ Overdue Missing Slot
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[10px] text-[#777b86]">Standard 10 Parameters</span>
                </div>

                {/* Banner if Slot is Already Logged */}
                {isSlotAlreadyLogged(activeSlotKey) && (
                  <div className="p-3 rounded-[14px] bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>
                        An official IPQC report (<strong>{getExistingReportForSlot(activeSlotKey)?.reportNo}</strong>) has already been generated for this slot. Duplicate generation is locked.
                      </span>
                    </div>
                    {getExistingReportForSlot(activeSlotKey) && (
                      <button
                        type="button"
                        onClick={() => downloadStandardIPQCPdf(getExistingReportForSlot(activeSlotKey)!)}
                        className="px-3 py-1.5 rounded-full bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-2xs transition"
                      >
                        <Download className="w-3 h-3 text-emerald-700" />
                        <span>Download Logged PDF</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Section A: Visual & Adhesion Checks (2 Columns with One-Click OK / NOT OK Toggle) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#777b86] uppercase tracking-wider font-mono">
                      Visual &amp; Physical Quality Checks
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateSlotField(activeSlotKey, 'bubble', 'Pass');
                        handleUpdateSlotField(activeSlotKey, 'dustSpot', 'Pass');
                        handleUpdateSlotField(activeSlotKey, 'overPaint', 'Pass');
                        handleUpdateSlotField(activeSlotKey, 'paintMissing', 'Pass');
                        handleUpdateSlotField(activeSlotKey, 'overallFinishing', 'Pass');
                        handleUpdateSlotField(activeSlotKey, 'adhesionTest', 'Pass');
                      }}
                      className="px-2.5 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3 h-3 text-emerald-700" />
                      <span>✓ Quick Mark: All 6 Checks OK</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Parameter 1: Bubble */}
                    <div className="p-2.5 rounded-[12px] bg-white border border-[#ececec] flex items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="font-bold text-xs text-[#17191c]">1. Bubble</div>
                        <div className="text-[10px] text-gray-400 font-mono">Visual Inspection</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const isOk = !currentSlotData.bubble || currentSlotData.bubble === 'Pass' || currentSlotData.bubble === 'OK';
                          handleUpdateSlotField(activeSlotKey, 'bubble', isOk ? 'Fail' : 'Pass');
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer active:scale-95 border ${
                          (!currentSlotData.bubble || currentSlotData.bubble === 'Pass' || currentSlotData.bubble === 'OK')
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200/70'
                            : 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200/70'
                        }`}
                      >
                        {(!currentSlotData.bubble || currentSlotData.bubble === 'Pass' || currentSlotData.bubble === 'OK') ? 'OK' : 'NOT OK'}
                      </button>
                    </div>

                    {/* Parameter 2: Dust Spot */}
                    <div className="p-2.5 rounded-[12px] bg-white border border-[#ececec] flex items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="font-bold text-xs text-[#17191c]">2. Dust Spot</div>
                        <div className="text-[10px] text-gray-400 font-mono">Visual Inspection</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const isOk = !currentSlotData.dustSpot || currentSlotData.dustSpot === 'Pass' || currentSlotData.dustSpot === 'OK';
                          handleUpdateSlotField(activeSlotKey, 'dustSpot', isOk ? 'Fail' : 'Pass');
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer active:scale-95 border ${
                          (!currentSlotData.dustSpot || currentSlotData.dustSpot === 'Pass' || currentSlotData.dustSpot === 'OK')
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200/70'
                            : 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200/70'
                        }`}
                      >
                        {(!currentSlotData.dustSpot || currentSlotData.dustSpot === 'Pass' || currentSlotData.dustSpot === 'OK') ? 'OK' : 'NOT OK'}
                      </button>
                    </div>

                    {/* Parameter 3: Over Paint */}
                    <div className="p-2.5 rounded-[12px] bg-white border border-[#ececec] flex items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="font-bold text-xs text-[#17191c]">3. Over Paint</div>
                        <div className="text-[10px] text-gray-400 font-mono">Visual Inspection</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const isOk = !currentSlotData.overPaint || currentSlotData.overPaint === 'Pass' || currentSlotData.overPaint === 'OK';
                          handleUpdateSlotField(activeSlotKey, 'overPaint', isOk ? 'Fail' : 'Pass');
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer active:scale-95 border ${
                          (!currentSlotData.overPaint || currentSlotData.overPaint === 'Pass' || currentSlotData.overPaint === 'OK')
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200/70'
                            : 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200/70'
                        }`}
                      >
                        {(!currentSlotData.overPaint || currentSlotData.overPaint === 'Pass' || currentSlotData.overPaint === 'OK') ? 'OK' : 'NOT OK'}
                      </button>
                    </div>

                    {/* Parameter 4: Paint Missing */}
                    <div className="p-2.5 rounded-[12px] bg-white border border-[#ececec] flex items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="font-bold text-xs text-[#17191c]">4. Paint Missing</div>
                        <div className="text-[10px] text-gray-400 font-mono">Visual Inspection</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const isOk = !currentSlotData.paintMissing || currentSlotData.paintMissing === 'Pass' || currentSlotData.paintMissing === 'OK';
                          handleUpdateSlotField(activeSlotKey, 'paintMissing', isOk ? 'Fail' : 'Pass');
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer active:scale-95 border ${
                          (!currentSlotData.paintMissing || currentSlotData.paintMissing === 'Pass' || currentSlotData.paintMissing === 'OK')
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200/70'
                            : 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200/70'
                        }`}
                      >
                        {(!currentSlotData.paintMissing || currentSlotData.paintMissing === 'Pass' || currentSlotData.paintMissing === 'OK') ? 'OK' : 'NOT OK'}
                      </button>
                    </div>

                    {/* Parameter 5: Overall Finishing */}
                    <div className="p-2.5 rounded-[12px] bg-white border border-[#ececec] flex items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="font-bold text-xs text-[#17191c]">5. Overall Finishing</div>
                        <div className="text-[10px] text-gray-400 font-mono">Visual Inspection</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const isOk = !currentSlotData.overallFinishing || currentSlotData.overallFinishing === 'Pass' || currentSlotData.overallFinishing === 'Perfect' || currentSlotData.overallFinishing === 'OK';
                          handleUpdateSlotField(activeSlotKey, 'overallFinishing', isOk ? 'Fail' : 'Pass');
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer active:scale-95 border ${
                          (!currentSlotData.overallFinishing || currentSlotData.overallFinishing === 'Pass' || currentSlotData.overallFinishing === 'Perfect' || currentSlotData.overallFinishing === 'OK')
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200/70'
                            : 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200/70'
                        }`}
                      >
                        {(!currentSlotData.overallFinishing || currentSlotData.overallFinishing === 'Pass' || currentSlotData.overallFinishing === 'Perfect' || currentSlotData.overallFinishing === 'OK') ? 'OK' : 'NOT OK'}
                      </button>
                    </div>

                    {/* Parameter 6: Adhesion Test */}
                    <div className="p-2.5 rounded-[12px] bg-white border border-[#ececec] flex items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="font-bold text-xs text-[#17191c]">6. Adhesion Test</div>
                        <div className="text-[10px] text-gray-400 font-mono">Physical Tape Peel</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const isOk = !currentSlotData.adhesionTest || currentSlotData.adhesionTest === 'Pass' || currentSlotData.adhesionTest === 'Perfect' || currentSlotData.adhesionTest?.includes?.('Pass');
                          handleUpdateSlotField(activeSlotKey, 'adhesionTest', isOk ? 'Fail' : 'Pass');
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer active:scale-95 border ${
                          (!currentSlotData.adhesionTest || currentSlotData.adhesionTest === 'Pass' || currentSlotData.adhesionTest === 'Perfect' || currentSlotData.adhesionTest?.includes?.('Pass'))
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200/70'
                            : 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200/70'
                        }`}
                      >
                        {(!currentSlotData.adhesionTest || currentSlotData.adhesionTest === 'Pass' || currentSlotData.adhesionTest === 'Perfect' || currentSlotData.adhesionTest?.includes?.('Pass')) ? 'OK' : 'NOT OK'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section B: Spectrophotometer Color Feed (Strictly 4 Columns at Bottom - No numbers) */}
                <div className="space-y-1.5 pt-2 border-t border-[#ececec]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#8a6521] uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <span>Spectrometer Color Delta Readings</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#8a6521] bg-[#faf3e0] px-2 py-0.5 rounded-full border border-[#f4e5be]">
                      Tolerance: ΔE ≤ 0.70
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* L (Lightness) */}
                    <div className="p-2.5 rounded-[12px] bg-white border border-[#ececec] space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-[#17191c]">L (Lightness)</span>
                        <span className="text-gray-400 font-mono">Target: 42.0</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={currentSlotData.L ?? 42.15}
                        onChange={e => handleUpdateSlotField(activeSlotKey, 'L', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-[8px] border border-[#ececec] text-xs font-mono font-bold text-[#17191c] outline-none focus:border-[#c09748]"
                      />
                    </div>

                    {/* A (Red/Green) */}
                    <div className="p-2.5 rounded-[12px] bg-white border border-[#ececec] space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-[#17191c]">A (Red/Green)</span>
                        <span className="text-gray-400 font-mono">Target: 54.0</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={currentSlotData.a ?? 54.30}
                        onChange={e => handleUpdateSlotField(activeSlotKey, 'a', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-[8px] border border-[#ececec] text-xs font-mono font-bold text-[#17191c] outline-none focus:border-[#c09748]"
                      />
                    </div>

                    {/* B (Yellow/Blue) */}
                    <div className="p-2.5 rounded-[12px] bg-white border border-[#ececec] space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-[#17191c]">B (Yellow/Blue)</span>
                        <span className="text-gray-400 font-mono">Target: 28.0</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={currentSlotData.b ?? 28.10}
                        onChange={e => handleUpdateSlotField(activeSlotKey, 'b', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-[8px] border border-[#ececec] text-xs font-mono font-bold text-[#17191c] outline-none focus:border-[#c09748]"
                      />
                    </div>

                    {/* ΔE (Delta Value) */}
                    <div className="p-2.5 rounded-[12px] bg-[#faf7ed] border border-[#f4e5be] space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-[#8a6521]">ΔE (Delta Value)</span>
                        <span className="text-[#8a6521] font-mono font-bold">≤ 0.70</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={currentSlotData.deltaE ?? 0.38}
                        onChange={e => handleUpdateSlotField(activeSlotKey, 'deltaE', e.target.value)}
                        className={`w-full px-2.5 py-1.5 rounded-[8px] border bg-white text-xs font-mono font-bold outline-none ${
                          Number(currentSlotData.deltaE || 0) > 0.70 
                            ? 'border-rose-300 text-rose-700' 
                            : 'border-[#f4e5be] text-emerald-800'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* PART 2: PERSONNEL SIGN-OFF & VERIFICATION (KISNE CHECK KIYA) */}
            {currentStep === 2 && (
            <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#e2e4e8]">
                <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#c09748]" />
                  <span>Part 2: Shift Leads &amp; Quality Engineer Sign-Off</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                  ✓ Linked to Job Card: {woNo || jobCard?.jobCardNo}
                </span>
              </div>

              {/* Quality Comments */}
              <div className="bg-white p-3.5 rounded-[16px] border border-[#ececec] space-y-1.5 shadow-2xs">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#777b86]">
                  Comment of Quality Engineer :-
                </label>
                <input
                  type="text"
                  value={commentOfQualityEngineer}
                  onChange={e => setCommentOfQualityEngineer(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-[12px] bg-[#fafafb] border border-[#ececec] text-xs text-[#17191c] font-medium outline-none focus:bg-white focus:border-[#17191c]"
                  placeholder="e.g. Visual and Spectrometer checks pass all parameters. Surface finish clean, atomization and 100% tape adhesion verified."
                  required
                />
              </div>

              {/* Inspector Names & Floor Supervisors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-[16px] border border-[#ececec] space-y-1.5 shadow-2xs">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#777b86]">
                    Inspected By : (Shift A)
                  </label>
                  <input
                    type="text"
                    value={inspectedByShiftA}
                    onChange={e => setInspectedByShiftA(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[10px] bg-[#fafafb] border border-[#ececec] text-xs font-semibold text-[#17191c] outline-none focus:bg-white"
                    placeholder="Shift A Inspector"
                    required
                  />
                  <span className="text-[10px] text-[#777b86] block">Shift A QA Inspector</span>
                </div>

                <div className="bg-white p-3 rounded-[16px] border border-[#ececec] space-y-1.5 shadow-2xs">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#777b86]">
                    Inspected By : (Shift B)
                  </label>
                  <input
                    type="text"
                    value={inspectedByShiftB}
                    onChange={e => setInspectedByShiftB(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[10px] bg-[#fafafb] border border-[#ececec] text-xs font-semibold text-[#17191c] outline-none focus:bg-white"
                    placeholder="Shift B Inspector"
                    required
                  />
                  <span className="text-[10px] text-[#777b86] block">Shift B QA Inspector</span>
                </div>

                <div className="bg-white p-3 rounded-[16px] border border-[#ececec] space-y-1.5 shadow-2xs sm:col-span-2 lg:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#777b86]">
                    Verified By :-
                  </label>
                  <input
                    type="text"
                    value={verifiedBy}
                    onChange={e => setVerifiedBy(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[10px] bg-[#fafafb] border border-[#ececec] text-xs font-semibold text-[#17191c] outline-none focus:bg-white"
                    placeholder="Quality / Plant Head"
                    required
                  />
                  <span className="text-[10px] text-[#777b86] block">Quality / Plant Head Sign-off</span>
                </div>
              </div>

              {/* Shift Floor Supervisors in Part 2 */}
              <div className="bg-white p-3.5 rounded-[16px] border border-[#ececec] space-y-2 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#777b86] block">
                  Production Floor Shift Leads
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Supervisor -(A Shift)</label>
                    <input
                      type="text"
                      value={supervisorShiftA}
                      onChange={e => setSupervisorShiftA(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-[10px] bg-[#fafafb] border border-[#ececec] text-xs font-semibold text-[#17191c] outline-none focus:bg-white"
                      placeholder="Shift A Supervisor"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Supervisor -(B Shift)</label>
                    <input
                      type="text"
                      value={supervisorShiftB}
                      onChange={e => setSupervisorShiftB(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-[10px] bg-[#fafafb] border border-[#ececec] text-xs font-semibold text-[#17191c] outline-none focus:bg-white"
                      placeholder="Shift B Supervisor"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Stepper Navigation Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#ececec]">
              <div>
                {currentStep === 2 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 rounded-full bg-[#f4f4f6] hover:bg-[#ececee] text-[#17191c] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous: Part 1 (Observations)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-full bg-[#f4f4f6] hover:bg-[#ececee] text-[#17191c] text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div>
                {currentStep === 1 ? (
                  isSlotAlreadyLogged(activeSlotKey) ? (
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-full flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Slot Already Logged (Locked)</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-5 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <span>Next: Part 2 (Inspector Sign-Off)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )
                ) : (
                  <button
                    type="submit"
                    disabled={isSlotAlreadyLogged(activeSlotKey)}
                    className={`px-6 py-2.5 rounded-full font-bold text-xs shadow-xs transition flex items-center gap-2 ${
                      isSlotAlreadyLogged(activeSlotKey)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                        : 'bg-[#c09748] hover:bg-[#a97e35] text-white cursor-pointer active:scale-95'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>✓ Save In-Process Inspection Report</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

