import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loader() {
  return (
    <div className="fixed inset-0 bg-[#050505] z-[100] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 text-[#0A84FF] animate-spin" />
      <p className="text-[#8E8E93] text-sm font-medium tracking-wide animate-pulse">Loading...</p>
    </div>
  );
}
