import React, { useState, useEffect } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { JobCard, IPQCRecord } from '../types/portalTypes';
import { 
  Clock, 
  CheckCircle2, 
  X, 
  Download, 
  AlertTriangle, 
  Layers, 
  Gauge, 
  Check, 
  ShieldAlert,
  Wind,
  Droplets,
  Activity
} from 'lucide-react';
import { downloadStandardIPQCPdf, formatDateDDMMYYYY } from '../utils/pdfStandardHeader';

interface IPQCModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobCard?: JobCard | null;
  onSuccess?: () => void;
}

export const IPQCModal: React.FC<IPQCModalProps> = ({
  isOpen,
  onClose,
  jobCard,
  onSuccess
}) => {
  const { addIPQCRecord, activePlant, currentUser } = usePortalStore();

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [checkTime, setCheckTime] = useState<string>('09:00 AM');
  const [woNo, setWoNo] = useState<string>('WO-1042');
  const [partCode, setPartCode] = useState<string>('RP-8841');
  const [color, setColor] = useState<string>('Monza Red Gloss');
  const [painter, setPainter] = useState<string>('Ramesh Kumar (P1)');
  const [booth, setBooth] = useState<string>('Booth #1 (Enclosed)');
  
  // Spray & Atmosphere Parameters
  const [viscositySec, setViscositySec] = useState<number>(15);
  const [airPressureBar, setAirPressureBar] = useState<number>(2.2);
  const [boothTemp, setBoothTemp] = useState<number>(26);
  const [boothHumidity, setBoothHumidity] = useState<number>(60);

  // Defect Checks
  const [bubble, setBubble] = useState<'Pass' | 'Fail'>('Pass');
  const [dustSpot, setDustSpot] = useState<'Pass' | 'Fail'>('Pass');
  const [overPaint, setOverPaint] = useState<'Pass' | 'Fail'>('Pass');
  const [paintMissing, setPaintMissing] = useState<'Pass' | 'Fail'>('Pass');
  const [overallFinishing, setOverallFinishing] = useState<'Pass' | 'Fail'>('Pass');
  const [adhesionTest, setAdhesionTest] = useState<'Pass' | 'Fail'>('Pass');
  const [deltaE, setDeltaE] = useState<number>(0.40);

  const [result, setResult] = useState<'Pass' | 'Fail' | 'Hold'>('Pass');
  const [inspector, setInspector] = useState<string>(currentUser?.name || 'Amit Verma (QA Lead)');

  // Result state after creation
  const [createdIpqc, setCreatedIpqc] = useState<IPQCRecord | null>(null);

  useEffect(() => {
    if (jobCard) {
      setWoNo(jobCard.woNo || jobCard.wNo || 'WO-1042');
      setPartCode(jobCard.partCode || 'RP-8841');
      setColor(jobCard.color || 'Monza Red Gloss');
      setPainter(jobCard.assignedPainterName || jobCard.painterName || 'Ramesh Kumar (P1)');
      setBooth(jobCard.boothNo || 'Booth #1');
      setCreatedIpqc(null);
    }
  }, [jobCard, isOpen]);

  // Determine result automatically based on checks
  useEffect(() => {
    const hasFailures = bubble === 'Fail' || dustSpot === 'Fail' || overPaint === 'Fail' || paintMissing === 'Fail' || overallFinishing === 'Fail' || adhesionTest === 'Fail' || deltaE > 0.70;
    setResult(hasFailures ? 'Fail' : 'Pass');
  }, [bubble, dustSpot, overPaint, paintMissing, overallFinishing, adhesionTest, deltaE]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const reportNo = `PK-IPQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRecord: IPQCRecord = {
      reportNo,
      date,
      plant: activePlant,
      shift: 'Day',
      checkTime,
      woNo,
      partCode,
      color,
      painter,
      booth,
      bubble,
      dustSpot,
      overPaint,
      paintMissing,
      L: 42.15,
      a: 54.30,
      b: 28.10,
      deltaE: Number(deltaE),
      overallFinishing,
      adhesionTest,
      result,
      inspector
    };

    addIPQCRecord(newRecord);
    setCreatedIpqc(newRecord);

    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-[28px] max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-150 relative text-xs">
        
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
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] font-mono ${
                      createdIpqc.result === 'Pass' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                    }`}>
                      {createdIpqc.result === 'Pass' ? '✓ IPQC AUDIT PASSED' : '⚠️ IPQC DEFECT FLAGGED'}
                    </span>
                    <span className="font-mono text-xs text-[#8a6521] font-bold">
                      {createdIpqc.reportNo}
                    </span>
                  </div>
                  <h3 className="font-serif font-normal text-lg text-[#17191c] mt-0.5">
                    3-Hourly IPQC Audit Recorded!
                  </h3>
                  <p className="text-xs text-[#777b86]">
                    Time: <strong>{createdIpqc.checkTime}</strong> • Booth: <strong>{createdIpqc.booth}</strong> • Delta-E: <strong>{createdIpqc.deltaE}</strong>
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
                  <span>Download IPQC PDF</span>
                </button>
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
          /* VIEW 2: NEXTUI MODERN 3-HOURLY IPQC AUDIT FORM                           */
          /* ========================================================================= */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Modal Header */}
            <div className="space-y-1 pb-3 border-b border-[#ececec] pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-mono font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#c09748]" />
                  <span>PK-QA-IPQ-001 • IN-PROCESS AUDIT</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#17191c] text-[10px] font-mono font-semibold">
                  {jobCard ? jobCard.jobCardNo : woNo}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif text-[#17191c] font-normal tracking-tight">
                3-Hourly In-Process Quality Audit (IPQC)
              </h2>
              <p className="text-xs text-[#777b86]">
                Shift inspector performs line check every 3 hours to verify atomization, booth atmosphere, and surface defects.
              </p>
            </div>

            {/* PART 1: AUDIT TIME SLOT & ATMOSPHERE */}
            <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                  1. Shift Check Slot & Booth Parameters
                </span>
                <div className="flex items-center gap-1.5">
                  {['09:00 AM', '12:00 PM', '03:00 PM', '05:30 PM'].map((slot, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => setCheckTime(slot)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition cursor-pointer ${
                        checkTime === slot
                          ? 'bg-[#17191c] text-[#c09748] shadow-2xs'
                          : 'bg-white text-[#777b86] border border-[#ececec] hover:border-[#c09748]'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Air Pressure (Bar)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={airPressureBar}
                    onChange={e => setAirPressureBar(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-[14px] bg-white border border-[#ececec] text-xs font-mono font-bold text-[#17191c] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Viscosity (FC4 sec)</label>
                  <input
                    type="number"
                    value={viscositySec}
                    onChange={e => setViscositySec(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-[14px] bg-white border border-[#ececec] text-xs font-mono font-bold text-[#17191c] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Booth Temp (°C)</label>
                  <input
                    type="number"
                    value={boothTemp}
                    onChange={e => setBoothTemp(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-[14px] bg-white border border-[#ececec] text-xs font-mono font-bold text-[#17191c] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#777b86] mb-0.5">Humidity (% RH)</label>
                  <input
                    type="number"
                    value={boothHumidity}
                    onChange={e => setBoothHumidity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-[14px] bg-white border border-[#ececec] text-xs font-mono font-bold text-[#17191c] outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* PART 2: LIVE DEFECTS CHECKPOINTS */}
            <div className="p-4 rounded-[20px] bg-white border border-[#ececec] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                  2. In-Process Defect Audits (5 Pcs Shift Sample)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setBubble('Pass');
                    setDustSpot('Pass');
                    setOverPaint('Pass');
                    setPaintMissing('Pass');
                    setOverallFinishing('Pass');
                    setAdhesionTest('Pass');
                    setDeltaE(0.38);
                  }}
                  className="text-[10px] font-bold text-[#8a6521] underline hover:text-[#c09748] cursor-pointer"
                >
                  Quick: All Pass ✓
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { name: 'Bubble / Blister', val: bubble, setVal: setBubble },
                  { name: 'Dust Spot / Nibs', val: dustSpot, setVal: setDustSpot },
                  { name: 'Over-Paint / Runs', val: overPaint, setVal: setOverPaint },
                  { name: 'Paint Missing / Wrap', val: paintMissing, setVal: setPaintMissing },
                  { name: 'Texture / Finish', val: overallFinishing, setVal: setOverallFinishing },
                  { name: 'Shift Tape Adhesion', val: adhesionTest, setVal: setAdhesionTest }
                ].map((chk, idx) => (
                  <div key={idx} className="p-2.5 rounded-[16px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-[#17191c] truncate">{chk.name}</span>
                    <button
                      type="button"
                      onClick={() => chk.setVal(chk.val === 'Pass' ? 'Fail' : 'Pass')}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition cursor-pointer shrink-0 ${
                        chk.val === 'Pass'
                          ? 'bg-emerald-100 border border-emerald-300 text-emerald-900'
                          : 'bg-rose-100 border border-rose-300 text-rose-900'
                      }`}
                    >
                      {chk.val === 'Pass' ? '✓ Pass' : '⚠️ Fail'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-[16px] bg-[#faf7ed] border border-[#f4e5be] flex items-center justify-between gap-3 pt-2">
                <div>
                  <span className="text-[10px] font-bold text-[#8a6521] uppercase block">Spectrophotometer Delta-E Check</span>
                  <span className="text-[10px] text-[#777b86]">Standard: ΔE ≤ 0.70</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={deltaE}
                    onChange={e => setDeltaE(Number(e.target.value))}
                    className="w-20 px-2.5 py-1 rounded-[10px] bg-white border border-[#f4e5be] text-xs font-mono font-bold text-[#17191c] text-center"
                  />
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    deltaE <= 0.70 ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                  }`}>
                    {deltaE <= 0.70 ? '✓ Within Limit' : '⚠️ Exceeded'}
                  </span>
                </div>
              </div>
            </div>

            {/* PART 3: AUDITOR DISPOSITION & SUBMIT */}
            <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-[#777b86] uppercase font-semibold block">Quality Auditor</span>
                <span className="text-xs font-bold text-[#17191c]">{inspector}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                  result === 'Pass' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}>
                  Overall: {result.toUpperCase()}
                </span>
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
                className={`px-6 py-2.5 rounded-full font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95 ${
                  result === 'Pass'
                    ? 'bg-[#c09748] hover:bg-[#a97e35] text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{result === 'Pass' ? '✓ Record Passed Audit' : '⚠️ Record Audit with Discrepancy'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
