import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { BillingInvoice, BillableLineItem } from '../types/portalTypes';
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
  QrCode
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
    activePlant,
    currentUser
  } = usePortalStore();

  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState<string>(
    billingInvoices[0]?.invoiceNo || ''
  );
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState<boolean>(false);

  // New Invoice Form State
  const [newInvForm, setNewInvForm] = useState({
    customer: 'ROOP POLYMERS LTD',
    woNo: 'WO-1043',
    challanNo: 'RP/CH/99825',
    vehicleNo: 'UK-08-AL-4412',
    colorName: 'Monza Red Gloss',
    orderedQty: 250,
    billableQty: 250,
    unitRate: 25.00
  });

  // Active Invoice lookup (defaults to first available or selected)
  const activeInv = billingInvoices.find(inv => inv.invoiceNo === selectedInvoiceNo) || billingInvoices[0] || null;

  // Pending OQC releases that don't have an invoice generated yet
  const availableOqcOrders = qualityReleases.filter(
    r => r.pdiStatus === 'Cleared for Invoicing'
  );

  const handleCreateCustomInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    generateNewInvoiceFromPDI(newInvForm.woNo);
    setShowCreateInvoiceModal(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ISO Header Banner */}
      <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 border border-[#ececec] shadow-xs sm:shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
            <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[9px] sm:text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-ACC-INV-001 • COMMERCIAL DESK
            </span>
            <span className="text-[10px] sm:text-xs text-[#777b86]">
              GST Tax Invoice (HSN 9988) • 3-Way Reconciliation • Instant PDF Print
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-serif font-normal text-[#17191c] tracking-tight">
            Smart Billing & Tax Invoice Engine
          </h1>
          <p className="text-[11px] sm:text-xs text-[#777b86] mt-1">
            Billed strictly on inspected & passed pieces with transparent color line-item breakdown
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {activeInv && (
            <button
              onClick={() => setShowPrintModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-semibold shadow-xs transition cursor-pointer w-full md:w-auto active:scale-95"
            >
              <Printer className="w-4 h-4 text-[#17191c]" />
              <span>Print Official Tax Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Invoice Selector Dropdown & Cleared OQC Work Orders Bar */}
      <div className="bg-white rounded-[18px] sm:rounded-[20px] p-4 border border-[#ececec] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#777b86] mb-1">
            Select Active Tax Invoice / Customer Order ({billingInvoices.length} Invoices Available):
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

        {availableOqcOrders.length > 0 && (
          <div className="shrink-0 w-full sm:w-auto">
            <button
              onClick={() => {
                const firstWo = availableOqcOrders[0].woNo;
                generateNewInvoiceFromPDI(firstWo);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>Generate Invoice for Cleared OQC ({availableOqcOrders.length} Ready)</span>
            </button>
          </div>
        )}
      </div>

      {/* Ground Problem 1 Reality Card */}
      <div className="bg-[#faf3e0] border border-[#f4e5be] rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-xs text-xs text-[#17191c] space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="font-serif font-normal text-sm sm:text-base text-[#17191c] flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-[#c09748]" />
            PaintKing Commercial Billing Rule: Zero Over-Run Overbilling
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#c09748] text-[#17191c] text-[10px] font-bold self-start sm:self-auto">
            Zero Floor Over-Billing
          </span>
        </div>
        <p className="leading-relaxed text-[#777b86] text-[11px] sm:text-xs">
          When a customer supplies raw material for multiple colors (e.g. 250 Red + 750 Black), billing is generated 
          <strong className="text-[#17191c]"> strictly for accepted and cleared pieces</strong>. 
          If the floor paints 300 Red (+50 excess), the extra 50 are placed in a <em>"Finished Goods Buffer"</em> and 
          <strong className="text-[#17191c]"> NOT charged to the customer</strong> unless commercial approval is confirmed.
        </p>
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
                <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  OQC & PDI Cleared
                </span>
                <span className="px-3 py-1 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[11px] sm:text-xs font-semibold whitespace-nowrap">
                  Status: {activeInv.status}
                </span>
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

      {/* OFFICIAL GST TAX INVOICE PRINT MODAL */}
      {showPrintModal && activeInv && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-[20px] sm:rounded-[24px] max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-[#ececec] max-h-[94vh] overflow-y-auto no-scrollbar space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#c09748] font-bold px-2.5 py-0.5 rounded-full bg-[#faf7ed] border border-[#f4e5be]">
                  PK-TAX-INV-PRINT • OFFICIAL GST DOCUMENT (HSN 9988)
                </span>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-[#979799] hover:text-[#17191c] text-base font-bold cursor-pointer transition p-1"
              >
                ✕
              </button>
            </div>

            {/* Official GST Paper Invoice Layout - Editorial Industrial Luxury Design */}
            <div id="printable-gst-invoice" className="border-2 border-[#17191c] p-4 sm:p-6 text-xs text-[#17191c] space-y-3 font-sans bg-white shadow-xs">
              
              {/* Header Box: PaintKing Crown Brand Banner */}
              <div className="text-center border-b-2 border-[#17191c] pb-3 space-y-1">
                <div className="flex items-center justify-center gap-2 text-[#c09748] font-bold uppercase tracking-widest text-[11px]">
                  <Building2 className="w-4 h-4" />
                  PaintKing Surface Solutions Pvt. Ltd.
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-normal text-[#17191c] tracking-wide">
                  TAX INVOICE & DELIVERY CHALLAN
                </h2>
                <div className="text-[10px] text-gray-600 font-mono">
                  Plot No. 42, Sector 8A, SIDCUL Industrial Estate, Haridwar, Uttarakhand - 249403
                </div>
                <div className="text-[10px] font-mono text-[#17191c] font-semibold">
                  GSTIN: 05AABCP9912K1Z4 • PAN: AABCP9912K • State Code: 05 (Uttarakhand) • ISO 9001:2015 Certified
                </div>
              </div>

              {/* Billed To vs Dispatch Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 border-b border-[#17191c] pb-3 text-[11px]">
                <div className="space-y-1">
                  <div className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">BILLED TO (CUSTOMER):</div>
                  <div className="font-bold text-sm text-[#17191c]">{activeInv.customer}</div>
                  <div className="text-gray-700">Plot No. 18, Industrial Area Phase II, Gurugram, Haryana - 122002</div>
                  <div className="font-mono text-gray-600">GSTIN: 06AABCR1234M1Z2 • State Code: 06</div>
                </div>

                <div className="text-right space-y-1 font-mono text-[11px]">
                  <div>Invoice No: <strong className="text-[#17191c]">{activeInv.invoiceNo}</strong></div>
                  <div>Invoice Date: <strong className="text-[#17191c]">{activeInv.invoiceDate}</strong></div>
                  <div>Work Order Ref: <strong>{activeInv.woNo}</strong></div>
                  <div>Challan No: <strong>RP/CH/99824</strong></div>
                  <div>Vehicle No: <strong>UK-08-AL-4412</strong></div>
                </div>
              </div>

              {/* HSN 9988 Table */}
              <table className="w-full text-left text-[10px] sm:text-[11px] border border-[#17191c] border-collapse">
                <thead className="bg-[#fafafb] border-b border-[#17191c] font-bold text-[#17191c]">
                  <tr>
                    <th className="p-2 border-r border-[#17191c]">Sr.</th>
                    <th className="p-2 border-r border-[#17191c]">Description of Job Work Service</th>
                    <th className="p-2 border-r border-[#17191c] text-center">HSN/SAC</th>
                    <th className="p-2 border-r border-[#17191c] text-center">Billed Qty</th>
                    <th className="p-2 border-r border-[#17191c] text-right">Unit Rate ₹</th>
                    <th className="p-2 text-right">Taxable Amount ₹</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#17191c]">
                  {activeInv.lineItems.map((li, idx) => (
                    <tr key={li.id}>
                      <td className="p-2 border-r border-[#17191c] text-center">{idx + 1}</td>
                      <td className="p-2 border-r border-[#17191c]">
                        Surface Finishing & Coating - <strong className="text-[#17191c]">{li.colorName}</strong>
                        {li.excessApprovedByClient && <span className="block text-[9px] text-emerald-800 font-semibold">(Includes +50 client approved overrun)</span>}
                      </td>
                      <td className="p-2 border-r border-[#17191c] text-center font-mono font-semibold">9988</td>
                      <td className="p-2 border-r border-[#17191c] text-center font-bold">{li.billableQty} pcs</td>
                      <td className="p-2 border-r border-[#17191c] text-right font-mono">₹{li.unitRate.toFixed(2)}</td>
                      <td className="p-2 text-right font-mono font-bold">
                        ₹{li.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Amount In Words & Tax Totals Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-[#17191c] pb-3 pt-1">
                <div className="space-y-2">
                  <div className="p-2.5 bg-[#fafafb] border border-[#ececec] rounded-[10px]">
                    <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">AMOUNT IN WORDS:</span>
                    <span className="font-serif font-normal text-sm text-[#8a6521] italic font-semibold">
                      {numberToWordsINR(activeInv.grandTotal)}
                    </span>
                  </div>

                  {/* Bank Payment & UPI QR Box */}
                  <div className="p-2.5 bg-white border border-[#ececec] rounded-[10px] text-[10px] space-y-1 font-mono">
                    <div className="font-bold text-[#17191c] flex items-center gap-1 font-sans">
                      <CreditCard className="w-3.5 h-3.5 text-[#c09748]" />
                      BANK REMITTANCE DETAILS:
                    </div>
                    <div>Bank: <strong>HDFC Bank Ltd (Haridwar Branch)</strong></div>
                    <div>A/C No: <strong>50200088991122</strong> • IFSC: <strong>HDFC0000123</strong></div>
                    <div>UPI ID: <strong className="text-[#8a6521]">paintking@hdfcbank</strong></div>
                  </div>
                </div>

                {/* Tax Breakdown Grid */}
                <div className="space-y-1.5 text-xs text-right font-mono self-end">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-sans">Taxable Subtotal:</span>
                    <span className="font-bold">₹{activeInv.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span className="font-sans">CGST (9%):</span>
                    <span>₹{(activeInv.cgstAmount ?? Math.round(activeInv.subTotal * 0.09 * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span className="font-sans">SGST (9%):</span>
                    <span>₹{(activeInv.sgstAmount ?? Math.round(activeInv.subTotal * 0.09 * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t border-black pt-1 flex justify-between font-bold text-sm text-[#17191c]">
                    <span className="font-serif">Grand Total (INR):</span>
                    <span className="text-[#8a6521]">₹{activeInv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* QC Stamp & Signatures */}
              <div className="pt-2 flex justify-between items-end text-[10px] text-gray-700">
                <div className="p-2 border border-emerald-300 bg-emerald-50/50 rounded-[8px] max-w-xs space-y-0.5">
                  <div className="font-bold text-emerald-800 flex items-center gap-1 font-sans">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    100% QUALITY COMPLIANT
                  </div>
                  <div className="text-[9px]">ASTM 5B Cross-Cut Adhesion Pass • Spectrophotometer ΔE ≤ 0.70 Approved.</div>
                </div>

                <div className="text-right space-y-8">
                  <div className="text-gray-500 font-sans">For PaintKing Surface Solutions Pvt. Ltd.</div>
                  <div className="font-bold border-t border-black pt-1 px-4 inline-block font-sans text-xs">
                    Authorized Signatory
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium text-xs cursor-pointer hover:bg-[#fafafb] transition"
              >
                Close Preview
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] font-semibold text-xs shadow-sm cursor-pointer transition flex items-center gap-2 active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official PDF / A4 Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
