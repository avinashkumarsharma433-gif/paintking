import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { GoodsReceiptNote, OrderColorSplit, GRNLineItem, MATERIAL_TYPE_OPTIONS, StockMaterialType } from '../types/portalTypes';
import { Boxes, Plus, Trash2, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { isChemicalConsumable } from '../utils/stockEngine';

interface QuickInwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNavigateToJobCards?: () => void;
}

export const QuickInwardModal: React.FC<QuickInwardModalProps> = ({
  isOpen,
  onClose,
  onSuccessNavigateToJobCards
}) => {
  const { addGRN, activePlant, currentUser } = usePortalStore();

  const [customer, setCustomer] = useState('ROOP POLYMERS LTD');
  const [challanNo, setChallanNo] = useState('RP/CH/' + Math.floor(10000 + Math.random() * 90000));
  const [vehicleNo, setVehicleNo] = useState('UK-08-AL-4412');
  const [partName, setPartName] = useState('Auto AC Center Vent Bezel Substrates');
  const [partCode, setPartCode] = useState('RP-8841');
  const [totalQty, setTotalQty] = useState<number>(1000);
  const [batchNo, setBatchNo] = useState<string>(`B-ROO-${Date.now().toString().slice(-4)}`);
  const [materialType, setMaterialType] = useState<StockMaterialType>('substrate');
  const [mfgDate, setMfgDate] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');

  // Dynamic Color Breakdown Rows
  const [colorRows, setColorRows] = useState<Array<{ name: string; code: string; qty: number; rate: number }>>([
    { name: 'Monza Red Gloss', code: 'RD-01', qty: 250, rate: 25 },
    { name: 'Matte Jet Black', code: 'BK-09', qty: 750, rate: 20 }
  ]);

  const [submittedResult, setSubmittedResult] = useState<{
    inwardNo: string;
    customerName: string;
    partName: string;
    receivedQty: number;
    jobCardsGenerated: number;
    grnNo: string;
    totalColors: number;
  } | null>(null);

  if (!isOpen) return null;

  const totalColorAllocated = colorRows.reduce((acc, c) => acc + Number(c.qty || 0), 0);
  const isMatch = totalColorAllocated === Number(totalQty) && Number(totalQty) > 0;

  const handleAddColorRow = () => {
    setColorRows(prev => [
      ...prev,
      { name: 'Piano Black High Gloss', code: `C0${prev.length + 1}`, qty: 0, rate: 22 }
    ]);
  };

  const handleRemoveColorRow = (idx: number) => {
    setColorRows(prev => prev.filter((_, i) => i !== idx));
  };

  const handleColorChange = (idx: number, field: string, val: any) => {
    setColorRows(prev => prev.map((row, i) => i === idx ? { ...row, [field]: val } : row));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const grnNo = `PK-GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const splits: OrderColorSplit[] = colorRows.map(r => ({
      colorName: r.name,
      colorCode: r.code,
      orderedQty: Number(r.qty),
      unitRate: Number(r.rate),
      status: 'Pending'
    }));

    const isChemical = isChemicalConsumable(undefined, undefined, partName);
    const finalBatchNo = batchNo.trim() || `B-${customer.slice(0, 3)}-${Date.now().toString().slice(-4)}`;

    const lineItem: GRNLineItem = {
      id: '1',
      partCode,
      partDescription: partName,
      invoicedQty: Number(totalQty),
      actualReceivedQty: Number(totalQty),
      shortExcessQty: 0,
      okByIqcQty: Number(totalQty),
      rejectionQty: 0,
      supplierBatchNo: finalBatchNo,
      mfgDate: mfgDate || undefined,
      expiryDate: expiryDate || undefined,
      category: materialType === 'substrate' ? 'PARTY_MATERIAL' : 'COMPANY_CONSUMABLE',
      materialType: materialType
    };

    const newGRN: GoodsReceiptNote = {
      grnNo,
      date: new Date().toISOString().split('T')[0],
      plant: activePlant,
      supplierCustomer: customer,
      invoiceChallanNo: challanNo,
      invoiceDate: new Date().toISOString().split('T')[0],
      vehicleNo,
      transporter: 'VRL LOGISTICS',
      partCode,
      description: partName,
      batchNo: finalBatchNo,
      mfgDate: mfgDate || undefined,
      expiryDate: expiryDate || undefined,
      items: [lineItem],
      invoicedQty: Number(totalQty),
      actualReceivedQty: Number(totalQty),
      colorSplits: splits,
      iqcStatus: 'Accepted',
      storeIncharge: currentUser.name,
      remarks: 'Raw material inward verified. Job cards auto-generated.'
    };

    addGRN(newGRN);

    setSubmittedResult({
      inwardNo: grnNo,
      customerName: customer,
      partName: partName,
      receivedQty: Number(totalQty),
      jobCardsGenerated: splits.length,
      grnNo,
      totalColors: splits.length
    });
  };

  const handleResetAndClose = () => {
    setSubmittedResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-[24px] max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-[#ececec] space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* If submitted, show confirmation & next steps */}
        {submittedResult ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-[#c09748]" />
            </div>
            <div>
              <h3 className="text-2xl font-serif font-normal text-[#17191c]">
                Material Inward Record Saved
              </h3>
              <p className="text-xs text-[#777b86] mt-1">
                Document <strong>{submittedResult.inwardNo}</strong> created & registered in Stores Ledger.
              </p>
            </div>

            <div className="p-4 bg-[#fafafb] border border-[#ececec] rounded-[16px] text-xs space-y-1 text-left max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-[#777b86]">Customer:</span>
                <span className="font-semibold text-[#17191c]">{submittedResult.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777b86]">Component:</span>
                <span className="font-semibold text-[#17191c]">{submittedResult.partName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777b86]">Total Accepted:</span>
                <span className="font-mono font-bold text-[#17191c]">{submittedResult.receivedQty} Pcs</span>
              </div>
              <div className="pt-2 border-t border-[#ececec] text-[#8a6521] font-medium">
                ⚡ Auto-Generated {submittedResult.jobCardsGenerated} Separate Color-Capped Job Cards for the shop floor!
              </div>
            </div>

            <div className="flex justify-center gap-2.5 pt-2">
              <button
                onClick={handleResetAndClose}
                className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white hover:bg-[#fafafb] text-[#777b86] text-xs font-semibold cursor-pointer transition"
              >
                Close & Stay on Dashboard
              </button>
              {onSuccessNavigateToJobCards && (
                <button
                  onClick={() => {
                    handleResetAndClose();
                    onSuccessNavigateToJobCards();
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-[#17191c] text-xs font-semibold shadow-sm flex items-center gap-2 cursor-pointer transition"
                >
                  <span>Open Job Cards</span>
                  <ArrowRight className="w-4 h-4 text-[#17191c]" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#ececec]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-full bg-[#faf3e0] text-[#8a6521]">
                  <Boxes className="w-5 h-5 text-[#c09748]" />
                </span>
                <div>
                  <h3 className="text-lg font-serif font-normal text-[#17191c]">
                    New Material Inward (Job Work Receipt)
                  </h3>
                  <p className="text-[11px] text-[#777b86]">
                    Complete 3 simple steps to register incoming party substrates
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="text-[#979799] hover:text-[#17191c] text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* STEP 1: PARTY & CHALLAN DETAILS */}
              <div className="p-4 bg-[#fafafb] rounded-[20px] border border-[#ececec] space-y-2.5">
                <div className="text-[11px] font-bold text-[#c09748] uppercase tracking-[0.16em]">
                  Step 1: Party & Delivery Details
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#777b86] mb-1">
                      Customer / Party Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customer}
                      onChange={e => setCustomer(e.target.value)}
                      placeholder="e.g. ROOP POLYMERS LTD"
                      className="w-full px-3.5 py-2.5 rounded-[16px] bg-[#f4f4f6] hover:bg-[#ececee] focus:bg-white text-[#17191c] font-medium border border-transparent focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/20 text-xs transition-all outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#777b86] mb-1">
                      Party Challan / Delivery Note <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={challanNo}
                      onChange={e => setChallanNo(e.target.value)}
                      placeholder="e.g. RP/CH/99824"
                      className="w-full px-3.5 py-2.5 rounded-[16px] bg-[#f4f4f6] hover:bg-[#ececee] focus:bg-white font-mono text-[#17191c] border border-transparent focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/20 text-xs transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#777b86] mb-1">
                      Vehicle / Truck No <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={vehicleNo}
                      onChange={e => setVehicleNo(e.target.value)}
                      placeholder="e.g. UK-08-AL-4412"
                      className="w-full px-3.5 py-2.5 rounded-[16px] bg-[#f4f4f6] hover:bg-[#ececee] focus:bg-white text-[#17191c] border border-transparent focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/20 text-xs transition-all outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#777b86] mb-1">Target Plant</label>
                    <div className="px-3.5 py-2.5 rounded-[16px] bg-[#f4f4f6] font-medium text-[#17191c] text-xs">
                      {activePlant} Plant
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 2: PART & TOTAL PIECES */}
              <div className="p-4 bg-[#fafafb] rounded-[20px] border border-[#ececec] space-y-2.5">
                <div className="text-[11px] font-bold text-[#c09748] uppercase tracking-[0.16em]">
                  Step 2: Component & Total Quantity Received
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#777b86] mb-1">
                      Material Classification *
                    </label>
                    <select
                      value={materialType}
                      onChange={e => setMaterialType(e.target.value as StockMaterialType)}
                      className="w-full px-3 py-2.5 rounded-[16px] bg-[#f4f4f6] font-semibold text-[#17191c] border border-transparent focus:border-[#c09748] text-xs transition-all outline-none"
                    >
                      {MATERIAL_TYPE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-[#777b86] mb-1">
                      Part / Material Description <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={partName}
                      onChange={e => setPartName(e.target.value)}
                      placeholder="e.g. PPG Rosso Corsa 932 / Vent Bezel"
                      className="w-full px-3.5 py-2.5 rounded-[16px] bg-[#f4f4f6] hover:bg-[#ececee] focus:bg-white font-medium text-[#17191c] border border-transparent focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/20 text-xs transition-all outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#777b86] mb-1">
                      Total Quantity <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={totalQty}
                      onChange={e => setTotalQty(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3.5 py-2 rounded-[16px] bg-[#faf7ed] border border-[#f4e5be] focus:bg-white font-serif text-base font-bold text-[#8a6521] focus:outline-none focus:ring-2 focus:ring-[#c09748]/20 transition-all"
                      min={1}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* STEP 2.5: BATCH TRACEABILITY & EXPIRY (PK-OS STORE UPGRADE) */}
              <div className="p-4 bg-[#fafafb] rounded-[20px] border border-[#ececec] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold text-[#c09748] uppercase tracking-[0.16em]">
                    Batch Traceability & Shelf-Life
                  </div>
                  {isChemicalConsumable(undefined, undefined, partName) ? (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      FEFO Mandatory *
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#777b86]">Standard Batch Tag</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#777b86] mb-1">
                      Batch / Lot No {isChemicalConsumable(undefined, undefined, partName) && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={batchNo}
                      onChange={e => setBatchNo(e.target.value)}
                      placeholder="e.g. B-ROO-9912"
                      required={isChemicalConsumable(undefined, undefined, partName)}
                      className="w-full px-3.5 py-2.5 rounded-[16px] bg-[#f4f4f6] hover:bg-[#ececee] focus:bg-white font-mono font-bold text-[#17191c] border border-transparent focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/20 text-xs transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#777b86] mb-1">
                      Mfg Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={mfgDate}
                      onChange={e => setMfgDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[16px] bg-[#f4f4f6] hover:bg-[#ececee] focus:bg-white font-mono text-[#17191c] border border-transparent focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/20 text-xs transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 3: COLOR-WISE REQUIREMENT (PROBLEM 1 FIX) */}
              <div className="p-4 bg-[#faf3e0]/60 rounded-[20px] border border-[#f4e5be] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-[#8a6521] uppercase tracking-[0.16em]">
                      Step 3: Color-Wise Allocation (Contract Requirement)
                    </div>
                    <div className="text-[11px] text-[#777b86]">
                      Assign exact color quantities (e.g. 250 Red + 750 Black)
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddColorRow}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#f4e5be] hover:bg-[#faf7ed] text-[#8a6521] text-[11px] font-semibold cursor-pointer transition shadow-2xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#c09748]" />
                    <span>+ Add Color</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {colorRows.map((row, idx) => (
                    <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-3 bg-white rounded-[18px] border border-[#ececec] shadow-2xs">
                      <div className="flex-1 min-w-[130px]">
                        <label className="block text-[10px] text-[#777b86] font-semibold mb-0.5">Color Name</label>
                        <input
                          type="text"
                          value={row.name}
                          onChange={e => handleColorChange(idx, 'name', e.target.value)}
                          placeholder="Color Name"
                          className="w-full px-3 py-1.5 rounded-[12px] bg-[#f4f4f6] text-xs font-medium text-[#17191c] outline-none focus:bg-white focus:ring-1 focus:ring-[#c09748]"
                          required
                        />
                      </div>
                      <div className="w-20">
                        <label className="block text-[10px] text-[#777b86] font-semibold mb-0.5">Code</label>
                        <input
                          type="text"
                          value={row.code}
                          onChange={e => handleColorChange(idx, 'code', e.target.value)}
                          placeholder="Code"
                          className="w-full px-3 py-1.5 rounded-[12px] bg-[#f4f4f6] text-xs font-mono text-[#17191c] outline-none focus:bg-white focus:ring-1 focus:ring-[#c09748]"
                          required
                        />
                      </div>
                      <div className="w-28">
                        <label className="block text-[10px] text-[#777b86] font-semibold mb-0.5">Target Qty</label>
                        <input
                          type="number"
                          value={row.qty}
                          onChange={e => handleColorChange(idx, 'qty', Math.max(0, Number(e.target.value)))}
                          placeholder="Qty"
                          className="w-full px-3 py-1.5 rounded-[12px] bg-[#faf7ed] border border-[#f4e5be] text-xs font-bold text-[#8a6521] outline-none"
                          min={0}
                          required
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-[10px] text-[#777b86] font-semibold mb-0.5">Rate (₹/pc)</label>
                        <input
                          type="number"
                          value={row.rate}
                          onChange={e => handleColorChange(idx, 'rate', Math.max(0, Number(e.target.value)))}
                          placeholder="Rate"
                          className="w-full px-3 py-1.5 rounded-[12px] bg-[#f4f4f6] text-xs font-mono text-[#17191c] outline-none focus:bg-white focus:ring-1 focus:ring-[#c09748]"
                          required
                        />
                      </div>
                      {colorRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveColorRow(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-full mt-3.5 cursor-pointer transition active:scale-95"
                          title="Remove Color"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Calculation Validation Pill */}
                <div className={`p-3 rounded-[16px] border flex items-center justify-between text-xs ${
                  isMatch ? 'bg-[#fafafb] border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-300 text-red-900'
                }`}>
                  <span>
                    Allocated: <strong>{totalColorAllocated} pcs</strong> of <strong>{totalQty} pcs</strong>
                  </span>
                  <span className="font-semibold text-[11px]">
                    {isMatch ? '✓ Quantities Perfectly Balanced' : `⚠️ Mismatch: ${totalQty - totalColorAllocated} pcs remaining`}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white hover:bg-[#fafafb] text-[#777b86] font-medium cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isMatch}
                  className={`px-6 py-2.5 rounded-full text-xs font-semibold shadow-sm transition cursor-pointer flex items-center gap-2 ${
                    isMatch
                      ? 'bg-[#c09748] hover:bg-[#a97e35] text-[#17191c]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-[#17191c]" />
                  <span>Save Inward & Generate Job Cards</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
