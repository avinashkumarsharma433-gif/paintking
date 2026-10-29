import React, { useState, useEffect } from 'react';
import { X, Layers, Plus, Save, Gauge, Thermometer, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { PaintingBooth } from '../types/portalTypes';

interface BoothConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBooth?: PaintingBooth | null;
  onSave: (boothData: Omit<PaintingBooth, 'id'>) => void;
  onUpdate?: (id: string, updates: Partial<PaintingBooth>) => void;
}

export const BoothConfigModal: React.FC<BoothConfigModalProps> = ({
  isOpen,
  onClose,
  editingBooth,
  onSave,
  onUpdate
}) => {
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<string>('Conveyor Liquid PU');
  const [status, setStatus] = useState<'Active' | 'Under Maintenance' | 'Changeover'>('Active');
  const [capacityPerShift, setCapacityPerShift] = useState<number>(1200);
  const [airPressureBar, setAirPressureBar] = useState<number>(4.2);
  const [curingTempC, setCuringTempC] = useState<number>(65);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (editingBooth) {
      setName(editingBooth.name);
      setType(editingBooth.type);
      setStatus(editingBooth.status);
      setCapacityPerShift(editingBooth.capacityPerShift || 1000);
      setAirPressureBar(editingBooth.airPressureBar || 4.0);
      setCuringTempC(editingBooth.curingTempC || 60);
      setNotes(editingBooth.notes || '');
    } else {
      setName('');
      setType('Conveyor Liquid PU');
      setStatus('Active');
      setCapacityPerShift(1200);
      setAirPressureBar(4.2);
      setCuringTempC(65);
      setNotes('');
    }
  }, [editingBooth, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a valid booth name.');
      return;
    }

    if (editingBooth && onUpdate) {
      onUpdate(editingBooth.id, {
        name: name.trim(),
        type,
        status,
        capacityPerShift,
        airPressureBar,
        curingTempC,
        notes: notes.trim()
      });
    } else {
      onSave({
        name: name.trim(),
        type,
        status,
        capacityPerShift,
        airPressureBar,
        curingTempC,
        plant: 'Haridwar',
        notes: notes.trim()
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-[#ececec] space-y-5 text-xs max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#ececec]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] flex items-center justify-center font-bold font-mono text-[11px]">
                <Layers className="w-3 h-3 text-[#c09748]" />
              </span>
              <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-[0.2em] font-mono">
                {editingBooth ? 'Configure Existing Line' : 'Fleet Registration'}
              </span>
            </div>
            <h3 className="text-xl font-serif text-[#17191c] font-normal tracking-tight">
              {editingBooth ? `Edit ${editingBooth.name}` : 'Add New Painting Line & Spray Booth'}
            </h3>
            <p className="text-xs text-[#777b86]">
              Shop floor booth configuration and operational process parameters.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Booth Name */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#17191c] uppercase tracking-wider font-mono">
              <span>1. Line / Booth Name</span>
              <span className="text-[#c09748]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Booth #5 (Automated High Gloss PU Line)"
              className="w-full h-11 px-4 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white font-semibold text-xs text-[#17191c] focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/15 focus:outline-none transition-all shadow-2xs"
            />
          </div>

          {/* Process Technology Dropdown */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#17191c] uppercase tracking-wider font-mono">
              <span>2. Process Technology / Line Category</span>
              <span className="text-[#c09748]">*</span>
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full h-11 px-4 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white font-semibold text-xs text-[#17191c] focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/15 focus:outline-none transition-all shadow-2xs cursor-pointer"
            >
              <option value="Conveyor Liquid PU">Conveyor Liquid PU Spray Painting (Robotic Spindle)</option>
              <option value="Dust-Free Cleanroom 2K">Dust-Free Cleanroom Enclosed 2K PU (Class 10,000)</option>
              <option value="Water Transfer Hydrographic">3D Water Transfer Hydrographic (Dipping Line)</option>
              <option value="Direct Flatbed UV Plotter">Industrial Flatbed Direct UV Plotter (1440 DPI)</option>
              <option value="Thermoplastic Injection Molding">Thermoplastic Injection Moulding Bay</option>
              <option value="Manual Cleanroom Precision">Manual Spray Finishing Booth (Touch-Up & R&D)</option>
            </select>
          </div>

          {/* 3 Numerical Operational Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[10.5px] font-bold text-[#17191c] uppercase tracking-wider font-mono">
                Shift Capacity
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={capacityPerShift}
                  onChange={e => setCapacityPerShift(Number(e.target.value))}
                  className="w-full h-10 pl-3 pr-10 rounded-[14px] border border-[#dcdfe4] bg-white font-mono font-bold text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 text-[10px] text-[#777b86] font-mono">Pcs</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-[10.5px] font-bold text-[#17191c] uppercase tracking-wider font-mono">
                <Gauge className="w-3 h-3 text-[#c09748]" />
                <span>Air Pressure</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  value={airPressureBar}
                  onChange={e => setAirPressureBar(Number(e.target.value))}
                  className="w-full h-10 pl-3 pr-10 rounded-[14px] border border-[#dcdfe4] bg-white font-mono font-bold text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 text-[10px] text-[#777b86] font-mono">Bar</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-[10.5px] font-bold text-[#17191c] uppercase tracking-wider font-mono">
                <Thermometer className="w-3 h-3 text-[#c09748]" />
                <span>Oven Temp</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="20"
                  max="150"
                  step="5"
                  value={curingTempC}
                  onChange={e => setCuringTempC(Number(e.target.value))}
                  className="w-full h-10 pl-3 pr-8 rounded-[14px] border border-[#dcdfe4] bg-white font-mono font-bold text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 text-[10px] text-[#777b86] font-mono">°C</span>
              </div>
            </div>
          </div>

          {/* Operational Status Selector */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-[11px] font-bold text-[#17191c] uppercase tracking-wider font-mono">
              Operational Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('Active')}
                className={`py-2 px-3 rounded-[14px] text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                  status === 'Active'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold shadow-2xs'
                    : 'bg-[#fafafb] text-[#777b86] border-[#ececec] hover:bg-gray-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Active</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('Under Maintenance')}
                className={`py-2 px-3 rounded-[14px] text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                  status === 'Under Maintenance'
                    ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold shadow-2xs'
                    : 'bg-[#fafafb] text-[#777b86] border-[#ececec] hover:bg-gray-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Maintenance</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('Changeover')}
                className={`py-2 px-3 rounded-[14px] text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                  status === 'Changeover'
                    ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold shadow-2xs'
                    : 'bg-[#fafafb] text-[#777b86] border-[#ececec] hover:bg-gray-100'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Changeover</span>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-[#777b86] uppercase tracking-wider font-mono">
              Operating Notes / Equipment Specs (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Equipped with 2-gun reciprocator, automated air flash-off zone."
              className="w-full p-3 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-xs text-[#17191c] focus:border-[#c09748] focus:outline-none transition-all"
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ececec]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-white text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-95"
            >
              {editingBooth ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{editingBooth ? 'Save Booth Changes' : 'Register New Booth'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
