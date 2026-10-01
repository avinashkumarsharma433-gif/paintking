import React, { useState, useEffect } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { GoodsReceiptNote, GRNLineItem, OrderColorSplit } from '../types/portalTypes';
import { 
  CheckCircle2, 
  Truck, 
  Package, 
  ShieldCheck, 
  Download, 
  Printer, 
  Save, 
  Sparkles, 
  Check, 
  X,
  FileText,
  BadgeCheck,
  Building2,
  Calendar,
  Layers,
  MapPin
} from 'lucide-react';
import { OfficialGRNDocument } from './OfficialGRNDocument';
import { downloadStandardGRNPdf, formatDateDDMMYYYY } from '../utils/pdfStandardHeader';
import { PaintkingDatePicker } from './PaintkingDatePicker';

interface CreateGRNModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingJob?: any | null;
}

export const CreateGRNModal: React.FC<CreateGRNModalProps> = ({ isOpen, onClose, pendingJob }) => {
  const { addGRN, activePlant, currentUser, materialInwardLogs } = usePortalStore();

  const latestGateInward = materialInwardLogs[0];

  // Success state after receiving material into store
  const [createdGRN, setCreatedGRN] = useState<GoodsReceiptNote | null>(null);

  // 1. Inward & Party Metadata (Pre-filled from Gate & IQC)
  const [grnNo, setGrnNo] = useState<string>(`PK-GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [receivedDate, setReceivedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [vehicleNo, setVehicleNo] = useState<string>('UK-08-AL-4412');
  const [supplierCustomer, setSupplierCustomer] = useState<string>('ROOP POLYMERS LTD');
  const [invoiceChallanNo, setInvoiceChallanNo] = useState<string>('RP/CH/99824');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [transportName, setTransportName] = useState<string>('VRL LOGISTICS');
  const [iqcReportNo, setIqcReportNo] = useState<string>('IQC-2026-001');

  // 2. Official Signatures & Storage Location
  const [storeIncharge, setStoreIncharge] = useState<string>(currentUser?.name || 'Manoj Tiwari (Stores)');
  const [qualityApprovedBy, setQualityApprovedBy] = useState<string>('Amit Verma (QA Lead)');
  const [approvedBy, setApprovedBy] = useState<string>('Satish Sharma (Plant Head)');
  const [storeBayLocation, setStoreBayLocation] = useState<string>('Bay A-1 (Substrates Rack)');
  const [remarks, setRemarks] = useState<string>('Physical box count & IQC quality clearance verified.');

  // Customer Color Splits for Job Cards
  const [colorSplits, setColorSplits] = useState<OrderColorSplit[]>([
    { colorName: 'Standard OEM Basecoat', colorCode: 'OEM-01', orderedQty: 1000, unitRate: 25 }
  ]);

  // Line Items with editable Actual Received Qty
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
      remark: 'IQC Cleared'
    }
  ]);

  // Auto populate all fields from the pending IQC lot when opened
  useEffect(() => {
    if (isOpen) {
      setCreatedGRN(null);

      const genGrnNo = `PK-GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setGrnNo(genGrnNo);
      setReceivedDate(new Date().toISOString().split('T')[0]);

      if (pendingJob) {
        setSupplierCustomer(pendingJob.vendorCustomer || pendingJob.partyName || 'ROOP POLYMERS LTD');
        setInvoiceChallanNo(pendingJob.invoiceChallanNo || pendingJob.challanNo || 'CH-001');
        setVehicleNo(pendingJob.vehicleNo || 'UK-08-AL-4412');
        setTransportName(pendingJob.transporter || 'VRL LOGISTICS');
        setInvoiceDate(pendingJob.invoiceChallanDate || pendingJob.challanDate || new Date().toISOString().split('T')[0]);
        setIqcReportNo(pendingJob.reportNo || pendingJob.iqcReportNo || 'IQC-OK');
        setRemarks(`IQC Cleared (Report: ${pendingJob.reportNo || pendingJob.iqcReportNo || 'IQC-OK'}). Received into store.`);
        setQualityApprovedBy(pendingJob.preparedBy || pendingJob.iqcRecord?.inspector || 'Amit Verma (QA Lead)');
        setApprovedBy(pendingJob.verifiedBy || pendingJob.iqcRecord?.verifiedBy || 'Satish Sharma (Plant Head)');

        if (pendingJob.items && pendingJob.items.length > 0) {
          const mappedItems: GRNLineItem[] = pendingJob.items.map((it: any, i: number) => {
            const itemId = it.id || String(i + 1);
            const invQ = Number(it.challanQty || it.quantity || pendingJob.totalQty || 1000);
            const okQ = Number(it.passQty !== undefined ? it.passQty : (it.actualQty || it.quantity || pendingJob.totalQty || 1000));
            const rejQ = Number(it.rejectQty || 0);
            const actQ = okQ; // Default actual store received to IQC approved quantity

            return {
              id: itemId,
              partCode: (it.materialName || pendingJob.partComponent || 'SUBSTRATE').slice(0, 10).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'SUBSTRATE',
              partDescription: it.materialName || pendingJob.partDescription || 'Component Substrate',
              invoicedQty: invQ,
              actualReceivedQty: actQ,
              shortExcessQty: actQ - invQ,
              okByIqcQty: okQ,
              rejectionQty: rejQ,
              remark: it.defectDetail || it.notes || 'IQC Cleared'
            };
          });

          setItems(mappedItems);

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
            remark: 'IQC Cleared'
          }]);

          setColorSplits([
            { colorName: 'Standard OEM Basecoat', colorCode: 'OEM-01', orderedQty: okQ, unitRate: 25 }
          ]);
        }
      } else {
        setSupplierCustomer(latestGateInward?.partyName || 'ROOP POLYMERS LTD');
        setInvoiceChallanNo(latestGateInward?.challanNo || 'RP/CH/99824');
        setVehicleNo(latestGateInward?.vehicleNo || 'UK-08-AL-4412');
      }
    }
  }, [isOpen, pendingJob, latestGateInward, currentUser]);

  if (!isOpen) return null;

  // Total calculations
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

  // Preview object matching GoodsReceiptNote
  const previewGRN: GoodsReceiptNote = {
    docNo: 'Doc No:00',
    revNo: '00',
    revDate: new Date().toISOString().split('T')[0],
    grnNo,
    date: receivedDate,
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
    remarks: `${remarks} [Location: ${storeBayLocation}] (Linked IQC: ${iqcReportNo})`,
    sourceIqcReportNo: iqcReportNo,
    colorSplits,
    partCode: items[0]?.partCode || 'SUBSTRATE',
    description: items[0]?.partDescription || 'Raw Parts',
    invoicedQty: totalInvoicedQty,
    actualReceivedQty: totalActualReceivedQty
  };

  const handleAcceptAndGenerateGRN = (e: React.FormEvent) => {
    e.preventDefault();

    addGRN(previewGRN);
    setCreatedGRN(previewGRN);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-[20px] max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-150 relative">
        
        {/* Top Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#fafafb] hover:bg-[#f2f2f3] text-[#777b86] hover:text-[#17191c] border border-[#ececec] flex items-center justify-center cursor-pointer transition z-10"
          title="Close"
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* ========================================================================= */}
        {/* VIEW 1: SUCCESS STATE (OFFICIAL GRN GENERATED & PDF READY)                 */}
        {/* ========================================================================= */}
        {createdGRN ? (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Top Celebration Strip */}
            <div className="p-4 sm:p-5 rounded-[16px] bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-emerald-950">
                    Material Received & GRN Generated!
                  </h3>
                  <p className="text-[11px] sm:text-xs text-emerald-800">
                    Official Goods Receipt Note (<strong>{createdGRN.grnNo}</strong>) has been generated and stock added to inventory.
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
            <div className="p-1 sm:p-2 bg-[#fafafb] rounded-[16px] border border-[#ececec] overflow-x-auto">
              <OfficialGRNDocument grn={createdGRN} />
            </div>

            {/* Action to Close / Return */}
            <div className="flex justify-end pt-2 border-t border-[#ececec]">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] font-semibold text-xs transition cursor-pointer shadow-2xs active:scale-95"
              >
                Done (Return to Stores Dashboard)
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: CLEAN 2-PART MATERIAL ACCEPTANCE & GRN SLIP                        */
          /* ========================================================================= */
          <form onSubmit={handleAcceptAndGenerateGRN} className="space-y-4">
            
            {/* Modal Header */}
            <div className="space-y-1 pb-2 border-b border-[#ececec] pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-mono font-bold">
                  DOC NO: 00 • Rev.00
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Auto-Filled from IQC
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                  IQC Ref: {iqcReportNo}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-serif text-[#17191c] font-normal tracking-tight">
                Goods Receipt Note (GRN) Inward Acceptance
              </h2>
              <p className="text-[11px] sm:text-xs text-[#777b86]">
                Review IQC cleared material, confirm physical intake count & generate official GRN into Store Inventory
              </p>
            </div>

            {/* ========================================================================= */}
            {/* PART 1: INWARD & IQC DETAILS (CLEAN READ-ONLY OVERVIEW)                   */}
            {/* ========================================================================= */}
            <div className="space-y-2">
              <span className="text-[10.5px] font-semibold text-[#777b86] uppercase tracking-wider block font-mono">
                1. Inward & Quality Clearance Overview
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* Supplier / Party */}
                <div className="p-3 rounded-[12px] bg-[#fafafb] border border-[#ececec] space-y-0.5 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-[#777b86] block font-mono uppercase">Supplier / Party</span>
                  <div className="font-semibold text-xs text-[#17191c] truncate" title={supplierCustomer}>
                    {supplierCustomer}
                  </div>
                </div>

                {/* Challan No & Date */}
                <div className="p-3 rounded-[12px] bg-[#fafafb] border border-[#ececec] space-y-0.5">
                  <span className="text-[10px] text-[#777b86] block font-mono uppercase">Challan / Invoice</span>
                  <div className="font-mono font-bold text-xs text-[#17191c] truncate">
                    {invoiceChallanNo}
                  </div>
                  <div className="text-[10px] text-[#777b86]">
                    Date: {formatDateDDMMYYYY(invoiceDate)}
                  </div>
                </div>

                {/* Vehicle & Transporter */}
                <div className="p-3 rounded-[12px] bg-[#fafafb] border border-[#ececec] space-y-0.5">
                  <span className="text-[10px] text-[#777b86] block font-mono uppercase">Vehicle & Transporter</span>
                  <div className="font-mono text-xs font-semibold text-[#17191c] uppercase">
                    {vehicleNo}
                  </div>
                  <div className="text-[10px] text-[#777b86] truncate">
                    {transportName}
                  </div>
                </div>

                {/* Auto GRN Number */}
                <div className="p-3 rounded-[12px] bg-[#faf7ed] border border-[#f4e5be] space-y-0.5">
                  <span className="text-[10px] text-[#8a6521] block font-mono uppercase font-semibold">GRN No. (Auto)</span>
                  <div className="font-mono font-bold text-xs text-[#8a6521]">
                    {grnNo}
                  </div>
                </div>

                {/* IQC Clearance Record */}
                <div className="p-3 rounded-[12px] bg-emerald-50/60 border border-emerald-200 space-y-0.5">
                  <span className="text-[10px] text-emerald-800 block font-mono uppercase font-semibold">IQC Clearance</span>
                  <div className="font-semibold text-xs text-emerald-900 truncate">
                    {qualityApprovedBy}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium">
                    100% Quality Approved
                  </div>
                </div>

                {/* Store Received Date */}
                <div className="p-3 rounded-[12px] bg-[#fafafb] border border-[#ececec] space-y-0.5">
                  <span className="text-[10px] text-[#777b86] block font-mono uppercase">Intake Date</span>
                  <div className="font-mono text-xs font-semibold text-[#17191c]">
                    {formatDateDDMMYYYY(receivedDate)}
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* PART 2: MATERIAL & ACTUALLY RECEIVED QUANTITY ENTER OPTION                */}
            {/* ========================================================================= */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold text-[#777b86] uppercase tracking-wider font-mono">
                  2. Material & Actually Received Quantity ({items.length} Items)
                </span>
                <span className="text-[11px] text-[#777b86]">
                  IQC Passed Quantity pre-filled below. Adjust if any physical discrepancy.
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-2.5">
                {items.map((item, idx) => (
                  <div key={item.id || idx} className="p-3.5 rounded-[14px] bg-[#fafafb] border border-[#ececec] space-y-2.5">
                    {/* Item Description Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#c09748] px-2 py-0.5 rounded-full bg-[#faf7ed] border border-[#f4e5be]">
                          {item.partCode}
                        </span>
                        <span className="font-semibold text-xs text-[#17191c]">
                          {item.partDescription}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-[10.5px] text-[#777b86]">Invoiced: <strong>{item.invoicedQty}</strong></span>
                        <span className="text-[10.5px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          OK IQC: <strong>{item.okByIqcQty}</strong>
                        </span>
                        {Number(item.rejectionQty) > 0 && (
                          <span className="text-[10.5px] text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                            Rej: <strong>{item.rejectionQty}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actually Received Editable Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[#f0f0f2] items-center">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-[#17191c] whitespace-nowrap">
                          Actually Received Qty:
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={item.actualReceivedQty}
                          onChange={e => handleUpdateItemActual(item.id!, Number(e.target.value))}
                          className="w-28 h-9 px-3 rounded-[10px] border border-[#dcdfe4] font-mono font-bold text-center text-xs text-[#17191c] bg-white focus:outline-none focus:border-[#17191c]"
                        />
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                          item.shortExcessQty < 0 
                            ? 'bg-red-50 text-red-700 border border-red-200' 
                            : item.shortExcessQty > 0 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {item.shortExcessQty > 0 ? `+${item.shortExcessQty} (Excess)` : item.shortExcessQty === 0 ? '✓ Match' : `${item.shortExcessQty} (Short)`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 sm:justify-end">
                        <label className="text-xs font-medium text-[#777b86] whitespace-nowrap">
                          Store Bay / Bin:
                        </label>
                        <input
                          type="text"
                          value={storeBayLocation}
                          onChange={e => setStoreBayLocation(e.target.value)}
                          placeholder="e.g. Bay A-1 / Rack 4"
                          className="w-full sm:w-44 h-9 px-2.5 rounded-[10px] border border-[#e5e7eb] text-xs text-[#17191c] bg-white focus:outline-none focus:border-[#17191c]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* PART 3: ACCEPTANCE & REPORT GENERATION ACTION BAR                         */}
            {/* ========================================================================= */}
            <div className="pt-2 border-t border-[#ececec] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs text-[#777b86]">Total Ingestion:</span>
                <span className="font-mono font-bold text-sm text-[#17191c] px-2.5 py-0.5 bg-[#fafafb] rounded-full border border-[#ececec]">
                  {totalActualReceivedQty} Pcs
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full border border-[#dcdfe4] text-xs font-semibold text-[#777b86] hover:bg-gray-50 cursor-pointer transition active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#17191c] hover:bg-[#25282d] text-[#c09748] font-bold text-xs cursor-pointer flex items-center gap-2 shadow-xs transition active:scale-95"
                >
                  <Save className="w-4 h-4 text-[#c09748]" />
                  <span>Accept Material & Generate Official GRN</span>
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
