import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { logout, loginWithGoogle } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, User as UserIcon, X, LogIn, Settings, Bell, 
  CreditCard, HelpCircle, ChevronRight, ShieldCheck, ChevronLeft,
  Moon, Sun, Smartphone, Volume2, Lock, Heart
} from 'lucide-react';
import { hapticFeedback } from '../lib/haptics';

type ViewState = 'main' | 'preferences' | 'support';

export default function Sidebar() {
  const { isSidebarOpen, setSidebarOpen, user, userData, theme, setTheme } = useStore();
  const [currentView, setCurrentView] = useState<ViewState>('main');
  const navigate = useNavigate();

  const handleClose = () => {
    hapticFeedback('light');
    setSidebarOpen(false);
    setTimeout(() => setCurrentView('main'), 300); // Reset view after close animation
  };

  const slideVariants = {
    initial: (isForward: boolean) => ({
      x: isForward ? 50 : -50,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { type: 'spring', damping: 25, stiffness: 200 }
    },
    exit: (isForward: boolean) => ({
      x: isForward ? -50 : 50,
      opacity: 0,
      transition: { duration: 0.2 }
    })
  };

  const renderHeader = (title: string, onBack: () => void) => (
    <div className="flex items-center justify-between mb-6 mt-4 relative">
      <button 
        onClick={() => { hapticFeedback('light'); onBack(); }}
        className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full active:scale-95 transition-transform absolute left-0"
      >
        <ChevronLeft size={18} />
      </button>
      <h2 className="text-[18px] font-bold tracking-tight w-full text-center">{title}</h2>
      <button 
        onClick={handleClose} 
        className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full active:scale-95 transition-transform absolute right-0"
      >
        <X size={16} />
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[80] transition-opacity"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 250 }}
            className="fixed top-0 left-0 bottom-0 w-[320px] max-w-[85vw] bg-[#050505]/95 backdrop-blur-3xl z-[90] p-6 shadow-2xl border-r border-[#ffffff1f] flex flex-col hide-scrollbar overflow-x-hidden overflow-y-auto"
          >
            <AnimatePresence mode="wait" custom={currentView !== 'main'}>
              {currentView === 'main' && (
                <motion.div 
                  key="main"
                  custom={false}
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="flex-1 flex flex-col h-full w-full"
                >
                  <div className="flex justify-between items-center mb-6 mt-4">
                    <h2 className="text-[24px] font-bold tracking-tight">Profile</h2>
                    <button 
                      onClick={handleClose} 
                      className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full active:scale-95 transition-transform"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col">
                    {user ? (
                      <div className="space-y-6">
                        {/* User Card */}
                        <div className="p-4 glass rounded-[20px] border border-white/10 flex items-center gap-4 relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-br from-[#0A84FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-tr from-[#0A84FF] to-[#5E5CE6] p-[2px] shrink-0 shadow-lg">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-black" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full rounded-full bg-[#1c1c1e] flex items-center justify-center text-white font-bold text-xl border-2 border-black">
                                {user.email?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 z-10">
                            <p className="text-[16px] font-bold truncate leading-tight tracking-tight text-white">{user.displayName || 'User'}</p>
                            <p className="text-[13px] text-[#8E8E93] truncate mt-0.5">{user.email}</p>
                            <div className="mt-2 inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md border border-white/5">
                              <ShieldCheck size={12} className={userData?.role === 'admin' ? "text-[#32D74B]" : "text-[#0A84FF]"} />
                              <span className="text-[10px] uppercase tracking-wider font-bold text-white/90">{userData?.role || 'Member'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Settings Menu */}
                        <div className="glass rounded-[20px] border border-white/10 overflow-hidden divide-y divide-white/5">
                          <button 
                            onClick={() => { hapticFeedback('light'); navigate('/history'); handleClose(); }}
                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 active:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <CreditCard size={18} className="text-[#32D74B]" />
                              <span className="text-[15px] font-medium text-white/90">Purchase History</span>
                            </div>
                            <ChevronRight size={16} className="text-[#8E8E93]/50" />
                          </button>
                          <button 
                            onClick={() => { hapticFeedback('light'); navigate('/wishlist'); handleClose(); }}
                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 active:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Heart size={18} className="text-[#FF453A]" />
                              <span className="text-[15px] font-medium text-white/90">My Wishlist</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {userData?.wishlist && userData.wishlist.length > 0 && (
                                <span className="text-[12px] bg-white/10 text-white/80 px-2 py-0.5 rounded-md font-bold">{userData.wishlist.length}</span>
                              )}
                              <ChevronRight size={16} className="text-[#8E8E93]/50" />
                            </div>
                          </button>
                          <button 
                            onClick={() => { hapticFeedback('light'); navigate('/admin'); handleClose(); }}
                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 active:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <ShieldCheck size={18} className="text-[#0A84FF]" />
                              <span className="text-[15px] font-medium text-white/90">Admin Portal</span>
                            </div>
                            <ChevronRight size={16} className="text-[#8E8E93]/50" />
                          </button>
                          {[
                            { icon: Settings, label: 'Preferences', id: 'preferences', color: 'text-[#8E8E93]' },
                            { icon: HelpCircle, label: 'Help & Support', id: 'support', color: 'text-[#8E8E93]' }
                          ].map((item) => (
                            <button 
                              key={item.id} 
                              onClick={() => { hapticFeedback('light'); setCurrentView(item.id as ViewState); }}
                              className="w-full flex items-center justify-between p-4 hover:bg-white/5 active:bg-white/10 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <item.icon size={18} className={item.color} />
                                <span className="text-[15px] font-medium text-white/90">{item.label}</span>
                              </div>
                              <ChevronRight size={16} className="text-[#8E8E93]/50" />
                            </button>
                          ))}
                        </div>

                        {/* Sign Out Button */}
                        <div className="mt-auto pt-6">
                          <button 
                            onClick={() => { hapticFeedback('heavy'); logout(); handleClose(); }}
                            className="w-full py-4 rounded-[16px] font-bold text-[#FF453A] bg-[#FF453A]/10 hover:bg-[#FF453A]/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                            <LogOut size={18} /> Sign Out
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6">
                        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                          <UserIcon size={32} className="text-[#8E8E93]" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-2">Sign in to save assets</h3>
                          <p className="text-[14px] text-[#8E8E93] leading-relaxed">Access your library, wishlist, and preferences across all devices.</p>
                        </div>
                        <button 
                          onClick={() => { hapticFeedback('heavy'); loginWithGoogle(); }}
                          className="w-full py-4 rounded-[16px] font-bold bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white shadow-lg shadow-[#0A84FF]/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <LogIn size={18} /> Continue with Google
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Preferences View */}
              {currentView === 'preferences' && (
                <motion.div 
                  key="preferences"
                  custom={true}
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="flex-1 flex flex-col h-full w-full"
                >
                  {renderHeader('Preferences', () => setCurrentView('main'))}
                  <div className="space-y-6">
                    <div className="glass rounded-[20px] border border-white/10 overflow-hidden divide-y divide-white/5">
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Moon size={18} className="text-[#0A84FF]" />
                          <span className="text-[15px] font-medium text-white/90">Appearance</span>
                        </div>
                        <select 
                          value={theme}
                          onChange={(e) => setTheme(e.target.value as any)}
                          className="bg-white/10 rounded-md text-sm px-3 py-1 outline-none focus:ring-2 focus:ring-[#0A84FF]"
                        >
                          <option value="system">System</option>
                          <option value="dark">Dark</option>
                          <option value="light">Light</option>
                        </select>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Volume2 size={18} className="text-[#32D74B]" />
                          <span className="text-[15px] font-medium text-white/90">Sound Effects</span>
                        </div>
                        <div className="w-10 h-6 bg-[#32D74B] rounded-full relative cursor-pointer shadow-inner">
                          <div className="absolute right-1 top-1 bottom-1 w-4 bg-white rounded-full transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Support View */}
              {currentView === 'support' && (
                <motion.div 
                  key="support"
                  custom={true}
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="flex-1 flex flex-col h-full w-full"
                >
                  {renderHeader('Help & Support', () => setCurrentView('main'))}
                  <div className="space-y-4">
                    <div className="glass p-5 rounded-[20px] border border-white/10">
                      <h4 className="font-bold mb-2">Need help?</h4>
                      <p className="text-[13px] text-[#8E8E93] leading-relaxed mb-4">You can reach out to our support team for any issues regarding your purchases.</p>
                      <button className="w-full py-3 rounded-[12px] bg-white/10 hover:bg-white/20 font-semibold text-[14px] transition-colors">Contact Support</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
