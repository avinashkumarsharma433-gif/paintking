import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X, Search } from 'lucide-react';

export interface CenteredSelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
}

interface CenteredSelectModalProps {
  title?: string;
  options: (string | CenteredSelectOption)[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
}

export const CenteredSelectModal: React.FC<CenteredSelectModalProps> = ({
  title = 'Select Option',
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  disabled = false,
  searchable = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Normalize options
  const normalizedOptions: CenteredSelectOption[] = options.map(opt => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOpt = normalizedOptions.find(o => o.value === value);

  // Filtered options
  const filtered = normalizedOptions.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase()) || 
    (o.description && o.description.toLowerCase().includes(search.toLowerCase())) ||
    (o.badge && o.badge.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    if (isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(true)}
        className={`w-full h-8 px-2.5 rounded-[6px] border bg-white text-xs font-medium text-[#17191c] flex items-center justify-between transition-colors cursor-pointer select-none ${
          isOpen ? 'border-[#17191c] ring-1 ring-[#17191c]/10 shadow-xs' : 'border-[#dcdfe4] hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''} ${className}`}
      >
        <span className="truncate">{selectedOpt ? selectedOpt.label : <span className="text-gray-400 font-normal">{placeholder}</span>}</span>
        <ChevronDown className="w-3.5 h-3.5 text-[#777b86] shrink-0 ml-1" />
      </button>

      {/* Screen-Centered Modal Popover in Portal with z-[999999] */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
          {/* Backdrop Blur Overlay */}
          <div 
            className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />

          {/* Centered Modal Card */}
          <div className="bg-white rounded-[18px] border border-[#dcdfe4] shadow-2xl w-full max-w-sm overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3.5 px-4 border-b border-[#f0f0f2]">
              <div>
                <h4 className="text-xs font-semibold text-[#17191c] uppercase tracking-wider">{title}</h4>
                <p className="text-[10.5px] text-[#777b86]">Screen-centered list selector</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-[#fafafb] hover:bg-gray-100 text-[#777b86] hover:text-[#17191c] border border-[#ececec] flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Optional Search */}
            {searchable && (
              <div className="p-3 border-b border-[#f0f0f2] bg-[#fafafb]">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#777b86] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search options..."
                    className="w-full h-8 pl-8 pr-3 rounded-[8px] border border-[#dcdfe4] bg-white text-xs text-[#17191c] placeholder:text-gray-400 focus:outline-none focus:border-[#17191c]"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="p-2 space-y-1 overflow-y-auto no-scrollbar flex-1 max-h-[360px]">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#777b86]">
                  No matching options found.
                </div>
              ) : (
                filtered.map(opt => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full p-2.5 px-3 rounded-[10px] text-left transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#17191c] text-white shadow-xs font-semibold'
                          : 'hover:bg-[#f4f4f5] text-[#17191c]'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs">{opt.label}</span>
                        {opt.description && (
                          <span className={`text-[10.5px] ${isSelected ? 'text-gray-300' : 'text-[#777b86]'}`}>
                            {opt.description}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {opt.badge && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-[#777b86]'
                          }`}>
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#c09748] shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-2.5 px-4 bg-[#fafafb] border-t border-[#f0f0f2] flex justify-between items-center text-[11px] text-[#777b86]">
              <span>{normalizedOptions.length} total options</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-full bg-white border border-[#dcdfe4] text-xs font-medium text-[#17191c] hover:bg-gray-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
