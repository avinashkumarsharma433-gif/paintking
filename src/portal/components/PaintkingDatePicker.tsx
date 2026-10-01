import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react';

interface PaintkingDatePickerProps {
  value?: string; // YYYY-MM-DD or DD-MM-YYYY format
  onChange: (dateStr: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const PaintkingDatePicker: React.FC<PaintkingDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'DD-MM-YYYY',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number } | null>(null);

  // Parse initial date or default to current date
  const parseDate = (dStr?: string) => {
    if (!dStr) return new Date();
    if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
      const [y, m, d] = dStr.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(dStr)) {
      const [d, m, y] = dStr.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const selectedDate = value ? parseDate(value) : null;
  const [viewYear, setViewYear] = useState<number>(() => (selectedDate ? selectedDate.getFullYear() : new Date().getFullYear()));
  const [viewMonth, setViewMonth] = useState<number>(() => (selectedDate ? selectedDate.getMonth() : new Date().getMonth()));

  // Sync view when value changes
  useEffect(() => {
    if (value) {
      const d = parseDate(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  // Synchronously compute desktop position BEFORE paint so it NEVER flashes in center
  const calculatePosition = () => {
    if (!triggerRef.current || typeof window === 'undefined') return null;
    if (window.innerWidth < 640) {
      return null; // Mobile: Centered modal
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 280;
    const popoverHeight = 310;

    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = window.innerWidth - popoverWidth - 16;
    }
    if (left < 16) left = 16;

    let top = rect.bottom + 6;
    // If overflowing bottom of viewport, flip upward
    if (top + popoverHeight > window.innerHeight - 16) {
      top = Math.max(16, rect.top - popoverHeight - 6);
    }

    return { top, left };
  };

  const openCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    const coords = calculatePosition();
    setPopoverCoords(coords);
    setIsOpen(true);
  };

  // Keep position updated on scroll or resize
  useLayoutEffect(() => {
    if (isOpen) {
      const coords = calculatePosition();
      setPopoverCoords(coords);

      const handleUpdate = () => {
        const c = calculatePosition();
        setPopoverCoords(c);
      };

      window.addEventListener('resize', handleUpdate);
      window.addEventListener('scroll', handleUpdate, true);
      return () => {
        window.removeEventListener('resize', handleUpdate);
        window.removeEventListener('scroll', handleUpdate, true);
      };
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!isOpen) return;
      if (triggerRef.current && triggerRef.current.contains(e.target as Node)) {
        return;
      }
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(v => v - 1);
    } else {
      setViewMonth(v => v - 1);
    }
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(v => v + 1);
    } else {
      setViewMonth(v => v + 1);
    }
  };

  const selectDay = (day: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const isoString = `${viewYear}-${formattedMonth}-${formattedDay}`;
    onChange(isoString);
    setIsOpen(false);
  };

  const setToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setViewYear(y);
    setViewMonth(today.getMonth());
    setIsOpen(false);
  };

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Formatted display text (DD-MM-YYYY)
  const displayValue = (() => {
    if (!value || value.trim() === '') return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-');
      return `${d}-${m}-${y}`;
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
      return value;
    }
    try {
      const d = parseDate(value);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return value;
    }
  })();

  // Calendar matrix calculation
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getFullYear() === viewYear
    );
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <>
      {/* Input Trigger Box */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={openCalendar}
        className={`w-full h-9 px-3 rounded-[8px] border bg-white text-xs text-[#17191c] flex items-center justify-between text-left transition-colors cursor-pointer select-none ${
          isOpen
            ? 'border-[#17191c] ring-1 ring-[#17191c]/10 shadow-xs'
            : 'border-[#dcdfe4] hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''} ${className}`}
      >
        <span className={displayValue ? 'text-[#17191c] font-medium font-mono text-xs' : 'text-gray-400 font-sans text-xs'}>
          {displayValue || placeholder}
        </span>
        <CalendarIcon className={`w-3.5 h-3.5 shrink-0 transition-colors ${
          isOpen ? 'text-[#c09748]' : 'text-[#777b86]'
        }`} />
      </button>

      {/* PaintKing Custom Calendar Popover Rendered in Portal with z-[999999] */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] pointer-events-auto">
          {/* Backdrop on mobile (dimmed) or transparent capture on desktop */}
          <div 
            className="fixed inset-0 bg-black/45 sm:bg-transparent backdrop-blur-xs sm:backdrop-blur-none transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Calendar Card: Fixed at exact top/left on desktop, centered modal on mobile */}
          <div
            ref={popoverRef}
            style={
              !isMobile && popoverCoords
                ? {
                    position: 'fixed',
                    top: `${popoverCoords.top}px`,
                    left: `${popoverCoords.left}px`,
                  }
                : undefined
            }
            className={`bg-white rounded-[16px] sm:rounded-[14px] border border-[#dcdfe4] shadow-2xl p-4 sm:p-3.5 space-y-2.5 animate-in zoom-in-95 duration-100 w-[290px] sm:w-[280px] ${
              isMobile || !popoverCoords
                ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10'
                : 'z-10'
            }`}
          >
            {/* Header: Month & Year Selector + Controls + Close Button */}
            <div className="flex items-center justify-between pb-2 border-b border-[#f0f0f2]">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-[#17191c]">
                  {MONTH_NAMES[viewMonth]}
                </span>
                <span className="font-mono text-xs text-[#777b86]">
                  {viewYear}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="w-6 h-6 rounded-[6px] hover:bg-gray-100 text-[#777b86] hover:text-[#17191c] flex items-center justify-center transition cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={nextMonth}
                  className="w-6 h-6 rounded-[6px] hover:bg-gray-100 text-[#777b86] hover:text-[#17191c] flex items-center justify-center transition cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {/* Close Cross Button on top right */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6 rounded-full hover:bg-gray-100 text-[#777b86] hover:text-[#17191c] flex items-center justify-center transition cursor-pointer ml-1"
                  title="Close Calendar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {DAY_NAMES.map(d => (
                <div key={d} className="text-[10px] font-bold text-[#777b86] uppercase">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {/* Previous month leading days */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => {
                const prevDayNum = daysInPrevMonth - firstDayOfWeek + idx + 1;
                return (
                  <div
                    key={`prev-${idx}`}
                    className="h-7 sm:h-6.5 flex items-center justify-center text-[11px] text-gray-300 font-mono"
                  >
                    {prevDayNum}
                  </div>
                );
              })}

              {/* Current month active days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const selected = isSelected(dayNum);
                const today = isToday(dayNum);

                return (
                  <button
                    key={`cur-${dayNum}`}
                    type="button"
                    onClick={() => selectDay(dayNum)}
                    className={`h-7 sm:h-6.5 w-full rounded-[6px] font-mono text-xs flex items-center justify-center transition cursor-pointer relative ${
                      selected
                        ? 'bg-[#17191c] text-white font-bold shadow-xs'
                        : today
                        ? 'bg-[#faf7ed] text-[#8a6521] border border-[#f4e5be] font-bold hover:bg-[#faf3e0]'
                        : 'text-[#17191c] hover:bg-[#f4f4f5] font-medium'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {today && !selected && (
                      <span className="w-1 h-1 rounded-full bg-[#c09748] absolute bottom-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Action Footer (Today & Clear Buttons) */}
            <div className="flex items-center justify-between pt-2 border-t border-[#f0f0f2] text-xs">
              <button
                type="button"
                onClick={clearDate}
                className="text-[#777b86] hover:text-rose-600 font-medium cursor-pointer transition flex items-center gap-1 text-[11px]"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>

              <button
                type="button"
                onClick={setToday}
                className="px-3 py-1 rounded-full bg-[#17191c] hover:bg-black text-white font-medium text-xs cursor-pointer shadow-2xs transition"
              >
                Today
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
