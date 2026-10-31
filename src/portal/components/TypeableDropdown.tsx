import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Edit3 } from 'lucide-react';

export interface TypeableDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const TypeableDropdown: React.FC<TypeableDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Type or select...',
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const trimmedVal = value.trim().toLowerCase();
  const filtered = options.filter(opt =>
    opt.toLowerCase().includes(trimmedVal)
  );
  const displayOptions = filtered.length > 0 ? filtered : options;
  const isCustomValue = trimmedVal.length > 0 && !options.some(opt => opt.toLowerCase() === trimmedVal);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={value}
          onChange={e => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          placeholder={placeholder}
          className={`w-full h-9.5 pl-3 pr-8 rounded-[12px] border transition text-xs font-semibold shadow-2xs ${
            disabled
              ? 'bg-[#f8f9fa] border-[#ececec] text-[#979799] cursor-not-allowed opacity-60'
              : isOpen
              ? 'bg-white border-[#c09748] ring-2 ring-[#c09748]/20 text-[#17191c]'
              : 'bg-white border-[#dcdfe4] hover:border-[#c09748]/60 text-[#17191c]'
          }`}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen(prev => !prev);
              if (!isOpen) inputRef.current?.focus();
            }
          }}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-[#777b86] hover:text-[#c09748] cursor-pointer disabled:cursor-not-allowed transition"
          tabIndex={-1}
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#c09748]' : ''
            }`}
          />
        </button>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#ececec] rounded-[16px] shadow-2xl p-1.5 max-h-56 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-100">
          <div className="text-[9.5px] font-mono font-bold tracking-wider uppercase text-[#8a6521] px-2.5 py-1 bg-[#faf7ed] rounded-[8px] mb-1 flex items-center justify-between">
            <span>Presets & Suggestions</span>
            <span className="text-[9px] font-normal text-[#777b86]">Click or Type freely</span>
          </div>

          {isCustomValue && (
            <div className="px-2.5 py-1 mb-1 text-[11px] font-mono text-[#8a6521] bg-amber-50/70 border border-amber-200 rounded-[8px] flex items-center gap-1.5">
              <Edit3 className="w-3 h-3 text-[#c09748]" />
              <span className="truncate">Using custom: &quot;{value}&quot;</span>
            </div>
          )}

          <div className="space-y-0.5">
            {displayOptions.map(opt => {
              const isSelected = value.trim().toLowerCase() === opt.trim().toLowerCase();
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-[9px] text-xs transition cursor-pointer flex items-center justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-[#faf3e0] text-[#8a6521] font-bold'
                      : 'text-[#17191c] hover:bg-[#faf7ed] hover:text-[#8a6521] font-medium'
                  }`}
                >
                  <span className="truncate">{opt}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#8a6521] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
