import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface ScrollRemainingToastProps {
  containerRef: React.RefObject<HTMLElement | null>;
  totalCount?: number;
  label?: string; // Optional custom text, defaults to "MORE ITEMS BELOW"
  className?: string;
  position?: 'top' | 'bottom';
}

export const ScrollRemainingToast: React.FC<ScrollRemainingToastProps> = ({
  containerRef,
  totalCount,
  label = 'MORE ITEMS BELOW',
  className = '',
  position = 'top',
}) => {
  const [showToast, setShowToast] = useState(false);
  const [estimatedBelow, setEstimatedBelow] = useState<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const checkScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const scrollBottom = scrollHeight - scrollTop - clientHeight;
      
      // If there's more than 20px of content below
      if (scrollBottom > 20) {
        setShowToast(true);
        if (totalCount && totalCount > 0 && scrollHeight > 0) {
          // Estimate how many items are hidden below
          const fractionRemaining = scrollBottom / scrollHeight;
          const count = Math.max(1, Math.round(totalCount * fractionRemaining));
          setEstimatedBelow(count);
        } else {
          setEstimatedBelow(0);
        }
      } else {
        setShowToast(false);
      }
    };

    // Initial check
    checkScroll();

    // Listen to scroll & resize
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    // MutationObserver to detect child items being added or removed
    const observer = new MutationObserver(checkScroll);
    observer.observe(el, { childList: true, subtree: true });

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      observer.disconnect();
    };
  }, [containerRef, totalCount]);

  if (!showToast) return null;

  const handleScrollDown = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        top: 140,
        behavior: 'smooth',
      });
    }
  };

  if (position === 'top') {
    return (
      <div className={`flex items-center justify-between px-3 py-1.5 rounded-[8px] bg-amber-50/90 border border-amber-200/70 text-[11px] font-medium text-amber-900 ${className}`}>
        <div className="flex items-center gap-1.5">
          <ChevronDown className="w-3.5 h-3.5 text-[#c09748] animate-bounce shrink-0" />
          <span>
            {estimatedBelow > 0 ? `${estimatedBelow} ` : ''}
            {label}
          </span>
        </div>
        <button
          type="button"
          onClick={handleScrollDown}
          className="text-[10px] font-bold underline underline-offset-2 text-[#c09748] hover:text-[#a97e35] cursor-pointer"
        >
          Scroll down ↓
        </button>
      </div>
    );
  }

  return (
    <div className={`pointer-events-none absolute bottom-1.5 left-0 right-0 z-30 flex justify-center ${className}`}>
      <button
        type="button"
        onClick={handleScrollDown}
        className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-white/95 backdrop-blur-md border border-[#dcdfe4] text-[10.5px] font-semibold text-[#17191c] shadow-md hover:shadow-lg hover:bg-white hover:border-[#17191c]/30 active:scale-95 transition-all cursor-pointer select-none tracking-wide animate-in fade-in slide-in-from-bottom-2 duration-150"
      >
        <ChevronDown className="w-3.5 h-3.5 text-[#c09748] animate-bounce shrink-0" />
        <span>
          {estimatedBelow > 0 ? `${estimatedBelow} ` : ''}
          {label}
        </span>
      </button>
    </div>
  );
};
