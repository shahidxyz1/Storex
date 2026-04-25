import React from 'react';

export default function Loader() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0A0A0F] z-50 gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#6C5CE7] animate-spin" />
        <div className="absolute inset-[6px] rounded-full border-2 border-transparent border-t-[#00CEC9] animate-spin" style={{ animationDuration: '0.7s', animationDirection: 'reverse' }} />
      </div>
      <p className="text-[13px] text-[#94A3B8] font-medium tracking-wider animate-pulse">Loading…</p>
    </div>
  );
}
