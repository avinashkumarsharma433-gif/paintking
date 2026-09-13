import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { GoodsReceiptNote, GRNLineItem, OrderColorSplit } from '../types/portalTypes';
import { Plus, Trash2, Save, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface CreateGRNModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateGRNModal: React.FC<CreateGRNModalProps> = ({ isOpen, onClose }) => {
  const { addGRN, activePlant, currentUser, materialInwardLogs } = usePortalStore();

  // Pick a gate receipt to auto-fill if available
  const latestGateInward = materialInwardLogs[0];

  // Header State (Exact Image 2 Header)
  const [grnNo, setGrnNo] = useState<string>(`PK-GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [vehicleNo, setVehicleNo] = useState<string>(latestGateInward?.vehicleNo || 'UK-08-AL-4412');
  const [supplierCustomer, setSupplierCustomer] = useState<string>(latestGateInward?.partyName || 'ROOP POLYMERS LTD');
  const [invoiceChallanNo, setInvoiceChallanNo] = useState<string>(latestGateInward?.challanNo || 'RP/CH/99824');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [receivedDate, setReceivedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [transportName, setTransportName] = useState<string>('VRL LOGISTICS');
  const [storeIncharge, setStoreIncharge] = useState<string>(currentUser.name || 'Manoj Tiwari');
  const [qualityApprovedBy, setQualityApprovedBy] = useState<string>('Amit Verma (QA Lead)');
  const [approvedBy, setApprovedBy] = useState<string>('Satish Sharma (Plant Head)');
  const [remarks, setRemarks] = useState<string>('Physical box count match. Quality inspection verified.');

  // Customer Color Splits for Job Cards
  const [colorSplits, setColorSplits] = useState<OrderColorSplit[]>([
    { colorName: 'Monza Red Gloss', colorCode: 'RD-01', orderedQty: 250, unitRate: 25 },
    { colorName: 'Matte Jet Black', colorCode: 'BK-09', orderedQty: 750, unitRate: 20 }
  ]);

  // Line Items Table (Exact Image 2 Columns)
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
      remark: 'Visual substrate check clear'
    }
  ]);

  if (!isOpen) return null;

  // Add Item Row
  const handleAddItemRow = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        partCode: 'SUBSTRATE-NEW',
        partDescription: 'Raw Component Substrate',
        invoicedQty: 500,
        actualReceivedQty: 500,
        shortExcessQty: 0,
        okByIqcQty: 500,
        rejectionQty: 0,
        remark: 'Received intact'
      }
    ]);
  };

  // Remove Item Row
  const handleRemoveItemRow = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(i => i.id !== id));
  };

  // Update Item Row
  const handleUpdateItem = (id: string, field: keyof GRNLineItem, val: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: val };
      if (field === 'invoicedQty' || field === 'actualReceivedQty') {
        const inv = Number(field === 'invoicedQty' ? val : item.invoicedQty) || 0;
        const act = Number(field === 'actualReceivedQty' ? val : item.actualReceivedQty) || 0;
        updated.shortExcessQty = act - inv;
      }
      return updated;
    }));
  };

  // Color Splits Helpers
  const addColorSplit = () => {
    setColorSplits([
      ...colorSplits,
      { colorName: 'Pearl White Gloss', colorCode: 'WT-03', orderedQty: 200, unitRate: 22 }
    ]);
  };

  const removeColorSplit = (index: number) => {
    setColorSplits(colorSplits.filter((_, i) => i !== index));
  };

  const updateColorSplit = (index: number, field: keyof OrderColorSplit, val: any) => {
    const next = [...colorSplits];
    next[index] = { ...next[index], [field]: val };
    setColorSplits(next);
  };

  // Total Received Qty Calculation
  const totalReceivedQty = items.reduce((sum, item) => sum + (Number(item.actualReceivedQty) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newGRN: GoodsReceiptNote = {
      docNo: 'DOC NO: 00',
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
      totalQty: totalReceivedQty,
      iqcStatus: 'Accepted',
      storeIncharge,
      qualityApprovedBy,
      approvedBy,
      remarks,
      colorSplits,
      partCode: items[0]?.partCode || 'SUBSTRATE',
      description: items[0]?.partDescription || 'Raw Parts',
      invoicedQty: items[0]?.invoicedQty || totalReceivedQty,
      actualReceivedQty: totalReceivedQty
    };

    addGRN(newGRN);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[24px] max-w-4xl w-full p-6 shadow-2xl border border-[#ececec] space-y-5 max-h-[94vh] overflow-y-auto no-scrollbar">
        
        {/* Document Header Stamp (Exact Image 2 Header) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#ececec] gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#17191c] text-[#c09748] text-[10px] font-mono uppercase font-bold tracking-wider">
                Paintking Solutions Pvt Ltd.
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase font-bold">
                DOC NO: 00 • Rev.No: 00
              </span>
            </div>
            <h2 className="text-2xl font-serif text-[#17191c] font-bold mt-1">
              Goods Received Note (GRN)
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-[#17191c] font-bold flex items-center justify-center cursor-pointer self-end sm:self-auto"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          {/* Header 8 Fields Grid (Exact Image 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#fafafb] p-4 rounded-[16px] border border-[#ececec]">
            <div>
              <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1">
                GRN No - *
              </label>
              <input
                type="text"
                required
                value={grnNo}
                onChange={e => setGrnNo(e.target.value)}
                className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-mono font-bold text-[#c09748] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1">
                DATE *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-medium text-[#17191c] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1">
                Vehicle No - *
              </label>
              <input
                type="text"
                required
                value={vehicleNo}
                onChange={e => setVehicleNo(e.target.value)}
                placeholder="e.g. UK-08-AL-4412"
                className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-mono font-bold text-[#17191c] uppercase focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1">
                Supplier / Party - *
              </label>
              <input
                type="text"
                required
                value={supplierCustomer}
                onChange={e => setSupplierCustomer(e.target.value)}
                placeholder="e.g. ROOP POLYMERS LTD"
                className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-semibold text-[#17191c] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1">
                Invoiced / Challan No. *
              </label>
              <input
                type="text"
                required
                value={invoiceChallanNo}
                onChange={e => setInvoiceChallanNo(e.target.value)}
                placeholder="e.g. RP/CH/99824"
                className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-mono font-semibold text-[#17191c] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1">
                Invoiced / Challan Date *
              </label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-medium text-[#17191c] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1">
                Received Date *
              </label>
              <input
                type="date"
                required
                value={receivedDate}
                onChange={e => setReceivedDate(e.target.value)}
                className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-medium text-[#17191c] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1">
                Transport Name *
              </label>
              <input
                type="text"
                required
                value={transportName}
                onChange={e => setTransportName(e.target.value)}
                placeholder="e.g. VRL LOGISTICS / SAFEEXPRESS"
                className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-semibold text-[#17191c] focus:outline-none"
              />
            </div>
          </div>

          {/* Line Items Table (Exact Image 2 Columns) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#ececec] pb-2">
              <span className="text-[11px] font-bold text-[#17191c] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <FileText className="w-4 h-4 text-[#c09748]" />
                GRN Line Items Received (Exact Screenshot 2 Table Columns):
              </span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="px-3 py-1 rounded-full bg-[#17191c] text-[#c09748] text-[11px] font-bold hover:bg-black transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> + Add Part Code Row
              </button>
            </div>

            <div className="overflow-x-auto border border-[#ececec] rounded-[16px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#17191c] text-white font-semibold uppercase text-[10px] tracking-wider">
                    <th className="p-2.5 border-r border-[#333]">Part Code</th>
                    <th className="p-2.5 border-r border-[#333] min-w-[200px]">Part Description</th>
                    <th className="p-2.5 border-r border-[#333] text-center">Invoiced Qty</th>
                    <th className="p-2.5 border-r border-[#333] text-center">Actual Received</th>
                    <th className="p-2.5 border-r border-[#333] text-center">Short - Excess</th>
                    <th className="p-2.5 border-r border-[#333] text-center">Ok By IQC</th>
                    <th className="p-2.5 border-r border-[#333] text-center">Rej. Qty</th>
                    <th className="p-2.5 border-r border-[#333]">Remark</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececec] bg-white text-[#17191c]">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#fafafb]">
                      <td className="p-2 border-r border-[#ececec]">
                        <input
                          type="text"
                          required
                          value={item.partCode}
                          onChange={e => handleUpdateItem(item.id!, 'partCode', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-[#ececec] font-mono font-bold text-[11px] text-[#17191c]"
                        />
                      </td>
                      <td className="p-2 border-r border-[#ececec]">
                        <input
                          type="text"
                          required
                          value={item.partDescription}
                          onChange={e => handleUpdateItem(item.id!, 'partDescription', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-[#ececec] font-semibold text-[11px] text-[#17191c]"
                        />
                      </td>
                      <td className="p-2 border-r border-[#ececec] text-center">
                        <input
                          type="number"
                          required
                          min="1"
                          value={item.invoicedQty}
                          onChange={e => handleUpdateItem(item.id!, 'invoicedQty', Number(e.target.value))}
                          className="w-20 p-1.5 rounded-lg border border-[#ececec] font-mono font-bold text-center text-[#17191c]"
                        />
                      </td>
                      <td className="p-2 border-r border-[#ececec] text-center">
                        <input
                          type="number"
                          required
                          min="1"
                          value={item.actualReceivedQty}
                          onChange={e => handleUpdateItem(item.id!, 'actualReceivedQty', Number(e.target.value))}
                          className="w-20 p-1.5 rounded-lg border border-[#ececec] font-mono font-bold text-center text-emerald-800 bg-emerald-50/50"
                        />
                      </td>
                      <td className="p-2 border-r border-[#ececec] text-center font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                          item.shortExcessQty < 0 
                            ? 'bg-red-100 text-red-700' 
                            : item.shortExcessQty > 0 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.shortExcessQty > 0 ? `+${item.shortExcessQty}` : item.shortExcessQty}
                        </span>
                      </td>
                      <td className="p-2 border-r border-[#ececec] text-center">
                        <input
                          type="number"
                          required
                          min="0"
                          value={item.okByIqcQty}
                          onChange={e => handleUpdateItem(item.id!, 'okByIqcQty', Number(e.target.value))}
                          className="w-20 p-1.5 rounded-lg border border-[#ececec] font-mono font-bold text-center text-emerald-700"
                        />
                      </td>
                      <td className="p-2 border-r border-[#ececec] text-center">
                        <input
                          type="number"
                          required
                          min="0"
                          value={item.rejectionQty}
                          onChange={e => handleUpdateItem(item.id!, 'rejectionQty', Number(e.target.value))}
                          className="w-20 p-1.5 rounded-lg border border-[#ececec] font-mono font-bold text-center text-red-600"
                        />
                      </td>
                      <td className="p-2 border-r border-[#ececec]">
                        <input
                          type="text"
                          value={item.remark || ''}
                          onChange={e => handleUpdateItem(item.id!, 'remark', e.target.value)}
                          placeholder="e.g. Visual check OK"
                          className="w-full p-1.5 rounded-lg border border-[#ececec] text-[11px]"
                        />
                      </td>
                      <td className="p-2 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(item.id!)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Table Total QTY Footer (Exact Image 2 Footer) */}
                  <tr className="bg-[#fafafb] font-bold text-[#17191c] border-t-2 border-[#ececec]">
                    <td colSpan={3} className="p-2.5 text-right uppercase tracking-wider font-mono text-[11px] text-[#777b86]">
                      Total QTY Received:
                    </td>
                    <td className="p-2.5 text-center font-mono text-sm text-[#c09748]">
                      {totalReceivedQty} pcs
                    </td>
                    <td colSpan={5} className="p-2.5 text-gray-500 font-normal text-[11px]">
                      Verified physical intake across {items.length} line items
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Color Breakdown Splits for Job Cards */}
          <div className="bg-[#faf3e0]/50 p-4 rounded-[16px] border border-[#f4e5be] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8a6521] uppercase tracking-wider font-mono">
                Customer Color Breakdown (Auto-Generates Sub-Job Cards):
              </span>
              <button
                type="button"
                onClick={addColorSplit}
                className="px-2.5 py-1 rounded-full bg-[#c09748] text-[#17191c] text-[10px] font-bold hover:bg-[#a97e35] cursor-pointer"
              >
                + Add Color Requirement
              </button>
            </div>

            <div className="space-y-2">
              {colorSplits.map((cs, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-[12px] border border-[#f4e5be]">
                  <input
                    type="text"
                    placeholder="Color Name (e.g. Monza Red Gloss)"
                    value={cs.colorName}
                    onChange={e => updateColorSplit(idx, 'colorName', e.target.value)}
                    className="flex-1 p-1.5 rounded-lg border border-[#ececec] text-xs font-semibold"
                  />
                  <input
                    type="text"
                    placeholder="Code (e.g. RD-01)"
                    value={cs.colorCode}
                    onChange={e => updateColorSplit(idx, 'colorCode', e.target.value)}
                    className="w-24 p-1.5 rounded-lg border border-[#ececec] text-xs font-mono font-bold"
                  />
                  <input
                    type="number"
                    placeholder="Qty (Target Cap)"
                    value={cs.orderedQty}
                    onChange={e => updateColorSplit(idx, 'orderedQty', Number(e.target.value))}
                    className="w-28 p-1.5 rounded-lg border border-[#ececec] text-xs font-mono font-bold text-center"
                  />
                  <input
                    type="number"
                    placeholder="Rate ₹"
                    value={cs.unitRate}
                    onChange={e => updateColorSplit(idx, 'unitRate', Number(e.target.value))}
                    className="w-24 p-1.5 rounded-lg border border-[#ececec] text-xs font-mono text-center"
                  />
                  {colorSplits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeColorSplit(idx)}
                      className="text-red-500 p-1 hover:bg-red-50 rounded-full cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Signatures (Exact Image 2 Footer) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#fafafb] p-4 rounded-[16px] border border-[#ececec]">
            <div>
              <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1">
                Store Incharge :- *
              </label>
              <input
                type="text"
                required
                value={storeIncharge}
                onChange={e => setStoreIncharge(e.target.value)}
                className="w-full p-2 rounded-[10px] border border-[#ececec] bg-white font-semibold text-[#17191c]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1">
                Quality Approved:- *
              </label>
              <input
                type="text"
                required
                value={qualityApprovedBy}
                onChange={e => setQualityApprovedBy(e.target.value)}
                className="w-full p-2 rounded-[10px] border border-[#ececec] bg-white font-semibold text-[#17191c]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1">
                Approved By:- *
              </label>
              <input
                type="text"
                required
                value={approvedBy}
                onChange={e => setApprovedBy(e.target.value)}
                className="w-full p-2 rounded-[10px] border border-[#ececec] bg-white font-semibold text-[#17191c]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-1">
              General Remarks
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-medium text-[#17191c]"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-[#ececec]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#17191c] text-[#c09748] font-bold cursor-pointer hover:bg-black flex items-center gap-2 shadow-md"
            >
              <Save className="w-4 h-4 text-[#c09748]" />
              Save Official GRN & Auto-Generate Job Cards
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
