import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  label,
  required = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-[11px] font-bold text-[#777b86] uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-3 rounded-[16px] border text-left transition flex items-center justify-between gap-2 cursor-pointer shadow-2xs ${
          isOpen
            ? 'border-[#c09748] bg-white ring-2 ring-[#c09748]/20'
            : 'border-[#ececec] bg-[#fafafb] hover:bg-white hover:border-[#c09748]/50'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption ? (
            <div className="truncate">
              <span className="font-semibold text-xs text-[#17191c] block truncate">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="text-[10px] text-[#777b86] block truncate font-mono">
                  {selectedOption.sublabel}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-[#979799] font-medium">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedOption?.badge && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${selectedOption.badgeColor || 'bg-[#faf3e0] text-[#8a6521]'}`}>
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-[#777b86] transition-transform ${isOpen ? 'rotate-180 text-[#c09748]' : ''}`} />
        </div>
      </button>

      {/* Dropdown Options Popup */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white rounded-[20px] border border-[#ececec] shadow-xl p-2 space-y-1.5 max-h-60 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-150">
          
          {options.length > 5 && (
            <div className="relative p-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#777b86]" />
              <input
                type="text"
                placeholder="Search options..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-[12px] bg-[#fafafb] border border-[#ececec] focus:outline-none focus:border-[#c09748]"
                onClick={e => e.stopPropagation()}
              />
            </div>
          )}

          <div className="space-y-1">
            {filteredOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full p-2.5 rounded-[14px] text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#17191c] text-[#c09748] font-bold'
                      : 'hover:bg-[#fafafb] text-[#17191c] font-medium'
                  }`}
                >
                  <div className="truncate">
                    <div className="text-xs truncate">{opt.label}</div>
                    {opt.sublabel && (
                      <div className={`text-[10px] font-mono truncate ${isSelected ? 'text-[#c09748]/80' : 'text-[#777b86]'}`}>
                        {opt.sublabel}
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-[#c09748] shrink-0" />
                  )}
                </button>
              );
            })}

            {filteredOptions.length === 0 && (
              <div className="p-3 text-center text-xs text-[#777b86]">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
