import React, { useState, useEffect } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { FinalQualityRelease } from '../types/portalTypes';
import { 
  CheckCircle2, 
  X, 
  Download, 
  FileCheck, 
  ShieldCheck, 
  Check, 
  Sparkles,
  PackageCheck,
  Sliders,
  Eye
} from 'lucide-react';
import { downloadStandardPdiPdf, formatDateDDMMYYYY } from '../utils/pdfStandardHeader';

interface PDIModalProps {
  isOpen: boolean;
  onClose: () => void;
  release?: FinalQualityRelease | null;
  onSuccess?: () => void;
}

export const PDIModal: React.FC<PDIModalProps> = ({
  isOpen,
  onClose,
  release,
  onSuccess
}) => {
  const { submitPdiClearance, currentUser, fpaRecords, qualityReleases, billingInvoices } = usePortalStore();

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Auto-fill Header & Job Meta (Read-only for identification)
  const [pdiReportNo, setPdiReportNo] = useState<string>(() => `PK-PDI-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customer, setCustomer] = useState<string>('');
  const [woNo, setWoNo] = useState<string>('');
  const [partCode, setPartCode] = useState<string>('');
  const [partDescription, setPartDescription] = useState<string>('');
  const [family, setFamily] = useState<string>('');
  const [paintBatchNumber, setPaintBatchNumber] = useState<string>('');
  const [paintDescription, setPaintDescription] = useState<string>('');
  const [paintViscosity, setPaintViscosity] = useState<string>('');
  const [lotSize, setLotSize] = useState<number>(0);
  const [boxQty, setBoxQty] = useState<number>(0);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');

  // Asthetical Values (1 to 5)
  const [boxBinCondition, setBoxBinCondition] = useState<'Pass' | 'Fail'>('Pass');
  const [polybagCondition, setPolybagCondition] = useState<'Pass' | 'Fail'>('Pass');
  const [identificationSlip, setIdentificationSlip] = useState<'Pass' | 'Fail'>('Pass');
  const [shortExcess, setShortExcess] = useState<'Perfect' | 'Discrepancy'>('Perfect');
  const [paintingDefects, setPaintingDefects] = useState<'Pass' | 'Fail'>('Pass');

  // Adhesion Test
  const [crossCutTapeTest, setCrossCutTapeTest] = useState<'OK' | 'NOT OK'>('OK');

  // Delta Values (Spectrometer)
  const [masterL, setMasterL] = useState<number | string>(42.00);
  const [masterA, setMasterA] = useState<number | string>(54.00);
  const [masterB, setMasterB] = useState<number | string>(28.00);
  const [L, setL] = useState<number | string>(42.16);
  const [a, setA] = useState<number | string>(54.29);
  const [b, setB] = useState<number | string>(28.14);
  const [deltaE, setDeltaE] = useState<number | string>(0.38);

  // Lot Acceptance & Sampling
  const [checkedSamplePdi, setCheckedSamplePdi] = useState<number>(50);
  const [rejectedNos, setRejectedNos] = useState<number>(0);
  const [defectDetails, setDefectDetails] = useState<string>('Nil / 100% Visual & Delta OK');
  const [lotAcceptance, setLotAcceptance] = useState<'Accepted' | 'Rejected' | 'Hold'>('Accepted');

  // Sign-off
  const [qualityEngineerSign, setQualityEngineerSign] = useState<string>(currentUser?.name || 'Manoj Tiwari (Quality Engineer)');
  const [managerQASign, setManagerQASign] = useState<string>('Rajesh Nair (Head QA & Compliance)');

  const [createdPdiRelease, setCreatedPdiRelease] = useState<FinalQualityRelease | null>(null);

  // Auto populate on release prop or initial open
  useEffect(() => {
    if (release) {
      if (release.customer) setCustomer(release.customer);
      if (release.woNo) setWoNo(release.woNo);
      if (release.partCode) setPartCode(release.partCode);
      if (release.partDescription) setPartDescription(release.partDescription);
      if (release.model) setFamily(release.model);

      // Auto-fetch linked Tax Invoice if already generated
      const matchingInv = billingInvoices.find(inv => inv.woNo === release.woNo || inv.invoiceNo === release.invoiceNumber);
      if (matchingInv) {
        setInvoiceNumber(matchingInv.invoiceNo);
      } else if (release.invoiceNumber) {
        setInvoiceNumber(release.invoiceNumber);
      } else {
        setInvoiceNumber('Awaiting Billing Generation');
      }

      const totalPcs = release.passedQty || release.offeredQty || 1000;
      setLotSize(totalPcs);
      const bQty = release.totalBoxes || Math.ceil(totalPcs / 50);
      setBoxQty(bQty);
      setCheckedSamplePdi(Math.max(5, Math.ceil(totalPcs * 0.05)));

      // Inherit Master LAB from OQC release or FPA
      if (release.masterL) setMasterL(release.masterL);
      if (release.masterA) setMasterA(release.masterA);
      if (release.masterB) setMasterB(release.masterB);
      if (release.L) setL(release.L);
      if (release.a) setA(release.a);
      if (release.b) setB(release.b);
      if (release.deltaE !== undefined) setDeltaE(release.deltaE);

      // Try looking up FPA for paint batches
      const matchFpa = fpaRecords.find(f => f.woNo === release.woNo || f.partCode === release.partCode);
      if (matchFpa) {
        if (matchFpa.paintBatch) setPaintBatchNumber(matchFpa.paintBatch);
        if (matchFpa.paintDescription) setPaintDescription(matchFpa.paintDescription);
        if (matchFpa.viscositySec) setPaintViscosity(`${matchFpa.viscositySec}s (Ford-4)`);
        if (matchFpa.family) setFamily(matchFpa.family);
      }
    }
  }, [release, fpaRecords]);

  if (!isOpen) return null;

  const markAllPdiPass = () => {
    setBoxBinCondition('Pass');
    setPolybagCondition('Pass');
    setIdentificationSlip('Pass');
    setShortExcess('Perfect');
    setPaintingDefects('Pass');
    setCrossCutTapeTest('OK');
    setLotAcceptance('Accepted');
    setRejectedNos(0);
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

    const pdiPayload: Partial<FinalQualityRelease> = {
      pdiReportNo,
      pdiDate: date,
      pdiInspector: qualityEngineerSign,
      pdiStatus: lotAcceptance === 'Accepted' ? 'Cleared for Invoicing' : 'Hold',
      plantHeadSign: managerQASign,
      generatedTimestamp,
      // Excel Specific Fields
      paintBatchNumber,
      paintDescription,
      paintViscosity,
      lotSize,
      boxQty,
      invoiceNumber,
      boxBinCondition,
      polybagCondition,
      identificationSlip,
      shortExcess,
      paintingDefects,
      crossCutTapeTest,
      pdiMasterL: masterL,
      pdiMasterA: masterA,
      pdiMasterB: masterB,
      pdiL: L,
      pdiA: a,
      pdiB: b,
      pdiDeltaE: deltaE,
      pdiCheckedSample: checkedSamplePdi,
      pdiRejectedNos: rejectedNos,
      pdiDefectDetails: defectDetails,
      pdiLotAcceptance: lotAcceptance,
      pdiQualityEngineerSign: qualityEngineerSign,
      pdiManagerQASign: managerQASign,
      // Backward compatibility
      packingBoxCondition: boxBinCondition === 'Pass' ? 'Pass' : 'Fail',
      traceabilityBatchNo: identificationSlip === 'Pass' ? 'Pass' : 'Fail',
      quantityMatch: shortExcess === 'Perfect' ? 'Pass' : 'Fail'
    };

    const targetReleaseId = release?.releaseId || pdiReportNo;
    submitPdiClearance(targetReleaseId, pdiPayload);

    const mergedRelease: FinalQualityRelease = {
      ...(release || ({} as any)),
      ...pdiPayload,
      releaseId: targetReleaseId,
      customer,
      woNo,
      partCode,
      partDescription,
      color: release?.color || 'Monza Red Gloss',
      offeredQty: lotSize,
      passedQty: Math.max(0, lotSize - rejectedNos),
      rejectedQty: rejectedNos,
      date
    };

    setCreatedPdiRelease(mergedRelease);

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
        {createdPdiRelease ? (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-5 rounded-[22px] bg-[#faf7ed] border border-[#f4e5be] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#c09748] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] font-mono bg-emerald-100 text-emerald-900">
                      ✓ PDI INSPECTION COMPLETED
                    </span>
                    <span className="font-mono text-xs text-[#8a6521] font-bold">
                      {createdPdiRelease.pdiReportNo || createdPdiRelease.releaseId}
                    </span>
                  </div>
                  <h3 className="font-serif font-normal text-lg text-[#17191c] mt-0.5">
                    Pre-Dispatch Clearance Certificate Ready!
                  </h3>
                  <p className="text-xs text-[#777b86]">
                    Customer: <strong>{createdPdiRelease.customer}</strong> • Part: <strong>{createdPdiRelease.partCode}</strong> • Cleared Qty: <strong>{createdPdiRelease.passedQty} Pcs</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => downloadStandardPdiPdf(createdPdiRelease)}
                  className="px-4 py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-[#8a6521]" />
                  <span>Download Official PDI PDF</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold cursor-pointer active:scale-95 transition"
              >
                Close & Return to Gate 5
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header Title Banner */}
            <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#faf3e0] text-[#c09748] flex items-center justify-center shrink-0 border border-[#f4e5be]">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono font-bold uppercase tracking-wider mb-0.5">
                    DOC: PK-QA-PDI-001 • QUALITY GATE 5
                  </div>
                  <h2 className="text-xl font-serif text-[#17191c] font-normal tracking-tight">
                    Pre-Dispatch Inspection (PDI) Report
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
                { num: 1, title: 'Asthetical, Tape & Delta Tests', sub: 'Box, Polybag, Adhesion & CIELAB' },
                { num: 2, title: 'Sampling & Lot Acceptance', sub: 'Checked Sample, Rejection & Dual Sign-off' }
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

            {/* STEP 1: ASTHETICAL VALUES, TAPE ADHESION & DELTA VALUES */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Auto-filled Identification Strip (Read-Only) */}
                <div className="p-3.5 rounded-[18px] bg-[#fafafb] border border-[#ececec] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#777b86] block">Customer</span>
                    <div className="mt-0.5 font-semibold text-xs text-[#17191c] truncate">{customer}</div>
                    <div className="text-[10px] text-[#777b86] font-mono mt-0.5">PDI Ref: <strong className="text-[#c09748]">{pdiReportNo}</strong></div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#777b86] block">Work Order / Invoice</span>
                    <div className="mt-0.5 font-mono font-bold text-xs text-[#17191c]">{woNo}</div>
                    <div className="text-[10px] text-[#777b86] mt-0.5">Inv: <strong className="text-[#17191c] font-mono">{invoiceNumber}</strong></div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#777b86] block">Part Code & Family</span>
                    <div className="mt-0.5 font-semibold text-xs text-[#17191c]">{partCode}</div>
                    <div className="text-[10px] text-[#777b86] mt-0.5 truncate">{family || 'OEM Specification'}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#777b86] block">Batch & Viscosity</span>
                    <div className="mt-0.5 font-mono text-[11px] text-[#17191c] truncate">{paintBatchNumber}</div>
                    <div className="text-[10px] text-[#777b86] mt-0.5">Visc: <strong>{paintViscosity}</strong> • Lots: <strong>{lotSize} Pcs</strong></div>
                  </div>
                </div>

                {/* 1. Asthetical Values Checklist */}
                <div className="p-4 rounded-[20px] bg-white border border-[#ececec] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#f2f2f3]">
                    <span className="font-bold text-xs text-[#17191c] uppercase tracking-wider">
                      1. Asthetical Values & Packaging Inspection
                    </span>
                    <button
                      type="button"
                      onClick={markAllPdiPass}
                      className="px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <Check className="w-3 h-3 text-emerald-700" />
                      <span>✓ Quick Set All Pass</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-[14px] border border-[#ececec]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#fafafb] border-b border-[#ececec] text-[#777b86]">
                          <th className="py-2 px-2.5 font-bold text-[10px] uppercase tracking-wider text-center w-10">Sr.</th>
                          <th className="py-2 px-3 font-bold text-[10px] uppercase tracking-wider">Parameters</th>
                          <th className="py-2 px-3 font-bold text-[10px] uppercase tracking-wider">Specification</th>
                          <th className="py-2 px-3 font-bold text-[10px] uppercase tracking-wider text-center">Tech</th>
                          <th className="py-2 px-3 font-bold text-[10px] uppercase tracking-wider text-center w-28">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ececec]">
                        {/* 1. Box/Bin */}
                        <tr className="hover:bg-[#fafafb] transition">
                          <td className="py-2 px-2.5 text-center font-mono font-bold text-[#c09748]">1</td>
                          <td className="py-2 px-3 font-medium text-[#17191c]">Box / Bin Condition</td>
                          <td className="py-2 px-3 text-[11px] text-[#777b86]">Should be free from dust, dirt, oil, Damage</td>
                          <td className="py-2 px-3 text-center text-[11px] text-[#777b86]">Visual</td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => setBoxBinCondition(prev => prev === 'Pass' ? 'Fail' : 'Pass')}
                              className={`px-3 py-0.5 rounded-full text-xs font-bold border transition cursor-pointer shadow-2xs ${
                                boxBinCondition === 'Pass' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
                              }`}
                            >
                              {boxBinCondition === 'Pass' ? '✓ Pass' : '✗ Fail'}
                            </button>
                          </td>
                        </tr>

                        {/* 2. Polybag */}
                        <tr className="hover:bg-[#fafafb] transition">
                          <td className="py-2 px-2.5 text-center font-mono font-bold text-[#c09748]">2</td>
                          <td className="py-2 px-3 font-medium text-[#17191c]">Polybag Condition</td>
                          <td className="py-2 px-3 text-[11px] text-[#777b86]">Should be free from dust, dirt, oil, Damage</td>
                          <td className="py-2 px-3 text-center text-[11px] text-[#777b86]">Visual</td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => setPolybagCondition(prev => prev === 'Pass' ? 'Fail' : 'Pass')}
                              className={`px-3 py-0.5 rounded-full text-xs font-bold border transition cursor-pointer shadow-2xs ${
                                polybagCondition === 'Pass' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
                              }`}
                            >
                              {polybagCondition === 'Pass' ? '✓ Pass' : '✗ Fail'}
                            </button>
                          </td>
                        </tr>

                        {/* 3. Identification */}
                        <tr className="hover:bg-[#fafafb] transition">
                          <td className="py-2 px-2.5 text-center font-mono font-bold text-[#c09748]">3</td>
                          <td className="py-2 px-3 font-medium text-[#17191c]">Identification</td>
                          <td className="py-2 px-3 text-[11px] text-[#777b86]">Should be match with as per Store material Slip</td>
                          <td className="py-2 px-3 text-center text-[11px] text-[#777b86]">Visual</td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => setIdentificationSlip(prev => prev === 'Pass' ? 'Fail' : 'Pass')}
                              className={`px-3 py-0.5 rounded-full text-xs font-bold border transition cursor-pointer shadow-2xs ${
                                identificationSlip === 'Pass' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
                              }`}
                            >
                              {identificationSlip === 'Pass' ? '✓ Pass' : '✗ Fail'}
                            </button>
                          </td>
                        </tr>

                        {/* 4. Short/Excess */}
                        <tr className="hover:bg-[#fafafb] transition">
                          <td className="py-2 px-2.5 text-center font-mono font-bold text-[#c09748]">4</td>
                          <td className="py-2 px-3 font-medium text-[#17191c]">Short / Excess</td>
                          <td className="py-2 px-3 text-[11px] text-[#777b86]">Perfect (Zero Discrepancy)</td>
                          <td className="py-2 px-3 text-center text-[11px] text-[#777b86]">Count</td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => setShortExcess(prev => prev === 'Perfect' ? 'Discrepancy' : 'Perfect')}
                              className={`px-3 py-0.5 rounded-full text-xs font-bold border transition cursor-pointer shadow-2xs ${
                                shortExcess === 'Perfect' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
                              }`}
                            >
                              {shortExcess}
                            </button>
                          </td>
                        </tr>

                        {/* 5. Painting Defects */}
                        <tr className="hover:bg-[#fafafb] transition">
                          <td className="py-2 px-2.5 text-center font-mono font-bold text-[#c09748]">5</td>
                          <td className="py-2 px-3 font-medium text-[#17191c]">Painting Defects</td>
                          <td className="py-2 px-3 text-[11px] text-[#777b86]">Bubble, Dust Spot, Over Paint, Missing, Finishing should not be</td>
                          <td className="py-2 px-3 text-center text-[11px] text-[#777b86]">Visual</td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => setPaintingDefects(prev => prev === 'Pass' ? 'Fail' : 'Pass')}
                              className={`px-3 py-0.5 rounded-full text-xs font-bold border transition cursor-pointer shadow-2xs ${
                                paintingDefects === 'Pass' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
                              }`}
                            >
                              {paintingDefects === 'Pass' ? '✓ Pass' : '✗ Fail'}
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Adhesion Test (ASTM 5B Cross Cut & Tape Impression) */}
                <div className="p-4 rounded-[20px] bg-white border border-[#ececec] space-y-3">
                  <span className="font-bold text-xs text-[#17191c] uppercase tracking-wider block pb-2 border-b border-[#f2f2f3]">
                    2. Cross Cut Tape Adhesion Test
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec]">
                      <span className="text-[10px] text-[#777b86] uppercase font-bold block">Method</span>
                      <div className="font-semibold text-xs text-[#17191c] mt-0.5">ASTM D3359 Cross-Cut Tape Test</div>
                      <div className="text-[10px] text-[#777b86] mt-0.5">Technique: Physical 3M 600 Pull</div>
                    </div>

                    <div className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] text-center space-y-1.5">
                      <span className="text-[10px] text-[#777b86] uppercase font-bold block">Test Status</span>
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCrossCutTapeTest('OK')}
                          className={`px-4 py-1 rounded-full text-xs font-bold border transition cursor-pointer ${
                            crossCutTapeTest === 'OK' ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-300' : 'bg-white text-[#777b86] border-[#dcdfe4]'
                          }`}
                        >
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => setCrossCutTapeTest('NOT OK')}
                          className={`px-4 py-1 rounded-full text-xs font-bold border transition cursor-pointer ${
                            crossCutTapeTest === 'NOT OK' ? 'bg-red-50 text-red-800 border-red-300 ring-1 ring-red-300' : 'bg-white text-[#777b86] border-[#dcdfe4]'
                          }`}
                        >
                          NOT OK
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] text-center border-dashed">
                      <span className="text-[10px] text-[#777b86] uppercase font-bold block">Specimen Area</span>
                      <div className="mt-1 text-xs font-bold text-[#17191c]">Tape Impression Attached</div>
                      <span className="text-[10px] text-emerald-700 font-medium">100% Zero Coating Flaking</span>
                    </div>
                  </div>
                </div>

                {/* 3. Delta Values Test (CIELAB Spectrometer) */}
                <div className="p-4 rounded-[20px] bg-white border border-[#ececec] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#f2f2f3]">
                    <span className="font-bold text-xs text-[#17191c] uppercase tracking-wider">
                      3. Spectrophotometer Delta Values Test
                    </span>
                    <span className="text-[10px] font-mono text-[#8a6521] bg-[#faf3e0] px-2.5 py-0.5 rounded-full border border-[#f4e5be] font-bold">
                      Target &Delta;E &le; 0.70
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                      <span className="text-[10px] text-[#777b86] uppercase font-bold block">L (Luminance)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={L}
                        onChange={e => setL(e.target.value)}
                        className="w-full text-center p-1 rounded-[6px] border border-[#dcdfe4] bg-white font-mono font-bold text-xs"
                      />
                      <span className="text-[10px] text-[#777b86] block">Master: {masterL}</span>
                    </div>

                    <div className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                      <span className="text-[10px] text-[#777b86] uppercase font-bold block">A (Green-Red)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={a}
                        onChange={e => setA(e.target.value)}
                        className="w-full text-center p-1 rounded-[6px] border border-[#dcdfe4] bg-white font-mono font-bold text-xs"
                      />
                      <span className="text-[10px] text-[#777b86] block">Master: {masterA}</span>
                    </div>

                    <div className="p-3 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-1">
                      <span className="text-[10px] text-[#777b86] uppercase font-bold block">B (Blue-Yellow)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={b}
                        onChange={e => setB(e.target.value)}
                        className="w-full text-center p-1 rounded-[6px] border border-[#dcdfe4] bg-white font-mono font-bold text-xs"
                      />
                      <span className="text-[10px] text-[#777b86] block">Master: {masterB}</span>
                    </div>

                    <div className="p-3 rounded-[14px] bg-[#faf7ed] border border-[#f4e5be] space-y-1">
                      <span className="text-[10px] text-[#8a6521] uppercase font-bold block">&Delta;E (Delta Value)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={deltaE}
                        onChange={e => setDeltaE(e.target.value)}
                        className="w-full text-center p-1 rounded-[6px] border border-[#c09748] bg-white font-mono font-bold text-xs text-[#8a6521]"
                      />
                      <span className="text-[10px] font-bold text-emerald-800 block">
                        {Number(deltaE) <= 0.70 ? '✓ PASS (&le; 0.70)' : '⚠ HIGH'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <span>Proceed to Sampling & Signatures (Step 2) &rarr;</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: SAMPLING, REJECTIONS & SIGNATURES */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Sampling Quantities Card */}
                <div className="p-4 rounded-[20px] bg-white border border-[#ececec] space-y-3">
                  <span className="font-bold text-xs text-[#17191c] uppercase tracking-wider block pb-2 border-b border-[#f2f2f3]">
                    Sampling, Rejection & Lot Acceptance
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#777b86] block">No. of Checked Sample for PDI</label>
                      <input
                        type="number"
                        value={checkedSamplePdi}
                        onChange={e => setCheckedSamplePdi(Number(e.target.value))}
                        className="w-full mt-1 p-2 rounded-[10px] border border-[#dcdfe4] bg-white font-mono font-bold text-xs text-[#c09748]"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#777b86] block">Rejected Nos</label>
                      <input
                        type="number"
                        value={rejectedNos}
                        onChange={e => setRejectedNos(Number(e.target.value))}
                        className="w-full mt-1 p-2 rounded-[10px] border border-[#dcdfe4] bg-white font-mono font-bold text-xs text-rose-700"
                        min={0}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#777b86] block">Defect Details</label>
                      <input
                        type="text"
                        value={defectDetails}
                        onChange={e => setDefectDetails(e.target.value)}
                        className="w-full mt-1 p-2 rounded-[10px] border border-[#dcdfe4] bg-white text-xs font-medium"
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
                        <option value="Accepted">Accepted (Dispatch Authorized)</option>
                        <option value="Hold">Hold (Review Required)</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Dual Signatures Container */}
                <div className="p-4 rounded-[20px] bg-white border border-[#ececec] space-y-3">
                  <span className="font-bold text-xs text-[#17191c] uppercase tracking-wider block pb-2 border-b border-[#f2f2f3]">
                    Inspection Authorization & Dual Sign-Off
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#777b86] block">Prepared By: Quality Engineer</label>
                      <input
                        type="text"
                        value={qualityEngineerSign}
                        onChange={e => setQualityEngineerSign(e.target.value)}
                        className="w-full mt-1 p-2 rounded-[10px] border border-[#dcdfe4] bg-white text-xs font-semibold"
                        required
                      />
                      <span className="text-[10px] text-[#777b86] mt-0.5 block">QA Gate 5 Inspector</span>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#777b86] block">Approved By: Manager QA</label>
                      <input
                        type="text"
                        value={managerQASign}
                        onChange={e => setManagerQASign(e.target.value)}
                        className="w-full mt-1 p-2 rounded-[10px] border border-[#dcdfe4] bg-white text-xs font-semibold"
                        required
                      />
                      <span className="text-[10px] text-[#777b86] mt-0.5 block">Head QA & Dispatch Release</span>
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
                      <span>Grant PDI Clearance & Release to Dispatch</span>
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
