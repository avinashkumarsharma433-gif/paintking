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
  AlertCircle,
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
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-[18px] sm:rounded-[20px] max-w-2xl w-full p-4 sm:p-7 md:p-8 shadow-2xl border border-[#ececec] flex flex-col justify-between max-h-[92vh] sm:max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-150 relative">
        
        {/* Top Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#fafafb] hover:bg-[#f2f2f3] text-[#777b86] hover:text-[#17191c] border border-[#ececec] flex items-center justify-center cursor-pointer transition z-10"
          title="Close Form"
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* ========================================================================= */}
        {/* VIEW 1: SUCCESS STATE (MATERIAL IN STORE INVENTORY & OFFICIAL GRN)         */}
        {/* ========================================================================= */}
        {createdGRN ? (
          <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
            {/* Top Celebration Strip */}
            <div className="p-4 sm:p-5 rounded-[16px] bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-emerald-950">
                    Material Received Successfully into Store!
                  </h3>
                  <p className="text-[11px] sm:text-xs text-emerald-800">
                    Official Goods Receipt Note ({createdGRN.grnNo}) has been generated and stock added to inventory.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => downloadStandardGRNPdf(createdGRN)}
                  className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-[#17191c]" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-900 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print GRN</span>
                </button>
              </div>
            </div>

            {/* Render Official GRN Document */}
            <div className="p-1 sm:p-2 bg-[#fafafb] rounded-[16px] border border-[#ececec] overflow-x-auto">
              <OfficialGRNDocument grn={createdGRN} />
            </div>

            {/* Action to Close / Return */}
            <div className="flex justify-end pt-2 border-t border-[#ececec]">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] font-semibold text-xs transition cursor-pointer shadow-2xs active:scale-95"
              >
                Done (Return to Stores Dashboard)
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: 3-STEP GUIDED STORE INTAKE WIZARD (Strict Gate/IQC Inspired)      */
          /* ========================================================================= */
          <div className="space-y-4 sm:space-y-5">
            {/* Form Title & Guided Subtitle */}
            <div className="text-center space-y-1 pb-2 sm:pb-3 pr-6 sm:pr-0">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-mono font-bold">
                  DOC NO: 00 • Rev.00
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Auto-Filled from IQC
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-[#17191c] tracking-tight">
                Material Acceptance & GRN Creation
              </h2>
              <p className="text-[11px] sm:text-xs text-[#777b86]">
                Accept IQC approved material into Store inventory & generate official GRN
              </p>
            </div>

            {/* Step Stepper Indicator (Plain & Simple Connected Pills) */}
            <div className="flex items-center justify-center gap-1 sm:gap-2.5 py-1.5 border-b border-[#f0f0f2] mb-3 sm:mb-4 overflow-x-auto no-scrollbar">
              {/* Step 1 Pill */}
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 sm:gap-2 border shrink-0 ${
                  activeStep === 1
                    ? 'border-[#17191c] text-[#17191c] bg-[#fafafb] shadow-2xs'
                    : 'border-[#e5e7eb] text-[#777b86] hover:border-gray-400'
                }`}
              >
                <span className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full text-[9px] sm:text-[10px] font-bold flex items-center justify-center ${
                  activeStep === 1 ? 'bg-[#17191c] text-white' : 'bg-gray-200 text-[#777b86]'
                }`}>
                  1
                </span>
                <span>Inward Info</span>
              </button>

              <div className="w-3 sm:w-6 h-px bg-[#e5e7eb] shrink-0" />

              {/* Step 2 Pill */}
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 sm:gap-2 border shrink-0 ${
                  activeStep === 2
                    ? 'border-[#17191c] text-[#17191c] bg-[#fafafb] shadow-2xs'
                    : 'border-[#e5e7eb] text-[#777b86] hover:border-gray-400'
                }`}
              >
                <span className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full text-[9px] sm:text-[10px] font-bold flex items-center justify-center ${
                  activeStep === 2 ? 'bg-[#17191c] text-white' : 'bg-gray-200 text-[#777b86]'
                }`}>
                  2
                </span>
                <span>Materials ({items.length})</span>
              </button>

              <div className="w-3 sm:w-6 h-px bg-[#e5e7eb] shrink-0" />

              {/* Step 3 Pill */}
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 sm:gap-2 border shrink-0 ${
                  activeStep === 3
                    ? 'border-[#17191c] text-[#17191c] bg-[#fafafb] shadow-2xs'
                    : 'border-[#e5e7eb] text-[#777b86] hover:border-gray-400'
                }`}
              >
                <span className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full text-[9px] sm:text-[10px] font-bold flex items-center justify-center ${
                  activeStep === 3 ? 'bg-[#17191c] text-white' : 'bg-gray-200 text-[#777b86]'
                }`}>
                  3
                </span>
                <span>Sign-Off & Accept</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

              {/* ========================================================================= */}
              {/* STEP 1: INWARD & LOGISTICS OVERVIEW (Clean Guided Process)                 */}
              {/* ========================================================================= */}
              {activeStep === 1 && (
                <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-100">
                  {/* Step Header */}
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-medium text-[#777b86] block">Step 1</span>
                    <h3 className="text-xs sm:text-sm font-bold text-[#17191c]">Inward & Logistics Overview</h3>
                  </div>

                  {/* Clean 2-Column Responsive Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                    {/* Supplier / Party Name */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-xs font-semibold text-[#17191c]">
                        Supplier / Customer Party <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={supplierCustomer}
                        onChange={e => setSupplierCustomer(e.target.value)}
                        placeholder="e.g. ROOP POLYMERS LTD"
                        className="w-full h-10 px-3 rounded-[10px] sm:rounded-[12px] border border-[#e5e7eb] bg-white text-xs sm:text-sm font-semibold text-[#17191c] focus:outline-none focus:border-[#17191c] transition"
                      />
                    </div>

                    {/* GRN Number */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#17191c]">
                        GRN No. <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={grnNo}
                        onChange={e => setGrnNo(e.target.value)}
                        className="w-full h-10 px-3 rounded-[10px] sm:rounded-[12px] border border-[#e5e7eb] bg-[#fafafb] font-mono font-bold text-xs sm:text-sm text-[#17191c] focus:outline-none focus:border-[#17191c] transition"
                      />
                    </div>

                    {/* GRN Date */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#17191c]">
                        GRN Date <span className="text-red-500">*</span>
                      </label>
                      <PaintkingDatePicker
                        value={date}
                        onChange={setDate}
                        placeholder="DD-MM-YYYY"
                      />
                    </div>

                    {/* Challan No */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#17191c]">
                        Challan / Invoice No. <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={invoiceChallanNo}
                        onChange={e => setInvoiceChallanNo(e.target.value)}
                        placeholder="e.g. RP/CH/99824"
                        className="w-full h-10 px-3 rounded-[10px] sm:rounded-[12px] border border-[#e5e7eb] bg-white font-mono text-xs sm:text-sm font-bold text-[#17191c] focus:outline-none focus:border-[#17191c] transition"
                      />
                    </div>

                    {/* Challan Date */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#17191c]">
                        Challan Date <span className="text-red-500">*</span>
                      </label>
                      <PaintkingDatePicker
                        value={invoiceDate}
                        onChange={setInvoiceDate}
                        placeholder="DD-MM-YYYY"
                      />
                    </div>

                    {/* Vehicle No */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#17191c]">
                        Vehicle No. <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={vehicleNo}
                        onChange={e => setVehicleNo(e.target.value)}
                        placeholder="e.g. UK-08-AL-4412"
                        className="w-full h-10 px-3 rounded-[10px] sm:rounded-[12px] border border-[#e5e7eb] bg-white font-mono uppercase text-xs sm:text-sm text-[#17191c] focus:outline-none focus:border-[#17191c] transition"
                      />
                    </div>

                    {/* Transporter */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#17191c]">
                        Transporter Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={transportName}
                        onChange={e => setTransportName(e.target.value)}
                        placeholder="e.g. VRL LOGISTICS"
                        className="w-full h-10 px-3 rounded-[10px] sm:rounded-[12px] border border-[#e5e7eb] bg-white text-xs sm:text-sm text-[#17191c] focus:outline-none focus:border-[#17191c] transition"
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-[#ececec]">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[#dcdfe4] text-xs font-medium text-[#777b86] hover:bg-gray-50 cursor-pointer transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="flex items-center gap-1.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[#17191c] text-[#c09748] text-xs font-bold hover:bg-black transition cursor-pointer shadow-xs active:scale-95"
                    >
                      <span>Next: Verify Material Quantities</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#c09748]" />
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 2: MATERIAL QUANTITIES VERIFICATION                                  */}
              {/* ========================================================================= */}
              {activeStep === 2 && (
                <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-100">
                  {/* Step Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] sm:text-[11px] font-medium text-[#777b86] block">Step 2</span>
                      <h3 className="text-xs sm:text-sm font-bold text-[#17191c]">
                        Material Quantities Verification ({items.length} Items)
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyAll}
                      className="px-3 py-1 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[11px] font-semibold text-[#17191c] border border-[#dcdfe4] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Verify All</span>
                    </button>
                  </div>

                  {/* Items Verification List */}
                  <div className="space-y-3">
                    {items.map((item, idx) => {
                      const isVerified = Boolean(item.id && verifiedItemIds[item.id]);
                      return (
                        <div key={item.id || idx} className="p-3.5 sm:p-4 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#c09748] px-2 py-0.5 rounded-full bg-[#faf7ed] border border-[#f4e5be]">
                                  {item.partCode}
                                </span>
                                <span className="font-semibold text-xs text-[#17191c]">
                                  {item.partDescription}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleVerifyItem(item.id!)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                                isVerified 
                                  ? 'bg-emerald-600 text-white shadow-xs' 
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              <Check className="w-3 h-3" />
                              <span>{isVerified ? 'Verified' : 'Verify'}</span>
                            </button>
                          </div>

                          {/* 3-Column Stats Grid */}
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="p-2 rounded-[10px] bg-white border border-[#ececec]">
                              <div className="text-[10px] text-[#777b86] font-mono">Invoiced Qty</div>
                              <div className="font-bold text-[#17191c]">{item.invoicedQty}</div>
                            </div>
                            <div className="p-2 rounded-[10px] bg-emerald-50 border border-emerald-200 text-emerald-800">
                              <div className="text-[10px] font-mono">OK by IQC</div>
                              <div className="font-bold">{item.okByIqcQty}</div>
                            </div>
                            <div className="p-2 rounded-[10px] bg-red-50 border border-red-200 text-red-700">
                              <div className="text-[10px] font-mono">Rej. IQC</div>
                              <div className="font-bold">{item.rejectionQty}</div>
                            </div>
                          </div>

                          {/* Editable Store Intake Input */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-[#f0f0f2]">
                            <label className="text-xs font-semibold text-[#17191c]">
                              Actual Received into Store:
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={item.actualReceivedQty}
                                onChange={e => handleUpdateItemActual(item.id!, Number(e.target.value))}
                                className="w-28 h-9 px-3 rounded-[10px] border border-[#dcdfe4] font-mono font-bold text-center text-xs text-[#17191c] bg-white focus:outline-none focus:border-[#17191c]"
                              />
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold ${
                                item.shortExcessQty < 0 
                                  ? 'bg-red-50 text-red-700 border border-red-200' 
                                  : item.shortExcessQty > 0 
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}>
                                {item.shortExcessQty > 0 ? `+${item.shortExcessQty}` : item.shortExcessQty === 0 ? 'Match' : item.shortExcessQty}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Bar */}
                  <div className="p-3 rounded-[12px] bg-[#fafafb] border border-[#ececec] flex items-center justify-between text-xs font-medium">
                    <span className="text-[#777b86]">Total Store Ingestion:</span>
                    <span className="font-mono font-bold text-[#17191c] text-sm">
                      {totalActualReceivedQty} Pcs
                    </span>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-[#ececec]">
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[#dcdfe4] text-xs font-medium text-[#777b86] hover:bg-gray-50 cursor-pointer flex items-center gap-1.5 transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Inward Info</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      className="flex items-center gap-1.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[#17191c] text-[#c09748] text-xs font-bold hover:bg-black transition cursor-pointer shadow-xs active:scale-95"
                    >
                      <span>Next: Sign-Off & Accept</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#c09748]" />
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 3: AUTHORIZATION, SIGN-OFF & ACCEPTANCE                              */}
              {/* ========================================================================= */}
              {activeStep === 3 && (
                <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-100">
                  {/* Step Header */}
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-medium text-[#777b86] block">Step 3</span>
                    <h3 className="text-xs sm:text-sm font-bold text-[#17191c]">Authorization, Sign-Off & Acceptance</h3>
                  </div>

                  {/* Summary Box */}
                  <div className="p-3.5 sm:p-4 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#777b86]">Party / Supplier:</span>
                      <span className="font-semibold text-[#17191c]">{supplierCustomer}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#777b86]">Challan Reference:</span>
                      <span className="font-mono font-bold text-[#17191c]">{invoiceChallanNo}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#777b86]">Total Accepted Quantity:</span>
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {totalActualReceivedQty} Pcs
                      </span>
                    </div>
                  </div>

                  {/* 3 Signatures Fields */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#17191c]">
                        Store Incharge :- <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={storeIncharge}
                        onChange={e => setStoreIncharge(e.target.value)}
                        className="w-full h-10 px-3 rounded-[10px] sm:rounded-[12px] border border-[#e5e7eb] bg-white text-xs sm:text-sm text-[#17191c] focus:outline-none focus:border-[#17191c] transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#17191c]">
                        Quality Approved By :- <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={qualityApprovedBy}
                        onChange={e => setQualityApprovedBy(e.target.value)}
                        className="w-full h-10 px-3 rounded-[10px] sm:rounded-[12px] border border-[#e5e7eb] bg-white text-xs sm:text-sm text-emerald-900 font-medium focus:outline-none focus:border-[#17191c] transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#17191c]">
                        Approved By (Plant Head) :- <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={approvedBy}
                        onChange={e => setApprovedBy(e.target.value)}
                        className="w-full h-10 px-3 rounded-[10px] sm:rounded-[12px] border border-[#e5e7eb] bg-white text-xs sm:text-sm text-[#17191c] focus:outline-none focus:border-[#17191c] transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#17191c]">
                        Remarks & Intake Notes
                      </label>
                      <input
                        type="text"
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                        placeholder="e.g. Physical count verified & stored in Bay A-1"
                        className="w-full h-10 px-3 rounded-[10px] sm:rounded-[12px] border border-[#e5e7eb] bg-white text-xs sm:text-sm text-[#17191c] focus:outline-none focus:border-[#17191c] transition"
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-[#ececec]">
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[#dcdfe4] text-xs font-medium text-[#777b86] hover:bg-gray-50 cursor-pointer flex items-center gap-1.5 transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Quantity Verification</span>
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#17191c] text-[#c09748] text-xs font-bold hover:bg-black transition cursor-pointer shadow-xs active:scale-95"
                    >
                      <Save className="w-3.5 h-3.5 text-[#c09748]" />
                      <span>Accept Material & Generate GRN</span>
                    </button>
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
