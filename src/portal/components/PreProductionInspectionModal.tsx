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
  Building2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  CheckSquare
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

  const [pirStep, setPirStep] = useState<1 | 2 | 3>(1);
  const [createdRecord, setCreatedRecord] = useState<PreProductionInspectionRecord | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPirStep(1);
    }
  }, [isOpen]);

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

  const handleQtyChange = (field: 'accepted', val: number) => {
    const num = Math.max(0, val || 0);
    // QC inspector sets Clean Accepted Qty, bounded by issuedQty
    const validAccepted = Math.min(issuedQty, num);
    setAcceptedQty(validAccepted);
    setRejectedQty(Math.max(0, issuedQty - validAccepted));
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
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white sm:rounded-[24px] max-w-4xl w-full h-full sm:h-auto p-4 sm:p-7 md:p-8 shadow-2xl border-0 sm:border border-[#e2e4e9] flex flex-col justify-between max-h-screen sm:max-h-[92vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-150 relative">
        
        {/* Top Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-[#fafafb] hover:bg-[#f2f2f3] text-[#777b86] hover:text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition z-10 active:scale-95 shadow-2xs"
          title="Close Form"
        >
          <X className="w-4 h-4" />
        </button>

        {/* MODAL HEADER */}
        <div className="text-center space-y-1.5 pb-3 sm:pb-4 pr-8 sm:pr-0 border-b border-[#f0f0f2]">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-xs font-mono font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#c09748]" />
            PK-QA-PIR-001 • QUALITY GATE 1 RELEASE
          </div>
          <h2 className="text-xl sm:text-2xl font-serif text-[#17191c] font-normal tracking-tight">
            Pre-Production Substrate & Pre-Treatment Inspection Report
          </h2>
          <p className="text-xs text-[#777b86] max-w-xl mx-auto">
            100% Substrate cleaning, flash/burrs removal, IPA degreasing & piece verification before FPA test spray.
          </p>
        </div>

        {/* 3-Part Responsive Stepper Header */}
        <div className="py-3 sm:py-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
            {/* Step 1 Tab Card */}
            <button
              type="button"
              onClick={() => setPirStep(1)}
              className={`p-2.5 sm:p-3 rounded-[14px] text-left transition cursor-pointer border flex flex-col justify-between ${
                pirStep === 1
                  ? 'bg-[#faf3e0]/60 border-[#c09748] shadow-2xs ring-1 ring-[#c09748]/30'
                  : 'bg-[#fafafb] border-[#e2e4e9] hover:border-[#cbd0d8]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                  pirStep === 1 ? 'bg-[#c09748] text-white shadow-2xs' : 'bg-gray-200 text-[#777b86]'
                }`}>
                  1
                </span>
                <span className="text-[11px] font-mono text-[#777b86]">Part 1</span>
              </div>
              <div>
                <div className="text-xs font-bold text-[#17191c] truncate">Job & Substrate</div>
                <div className="text-[11px] text-[#777b86] truncate">Identification & Handshake</div>
              </div>
            </button>

            {/* Step 2 Tab Card */}
            <button
              type="button"
              onClick={() => setPirStep(2)}
              className={`p-2.5 sm:p-3 rounded-[14px] text-left transition cursor-pointer border flex flex-col justify-between ${
                pirStep === 2
                  ? 'bg-[#faf3e0]/60 border-[#c09748] shadow-2xs ring-1 ring-[#c09748]/30'
                  : 'bg-[#fafafb] border-[#e2e4e9] hover:border-[#cbd0d8]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                  pirStep === 2 ? 'bg-[#c09748] text-white shadow-2xs' : 'bg-gray-200 text-[#777b86]'
                }`}>
                  2
                </span>
                <span className="text-[11px] font-mono text-[#777b86]">Part 2</span>
              </div>
              <div>
                <div className="text-xs font-bold text-[#17191c] truncate">8 Checkpoints</div>
                <div className="text-[11px] text-[#777b86] truncate">Pre-Treatment Audit</div>
              </div>
            </button>

            {/* Step 3 Tab Card */}
            <button
              type="button"
              onClick={() => setPirStep(3)}
              className={`p-2.5 sm:p-3 rounded-[14px] text-left transition cursor-pointer border flex flex-col justify-between ${
                pirStep === 3
                  ? 'bg-[#faf3e0]/60 border-[#c09748] shadow-2xs ring-1 ring-[#c09748]/30'
                  : 'bg-[#fafafb] border-[#e2e4e9] hover:border-[#cbd0d8]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                  pirStep === 3 ? 'bg-[#c09748] text-white shadow-2xs' : 'bg-gray-200 text-[#777b86]'
                }`}>
                  3
                </span>
                <span className="text-[11px] font-mono text-[#777b86]">Part 3</span>
              </div>
              <div>
                <div className="text-xs font-bold text-[#17191c] truncate">Quantities & Sign-Off</div>
                <div className="text-[11px] text-[#777b86] truncate">Reconciliation & Release</div>
              </div>
            </button>
          </div>
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

        {/* FORM CONTAINER - STEP BY STEP */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* STEP 1: JOB CARD & STORES DISPATCH AUTO-POPULATE */}
          {pirStep === 1 && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="p-4 sm:p-5 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#ececec]">
                  <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-[#c09748]" />
                    <span>Part 1: Job Card & Substrate Material Handshake</span>
                  </span>
                  <div className="text-[11px] text-[#777b86]">
                    Active Production Unit: <strong className="text-[#17191c] font-medium">{activePlant}</strong>
                  </div>
                </div>

                {/* Smart Job Card Identification (Locked to Job Card) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold text-[#17191c] uppercase mb-1">
                      Active Job Card (Locked):
                    </label>
                    <div className="w-full p-2.5 rounded-[12px] bg-[#fafafb] border border-[#c09748] text-xs font-bold text-[#17191c] flex items-center justify-between shadow-2xs">
                      <span className="truncate">{selectedJobCardNo || 'N/A'}</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] text-[10px] font-mono shrink-0">
                        Locked
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#777b86] mb-1">Customer / Party Name</label>
                    <input
                      type="text"
                      value={customer}
                      readOnly
                      className="w-full p-2.5 rounded-[12px] bg-[#fafafb] border border-[#ececec] text-xs font-medium text-[#17191c] outline-none cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#777b86] mb-1">Work Order No</label>
                    <input
                      type="text"
                      value={workOrderNo}
                      readOnly
                      className="w-full p-2.5 rounded-[12px] bg-[#fafafb] border border-[#ececec] text-xs font-mono font-medium text-[#17191c] outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#777b86] mb-1">Part Code</label>
                    <input
                      type="text"
                      value={partCode}
                      readOnly
                      className="w-full p-2.5 rounded-[12px] bg-[#fafafb] border border-[#ececec] text-xs font-mono font-bold text-[#17191c] outline-none cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#777b86] mb-1">Part Description</label>
                    <input
                      type="text"
                      value={partDescription}
                      readOnly
                      className="w-full p-2.5 rounded-[12px] bg-[#fafafb] border border-[#ececec] text-xs font-medium text-[#17191c] outline-none cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#777b86] mb-1">Substrate Material</label>
                    <input
                      type="text"
                      value={substrateMaterial}
                      readOnly
                      className="w-full p-2.5 rounded-[12px] bg-[#fafafb] border border-[#ececec] text-xs font-medium text-[#17191c] outline-none cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#777b86] mb-1">Color / Finish</label>
                    <input
                      type="text"
                      value={color}
                      readOnly
                      className="w-full p-2.5 rounded-[12px] bg-[#fafafb] border border-[#ececec] text-xs font-medium text-[#17191c] outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Substrate summary preview card */}
                <div className="p-3 bg-white rounded-[14px] border border-[#ececec] flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#c09748]"></span>
                    <span className="text-[#777b86]">Inspection Stage:</span>
                    <strong className="text-[#17191c] font-semibold">100% Pre-Production Substrate & Surface Cleanliness</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#777b86]">Standard Batch Release Qty:</span>
                    <strong className="text-[#17191c] font-mono font-bold">{issuedQty} Pcs</strong>
                  </div>
                </div>
              </div>

              {/* Step 1 Footer Navigation */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full border border-[#dcdfe4] bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] text-xs font-semibold shadow-2xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setPirStep(2)}
                  className="px-6 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <span>Continue to 8 Checkpoints (Step 2)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: 8 CRITICAL SUBSTRATE CHECKPOINTS */}
          {pirStep === 2 && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#ececec] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#ececec]">
                  <div>
                    <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-[#c09748]" />
                      <span>Part 2: 8 Critical Substrate & Pre-Treatment Checkpoints</span>
                    </span>
                    <div className="text-[10px] text-[#777b86]">
                      Strict pre-spray verification to guarantee coating adhesion and zero surface defects.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSetAllPass}
                    className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer self-start sm:self-auto"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>✓ Set All 8 Checkpoints Pass</span>
                  </button>
                </div>

                {/* Checklist Grid - 1 Column Stacked */}
                <div className="grid grid-cols-1 gap-2.5">
                  {/* Checkpoint 1 */}
                  <div className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#17191c]">1. Physical Condition & Transit Scuffs</div>
                      <div className="text-[10px] text-[#777b86]">No cracks, dents, deep scratches or deformation</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPhysicalCondition('Pass')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                          physicalCondition === 'Pass'
                            ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] shadow-2xs'
                            : 'bg-white text-[#777b86] hover:bg-[#f2f2f3] hover:text-[#17191c] border border-[#dcdfe4]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Pass</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhysicalCondition('Fail')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                          physicalCondition === 'Fail'
                            ? 'bg-rose-50 text-rose-800 border border-rose-300 ring-1 ring-rose-200 shadow-2xs'
                            : 'bg-white text-[#777b86] hover:bg-[#f2f2f3] hover:text-rose-700 border border-[#dcdfe4]'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Fail</span>
                      </button>
                    </div>
                  </div>

                  {/* Checkpoint 2 */}
                  <div className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#17191c]">2. Burrs, Flash & Sink Marks</div>
                      <div className="text-[10px] text-[#777b86]">Clean parting lines, smooth edges, no mold sink marks</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setBurrsFlashSinkMarks('Pass')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                          burrsFlashSinkMarks === 'Pass'
                            ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] shadow-2xs'
                            : 'bg-white text-[#777b86] hover:bg-[#f2f2f3] hover:text-[#17191c] border border-[#dcdfe4]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Pass</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBurrsFlashSinkMarks('Fail')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                          burrsFlashSinkMarks === 'Fail'
                            ? 'bg-rose-50 text-rose-800 border border-rose-300 ring-1 ring-rose-200 shadow-2xs'
                            : 'bg-white text-[#777b86] hover:bg-[#f2f2f3] hover:text-rose-700 border border-[#dcdfe4]'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Fail</span>
                      </button>
                    </div>
                  </div>

                  {/* Checkpoint 3 */}
                  <div className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#17191c]">3. Oil, Grease & Mold Release Agent</div>
                      <div className="text-[10px] text-[#777b86]">100% Free from silicone, grease or machine oils</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setOilGreaseChemical('Pass')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                          oilGreaseChemical === 'Pass'
                            ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] shadow-2xs'
                            : 'bg-white text-[#777b86] hover:bg-[#f2f2f3] hover:text-[#17191c] border border-[#dcdfe4]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Pass</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOilGreaseChemical('Fail')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                          oilGreaseChemical === 'Fail'
                            ? 'bg-rose-50 text-rose-800 border border-rose-300 ring-1 ring-rose-200 shadow-2xs'
                            : 'bg-white text-[#777b86] hover:bg-[#f2f2f3] hover:text-rose-700 border border-[#dcdfe4]'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Fail</span>
                      </button>
                    </div>
                  </div>

                  {/* Checkpoint 4 */}
                  <div className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#17191c]">4. Cleaning & Pre-Treatment (IPA Wiping)</div>
                      <div className="text-[10px] text-[#777b86]">Wiped with Isopropyl alcohol (IPA) to strip residue</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setCleaningIpaWiping('Pass')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                          cleaningIpaWiping === 'Pass'
                            ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] shadow-2xs'
                            : 'bg-white text-[#777b86] hover:bg-[#f2f2f3] hover:text-[#17191c] border border-[#dcdfe4]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Pass</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCleaningIpaWiping('Fail')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                          cleaningIpaWiping === 'Fail'
                            ? 'bg-rose-50 text-rose-800 border border-rose-300 ring-1 ring-rose-200 shadow-2xs'
                            : 'bg-white text-[#777b86] hover:bg-[#f2f2f3] hover:text-rose-700 border border-[#dcdfe4]'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Fail</span>
                      </button>
                    </div>
                  </div>

                  {/* Checkpoint 5 */}
                  <div className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#17191c]">5. Static Charge De-Dusting</div>
                      <div className="text-[10px] text-[#777b86]">Ionized air blown to eliminate static charge & dust</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setStaticDedusting('Pass')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                          staticDedusting === 'Pass'
                            ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] shadow-2xs'
                            : 'bg-white text-[#777b86] hover:bg-[#f2f2f3] hover:text-[#17191c] border border-[#dcdfe4]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Pass</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStaticDedusting('Fail')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                          staticDedusting === 'Fail'
                            ? 'bg-rose-50 text-rose-800 border border-rose-300 ring-1 ring-rose-200 shadow-2xs'
                            : 'bg-white text-[#777b86] hover:bg-[#f2f2f3] hover:text-rose-700 border border-[#dcdfe4]'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Fail</span>
                      </button>
                    </div>
                  </div>

                  {/* Checkpoint 6 */}
                  <div className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#17191c]">6. Masking & Protection Accuracy</div>
                      <div className="text-[10px] text-[#777b86]">Masking tape aligned strictly per drawing boundary</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setMaskingProtection('Pass')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                          maskingProtection === 'Pass'
                            ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] shadow-2xs'
                            : 'bg-white text-[#777b86] hover:bg-[#f2f2f3] hover:text-[#17191c] border border-[#dcdfe4]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Pass</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMaskingProtection('Fail')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                          maskingProtection === 'Fail'
                            ? 'bg-rose-50 text-rose-800 border border-rose-300 ring-1 ring-rose-200 shadow-2xs'
                            : 'bg-white text-[#777b86] hover:bg-[#f2f2f3] hover:text-rose-700 border border-[#dcdfe4]'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Fail</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMaskingProtection('N/A')}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer active:scale-95 ${
                          maskingProtection === 'N/A'
                            ? 'bg-[#17191c] text-white border border-[#17191c] shadow-2xs'
                            : 'bg-white text-[#777b86] hover:bg-[#f2f2f3] border border-[#dcdfe4]'
                        }`}
                      >
                        N/A
                      </button>
                    </div>
                  </div>

                  {/* Checkpoint 7 */}
                  <div className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#17191c]">7. Jigging & Hanging Orientation</div>
                      <div className="text-[10px] text-[#777b86]">Firm hook clamping, zero touch-points between parts</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setJiggingOrientation('Pass')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                          jiggingOrientation === 'Pass'
                            ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] shadow-2xs'
                            : 'bg-white text-[#777b86] hover:bg-[#f2f2f3] hover:text-[#17191c] border border-[#dcdfe4]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Pass</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setJiggingOrientation('Fail')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                          jiggingOrientation === 'Fail'
                            ? 'bg-rose-50 text-rose-800 border border-rose-300 ring-1 ring-rose-200 shadow-2xs'
                            : 'bg-white text-[#777b86] hover:bg-[#f2f2f3] hover:text-rose-700 border border-[#dcdfe4]'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Fail</span>
                      </button>
                    </div>
                  </div>

                  {/* Checkpoint 8 */}
                  <div className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#17191c]">8. Quantity Count Verification</div>
                      <div className="text-[10px] text-[#777b86]">Physical piece count matches issuance from Stores</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setQuantityVerification('Pass')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                          quantityVerification === 'Pass'
                            ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] shadow-2xs'
                            : 'bg-white text-[#777b86] hover:bg-[#f2f2f3] hover:text-[#17191c] border border-[#dcdfe4]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Pass</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuantityVerification('Fail')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                          quantityVerification === 'Fail'
                            ? 'bg-rose-50 text-rose-800 border border-rose-300 ring-1 ring-rose-200 shadow-2xs'
                            : 'bg-white text-[#777b86] hover:bg-[#f2f2f3] hover:text-rose-700 border border-[#dcdfe4]'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Fail</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 Footer Navigation */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPirStep(1)}
                  className="px-5 py-2.5 rounded-full border border-[#dcdfe4] bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Step 1</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPirStep(3)}
                  className="px-6 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <span>Continue to Quantities & Sign-Off (Step 3)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: QUANTITY RECONCILIATION, DECISION & 3-TIER SIGN-OFF */}
          {pirStep === 3 && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              {/* LIVE PIECE QUANTITY RECONCILIATION */}
              <div className="p-4 sm:p-5 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#ececec]">
                  <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-[#c09748]" />
                    <span>Part 3: Substrate Piece Quantity Reconciliation & Sign-Off</span>
                  </span>
                  <div className="text-[11px] text-[#777b86]">
                    Reconciliation: <strong className="text-emerald-700 font-bold">{acceptedQty} Accepted</strong> / {rejectedQty} Rejected
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#777b86] font-semibold mb-1">
                      Stores Issued Qty (Locked)
                    </label>
                    <div className="w-full p-2.5 rounded-[12px] bg-[#fafafb] border border-[#dcdfe4] font-mono font-bold text-xs text-[#17191c] flex items-center justify-between">
                      <span>{issuedQty}</span>
                      <span className="text-[10px] text-[#777b86] font-sans font-normal">Pcs (Store)</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#777b86] font-semibold mb-1">
                      100% Inspected Qty
                    </label>
                    <div className="w-full p-2.5 rounded-[12px] bg-[#fafafb] border border-[#dcdfe4] font-mono font-bold text-xs text-[#17191c] flex items-center justify-between">
                      <span>{issuedQty}</span>
                      <span className="text-[10px] text-[#777b86] font-sans font-normal">Pcs (100%)</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-emerald-700 font-bold mb-1">
                      ✓ Clean Accepted Qty (QC Entry) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={issuedQty}
                      value={acceptedQty}
                      onChange={e => handleQtyChange('accepted', Number(e.target.value))}
                      className="w-full p-2.5 rounded-[12px] bg-emerald-50 border border-emerald-300 font-mono font-bold text-xs text-emerald-900 outline-none focus:ring-1 focus:ring-emerald-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-rose-700 font-bold mb-1">
                      ✗ Raw Rejected Qty (Auto Calc)
                    </label>
                    <div className="w-full p-2.5 rounded-[12px] bg-rose-50 border border-rose-300 font-mono font-bold text-xs text-rose-900 flex items-center justify-between">
                      <span>{rejectedQty}</span>
                      <span className="text-[10px] text-rose-700 font-sans font-normal">
                        {rejectedQty > 0 ? 'Scrap / Hold' : 'Nil'}
                      </span>
                    </div>
                  </div>
                </div>

                {rejectedQty > 0 && (
                  <div className="pt-2">
                    <label className="block text-[10px] text-rose-800 font-semibold mb-1">
                      Reason for Raw Substrate Rejection / Segregation:
                    </label>
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      placeholder="e.g. 2 pieces have deep scratch on front face; returned to store"
                      className="w-full p-2.5 rounded-[12px] bg-rose-50 border border-rose-200 text-xs text-rose-900 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* REMARKS & 3-TIER SIGN-OFF */}
              <div className="p-4 sm:p-5 rounded-[20px] bg-[#fafafb] border border-[#ececec] space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#17191c] uppercase mb-1">
                    Quality Remarks & Gate 1 Authorization Decision:
                  </label>
                  <textarea
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 rounded-[12px] bg-white border border-[#ececec] text-xs text-[#17191c] outline-none focus:border-[#c09748]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#ececec]">
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

              {/* Step 3 Footer Navigation & Submit */}
              <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setPirStep(2)}
                  className="px-5 py-2.5 rounded-full border border-[#dcdfe4] bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] text-xs font-semibold shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Step 2</span>
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Approve & Release Substrates (Unlock FPA)</span>
                </button>
              </div>
            </div>
          )}

        </form>

      </div>
    </div>
  );
};
