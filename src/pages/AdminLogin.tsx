import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, KeySquare, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { hapticFeedback } from '../lib/haptics';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, userData, setUserData } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Hardcoded secure credentials for demonstration purposes
  const ADMIN_USER = "shahidxyz";
  const ADMIN_PASS = "adminxyz";

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    hapticFeedback('medium');
    setError('');

    if (!user) {
      setError('You must be signed in with Google first.');
      return;
    }

    if (userData?.role === 'admin') {
      navigate('/admin');
      return;
    }

    if (username !== ADMIN_USER || password !== ADMIN_PASS) {
      setError('Invalid admin credentials.');
      setPassword('');
      return;
    }

    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 
        role: 'admin',
        createdAt: userData?.createdAt || serverTimestamp() // Ensure createdAt is preserved
      });
      setUserData({ ...userData, role: 'admin' } as any);
      hapticFeedback('heavy');
      navigate('/admin');
    } catch (err) {
      console.error(err);
      setError('Failed to authorize. Check permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 pt-12 pb-32 h-full w-full flex flex-col items-center justify-center min-h-[80vh]"
    >
      <div className="absolute top-6 left-6 md:top-12 md:left-12 z-50">
        <button 
          onClick={() => { hapticFeedback('light'); navigate(-1); }}
          className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-[#0A84FF] to-[#5E5CE6] rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(10,132,255,0.3)]">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-[32px] font-extrabold tracking-tight mb-2">Admin Portal</h1>
          <p className="text-[#8E8E93] text-[15px]">Authenticate to access dashboard.</p>
        </div>

        <form onSubmit={handleAdminAuth} className="glass rounded-[32px] p-8 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-[#0A84FF] to-transparent opacity-60" />
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-2 block">Username</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter admin username..."
                    className="w-full bg-black/40 border border-white/10 text-white text-[15px] p-[16px] pl-[44px] rounded-[16px] outline-none focus:border-[#0A84FF]/50 focus:bg-[#0A84FF]/5 focus:ring-4 focus:ring-[#0A84FF]/10 font-mono transition-all"
                  />
                  <KeySquare size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-2 block">Password</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full bg-black/40 border border-white/10 text-white text-[15px] p-[16px] pl-[44px] rounded-[16px] outline-none focus:border-[#0A84FF]/50 focus:bg-[#0A84FF]/5 focus:ring-4 focus:ring-[#0A84FF]/10 tracking-widest font-mono transition-all"
                  />
                  <KeySquare size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                </div>
              </div>
              
              {error && <p className="text-[#FF453A] text-[13px] mt-1 font-medium flex items-center gap-1.5"><ShieldCheck size={14}/> {error}</p>}
            </div>

            <button 
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full bg-gradient-to-br from-[#0A84FF] to-[#5E5CE6] hover:opacity-90 text-white py-[16px] rounded-[16px] font-bold text-[16px] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#0A84FF]/20"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Authorize'}
            </button>
          </div>
        </form>

        <p className="text-center text-[#8E8E93] text-[12px] mt-8 flex items-center justify-center gap-2">
          <ShieldCheck size={12} /> Protected by Application Security
        </p>
      </div>
    </motion.div>
  );
}
