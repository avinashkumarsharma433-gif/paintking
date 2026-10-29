import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, Plus, Edit3, X } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
  isCapped?: boolean;
}

interface CustomComboboxProps {
  label?: string;
  options: ComboboxOption[];
  value: string;
  onChange: (val: string, option?: ComboboxOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  allowCustom?: boolean;
  customTypePrompt?: string;
  className?: string;
  required?: boolean;
}

export const CustomCombobox: React.FC<CustomComboboxProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search or type custom...',
  allowCustom = true,
  customTypePrompt = 'Add / Enter Custom Value',
  className = '',
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isDirectInputMode, setIsDirectInputMode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(o => o.value === value || o.label === value);

  // Filter options by search
  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase())) ||
    (o.value && o.value.toLowerCase().includes(search.toLowerCase()))
  );

  const exactMatchExists = options.some(
    o => o.label.toLowerCase() === search.trim().toLowerCase() || o.value.toLowerCase() === search.trim().toLowerCase()
  );

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelectOption = (opt: ComboboxOption) => {
    onChange(opt.value, opt);
    setIsOpen(false);
    setSearch('');
  };

  const handleApplyCustom = (customText: string) => {
    const trimmed = customText.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setIsOpen(false);
    setSearch('');
    setIsDirectInputMode(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-[10px] font-bold text-[#777b86] uppercase font-mono mb-1.5 flex items-center justify-between">
          <span>{label} {required && <strong className="text-red-500">*</strong>}</span>
          {allowCustom && !isDirectInputMode && (
            <button
              type="button"
              onClick={() => {
                setIsDirectInputMode(true);
                setIsOpen(false);
              }}
              className="text-[10px] text-[#c09748] hover:text-[#8a6521] font-mono lowercase flex items-center gap-1 cursor-pointer transition"
            >
              <Edit3 className="w-3 h-3" />
              <span>type custom</span>
            </button>
          )}
        </label>
      )}

      {/* Direct Manual Input Mode */}
      {isDirectInputMode ? (
        <div className="flex items-center gap-1.5 animate-in fade-in duration-100">
          <input
            type="text"
            autoFocus
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="Type custom name here..."
            className="w-full h-11 px-3.5 rounded-[16px] border border-[#c09748] bg-white font-semibold text-xs text-[#17191c] focus:outline-none ring-2 ring-[#c09748]/20 shadow-2xs"
          />
          <button
            type="button"
            onClick={() => setIsDirectInputMode(false)}
            className="h-11 px-3 rounded-[16px] bg-[#fafafb] hover:bg-[#faf7ed] text-[#777b86] hover:text-[#8a6521] border border-[#ececec] text-xs font-semibold flex items-center gap-1 cursor-pointer transition shrink-0"
            title="Switch back to list"
          >
            <span>List</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Standard Custom Dropdown Button */
        <div>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full h-11 px-3.5 rounded-[16px] border text-left transition flex items-center justify-between gap-2 cursor-pointer shadow-2xs ${
              isOpen
                ? 'border-[#c09748] bg-white ring-2 ring-[#c09748]/20'
                : 'border-[#dcdfe4] bg-white hover:border-[#c09748]/60 hover:bg-[#fafafb]'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {value ? (
                <div className="truncate">
                  <span className="font-semibold text-xs text-[#17191c] block truncate">
                    {selectedOption?.label || value}
                  </span>
                  {selectedOption?.sublabel && (
                    <span className="text-[10px] text-[#777b86] block truncate font-mono">
                      {selectedOption.sublabel}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-400 font-normal">{placeholder}</span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {selectedOption?.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  selectedOption.badgeColor || 'bg-[#fafafb] border border-[#ececec] text-[#777b86]'
                }`}>
                  {selectedOption.badge}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 text-[#777b86] transition-transform ${isOpen ? 'rotate-180 text-[#c09748]' : ''}`} />
            </div>
          </button>

          {/* Popup Dropdown Panel */}
          {isOpen && (
            <div className="absolute z-50 mt-1.5 w-full bg-white rounded-[20px] border border-[#ececec] shadow-2xl p-2 space-y-1.5 max-h-72 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-150">
              {/* Search Bar */}
              <div className="relative p-0.5">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#777b86]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-[12px] bg-[#fafafb] border border-[#ececec] focus:outline-none focus:border-[#c09748] focus:bg-white font-mono"
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (search.trim()) {
                        handleApplyCustom(search);
                      }
                    }
                  }}
                />
              </div>

              {/* Add Custom Value Prompt if typed */}
              {allowCustom && search.trim().length > 0 && !exactMatchExists && (
                <button
                  type="button"
                  onClick={() => handleApplyCustom(search)}
                  className="w-full px-3 py-2.5 rounded-[12px] bg-[#faf7ed] hover:bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-xs font-semibold flex items-center gap-2 cursor-pointer transition text-left"
                >
                  <Plus className="w-3.5 h-3.5 text-[#c09748] shrink-0" />
                  <span className="truncate">
                    Assign / Use New: <strong className="font-bold underline">{search.trim()}</strong>
                  </span>
                </button>
              )}

              {/* Options List */}
              <div className="space-y-1">
                {filteredOptions.map((opt) => {
                  const isSelected = opt.value === value || opt.label === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full px-3 py-2 rounded-[12px] text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] font-bold shadow-2xs'
                          : 'hover:bg-[#fafafb] text-[#17191c] border border-transparent'
                      }`}
                    >
                      <div className="truncate">
                        <div className="text-xs truncate font-semibold">{opt.label}</div>
                        {opt.sublabel && (
                          <div className={`text-[10px] font-mono truncate ${isSelected ? 'text-[#8a6521]/80' : 'text-[#777b86]'}`}>
                            {opt.sublabel}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {opt.badge && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            opt.badgeColor || 'bg-[#fafafb] border border-[#ececec] text-[#777b86]'
                          }`}>
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#8a6521] shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}

                {filteredOptions.length === 0 && !search.trim() && (
                  <div className="p-3 text-center text-xs text-[#777b86]">
                    No options available
                  </div>
                )}
              </div>

              {/* Bottom Custom Switch */}
              {allowCustom && (
                <div className="pt-1.5 border-t border-[#f2f2f3]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDirectInputMode(true);
                      setIsOpen(false);
                    }}
                    className="w-full py-1.5 px-2 rounded-[10px] bg-[#fafafb] hover:bg-[#faf7ed] text-[#777b86] hover:text-[#8a6521] text-[11px] font-mono font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition border border-dashed border-[#dcdfe4]"
                  >
                    <Plus className="w-3 h-3 text-[#c09748]" />
                    <span>{customTypePrompt}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
