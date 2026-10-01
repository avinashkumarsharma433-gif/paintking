import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { UniversalJobRecord, MaterialCategoryOption } from '../types/portalTypes';
import { CustomSelect, SelectOption } from './CustomSelect';
import { Plus, Save, Sparkles, ShieldCheck, Package, Layers, Hash } from 'lucide-react';

interface UniversalJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UniversalJobModal: React.FC<UniversalJobModalProps> = ({ isOpen, onClose }) => {
  const { addUniversalJob, currentUser } = usePortalStore();

  const [jobId, setJobId] = useState<string>(`PK-JOB-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [partyName, setPartyName] = useState<string>('ROOP POLYMERS LTD');
  const [customerRefChallan, setCustomerRefChallan] = useState<string>('RP/CH/99824');
  const [challanDate, setChallanDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [receivingDate, setReceivingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [vehicleNo, setVehicleNo] = useState<string>('UK-08-AL-4412');
  
  // Category Dropdown - Strict 2 Options
  const [category, setCategory] = useState<MaterialCategoryOption>('Party Material');

  // Material Spec
  const [materialName, setMaterialName] = useState<string>('Auto AC Center Vent Bezel Substrate (ABS)');
  const [totalQuantity, setTotalQuantity] = useState<number>(1000);
  const [unit, setUnit] = useState<string>('Pcs');
  const [colorName, setColorName] = useState<string>('Monza Red Gloss');
  const [colorCode, setColorCode] = useState<string>('RD-01');
  const [unitRate, setUnitRate] = useState<number>(25.0);
  const [remarks, setRemarks] = useState<string>('Physical box count match (1000 pcs). Material intake verified at gate.');

  if (!isOpen) return null;

  // Category Options for CustomSelect
  const categoryOptions: SelectOption[] = [
    {
      value: 'Party Material',
      label: '1. Party Material (Customer Job Work)',
      sublabel: 'Substrates brought for Spray, Hydrographic 3D Dipping or Digital Printing',
      badge: 'Job Work',
      badgeColor: 'bg-[#faf3e0] text-[#8a6521]'
    },
    {
      value: 'Internal Company',
      label: '2. Internal Company (Consumables & Purchase)',
      sublabel: 'Factory paints, chemicals, thinners, lacquers, and spare parts purchase',
      badge: 'Internal',
      badgeColor: 'bg-blue-100 text-blue-800'
    }
  ];

  // Unit Options for CustomSelect
  const unitOptions: SelectOption[] = [
    { value: 'Pcs', label: 'Pcs (Raw Component Parts)' },
    { value: 'Litres', label: 'Litres (Paints, Thinners, Lacquers)' },
    { value: 'KG', label: 'KG (Powder & Chemical Base)' },
    { value: 'Drums', label: 'Drums (200L Master Containers)' },
    { value: 'Boxes', label: 'Master Corrugated Boxes' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newJob: UniversalJobRecord = {
      jobId,
      partyName,
      customerRefChallan,
      challanDate,
      receivingDate,
      vehicleNo,
      category,
      createdDate: new Date().toISOString().split('T')[0],
      createdTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      
      materialName,
      totalQuantity,
      unit,
      colorName,
      colorCode,
      unitRate,

      currentStage: '1. Gate Intake',
      isPreSprayIqcApproved: false, // Strict Gating: Must pass IQC to enter production!
      isFinalQaApproved: false,     // Strict Gating: Must pass QA to enter billing!

      pieceTracking: {
        totalInward: totalQuantity,
        preSprayApproved: 0,
        preSprayRejected: 0,
        sprayedGood: 0,
        finalQaPassed: 0,
        finalQaRejected: 0,
        billedQty: 0,
        dispatchedQty: 0
      },

      securityOfficer: currentUser.name || 'Ram Singh Security',
      storeIncharge: 'Manoj Tiwari Stores',
      remarks
    };

    addUniversalJob(newJob);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-[24px] max-w-3xl w-full p-5 sm:p-7 shadow-2xl border border-[#ececec] space-y-6 max-h-[92vh] overflow-y-auto no-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#ececec]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#17191c] text-[#c09748] text-[10px] font-mono font-bold uppercase tracking-wider">
                UNIVERSAL JOB INTAKE
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-mono font-bold">
                SINGLE ID SYSTEM
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif text-[#17191c] font-bold">
              Register New Job ID (`PK-JOB-XXXX`)
            </h2>
          </div>

          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#fafafb] hover:bg-gray-200 text-[#17191c] font-bold flex items-center justify-center cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          
          {/* Universal Job ID Hero Card */}
          <div className="bg-[#fafafb] p-4 sm:p-5 rounded-[16px] border border-[#ececec] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#17191c] uppercase tracking-wider flex flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-[#c09748]" />
                Universal Job Identifier (Used Across All 8 Factory Stages)
              </span>
              <span className="text-xs text-[#777b86] font-mono font-bold">System Generated</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5">
                  Universal Job ID *
                </label>
                <input
                  type="text"
                  required
                  value={jobId}
                  onChange={e => setJobId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#17191c] bg-white font-mono font-semibold text-xs text-[#17191c] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5">
                  Customer / Party Name *
                </label>
                <input
                  type="text"
                  required
                  value={partyName}
                  onChange={e => setPartyName(e.target.value)}
                  placeholder="e.g. ROOP POLYMERS LTD"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#e5e7eb] bg-white text-xs text-[#17191c] placeholder:text-gray-400 focus:border-[#c09748] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5">
                  Party Ref Challan / PO No *
                </label>
                <input
                  type="text"
                  required
                  value={customerRefChallan}
                  onChange={e => setCustomerRefChallan(e.target.value)}
                  placeholder="e.g. RP/CH/99824"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#e5e7eb] bg-white font-mono text-xs text-[#17191c] placeholder:text-gray-400 focus:border-[#c09748] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5">
                  Challan Date <span className="text-gray-400 font-normal font-sans">(As on Challan)</span>
                </label>
                <input
                  type="date"
                  value={challanDate}
                  onChange={e => setChallanDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#e5e7eb] bg-white font-mono text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5">
                  Physical Receiving Date <span className="text-gray-400 font-normal font-sans">(at Gate)</span>
                </label>
                <input
                  type="date"
                  value={receivingDate}
                  onChange={e => setReceivingDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#e5e7eb] bg-white font-mono text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Category & Transport Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Custom Category Dropdown - Strict 2 Options */}
            <CustomSelect
              label="Material Category (STRICT 2 OPTIONS)"
              required
              options={categoryOptions}
              value={category}
              onChange={val => setCategory(val as MaterialCategoryOption)}
            />

            <div>
              <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5.5">
                Vehicle Number *
              </label>
              <input
                type="text"
                required
                value={vehicleNo}
                onChange={e => setVehicleNo(e.target.value)}
                placeholder="e.g. UK-08-AL-4412"
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#e5e7eb] bg-white font-mono text-xs text-[#17191c] placeholder:text-gray-400 uppercase focus:border-[#c09748] focus:outline-none"
              />
            </div>

          </div>

          {/* Material Specifications & Piece Quantity */}
          <div className="bg-[#fafafb] p-4 sm:p-5 rounded-[16px] border border-[#ececec] space-y-4">
            <span className="text-[11px] font-semibold text-[#17191c] uppercase tracking-wider flex flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#c09748]" />
              Material Specifications & Inward Piece Quantity
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              
              <div className="sm:col-span-6">
                <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5">
                  Material / Component Name *
                </label>
                <input
                  type="text"
                  required
                  value={materialName}
                  onChange={e => setMaterialName(e.target.value)}
                  placeholder="e.g. Auto AC Center Vent Bezel Substrate (ABS)"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#e5e7eb] bg-white text-xs text-[#17191c] placeholder:text-gray-400 focus:border-[#c09748] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5">
                  Total Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={totalQuantity}
                  onChange={e => setTotalQuantity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#e5e7eb] bg-white font-mono text-xs text-[#17191c] text-center focus:border-[#c09748] focus:outline-none text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <CustomSelect
                  label="Unit of Measure"
                  required
                  options={unitOptions}
                  value={unit}
                  onChange={setUnit}
                />
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5">
                  Target Color Name *
                </label>
                <input
                  type="text"
                  required
                  value={colorName}
                  onChange={e => setColorName(e.target.value)}
                  placeholder="e.g. Monza Red Gloss"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#e5e7eb] bg-white text-xs text-[#17191c] placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5">
                  Color Shade Code
                </label>
                <input
                  type="text"
                  value={colorCode}
                  onChange={e => setColorCode(e.target.value)}
                  placeholder="e.g. RD-01"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#e5e7eb] bg-white font-mono text-xs text-[#17191c]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5">
                  Agreed Unit Rate ₹/pc
                </label>
                <input
                  type="number"
                  value={unitRate}
                  onChange={e => setUnitRate(Number(e.target.value))}
                  placeholder="25.00"
                  className="w-full p-2.5 rounded-[12px] border border-[#ececec] bg-white font-mono font-bold text-center text-[#17191c]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5">
              Inspection & Gate Pass Remarks
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#e5e7eb] bg-white text-xs text-[#17191c] placeholder:text-gray-400 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#ececec]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#17191c] hover:bg-black text-white text-xs font-medium font-bold cursor-pointer hover:bg-black flex items-center gap-2 shadow-lg transition active:scale-95"
            >
              <Save className="w-4 h-4 text-[#c09748]" />
              Register Universal Job ID & Intake Material
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
