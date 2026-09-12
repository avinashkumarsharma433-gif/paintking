import React, { useState, useRef, useCallback } from 'react';
import { Sparkles, ArrowLeftRight } from 'lucide-react';

export const BeforeAfterSlider: React.FC = () => {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary pointer button (left click or single touch)
    if (e.button !== 0) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      updatePosition(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // safe fallback
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto rounded-[24px] overflow-hidden border border-[#ececec] bg-white p-5 sm:p-8 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.06)] select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748]">Spray Painting Transformation</span>
          <h3 className="text-xl sm:text-2xl font-serif text-[#17191c] mt-0.5">Electrical Switchplate Spray Finish Benchmark</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#777b86] bg-[#f2f2f3] px-3.5 py-1.5 rounded-full w-fit">
          <Sparkles size={13} className="text-[#c09748]" />
          <span>Drag bar to inspect transition</span>
        </div>
      </div>

      {/* Interactive Container with unified Pointer Events and touch-none */}
      <div 
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative h-[280px] sm:h-[420px] lg:h-[460px] w-full select-none overflow-hidden rounded-[16px] cursor-ew-resize border border-[#ececec] bg-neutral-900 touch-none"
      >
        {/* BEFORE IMAGE (Full static background on the left side) */}
        <img 
          src="https://res.cloudinary.com/lqmdr4jt/image/upload/v1787137552/paintking/home/before_after/spray-painting-before-raw-substrate.webp" 
          alt="Raw Uncoated Switchplates" 
          className="absolute inset-0 h-full w-full object-cover pointer-events-none select-none"
          draggable={false}
        />

        {/* AFTER IMAGE (Full static image clipped with CSS clip-path revealing right side) */}
        <div 
          className="absolute inset-0 pointer-events-none select-none"
          style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
        >
          <img 
            src="https://res.cloudinary.com/lqmdr4jt/image/upload/v1787137553/paintking/home/before_after/spray-painting-after-pro-finish.webp" 
            alt="Metallic Liquid Spray Finished Switchplates" 
            className="h-full w-full object-cover select-none"
            draggable={false}
          />
        </div>

        {/* DRAGGER BAR DIVIDER */}
        <div 
          className="absolute top-0 bottom-0 z-50 w-[2px] bg-[#c09748] shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-ew-resize pointer-events-none select-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#17191c] text-white shadow-2xl border-2 border-white select-none">
            <ArrowLeftRight size={14} className="text-[#c09748]" />
          </div>
        </div>
      </div>

      {/* Subtext description */}
      <p className="mt-4 text-[13px] text-[#777b86] text-center select-none">
        Raw unpainted Goldmedal modular switchplates transformed with precision metallic liquid spray painting and scratch-resistant 2K polyurethane topcoat.
      </p>
    </div>
  );
};
