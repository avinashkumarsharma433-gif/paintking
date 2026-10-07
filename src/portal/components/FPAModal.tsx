import React, { useState, useEffect } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { JobCard, FPARecord, FPAVisualCheckRow, FPADeltaValueRow, FPAMasterLab } from '../types/portalTypes';
import { 
  Sparkles, 
  CheckCircle2, 
  X, 
  Download, 
  Printer, 
  AlertTriangle, 
  Layers, 
  Gauge, 
  FlaskConical, 
  Check, 
  ShieldCheck,
  Clock,
  FileCheck,
  ClipboardList,
  ArrowRight,
  ArrowLeft,
  Target
} from 'lucide-react';
import { downloadStandardFPAPdf } from '../utils/pdfStandardHeader';

interface FPAModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobCard?: JobCard | null;
  onSuccess?: () => void;
}

export const FPAModal: React.FC<FPAModalProps> = ({
  isOpen,
  onClose,
  jobCard,
  onSuccess
}) => {
  const { createFPARecord, activePlant, currentUser } = usePortalStore();

  // Wizard Step State (1: Identification, 2: Visual 5 Samples, 3: Adhesion & Delta-E, 4: Sign-offs)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [woNo, setWoNo] = useState<string>('WO-1042');
  const [jobCardNo, setJobCardNo] = useState<string>('JC-1042-RED');
  const [customer, setCustomer] = useState<string>('ROOP POLYMERS LTD');
  const [partCode, setPartCode] = useState<string>('RP-8841');
  const [partDescription, setPartDescription] = useState<string>('Switch Housing Front Bezel');
  const [family, setFamily] = useState<string>('Switch Bezel Family (Mould-04)');
  const [color, setColor] = useState<string>('Monza Red Gloss');
  const [paintDescription, setPaintDescription] = useState<string>('PPG 2K PU Monza Red Gloss Topcoat');
  const [paintBatch, setPaintBatch] = useState<string>('BAT-PPG-2609-R4');
  const [thinnerBatch, setThinnerBatch] = useState<string>('THN-2609-02');
  const [painter, setPainter] = useState<string>('Ramesh Kumar (P1)');
  const [booth, setBooth] = useState<string>('Booth #1 (Enclosed)');
  const [startupTime, setStartupTime] = useState<string>('08:30 AM');
  const [approvalTime, setApprovalTime] = useState<string>('09:15 AM');
  const [viscositySec, setViscositySec] = useState<number>(15);

  // 1. Visual Checks Matrix (A. Bubble, B. Dust Spot, C. Over Paint, D. Paint Missing, E. Colour, F. Overall Finishing across S1..S5)
  const [visualChecks, setVisualChecks] = useState<FPAVisualCheckRow>({
    bubble: ['Pass', 'Pass', 'Pass', 'Pass', 'Pass'],
    dustSpot: ['Pass', 'Pass', 'Pass', 'Pass', 'Pass'],
    overPaint: ['Pass', 'Pass', 'Pass', 'Pass', 'Pass'],
    paintMissing: ['Pass', 'Pass', 'Pass', 'Pass', 'Pass'],
    colour: ['Pass', 'Pass', 'Pass', 'Pass', 'Pass'],
    overallFinishing: ['Pass', 'Pass', 'Pass', 'Pass', 'Pass']
  });

  // Overall sample ratings
  const [sample1, setSample1] = useState<'Pass' | 'Fail'>('Pass');
  const [sample2, setSample2] = useState<'Pass' | 'Fail'>('Pass');
  const [sample3, setSample3] = useState<'Pass' | 'Fail'>('Pass');
  const [sample4, setSample4] = useState<'Pass' | 'Fail'>('Pass');
  const [sample5, setSample5] = useState<'Pass' | 'Fail'>('Pass');

  // 2. Adhesion Test & Tape Impression
  const [crossCutTest, setCrossCutTest] = useState<'Pass' | 'Fail'>('Pass');
  const [tapeTest, setTapeTest] = useState<'Pass' | 'Fail'>('Pass');
  const [adhesionPercent, setAdhesionPercent] = useState<number>(100);

  // 3. MASTER LAB TARGET VALUES (OEM Standard Plaque / Target Shade)
  const [masterL, setMasterL] = useState<number | string>(42.00);
  const [masterA, setMasterA] = useState<number | string>(54.00);
  const [masterB, setMasterB] = useState<number | string>(28.00);
  const [masterPlaqueRef, setMasterPlaqueRef] = useState<string>('OEM Approved Master Plaque #01');

  // 3. CIELAB Spectrometer Delta Values for 5 Samples (Manual Direct Inputs - No Auto Math)
  const [deltaSamples, setDeltaSamples] = useState<FPADeltaValueRow>({
    L: [42.15, 42.10, 42.20, 42.18, 42.12],
    a: [54.30, 54.25, 54.35, 54.28, 54.32],
    b: [28.10, 28.15, 28.08, 28.12, 28.14],
    deltaE: [0.38, 0.42, 0.35, 0.40, 0.39]
  });

  // 4. Signatures & Acceptance
  const [acceptancePainter, setAcceptancePainter] = useState<string>('Ramesh Kumar (P1)');
  const [acceptanceProductionIncharge, setAcceptanceProductionIncharge] = useState<string>('Sunil Verma (Prod. Incharge)');
  const [qcEngineer, setQcEngineer] = useState<string>(currentUser?.name || 'Amit Verma (QA Engineer)');
  const [managerQAApproval, setManagerQAApproval] = useState<boolean>(true);
  const [remarks, setRemarks] = useState<string>('Visual 5/5 OK, Cross-Cut 100% adhesion verified, Spectrometer Delta-E <= 0.70 across all 5 samples vs Master Plaque. Approved for production.');

  // Result state after creation
  const [createdFpa, setCreatedFpa] = useState<FPARecord | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Auto-fill from selected Job Card
  useEffect(() => {
    if (jobCard) {
      setJobCardNo(jobCard.jobCardNo);
      setWoNo(jobCard.woNo || jobCard.wNo || 'WO-1042');
      setCustomer(jobCard.customer || 'ROOP POLYMERS LTD');
      setPartCode(jobCard.partCode || 'RP-8841');
      setPartDescription(jobCard.partDescription || jobCard.partName || `${jobCard.partCode || 'RP-8841'} Molded Component`);
      setFamily(jobCard.family || `${jobCard.partDescription || jobCard.partCode || 'Auto'} Family (Mould-01)`);
      setColor(jobCard.color || 'Monza Red Gloss');
      setPaintDescription(jobCard.paintDescription || `${jobCard.color || '2K PU'} Industrial Basecoat`);
      setPaintBatch(jobCard.paintBatch || (jobCard.issuedMaterials?.[1]?.batchNo) || 'BAT-PPG-2609-R4');
      setThinnerBatch(jobCard.thinnerBatch || (jobCard.issuedMaterials?.[2]?.batchNo) || 'THN-2609-02');
      const assignedPainter = jobCard.assignedPainterName || jobCard.painterName || 'Ramesh Kumar (P1)';
      setPainter(assignedPainter);
      setAcceptancePainter(assignedPainter);
      setBooth(jobCard.boothNo || 'Booth #1');
      setStartupTime(jobCard.issueTime || jobCard.startTime || '08:30 AM');
      setApprovalTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setCreatedFpa(null);
      setCurrentStep(1);
    }
  }, [jobCard, isOpen]);

  const handleDeltaCellChange = (param: keyof FPADeltaValueRow, sampleIndex: number, val: string) => {
    setDeltaSamples(prev => {
      const arr = [...prev[param]];
      arr[sampleIndex] = val;
      return { ...prev, [param]: arr };
    });
  };

  const setAllVisualChecks = (status: 'Pass' | 'Fail') => {
    setVisualChecks({
      bubble: [status, status, status, status, status],
      dustSpot: [status, status, status, status, status],
      overPaint: [status, status, status, status, status],
      paintMissing: [status, status, status, status, status],
      colour: [status, status, status, status, status],
      overallFinishing: [status, status, status, status, status]
    });
    setSample1(status);
    setSample2(status);
    setSample3(status);
    setSample4(status);
    setSample5(status);
  };

  const toggleVisualCell = (key: keyof FPAVisualCheckRow, index: number) => {
    setVisualChecks(prev => {
      const arr = [...prev[key]];
      arr[index] = arr[index] === 'Pass' ? 'Fail' : 'Pass';
      return { ...prev, [key]: arr };
    });
  };

  // Validation
  const isDeltaEPass = deltaSamples.deltaE.every(d => Number(d) <= 0.70);
  const isAdhesionPass = adhesionPercent === 100 && crossCutTest === 'Pass' && tapeTest === 'Pass';
  const isAllVisualPass = Object.values(visualChecks).every(row => row.every(val => val === 'Pass'));
  const isEligibleForApproval = isDeltaEPass && isAdhesionPass && isAllVisualPass;

  const handleDownloadPdf = (record: FPARecord) => {
    try {
      setDownloadError(null);
      downloadStandardFPAPdf(record);
    } catch (err: any) {
      console.error('Failed to download FPA PDF:', err);
      setDownloadError(err?.message || 'Error generating PDF. Please check console.');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const masterLabData: FPAMasterLab = {
      masterL,
      masterA,
      masterB,
      masterPlaqueRef
    };

    const fpaData = {
      date,
      plant: activePlant,
      woNo,
      jobCardNo,
      customer,
      partCode,
      partDescription,
      family,
      color,
      paintDescription,
      paintBatch,
      thinnerBatch,
      painter,
      booth,
      startupTime,
      approvalTime,
      viscositySec: Number(viscositySec),
      visualChecks,
      sample1,
      sample2,
      sample3,
      sample4,
      sample5,
      masterLab: masterLabData,
      masterL,
      masterA,
      masterB,
      deltaSamples,
      L: Number(deltaSamples.L[0]) || 42.15,
      a: Number(deltaSamples.a[0]) || 54.30,
      b: Number(deltaSamples.b[0]) || 28.10,
      deltaE: Number(deltaSamples.deltaE[0]) || 0.38,
      adhesionPercent: Number(adhesionPercent),
      crossCutTest,
      tapeTest,
      tapeImpressionBox: true,
      acceptancePainter,
      acceptanceProductionIncharge,
      qcEngineer,
      managerQAApproval,
      remarks,
      overallResult: (isEligibleForApproval ? 'Approved' : 'Hold') as 'Approved' | 'Hold' | 'Rejected'
    };

    createFPARecord(fpaData);

    const generatedRecord: FPARecord = {
      ...fpaData,
      reportNo: `PK-FPA-2026-${Math.floor(1000 + Math.random() * 9000)}`
    };
    setCreatedFpa(generatedRecord);

    if (onSuccess) {
      onSuccess();
    }
  };

  const stepsList = [
    { num: 1, title: 'Line & Paint Data', icon: Layers },
    { num: 2, title: 'Visual 5-Samples', icon: ClipboardList },
    { num: 3, title: 'Adhesion & Delta-E', icon: ShieldCheck },
    { num: 4, title: 'Signatures & Release', icon: FileCheck }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-[24px] max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-150 relative text-xs">
        
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#f4f4f6] hover:bg-[#ececee] text-[#777b86] hover:text-[#17191c] flex items-center justify-center cursor-pointer transition z-10 active:scale-95"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ========================================================================= */}
        {/* VIEW 1: SUCCESS CONFIRMATION & OFFICIAL FPA PRINTABLE READY              */}
        {/* ========================================================================= */}
        {createdFpa ? (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-5 rounded-[20px] bg-[#faf7ed] border border-[#f4e5be] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#c09748] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px] font-mono">
                      ✓ FPA GOLDEN GATE APPROVED
                    </span>
                    <span className="font-mono text-xs text-[#8a6521] font-bold">
                      {createdFpa.reportNo}
                    </span>
                  </div>
                  <h3 className="font-serif font-normal text-lg text-[#17191c] mt-0.5">
                    First Part Approval Report Generated & Signed!
                  </h3>
                  <p className="text-xs text-[#777b86]">
                    Job Card <strong>{createdFpa.jobCardNo}</strong> is cleared for mass production. Standard Excel Format (Issue Date: 01.01.2021 | Rev: 02) with <strong>Master LAB ({createdFpa.masterL}, {createdFpa.masterA}, {createdFpa.masterB})</strong> and <strong>5-Sample Spectrometer Table</strong> is ready.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(createdFpa)}
                  className="px-4 py-2 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download FPA PDF</span>
                </button>
              </div>
            </div>

            {downloadError && (
              <div className="p-3 rounded-[14px] bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                ⚠️ {downloadError}
              </div>
            )}

            {/* Printout Notice Box */}
            <div className="p-4 rounded-[18px] bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-1">
                <p className="font-bold">Mandatory Physical Step: 3M Tape Sticking</p>
                <p className="text-amber-800 leading-relaxed">
                  Please print this generated FPA PDF. The PDF contains the dedicated <strong>[ Tape impression ]</strong> box in Section 2 where the QC inspector must physically stick the peeled 3M cross-cut test tape before archiving the file.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-[18px] bg-[#fafafb] border border-[#ececec] space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                <div>
                  <span className="text-[#777b86] block text-[9px] uppercase">Job Card</span>
                  <strong>{createdFpa.jobCardNo}</strong>
                </div>
                <div>
                  <span className="text-[#777b86] block text-[9px] uppercase">Master Ref</span>
                  <strong className="text-[#8a6521]">L:{createdFpa.masterL} a:{createdFpa.masterA} b:{createdFpa.masterB}</strong>
                </div>
                <div>
                  <span className="text-[#777b86] block text-[9px] uppercase">Tape Adhesion</span>
                  <strong className="text-emerald-700">{createdFpa.adhesionPercent}% (ASTM 5B)</strong>
                </div>
                <div>
                  <span className="text-[#777b86] block text-[9px] uppercase">QA Incharge</span>
                  <strong>{createdFpa.qcEngineer}</strong>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#ececec]">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] font-semibold text-xs transition cursor-pointer shadow-2xs active:scale-95"
              >
                Return to Floor Operations
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: MULTI-STEP WIZARD (PARTS KE ANDAR FILL KARNA)                     */
          /* ========================================================================= */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Modal Header */}
            <div className="space-y-1 pb-2 border-b border-[#ececec] pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-mono font-bold">
                  DOC NO: PK-QA-FPA-001 • REV: 02
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#17191c] text-[10px] font-mono font-semibold">
                  Job Card: {jobCardNo}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold">
                  Target: ΔE ≤ 0.70 & 100% Adhesion
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif text-[#17191c] font-normal tracking-tight">
                First Part Approval (FPA) Inspection Wizard
              </h2>
            </div>

            {/* CONNECTED PILL STEPPER */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 p-1.5 bg-[#fafafb] rounded-full border border-[#ececec]">
              {stepsList.map(s => {
                const isActive = currentStep === s.num;
                const isCompleted = currentStep > s.num;
                const IconComponent = s.icon;
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => setCurrentStep(s.num as any)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                      isActive
                        ? 'bg-[#c09748] text-white shadow-xs'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'text-[#777b86] hover:text-[#17191c] hover:bg-white'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">{s.title}</span>
                    <span className="sm:hidden">Step {s.num}</span>
                  </button>
                );
              })}
            </div>

            {/* ========================================================================= */}
            {/* STEP 1: PRODUCTION LINE & PAINT IDENTIFICATION (AUTO-FILLED)              */}
            {/* ========================================================================= */}
            {currentStep === 1 && (
              <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#c09748]" />
                    <span>Step 1: Production Line & Paint Mix Identification</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                    ✓ Pre-populated from Job Card
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                    <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Family (Mould Group)</label>
                    <input
                      type="text"
                      value={family}
                      onChange={e => setFamily(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs text-[#17191c] outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Customer / OEM</label>
                    <input
                      type="text"
                      value={customer}
                      onChange={e => setCustomer(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs text-[#17191c] outline-none"
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
                    <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Paint Description</label>
                    <input
                      type="text"
                      value={paintDescription}
                      onChange={e => setPaintDescription(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs text-[#17191c] outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Paint Batch Number</label>
                    <input
                      type="text"
                      value={paintBatch}
                      onChange={e => setPaintBatch(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-mono text-[#17191c] outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Thinner Batch Number</label>
                    <input
                      type="text"
                      value={thinnerBatch}
                      onChange={e => setThinnerBatch(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-mono text-[#17191c] outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Painter Name</label>
                    <input
                      type="text"
                      value={painter}
                      onChange={e => setPainter(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs text-[#17191c] outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Painting Booth</label>
                    <input
                      type="text"
                      value={booth}
                      onChange={e => setBooth(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs text-[#17191c] outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Startup Time</label>
                    <input
                      type="text"
                      value={startupTime}
                      onChange={e => setStartupTime(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs text-[#17191c] outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Viscosity (Ford Cup 4 sec)</label>
                    <input
                      type="number"
                      value={viscositySec}
                      onChange={e => setViscositySec(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-mono font-bold text-[#17191c] outline-none"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: VISUAL TEST MATRIX (A-F across S1 to S5)                          */}
            {/* ========================================================================= */}
            {currentStep === 2 && (
              <div className="p-4 rounded-[20px] bg-white border border-[#ececec] space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-[#c09748]" />
                    <span>Step 2: Visual Test Checklist (5 Samples: S1 - S5)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setAllVisualChecks('Pass')}
                    className="px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3 h-3 text-emerald-700" />
                    <span>✓ Quick Mark: All 5 Samples OK</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-[#ececec] rounded-[14px]">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-[#f2f2f3] text-[#17191c] font-bold text-[10px] border-b border-[#ececec]">
                      <tr>
                        <th className="py-2.5 px-3 w-1/3">Visual Parameter</th>
                        {['S1', 'S2', 'S3', 'S4', 'S5'].map((s, idx) => (
                          <th key={idx} className="py-2.5 px-2 text-center">{s}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f2f2f3]">
                      {[
                        { key: 'bubble' as keyof FPAVisualCheckRow, label: 'A. Bubble (Solvent Pop / Air)' },
                        { key: 'dustSpot' as keyof FPAVisualCheckRow, label: 'B. Dust Spot / Particle Nibs' },
                        { key: 'overPaint' as keyof FPAVisualCheckRow, label: 'C. Over Paint / Runs / Sagging' },
                        { key: 'paintMissing' as keyof FPAVisualCheckRow, label: 'D. Paint Missing / Dry Spray' },
                        { key: 'colour' as keyof FPAVisualCheckRow, label: 'E. Colour Shade Match' },
                        { key: 'overallFinishing' as keyof FPAVisualCheckRow, label: 'F. Overall Finishing & Texture' }
                      ].map((row) => (
                        <tr key={row.key} className="hover:bg-[#fafafb]">
                          <td className="py-2 px-3 font-semibold text-[#17191c]">{row.label}</td>
                          {visualChecks[row.key].map((val, sampleIdx) => (
                            <td key={sampleIdx} className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => toggleVisualCell(row.key, sampleIdx)}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                                  val === 'Pass' 
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                                }`}
                              >
                                {val === 'Pass' ? 'OK' : 'NOT OK'}
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: ADHESION & DIRECT 5-SAMPLE SPECTROMETER DELTA-E INPUTS            */}
            {/* ========================================================================= */}
            {currentStep === 3 && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                {/* 3A: Adhesion Card */}
                <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#c09748]" />
                      <span>3A. Adhesion Test (ASTM 5B Cross Cut)</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      100% Cross-Cut Required
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
                    <div>
                      <label className="block text-[9px] text-[#777b86] font-semibold mb-0.5">Cross-Cut Status</label>
                      <select
                        value={crossCutTest}
                        onChange={e => setCrossCutTest(e.target.value as any)}
                        className="w-full p-2 rounded-[12px] bg-white border border-[#ececec] text-xs font-semibold text-[#17191c]"
                      >
                        <option value="Pass">OK (Zero Flaking)</option>
                        <option value="Fail">NOT OK (Flaked)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#777b86] font-semibold mb-0.5">3M Tape Pull Test</label>
                      <select
                        value={tapeTest}
                        onChange={e => setTapeTest(e.target.value as any)}
                        className="w-full p-2 rounded-[12px] bg-white border border-[#ececec] text-xs font-semibold text-[#17191c]"
                      >
                        <option value="Pass">OK (100% Intact)</option>
                        <option value="Fail">NOT OK (Peeled)</option>
                      </select>
                    </div>
                    {/* Simulated Physical Tape Box */}
                    <div className="p-2 rounded-[12px] bg-white border-2 border-dashed border-[#c09748]/50 text-center space-y-0.5">
                      <span className="text-[10px] font-mono font-bold text-[#8a6521] block">
                        [ Tape Impression Box ]
                      </span>
                      <p className="text-[9px] text-[#777b86]">
                        Reserved space on PDF to stick physical 3M tape
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3B: Delta Value Test (Master LAB + Spectrometer 5-Samples Entry Table) */}
                <div className="p-4 rounded-[20px] bg-white border border-[#ececec] space-y-3">
                  <div>
                    <span className="text-[10.5px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1">
                      <FlaskConical className="w-3.5 h-3.5 text-[#c09748]" />
                      <span>3B. Master Standard LAB & 5-Sample Spectrometer Delta-E Table</span>
                    </span>
                    <p className="text-[10px] text-[#777b86] mt-0.5">
                      Feed Master Plaque Reference & direct readings for S1..S5. Standard Target: ΔE ≤ 0.70 vs Master.
                    </p>
                  </div>

                  {/* MASTER LAB FEED STRIP */}
                  <div className="p-3 rounded-[16px] bg-[#faf7ed] border border-[#f4e5be] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#8a6521] uppercase font-mono flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-[#c09748]" />
                        <span>Master Standard Shade Reference (Target Plaque)</span>
                      </span>
                      <span className="text-[9.5px] font-mono text-[#8a6521]">Master Plaque Reference Code</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[9px] font-bold text-[#8a6521] mb-0.5">Master L* (Lightness)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={masterL}
                          onChange={e => setMasterL(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-[10px] bg-white border border-[#f4e5be] text-xs font-mono font-bold text-[#17191c] outline-none focus:border-[#c09748]"
                          placeholder="42.00"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-[#8a6521] mb-0.5">Master a* (Red / Green)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={masterA}
                          onChange={e => setMasterA(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-[10px] bg-white border border-[#f4e5be] text-xs font-mono font-bold text-[#17191c] outline-none focus:border-[#c09748]"
                          placeholder="54.00"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-[#8a6521] mb-0.5">Master b* (Yellow / Blue)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={masterB}
                          onChange={e => setMasterB(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-[10px] bg-white border border-[#f4e5be] text-xs font-mono font-bold text-[#17191c] outline-none focus:border-[#c09748]"
                          placeholder="28.00"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-[#8a6521] mb-0.5">Master Plaque / Sample Ref</label>
                        <input
                          type="text"
                          value={masterPlaqueRef}
                          onChange={e => setMasterPlaqueRef(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-[10px] bg-white border border-[#f4e5be] text-xs font-semibold text-[#17191c] outline-none focus:border-[#c09748]"
                          placeholder="OEM Approved Plaque #01"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5-SAMPLE TABLE */}
                  <div className="overflow-x-auto border border-[#ececec] rounded-[14px]">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-[#f2f2f3] text-[#17191c] font-bold text-[10px] border-b border-[#ececec]">
                        <tr>
                          <th className="py-2.5 px-3 w-[22%]">Parameter</th>
                          <th className="py-2.5 px-2 text-center w-[14%] text-[#8a6521] bg-[#faf3e0]/80">Master Ref</th>
                          <th className="py-2.5 px-2 text-center w-[12%]">Tech</th>
                          {['S1', 'S2', 'S3', 'S4', 'S5'].map((s, idx) => (
                            <th key={idx} className="py-2.5 px-2 text-center w-[10.4%]">{s}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f2f2f3]">
                        {/* Row A: L */}
                        <tr className="hover:bg-[#fafafb]">
                          <td className="py-2 px-3 font-semibold text-[#17191c]">A. L (Lightness)</td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-[#8a6521] bg-[#faf7ed]/50">{masterL}</td>
                          <td className="py-2 px-2 text-center text-[#777b86] font-mono text-[10px]">Spectrometer</td>
                          {[0, 1, 2, 3, 4].map(sIdx => (
                            <td key={sIdx} className="py-1.5 px-1.5 text-center">
                              <input
                                type="number"
                                step="0.01"
                                value={deltaSamples.L[sIdx]}
                                onChange={e => handleDeltaCellChange('L', sIdx, e.target.value)}
                                className="w-full text-center px-1 py-1 rounded-[8px] bg-[#fafafb] border border-[#dcdfe4] text-xs font-mono font-bold text-[#17191c] outline-none focus:border-[#c09748]"
                                placeholder="42.15"
                                required
                              />
                            </td>
                          ))}
                        </tr>

                        {/* Row B: A */}
                        <tr className="hover:bg-[#fafafb]">
                          <td className="py-2 px-3 font-semibold text-[#17191c]">B. A (Red / Green)</td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-[#8a6521] bg-[#faf7ed]/50">{masterA}</td>
                          <td className="py-2 px-2 text-center text-[#777b86] font-mono text-[10px]">Spectrometer</td>
                          {[0, 1, 2, 3, 4].map(sIdx => (
                            <td key={sIdx} className="py-1.5 px-1.5 text-center">
                              <input
                                type="number"
                                step="0.01"
                                value={deltaSamples.a[sIdx]}
                                onChange={e => handleDeltaCellChange('a', sIdx, e.target.value)}
                                className="w-full text-center px-1 py-1 rounded-[8px] bg-[#fafafb] border border-[#dcdfe4] text-xs font-mono font-bold text-[#17191c] outline-none focus:border-[#c09748]"
                                placeholder="54.30"
                                required
                              />
                            </td>
                          ))}
                        </tr>

                        {/* Row C: B */}
                        <tr className="hover:bg-[#fafafb]">
                          <td className="py-2 px-3 font-semibold text-[#17191c]">C. B (Yellow / Blue)</td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-[#8a6521] bg-[#faf7ed]/50">{masterB}</td>
                          <td className="py-2 px-2 text-center text-[#777b86] font-mono text-[10px]">Spectrometer</td>
                          {[0, 1, 2, 3, 4].map(sIdx => (
                            <td key={sIdx} className="py-1.5 px-1.5 text-center">
                              <input
                                type="number"
                                step="0.01"
                                value={deltaSamples.b[sIdx]}
                                onChange={e => handleDeltaCellChange('b', sIdx, e.target.value)}
                                className="w-full text-center px-1 py-1 rounded-[8px] bg-[#fafafb] border border-[#dcdfe4] text-xs font-mono font-bold text-[#17191c] outline-none focus:border-[#c09748]"
                                placeholder="28.10"
                                required
                              />
                            </td>
                          ))}
                        </tr>

                        {/* Row D: Delta E (Direct Input) */}
                        <tr className="bg-[#faf7ed]/60">
                          <td className="py-2 px-3 font-bold text-[#8a6521]">D. ΔE (Delta Value)</td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-[#8a6521] bg-[#faf3e0]/80">Limit ≤ 0.70</td>
                          <td className="py-2 px-2 text-center text-[#8a6521] font-mono text-[10px]">Spectrometer</td>
                          {[0, 1, 2, 3, 4].map(sIdx => {
                            const valNum = Number(deltaSamples.deltaE[sIdx]);
                            const isCellPass = !isNaN(valNum) && valNum <= 0.70;
                            return (
                              <td key={sIdx} className="py-1.5 px-1.5 text-center">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={deltaSamples.deltaE[sIdx]}
                                  onChange={e => handleDeltaCellChange('deltaE', sIdx, e.target.value)}
                                  className={`w-full text-center px-1 py-1 rounded-[8px] border text-xs font-mono font-bold outline-none ${
                                    isCellPass
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                      : 'bg-rose-50 border-rose-300 text-rose-900'
                                  }`}
                                  placeholder="0.38"
                                  required
                                />
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 4: SIGNATURES & FINAL PRODUCTION RELEASE                             */}
            {/* ========================================================================= */}
            {currentStep === 4 && (
              <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-3 animate-in fade-in duration-150">
                <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-[#c09748]" />
                  <span>Step 4: Department Acceptance Signatures & Line Clearance</span>
                </span>

                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-1">Quality Engineer Comments & Release Notes</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-[12px] bg-white border border-[#ececec] text-xs text-[#17191c] outline-none font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Acceptance Painter</label>
                    <input
                      type="text"
                      value={acceptancePainter}
                      onChange={e => setAcceptancePainter(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-semibold text-[#17191c]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Production Incharge</label>
                    <input
                      type="text"
                      value={acceptanceProductionIncharge}
                      onChange={e => setAcceptanceProductionIncharge(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-semibold text-[#17191c]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Prepared By (QA Eng.)</label>
                    <input
                      type="text"
                      value={qcEngineer}
                      onChange={e => setQcEngineer(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-[12px] bg-white border border-[#ececec] text-xs font-semibold text-[#17191c]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Approved By (QA Head)</label>
                    <div className="flex items-center gap-2 pt-1.5">
                      <input
                        type="checkbox"
                        id="managerQAApproval"
                        checked={managerQAApproval}
                        onChange={e => setManagerQAApproval(e.target.checked)}
                        className="w-4 h-4 accent-[#c09748] rounded cursor-pointer"
                      />
                      <label htmlFor="managerQAApproval" className="text-xs font-bold text-[#17191c] cursor-pointer">
                        Manager QA Sign
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Navigation & Submit Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-[#ececec]">
              <div>
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => (prev - 1) as any)}
                    className="px-4 py-2 rounded-full bg-[#f4f4f6] hover:bg-[#ececee] text-[#17191c] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous Step</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-full bg-[#f4f4f6] hover:bg-[#ececee] text-[#17191c] text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div>
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => (prev + 1) as any)}
                    className="px-5 py-2 rounded-full bg-[#17191c] hover:bg-black text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs"
                  >
                    <span>Next: {stepsList[currentStep].title}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className={`px-6 py-2.5 rounded-full font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95 ${
                      isEligibleForApproval
                        ? 'bg-[#c09748] hover:bg-[#a97e35] text-white'
                        : 'bg-amber-600 hover:bg-amber-700 text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isEligibleForApproval ? '✓ Approve & Release for Mass Production' : '⚠️ Submit as Hold (QC Flag)'}</span>
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
