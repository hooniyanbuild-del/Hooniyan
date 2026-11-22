import React, { useState, useRef } from 'react';
import { Sparkles } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  title?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Sebelumnya (Tahap Awal)',
  afterLabel = 'Terkini (Kondisi Lapangan)',
  title,
}) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pos);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      handleMove(e.clientX);
    }
  };

  return (
    <div className="w-full">
      {title && (
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#f95700]" />
            {title}
          </h4>
          <span className="text-[11px] text-gray-400">Geser pembatas untuk membandingkan</span>
        </div>
      )}

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onClick={(e) => handleMove(e.clientX)}
        className="relative w-full h-72 sm:h-96 rounded-xl overflow-hidden select-none cursor-ew-resize border border-[#2c3645] bg-[#12161c]"
      >
        {/* After Image (Background) */}
        <img
          src={afterImage}
          alt="Kondisi Terkini"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Before Image (Clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPos}%` }}
        >
          <img
            src={beforeImage}
            alt="Kondisi Sebelumnya"
            className="absolute inset-0 w-full h-full object-cover max-w-none"
            style={{
              width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%',
              height: '100%',
            }}
          />
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-gray-200 border border-white/10 shadow-sm pointer-events-none">
          {beforeLabel}
        </div>
        <div className="absolute top-3 right-3 bg-[#f95700]/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-white shadow-sm pointer-events-none">
          {afterLabel}
        </div>

        {/* Center Divider Line */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          {/* Circular Drag Handle */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#f95700] text-white flex items-center justify-center shadow-lg border-2 border-white text-xs font-bold">
            ↔
          </div>
        </div>
      </div>
    </div>
  );
};
