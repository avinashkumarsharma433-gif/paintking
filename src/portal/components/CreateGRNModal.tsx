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
            const rejQ = Number(it.rejectQty || 0);
            // Default store received quantity is the full inward/challan quantity minus rejections
            const actQ = invQ - rejQ;
            const okQ = actQ;

            return {
              id: itemId,
              partCode: (it.materialName || pendingJob.partComponent || 'SUBSTRATE').slice(0, 10).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'SUBSTRATE',
              partDescription: it.materialName || pendingJob.partDescription || 'Component Substrate',
              invoicedQty: invQ,
              actualReceivedQty: actQ,
              shortExcessQty: actQ - invQ,
              okByIqcQty: okQ,
              rejectionQty: rejQ,
              sampleCheckedQty: Number(it.sampleSize || it.passQty || pendingJob.aqlSampleChecked || 0),
              remark: it.defectDetail || it.notes || 'IQC Cleared'
            };
          });

          setItems(mappedItems);

          const totalQ = mappedItems.reduce((acc, curr) => acc + curr.actualReceivedQty, 0);
          setColorSplits([
            { colorName: 'Standard OEM Basecoat', colorCode: 'OEM-01', orderedQty: totalQ, unitRate: 25 }
          ]);
        } else {
          const totQ = Number(pendingJob.totalQty || pendingJob.challanQty) || 1000;
          const rejQ = pendingJob.iqcRecord ? Number(pendingJob.iqcRecord.rejectQty || 0) : 0;
          const actQ = totQ - rejQ;

          setItems([{
            id: '1',
            partCode: (pendingJob.partComponent || 'SUBSTRATE').slice(0, 10).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'SUBSTRATE',
            partDescription: pendingJob.partDescription || pendingJob.partComponent || 'Raw Substrate',
            invoicedQty: totQ,
            actualReceivedQty: actQ,
            shortExcessQty: actQ - totQ,
            okByIqcQty: actQ,
            rejectionQty: rejQ,
            sampleCheckedQty: Number(pendingJob.aqlSampleChecked || pendingJob.iqcRecord?.passQty || 0),
            remark: 'IQC Cleared'
          }]);

          setColorSplits([
            { colorName: 'Standard OEM Basecoat', colorCode: 'OEM-01', orderedQty: actQ, unitRate: 25 }
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
      <div className="bg-white rounded-[24px] max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-150 relative">
        
        {/* Top Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#fafafb] hover:bg-[#f2f2f3] text-[#777b86] hover:text-[#17191c] border border-[#ececec] flex items-center justify-center cursor-pointer transition z-10 active:scale-95"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ========================================================================= */}
        {/* VIEW 1: SUCCESS STATE (OFFICIAL GRN GENERATED & PDF READY)                 */}
        {/* ========================================================================= */}
        {createdGRN ? (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Top Celebration Strip */}
            <div className="p-4 sm:p-5 rounded-[20px] bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                  className="px-4 py-2 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-[#8a6521]" />
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
              <h2 className="text-xl sm:text-2xl font-serif text-[#17191c] font-normal tracking-tight">
                Goods Receipt Note (GRN) Inward Acceptance
              </h2>
              <p className="text-[11px] sm:text-xs text-[#777b86]">
                Review IQC cleared material, confirm physical intake count & generate official GRN into Store Inventory
              </p>
            </div>

            {/* ========================================================================= */}
            {/* PART 1: INWARD & IQC DETAILS (SLEEK 4-TILE OVERVIEW)                      */}
            {/* ========================================================================= */}
            <div className="space-y-2">
              <span className="text-[10.5px] font-semibold text-[#777b86] uppercase tracking-wider block font-mono">
                1. Inward & Quality Clearance Overview
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* Tile 1: Supplier / Party */}
                <div className="p-3 rounded-[16px] bg-[#fafafb] border border-[#ececec] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#777b86]">
                    <Building2 className="w-3.5 h-3.5 text-[#c09748]" />
                    <span className="text-[10px] font-mono uppercase font-semibold">Party / Supplier</span>
                  </div>
                  <div className="font-semibold text-xs text-[#17191c] truncate" title={supplierCustomer}>
                    {supplierCustomer}
                  </div>
                  <div className="text-[10px] text-[#777b86] font-mono">
                    Intake: {formatDateDDMMYYYY(receivedDate)}
                  </div>
                </div>

                {/* Tile 2: Challan No & Date */}
                <div className="p-3 rounded-[16px] bg-[#fafafb] border border-[#ececec] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#777b86]">
                    <FileText className="w-3.5 h-3.5 text-[#c09748]" />
                    <span className="text-[10px] font-mono uppercase font-semibold">Challan / Invoice</span>
                  </div>
                  <div className="font-mono font-bold text-xs text-[#17191c] truncate">
                    {invoiceChallanNo}
                  </div>
                  <div className="text-[10px] text-[#777b86]">
                    Date: {formatDateDDMMYYYY(invoiceDate)}
                  </div>
                </div>

                {/* Tile 3: Vehicle & Transporter */}
                <div className="p-3 rounded-[16px] bg-[#fafafb] border border-[#ececec] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#777b86]">
                    <Truck className="w-3.5 h-3.5 text-[#c09748]" />
                    <span className="text-[10px] font-mono uppercase font-semibold">Logistics</span>
                  </div>
                  <div className="font-mono text-xs font-semibold text-[#17191c] uppercase truncate">
                    {vehicleNo}
                  </div>
                  <div className="text-[10px] text-[#777b86] truncate">
                    {transportName}
                  </div>
                </div>

                {/* Tile 4: Auto GRN & IQC Clearance */}
                <div className="p-3 rounded-[16px] bg-[#faf7ed] border border-[#f4e5be] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#8a6521]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[10px] font-mono uppercase font-bold">GRN Ref (Auto)</span>
                  </div>
                  <div className="font-mono font-bold text-xs text-[#8a6521] truncate">
                    {grnNo}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium">
                    100% Quality Approved
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
                  IQC Passed count pre-filled. Adjust if any discrepancy.
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={item.id || idx} className="p-4 rounded-[18px] bg-[#fafafb] border border-[#ececec] space-y-3.5 shadow-2xs hover:border-[#dcdfe4] transition">
                    {/* Header Row: Part Code + Description + Status Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#ececec]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-xs font-bold text-[#8a6521] px-2.5 py-1 rounded-full bg-[#faf3e0] border border-[#f4e5be] shrink-0">
                          {item.partCode}
                        </span>
                        <div className="font-semibold text-xs sm:text-sm text-[#17191c] truncate" title={item.partDescription}>
                          {item.partDescription}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-full bg-white border border-[#ececec] text-[11px] font-mono text-[#777b86]">
                          Challan: <strong className="text-[#17191c]">{Number(item.invoicedQty).toLocaleString('en-IN')}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-mono font-semibold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>IQC Approved: {Number(item.okByIqcQty).toLocaleString('en-IN')}</span>
                        </span>
                        {item.sampleCheckedQty ? (
                          <span className="px-2 py-1 rounded-full bg-[#f2f2f3] text-[10.5px] font-mono text-[#777b86]">
                            {item.sampleCheckedQty} Sampled
                          </span>
                        ) : null}
                        {Number(item.rejectionQty) > 0 && (
                          <span className="px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-[11px] font-mono font-bold text-red-700">
                            Rej: {item.rejectionQty}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body Row: 2-Column Responsive Input Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-0.5">
                      {/* Col 1: Actually Received Qty (Store Intake) */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider font-mono">
                          Actually Received Qty (Store Intake)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            required
                            value={item.actualReceivedQty}
                            onChange={e => handleUpdateItemActual(item.id!, Number(e.target.value))}
                            className="w-full sm:w-36 h-10 px-3.5 rounded-[12px] border border-[#dcdfe4] font-mono font-bold text-xs sm:text-sm text-[#17191c] bg-white focus:outline-none focus:ring-2 focus:ring-[#c09748]/20 focus:border-[#c09748] transition shadow-2xs"
                          />
                          <span className={`px-3 py-2 rounded-[12px] text-xs font-mono font-bold shrink-0 flex items-center gap-1 ${
                            item.shortExcessQty < 0 
                              ? 'bg-red-50 text-red-700 border border-red-200' 
                              : item.shortExcessQty > 0 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {item.shortExcessQty > 0 ? `+${item.shortExcessQty} Excess` : item.shortExcessQty === 0 ? '✓ Match (0)' : `${item.shortExcessQty} Short`}
                          </span>
                        </div>
                      </div>

                      {/* Col 2: Store Bay / Rack Bin Placement */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider font-mono">
                          Store Bay / Rack Bin Placement
                        </label>
                        <input
                          type="text"
                          value={storeBayLocation}
                          onChange={e => setStoreBayLocation(e.target.value)}
                          placeholder="e.g. Bay A-1 / Rack 4"
                          className="w-full h-10 px-3.5 rounded-[12px] border border-[#dcdfe4] text-xs text-[#17191c] font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#c09748]/20 focus:border-[#c09748] transition shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* PART 3: ACCEPTANCE & REPORT GENERATION ACTION BAR (NO BLACK BUTTONS)       */}
            {/* ========================================================================= */}
            <div className="pt-3 border-t border-[#ececec] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs text-[#777b86]">Total Intake Quantity:</span>
                <span className="font-mono font-bold text-xs text-[#8a6521] px-3 py-1 bg-[#faf3e0] rounded-full border border-[#f4e5be]">
                  {totalActualReceivedQty} Pcs
                </span>
              </div>

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
                  className="px-6 py-2.5 rounded-full bg-[#faf3e0] hover:bg-[#f4e5be] text-[#8a6521] border border-[#f4e5be] font-bold text-xs cursor-pointer flex items-center gap-2 shadow-2xs transition active:scale-95"
                >
                  <Save className="w-4 h-4 text-[#8a6521]" />
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
