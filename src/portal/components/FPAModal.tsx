import React, { useState, useEffect } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { JobCard, FPARecord } from '../types/portalTypes';
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
  Clock
} from 'lucide-react';
import { downloadStandardFPAPdf, formatDateDDMMYYYY } from '../utils/pdfStandardHeader';

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

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [woNo, setWoNo] = useState<string>('WO-1042');
  const [jobCardNo, setJobCardNo] = useState<string>('JC-1042-RED');
  const [customer, setCustomer] = useState<string>('ROOP POLYMERS LTD');
  const [partCode, setPartCode] = useState<string>('RP-8841');
  const [color, setColor] = useState<string>('Monza Red Gloss');
  const [paintBatch, setPaintBatch] = useState<string>('BAT-PPG-2609-R4');
  const [painter, setPainter] = useState<string>('Ramesh Kumar (P1)');
  const [booth, setBooth] = useState<string>('Booth #1 (Enclosed)');
  const [viscositySec, setViscositySec] = useState<number>(15);

  // 5 Sample Tests
  const [sample1, setSample1] = useState<'Pass' | 'Fail'>('Pass');
  const [sample2, setSample2] = useState<'Pass' | 'Fail'>('Pass');
  const [sample3, setSample3] = useState<'Pass' | 'Fail'>('Pass');
  const [sample4, setSample4] = useState<'Pass' | 'Fail'>('Pass');
  const [sample5, setSample5] = useState<'Pass' | 'Fail'>('Pass');

  // CIELAB Colorimetry
  const [L, setL] = useState<number>(42.15);
  const [a, setA] = useState<number>(54.30);
  const [b, setB] = useState<number>(28.10);
  const [deltaE, setDeltaE] = useState<number>(0.38);

  // Adhesion & Physical Tests
  const [adhesionPercent, setAdhesionPercent] = useState<number>(100);
  const [crossCutTest, setCrossCutTest] = useState<'Pass' | 'Fail'>('Pass');
  const [tapeTest, setTapeTest] = useState<'Pass' | 'Fail'>('Pass');
  const [conductivity, setConductivity] = useState<'Pass' | 'Fail' | 'N/A'>('Pass');

  // Signatures
  const [qcEngineer, setQcEngineer] = useState<string>(currentUser?.name || 'Amit Verma (QA Lead)');
  const [managerQAApproval, setManagerQAApproval] = useState<boolean>(true);
  const [remarks, setRemarks] = useState<string>('Colorimetry ΔE ≤ 0.70 & cross-hatch 100% tape adhesion verified against OEM Master Plaque. Released for full mass production.');

  // Result state after creation
  const [createdFpa, setCreatedFpa] = useState<FPARecord | null>(null);

  useEffect(() => {
    if (jobCard) {
      setJobCardNo(jobCard.jobCardNo);
      setWoNo(jobCard.woNo || jobCard.wNo || 'WO-1042');
      setCustomer(jobCard.customer || 'ROOP POLYMERS LTD');
      setPartCode(jobCard.partCode || 'RP-8841');
      setColor(jobCard.color || 'Monza Red Gloss');
      setPainter(jobCard.assignedPainterName || jobCard.painterName || 'Ramesh Kumar (P1)');
      setBooth(jobCard.boothNo || 'Booth #1');
      setPaintBatch(jobCard.paintBatch || 'BAT-PPG-2609-R4');
      setCreatedFpa(null);
    }
  }, [jobCard, isOpen]);

  // Recalculate Delta E simulation
  const handleColorChange = (newL: number, newA: number, newB: number) => {
    setL(newL);
    setA(newA);
    setB(newB);
    // Standard Master reference (L0: 42.00, a0: 54.00, b0: 28.00)
    const dL = newL - 42.00;
    const da = newA - 54.00;
    const db = newB - 28.00;
    const calc = Math.sqrt(dL * dL + da * da + db * db);
    setDeltaE(parseFloat(calc.toFixed(2)));
  };

  const isDeltaEPass = deltaE <= 0.70;
  const isAdhesionPass = adhesionPercent === 100 && crossCutTest === 'Pass' && tapeTest === 'Pass';
  const isAllSamplesPass = sample1 === 'Pass' && sample2 === 'Pass' && sample3 === 'Pass' && sample4 === 'Pass' && sample5 === 'Pass';
  const isEligibleForApproval = isDeltaEPass && isAdhesionPass && isAllSamplesPass;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fpaData = {
      date,
      plant: activePlant,
      woNo,
      jobCardNo,
      customer,
      partCode,
      color,
      paintBatch,
      painter,
      booth,
      viscositySec: Number(viscositySec),
      sample1,
      sample2,
      sample3,
      sample4,
      sample5,
      L: Number(L),
      a: Number(a),
      b: Number(b),
      deltaE: Number(deltaE),
      adhesionPercent: Number(adhesionPercent),
      crossCutTest,
      tapeTest,
      conductivity,
      qcEngineer,
      managerQAApproval,
      remarks
    };

    createFPARecord(fpaData);

    const generatedRecord: FPARecord = {
      ...fpaData,
      reportNo: `PK-FPA-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      overallResult: isEligibleForApproval ? 'Approved' : 'Hold'
    };
    setCreatedFpa(generatedRecord);

    if (onSuccess) {
      onSuccess();
    }
  };

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
        {createdFpa ? (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-5 rounded-[22px] bg-[#faf7ed] border border-[#f4e5be] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                    First Part Approval Verified & Signed!
                  </h3>
                  <p className="text-xs text-[#777b86]">
                    Job Card <strong>{createdFpa.jobCardNo}</strong> is now unlocked for mass production run. Colorimetry ΔE: <strong>{createdFpa.deltaE}</strong> (Passed).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => downloadStandardFPAPdf(createdFpa)}
                  className="px-4 py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-[#8a6521]" />
                  <span>Download FPA PDF</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                <div>
                  <span className="text-[#777b86] block text-[9px] uppercase">Job Card</span>
                  <strong>{createdFpa.jobCardNo}</strong>
                </div>
                <div>
                  <span className="text-[#777b86] block text-[9px] uppercase">Delta-E (ΔE)</span>
                  <strong className="text-emerald-700">{createdFpa.deltaE} (Passed)</strong>
                </div>
                <div>
                  <span className="text-[#777b86] block text-[9px] uppercase">Tape Adhesion</span>
                  <strong className="text-emerald-700">{createdFpa.adhesionPercent}% (ASTM 5B)</strong>
                </div>
                <div>
                  <span className="text-[#777b86] block text-[9px] uppercase">Approved By</span>
                  <strong>Rajesh Nair (Head QA)</strong>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#ececec]">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-[#17191c] hover:bg-black text-white font-semibold text-xs transition cursor-pointer shadow-xs active:scale-95"
              >
                Return to Floor Operations
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: NEXTUI MODERN FPA GOLDEN GATE INSPECTION FORM                    */
          /* ========================================================================= */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Modal Header */}
            <div className="space-y-1 pb-3 border-b border-[#ececec] pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-mono font-bold">
                  QUALITY GATE 2 • PK-QA-FPA-001
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#17191c] text-[10px] font-mono font-semibold">
                  Job Card: {jobCardNo}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold">
                  Target: ΔE ≤ 0.70 & 100% Adhesion
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif text-[#17191c] font-normal tracking-tight">
                First Part Approval (FPA - Golden Gate) Report
              </h2>
              <p className="text-xs text-[#777b86]">
                Verify initial 5 sample test plaques before releasing the booth for mass production run.
              </p>
            </div>

            {/* PART 1: ORDER & SPRAY BOOTH METADATA */}
            <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-2.5">
              <div className="text-[10px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#c09748]" />
                <span>1. Production Line & Paint Mix Identification</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Work Order No</label>
                  <input
                    type="text"
                    value={woNo}
                    onChange={e => setWoNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-[14px] bg-white border border-[#ececec] text-xs font-mono font-bold text-[#17191c] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Customer / OEM</label>
                  <input
                    type="text"
                    value={customer}
                    onChange={e => setCustomer(e.target.value)}
                    className="w-full px-3 py-2 rounded-[14px] bg-white border border-[#ececec] text-xs text-[#17191c] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Part Component</label>
                  <input
                    type="text"
                    value={partCode}
                    onChange={e => setPartCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-[14px] bg-white border border-[#ececec] text-xs text-[#17191c] outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Color Shade</label>
                  <input
                    type="text"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-[14px] bg-[#faf7ed] border border-[#f4e5be] text-xs font-bold text-[#8a6521] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Paint Batch No</label>
                  <input
                    type="text"
                    value={paintBatch}
                    onChange={e => setPaintBatch(e.target.value)}
                    className="w-full px-3 py-2 rounded-[14px] bg-white border border-[#ececec] text-xs font-mono text-[#17191c] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Assigned Painter</label>
                  <input
                    type="text"
                    value={painter}
                    onChange={e => setPainter(e.target.value)}
                    className="w-full px-3 py-2 rounded-[14px] bg-white border border-[#ececec] text-xs text-[#17191c] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Spray Booth</label>
                  <input
                    type="text"
                    value={booth}
                    onChange={e => setBooth(e.target.value)}
                    className="w-full px-3 py-2 rounded-[14px] bg-white border border-[#ececec] text-xs text-[#17191c] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Viscosity (Ford Cup 4 sec)</label>
                  <input
                    type="number"
                    value={viscositySec}
                    onChange={e => setViscositySec(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-[14px] bg-white border border-[#ececec] text-xs font-mono font-bold text-[#17191c] outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* PART 2: INITIAL 5 SAMPLE PLAQUES RUN */}
            <div className="p-4 rounded-[20px] bg-white border border-[#ececec] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                  2. Initial 5-Sample Test Pieces Evaluation
                </span>
                <span className="text-[10px] text-emerald-800 font-semibold">
                  Zero Pin Marks, Blisters & Dust Nibs Required
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 text-center">
                {[
                  { name: 'Sample #1', val: sample1, setVal: setSample1 },
                  { name: 'Sample #2', val: sample2, setVal: setSample2 },
                  { name: 'Sample #3', val: sample3, setVal: setSample3 },
                  { name: 'Sample #4', val: sample4, setVal: setSample4 },
                  { name: 'Sample #5', val: sample5, setVal: setSample5 }
                ].map((s, idx) => (
                  <div key={idx} className="p-2.5 rounded-[16px] bg-[#fafafb] border border-[#ececec] space-y-1.5">
                    <span className="text-[10px] font-bold text-[#17191c] block">{s.name}</span>
                    <button
                      type="button"
                      onClick={() => s.setVal(s.val === 'Pass' ? 'Fail' : 'Pass')}
                      className={`w-full py-1.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                        s.val === 'Pass'
                          ? 'bg-emerald-100 border border-emerald-300 text-emerald-900'
                          : 'bg-rose-100 border border-rose-300 text-rose-900'
                      }`}
                    >
                      {s.val === 'Pass' ? '✓ Pass' : '⚠️ Fail'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* PART 3: CIELAB COLORIMETRY & ASTM 5B TAPE TEST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Colorimetry Card */}
              <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1">
                    <FlaskConical className="w-3.5 h-3.5 text-[#c09748]" />
                    <span>CIELAB Spectrophotometer</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isDeltaEPass ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}>
                    ΔE = {deltaE.toFixed(2)} ({isDeltaEPass ? 'Pass' : 'Exceeded'})
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] text-[#777b86] font-semibold">L* (Lightness)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={L}
                      onChange={e => handleColorChange(Number(e.target.value), a, b)}
                      className="w-full p-2 rounded-[12px] bg-white border border-[#ececec] text-xs font-mono font-bold text-[#17191c]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-[#777b86] font-semibold">a* (Red/Green)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={a}
                      onChange={e => handleColorChange(L, Number(e.target.value), b)}
                      className="w-full p-2 rounded-[12px] bg-white border border-[#ececec] text-xs font-mono font-bold text-[#17191c]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-[#777b86] font-semibold">b* (Yellow/Blue)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={b}
                      onChange={e => handleColorChange(L, a, Number(e.target.value))}
                      className="w-full p-2 rounded-[12px] bg-white border border-[#ececec] text-xs font-mono font-bold text-[#17191c]"
                    />
                  </div>
                </div>

                <div className="text-[10px] text-[#777b86]">
                  Standard Tolerance: ΔE ≤ 0.70 vs OEM Master Plaque
                </div>
              </div>

              {/* Adhesion & Cross-Cut Test */}
              <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#c09748]" />
                    <span>Adhesion & Tape Test (ASTM 5B)</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isAdhesionPass ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}>
                    {adhesionPercent}% Adhesion
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-[#777b86] font-semibold">Cross-Cut Test</label>
                    <select
                      value={crossCutTest}
                      onChange={e => setCrossCutTest(e.target.value as any)}
                      className="w-full p-2 rounded-[12px] bg-white border border-[#ececec] text-xs font-semibold text-[#17191c]"
                    >
                      <option value="Pass">Pass (Zero Flaking)</option>
                      <option value="Fail">Fail (Flaked)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-[#777b86] font-semibold">3M Tape Pull Test</label>
                    <select
                      value={tapeTest}
                      onChange={e => setTapeTest(e.target.value as any)}
                      className="w-full p-2 rounded-[12px] bg-white border border-[#ececec] text-xs font-semibold text-[#17191c]"
                    >
                      <option value="Pass">Pass (100% Intact)</option>
                      <option value="Fail">Fail (Peeled)</option>
                    </select>
                  </div>
                </div>

                <div className="text-[10px] text-[#777b86]">
                  Adhesion Rate: 100% (Zero detachment required)
                </div>
              </div>
            </div>

            {/* PART 4: SIGNATURES & SUBMIT */}
            <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-2.5">
              <div>
                <label className="block text-[10px] font-semibold text-[#777b86] mb-1">Quality Engineer Remarks & Line Clearance</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[14px] bg-white border border-[#ececec] text-xs text-[#17191c] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">QC Lab Engineer</label>
                  <input
                    type="text"
                    value={qcEngineer}
                    onChange={e => setQcEngineer(e.target.value)}
                    className="w-full px-3 py-2 rounded-[12px] bg-white border border-[#ececec] text-xs font-bold text-[#17191c]"
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="managerQAApproval"
                    checked={managerQAApproval}
                    onChange={e => setManagerQAApproval(e.target.checked)}
                    className="w-4 h-4 accent-[#c09748] rounded cursor-pointer"
                  />
                  <label htmlFor="managerQAApproval" className="text-xs font-bold text-[#17191c] cursor-pointer">
                    Manager QA (Head of Quality) Sign-off
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Action Buttons */}
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
                className={`px-6 py-2.5 rounded-full font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95 ${
                  isEligibleForApproval
                    ? 'bg-[#c09748] hover:bg-[#a97e35] text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEligibleForApproval ? '✓ Approve & Release for Mass Run' : '⚠️ Submit as Hold (QC Flag)'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
