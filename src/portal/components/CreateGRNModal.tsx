import React, { useState, useEffect } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { GoodsReceiptNote, GRNLineItem, OrderColorSplit } from '../types/portalTypes';
import { 
  CheckCircle2, 
  Truck, 
  Package, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Download, 
  Printer, 
  Save, 
  Sparkles, 
  Check, 
  X,
  FileText,
  BadgeCheck,
  ChevronRight,
  ClipboardCheck,
  UserCheck,
  Building2,
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { OfficialGRNDocument } from './OfficialGRNDocument';
import { downloadStandardGRNPdf } from '../utils/pdfStandardHeader';
import { PaintkingDatePicker } from './PaintkingDatePicker';

interface CreateGRNModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingJob?: any | null;
}

export const CreateGRNModal: React.FC<CreateGRNModalProps> = ({ isOpen, onClose, pendingJob }) => {
  const { addGRN, activePlant, currentUser, materialInwardLogs } = usePortalStore();

  const latestGateInward = materialInwardLogs[0];
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Success state after receiving material into store
  const [createdGRN, setCreatedGRN] = useState<GoodsReceiptNote | null>(null);

  // Track verified status for each item
  const [verifiedItemIds, setVerifiedItemIds] = useState<Record<string, boolean>>({});

  // 1. Header Information (8 Primary Fields from Gate/IQC)
  const [grnNo, setGrnNo] = useState<string>(`PK-GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [vehicleNo, setVehicleNo] = useState<string>('UK-08-AL-4412');
  const [supplierCustomer, setSupplierCustomer] = useState<string>('ROOP POLYMERS LTD');
  const [invoiceChallanNo, setInvoiceChallanNo] = useState<string>('RP/CH/99824');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [receivedDate, setReceivedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [transportName, setTransportName] = useState<string>('VRL LOGISTICS');

  // 2. Official Signatures (3 Signature Fields)
  const [storeIncharge, setStoreIncharge] = useState<string>(currentUser?.name || 'Manoj Tiwari (Stores)');
  const [qualityApprovedBy, setQualityApprovedBy] = useState<string>('Amit Verma (QA Lead)');
  const [approvedBy, setApprovedBy] = useState<string>('Satish Sharma (Plant Head)');
  const [remarks, setRemarks] = useState<string>('Physical box count and IQC quality clearance verified.');

  // Customer Color Splits for Job Cards
  const [colorSplits, setColorSplits] = useState<OrderColorSplit[]>([
    { colorName: 'Standard OEM Basecoat', colorCode: 'OEM-01', orderedQty: 1000, unitRate: 25 }
  ]);

  // Line Items from IQC Inspection
  const [items, setItems] = useState<GRNLineItem[]>([
    {
      id: '1',
      partCode: 'RP-8841',
      partDescription: 'Auto AC Center Vent Bezel Substrate (ABS)',
      invoicedQty: 1000,
      actualReceivedQty: 1000,
      shortExcessQty: 0,
      okByIqcQty: 1000,
      rejectionQty: 0,
      remark: 'IQC Cleared - Zero flash'
    }
  ]);

  // Auto populate all fields from the pending IQC lot when opened
  useEffect(() => {
    if (isOpen) {
      setCreatedGRN(null);
      setActiveStep(1);

      const genGrnNo = `PK-GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setGrnNo(genGrnNo);

      if (pendingJob) {
        setSupplierCustomer(pendingJob.vendorCustomer || pendingJob.partyName || 'ROOP POLYMERS LTD');
        setInvoiceChallanNo(pendingJob.invoiceChallanNo || pendingJob.challanNo || 'CH-001');
        setVehicleNo(pendingJob.vehicleNo || 'UK-08-AL-4412');
        setInvoiceDate(pendingJob.invoiceChallanDate || pendingJob.challanDate || new Date().toISOString().split('T')[0]);
        setReceivedDate(pendingJob.receivedDate || new Date().toISOString().split('T')[0]);
        setRemarks(`IQC Cleared (Report No: ${pendingJob.reportNo || pendingJob.iqcReportNo || 'IQC-OK'}). Approved for Store Intake.`);
        setQualityApprovedBy(pendingJob.preparedBy || pendingJob.iqcRecord?.inspector || 'Amit Verma (QA Lead)');
        setApprovedBy(pendingJob.verifiedBy || pendingJob.iqcRecord?.verifiedBy || 'Satish Sharma (Plant Head)');

        if (pendingJob.items && pendingJob.items.length > 0) {
          const initialVerified: Record<string, boolean> = {};
          const mappedItems: GRNLineItem[] = pendingJob.items.map((it: any, i: number) => {
            const itemId = it.id || String(i + 1);
            initialVerified[itemId] = true; // Auto-marked as verified from IQC
            const invQ = Number(it.challanQty || it.quantity || pendingJob.totalQty || 1000);
            const okQ = Number(it.passQty !== undefined ? it.passQty : (it.actualQty || it.quantity || pendingJob.totalQty || 1000));
            const rejQ = Number(it.rejectQty || 0);
            const actQ = okQ; // Default actual store received to OK quantity from IQC

            return {
              id: itemId,
              partCode: (it.materialName || pendingJob.partComponent || 'SUBSTRATE').slice(0, 10).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'SUBSTRATE',
              partDescription: it.materialName || pendingJob.partDescription || 'Component Substrate',
              invoicedQty: invQ,
              actualReceivedQty: actQ,
              shortExcessQty: actQ - invQ,
              okByIqcQty: okQ,
              rejectionQty: rejQ,
              remark: it.defectDetail || it.notes || 'IQC Inspection Passed'
            };
          });

          setItems(mappedItems);
          setVerifiedItemIds(initialVerified);

          const totalQ = mappedItems.reduce((acc, curr) => acc + curr.actualReceivedQty, 0);
          setColorSplits([
            { colorName: 'Standard OEM Basecoat', colorCode: 'OEM-01', orderedQty: totalQ, unitRate: 25 }
          ]);
        } else {
          const totQ = Number(pendingJob.totalQty) || 1000;
          const okQ = pendingJob.iqcRecord ? Number(pendingJob.iqcRecord.passQty || totQ) : totQ;
          const rejQ = pendingJob.iqcRecord ? Number(pendingJob.iqcRecord.rejectQty || 0) : 0;

          setItems([{
            id: '1',
            partCode: (pendingJob.partComponent || 'SUBSTRATE').slice(0, 10).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'SUBSTRATE',
            partDescription: pendingJob.partDescription || pendingJob.partComponent || 'Raw Substrate',
            invoicedQty: totQ,
            actualReceivedQty: okQ,
            shortExcessQty: okQ - totQ,
            okByIqcQty: okQ,
            rejectionQty: rejQ,
            remark: 'IQC inspection clear'
          }]);
          setVerifiedItemIds({ '1': true });

          setColorSplits([
            { colorName: 'Standard OEM Basecoat', colorCode: 'OEM-01', orderedQty: okQ, unitRate: 25 }
          ]);
        }
      } else {
        setSupplierCustomer(latestGateInward?.partyName || 'ROOP POLYMERS LTD');
        setInvoiceChallanNo(latestGateInward?.challanNo || 'RP/CH/99824');
        setVehicleNo(latestGateInward?.vehicleNo || 'UK-08-AL-4412');
        setVerifiedItemIds({ '1': true });
      }
    }
  }, [isOpen, pendingJob, latestGateInward, currentUser]);

  if (!isOpen) return null;

  // Total sums
  const totalInvoicedQty = items.reduce((sum, item) => sum + (Number(item.invoicedQty) || 0), 0);
  const totalActualReceivedQty = items.reduce((sum, item) => sum + (Number(item.actualReceivedQty) || 0), 0);
  const totalOkByIqcQty = items.reduce((sum, item) => sum + (Number(item.okByIqcQty) || 0), 0);
  const totalRejectionQty = items.reduce((sum, item) => sum + (Number(item.rejectionQty) || 0), 0);
  const totalShortExcessQty = totalActualReceivedQty - totalInvoicedQty;

  const handleUpdateItemActual = (id: string, newActual: number) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      const inv = Number(it.invoicedQty) || 0;
      return {
        ...it,
        actualReceivedQty: newActual,
        shortExcessQty: newActual - inv
      };
    }));
  };

  const handleToggleVerifyItem = (id: string) => {
    setVerifiedItemIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleVerifyAll = () => {
    const next: Record<string, boolean> = {};
    items.forEach(it => {
      if (it.id) next[it.id] = true;
    });
    setVerifiedItemIds(next);
  };

  // Preview object matching GoodsReceiptNote
  const previewGRN: GoodsReceiptNote = {
    docNo: 'Doc No:00',
    revNo: '00',
    revDate: new Date().toISOString().split('T')[0],
    grnNo,
    date,
    plant: activePlant,
    vehicleNo,
    supplierCustomer,
    invoiceChallanNo,
    invoiceDate,
    receivedDate,
    transporter: transportName,
    items,
    totalQty: totalActualReceivedQty,
    iqcStatus: 'Accepted',
    storeIncharge,
    qualityApprovedBy,
    approvedBy,
    remarks: pendingJob ? `${remarks} (Linked IQC: ${pendingJob.reportNo || pendingJob.iqcReportNo})` : remarks,
    sourceIqcReportNo: pendingJob?.reportNo || pendingJob?.iqcReportNo,
    colorSplits,
    partCode: items[0]?.partCode || 'SUBSTRATE',
    description: items[0]?.partDescription || 'Raw Parts',
    invoicedQty: totalInvoicedQty,
    actualReceivedQty: totalActualReceivedQty
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addGRN(previewGRN);
    setCreatedGRN(previewGRN);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-[24px] max-w-4xl w-full p-4 sm:p-6 md:p-7 shadow-2xl border border-[#ececec] space-y-5 max-h-[92vh] overflow-y-auto no-scrollbar">
        
        {/* ========================================================================= */}
        {/* VIEW 1: SUCCESS STATE (MATERIAL IN STORE INVENTORY & OFFICIAL GRN)         */}
        {/* ========================================================================= */}
        {createdGRN ? (
          <div className="space-y-5">
            {/* Top Celebration Strip */}
            <div className="p-4 sm:p-5 rounded-[20px] bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-normal text-lg text-emerald-950">
                    Material Received Successfully into Store Inventory!
                  </h3>
                  <p className="text-xs text-emerald-800">
                    Official Goods Received Note ({createdGRN.grnNo} • DOC NO: 00 • Rev.00) has been generated and inventory stock updated.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => downloadStandardGRNPdf(createdGRN)}
                  className="px-4 py-2 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-[#17191c]" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-full border border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-900 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print GRN</span>
                </button>
              </div>
            </div>

            {/* Render Official GRN Document */}
            <div className="p-1 sm:p-2 bg-[#fafafb] rounded-[20px] border border-[#ececec] overflow-x-auto">
              <OfficialGRNDocument grn={createdGRN} />
            </div>

            {/* Action to Close / Return */}
            <div className="flex justify-end pt-2 border-t border-[#ececec]">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] font-semibold text-xs transition cursor-pointer shadow-2xs active:scale-95"
              >
                Done (Return to Stores Dashboard)
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: 3-STEP STORE INTAKE WIZARD                                        */
          /* ========================================================================= */
          <div className="space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#ececec]">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono uppercase font-semibold tracking-wider">
                    Store Intake Desk
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-mono font-bold">
                    DOC NO: 00 • Rev.00
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    Auto-Filled from IQC
                  </span>
                  {pendingJob && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#faf7ed] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono font-semibold">
                      Ref: {pendingJob.reportNo || pendingJob.iqcReportNo || 'IQC-OK'}
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-serif text-[#17191c] font-normal tracking-tight">
                  Create Goods Receipt Note (GRN)
                </h2>
                <p className="text-xs text-[#777b86] mt-0.5">
                  Quality Approved Material Inward Intake & Official Store Inventory Acceptance
                </p>
              </div>

              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#fafafb] hover:bg-[#e5e7eb] text-[#777b86] hover:text-[#17191c] border border-[#ececec] flex items-center justify-center cursor-pointer transition active:scale-95"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Standard Connected Pill Stepper */}
            <div className="flex items-center p-1 bg-[#fafafb] rounded-full border border-[#ececec] gap-1">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className={`flex-1 py-2 px-2 sm:px-3 rounded-full text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 ${
                  activeStep === 1
                    ? 'bg-[#17191c] text-[#c09748] shadow-xs'
                    : 'text-[#777b86] hover:text-[#17191c]'
                }`}
              >
                <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                  activeStep === 1 ? 'bg-[#c09748] text-[#17191c]' : 'bg-gray-200 text-[#777b86]'
                }`}>
                  1
                </span>
                <span className="truncate">1. Inward Overview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className={`flex-1 py-2 px-2 sm:px-3 rounded-full text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 ${
                  activeStep === 2
                    ? 'bg-[#17191c] text-[#c09748] shadow-xs'
                    : 'text-[#777b86] hover:text-[#17191c]'
                }`}
              >
                <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                  activeStep === 2 ? 'bg-[#c09748] text-[#17191c]' : 'bg-gray-200 text-[#777b86]'
                }`}>
                  2
                </span>
                <span className="truncate">2. Items Verification ({items.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className={`flex-1 py-2 px-2 sm:px-3 rounded-full text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 ${
                  activeStep === 3
                    ? 'bg-[#17191c] text-[#c09748] shadow-xs'
                    : 'text-[#777b86] hover:text-[#17191c]'
                }`}
              >
                <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                  activeStep === 3 ? 'bg-[#c09748] text-[#17191c]' : 'bg-gray-200 text-[#777b86]'
                }`}>
                  3
                </span>
                <span className="truncate">3. Sign-off & GRN</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* ========================================================================= */}
              {/* STEP 1: INWARD & TRANSPORT OVERVIEW (8 PRE-FILLED FIELDS)                  */}
              {/* ========================================================================= */}
              {activeStep === 1 && (
                <div className="space-y-4">
                  {/* Helper Notification Banner */}
                  <div className="p-3.5 rounded-[20px] bg-[#faf7ed] border border-[#f4e5be] flex items-center gap-2.5 text-xs text-[#8a6521]">
                    <Sparkles className="w-4 h-4 text-[#c09748] shrink-0" />
                    <span>
                      <strong>Gate Security and IQC Inspection data auto-populated.</strong> Verify inward metadata and proceed to confirm store intake quantities.
                    </span>
                  </div>

                  {/* 8 Primary Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 bg-[#fafafb] p-4 sm:p-5 rounded-[20px] border border-[#ececec]">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5 font-mono">
                        GRN No.
                      </label>
                      <input
                        type="text"
                        required
                        value={grnNo}
                        onChange={e => setGrnNo(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-[16px] border border-[#ececec] bg-white font-mono font-bold text-xs text-[#17191c] focus:outline-none focus:ring-2 focus:ring-[#c09748]/20 focus:border-[#c09748] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5 font-mono">
                        GRN Date
                      </label>
                      <PaintkingDatePicker
                        value={date}
                        onChange={setDate}
                        placeholder="DD-MM-YYYY"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5 font-mono">
                        Vehicle No.
                      </label>
                      <input
                        type="text"
                        required
                        value={vehicleNo}
                        onChange={e => setVehicleNo(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-[16px] border border-[#ececec] bg-white font-mono text-xs text-[#17191c] uppercase focus:outline-none focus:ring-2 focus:ring-[#c09748]/20 focus:border-[#c09748] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5 font-mono">
                        Transporter Name
                      </label>
                      <input
                        type="text"
                        required
                        value={transportName}
                        onChange={e => setTransportName(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-[16px] border border-[#ececec] bg-white text-xs text-[#17191c] focus:outline-none focus:ring-2 focus:ring-[#c09748]/20 focus:border-[#c09748] transition"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5 font-mono">
                        Supplier / Customer Party
                      </label>
                      <input
                        type="text"
                        required
                        value={supplierCustomer}
                        onChange={e => setSupplierCustomer(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-[16px] border border-[#ececec] bg-white text-xs text-[#17191c] font-semibold focus:outline-none focus:ring-2 focus:ring-[#c09748]/20 focus:border-[#c09748] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5 font-mono">
                        Invoice / Challan No.
                      </label>
                      <input
                        type="text"
                        required
                        value={invoiceChallanNo}
                        onChange={e => setInvoiceChallanNo(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-[16px] border border-[#ececec] bg-white font-mono text-xs text-[#17191c] font-bold focus:outline-none focus:ring-2 focus:ring-[#c09748]/20 focus:border-[#c09748] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5 font-mono">
                        Challan Date
                      </label>
                      <PaintkingDatePicker
                        value={invoiceDate}
                        onChange={setInvoiceDate}
                        placeholder="DD-MM-YYYY"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#17191c] hover:bg-[#25282d] text-[#c09748] text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
                    >
                      <span>Next: Verify Material Quantities</span>
                      <ChevronRight className="w-4 h-4 text-[#c09748]" />
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 2: MATERIAL QUANTITY VERIFICATION (LISTED BY IQC TEAM)               */}
              {/* ========================================================================= */}
              {activeStep === 2 && (
                <div className="space-y-4">
                  
                  {/* Step 2 Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#ececec]">
                    <div>
                      <h3 className="font-serif text-base text-[#17191c] font-normal">
                        Materials Approved by IQC ({items.length} Items)
                      </h3>
                      <p className="text-xs text-[#777b86]">
                        Review IQC inspected quantities and confirm actual physical count received into store bins.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyAll}
                      className="px-4 py-1.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-xs font-semibold text-[#17191c] border border-[#dcdfe4] transition cursor-pointer flex items-center gap-1.5 shadow-2xs self-start sm:self-auto active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verify All ({items.length}) Items</span>
                    </button>
                  </div>

                  {/* Desktop Structured Table (Strict PaintKing Standard) */}
                  <div className="hidden md:block overflow-x-auto border border-[#ececec] rounded-[20px] p-1 bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#f2f2f3] text-[#17191c] font-semibold uppercase text-[10px] tracking-wider border-b border-[#ececec]">
                          <th className="p-3 w-10 text-center">#</th>
                          <th className="p-3 w-28">Part Code</th>
                          <th className="p-3 min-w-[200px]">Part Description</th>
                          <th className="p-3 text-center w-24">Invoiced</th>
                          <th className="p-3 text-center w-24">OK IQC</th>
                          <th className="p-3 text-center w-20">Rej. Qty</th>
                          <th className="p-3 text-center w-36">Store Received</th>
                          <th className="p-3 text-center w-24">Diff / Short</th>
                          <th className="p-3 min-w-[120px]">Remark</th>
                          <th className="p-3 text-center w-16">Verify</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ececec] bg-white text-[#17191c]">
                        {items.map((item, idx) => {
                          const isVerified = Boolean(item.id && verifiedItemIds[item.id]);
                          return (
                            <tr key={item.id} className="hover:bg-[#fafafb] transition">
                              <td className="p-3 text-center font-mono text-[#777b86] text-[11px]">{idx + 1}</td>
                              <td className="p-3 font-mono font-bold text-[#c09748]">
                                {item.partCode}
                              </td>
                              <td className="p-3 font-medium text-[#17191c]">
                                {item.partDescription}
                              </td>
                              <td className="p-3 text-center font-mono text-[#777b86]">
                                {item.invoicedQty}
                              </td>
                              <td className="p-3 text-center font-mono font-semibold text-emerald-800">
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                                  {item.okByIqcQty}
                                </span>
                              </td>
                              <td className="p-3 text-center font-mono">
                                {Number(item.rejectionQty) > 0 ? (
                                  <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-bold border border-red-200">
                                    {item.rejectionQty}
                                  </span>
                                ) : (
                                  <span className="text-[#979799]">0</span>
                                )}
                              </td>

                              {/* Editable Quantity Verification Field */}
                              <td className="p-2.5 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={item.actualReceivedQty}
                                  onChange={e => handleUpdateItemActual(item.id!, Number(e.target.value))}
                                  className="w-24 px-2 py-1.5 rounded-[12px] border border-[#dcdfe4] focus:ring-2 focus:ring-[#c09748]/20 focus:border-[#c09748] font-mono font-bold text-center text-xs text-[#17191c] bg-white shadow-2xs focus:outline-none transition"
                                />
                              </td>

                              <td className="p-3 text-center font-mono font-bold">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs inline-block ${
                                  item.shortExcessQty < 0 
                                    ? 'bg-red-50 text-red-700 border border-red-200' 
                                    : item.shortExcessQty > 0 
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}>
                                  {item.shortExcessQty > 0 ? `+${item.shortExcessQty}` : item.shortExcessQty === 0 ? '0' : item.shortExcessQty}
                                </span>
                              </td>

                              <td className="p-3 text-[#777b86] text-[11px] truncate max-w-[140px]" title={item.remark}>
                                {item.remark || 'IQC Cleared'}
                              </td>

                              {/* 1-Click Verification Toggle */}
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleVerifyItem(item.id!)}
                                  className={`w-7 h-7 rounded-full transition cursor-pointer flex items-center justify-center mx-auto ${
                                    isVerified 
                                      ? 'bg-emerald-600 text-white shadow-xs' 
                                      : 'bg-gray-100 text-gray-400 hover:text-emerald-600 border border-[#ececec]'
                                  }`}
                                  title={isVerified ? 'Quantity Verified' : 'Click to Verify'}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {/* Total Row */}
                        <tr className="bg-[#f2f2f3] font-bold text-[#17191c] border-t border-[#dcdfe4]">
                          <td colSpan={3} className="p-3 text-center uppercase tracking-wider text-[11px] text-[#777b86]">
                            Total QTY ({items.length} Items):
                          </td>
                          <td className="p-3 text-center font-mono text-xs">
                            {totalInvoicedQty}
                          </td>
                          <td className="p-3 text-center font-mono text-xs text-emerald-800">
                            {totalOkByIqcQty}
                          </td>
                          <td className="p-3 text-center font-mono text-xs text-red-600">
                            {totalRejectionQty}
                          </td>
                          <td className="p-3 text-center font-mono text-xs text-[#17191c]">
                            <span className="px-2.5 py-1 rounded-[8px] bg-white border border-[#ececec] inline-block shadow-2xs font-bold">
                              {totalActualReceivedQty} Pcs
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono text-xs">
                            {totalShortExcessQty > 0 ? `+${totalShortExcessQty}` : totalShortExcessQty === 0 ? '0' : totalShortExcessQty}
                          </td>
                          <td colSpan={2} className="p-3 text-emerald-800 text-[11px] font-medium">
                            Ready for Intake
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Item Verification Cards */}
                  <div className="block md:hidden space-y-3">
                    {items.map((item) => {
                      const isVerified = Boolean(item.id && verifiedItemIds[item.id]);
                      return (
                        <div key={item.id} className="bg-[#fafafb] p-3.5 rounded-[18px] border border-[#ececec] space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-[#c09748] px-2.5 py-0.5 rounded-full bg-[#faf7ed] border border-[#f4e5be]">
                              {item.partCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleVerifyItem(item.id!)}
                              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 cursor-pointer transition ${
                                isVerified 
                                  ? 'bg-emerald-600 text-white shadow-xs' 
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              <Check className="w-3 h-3" />
                              <span>{isVerified ? 'Verified' : 'Verify'}</span>
                            </button>
                          </div>

                          <div className="font-medium text-xs text-[#17191c]">{item.partDescription}</div>

                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="p-2 rounded-[14px] bg-white border border-[#ececec]">
                              <div className="text-[10px] text-gray-500 font-mono">Invoiced</div>
                              <div className="font-bold">{item.invoicedQty}</div>
                            </div>
                            <div className="p-2 rounded-[14px] bg-emerald-50 border border-emerald-200 text-emerald-800">
                              <div className="text-[10px] font-mono">Ok IQC</div>
                              <div className="font-bold">{item.okByIqcQty}</div>
                            </div>
                            <div className="p-2 rounded-[14px] bg-red-50 border border-red-200 text-red-700">
                              <div className="text-[10px] font-mono">Rej IQC</div>
                              <div className="font-bold">{item.rejectionQty}</div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-[#777b86] uppercase mb-1">
                              Actual Received (Store Intake Count):
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={item.actualReceivedQty}
                              onChange={e => handleUpdateItemActual(item.id!, Number(e.target.value))}
                              className="w-full h-10 px-3 rounded-[14px] border border-[#ececec] font-mono font-bold text-center text-xs text-[#17191c] bg-white focus:outline-none focus:ring-2 focus:ring-[#c09748]/20 focus:border-[#c09748]"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      className="px-5 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition active:scale-95"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Inward Overview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      className="px-6 py-2.5 rounded-full bg-[#17191c] text-[#c09748] text-xs font-bold hover:bg-[#25282d] transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                    >
                      <span>Next: Report Preview & Sign-off</span>
                      <ChevronRight className="w-4 h-4 text-[#c09748]" />
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 3: OFFICIAL REPORT PREVIEW & FINAL STORE INTAKE                      */}
              {/* ========================================================================= */}
              {activeStep === 3 && (
                <div className="space-y-4">
                  
                  {/* Step 3 Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#ececec]">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#c09748]" />
                        <h3 className="font-serif text-base text-[#17191c] font-normal">
                          Official Goods Received Note (DOC NO: 00 • Rev.00) Preview
                        </h3>
                      </div>
                      <p className="text-xs text-[#777b86]">
                        Review official documentation layout before executing store inventory ingestion.
                      </p>
                    </div>

                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                      Total Intake: {totalActualReceivedQty} Pcs
                    </span>
                  </div>

                  {/* Embedded Luxury Editorial Document Preview */}
                  <div className="p-1 sm:p-2 bg-[#fafafb] rounded-[20px] border border-[#ececec] overflow-x-auto">
                    <OfficialGRNDocument grn={previewGRN} />
                  </div>

                  {/* Official Signatures Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#fafafb] p-4 rounded-[20px] border border-[#ececec]">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5 font-mono">
                        Store Incharge :-
                      </label>
                      <input
                        type="text"
                        required
                        value={storeIncharge}
                        onChange={e => setStoreIncharge(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-[16px] border border-[#ececec] bg-white text-xs text-[#17191c] font-medium focus:outline-none focus:ring-2 focus:ring-[#c09748]/20 focus:border-[#c09748] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5 font-mono">
                        Quality Approved By :-
                      </label>
                      <input
                        type="text"
                        required
                        value={qualityApprovedBy}
                        onChange={e => setQualityApprovedBy(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-[16px] border border-[#ececec] bg-white text-xs text-emerald-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#c09748]/20 focus:border-[#c09748] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5 font-mono">
                        Approved By (Plant Head) :-
                      </label>
                      <input
                        type="text"
                        required
                        value={approvedBy}
                        onChange={e => setApprovedBy(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-[16px] border border-[#ececec] bg-white text-xs text-[#17191c] font-medium focus:outline-none focus:ring-2 focus:ring-[#c09748]/20 focus:border-[#c09748] transition"
                      />
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#ececec]">
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="px-5 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold cursor-pointer flex items-center gap-1.5 w-full sm:w-auto justify-center transition active:scale-95"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Quantity Verification</span>
                    </button>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold cursor-pointer transition active:scale-95"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-7 py-2.5 rounded-full bg-[#17191c] hover:bg-[#25282d] text-[#c09748] font-bold text-xs cursor-pointer flex items-center gap-2 shadow-sm transition active:scale-95"
                      >
                        <Save className="w-4 h-4 text-[#c09748]" />
                        <span>Receive Material & Generate GRN</span>
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </form>
          </div>
        )}

      </div>
    </div>
  );
};
