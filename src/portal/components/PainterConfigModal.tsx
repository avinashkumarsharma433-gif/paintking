import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, Save, User, Sparkles, Phone, Layers, ChevronDown, Check } from 'lucide-react';
import { PainterProfile, PaintingBooth } from '../types/portalTypes';

interface PainterConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPainter?: PainterProfile | null;
  availableBooths: PaintingBooth[];
  onSave: (painterData: Omit<PainterProfile, 'id'>) => void;
  onUpdate?: (id: string, updates: Partial<PainterProfile>) => void;
}

export const PainterConfigModal: React.FC<PainterConfigModalProps> = ({
  isOpen,
  onClose,
  editingPainter,
  availableBooths,
  onSave,
  onUpdate
}) => {
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [boothNo, setBoothNo] = useState<string>('');
  const [specialization, setSpecialization] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  // Custom Booth Dropdown state
  const [isBoothDropdownOpen, setIsBoothDropdownOpen] = useState<boolean>(false);
  const boothDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingPainter) {
      setName(editingPainter.name);
      setCode(editingPainter.code);
      setBoothNo(editingPainter.boothNo || (availableBooths[0]?.name || 'Booth #1 (Continuous Conveyor Line)'));
      setSpecialization(editingPainter.specialization || '');
      setPhone(editingPainter.phone || '');
    } else {
      const defaultBooth = availableBooths[0]?.name || 'Booth #1 (Continuous Conveyor Line)';
      setName('');
      setCode('');
      setBoothNo(defaultBooth);
      setSpecialization('');
      setPhone('');
    }
    setIsBoothDropdownOpen(false);
  }, [editingPainter, availableBooths, isOpen]);

  // Click outside listener for booth dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (boothDropdownRef.current && !boothDropdownRef.current.contains(e.target as Node)) {
        setIsBoothDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const selectedBooth = availableBooths.find(b => b.name === boothNo) || availableBooths[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a valid painter name.');
      return;
    }

    // Auto-append code if not already formatted e.g. "Ramesh Kumar (P1)"
    let formattedName = name.trim();
    const assignedCode = code.trim().toUpperCase() || 'P';
    if (!formattedName.includes('(') && assignedCode) {
      formattedName = `${formattedName} (${assignedCode})`;
    }

    if (editingPainter && onUpdate) {
      onUpdate(editingPainter.id, {
        name: formattedName,
        code: assignedCode,
        boothNo,
        specialization,
        phone: phone.trim(),
        status: 'Active'
      });
    } else {
      onSave({
        name: formattedName,
        code: assignedCode,
        avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 50000000)}?auto=format&fit=crop&w=150&q=80`,
        boothNo,
        specialization,
        phone: phone.trim(),
        status: 'Active'
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#ececec] space-y-6 text-xs relative overflow-visible no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#ececec]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] flex items-center justify-center font-bold font-mono text-[11px]">
                <User className="w-3 h-3 text-[#c09748]" />
              </span>
              <span className="text-[11px] font-bold text-[#c09748] uppercase tracking-[0.2em] font-mono">
                {editingPainter ? 'Operator Configuration • Shop Floor Fleet' : 'Painter Onboarding • Shop Floor Fleet'}
              </span>
            </div>
            <h3 className="text-2xl font-serif text-[#17191c] font-normal tracking-tight">
              {editingPainter ? `Edit ${editingPainter.name}` : 'Add New Coating Painter / Operator'}
            </h3>
            <p className="text-xs text-[#777b86]">
              Coating specialist profile, spray booth line assignment aur active workload profile.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] flex items-center justify-center cursor-pointer transition shadow-2xs"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Name & Code Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-3 space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#17191c] uppercase tracking-wider font-mono">
                <User className="w-3.5 h-3.5 text-[#c09748]" />
                <span>1. Painter Full Name</span>
                <span className="text-[#c09748]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Suresh Verma"
                className="w-full h-11 px-4 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white font-semibold text-xs text-[#17191c] focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/15 focus:outline-none transition-all shadow-2xs"
              />
            </div>

            <div className="sm:col-span-1 space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#17191c] uppercase tracking-wider font-mono">
                <span>Code</span>
                <span className="text-[#c09748]">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="e.g. P2"
                className="w-full h-11 px-3.5 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white font-mono font-bold text-xs text-[#8a6521] text-center uppercase focus:border-[#c09748] focus:outline-none transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Row 2: Booth Assignment & Phone Number Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Custom Designed Spray Booth Dropdown */}
            <div className="space-y-1.5 relative" ref={boothDropdownRef}>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#17191c] uppercase tracking-wider font-mono">
                <Layers className="w-3.5 h-3.5 text-[#c09748]" />
                <span>2. Primary Assigned Spray Booth / Line</span>
                <span className="text-[#c09748]">*</span>
              </label>

              {/* Trigger */}
              <button
                type="button"
                onClick={() => setIsBoothDropdownOpen(!isBoothDropdownOpen)}
                className={`w-full h-11 px-4 rounded-[16px] border text-left transition flex items-center justify-between gap-2 cursor-pointer shadow-2xs ${
                  isBoothDropdownOpen
                    ? 'border-[#c09748] bg-white ring-2 ring-[#c09748]/15'
                    : 'border-[#dcdfe4] bg-[#fafafb] hover:bg-white hover:border-[#c09748]/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="truncate">
                    <span className="font-semibold text-xs text-[#17191c] block truncate">
                      {selectedBooth?.name || boothNo || 'Select Spray Booth'}
                    </span>
                    {selectedBooth?.type && (
                      <span className="text-[10px] text-[#777b86] block truncate font-mono">
                        {selectedBooth.type}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {selectedBooth?.status && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedBooth.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {selectedBooth.status}
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-[#777b86] transition-transform duration-200 ${
                    isBoothDropdownOpen ? 'rotate-180 text-[#c09748]' : ''
                  }`} />
                </div>
              </button>

              {/* Dropdown Menu */}
              {isBoothDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-[20px] border border-[#ececec] shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 max-h-56 overflow-y-auto no-scrollbar">
                  {availableBooths.map(b => {
                    const isSelected = b.name === boothNo;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setBoothNo(b.name);
                          setIsBoothDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-[14px] text-left transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be]'
                            : 'hover:bg-[#fafafb] text-[#17191c]'
                        }`}
                      >
                        <div className="truncate">
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-mono font-bold text-xs text-[#8a6521] shrink-0">{b.id}</span>
                            <span className="font-semibold text-xs text-[#17191c] truncate">{b.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#c09748] shrink-0" />}
                          </div>
                          <div className="text-[10px] text-[#777b86] mt-0.5 font-mono truncate">
                            {b.type} • {(b.capacityPerShift || 1000).toLocaleString()} pcs/shift
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          b.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {b.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Contact Phone */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#17191c] uppercase tracking-wider font-mono">
                <Phone className="w-3.5 h-3.5 text-[#c09748]" />
                <span>3. Contact Phone (Optional)</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full h-11 px-4 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white text-xs text-[#17191c] focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/15 focus:outline-none transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Row 3: Specialization Input */}
          <div className="space-y-1.5 pt-1">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#17191c] uppercase tracking-wider font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#c09748]" />
              <span>4. Finishing Specialization / Expertise</span>
            </label>

            <input
              type="text"
              value={specialization}
              onChange={e => setSpecialization(e.target.value)}
              placeholder="e.g. Carbon Fiber PVA Film Dipping & Base, High Gloss 2K PU Coating"
              className="w-full h-11 px-4 rounded-[16px] border border-[#dcdfe4] bg-[#fafafb] hover:bg-white focus:bg-white font-semibold text-xs text-[#17191c] focus:border-[#c09748] focus:ring-2 focus:ring-[#c09748]/15 focus:outline-none transition-all shadow-2xs"
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-[#ececec]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold transition cursor-pointer shadow-2xs active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#c09748] hover:bg-[#a97e35] text-white text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-95"
            >
              {editingPainter ? <Save className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>{editingPainter ? 'Save Operator Changes' : 'Register New Painter'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
