import React, { useState, useEffect } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { JobCard, PreProductionInspectionRecord } from '../types/portalTypes';
import { 
  CheckCircle2, 
  X, 
  Download, 
  Layers, 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  Check, 
  User, 
  Sliders,
  AlertTriangle,
  Flame,
  Wind,
  Droplets,
  PackageCheck,
  Building2
} from 'lucide-react';
import { downloadStandardPreProductionPdf, formatDateDDMMYYYY } from '../utils/pdfStandardHeader';

interface PreProductionInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobCard?: JobCard | null;
  onSuccess?: () => void;
}

export const PreProductionInspectionModal: React.FC<PreProductionInspectionModalProps> = ({
  isOpen,
  onClose,
  jobCard,
  onSuccess
}) => {
  const { addPreProductionReport, activePlant, currentUser, jobCards } = usePortalStore();

  // Header & Identification
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [docNo] = useState<string>('PK-QA-PIR-001');
  const [revNo] = useState<string>('00');
  const [revDate] = useState<string>('00');

  const [selectedJobCardNo, setSelectedJobCardNo] = useState<string>('');
  const [customer, setCustomer] = useState<string>('ROOP POLYMERS LTD');
  const [workOrderNo, setWorkOrderNo] = useState<string>('WO-1042');
  const [partCode, setPartCode] = useState<string>('RP-8841');
  const [partDescription, setPartDescription] = useState<string>('Car AC Vent Bezel Substrate (ABS)');
  const [family, setFamily] = useState<string>('Auto Vent Bezel Family (Mould-01)');
  const [substrateMaterial, setSubstrateMaterial] = useState<string>('ABS (Acrylonitrile Butadiene Styrene)');
  const [color, setColor] = useState<string>('Monza Red Gloss');

  // Quantities
  const [issuedQty, setIssuedQty] = useState<number>(250);
  const [inspectedQty, setInspectedQty] = useState<number>(250);
  const [acceptedQty, setAcceptedQty] = useState<number>(250);
  const [rejectedQty, setRejectedQty] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // 8 Checkpoints State
  const [physicalCondition, setPhysicalCondition] = useState<'Pass' | 'Fail'>('Pass');
  const [burrsFlashSinkMarks, setBurrsFlashSinkMarks] = useState<'Pass' | 'Fail'>('Pass');
  const [oilGreaseChemical, setOilGreaseChemical] = useState<'Pass' | 'Fail'>('Pass');
  const [cleaningIpaWiping, setCleaningIpaWiping] = useState<'Pass' | 'Fail'>('Pass');
  const [staticDedusting, setStaticDedusting] = useState<'Pass' | 'Fail'>('Pass');
  const [maskingProtection, setMaskingProtection] = useState<'Pass' | 'Fail' | 'N/A'>('Pass');
  const [jiggingOrientation, setJiggingOrientation] = useState<'Pass' | 'Fail'>('Pass');
  const [quantityVerification, setQuantityVerification] = useState<'Pass' | 'Fail'>('Pass');

  // Decision & Signatures
  const [remarks, setRemarks] = useState<string>(
    '100% Substrates cleaned with Isopropyl alcohol (IPA), static de-dusted. Zero flash, oil or burrs observed. Authorized for Gate 2 (FPA test spray).'
  );
  const [inspectedBy, setInspectedBy] = useState<string>(currentUser?.name || 'Kailash Yadav (Line Inspector)');
  const [productionSupervisor, setProductionSupervisor] = useState<string>('Vikram Patel (Shift A Lead)');
  const [qaEngineer, setQaEngineer] = useState<string>('Amit Verma (Lead QA Auditor)');

  const [createdRecord, setCreatedRecord] = useState<PreProductionInspectionRecord | null>(null);

  useEffect(() => {
    if (jobCard) {
      setSelectedJobCardNo(jobCard.jobCardNo);
      setCustomer(jobCard.customer || 'ROOP POLYMERS LTD');
      setWorkOrderNo(jobCard.woNo || jobCard.wNo || 'WO-1042');
      setPartCode(jobCard.partCode || 'RP-8841');
      setPartDescription(jobCard.partDescription || `${jobCard.partCode} Component`);
      setFamily(jobCard.family || `${jobCard.partCode} Family`);
      setColor(jobCard.color || 'Monza Red Gloss');
      const qty = jobCard.targetQty || 250;
      setIssuedQty(qty);
      setInspectedQty(qty);
      setAcceptedQty(qty);
      setRejectedQty(0);
      setCreatedRecord(null);
    } else if (jobCards && jobCards.length > 0) {
      const first = jobCards[0];
      setSelectedJobCardNo(first.jobCardNo);
      setCustomer(first.customer || 'ROOP POLYMERS LTD');
      setWorkOrderNo(first.woNo || first.wNo || 'WO-1042');
      setPartCode(first.partCode || 'RP-8841');
      setPartDescription(first.partDescription || `${first.partCode} Component`);
      setFamily(first.family || `${first.partCode} Family`);
      setColor(first.color || 'Monza Red Gloss');
      const qty = first.targetQty || 250;
      setIssuedQty(qty);
      setInspectedQty(qty);
      setAcceptedQty(qty);
      setRejectedQty(0);
    }
  }, [jobCard, isOpen, jobCards]);

  if (!isOpen) return null;

  const handleSelectJobCard = (jcNo: string) => {
    setSelectedJobCardNo(jcNo);
    const found = jobCards.find(j => j.jobCardNo === jcNo);
    if (found) {
      setCustomer(found.customer || 'ROOP POLYMERS LTD');
      setWorkOrderNo(found.woNo || found.wNo || 'WO-1042');
      setPartCode(found.partCode || 'RP-8841');
      setPartDescription(found.partDescription || `${found.partCode} Component`);
      setFamily(found.family || `${found.partCode} Family`);
      setColor(found.color || 'Monza Red Gloss');
      const qty = found.targetQty || 250;
      setIssuedQty(qty);
      setInspectedQty(qty);
      setAcceptedQty(qty);
      setRejectedQty(0);
    }
  };

  const handleSetAllPass = () => {
    setPhysicalCondition('Pass');
    setBurrsFlashSinkMarks('Pass');
    setOilGreaseChemical('Pass');
    setCleaningIpaWiping('Pass');
    setStaticDedusting('Pass');
    setMaskingProtection('Pass');
    setJiggingOrientation('Pass');
    setQuantityVerification('Pass');
    setAcceptedQty(inspectedQty);
    setRejectedQty(0);
    setRemarks('100% Substrates cleaned with Isopropyl alcohol (IPA), static de-dusted. Zero flash, oil or burrs observed. Authorized for Gate 2 (FPA test spray).');
  };

  const handleQtyChange = (field: 'issued' | 'inspected' | 'accepted' | 'rejected', val: number) => {
    const num = Math.max(0, val || 0);
    if (field === 'issued') {
      setIssuedQty(num);
      setInspectedQty(num);
      setAcceptedQty(num - rejectedQty);
    } else if (field === 'inspected') {
      setInspectedQty(num);
      setAcceptedQty(Math.max(0, num - rejectedQty));
    } else if (field === 'rejected') {
      setRejectedQty(num);
      setAcceptedQty(Math.max(0, inspectedQty - num));
    } else if (field === 'accepted') {
      setAcceptedQty(num);
      setRejectedQty(Math.max(0, inspectedQty - num));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const hasCriticalFailure = [
      physicalCondition,
      burrsFlashSinkMarks,
      oilGreaseChemical,
      cleaningIpaWiping,
      staticDedusting,
      jiggingOrientation,
      quantityVerification
    ].some(v => v === 'Fail') || (maskingProtection === 'Fail');

    const overallResult: PreProductionInspectionRecord['overallResult'] = hasCriticalFailure ? 'Hold' : 'Passed';
    const currentYear = new Date().getFullYear();
    const reportNo = `PK-PIR-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRecord: PreProductionInspectionRecord = {
      docNo,
      issueDate: '01.01.2021',
      revNo,
      revDate,
      reportNo,
      date,
      plant: activePlant,
      customer,
      workOrderNo,
      jobCardNo: selectedJobCardNo,
      partCode,
      partDescription,
      substrateMaterial,
      family,
      color,
      issuedQty,
      inspectedQty,
      acceptedQty,
      rejectedQty,
      rejectionReason: rejectedQty > 0 ? rejectionReason : 'Nil',
      physicalCondition,
      burrsFlashSinkMarks,
      oilGreaseChemical,
      cleaningIpaWiping,
      staticDedusting,
      maskingProtection,
      jiggingOrientation,
      quantityVerification,
      overallResult,
      remarks,
      inspectedBy,
      productionSupervisor,
      qaEngineer,
      generatedAt: new Date().toISOString()
    };

    addPreProductionReport(newRecord);
    setCreatedRecord(newRecord);

    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-[24px] max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar">
        
        {/* MODAL HEADER */}
        <div className="flex justify-between items-start pb-3 border-b border-[#ececec]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-bold tracking-wider uppercase font-mono">
                Quality Gate 1 • Pre-Spray Substrate Release
              </span>
              <span className="text-[10px] text-[#777b86] font-mono">Doc: PK-QA-PIR-001</span>
            </div>
            <h2 className="text-base sm:text-xl font-serif text-[#17191c] font-normal">
              Pre-Production Substrate & Pre-Treatment Inspection Report
            </h2>
            <p className="text-xs text-[#777b86]">
              100% Substrate cleaning, flash/burrs removal, IPA degreasing & piece verification before FPA test spray.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#979799] hover:text-[#17191c] hover:bg-[#f2f2f3] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUCCESS NOTIFICATION & DOWNLOAD PDF BANNER */}
        {createdRecord && (
          <div className="p-4 rounded-[18px] bg-[#faf3e0] border border-[#f4e5be] flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <div className="text-xs sm:text-sm font-bold text-[#8a6521]">
                  Pre-Production Inspection Passed & Released ({createdRecord.reportNo})
                </div>
                <div className="text-[11px] text-[#777b86]">
                  Job Card <strong className="text-[#17191c]">{createdRecord.jobCardNo}</strong> is now authorized. Gate 2 (First Part Approval / FPA) is UNLOCKED!
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => downloadStandardPreProductionPdf(createdRecord)}
                className="px-4 py-2 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer w-full sm:w-auto"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PIR PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full bg-white hover:bg-[#f2f2f3] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-xs transition cursor-pointer w-full sm:w-auto"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* FORM CONTAINER */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* SECTION 1: JOB CARD & STORES DISPATCH AUTO-POPULATE */}
          <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#ececec]">
              <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-[#c09748]" />
                <span>1. Job Card & Stores Material Handshake</span>
              </span>
              <div className="text-[11px] text-[#777b86]">
                Plant: <strong className="text-[#17191c] font-medium">{activePlant}</strong>
              </div>
            </div>

            {/* Smart Job Card Dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-[10px] font-bold text-[#17191c] uppercase mb-1">
                  Select Active Job Card:
                </label>
                <select
                  value={selectedJobCardNo}
                  onChange={e => handleSelectJobCard(e.target.value)}
                  className="w-full p-2 rounded-[12px] bg-white border border-[#c09748] text-xs font-bold text-[#17191c] outline-none cursor-pointer"
                  required
                >
                  <option value="">-- Choose Job Card --</option>
                  {jobCards.map(jc => (
                    <option key={jc.jobCardNo} value={jc.jobCardNo}>
                      {jc.jobCardNo} • {jc.customer} ({jc.partCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#777b86] mb-1">Customer / Party Name</label>
                <input
                  type="text"
                  value={customer}
                  onChange={e => setCustomer(e.target.value)}
                  className="w-full p-2 rounded-[12px] bg-white border border-[#ececec] text-xs font-medium text-[#17191c] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#777b86] mb-1">Work Order No</label>
                <input
                  type="text"
                  value={workOrderNo}
                  onChange={e => setWorkOrderNo(e.target.value)}
                  className="w-full p-2 rounded-[12px] bg-white border border-[#ececec] text-xs font-mono font-medium text-[#17191c] outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-semibold text-[#777b86] mb-1">Part Code</label>
                <input
                  type="text"
                  value={partCode}
                  onChange={e => setPartCode(e.target.value)}
                  className="w-full p-2 rounded-[12px] bg-white border border-[#ececec] text-xs font-mono font-bold text-[#17191c] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#777b86] mb-1">Part Description</label>
                <input
                  type="text"
                  value={partDescription}
                  onChange={e => setPartDescription(e.target.value)}
                  className="w-full p-2 rounded-[12px] bg-white border border-[#ececec] text-xs font-medium text-[#17191c] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#777b86] mb-1">Substrate Material</label>
                <input
                  type="text"
                  value={substrateMaterial}
                  onChange={e => setSubstrateMaterial(e.target.value)}
                  className="w-full p-2 rounded-[12px] bg-white border border-[#ececec] text-xs font-medium text-[#17191c] outline-none"
                  placeholder="e.g. ABS HI-121, PC, Nylon"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#777b86] mb-1">Color / Finish</label>
                <input
                  type="text"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-full p-2 rounded-[12px] bg-white border border-[#ececec] text-xs font-medium text-[#17191c] outline-none"
                  required
                />
              </div>
            </div>

            {/* LIVE PIECE QUANTITY RECONCILIATION */}
            <div className="p-3 bg-white rounded-[14px] border border-[#ececec] space-y-2">
              <span className="text-[10px] font-bold text-[#17191c] uppercase flex items-center gap-1.5">
                <span>Substrate Piece Quantity Reconciliation (100% Count):</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] text-[#777b86]">Stores Issued Qty (Pcs)</label>
                  <input
                    type="number"
                    value={issuedQty}
                    onChange={e => handleQtyChange('issued', Number(e.target.value))}
                    className="w-full p-1.5 rounded-[8px] bg-[#fafafb] border border-[#ececec] font-mono font-bold text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#777b86]">100% Inspected Qty</label>
                  <input
                    type="number"
                    value={inspectedQty}
                    onChange={e => handleQtyChange('inspected', Number(e.target.value))}
                    className="w-full p-1.5 rounded-[8px] bg-white border border-[#ececec] font-mono font-bold text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-emerald-700 font-bold">✓ Clean Accepted Qty</label>
                  <input
                    type="number"
                    value={acceptedQty}
                    onChange={e => handleQtyChange('accepted', Number(e.target.value))}
                    className="w-full p-1.5 rounded-[8px] bg-emerald-50 border border-emerald-300 font-mono font-bold text-xs text-emerald-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-rose-700 font-bold">✗ Raw Rejected Qty</label>
                  <input
                    type="number"
                    value={rejectedQty}
                    onChange={e => handleQtyChange('rejected', Number(e.target.value))}
                    className="w-full p-1.5 rounded-[8px] bg-rose-50 border border-rose-300 font-mono font-bold text-xs text-rose-900"
                  />
                </div>
              </div>

              {rejectedQty > 0 && (
                <div className="pt-1.5">
                  <label className="block text-[10px] text-rose-800 font-semibold mb-0.5">
                    Reason for Raw Substrate Rejection / Segregation:
                  </label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="e.g. 2 pieces have deep scratch on front face; returned to store"
                    className="w-full p-2 rounded-[10px] bg-rose-50 border border-rose-200 text-xs text-rose-900 outline-none"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: 8 CRITICAL SUBSTRATE CHECKPOINTS */}
          <div className="p-4 rounded-[20px] bg-white border border-[#ececec] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#ececec]">
              <div>
                <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-[#c09748]" />
                  <span>2. 8 Critical Substrate & Pre-Treatment Checkpoints</span>
                </span>
                <div className="text-[10px] text-[#777b86]">
                  Strict pre-spray verification to guarantee coating adhesion and zero surface defects.
                </div>
              </div>
              <button
                type="button"
                onClick={handleSetAllPass}
                className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer self-start sm:self-auto"
              >
                <Check className="w-3.5 h-3.5" />
                <span>✓ Set All 8 Checkpoints Pass</span>
              </button>
            </div>

            {/* Checklist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Checkpoint 1 */}
              <div className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#17191c]">1. Physical Condition & Transit Scuffs</div>
                  <div className="text-[10px] text-[#777b86]">No cracks, dents, deep scratches or deformation</div>
                </div>
                <select
                  value={physicalCondition}
                  onChange={e => setPhysicalCondition(e.target.value as 'Pass' | 'Fail')}
                  className={`px-3 py-1 rounded-[8px] text-xs font-bold border cursor-pointer ${
                    physicalCondition === 'Pass' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
                  }`}
                >
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </div>

              {/* Checkpoint 2 */}
              <div className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#17191c]">2. Burrs, Flash & Sink Marks</div>
                  <div className="text-[10px] text-[#777b86]">Clean parting lines, smooth edges, no mold sink marks</div>
                </div>
                <select
                  value={burrsFlashSinkMarks}
                  onChange={e => setBurrsFlashSinkMarks(e.target.value as 'Pass' | 'Fail')}
                  className={`px-3 py-1 rounded-[8px] text-xs font-bold border cursor-pointer ${
                    burrsFlashSinkMarks === 'Pass' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
                  }`}
                >
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </div>

              {/* Checkpoint 3 */}
              <div className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#17191c]">3. Oil, Grease & Mold Release Agent</div>
                  <div className="text-[10px] text-[#777b86]">100% Free from silicone, grease or machine oils</div>
                </div>
                <select
                  value={oilGreaseChemical}
                  onChange={e => setOilGreaseChemical(e.target.value as 'Pass' | 'Fail')}
                  className={`px-3 py-1 rounded-[8px] text-xs font-bold border cursor-pointer ${
                    oilGreaseChemical === 'Pass' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
                  }`}
                >
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </div>

              {/* Checkpoint 4 */}
              <div className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#17191c]">4. Cleaning & Pre-Treatment (IPA Wiping)</div>
                  <div className="text-[10px] text-[#777b86]">Wiped with Isopropyl alcohol (IPA) to strip residue</div>
                </div>
                <select
                  value={cleaningIpaWiping}
                  onChange={e => setCleaningIpaWiping(e.target.value as 'Pass' | 'Fail')}
                  className={`px-3 py-1 rounded-[8px] text-xs font-bold border cursor-pointer ${
                    cleaningIpaWiping === 'Pass' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
                  }`}
                >
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </div>

              {/* Checkpoint 5 */}
              <div className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#17191c]">5. Static Charge De-Dusting</div>
                  <div className="text-[10px] text-[#777b86]">Ionized air blown to eliminate static charge & dust</div>
                </div>
                <select
                  value={staticDedusting}
                  onChange={e => setStaticDedusting(e.target.value as 'Pass' | 'Fail')}
                  className={`px-3 py-1 rounded-[8px] text-xs font-bold border cursor-pointer ${
                    staticDedusting === 'Pass' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
                  }`}
                >
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </div>

              {/* Checkpoint 6 */}
              <div className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#17191c]">6. Masking & Protection Accuracy</div>
                  <div className="text-[10px] text-[#777b86]">Masking tape aligned strictly per drawing boundary</div>
                </div>
                <select
                  value={maskingProtection}
                  onChange={e => setMaskingProtection(e.target.value as 'Pass' | 'Fail' | 'N/A')}
                  className={`px-3 py-1 rounded-[8px] text-xs font-bold border cursor-pointer ${
                    maskingProtection === 'Pass' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : maskingProtection === 'Fail' ? 'bg-red-50 text-red-800 border-red-300' : 'bg-gray-50 text-gray-700 border-gray-300'
                  }`}
                >
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                  <option value="N/A">N/A (No Masking)</option>
                </select>
              </div>

              {/* Checkpoint 7 */}
              <div className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#17191c]">7. Jigging & Hanging Orientation</div>
                  <div className="text-[10px] text-[#777b86]">Firm hook clamping, zero touch-points between parts</div>
                </div>
                <select
                  value={jiggingOrientation}
                  onChange={e => setJiggingOrientation(e.target.value as 'Pass' | 'Fail')}
                  className={`px-3 py-1 rounded-[8px] text-xs font-bold border cursor-pointer ${
                    jiggingOrientation === 'Pass' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
                  }`}
                >
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </div>

              {/* Checkpoint 8 */}
              <div className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#17191c]">8. Quantity Count Verification</div>
                  <div className="text-[10px] text-[#777b86]">Physical piece count matches issuance from Stores</div>
                </div>
                <select
                  value={quantityVerification}
                  onChange={e => setQuantityVerification(e.target.value as 'Pass' | 'Fail')}
                  className={`px-3 py-1 rounded-[8px] text-xs font-bold border cursor-pointer ${
                    quantityVerification === 'Pass' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
                  }`}
                >
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </div>

            </div>
          </div>

          {/* SECTION 3: DECISION & SIGNATURES */}
          <div className="p-4 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-[#17191c] uppercase mb-1">
                Quality Remarks & Gate 1 Authorization Decision:
              </label>
              <textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-[12px] bg-white border border-[#ececec] text-xs text-[#17191c] outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-[#ececec]">
              <div>
                <label className="block text-[10px] font-semibold text-[#777b86] mb-1">Substrate Inspector</label>
                <input
                  type="text"
                  value={inspectedBy}
                  onChange={e => setInspectedBy(e.target.value)}
                  className="w-full p-2 rounded-[10px] bg-white border border-[#ececec] text-xs text-[#17191c] outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#777b86] mb-1">Production Supervisor</label>
                <input
                  type="text"
                  value={productionSupervisor}
                  onChange={e => setProductionSupervisor(e.target.value)}
                  className="w-full p-2 rounded-[10px] bg-white border border-[#ececec] text-xs text-[#17191c] outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#777b86] mb-1">QA Release Engineer</label>
                <input
                  type="text"
                  value={qaEngineer}
                  onChange={e => setQaEngineer(e.target.value)}
                  className="w-full p-2 rounded-[10px] bg-white border border-[#ececec] text-xs text-[#17191c] outline-none font-medium"
                  required
                />
              </div>
            </div>
          </div>

          {/* MODAL ACTIONS */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-[#dcdfe4] bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Approve & Release Substrates (Unlock FPA)</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
