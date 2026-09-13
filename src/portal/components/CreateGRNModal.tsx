import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { GoodsReceiptNote, GRNLineItem, OrderColorSplit } from '../types/portalTypes';
import { Plus, Trash2, Save, FileText, CheckCircle2, Truck, Package, ShieldCheck, Layers, ArrowRight } from 'lucide-react';

interface CreateGRNModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateGRNModal: React.FC<CreateGRNModalProps> = ({ isOpen, onClose }) => {
  const { addGRN, activePlant, currentUser, materialInwardLogs } = usePortalStore();

  const latestGateInward = materialInwardLogs[0];
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Header State
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

  // Line Items
  const [items, setItems] = useState<GRNLineItem[]>([
    {
      id: '1',
      partCode: 'RP-8841',
      partDescription: 'Auto AC Center Vent Bezel Substrate (ABS)',
      invoicedQty: 1000,
      actualReceivedQty: 1000,
      shortExcessQty: 0,
      okByIqcQty: 990,
      rejectionQty: 10,
      remark: 'Visual substrate check clear'
    }
  ]);

  if (!isOpen) return null;

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

  const handleRemoveItemRow = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(i => i.id !== id));
  };

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-[24px] max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-[#ececec] space-y-6 max-h-[92vh] overflow-y-auto no-scrollbar">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[#ececec]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#17191c] text-[#c09748] text-[10px] font-mono font-bold uppercase tracking-wider">
                STORE INWARD DESK
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-mono font-bold">
                DOC NO: 00 • Rev.00
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif text-[#17191c] font-bold">
              Goods Received Note (GRN) Intake
            </h2>
          </div>

          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#fafafb] hover:bg-gray-200 text-[#17191c] font-bold flex items-center justify-center cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        {/* Responsive Step Progress Navigation */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 border-b border-[#ececec] pb-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`p-2.5 rounded-[16px] border text-left transition cursor-pointer flex items-center gap-2 ${
              activeStep === 1 
                ? 'bg-[#17191c] text-[#c09748] border-[#17191c] shadow-xs' 
                : 'bg-[#fafafb] text-[#777b86] border-[#ececec] hover:bg-gray-100'
            }`}
          >
            <Truck className="w-4 h-4 text-[#c09748] shrink-0" />
            <div className="truncate">
              <div className="font-bold text-[11px]">1. Header & Transport</div>
              <div className="text-[10px] opacity-75 truncate">8 Primary Fields</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`p-2.5 rounded-[16px] border text-left transition cursor-pointer flex items-center gap-2 ${
              activeStep === 2 
                ? 'bg-[#17191c] text-[#c09748] border-[#17191c] shadow-xs' 
                : 'bg-[#fafafb] text-[#777b86] border-[#ececec] hover:bg-gray-100'
            }`}
          >
            <Package className="w-4 h-4 text-[#c09748] shrink-0" />
            <div className="truncate">
              <div className="font-bold text-[11px]">2. Material Items ({items.length})</div>
              <div className="text-[10px] opacity-75 truncate">Short/Excess Calc</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className={`p-2.5 rounded-[16px] border text-left transition cursor-pointer flex items-center gap-2 ${
              activeStep === 3 
                ? 'bg-[#17191c] text-[#c09748] border-[#17191c] shadow-xs' 
                : 'bg-[#fafafb] text-[#777b86] border-[#ececec] hover:bg-gray-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#c09748] shrink-0" />
            <div className="truncate">
              <div className="font-bold text-[11px]">3. Colors & Approvals</div>
              <div className="text-[10px] opacity-75 truncate">IQC Stamps & Job Caps</div>
            </div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* STEP 1: HEADER & TRANSPORT DETAILS (8 Fields) */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                  General Transport & Supplier Information (8 Fields)
                </span>
                <span className="text-xs text-[#777b86]">Step 1 of 3</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#fafafb] p-4 sm:p-5 rounded-[20px] border border-[#ececec]">
                
                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                    GRN No - *
                  </label>
                  <input
                    type="text"
                    required
                    value={grnNo}
                    onChange={e => setGrnNo(e.target.value)}
                    className="w-full p-3 rounded-[16px] border border-[#ececec] bg-white font-mono font-bold text-[#c09748] focus:border-[#c09748] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                    DATE *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full p-3 rounded-[16px] border border-[#ececec] bg-white font-medium text-[#17191c] focus:border-[#c09748] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                    Vehicle No - *
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleNo}
                    onChange={e => setVehicleNo(e.target.value)}
                    placeholder="e.g. UK-08-AL-4412"
                    className="w-full p-3 rounded-[16px] border border-[#ececec] bg-white font-mono font-bold text-[#17191c] uppercase focus:border-[#c09748] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                    Supplier / Party - *
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierCustomer}
                    onChange={e => setSupplierCustomer(e.target.value)}
                    placeholder="e.g. ROOP POLYMERS LTD"
                    className="w-full p-3 rounded-[16px] border border-[#ececec] bg-white font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                    Invoiced / Challan No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceChallanNo}
                    onChange={e => setInvoiceChallanNo(e.target.value)}
                    placeholder="e.g. RP/CH/99824"
                    className="w-full p-3 rounded-[16px] border border-[#ececec] bg-white font-mono font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                    Invoiced / Challan Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={e => setInvoiceDate(e.target.value)}
                    className="w-full p-3 rounded-[16px] border border-[#ececec] bg-white font-medium text-[#17191c] focus:border-[#c09748] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                    Received Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={receivedDate}
                    onChange={e => setReceivedDate(e.target.value)}
                    className="w-full p-3 rounded-[16px] border border-[#ececec] bg-white font-medium text-[#17191c] focus:border-[#c09748] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                    Transport Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={transportName}
                    onChange={e => setTransportName(e.target.value)}
                    placeholder="e.g. VRL LOGISTICS / SAFEEXPRESS"
                    className="w-full p-3 rounded-[16px] border border-[#ececec] bg-white font-semibold text-[#17191c] focus:border-[#c09748] focus:outline-none"
                  />
                </div>

              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-6 py-2.5 rounded-full bg-[#17191c] text-[#c09748] text-xs font-bold hover:bg-black transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Next: Line Items Intake</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: LINE ITEMS INTAKE (Mobile Cards + Desktop Structured Table) */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#ececec] pb-2">
                <div>
                  <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-wider font-mono">
                    Part Code & Physical Item Verification
                  </span>
                  <p className="text-xs text-[#777b86]">Short - Excess quantity is automatically calculated</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="px-4 py-2 rounded-full bg-[#17191c] text-[#c09748] text-xs font-bold hover:bg-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" /> + Add Part Code Row
                </button>
              </div>

              {/* Mobile Interactive Card List */}
              <div className="block lg:hidden space-y-3">
                {items.map((item, idx) => (
                  <div key={item.id} className="bg-[#fafafb] p-4 rounded-[20px] border border-[#ececec] space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono font-bold">
                        Item Row #{idx + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(item.id!)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-0.5">Part Code *</label>
                        <input
                          type="text"
                          required
                          value={item.partCode}
                          onChange={e => handleUpdateItem(item.id!, 'partCode', e.target.value)}
                          className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-mono font-bold text-[#17191c]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-0.5">Part Description *</label>
                        <input
                          type="text"
                          required
                          value={item.partDescription}
                          onChange={e => handleUpdateItem(item.id!, 'partDescription', e.target.value)}
                          className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-semibold text-[#17191c]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-0.5">Invoiced Qty</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={item.invoicedQty}
                          onChange={e => handleUpdateItem(item.id!, 'invoicedQty', Number(e.target.value))}
                          className="w-full p-2 rounded-[12px] border border-[#ececec] bg-white font-mono font-bold text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-0.5">Actual Recd</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={item.actualReceivedQty}
                          onChange={e => handleUpdateItem(item.id!, 'actualReceivedQty', Number(e.target.value))}
                          className="w-full p-2 rounded-[12px] border border-[#ececec] bg-emerald-50 text-emerald-800 font-mono font-bold text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-0.5">Short/Excess</label>
                        <div className="p-2 rounded-[12px] bg-gray-100 text-center font-mono font-bold text-xs">
                          {item.shortExcessQty > 0 ? `+${item.shortExcessQty}` : item.shortExcessQty}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-0.5">Ok By IQC</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={item.okByIqcQty}
                          onChange={e => handleUpdateItem(item.id!, 'okByIqcQty', Number(e.target.value))}
                          className="w-full p-2 rounded-[12px] border border-emerald-200 bg-white font-mono font-bold text-emerald-800 text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#777b86] uppercase mb-0.5">Rej Qty</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={item.rejectionQty}
                          onChange={e => handleUpdateItem(item.id!, 'rejectionQty', Number(e.target.value))}
                          className="w-full p-2 rounded-[12px] border border-red-200 bg-white font-mono font-bold text-red-600 text-center"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Structured Table View */}
              <div className="hidden lg:block overflow-x-auto border border-[#ececec] rounded-[20px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#17191c] text-white font-semibold uppercase text-[10px] tracking-wider">
                      <th className="p-3 border-r border-[#333]">Part Code</th>
                      <th className="p-3 border-r border-[#333] min-w-[200px]">Part Description</th>
                      <th className="p-3 border-r border-[#333] text-center">Invoiced Qty</th>
                      <th className="p-3 border-r border-[#333] text-center">Actual Received</th>
                      <th className="p-3 border-r border-[#333] text-center">Short - Excess</th>
                      <th className="p-3 border-r border-[#333] text-center">Ok By IQC</th>
                      <th className="p-3 border-r border-[#333] text-center">Rej. Qty</th>
                      <th className="p-3 border-r border-[#333]">Remark</th>
                      <th className="p-3 text-center">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ececec] bg-white text-[#17191c]">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-[#fafafb]">
                        <td className="p-2.5 border-r border-[#ececec]">
                          <input
                            type="text"
                            required
                            value={item.partCode}
                            onChange={e => handleUpdateItem(item.id!, 'partCode', e.target.value)}
                            className="w-full p-2 rounded-[10px] border border-[#ececec] font-mono font-bold text-xs text-[#17191c]"
                          />
                        </td>
                        <td className="p-2.5 border-r border-[#ececec]">
                          <input
                            type="text"
                            required
                            value={item.partDescription}
                            onChange={e => handleUpdateItem(item.id!, 'partDescription', e.target.value)}
                            className="w-full p-2 rounded-[10px] border border-[#ececec] font-semibold text-xs text-[#17191c]"
                          />
                        </td>
                        <td className="p-2.5 border-r border-[#ececec] text-center">
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.invoicedQty}
                            onChange={e => handleUpdateItem(item.id!, 'invoicedQty', Number(e.target.value))}
                            className="w-20 p-2 rounded-[10px] border border-[#ececec] font-mono font-bold text-center text-[#17191c]"
                          />
                        </td>
                        <td className="p-2.5 border-r border-[#ececec] text-center">
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.actualReceivedQty}
                            onChange={e => handleUpdateItem(item.id!, 'actualReceivedQty', Number(e.target.value))}
                            className="w-20 p-2 rounded-[10px] border border-[#ececec] font-mono font-bold text-center text-emerald-800 bg-emerald-50/50"
                          />
                        </td>
                        <td className="p-2.5 border-r border-[#ececec] text-center font-mono font-bold">
                          <span className={`px-2.5 py-1 rounded-full text-xs ${
                            item.shortExcessQty < 0 
                              ? 'bg-red-100 text-red-700 border border-red-200' 
                              : item.shortExcessQty > 0 
                              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {item.shortExcessQty > 0 ? `+${item.shortExcessQty}` : item.shortExcessQty}
                          </span>
                        </td>
                        <td className="p-2.5 border-r border-[#ececec] text-center">
                          <input
                            type="number"
                            required
                            min="0"
                            value={item.okByIqcQty}
                            onChange={e => handleUpdateItem(item.id!, 'okByIqcQty', Number(e.target.value))}
                            className="w-20 p-2 rounded-[10px] border border-[#ececec] font-mono font-bold text-center text-emerald-700"
                          />
                        </td>
                        <td className="p-2.5 border-r border-[#ececec] text-center">
                          <input
                            type="number"
                            required
                            min="0"
                            value={item.rejectionQty}
                            onChange={e => handleUpdateItem(item.id!, 'rejectionQty', Number(e.target.value))}
                            className="w-20 p-2 rounded-[10px] border border-[#ececec] font-mono font-bold text-center text-red-600"
                          />
                        </td>
                        <td className="p-2.5 border-r border-[#ececec]">
                          <input
                            type="text"
                            value={item.remark || ''}
                            onChange={e => handleUpdateItem(item.id!, 'remark', e.target.value)}
                            placeholder="e.g. Visual check OK"
                            className="w-full p-2 rounded-[10px] border border-[#ececec] text-xs"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(item.id!)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    <tr className="bg-[#fafafb] font-bold text-[#17191c] border-t-2 border-[#ececec]">
                      <td colSpan={3} className="p-3 text-right uppercase tracking-wider font-mono text-xs text-[#777b86]">
                        Total Received Units:
                      </td>
                      <td className="p-3 text-center font-mono text-base text-[#c09748]">
                        {totalReceivedQty} pcs
                      </td>
                      <td colSpan={5} className="p-3 text-gray-500 font-normal text-xs">
                        Verified across {items.length} line item rows
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-6 py-2.5 rounded-full bg-[#17191c] text-[#c09748] text-xs font-bold hover:bg-black transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Next: Color Breakdown & Approvals</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: COLOR BREAKDOWN & AUTHORIZATIONS */}
          {activeStep === 3 && (
            <div className="space-y-5">
              
              {/* Color Splits */}
              <div className="bg-[#faf3e0]/50 p-4 sm:p-5 rounded-[20px] border border-[#f4e5be] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#8a6521] uppercase tracking-wider font-mono">
                    Customer Color Breakdown (Auto-Generates Shop Floor Job Cards):
                  </span>
                  <button
                    type="button"
                    onClick={addColorSplit}
                    className="px-3 py-1.5 rounded-full bg-[#c09748] text-[#17191c] text-xs font-bold hover:bg-[#a97e35] cursor-pointer shadow-xs"
                  >
                    + Add Color Requirement
                  </button>
                </div>

                <div className="space-y-2.5">
                  {colorSplits.map((cs, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2.5 bg-white p-3 rounded-[16px] border border-[#f4e5be] shadow-2xs">
                      <input
                        type="text"
                        placeholder="Color Name (e.g. Monza Red Gloss)"
                        value={cs.colorName}
                        onChange={e => updateColorSplit(idx, 'colorName', e.target.value)}
                        className="flex-1 p-2 rounded-[10px] border border-[#ececec] text-xs font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="Code (RD-01)"
                        value={cs.colorCode}
                        onChange={e => updateColorSplit(idx, 'colorCode', e.target.value)}
                        className="w-24 p-2 rounded-[10px] border border-[#ececec] text-xs font-mono font-bold"
                      />
                      <input
                        type="number"
                        placeholder="Target Cap Pcs"
                        value={cs.orderedQty}
                        onChange={e => updateColorSplit(idx, 'orderedQty', Number(e.target.value))}
                        className="w-32 p-2 rounded-[10px] border border-[#ececec] text-xs font-mono font-bold text-center"
                      />
                      <input
                        type="number"
                        placeholder="Rate ₹"
                        value={cs.unitRate}
                        onChange={e => updateColorSplit(idx, 'unitRate', Number(e.target.value))}
                        className="w-24 p-2 rounded-[10px] border border-[#ececec] text-xs font-mono text-center"
                      />
                      {colorSplits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeColorSplit(idx)}
                          className="text-red-500 p-1 hover:bg-red-50 rounded-full cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Official Signatures Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#fafafb] p-4 sm:p-5 rounded-[20px] border border-[#ececec]">
                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                    Store Incharge :- *
                  </label>
                  <input
                    type="text"
                    required
                    value={storeIncharge}
                    onChange={e => setStoreIncharge(e.target.value)}
                    className="w-full p-3 rounded-[16px] border border-[#ececec] bg-white font-semibold text-[#17191c]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                    Quality Approved:- *
                  </label>
                  <input
                    type="text"
                    required
                    value={qualityApprovedBy}
                    onChange={e => setQualityApprovedBy(e.target.value)}
                    className="w-full p-3 rounded-[16px] border border-[#ececec] bg-white font-semibold text-[#17191c]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                    Approved By:- *
                  </label>
                  <input
                    type="text"
                    required
                    value={approvedBy}
                    onChange={e => setApprovedBy(e.target.value)}
                    className="w-full p-3 rounded-[16px] border border-[#ececec] bg-white font-semibold text-[#17191c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#777b86] uppercase mb-1">
                  Physical Verification Remarks
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full p-3 rounded-[16px] border border-[#ececec] bg-[#fafafb] font-medium text-[#17191c] focus:outline-none"
                />
              </div>

              {/* Modal Footer Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#ececec]">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer hover:bg-gray-50 w-full sm:w-auto"
                >
                  Back
                </button>
                
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-7 py-3 rounded-full bg-[#17191c] text-[#c09748] font-bold cursor-pointer hover:bg-black flex items-center gap-2 shadow-lg transition active:scale-95"
                  >
                    <Save className="w-4 h-4 text-[#c09748]" />
                    Save Official GRN Intake
                  </button>
                </div>
              </div>

            </div>
          )}

        </form>

      </div>
    </div>
  );
};
