import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ShieldCheck, X, User } from 'lucide-react';
import { useStore } from '../store/useStore';
import { auth, loginWithGoogle } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { hapticFeedback } from '../lib/haptics';

export default function AuthModal() {
  const { showAuthModal, authMessage, closeAuthModal } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!showAuthModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    hapticFeedback('medium');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(userCredential.user, { displayName: name });
        }
      }
      closeAuthModal();
      // Reset state for next time
      setEmail('');
      setPassword('');
      setName('');
      setIsLogin(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError('Email already in use.');
      else if (err.code === 'auth/wrong-password') setError('Incorrect password.');
      else if (err.code === 'auth/user-not-found') setError('User not found.');
      else if (err.code === 'auth/weak-password') setError('Password should be at least 6 characters.');
      else setError('Failed to authenticate. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLog = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      closeAuthModal();
    } catch (err) {
      // Error handled in firebase.ts mostly
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md" 
          onClick={closeAuthModal}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-[#1c1c1e] rounded-[32px] p-8 md:p-10 max-w-[400px] w-full shadow-2xl border border-white/10 overflow-hidden"
        >
          <button 
            onClick={closeAuthModal}
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#0A84FF] to-[#5E5CE6]" />
          
          <div className="w-16 h-16 bg-gradient-to-br from-[#0A84FF]/20 to-[#5E5CE6]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-[#0A84FF]" />
          </div>
          
          <h3 className="text-[24px] font-extrabold mb-2 tracking-tight text-center">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h3>
          <p className="text-[#8E8E93] text-[14px] mb-6 leading-relaxed max-w-[280px] mx-auto text-center">
            {authMessage}
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#8E8E93]">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-[16px] py-3.5 pl-12 pr-4 text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#0A84FF] transition-colors text-[15px]"
                />
              </div>
            )}
            
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#8E8E93]">
                <Mail size={18} />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-[16px] py-3.5 pl-12 pr-4 text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#0A84FF] transition-colors text-[15px]"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#8E8E93]">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="Password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-[16px] py-3.5 pl-12 pr-4 text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#0A84FF] transition-colors text-[15px]"
              />
            </div>

            {error && (
              <p className="text-[#FF453A] text-xs font-medium text-center bg-[#FF453A]/10 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/80 text-white py-[16px] rounded-[16px] font-bold text-[16px] transition-all active:scale-95 shadow-[0_0_20px_rgba(10,132,255,0.2)] mt-2 disabled:opacity-50"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>

          <div className="mt-6 border-t border-white/10 pt-6">
            <button 
              onClick={handleGoogleLog}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-200 text-black py-[14px] rounded-[16px] font-bold text-[15px] transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                </g>
              </svg>
              Continue with Google
            </button>
          </div>

          <p className="mt-6 text-center text-[13px] text-[#8E8E93]">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-[#0A84FF] font-bold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
