import React, { useState } from 'react';
import { usePortalStore } from '../context/PortalStoreContext';
import { UniversalJobRecord, MaterialCategoryOption } from '../types/portalTypes';
import { CustomSelect, SelectOption } from './CustomSelect';
import { Plus, Save, Sparkles, ShieldCheck, Package, Layers, Hash, X, Check } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-[#fafafb] sm:bg-white overflow-y-auto flex flex-col animate-in fade-in duration-150">
      {/* Sticky Top Header Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#ececec] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#faf3e0] border border-[#f4e5be] text-[#8a6521] text-[10px] font-mono uppercase tracking-widest font-bold">
              Universal Job Intake
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#fafafb] border border-[#ececec] text-[#777b86] text-[10px] font-mono">
              Single ID System
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-serif font-normal text-[#17191c]">
            Register New Job ID (`{jobId}`)
          </h3>
        </div>

        <button 
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] flex items-center justify-center cursor-pointer transition active:scale-95 shadow-2xs"
          title="Close"
        >
          <X className="w-5 h-5 text-[#17191c]" />
        </button>
      </div>

      {/* Body Container */}
      <div className="max-w-3xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1 text-xs">
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Universal Job ID Hero Card */}
          <div className="bg-[#fafafb] p-4 sm:p-5 rounded-[20px] border border-[#ececec] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#17191c] uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-[#c09748]" />
                Universal Job Identifier (Used Across All Factory Stages)
              </span>
              <span className="text-xs text-[#777b86] font-mono font-bold">System Generated</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5">
                  Universal Job ID *
                </label>
                <input
                  type="text"
                  required
                  value={jobId}
                  onChange={e => setJobId(e.target.value)}
                  className="w-full p-3 rounded-[14px] border border-[#17191c] bg-white font-mono font-semibold text-xs text-[#17191c] focus:outline-none"
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
                  className="w-full p-3 rounded-[14px] border border-[#e5e7eb] bg-white text-xs text-[#17191c] placeholder:text-gray-400 focus:border-[#c09748] focus:outline-none"
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
                  className="w-full p-3 rounded-[14px] border border-[#e5e7eb] bg-white font-mono text-xs text-[#17191c] placeholder:text-gray-400 focus:border-[#c09748] focus:outline-none"
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
                  className="w-full p-3 rounded-[14px] border border-[#e5e7eb] bg-white font-mono text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none cursor-pointer"
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
                  className="w-full p-3 rounded-[14px] border border-[#e5e7eb] bg-white font-mono text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none cursor-pointer"
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
              <label className="block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5">
                Vehicle Number *
              </label>
              <input
                type="text"
                required
                value={vehicleNo}
                onChange={e => setVehicleNo(e.target.value)}
                placeholder="e.g. UK-08-AL-4412"
                className="w-full p-3 rounded-[14px] border border-[#e5e7eb] bg-white font-mono text-xs text-[#17191c] placeholder:text-gray-400 uppercase focus:border-[#c09748] focus:outline-none"
              />
            </div>
          </div>

          {/* Material Specifications & Piece Quantity */}
          <div className="bg-[#fafafb] p-4 sm:p-5 rounded-[20px] border border-[#ececec] space-y-4">
            <span className="text-[11px] font-semibold text-[#17191c] uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#c09748]" />
              Material Specifications & Inward Piece Quantity
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
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
                  className="w-full p-3 rounded-[14px] border border-[#e5e7eb] bg-white text-xs text-[#17191c] placeholder:text-gray-400 focus:border-[#c09748] focus:outline-none"
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
                  className="w-full p-3 rounded-[14px] border border-[#e5e7eb] bg-white font-mono text-xs text-[#17191c] text-center focus:border-[#c09748] focus:outline-none font-bold text-sm"
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
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
                  className="w-full p-3 rounded-[14px] border border-[#e5e7eb] bg-white text-xs text-[#17191c] placeholder:text-gray-400 focus:border-[#c09748] focus:outline-none"
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
                  className="w-full p-3 rounded-[14px] border border-[#e5e7eb] bg-white font-mono text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none"
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
                  className="w-full p-3 rounded-[14px] border border-[#ececec] bg-white font-mono font-bold text-center text-[#17191c] focus:border-[#c09748] focus:outline-none"
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
              className="w-full p-3 rounded-[14px] border border-[#e5e7eb] bg-white text-xs text-[#17191c] placeholder:text-gray-400 focus:border-[#c09748] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#ececec]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-[#ececec] bg-white text-[#777b86] font-medium cursor-pointer hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-2xs cursor-pointer flex items-center gap-2 transition active:scale-95"
            >
              <Check className="w-4 h-4 text-[#c09748]" />
              <span>Register Universal Job ID & Intake Material</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
