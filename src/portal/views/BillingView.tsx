import React, { useState, useEffect } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { BillingInvoice, BillableLineItem } from '../types/portalTypes';
import { 
  downloadStandardTaxInvoicePdf, 
  downloadStandardDeliveryChallanPdf 
} from '../utils/pdfStandardHeader';
import { 
  ReceiptText, 
  Printer, 
  ShieldCheck,
  Plus,
  X,
  FileCheck,
  Sparkles,
  Download,
  Building2,
  CreditCard,
  Truck,
  CheckCircle2,
  FileText,
  UserCheck,
  MapPin,
  Package,
  Calendar,
  Layers,
  Award
} from 'lucide-react';

// Number to Words Converter for INR Currency
function numberToWordsINR(num: number): string {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const rounded = Math.round(num);
  if (rounded === 0) return 'Zero Rupees Only';
  if (rounded.toString().length > 9) return `Rupees ${rounded.toLocaleString('en-IN')}`;
  
  const n = ('000000000' + rounded).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return `Rupees ${rounded.toLocaleString('en-IN')}`;
  
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) + 'Rupees Only' : 'Rupees Only';
  return str;
}

export const BillingView: React.FC = () => {
  const { 
    billingInvoices, 
    toggleInvoiceExcessApproval, 
    qualityReleases,
    generateNewInvoiceFromPDI,
    universalJobs,
    activePlant,
    currentUser,
    activeSubTab
  } = usePortalStore();

  const qaApprovedJobs = universalJobs.filter(
    j => j.isFinalQaApproved || j.currentStage === '6. Billing Invoice' || j.currentStage === '7. Outward Dispatched'
  );

  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState<string>(
    billingInvoices[0]?.invoiceNo || ''
  );
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [docType, setDocType] = useState<'TAX_INVOICE' | 'DELIVERY_CHALLAN'>('TAX_INVOICE');

  useEffect(() => {
    if (activeSubTab === 'TAX_INVOICE') {
      setDocType('TAX_INVOICE');
      setShowPrintModal(true);
    } else if (activeSubTab === 'DELIVERY_CHALLAN') {
      setDocType('DELIVERY_CHALLAN');
      setShowPrintModal(true);
    }
  }, [activeSubTab]);

  // Active Invoice lookup (defaults to first available or selected)
  const activeInv = billingInvoices.find(inv => inv.invoiceNo === selectedInvoiceNo) || billingInvoices[0] || null;

  // Pending OQC releases that don't have an invoice generated yet
  const availableOqcOrders = qualityReleases.filter(
    r => r.pdiStatus === 'Cleared for Invoicing'
  );

  // Instant Green Button Handler: Auto-Generates Invoice & Triggers Official Standard PDF Download!
  const handleAutoGenerateAndDownloadPdf = () => {
    if (availableOqcOrders.length > 0) {
      const firstWo = availableOqcOrders[0].woNo;
      generateNewInvoiceFromPDI(firstWo);
      if (activeInv) {
        downloadStandardTaxInvoicePdf(activeInv);
      }
      setShowPrintModal(true);
    } else if (activeInv) {
      downloadStandardTaxInvoicePdf(activeInv);
      setShowPrintModal(true);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Print CSS Rules for clean PDF export without app UI chrome */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-gst-invoice, #printable-gst-invoice * {
            visibility: visible !important;
          }
          #printable-gst-invoice {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            border: 2px solid #17191c !important;
            background: white !important;
            z-index: 99999 !important;
          }
        }
      `}</style>

      {/* Header Banner - Standardized Persona Layout */}
      <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 border border-[#ececec] shadow-xs sm:shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
            <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[9px] sm:text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-ACC-INV-001 • COMMERCIAL & BILLING DESK
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#17191c] text-[10px] font-semibold">
              👤 {currentUser.name} ({currentUser.roleTitle})
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold">
              📍 {activePlant}
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-serif font-normal text-[#17191c] tracking-tight">
            Automated Billing & Dispatch Engine
          </h1>
          <p className="text-[11px] sm:text-xs text-[#777b86] mt-1">
            Work finishes in OQC ➔ Invoice & Challan auto-generated with 0 human effort • GST Rule 55 Transport Note
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {activeInv && (
            <button
              onClick={() => { setDocType('TAX_INVOICE'); setShowPrintModal(true); }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-semibold shadow-xs transition cursor-pointer w-full md:w-auto active:scale-95"
            >
              <Printer className="w-4 h-4 text-[#17191c]" />
              <span>Print Tax Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Invoice Selector & Instant PDF Download Green Button Bar */}
      <div className="bg-white rounded-[18px] sm:rounded-[20px] p-4 border border-[#ececec] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#777b86] mb-1">
            Select Active Tax Invoice / Order ({billingInvoices.length} Auto-Generated):
          </label>
          <select
            value={activeInv?.invoiceNo || ''}
            onChange={e => setSelectedInvoiceNo(e.target.value)}
            className="w-full p-2.5 rounded-[12px] sm:rounded-[14px] border border-[#ececec] bg-[#fafafb] font-mono font-bold text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none cursor-pointer"
          >
            {billingInvoices.map(inv => (
              <option key={inv.invoiceNo} value={inv.invoiceNo}>
                {inv.invoiceNo} • {inv.customer} ({inv.woNo}) - Total ₹{inv.grandTotal.toLocaleString('en-IN')}
              </option>
            ))}
          </select>
        </div>

        <div className="shrink-0 w-full sm:w-auto">
          <button
            onClick={handleAutoGenerateAndDownloadPdf}
            className="w-full sm:w-auto px-5 py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            title="Auto-generates invoice and opens instant PDF print download window"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Generate & Download PDF Invoice ({availableOqcOrders.length} Ready)</span>
          </button>
        </div>
      </div>

      {/* Difference Clarification Banner: Delivery Challan vs Tax Invoice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-[20px] bg-white border border-[#ececec] shadow-xs space-y-1.5">
          <div className="font-bold text-xs text-[#17191c] flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-[#c09748]" />
            1. Delivery Challan (Goods Transport Note - Rule 55)
          </div>
          <p className="text-[11px] text-[#777b86] leading-relaxed">
            Truck driver, security gate officer, aur customer stores receiving ke liye. Material Qty, Vehicle No, Driver info, Crate count, aur Rule 55 note specify karta hai (Zero Price/Payment Demand).
          </p>
        </div>

        <div className="p-4 rounded-[20px] bg-white border border-[#ececec] shadow-xs space-y-1.5">
          <div className="font-bold text-xs text-[#17191c] flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#c09748]" />
            2. Tax Invoice (Commercial Accounting Bill - Section 31)
          </div>
          <p className="text-[11px] text-[#777b86] leading-relaxed">
            Accounts desk & payment collection ke liye. Unit Rate (₹/pc), HSN 9988, CGST (9%), SGST (9%), Amount in Words, Bank Remittance Details, aur Quality Compliance stamp specify karta hai.
          </p>
        </div>
      </div>

      {/* Active Invoices List & Reconciliation Canvas */}
      {activeInv && (
        <div className="space-y-4">
          <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-[#ececec] p-4 sm:p-6 shadow-xs sm:shadow-sm space-y-5 sm:space-y-6">
            {/* Invoice Metadata Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-4 border-b border-[#f2f2f3] gap-4">
              <div>
                <span className="text-[10px] sm:text-[11px] font-mono text-[#c09748] font-bold px-2.5 py-0.5 rounded-full bg-[#faf7ed] border border-[#f4e5be] inline-block whitespace-nowrap">
                  INVOICE NO: {activeInv.invoiceNo}
                </span>
                <h3 className="text-lg sm:text-2xl font-serif font-normal text-[#17191c] mt-1">{activeInv.customer}</h3>
                <div className="text-[11px] sm:text-xs text-[#777b86] flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 font-mono">
                  <span className="whitespace-nowrap">Work Order: <strong className="text-[#17191c]">{activeInv.woNo}</strong></span>
                  <span className="text-[#a3a6af] shrink-0">•</span>
                  <span className="whitespace-nowrap">Date: <strong className="text-[#17191c]">{activeInv.invoiceDate}</strong></span>
                  <span className="text-[#a3a6af] shrink-0">•</span>
                  <span className="whitespace-nowrap">Plant: <strong className="text-[#17191c]">{activeInv.plant}</strong></span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
                <button
                  onClick={() => { setDocType('TAX_INVOICE'); setShowPrintModal(true); }}
                  className="px-3 py-1.5 rounded-full bg-white border border-[#ececec] text-[#17191c] text-xs font-semibold hover:border-[#c09748] transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>Tax Invoice Template</span>
                </button>

                <button
                  onClick={() => { setDocType('DELIVERY_CHALLAN'); setShowPrintModal(true); }}
                  className="px-3 py-1.5 rounded-full bg-white border border-[#ececec] text-[#17191c] text-xs font-semibold hover:border-[#c09748] transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Truck className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>Delivery Challan Template</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (activeInv) {
                      downloadStandardTaxInvoicePdf(activeInv);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#17191c] hover:bg-black text-white text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  title="Direct 1-Click Official Tax Invoice PDF Download"
                >
                  <Download className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* 3-Way Reconciliation Line-Item Breakdown Table */}
            <div>
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-[#777b86] mb-3">
                3-Way Line Reconciliation: Agreed PO vs Actual Sprayed vs Billable
              </div>

              <div className="overflow-x-auto no-scrollbar scroll-smooth">
                <table className="w-full text-left text-xs border border-[#ececec] rounded-[16px] overflow-hidden">
                  <thead className="bg-[#fafafb] text-[#777b86] font-semibold border-b border-[#ececec]">
                    <tr>
                      <th className="p-3.5">Color / Finish Line</th>
                      <th className="p-3.5 text-center">Customer PO Qty</th>
                      <th className="p-3.5 text-center">Sprayed & Passed</th>
                      <th className="p-3.5 text-center">Floor Variance</th>
                      <th className="p-3.5 text-center">Client Concession</th>
                      <th className="p-3.5 text-center">Billable Qty</th>
                      <th className="p-3.5 text-right">Unit Rate</th>
                      <th className="p-3.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ececec] text-[#17191c]">
                    {activeInv.lineItems.map(item => (
                      <tr key={item.id} className="hover:bg-[#fafafb]">
                        <td className="p-3.5 font-medium">
                          <div className="flex items-center gap-2.5">
                            <span 
                              className={`w-3 h-3 rounded-full ${
                                item.colorName.includes('Red') ? 'bg-red-500' : 'bg-[#17191c]'
                              }`} 
                            />
                            <span>{item.colorName}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-center font-mono font-medium">{item.orderedQty} pcs</td>
                        <td className="p-3.5 text-center font-mono font-bold text-emerald-800">
                          {item.passedAndPackedQty} pcs
                        </td>
                        <td className="p-3.5 text-center">
                          {item.excessQty > 0 ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold font-mono">
                              +{item.excessQty} Buffer Over-run
                            </span>
                          ) : item.orderedQty > item.passedAndPackedQty ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-bold font-mono">
                              -{item.orderedQty - item.passedAndPackedQty} Shortfall
                            </span>
                          ) : (
                            <span className="text-gray-400 font-mono">0 (Exact)</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          {item.excessQty > 0 ? (
                            <button
                              onClick={() => toggleInvoiceExcessApproval(activeInv.invoiceNo, item.id)}
                              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer border ${
                                item.excessApprovedByClient
                                  ? 'bg-emerald-700 border-emerald-800 text-white'
                                  : 'bg-white border-[#f4e5be] text-[#8a6521] hover:bg-[#faf3e0]'
                              }`}
                              title="Click to toggle client agreement for the extra pieces"
                            >
                              {item.excessApprovedByClient ? '✓ Client Approved (+50 Billed)' : 'Hold In Buffer (Do Not Bill)'}
                            </button>
                          ) : (
                            <span className="text-[#a3a6af] text-[11px]">N/A</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-mono text-sm font-bold text-[#17191c]">
                          {item.billableQty} pcs
                        </td>
                        <td className="p-3.5 text-right font-mono text-[#777b86]">₹{item.unitRate.toFixed(2)}</td>
                        <td className="p-3.5 text-right font-serif font-normal text-base text-[#17191c]">
                          ₹{item.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reconciliation Totals & Tax Calculation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
              <div className="p-4 sm:p-5 rounded-[18px] sm:rounded-[20px] bg-[#fafafb] border border-[#ececec] text-xs space-y-2.5">
                <div className="font-semibold text-[#17191c]">Floor Balance & Backlog Note:</div>
                <p className="text-[#777b86] leading-relaxed">
                  {activeInv.balanceBacklogNote || 'All order balances reconciled with shopfloor shift logs.'}
                </p>
                <div className="pt-2 border-t border-[#ececec] text-[11px] text-[#777b86]">
                  Prepared by: <strong className="text-[#17191c]">{activeInv.preparedBy}</strong>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-[18px] sm:rounded-[20px] bg-[#fafafb] border border-[#ececec] text-xs space-y-2.5">
                <div className="flex justify-between text-[#777b86]">
                  <span>Total Received Material (PO):</span>
                  <span className="font-mono font-bold text-[#17191c]">{activeInv.totalOrderedQty} pcs</span>
                </div>
                <div className="flex justify-between text-[#777b86]">
                  <span>Total Quantities Billed in this Invoice:</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">
                    {activeInv.totalBilledQty} pcs
                  </span>
                </div>
                <div className="h-px bg-[#ececec] my-1" />
                <div className="flex justify-between text-[#17191c]">
                  <span>Taxable Subtotal (Job Work Service):</span>
                  <span className="font-mono font-semibold">
                    ₹{activeInv.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-[#777b86]">
                  <span>CGST (9%):</span>
                  <span className="font-mono">
                    ₹{(activeInv.cgstAmount ?? Math.round(activeInv.gstAmount / 2 * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-[#777b86]">
                  <span>SGST (9%):</span>
                  <span className="font-mono">
                    ₹{(activeInv.sgstAmount ?? Math.round(activeInv.gstAmount / 2 * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="h-px bg-[#ececec] my-1" />
                <div className="flex justify-between text-base font-serif font-normal text-[#17191c]">
                  <span>Total Tax Invoice Value (INR):</span>
                  <span className="text-[#8a6521] font-semibold">
                    ₹{activeInv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL GST DOCUMENT PRINT & PDF DOWNLOAD MODAL */}
      {showPrintModal && activeInv && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-[20px] sm:rounded-[24px] max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-[#ececec] max-h-[95vh] overflow-y-auto no-scrollbar space-y-4">
            
            {/* Modal Control Header (Switch between Tax Invoice & Delivery Challan) */}
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#ececec] gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDocType('TAX_INVOICE')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    docType === 'TAX_INVOICE'
                      ? 'bg-[#17191c] text-[#c09748] shadow-xs'
                      : 'bg-[#fafafb] text-[#777b86] border border-[#ececec] hover:bg-gray-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Tax Invoice (Commercial Bill)</span>
                </button>
                <button
                  onClick={() => setDocType('DELIVERY_CHALLAN')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    docType === 'DELIVERY_CHALLAN'
                      ? 'bg-[#17191c] text-[#c09748] shadow-xs'
                      : 'bg-[#fafafb] text-[#777b86] border border-[#ececec] hover:bg-gray-100'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Delivery Challan (Rule 55 Transport)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (activeInv) {
                      if (docType === 'TAX_INVOICE') {
                        downloadStandardTaxInvoicePdf(activeInv);
                      } else {
                        downloadStandardDeliveryChallanPdf(activeInv);
                      }
                    }
                  }}
                  className="px-4 py-1.5 rounded-full bg-[#17191c] hover:bg-black text-white font-medium text-xs shadow-xs cursor-pointer transition flex items-center gap-1.5"
                  title="Download standard official PDF with PaintKing company header"
                >
                  <Download className="w-3.5 h-3.5 text-[#c09748]" />
                  <span>Download Official PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-full border border-[#e5e7eb] bg-white hover:bg-gray-50 text-[#17191c] font-medium text-xs shadow-2xs cursor-pointer transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-[#777b86]" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-[#17191c] font-bold flex items-center justify-center cursor-pointer transition"
                  title="Close Preview"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* DOCUMENT CANVAS WITH OFFICIAL PAINTKING WEBSITE LOGO */}
            {/* ---------------------------------------------------- */}
            <div id="printable-gst-invoice" className="border-2 border-[#17191c] p-4 sm:p-8 text-xs text-[#17191c] space-y-4 font-sans bg-white shadow-xs">
              
              {/* Top Header: Official PaintKing Website Logo & ISO/IATF Stamp */}
              <div className="border-b-2 border-[#17191c] pb-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  
                  {/* PaintKing Official Brand Logo from /logo.svg */}
                  <div className="flex items-center gap-3">
                    <img 
                      src="/logo.svg" 
                      alt="PaintKing Surface Solutions Logo" 
                      className="h-10 sm:h-14 w-auto object-contain shrink-0" 
                    />
                    <div className="hidden sm:block border-l-2 border-[#ececec] pl-3">
                      <div className="text-[10px] text-[#8a6521] font-mono tracking-widest uppercase font-bold">
                        ISO 9001:2015 & IATF 16949 CERTIFIED
                      </div>
                      <div className="text-[9px] text-gray-500 font-sans">
                        Liquid Spray • 3D Hydrographic • UV Direct • Injection Moulding
                      </div>
                    </div>
                  </div>

                  {/* Document Title Capsule */}
                  <div className="text-right">
                    <div className="inline-block px-3 py-1 bg-[#17191c] text-[#c09748] font-mono font-bold text-xs tracking-wider uppercase rounded-md shadow-xs">
                      {docType === 'TAX_INVOICE' 
                        ? 'TAX INVOICE (SEC 31 CGST ACT)' 
                        : 'DELIVERY CHALLAN (RULE 55 CGST RULES)'}
                    </div>
                    <div className="text-[10px] font-mono text-gray-600 mt-1">
                      ORIGINAL FOR RECIPIENT • PLANT: <strong className="text-[#17191c] uppercase">{activeInv.plant} UNIT</strong>
                    </div>
                  </div>
                </div>

                {/* Company Legal Identity Bar */}
                <div className="text-[10px] text-gray-700 font-mono pt-2 border-t border-gray-200 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <strong>PaintKing Surface Solutions Pvt. Ltd.</strong> • Plot No. 42, Sector 8A, SIDCUL Industrial Estate, Haridwar, Uttarakhand - 249403
                  </div>
                  <div className="font-semibold text-[#17191c]">
                    GSTIN: <span className="font-mono text-[#8a6521]">05AABCP9912K1Z4</span> • PAN: <span className="font-mono">AABCP9912K</span>
                  </div>
                </div>
              </div>

              {/* TEMPLATE 1: TAX INVOICE (COMMERCIAL BILLING & ACCOUNTING) */}
              {docType === 'TAX_INVOICE' ? (
                <div className="space-y-4">
                  {/* Billed To vs Commercial Invoice Metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-[#17191c] pb-4">
                    <div className="space-y-1 bg-[#fafafb] p-3 rounded-[12px] border border-[#ececec]">
                      <div className="text-gray-500 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 font-mono">
                        <Building2 className="w-3 h-3 text-[#c09748]" />
                        BILLED TO (BUYER):
                      </div>
                      <div className="font-bold text-sm text-[#17191c]">{activeInv.customer}</div>
                      <div className="text-gray-700 text-[11px] leading-snug">
                        Plot No. 18, Industrial Area Phase II, Gurugram, Haryana - 122002
                      </div>
                      <div className="font-mono text-[10px] text-gray-600 pt-1">
                        GSTIN: <strong>06AABCR1234M1Z2</strong> • State Code: <strong>06 (Haryana)</strong>
                      </div>
                    </div>

                    <div className="bg-[#fafafb] p-3 rounded-[12px] border border-[#ececec] space-y-1 font-mono text-[11px]">
                      <div className="text-gray-500 font-bold uppercase tracking-wider text-[9px] font-sans flex items-center gap-1">
                        <FileText className="w-3 h-3 text-[#c09748]" />
                        COMMERCIAL INVOICE METADATA:
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tax Invoice No:</span>
                        <strong className="text-[#8a6521] text-xs">{activeInv.invoiceNo}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Invoice Date:</span>
                        <strong className="text-[#17191c]">{activeInv.invoiceDate}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Work Order Ref:</span>
                        <strong>{activeInv.woNo}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Customer PO Ref:</span>
                        <strong>PO-889021 • 10-Aug-2026</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Payment Terms:</span>
                        <strong className="text-emerald-800">Net 30 Days (Due: 13-Oct-2026)</strong>
                      </div>
                    </div>
                  </div>

                  {/* Line Items Table with Rates & HSN 9988 */}
                  <table className="w-full text-left text-[11px] border border-[#17191c] border-collapse">
                    <thead className="bg-[#17191c] text-white font-bold">
                      <tr>
                        <th className="p-2 border-r border-[#ececec] text-center w-10">Sr.</th>
                        <th className="p-2 border-r border-[#ececec]">Description of Surface Finishing Job Work</th>
                        <th className="p-2 border-r border-[#ececec] text-center w-20">HSN/SAC</th>
                        <th className="p-2 border-r border-[#ececec] text-center w-24">Billed Qty</th>
                        <th className="p-2 border-r border-[#ececec] text-right w-24">Unit Rate (₹)</th>
                        <th className="p-2 text-right w-32">Taxable Value (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#17191c]">
                      {activeInv.lineItems.map((li, idx) => (
                        <tr key={li.id} className="hover:bg-gray-50">
                          <td className="p-2 border-r border-[#17191c] text-center font-mono">{idx + 1}</td>
                          <td className="p-2 border-r border-[#17191c]">
                            <div className="font-bold text-[#17191c]">
                              Industrial Surface Coating & Finishing — {li.colorName}
                            </div>
                            <div className="text-[10px] text-gray-600 font-sans">
                              Substrate: Automotive ABS Plastic • Dust-Free Clean Environment Spraying
                              {li.excessApprovedByClient && (
                                <span className="block text-[9px] text-emerald-800 font-semibold font-mono">
                                  ✓ (+50 Pcs Client Approved Overrun Included)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2 border-r border-[#17191c] text-center font-mono font-bold text-[#8a6521]">9988</td>
                          <td className="p-2 border-r border-[#17191c] text-center font-bold font-mono">{li.billableQty} pcs</td>
                          <td className="p-2 border-r border-[#17191c] text-right font-mono">₹{li.unitRate.toFixed(2)}</td>
                          <td className="p-2 text-right font-mono font-bold text-[#17191c]">
                            ₹{li.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Financial Breakdown Grid & Amount In Words */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-[#17191c] pb-4 pt-1">
                    <div className="space-y-3">
                      {/* Amount in Words Capsule */}
                      <div className="p-3 bg-[#faf7ed] border border-[#f4e5be] rounded-[12px]">
                        <span className="text-[9px] text-gray-500 font-bold block uppercase tracking-wider font-mono">
                          AMOUNT IN WORDS (INR):
                        </span>
                        <span className="font-serif font-bold text-sm text-[#8a6521] italic">
                          {numberToWordsINR(activeInv.grandTotal)}
                        </span>
                      </div>

                      {/* Official Bank Remittance Box */}
                      <div className="p-3 bg-white border border-[#ececec] rounded-[12px] text-[10px] space-y-1 font-mono">
                        <div className="font-bold text-[#17191c] flex items-center gap-1.5 font-sans border-b border-gray-100 pb-1">
                          <CreditCard className="w-3.5 h-3.5 text-[#c09748]" />
                          BANK REMITTANCE & NEFT/RTGS DETAILS:
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Bank Name:</span>
                          <strong>HDFC Bank Ltd (Haridwar SIDCUL Branch)</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Account Name:</span>
                          <strong>PaintKing Surface Solutions Pvt. Ltd.</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Current A/C No:</span>
                          <strong className="text-[#17191c]">50200088991122</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">IFSC Code:</span>
                          <strong className="text-[#8a6521]">HDFC0000123</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">UPI / QR VPA:</span>
                          <strong className="text-emerald-800">paintking@hdfcbank</strong>
                        </div>
                      </div>
                    </div>

                    {/* Tax Summary Table */}
                    <div className="p-3 bg-[#fafafb] border border-[#ececec] rounded-[12px] space-y-2 text-xs font-mono self-end">
                      <div className="flex justify-between text-gray-600">
                        <span className="font-sans">Taxable Service Subtotal:</span>
                        <span className="font-bold text-[#17191c]">₹{activeInv.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span className="font-sans">Central GST (CGST @ 9%):</span>
                        <span>₹{(activeInv.cgstAmount ?? Math.round(activeInv.subTotal * 0.09 * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span className="font-sans">State GST (SGST @ 9%):</span>
                        <span>₹{(activeInv.sgstAmount ?? Math.round(activeInv.subTotal * 0.09 * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="h-px bg-gray-300 my-1" />
                      <div className="flex justify-between items-baseline text-sm font-bold text-[#17191c] pt-1">
                        <span className="font-serif">Grand Tax Invoice Total (INR):</span>
                        <span className="text-[#8a6521] text-base">₹{activeInv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* TEMPLATE 2: DELIVERY CHALLAN (LOGISTICS & TRANSPORT GATE NOTE - RULE 55) */
                <div className="space-y-4">
                  {/* Transport & Consignee Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-[#17191c] pb-4">
                    <div className="space-y-1 bg-[#fafafb] p-3 rounded-[12px] border border-[#ececec]">
                      <div className="text-gray-500 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 font-mono">
                        <MapPin className="w-3 h-3 text-[#c09748]" />
                        CONSIGNEE / SHIPPED TO SITE:
                      </div>
                      <div className="font-bold text-sm text-[#17191c]">{activeInv.customer}</div>
                      <div className="text-gray-700 text-[11px] leading-snug">
                        Stores Inward Gate 03, Plot No. 18, Industrial Area Phase II, Gurugram, Haryana - 122002
                      </div>
                      <div className="font-mono text-[10px] text-gray-600 pt-1">
                        Contact: <strong>Stores Manager (Ph: +91 98711 00299)</strong>
                      </div>
                    </div>

                    {/* Logistics Vehicle & Driver Info */}
                    <div className="bg-[#fafafb] p-3 rounded-[12px] border border-[#ececec] space-y-1 font-mono text-[11px]">
                      <div className="text-gray-500 font-bold uppercase tracking-wider text-[9px] font-sans flex items-center gap-1">
                        <Truck className="w-3 h-3 text-[#c09748]" />
                        LOGISTICS & TRANSPORT DISPATCH DETAILS:
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Challan No (Rule 55):</span>
                        <strong className="text-[#8a6521] text-xs">PK/DC/2026/0488</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Dispatch Date & Time:</span>
                        <strong className="text-[#17191c]">{activeInv.invoiceDate} • 14:30 IST</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Vehicle No:</span>
                        <strong className="text-[#17191c] bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">UK-08-AL-4412</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Driver Name & Mobile:</span>
                        <strong>Ramesh Kumar (+91 98765 43210)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">E-Way Bill Ref:</span>
                        <strong className="text-emerald-800">2410 9988 7766</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Packaging Crates:</span>
                        <strong>12 Corrugated Master Boxes</strong>
                      </div>
                    </div>
                  </div>

                  {/* Item Quantities Table (NO RATES OR MONEY AMOUNTS FOR SECURITY/GATE) */}
                  <table className="w-full text-left text-[11px] border border-[#17191c] border-collapse">
                    <thead className="bg-[#17191c] text-white font-bold">
                      <tr>
                        <th className="p-2 border-r border-[#ececec] text-center w-10">Sr.</th>
                        <th className="p-2 border-r border-[#ececec]">Finished Coated Material Description</th>
                        <th className="p-2 border-r border-[#ececec] text-center w-20">HSN/SAC</th>
                        <th className="p-2 border-r border-[#ececec] text-center w-28">Received Raw Qty</th>
                        <th className="p-2 border-r border-[#ececec] text-center w-28">Returned Finished Qty</th>
                        <th className="p-2 text-center w-24">Packaging Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#17191c]">
                      {activeInv.lineItems.map((li, idx) => (
                        <tr key={li.id} className="hover:bg-gray-50">
                          <td className="p-2 border-r border-[#17191c] text-center font-mono">{idx + 1}</td>
                          <td className="p-2 border-r border-[#17191c]">
                            <div className="font-bold text-[#17191c]">
                              Processed Surface Finish — {li.colorName}
                            </div>
                            <div className="text-[10px] text-gray-600 font-sans">
                              Job Work Surface Treatment Completed • High Gloss Finish Pass
                            </div>
                          </td>
                          <td className="p-2 border-r border-[#17191c] text-center font-mono font-bold text-[#8a6521]">9988</td>
                          <td className="p-2 border-r border-[#17191c] text-center font-mono">{li.orderedQty} pcs</td>
                          <td className="p-2 border-r border-[#17191c] text-center font-mono font-bold text-emerald-800 text-sm">
                            {li.billableQty} pcs
                          </td>
                          <td className="p-2 text-center font-mono text-gray-700">Tote Crates</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Statutory Rule 55 Transport Declaration */}
                  <div className="p-3 bg-[#fafafb] border-2 border-dashed border-[#17191c] rounded-[10px] text-[11px] leading-relaxed space-y-1">
                    <div className="font-bold text-[#17191c] uppercase tracking-wider text-[10px] font-mono flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#c09748]" />
                      RULE 55 CGST STATUTORY TRANSPORT DECLARATION:
                    </div>
                    <p className="text-gray-700 text-[10px]">
                      This Delivery Challan is issued in accordance with <strong>Rule 55 of CGST Rules, 2017</strong> for the transport of goods for Job Work (HSN 9988). The goods specified herein are returned to the owner after surface treatment/coating. <strong>NOT A COMMERCIAL SALE INVOICE. NO PAYMENT DEMAND AT GATE.</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* QC Adhesion Clearance Stamp & Dual Signatures Block */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end text-[10px] text-gray-700 border-t border-[#17191c]">
                
                {/* Security Gate Verification Stamp */}
                <div className="p-2 border border-blue-300 bg-blue-50/60 rounded-[8px] space-y-0.5 font-mono">
                  <div className="font-bold text-blue-900 flex items-center gap-1 font-sans text-[10px]">
                    <UserCheck className="w-3 h-3 text-blue-700" />
                    SECURITY GATE VERIFIED
                  </div>
                  <div className="text-[9px] text-blue-800">Checked Outward at Plant Gate 02. Seal Intact.</div>
                </div>

                {/* Quality Clearance Stamp */}
                <div className="p-2 border border-emerald-300 bg-emerald-50/60 rounded-[8px] space-y-0.5 font-mono">
                  <div className="font-bold text-emerald-900 flex items-center gap-1 font-sans text-[10px]">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    100% QUALITY RELEASED
                  </div>
                  <div className="text-[9px] text-emerald-800">ASTM 5B Cross-Hatch Pass • ΔE ≤ 0.70 Pass</div>
                </div>

                {/* Signature Block */}
                <div className="text-right space-y-6 pt-2">
                  <div className="text-[10px] text-gray-500 font-sans">
                    For <strong>PaintKing Surface Solutions Pvt. Ltd.</strong>
                  </div>
                  <div className="font-bold border-t border-black pt-1 px-4 inline-block font-sans text-xs text-[#17191c]">
                    {docType === 'TAX_INVOICE' ? 'Authorized Accounts Signatory' : 'Dispatch / Stores Officer'}
                  </div>
                </div>

              </div>

              {/* Customer Receiving Block for Delivery Challan */}
              {docType === 'DELIVERY_CHALLAN' && (
                <div className="mt-3 p-3 border border-gray-300 rounded-[10px] bg-gray-50 flex justify-between items-center text-[10px]">
                  <div>
                    <div className="font-bold text-[#17191c] uppercase">Customer Stores Receiving Confirmation:</div>
                    <div className="text-gray-600">Material received in good physical condition with box count match.</div>
                  </div>
                  <div className="text-right border-t border-gray-400 pt-1 px-6 font-mono text-[9px]">
                    Receiver Name & Stamp / Signature
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Actions Bar inside Modal */}
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium text-xs cursor-pointer hover:bg-[#fafafb] transition"
              >
                Close Preview
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] font-bold text-xs shadow-sm cursor-pointer transition flex items-center gap-2 active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-[#17191c]" />
                <span>Download / Print PDF Now</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
