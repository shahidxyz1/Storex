import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toasts, removeToast } = useStore();

  const icons = {
    success: <CheckCircle2 size={16} className="text-[#34D399] shrink-0" />,
    error: <XCircle size={16} className="text-[#F87171] shrink-0" />,
    info: <Info size={16} className="text-[#60A5FA] shrink-0" />,
  };

  return (
    <div className="fixed bottom-32 left-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none items-center">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-[16px] glass border border-white/10 shadow-xl max-w-[320px] w-full"
          >
            {icons[toast.type]}
            <p className="text-[13px] font-medium text-white/90 flex-1">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="text-white/40 hover:text-white/80 transition-colors">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
