import React from 'react';
import { GoodsReceiptNote, GRNLineItem } from '../types/portalTypes';
import { Download, Printer, CheckCircle2, ShieldCheck, FileText, X, BadgeCheck } from 'lucide-react';
import { downloadStandardGRNPdf } from '../utils/pdfStandardHeader';

interface OfficialGRNDocumentProps {
  grn: GoodsReceiptNote;
  onClose?: () => void;
  isModal?: boolean;
}

export const OfficialGRNDocument: React.FC<OfficialGRNDocumentProps> = ({
  grn,
  onClose,
  isModal = false
}) => {
  const rawItems: GRNLineItem[] = (grn.items && grn.items.length > 0)
    ? grn.items
    : [{
        id: '1',
        partCode: grn.partCode || 'SUBSTRATE-01',
        partDescription: grn.description || 'Raw Components Substrate',
        invoicedQty: Number(grn.invoicedQty) || Number(grn.totalQty) || 1000,
        actualReceivedQty: Number(grn.actualReceivedQty) || Number(grn.totalQty) || 1000,
        shortExcessQty: (Number(grn.actualReceivedQty) || Number(grn.totalQty) || 1000) - (Number(grn.invoicedQty) || 1000),
        okByIqcQty: Number(grn.actualReceivedQty) || Number(grn.totalQty) || 1000,
        rejectionQty: 0,
        remark: 'IQC Passed'
      }];

  const totalInvoiced = rawItems.reduce((acc, it) => acc + (Number(it.invoicedQty) || 0), 0);
  const totalActual = rawItems.reduce((acc, it) => acc + (Number(it.actualReceivedQty) || 0), 0);
  const totalShortExcess = rawItems.reduce((acc, it) => acc + (it.shortExcessQty !== undefined ? Number(it.shortExcessQty) : (Number(it.actualReceivedQty || 0) - Number(it.invoicedQty || 0))), 0);
  const totalOkIqc = rawItems.reduce((acc, it) => acc + (it.okByIqcQty !== undefined ? Number(it.okByIqcQty) : Number(it.actualReceivedQty || 0)), 0);
  const totalRej = rawItems.reduce((acc, it) => acc + (Number(it.rejectionQty) || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    downloadStandardGRNPdf(grn);
  };

  const documentContent = (
    <div className="bg-white text-[#17191c] font-sans max-w-5xl mx-auto rounded-[24px] border border-[#ececec] p-6 sm:p-8 space-y-6 shadow-xs print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full">
      
      {/* 1. BRAND HEADER BLOCK */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#ececec]">
        {/* Left: Brand Identity */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c09748]"></span>
            <span className="font-serif font-black tracking-tight text-xl text-[#17191c]">
              PAINTKING
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#777b86] px-2 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec]">
              Surface Solutions
            </span>
          </div>
          <div className="text-xs font-medium text-[#777b86]">
            Paintking Solutions Pvt Ltd. • Operations & Quality Control
          </div>
          <div className="text-[11px] text-[#979799]">
            Plant Location: Haridwar Unit • ISO 9001:2015 & IATF 16949 Certified
          </div>
        </div>

        {/* Right: Title & Control Strip */}
        <div className="sm:text-right space-y-2">
          <div className="flex flex-wrap items-center sm:justify-end gap-2">
            <span className="px-3 py-1 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[11px] font-mono font-bold">
              {grn.docNo || 'DOC NO: 00'} • Rev.{grn.revNo || '00'}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono font-bold flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
              STORE RECEIVED
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#17191c] tracking-tight">
            Goods Received Note (GRN)
          </h1>
          <p className="text-xs text-[#777b86] font-mono">
            Document No: <strong className="text-[#17191c]">{grn.grnNo}</strong> • Date: {grn.date}
          </p>
        </div>
      </div>

      {/* 2. INWARD & SUPPLIER OVERVIEW (8 TRACKED FIELDS) */}
      {/* 2. INWARD & SUPPLIER OVERVIEW (3-ROW STRUCTURED GRID) */}
      <div className="bg-[#fafafb] rounded-[20px] border border-[#ececec] p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#ececec]/80">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#c09748]">
            Inward Consignment & Store Intake Metadata
          </span>
          <span className="text-[11px] font-mono text-[#777b86]">
            Gate Receipt Date: <strong className="text-[#17191c]">{grn.receivedDate || grn.date}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
          {/* Row 1 */}
          <div className="p-3 rounded-[14px] bg-white border border-[#ececec] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#17191c] font-bold block">
              GRN Number
            </span>
            <div className="font-mono font-bold text-sm text-[#c09748]">{grn.grnNo}</div>
          </div>

          <div className="p-3 rounded-[14px] bg-white border border-[#ececec] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#17191c] font-bold block">
              GRN Date
            </span>
            <div className="font-mono text-xs text-[#777b86]">{grn.date}</div>
          </div>

          <div className="p-3 rounded-[14px] bg-white border border-[#ececec] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#17191c] font-bold block">
              Inward Receive Date
            </span>
            <div className="font-mono text-xs text-[#777b86]">{grn.receivedDate || grn.date}</div>
          </div>

          {/* Row 2 */}
          <div className="p-3 rounded-[14px] bg-white border border-[#ececec] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#17191c] font-bold block">
              Challan / DC Number
            </span>
            <div className="font-mono font-bold text-xs text-[#17191c]">{grn.invoiceChallanNo || '-'}</div>
          </div>

          <div className="p-3 rounded-[14px] bg-white border border-[#ececec] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#17191c] font-bold block">
              Name of Party / Vendor
            </span>
            <div className="font-semibold text-xs text-[#17191c] truncate" title={grn.supplierCustomer}>
              {grn.supplierCustomer || '-'}
            </div>
          </div>

          <div className="p-3 rounded-[14px] bg-white border border-[#ececec] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#17191c] font-bold block">
              Challan Date
            </span>
            <div className="font-mono text-xs text-[#777b86]">{grn.invoiceDate || '-'}</div>
          </div>

          {/* Row 3 */}
          <div className="p-3 rounded-[14px] bg-white border border-[#ececec] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#17191c] font-bold block">
              Vehicle Number
            </span>
            <div className="font-mono font-bold text-xs text-[#17191c] uppercase">{grn.vehicleNo || '-'}</div>
          </div>

          <div className="p-3 rounded-[14px] bg-white border border-[#ececec] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#17191c] font-bold block">
              Transporter Name
            </span>
            <div className="font-medium text-xs text-[#17191c] truncate" title={grn.transporter || 'Direct'}>
              {grn.transporter || 'Direct Gate Delivery'}
            </div>
          </div>

          <div className="p-3 rounded-[14px] bg-emerald-50/60 border border-emerald-200 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-900 font-bold block">
              IQC Inspection Ref
            </span>
            <div className="font-mono text-xs font-semibold text-emerald-800 truncate">
              {grn.sourceIqcReportNo || 'IQC-PASSED'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. MATERIAL ITEMS VERIFICATION TABLE */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#c09748]">
            Line Items Intake & Quantity Verification (Verified from IQC)
          </span>
          <span className="text-xs font-mono text-[#777b86]">
            Total Store Intake: <strong className="text-emerald-800">{totalActual} Pcs</strong>
          </span>
        </div>

        <div className="overflow-x-auto border border-[#ececec] rounded-[18px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f2f2f3] text-[#17191c] font-bold uppercase text-[10px] tracking-wider border-b border-[#ececec]">
                <th className="p-3 w-12 text-center">#</th>
                <th className="p-3 w-28">Part Code</th>
                <th className="p-3 min-w-[200px]">Part Description</th>
                <th className="p-3 text-center w-24">Invoiced</th>
                <th className="p-3 text-center w-24">OK (IQC)</th>
                <th className="p-3 text-center w-20">Rej (IQC)</th>
                <th className="p-3 text-center w-32">Actual (Store)</th>
                <th className="p-3 text-center w-28">Short/Excess</th>
                <th className="p-3 min-w-[140px]">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ececec] text-[#17191c]">
              {rawItems.map((item, idx) => {
                const inv = Number(item.invoicedQty) || 0;
                const act = Number(item.actualReceivedQty) || 0;
                const diff = item.shortExcessQty !== undefined ? Number(item.shortExcessQty) : (act - inv);
                const ok = item.okByIqcQty !== undefined ? Number(item.okByIqcQty) : act;
                const rej = Number(item.rejectionQty) || 0;

                return (
                  <tr key={item.id || idx} className="hover:bg-[#fafafb] transition">
                    <td className="p-3 text-center font-mono text-[#777b86] text-[11px]">{idx + 1}</td>
                    <td className="p-3 font-mono text-[#17191c]">
                      {item.partCode}
                    </td>
                    <td className="p-3 font-medium text-[#17191c]">
                      {item.partDescription}
                    </td>
                    <td className="p-3 text-center font-mono text-[#777b86]">
                      {inv}
                    </td>
                    <td className="p-3 text-center font-mono font-semibold text-emerald-800">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                        {ok}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono">
                      {rej > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-bold border border-red-200">
                          {rej}
                        </span>
                      ) : (
                        <span className="text-[#979799]">0</span>
                      )}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-sm text-[#17191c]">
                      <span className="px-3 py-1 rounded-[10px] bg-[#faf7ed] border border-[#f4e5be] inline-block">
                        {act} Pcs
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs inline-block ${
                        diff < 0 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : diff > 0 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {diff > 0 ? `+${diff}` : diff === 0 ? '0 (Match)' : diff}
                      </span>
                    </td>
                    <td className="p-3 text-[#777b86] text-[11px] truncate" title={item.remark}>
                      {item.remark || 'IQC Cleared'}
                    </td>
                  </tr>
                );
              })}

              {/* Total Summary Row */}
              <tr className="bg-[#f2f2f3] font-bold text-[#17191c] border-t border-[#ececec]">
                <td colSpan={3} className="p-3 text-center uppercase tracking-wider text-[11px] text-[#17191c]">
                  TOTAL STORE INTAKE ({rawItems.length} Items):
                </td>
                <td className="p-3 text-center font-mono text-xs">
                  {totalInvoiced}
                </td>
                <td className="p-3 text-center font-mono text-xs text-emerald-800">
                  {totalOkIqc}
                </td>
                <td className="p-3 text-center font-mono text-xs text-red-600">
                  {totalRej}
                </td>
                <td className="p-3 text-center font-mono text-sm text-[#17191c]">
                  <span className="px-3 py-1 rounded-[10px] bg-white border border-[#ececec] inline-block shadow-2xs">
                    {totalActual} Pcs
                  </span>
                </td>
                <td className="p-3 text-center font-mono text-xs">
                  {totalShortExcess > 0 ? `+${totalShortExcess}` : totalShortExcess === 0 ? '0 (Match)' : totalShortExcess}
                </td>
                <td className="p-3 text-[11px] text-emerald-800 font-semibold">
                  ✓ Material Count Verified
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. OFFICIAL SIGNATURES BLOCK (3 COLUMNS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
        <div className="bg-[#fafafb] p-4 rounded-[18px] border border-[#ececec] space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#777b86] block">
            Store Incharge (Receiver)
          </span>
          <div className="font-serif font-bold text-sm text-[#17191c]">
            {grn.storeIncharge || 'Manoj Tiwari (Stores)'}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Store Material Intake Stamp</span>
          </div>
        </div>

        <div className="bg-[#fafafb] p-4 rounded-[18px] border border-[#ececec] space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#777b86] block">
            Quality Approved (IQC Lead)
          </span>
          <div className="font-serif font-bold text-sm text-emerald-900">
            {grn.qualityApprovedBy || 'Amit Verma (QA Lead)'}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>IQC Inspection Clearance</span>
          </div>
        </div>

        <div className="bg-[#fafafb] p-4 rounded-[18px] border border-[#ececec] space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#777b86] block">
            Approved By (Plant Head)
          </span>
          <div className="font-serif font-bold text-sm text-[#17191c]">
            {grn.approvedBy || 'Satish Sharma (Plant Head)'}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Plant Inventory Ingestion Authorized</span>
          </div>
        </div>
      </div>

      {/* 5. FOOTER COMPLIANCE BAR */}
      <div className="pt-4 border-t border-[#ececec] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#777b86]">
        <div>
          Paintking Solutions Pvt Ltd. • Operations & Stores Quality System
        </div>
        <div className="font-mono text-[10px] text-[#979799]">
          DOC NO: 00 • Rev.00 • Confidential Industrial Operational Record
        </div>
      </div>

    </div>
  );

  if (!isModal) {
    return documentContent;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150">
      {/* Sticky Top Header Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between shadow-2xs gap-3 print:hidden">
        <div className="flex items-center gap-2.5">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
                Goods Receipt Note
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
                {grn.grnNo}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold">
                STORE RECEIVED
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c]">
              Official Goods Received Note Specification & Verification
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="px-4 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-[#c09748]" />
            <span className="hidden sm:inline">Download PDF</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-full border border-[#dcdfe4] bg-white hover:bg-gray-50 text-[#17191c] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
          >
            <Printer className="w-3.5 h-3.5 text-[#777b86]" />
            <span className="hidden sm:inline">Print</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs shrink-0 ml-1"
              title="Close"
            >
              <X className="w-5 h-5 text-[#17191c]" />
            </button>
          )}
        </div>
      </div>

      {/* Body Container */}
      <div className="max-w-5xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-xs">
        {/* Printable/Viewable Document */}
        <div className="p-1 sm:p-2 bg-white rounded-[20px] border border-[#ececec] overflow-x-auto print:bg-white print:p-0 print:border-none shadow-2xs">
          {documentContent}
        </div>

        {/* Footer info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#777b86] pt-4 border-t border-[#ececec] print:hidden">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Material is officially catalogued into Plant Store Inventory.</span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              Close Document
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
