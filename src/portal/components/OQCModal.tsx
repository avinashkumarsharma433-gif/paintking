import React, { useState, useEffect } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { JobCard, FinalQualityRelease } from '../types/portalTypes';
import { 
  CheckCircle2, 
  X, 
  Download, 
  FileCheck, 
  ShieldCheck, 
  Check, 
  Sliders,
  Sparkles,
  Printer,
  FileText
} from 'lucide-react';
import { downloadStandardOqcPdf, downloadStandardProductionOfferingPdf, formatDateDDMMYYYY } from '../utils/pdfStandardHeader';

interface OQCModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobCard?: JobCard | null;
  onSuccess?: () => void;
}

export interface OQCVisualItem {
  id: string;
  name: string;
  spec: string;
  tech: string;
  s1: 'Pass' | 'Fail';
  s2: 'Pass' | 'Fail';
  s3: 'Pass' | 'Fail';
  s4: 'Pass' | 'Fail';
  s5: 'Pass' | 'Fail';
}

const DEFAULT_OQC_VISUAL_PARAMS: { id: string; name: string; spec: string; tech: string }[] = [
  { id: 'A', name: 'Damage', spec: 'Not Allowed', tech: 'Visual' },
  { id: 'B', name: 'Scratch', spec: 'Not Allowed', tech: 'Visual' },
  { id: 'C', name: 'Sink Mark', spec: 'Not Allowed', tech: 'Visual' },
  { id: 'D', name: 'Short fill', spec: 'Not Allowed', tech: 'Visual' },
  { id: 'E', name: 'Bubble', spec: 'Not Allowed', tech: 'Visual' },
  { id: 'F', name: 'Pin Mark', spec: 'Not Allowed', tech: 'Visual' },
  { id: 'G', name: 'Dust Spot', spec: 'Not Allowed', tech: 'Visual' },
  { id: 'H', name: 'Over Paint', spec: 'Not Allowed', tech: 'Visual' },
  { id: 'I', name: 'Paint Missing', spec: 'Not Allowed', tech: 'Visual' },
  { id: 'J', name: 'Colour', spec: 'As per Approved Sample', tech: 'Visual' },
  { id: 'K', name: 'Overall Finishing', spec: 'Perfect', tech: 'Visual' }
];

export const OQCModal: React.FC<OQCModalProps> = ({
  isOpen,
  onClose,
  jobCard,
  onSuccess
}) => {
  const { addOQCRelease, activePlant, currentUser, fpaRecords } = usePortalStore();

  // Multi-step: Step 1 (Visual Checks & Delta-E) | Step 2 (Sampling Counts & Dual Sign-off)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Header & Job Meta
  const [reportNo, setReportNo] = useState<string>(() => `PK-OQC-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customer, setCustomer] = useState<string>('');
  const [woNo, setWoNo] = useState<string>('');
  const [partCode, setPartCode] = useState<string>('');
  const [partDescription, setPartDescription] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [offeredQty, setOfferedQty] = useState<number>(0);
  const [sampledQty, setSampledQty] = useState<number>(0);
  const [rejectedQty, setRejectedQty] = useState<number>(0);
  const [lotAcceptance, setLotAcceptance] = useState<'Accepted' | 'Rejected' | 'Hold'>('Accepted');

  // Spectrometer Values (Master benchmarks + 5 Samples S1 to S5)
  const [masterL, setMasterL] = useState<number | string>(42.00);
  const [masterA, setMasterA] = useState<number | string>(54.00);
  const [masterB, setMasterB] = useState<number | string>(28.00);

  // 5 Samples for Delta Value Test
  const [sampleSpectro, setSampleSpectro] = useState<{
    s1: { L: number | string; a: number | string; b: number | string; deltaE: number | string };
    s2: { L: number | string; a: number | string; b: number | string; deltaE: number | string };
    s3: { L: number | string; a: number | string; b: number | string; deltaE: number | string };
    s4: { L: number | string; a: number | string; b: number | string; deltaE: number | string };
    s5: { L: number | string; a: number | string; b: number | string; deltaE: number | string };
  }>({
    s1: { L: 42.15, a: 54.28, b: 28.12, deltaE: 0.38 },
    s2: { L: 42.18, a: 54.30, b: 28.14, deltaE: 0.40 },
    s3: { L: 42.12, a: 54.25, b: 28.10, deltaE: 0.35 },
    s4: { L: 42.16, a: 54.29, b: 28.15, deltaE: 0.39 },
    s5: { L: 42.14, a: 54.27, b: 28.11, deltaE: 0.36 }
  });

  // Sign-off
  const [preparedBy, setPreparedBy] = useState<string>(currentUser?.name || 'Manoj Tiwari (Quality Engineer)');
  const [approvedBy, setApprovedBy] = useState<string>('Rajesh Nair (Head QA & Compliance)');
  const [acceptanceProductionIncharge, setAcceptanceProductionIncharge] = useState<string>('Vikram Patel (Production Incharge)');

  // 11 Visual Parameters (S1 to S5)
  const [visualItems, setVisualItems] = useState<OQCVisualItem[]>(() =>
    DEFAULT_OQC_VISUAL_PARAMS.map(p => ({
      ...p,
      s1: 'Pass',
      s2: 'Pass',
      s3: 'Pass',
      s4: 'Pass',
      s5: 'Pass'
    }))
  );

  const [createdRelease, setCreatedRelease] = useState<FinalQualityRelease | null>(null);

  // Populate from active jobCard & FPA on open
  useEffect(() => {
    if (jobCard) {
      if (jobCard.customer) setCustomer(jobCard.customer);
      if (jobCard.woNo) setWoNo(jobCard.woNo);
      if (jobCard.partCode) setPartCode(jobCard.partCode);
      if (jobCard.partDescription) setPartDescription(jobCard.partDescription);
      if (jobCard.model) setModel(jobCard.model);
      if (jobCard.color) setColor(jobCard.color);
      const offer = jobCard.goodQty || jobCard.sprayedQty || jobCard.targetQty || 1000;
      setOfferedQty(offer);
      setSampledQty(Math.max(5, Math.ceil(offer * 0.1))); // 10% sampling rule or min 5
    }

    // Lookup matching FPA record for Master LAB benchmark
    const jcNo = jobCard?.jobCardNo;
    const matchFpa = fpaRecords.find(f => (jcNo && f.jobCardNo === jcNo) || (jobCard?.woNo && f.woNo === jobCard.woNo));
    if (matchFpa) {
      const mL = matchFpa.masterLab?.masterL || matchFpa.masterL || 42.00;
      const mA = matchFpa.masterLab?.masterA || matchFpa.masterA || 54.00;
      const mB = matchFpa.masterLab?.masterB || matchFpa.masterB || 28.00;
      setMasterL(mL);
      setMasterA(mA);
      setMasterB(mB);

      const fpaDelta = Number(matchFpa.deltaE || 0.38);
      const baseL = Number(matchFpa.L || mL);
      const baseA = Number(matchFpa.a || mA);
      const baseB = Number(matchFpa.b || mB);

      setSampleSpectro({
        s1: { L: baseL, a: baseA, b: baseB, deltaE: fpaDelta },
        s2: { L: Number((baseL + 0.03).toFixed(2)), a: Number((baseA + 0.02).toFixed(2)), b: Number((baseB + 0.02).toFixed(2)), deltaE: Number((fpaDelta + 0.02).toFixed(2)) },
        s3: { L: Number((baseL - 0.03).toFixed(2)), a: Number((baseA - 0.03).toFixed(2)), b: Number((baseB - 0.02).toFixed(2)), deltaE: Number(Math.max(0.1, fpaDelta - 0.03).toFixed(2)) },
        s4: { L: Number((baseL + 0.01).toFixed(2)), a: Number((baseA + 0.01).toFixed(2)), b: Number((baseB + 0.03).toFixed(2)), deltaE: Number((fpaDelta + 0.01).toFixed(2)) },
        s5: { L: Number((baseL - 0.01).toFixed(2)), a: Number((baseA - 0.01).toFixed(2)), b: Number((baseB - 0.01).toFixed(2)), deltaE: Number(fpaDelta.toFixed(2)) }
      });
    }
  }, [jobCard, fpaRecords]);

  if (!isOpen) return null;

  // Toggle single sample OK / NOT OK
  const toggleSampleStatus = (id: string, sampleKey: 's1' | 's2' | 's3' | 's4' | 's5') => {
    setVisualItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          [sampleKey]: item[sampleKey] === 'Pass' ? 'Fail' : 'Pass'
        };
      }
      return item;
    }));
  };

  // Quick mark all samples as OK
  const markAllVisualOk = () => {
    setVisualItems(prev => prev.map(item => ({
      ...item,
      s1: 'Pass',
      s2: 'Pass',
      s3: 'Pass',
      s4: 'Pass',
      s5: 'Pass'
    })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const exactAuditTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    const generatedTimestamp = `${formatDateDDMMYYYY(date)}, ${exactAuditTime}`;

    const passed = Math.max(0, offeredQty - rejectedQty);

    // Calculate average or sample1 deltaE
    const avgDelta = Number(sampleSpectro.s1.deltaE || 0.38);

    const newRelease: FinalQualityRelease = {
      releaseId: reportNo,
      reportNo,
      date,
      plant: activePlant,
      woNo,
      customer,
      partCode,
      partDescription,
      model,
      color,
      offeredQty,
      sampledQty,
      passedQty: passed,
      rejectedQty,
      lotAcceptance,
      oqcStatus: lotAcceptance,
      // Visual Checklist
      sample1: visualItems.every(i => i.s1 === 'Pass') ? 'Pass' : 'Fail',
      sample2: visualItems.every(i => i.s2 === 'Pass') ? 'Pass' : 'Fail',
      sample3: visualItems.every(i => i.s3 === 'Pass') ? 'Pass' : 'Fail',
      sample4: visualItems.every(i => i.s4 === 'Pass') ? 'Pass' : 'Fail',
      sample5: visualItems.every(i => i.s5 === 'Pass') ? 'Pass' : 'Fail',
      // Delta-E / Spectrometer 5 Samples
      masterL,
      masterA,
      masterB,
      L: Number(sampleSpectro.s1.L),
      a: Number(sampleSpectro.s1.a),
      b: Number(sampleSpectro.s1.b),
      deltaE: avgDelta,
      sampleSpectro,
      // Signatures
      productionInchargeSign: acceptanceProductionIncharge,
      qualityEngineerSign: preparedBy,
      managerQASign: approvedBy,
      inspector: preparedBy,
      plantHeadSign: approvedBy,
      generatedTimestamp,
      createdAt: now.toISOString(),
      // Legacy compatibility
      physicalInspection: visualItems.every(i => i.s1 === 'Pass' && i.s2 === 'Pass') ? 'Pass' : 'Fail',
      conductivity: 'N/A',
      adhesion: 'Pass',
      packingBoxCondition: 'Pass',
      traceabilityBatchNo: 'Pass',
      quantityMatch: 'Pass',
      pdiStatus: 'Awaiting PDI'
    };

    addOQCRelease(newRelease);
    setCreatedRelease(newRelease);

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
          className="w-8 h-8 rounded-full bg-[#fafafb] hover:bg-gray-100 text-[#777b86] hover:text-[#17191c] border border-[#ececec] flex items-center justify-center cursor-pointer transition absolute top-4 right-4 z-10 active:scale-95"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* VIEW 1: SUCCESS CONFIRMATION & PDF READY */}
        {createdRelease ? (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-5 rounded-[22px] bg-[#faf7ed] border border-[#f4e5be] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#c09748] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] font-mono bg-emerald-100 text-emerald-900">
                      ✓ OQC REPORT GENERATED
                    </span>
                    <span className="font-mono text-xs text-[#8a6521] font-bold">
                      {createdRelease.releaseId}
                    </span>
                  </div>
                  <h3 className="font-serif font-normal text-lg text-[#17191c] mt-0.5">
                    Outgoing Quality Certificate Ready!
                  </h3>
                  <p className="text-xs text-[#777b86]">
                    Customer: <strong>{createdRelease.customer}</strong> • Part: <strong>{createdRelease.partCode}</strong> • Offer Qty: <strong>{createdRelease.offeredQty} Pcs</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => downloadStandardProductionOfferingPdf(createdRelease)}
                  className="px-4 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  title="Download Official Production Offering Slip (Doc: PK-PRD-OFF-01)"
                >
                  <FileText className="w-3.5 h-3.5 text-[#777b86]" />
                  <span>Download Offering Slip (PK-PRD-OFF-01)</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadStandardOqcPdf(createdRelease)}
                  className="px-4 py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-[#8a6521]" />
                  <span>Download OQC Official PDF</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#ececec]">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] font-semibold text-xs transition cursor-pointer shadow-xs active:scale-95"
              >
                Return to Quality View
              </button>
            </div>
          </div>
        ) : (
          /* VIEW 2: FORM */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#ececec]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#faf3e0] border border-[#f4e5be] flex items-center justify-center shrink-0 shadow-2xs">
                  <ShieldCheck className="w-5 h-5 text-[#c09748]" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono font-bold uppercase tracking-wider mb-0.5">
                    DOC: PK-QA-OQC-001 • QUALITY GATE 4
                  </div>
                  <h2 className="text-xl font-serif text-[#17191c] font-normal tracking-tight">
                    Outgoing Quality Control (OQC) Report
                  </h2>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 pr-10">
                <div className="px-3 py-1.5 rounded-full bg-[#fafafb] border border-[#dcdfe4] text-[11px] font-mono text-[#17191c] flex items-center gap-2 shadow-2xs">
                  <span className="text-[#777b86]">WO:</span>
                  <span className="font-bold text-[#c09748]">{woNo}</span>
                  <span className="w-1 h-1 rounded-full bg-[#cbd0d8]"></span>
                  <span className="text-[#777b86]">Part:</span>
                  <span className="font-bold">{partCode}</span>
                </div>
              </div>
            </div>

            {/* Stepper Tabs */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {[
                { num: 1, title: 'Visual & Spectrometer Checks', sub: '11 Defect Parameters & Delta-E Readings' },
                { num: 2, title: 'Lot Quantity & Signatures', sub: 'Sample Size, Rejections & Dual Sign-off' }
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
                        <div className="text-[10px] font-mono text-[#777b86] uppercase font-bold">STEP {s.num}</div>
                        <div className="text-xs font-bold text-[#17191c]">{s.title}</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#777b86] hidden sm:inline text-right">{s.sub}</span>
                  </button>
                );
              })}
            </div>

            {/* STEP 1: VISUAL INSPECTION CHECKPOINTS & SPECTROMETER */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Job Identification Banner (Auto-populated from Job Card & System) */}
                <div className="p-3.5 rounded-[18px] bg-[#fafafb] border border-[#ececec] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#777b86] block">Customer</span>
                    <div className="mt-1 font-semibold text-xs text-[#17191c] truncate">{customer}</div>
                    <div className="text-[10px] text-[#777b86] font-mono mt-0.5">Report: <strong className="text-[#c09748]">{reportNo}</strong></div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#777b86] block">Work Order Number</span>
                    <div className="mt-1 font-mono font-bold text-xs text-[#17191c]">{woNo}</div>
                    <div className="text-[10px] text-[#777b86] mt-0.5">Job Card: <strong className="text-[#17191c] font-mono">{jobCard?.jobCardNo || 'PK-JC-ACTIVE'}</strong></div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#777b86] block">Part Code & Model</span>
                    <div className="mt-1 font-semibold text-xs text-[#17191c]">{partCode}</div>
                    <div className="text-[10px] text-[#777b86] mt-0.5 truncate">{model || 'OEM Spec'}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#777b86] block">Part Description & Colour</span>
                    <div className="mt-1 font-medium text-xs text-[#17191c] truncate">{partDescription}</div>
                    <div className="text-[10px] font-semibold text-[#c09748] mt-0.5">{color}</div>
                  </div>
                </div>

                {/* 11 Visual Parameters Table (A to K) */}
                <div className="p-4 rounded-[20px] bg-white border border-[#ececec] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#f2f2f3]">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#c09748]" />
                      <span className="font-bold text-xs text-[#17191c] uppercase tracking-wider">
                        1. Visual Test Checklist (5 Samples: S1 - S5)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={markAllVisualOk}
                      className="px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold shadow-2xs transition cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <Check className="w-3 h-3 text-emerald-700" />
                      <span>✓ Quick Mark: All 5 Samples OK</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#ececec] text-[#777b86] bg-[#fafafb]">
                          <th className="py-2 px-2.5 font-bold text-[10px] uppercase tracking-wider w-8 text-center">Sr.</th>
                          <th className="py-2 px-3 font-bold text-[10px] uppercase tracking-wider min-w-[140px]">Parameters</th>
                          <th className="py-2 px-3 font-bold text-[10px] uppercase tracking-wider text-center w-28">Specification</th>
                          <th className="py-2 px-3 font-bold text-[10px] uppercase tracking-wider text-center w-24">Tech</th>
                          <th className="py-2 px-2 font-bold text-[10px] uppercase tracking-wider text-center w-14">S1</th>
                          <th className="py-2 px-2 font-bold text-[10px] uppercase tracking-wider text-center w-14">S2</th>
                          <th className="py-2 px-2 font-bold text-[10px] uppercase tracking-wider text-center w-14">S3</th>
                          <th className="py-2 px-2 font-bold text-[10px] uppercase tracking-wider text-center w-14">S4</th>
                          <th className="py-2 px-2 font-bold text-[10px] uppercase tracking-wider text-center w-14">S5</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ececec]">
                        {visualItems.map((param, idx) => (
                          <tr key={param.id} className="hover:bg-[#fafafb] transition">
                            <td className="py-2 px-2.5 text-center font-mono font-bold text-[#c09748] text-xs">{param.id}</td>
                            <td className="py-2 px-3 font-medium text-[#17191c] text-xs">{param.name}</td>
                            <td className="py-2 px-3 text-center text-[11px] text-[#777b86] font-mono">{param.spec}</td>
                            <td className="py-2 px-3 text-center text-[11px] text-[#777b86]">{param.tech}</td>
                            {(['s1', 's2', 's3', 's4', 's5'] as const).map(sKey => {
                              const isOk = param[sKey] === 'Pass';
                              return (
                                <td key={sKey} className="py-1.5 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => toggleSampleStatus(param.id, sKey)}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer border shadow-2xs active:scale-95 ${
                                      isOk
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                        : 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100'
                                    }`}
                                  >
                                    {isOk ? 'OK' : 'NOT OK'}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Delta Value Test (Spectrophotometer Readings for 5 Samples S1 - S5) */}
                <div className="p-4 rounded-[20px] bg-white border border-[#ececec] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#f2f2f3]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#17191c] uppercase tracking-wider">
                        2. Delta Value Test (Spectrophotometer CIELAB Readings • 5 Samples)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#8a6521] bg-[#faf3e0] px-2.5 py-0.5 rounded-full border border-[#f4e5be] font-bold">
                        Target &Delta;E &le; 0.70
                      </span>
                    </div>
                  </div>

                  {/* Spectrometer 5-Sample Table matching Excel layout */}
                  <div className="overflow-x-auto rounded-[14px] border border-[#ececec]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#fafafb] border-b border-[#ececec] text-[#777b86]">
                          <th className="py-2 px-2.5 font-bold text-[10px] uppercase tracking-wider text-center w-10">Sr.</th>
                          <th className="py-2 px-3 font-bold text-[10px] uppercase tracking-wider">Parameters</th>
                          <th className="py-2 px-3 font-bold text-[10px] uppercase tracking-wider text-center">Master Specification</th>
                          <th className="py-2 px-3 font-bold text-[10px] uppercase tracking-wider text-center">Measurement Tech</th>
                          <th className="py-2 px-2 font-bold text-[10px] uppercase tracking-wider text-center w-20">S1</th>
                          <th className="py-2 px-2 font-bold text-[10px] uppercase tracking-wider text-center w-20">S2</th>
                          <th className="py-2 px-2 font-bold text-[10px] uppercase tracking-wider text-center w-20">S3</th>
                          <th className="py-2 px-2 font-bold text-[10px] uppercase tracking-wider text-center w-20">S4</th>
                          <th className="py-2 px-2 font-bold text-[10px] uppercase tracking-wider text-center w-20">S5</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ececec]">
                        {/* Row A: L */}
                        <tr className="hover:bg-[#fafafb] transition">
                          <td className="py-2 px-2.5 text-center font-mono font-bold text-[#c09748] text-xs">A</td>
                          <td className="py-2 px-3 font-medium text-[#17191c] text-xs">L</td>
                          <td className="py-2 px-3 text-center text-[11px] font-mono font-bold text-[#c09748]">
                            Master: {masterL}
                          </td>
                          <td className="py-2 px-3 text-center text-[11px] text-[#777b86]">Spectrometer</td>
                          {(['s1', 's2', 's3', 's4', 's5'] as const).map(sKey => (
                            <td key={sKey} className="py-1 px-1.5 text-center">
                              <input
                                type="number"
                                step="0.01"
                                value={sampleSpectro[sKey].L}
                                onChange={e => {
                                  const val = e.target.value;
                                  setSampleSpectro(prev => ({
                                    ...prev,
                                    [sKey]: { ...prev[sKey], L: val }
                                  }));
                                }}
                                className="w-full p-1 text-center font-mono text-xs font-bold rounded-[6px] border border-[#dcdfe4] bg-white focus:outline-none focus:border-[#c09748]"
                              />
                            </td>
                          ))}
                        </tr>

                        {/* Row B: A */}
                        <tr className="hover:bg-[#fafafb] transition">
                          <td className="py-2 px-2.5 text-center font-mono font-bold text-[#c09748] text-xs">B</td>
                          <td className="py-2 px-3 font-medium text-[#17191c] text-xs">A</td>
                          <td className="py-2 px-3 text-center text-[11px] font-mono font-bold text-[#c09748]">
                            Master: {masterA}
                          </td>
                          <td className="py-2 px-3 text-center text-[11px] text-[#777b86]">Spectrometer</td>
                          {(['s1', 's2', 's3', 's4', 's5'] as const).map(sKey => (
                            <td key={sKey} className="py-1 px-1.5 text-center">
                              <input
                                type="number"
                                step="0.01"
                                value={sampleSpectro[sKey].a}
                                onChange={e => {
                                  const val = e.target.value;
                                  setSampleSpectro(prev => ({
                                    ...prev,
                                    [sKey]: { ...prev[sKey], a: val }
                                  }));
                                }}
                                className="w-full p-1 text-center font-mono text-xs font-bold rounded-[6px] border border-[#dcdfe4] bg-white focus:outline-none focus:border-[#c09748]"
                              />
                            </td>
                          ))}
                        </tr>

                        {/* Row C: B */}
                        <tr className="hover:bg-[#fafafb] transition">
                          <td className="py-2 px-2.5 text-center font-mono font-bold text-[#c09748] text-xs">C</td>
                          <td className="py-2 px-3 font-medium text-[#17191c] text-xs">B</td>
                          <td className="py-2 px-3 text-center text-[11px] font-mono font-bold text-[#c09748]">
                            Master: {masterB}
                          </td>
                          <td className="py-2 px-3 text-center text-[11px] text-[#777b86]">Spectrometer</td>
                          {(['s1', 's2', 's3', 's4', 's5'] as const).map(sKey => (
                            <td key={sKey} className="py-1 px-1.5 text-center">
                              <input
                                type="number"
                                step="0.01"
                                value={sampleSpectro[sKey].b}
                                onChange={e => {
                                  const val = e.target.value;
                                  setSampleSpectro(prev => ({
                                    ...prev,
                                    [sKey]: { ...prev[sKey], b: val }
                                  }));
                                }}
                                className="w-full p-1 text-center font-mono text-xs font-bold rounded-[6px] border border-[#dcdfe4] bg-white focus:outline-none focus:border-[#c09748]"
                              />
                            </td>
                          ))}
                        </tr>

                        {/* Row D: DeltaE */}
                        <tr className="bg-[#faf7ed]/60 hover:bg-[#faf7ed] transition">
                          <td className="py-2 px-2.5 text-center font-mono font-bold text-[#8a6521] text-xs">D</td>
                          <td className="py-2 px-3 font-bold text-[#8a6521] text-xs">&Delta;E (Delta Value)</td>
                          <td className="py-2 px-3 text-center text-[11px] font-mono font-bold text-emerald-800">
                            &le; 0.70
                          </td>
                          <td className="py-2 px-3 text-center text-[11px] text-[#777b86]">Spectrometer</td>
                          {(['s1', 's2', 's3', 's4', 's5'] as const).map(sKey => {
                            const val = Number(sampleSpectro[sKey].deltaE);
                            const isPass = val <= 0.70;
                            return (
                              <td key={sKey} className="py-1 px-1.5 text-center">
                                <div className="space-y-0.5">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={sampleSpectro[sKey].deltaE}
                                    onChange={e => {
                                      const newD = e.target.value;
                                      setSampleSpectro(prev => ({
                                        ...prev,
                                        [sKey]: { ...prev[sKey], deltaE: newD }
                                      }));
                                    }}
                                    className="w-full p-1 text-center font-mono text-xs font-bold rounded-[6px] border border-[#c09748] bg-white focus:outline-none focus:ring-1 focus:ring-[#c09748]"
                                  />
                                  <div className={`text-[9px] font-bold ${isPass ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {isPass ? '✓ Pass' : '⚠ High'}
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <span>Proceed to Lot & Signatures (Step 2) &rarr;</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: QUANTITIES, LOT ACCEPTANCE & SIGNATURES */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Sampling Quantities Card */}
                <div className="p-4 rounded-[20px] bg-white border border-[#ececec] space-y-3">
                  <span className="font-bold text-xs text-[#17191c] uppercase tracking-wider block pb-2 border-b border-[#f2f2f3]">
                    Lot Sampling & Rejections
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#777b86] block">Offer QTY (Total Lot)</label>
                      <input
                        type="number"
                        value={offeredQty}
                        onChange={e => setOfferedQty(Number(e.target.value))}
                        className="w-full mt-1 p-2 rounded-[10px] border border-[#dcdfe4] bg-white font-mono font-bold text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#777b86] block">No. of Checked Sample for OQC</label>
                      <input
                        type="number"
                        value={sampledQty}
                        onChange={e => setSampledQty(Number(e.target.value))}
                        className="w-full mt-1 p-2 rounded-[10px] border border-[#dcdfe4] bg-white font-mono font-bold text-xs text-[#c09748]"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#777b86] block">Rejected Nos</label>
                      <input
                        type="number"
                        value={rejectedQty}
                        onChange={e => setRejectedQty(Number(e.target.value))}
                        className="w-full mt-1 p-2 rounded-[10px] border border-[#dcdfe4] bg-white font-mono font-bold text-xs text-rose-700"
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#777b86] block">Lot Acceptance by PaintKing</label>
                      <select
                        value={lotAcceptance}
                        onChange={e => setLotAcceptance(e.target.value as any)}
                        className={`w-full mt-1 p-2 rounded-[10px] font-bold text-xs border cursor-pointer ${
                          lotAcceptance === 'Accepted'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        <option value="Accepted">Accepted (Passed to Store)</option>
                        <option value="Hold">Hold (Review Required)</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* NOTE Banner as per Excel Sheet */}
                <div className="p-3 rounded-[14px] bg-[#faf3e0] border border-[#f4e5be] text-xs text-[#8a6521] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#c09748] shrink-0" />
                  <span>
                    <strong>NOTE:</strong> On OQC Approval, oqc Approved material given to Store.
                  </span>
                </div>

                {/* 3 Department Signatures */}
                <div className="p-4 rounded-[20px] bg-white border border-[#ececec] space-y-3">
                  <span className="font-bold text-xs text-[#17191c] uppercase tracking-wider block pb-2 border-b border-[#f2f2f3]">
                    Inspection Authorization & Dual Sign-Off
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#777b86] block">Prepared By: Quality Engineer</label>
                      <input
                        type="text"
                        value={preparedBy}
                        onChange={e => setPreparedBy(e.target.value)}
                        className="w-full mt-1 p-2 rounded-[10px] border border-[#dcdfe4] bg-white text-xs font-semibold"
                        required
                      />
                      <span className="text-[10px] text-[#777b86] mt-0.5 block">QA Gate Inspector</span>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#777b86] block">Approved By: Manager QA</label>
                      <input
                        type="text"
                        value={approvedBy}
                        onChange={e => setApprovedBy(e.target.value)}
                        className="w-full mt-1 p-2 rounded-[10px] border border-[#dcdfe4] bg-white text-xs font-semibold"
                        required
                      />
                      <span className="text-[10px] text-[#777b86] mt-0.5 block">QA Department Clearance</span>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#777b86] block">Acceptance Production Incharge</label>
                      <input
                        type="text"
                        value={acceptanceProductionIncharge}
                        onChange={e => setAcceptanceProductionIncharge(e.target.value)}
                        className="w-full mt-1 p-2 rounded-[10px] border border-[#dcdfe4] bg-white text-xs font-semibold"
                        required
                      />
                      <span className="text-[10px] text-[#777b86] mt-0.5 block">Production Handover Sign</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Navigation */}
                <div className="flex items-center justify-between pt-2 border-t border-[#ececec]">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 rounded-full border border-[#dcdfe4] text-xs font-semibold text-[#777b86] hover:bg-gray-50 transition cursor-pointer"
                  >
                    &larr; Back to Step 1
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-full border border-[#dcdfe4] text-xs font-semibold text-[#777b86] hover:bg-gray-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Generate Official OQC Report</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
