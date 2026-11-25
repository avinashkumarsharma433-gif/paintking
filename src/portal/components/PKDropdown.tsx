import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface PKDropdownOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
}

interface PKDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: PKDropdownOption[];
  placeholder?: string;
  compact?: boolean;
  triggerClassName?: string;
}

/**
 * Custom PK-OS styled dropdown replacing native OS select popups.
 */
export const PKDropdown: React.FC<PKDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  compact = false,
  triggerClassName = ''
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`w-full ${compact ? 'h-8 px-2.5 rounded-[10px]' : 'h-10 px-3 rounded-[14px]'} border text-left flex items-center justify-between gap-2 transition cursor-pointer shadow-2xs ${
          open
            ? 'border-[#c09748] bg-white ring-2 ring-[#c09748]/15'
            : 'border-[#dcdfe4] bg-[#fafafb] hover:bg-white'
        } ${triggerClassName}`}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className={`truncate font-semibold text-[#17191c] ${compact ? 'text-[11px]' : 'text-xs sm:text-[13px]'}`}>
            {selected ? selected.label : placeholder}
          </span>
          {selected?.badge && !compact && (
            <span className="px-2 py-0.5 rounded-full bg-[#faf3e0] text-[#8a6521] border border-[#f4e5be] text-[10px] font-mono font-bold shrink-0">
              {selected.badge}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#8a6521] shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1.5 rounded-[16px] bg-white border border-[#ececec] shadow-xl p-1.5 z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[#777b86] text-center">No options</div>
          ) : (
            options.map(opt => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-[12px] text-left flex items-center justify-between gap-2 cursor-pointer transition ${
                    isSelected
                      ? 'bg-[#faf3e0] text-[#8a6521] font-semibold'
                      : 'text-[#17191c] hover:bg-[#fafafb]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{opt.label}</div>
                    {opt.sublabel && (
                      <div className="text-[11px] text-[#777b86] truncate">{opt.sublabel}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {opt.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-white border border-[#ececec] text-[10px] font-mono font-bold text-[#777b86]">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#c09748]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
