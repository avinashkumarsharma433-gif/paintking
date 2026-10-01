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
        className={`w-full px-3.5 py-2.5 rounded-[12px] border text-left transition flex items-center justify-between gap-2 cursor-pointer shadow-2xs ${
          isOpen
            ? 'border-[#17191c] bg-white ring-1 ring-[#17191c]/10'
            : 'border-[#e5e7eb] bg-white hover:border-gray-300'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption ? (
            <div className="truncate">
              <span className="font-normal text-xs text-[#17191c] block truncate">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="text-[10px] text-[#777b86] block truncate font-mono">
                  {selectedOption.sublabel}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400 font-normal">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedOption?.badge && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${selectedOption.badgeColor || 'bg-[#fafafb] border border-[#ececec] text-[#777b86]'}`}>
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-[#777b86] transition-transform ${isOpen ? 'rotate-180 text-[#17191c]' : ''}`} />
        </div>
      </button>

      {/* Dropdown Options Popup */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white rounded-[16px] border border-[#ececec] shadow-xl p-1.5 space-y-1 max-h-60 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-150">
          
          {options.length > 5 && (
            <div className="relative p-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#777b86]" />
              <input
                type="text"
                placeholder="Search options..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-[10px] bg-[#fafafb] border border-[#ececec] focus:outline-none focus:border-[#17191c]"
                onClick={e => e.stopPropagation()}
              />
            </div>
          )}

          <div className="space-y-0.5">
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
                  className={`w-full px-3 py-2 rounded-[10px] text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#17191c] text-white font-medium'
                      : 'hover:bg-[#fafafb] text-[#17191c] font-normal'
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
