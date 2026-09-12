import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { BillingInvoice } from '../types/portalTypes';
import { 
  ReceiptText, 
  Printer, 
  ShieldCheck 
} from 'lucide-react';

export const BillingView: React.FC = () => {
  const { 
    billingInvoices, 
    toggleInvoiceExcessApproval, 
    qualityReleases,
    generateNewInvoiceFromPDI,
    activePlant 
  } = usePortalStore();

  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState<string>(
    billingInvoices[0]?.invoiceNo || ''
  );
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Active Invoice lookup (defaults to first available or selected)
  const activeInv = billingInvoices.find(inv => inv.invoiceNo === selectedInvoiceNo) || billingInvoices[0] || null;

  // Pending OQC releases that don't have an invoice generated yet
  const availableOqcOrders = qualityReleases.filter(
    r => r.pdiStatus === 'Cleared for Invoicing'
  );

  return (
    <div className="space-y-6">
      {/* ISO Header Banner */}
      <div className="bg-white rounded-[24px] p-6 border border-[#ececec] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
              PK-ACC-INV-001 • COMMERCIAL DESK
            </span>
            <span className="text-xs text-[#777b86]">
              Customer PO vs Shopfloor Production vs Tax Invoice Reconciliation
            </span>
          </div>
          <h1 className="text-3xl font-serif font-normal text-[#17191c] tracking-tight">
            Smart Billing & PO Reconciliation Desk
          </h1>
          <p className="text-xs text-[#777b86] mt-1">
            Billed strictly on inspected & passed pieces with transparent color line-item breakdown
          </p>
        </div>

        {activeInv && (
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-semibold shadow-sm transition cursor-pointer w-full md:w-auto active:scale-95"
          >
            <Printer className="w-4 h-4 text-[#17191c]" />
            <span>Print Official Tax Invoice / Challan</span>
          </button>
        )}
      </div>

      {/* Invoice Selector Dropdown & Cleared OQC Work Orders Bar */}
      <div className="bg-white rounded-[20px] p-4 border border-[#ececec] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777b86] mb-1">
            Select Active Tax Invoice / Customer Order ({billingInvoices.length} Invoices):
          </label>
          <select
            value={activeInv?.invoiceNo || ''}
            onChange={e => setSelectedInvoiceNo(e.target.value)}
            className="w-full p-2.5 rounded-[14px] border border-[#ececec] bg-[#fafafb] font-mono font-bold text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none cursor-pointer"
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

      {/* Ground Problem 1 Ground Reality Card */}
      <div className="bg-[#faf3e0] border border-[#f4e5be] rounded-[24px] p-5 shadow-sm text-xs text-[#17191c] space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-serif font-normal text-base text-[#17191c] flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-[#c09748]" />
            PaintKing Billing Logic: How Color Variances Are Reconciled
          </div>
          <span className="px-3 py-1 rounded-full bg-[#c09748] text-[#17191c] text-[10px] font-bold">
            Zero Floor Over-Billing
          </span>
        </div>
        <p className="leading-relaxed text-[#777b86]">
          When a customer supplies raw material for multiple colors (e.g. 250 Red + 750 Black), billing is generated 
          <strong className="text-[#17191c]"> strictly for accepted and cleared pieces</strong>. 
          If the floor paints 300 Red (+50 excess), the extra 50 are placed in a <em>"Finished Goods Buffer"</em> and 
          <strong className="text-[#17191c]"> NOT charged to the customer</strong> unless commercial approval is confirmed. 
          The missing 50 Black pieces remain as an open production backlog ticket.
        </p>
      </div>

      {/* Active Invoices List & Reconciliation Canvas */}
      {activeInv && (
        <div className="space-y-4">
          <div className="bg-white rounded-[24px] border border-[#ececec] p-6 shadow-sm space-y-6">
            {/* Invoice Metadata Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-4 border-b border-[#f2f2f3] gap-4">
              <div>
                <span className="text-[11px] font-mono text-[#c09748] font-bold px-2.5 py-0.5 rounded-full bg-[#faf7ed] border border-[#f4e5be] inline-block whitespace-nowrap">
                  INVOICE NO: {activeInv.invoiceNo}
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-normal text-[#17191c] mt-1">{activeInv.customer}</h3>
                <div className="text-xs text-[#777b86] flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 font-mono">
                  <span className="whitespace-nowrap">Work Order: <strong className="text-[#17191c]">{activeInv.woNo}</strong></span>
                  <span className="text-[#a3a6af] shrink-0">•</span>
                  <span className="whitespace-nowrap">Date: <strong className="text-[#17191c]">{activeInv.invoiceDate}</strong></span>
                  <span className="text-[#a3a6af] shrink-0">•</span>
                  <span className="whitespace-nowrap">Plant: <strong className="text-[#17191c]">{activeInv.plant}</strong></span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
                <span className="px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  OQC & PDI Cleared
                </span>
                <span className="px-3.5 py-1 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-xs font-semibold whitespace-nowrap">
                  Status: {activeInv.status}
                </span>
              </div>
            </div>

            {/* 3-Way Reconciliation Line-Item Breakdown Table */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#777b86] mb-3">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-5 rounded-[20px] bg-[#fafafb] border border-[#ececec] text-xs space-y-2.5">
                <div className="font-semibold text-[#17191c]">Floor Balance & Backlog Note:</div>
                <p className="text-[#777b86] leading-relaxed">
                  {activeInv.balanceBacklogNote || 'All order balances reconciled with shopfloor shift logs.'}
                </p>
                <div className="pt-2 border-t border-[#ececec] text-[11px] text-[#777b86]">
                  Prepared by: <strong className="text-[#17191c]">{activeInv.preparedBy}</strong>
                </div>
              </div>

              <div className="p-5 rounded-[20px] bg-[#fafafb] border border-[#ececec] text-xs space-y-2.5">
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

      {/* Official Tax Invoice Print Modal */}
      {showPrintModal && activeInv && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-[#ececec] max-h-[90vh] overflow-y-auto no-scrollbar space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
              <span className="text-xs font-mono text-[#c09748] font-bold">
                PK-TAX-INV-PRINT • OFFICIAL CHALLAN PREVIEW (HSN 9988)
              </span>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-[#979799] hover:text-[#17191c] text-base font-bold cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {/* Official GST Paper Invoice Layout */}
            <div className="border border-black p-5 text-xs text-[#17191c] space-y-3 font-sans bg-white">
              <div className="text-center border-b pb-2.5 border-black">
                <h2 className="text-lg font-serif font-normal tracking-wide">
                  PAINTKING SOLUTIONS PVT. LTD.
                </h2>
                <div className="text-[10px] text-gray-600">
                  Plot No. 42, Sector 8A, SIDCUL Industrial Area, Haridwar, Uttarakhand - 249403
                </div>
                <div className="text-[10px] font-mono">
                  GSTIN: 05AABCP9912K1Z4 • PAN: AABCP9912K • State Code: 05
                </div>
                <div className="text-xs font-bold uppercase mt-1">
                  TAX INVOICE & DELIVERY CHALLAN (JOB WORK - HSN 9988)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-black pb-2 text-[11px]">
                <div>
                  <div className="text-gray-500 font-semibold">BILLED TO:</div>
                  <div className="font-bold text-sm">{activeInv.customer}</div>
                  <div>Plot No. 18, Industrial Estate, Gurugram, Haryana</div>
                  <div>GSTIN: 06AABCR1234M1Z2</div>
                </div>
                <div className="text-right">
                  <div>Invoice No: <strong>{activeInv.invoiceNo}</strong></div>
                  <div>Date: <strong>{activeInv.invoiceDate}</strong></div>
                  <div>Challan Ref: <strong>RP/CH/99824</strong></div>
                  <div>Vehicle No: <strong>DL-01-EE-7741</strong></div>
                </div>
              </div>

              <table className="w-full text-left text-[10px] border border-black">
                <thead className="bg-gray-100 border-b border-black font-bold">
                  <tr>
                    <th className="p-1.5 border-r border-black">Sr.</th>
                    <th className="p-1.5 border-r border-black">Description of Job Work Service</th>
                    <th className="p-1.5 border-r border-black text-center">HSN Code</th>
                    <th className="p-1.5 border-r border-black text-center">Billed Qty</th>
                    <th className="p-1.5 border-r border-black text-right">Rate ₹</th>
                    <th className="p-1.5 text-right">Amount ₹</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {activeInv.lineItems.map((li, idx) => (
                    <tr key={li.id}>
                      <td className="p-1.5 border-r border-black">{idx + 1}</td>
                      <td className="p-1.5 border-r border-black">
                        Surface Coating & Finishing - {li.colorName}
                        {li.excessApprovedByClient && <span className="block text-[9px] text-gray-500">(Includes +50 approved excess)</span>}
                      </td>
                      <td className="p-1.5 border-r border-black text-center font-mono font-semibold">9988</td>
                      <td className="p-1.5 border-r border-black text-center font-bold">{li.billableQty} pcs</td>
                      <td className="p-1.5 border-r border-black text-right font-mono">₹{li.unitRate.toFixed(2)}</td>
                      <td className="p-1.5 text-right font-mono font-bold">
                        ₹{li.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-start pt-2">
                <div className="text-[10px] text-gray-600 max-w-xs leading-relaxed">
                  <strong>Declaration:</strong> Certified that all parts have passed 100% adhesion cross-cut test and spectrophotometer Delta-E &lt; 0.70 colorimetry inspection. Job work carried out under HSN 9988.
                </div>
                <div className="w-56 text-[11px] space-y-1 text-right">
                  <div className="flex justify-between">
                    <span>Taxable Value:</span>
                    <span className="font-mono font-bold">₹{activeInv.subTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>CGST (9%):</span>
                    <span className="font-mono">₹{(activeInv.cgstAmount ?? Math.round(activeInv.subTotal * 0.09 * 100) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>SGST (9%):</span>
                    <span className="font-mono">₹{(activeInv.sgstAmount ?? Math.round(activeInv.subTotal * 0.09 * 100) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700 font-semibold border-t border-gray-300 pt-0.5">
                    <span>Total GST (18%):</span>
                    <span className="font-mono">₹{(Math.round(activeInv.subTotal * 0.18 * 100) / 100).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-black pt-1 flex justify-between font-bold text-sm">
                    <span>Grand Total:</span>
                    <span className="font-mono">₹{activeInv.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-black pt-6 flex justify-between text-[10px] text-gray-700">
                <div>Prepared by: {activeInv.preparedBy}</div>
                <div>Authorized Signatory (PaintKing Solutions)</div>
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
                className="px-6 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] font-semibold text-xs shadow-sm cursor-pointer transition flex items-center gap-2"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print to PDF / Printer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
