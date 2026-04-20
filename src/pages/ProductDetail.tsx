import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, onSnapshot, collection } from 'firebase/firestore';
import { db, loginWithGoogle } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { ArrowLeft, Download, Check, Heart, ShieldCheck, QrCode, Keyboard, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { hapticFeedback } from '../lib/haptics';
import LazyImage from '../components/LazyImage';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userData, setUserData } = useStore();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwned, setIsOwned] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const pSnap = await getDoc(doc(db, 'products', id));
        if (pSnap.exists()) {
          setProduct({ id: pSnap.id, ...pSnap.data() });
        }
        if (user) {
          const dSnap = await getDoc(doc(db, `users/${user.uid}/downloads`, id));
          if (dSnap.exists()) setIsOwned(true);
          
          if (userData?.wishlist && userData.wishlist.includes(id)) {
            setInWishlist(true);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [id, user, userData]);

  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'review' | 'payment' | 'processing' | 'success' | 'failed'>('review');
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [utrCode, setUtrCode] = useState('');
  const [purchaseDocId, setPurchaseDocId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState('');

  useEffect(() => {
    if (checkoutStep === 'processing' && timeRemaining > 0) {
      const timer = setInterval(() => setTimeRemaining(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (checkoutStep === 'processing' && timeRemaining <= 0) {
      setCheckoutStep('failed');
    }
  }, [checkoutStep, timeRemaining]);

  useEffect(() => {
    if (checkoutStep === 'processing' && purchaseDocId) {
      const unsub = onSnapshot(doc(db, 'purchases', purchaseDocId), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.status === 'approved') {
            finalizePurchase(data.paidAmount);
            setCheckoutStep('success');
          } else if (data.status === 'amount_mismatch') {
            setCheckoutStep('failed');
          }
        }
      });
      return () => unsub();
    }
  }, [checkoutStep, purchaseDocId]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError('');
    try {
      const couponRef = doc(db, 'coupons', couponCode.trim().toUpperCase());
      const couponSnap = await getDoc(couponRef);
      if (couponSnap.exists()) {
        const data = couponSnap.data();
        
        let isExpired = false;
        if (data.expiresAt) {
          const expiryDate = new Date(data.expiresAt);
          // Set to end of the day or just compare precisely. Let's compare as start of day for simplicity,
          // or just direct Date comparison.
          if (new Date() > expiryDate) {
             isExpired = true;
          }
        }

        if (data.isActive && !isExpired) {
          setAppliedDiscount(data.discountPercent);
          hapticFeedback('medium');
        } else if (isExpired) {
          setCouponError('This coupon has expired.');
          setAppliedDiscount(0);
        } else {
          setCouponError('Coupon is no longer active.');
          setAppliedDiscount(0);
        }
      } else {
        setCouponError('Invalid coupon code.');
        setAppliedDiscount(0);
      }
    } catch (e) {
      setCouponError('Error verifying coupon.');
      setAppliedDiscount(0);
    }
  };

  const getFinalPrice = () => {
    if (!product) return 0;
    return product.price > 0 ? product.price - (product.price * (appliedDiscount / 100)) : 0;
  };

  const handleGetProduct = async () => {
    hapticFeedback('medium');
    if (!user) {
      setAuthModalMessage('Sign in to purchase this product.');
      setShowAuthModal(true);
      return;
    }
    if (!id || !product) return;

    if (product.price > 0 && !showCheckout) {
      setShowCheckout(true);
      setCheckoutStep('review');
      setTimeRemaining(180);
      setUtrCode('');
      setPurchaseDocId(null);
      return;
    }

    const finalPrice = getFinalPrice();

    if (finalPrice > 0) {
      if (checkoutStep === 'review') {
        setCheckoutStep('payment');
        return;
      }
      
      if (checkoutStep === 'payment') {
        if (utrCode.trim().length < 6) {
          alert('Please enter a valid Transaction / UTR ID.');
          return;
        }

        try {
          const purchasePayload: any = {
            utr: utrCode.trim(),
            status: 'pending',
            requiredAmount: finalPrice,
            userId: user.uid,
            productId: id,
            timestamp: serverTimestamp()
          };
          if (appliedDiscount > 0) {
            purchasePayload.couponUsed = couponCode.trim().toUpperCase();
          }

          const purchaseDocRef = doc(db, 'purchases', utrCode.trim());
          await setDoc(purchaseDocRef, purchasePayload);
          setPurchaseDocId(purchaseDocRef.id);
          setCheckoutStep('processing');
        } catch (e) {
          console.error('Failed to initialize local payment verification', e);
          alert('System verification error.');
        }
      }
    } else {
      await finalizePurchase(0);
      setIsOwned(true);
      setShowCheckout(false);
      hapticFeedback('heavy');
    }
  };

  const finalizePurchase = async (paidAmount: number) => {
    try {
      const downloadRef = doc(db, `users/${user!.uid}/downloads`, id!);
      const purchaseData: any = {
        productId: id,
        amountPaid: paidAmount,
        obtainedAt: serverTimestamp()
      };
      if (appliedDiscount > 0) {
        purchaseData.couponUsed = couponCode.trim().toUpperCase();
      }
      await setDoc(downloadRef, purchaseData);
      setIsOwned(true);
    } catch (e) {
      console.error('Finalize error', e);
    }
  };

  const toggleWishlist = async () => {
    hapticFeedback('light');
    if (!user) {
      setAuthModalMessage('Sign in to add this to your wishlist.');
      setShowAuthModal(true);
      return;
    }
    
    const userRef = doc(db, 'users', user.uid);
    try {
      if (inWishlist) {
        await updateDoc(userRef, { wishlist: arrayRemove(id) });
        setInWishlist(false);
        if (userData) setUserData({ ...userData, wishlist: (userData.wishlist || []).filter((wId: string) => wId !== id) });
      } else {
        await updateDoc(userRef, { wishlist: arrayUnion(id) });
        setInWishlist(true);
        if (userData) setUserData({ ...userData, wishlist: [...(userData.wishlist || []), id!] });
      }
    } catch(e) {
      console.error("Wishlist toggle error", e);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pt-24 text-[#8E8E93]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A84FF]" />
      </div>
    );
  }

  if (!product) {
    return <div className="text-center pt-24 text-[#8E8E93]">Product not found.</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col md:flex-row w-full pb-32 md:pb-6 relative z-10"
    >
      <button 
        onClick={() => { hapticFeedback('light'); navigate(-1); }}
        className="absolute top-6 left-6 z-50 w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center active:scale-95 transition-transform"
      >
        <ArrowLeft size={20} />
      </button>
      
      <button 
        onClick={toggleWishlist}
        className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center active:scale-95 transition-transform"
      >
        <Heart size={20} className={inWishlist ? "fill-[#FF453A] text-[#FF453A]" : ""} />
      </button>

      <div className="h-[45vh] md:h-screen md:sticky md:top-0 md:w-1/2 relative bg-black shrink-0">
        <LazyImage 
          src={product.imageUrl} 
          alt={product.title} 
          className="w-full h-full object-cover opacity-80" 
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050505] md:from-[#050505]/80 to-transparent pointer-events-none" />
      </div>

      <div className="px-6 md:px-10 relative z-10 mt-6 md:mt-0 md:w-1/2 flex flex-col md:pt-14">
        <p className="text-[13px] text-[#8E8E93] uppercase tracking-[1px] font-semibold mb-1">{product.category}</p>
        <h1 className="text-[28px] md:text-[40px] font-bold tracking-[-0.5px] mb-4">{product.title}</h1>
        
        <p className="text-[#8E8E93] leading-relaxed text-[15px] md:text-[17px] mb-8">
          {product.description}
        </p>

        <div className="fixed bottom-[100px] left-6 right-6 md:relative md:bottom-auto md:left-auto md:right-auto md:w-full z-50 mt-auto md:pt-10">
          <button
            onClick={isOwned ? undefined : handleGetProduct}
            className={`w-full py-[18px] md:py-5 rounded-[18px] md:rounded-[24px] font-bold text-[16px] md:text-[18px] flex items-center justify-center gap-2 transition-all shadow-2xl backdrop-blur-lg border border-white/20 ${
              isOwned 
                ? 'bg-[#32D74B] text-black' 
                : 'bg-white/90 hover:bg-white text-black hover:scale-[1.02] active:scale-95 hover:shadow-white/20'
            }`}
          >
            {isOwned ? (
              <>
                <Check size={22} />
                Acquired
              </>
            ) : (
              <>
                <Download size={22} />
                {product.price > 0 ? `Buy for ₹${product.price}` : 'Get Product Free'}
              </>
            )}
          </button>
          {isOwned && (
            <div className="mt-2 text-center text-xs text-green-600 dark:text-green-400 font-medium">
              Available in your Library
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
      {showCheckout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => checkoutStep === 'review' || checkoutStep === 'payment' ? setShowCheckout(false) : null} 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-[#13131a] rounded-[24px] overflow-y-auto w-full max-w-[420px] max-h-[85svh] shadow-[0_0_80px_rgba(99,102,241,0.08),0_40px_80px_rgba(0,0,0,0.5)] border border-white/10"
          >
            <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-[#6366f1] to-transparent opacity-60" />

            {/* REVIEW STEP */}
            {checkoutStep === 'review' && (
              <div className="p-6">
                <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-4">
                  <span className="text-[13px] text-white/40 tracking-widest uppercase">Secure Checkout</span>
                  <span className="flex items-center gap-1.5 bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] text-[11px] px-3 py-1 rounded-full font-medium tracking-wide">
                    <ShieldCheck size={12} /> SECURED
                  </span>
                </div>
                
                <h3 className="text-2xl font-bold mb-6">Order Details</h3>
                
                <div className="bg-white/[0.03] rounded-[16px] p-5 mb-5 border border-white/5 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#8E8E93]">Subtotal</span>
                    <span className="font-semibold">₹{product.price.toFixed(2)}</span>
                  </div>
                  
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between items-center text-sm text-[#10b981]">
                      <span>Discount ({appliedDiscount}%)</span>
                      <span>-₹{(product.price * (appliedDiscount / 100)).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="w-full h-[1px] bg-white/10 my-3" />
                  
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span className="flex items-baseline gap-1 text-[#6366f1]">
                      <span className="text-sm text-[#6366f1]/70">₹</span>
                      {getFinalPrice().toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-2 block">COUPON CODE</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="bg-white/[0.04] border border-white/10 text-white w-full text-[14px] p-[14px] rounded-[12px] outline-none focus:border-[#6366f1]/50 focus:bg-[#6366f1]/5 focus:ring-4 focus:ring-[#6366f1]/10 uppercase tracking-wider font-mono transition-all"
                    />
                    <button 
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim()}
                      className="bg-white/10 hover:bg-white/15 px-5 py-[14px] rounded-[12px] text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-[#ef4444] text-[12px] mt-2 font-medium">{couponError}</p>}
                  {appliedDiscount > 0 && <p className="text-[#10b981] text-[12px] mt-2 font-medium">Coupon applied successfully!</p>}
                </div>

                <button
                  onClick={handleGetProduct}
                  className="w-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] hover:opacity-90 text-white py-[16px] rounded-[12px] font-semibold text-[15px] transition-all active:scale-[0.98] shadow-lg shadow-[#6366f1]/25 flex justify-center items-center gap-2"
                >
                  <ShieldCheck size={18} /> Confirm Purchase
                </button>
              </div>
            )}

            {/* PAYMENT STEP */}
            {checkoutStep === 'payment' && (
              <div className="p-0">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <span className="text-[13px] text-white/40 tracking-widest uppercase">Script Mastery</span>
                  <span className="flex items-center gap-1.5 bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] text-[11px] px-3 py-1 rounded-full font-medium tracking-wide">
                    <ShieldCheck size={12} /> SECURED
                  </span>
                </div>
                
                <div className="p-6 border-b border-white/5">
                  <div className="text-[11px] text-white/35 uppercase tracking-widest mb-2">Amount to pay</div>
                  <div className="flex items-baseline gap-2 text-white font-mono text-[42px] font-bold tracking-tight leading-none">
                    <span className="text-[#6366f1] text-[24px]">₹</span>{getFinalPrice().toFixed(2)}
                  </div>
                  <div className="text-[12px] text-white/30 mt-2">Product: {product.title}</div>
                </div>

                <div className="p-6 border-b border-white/5 text-center">
                  <div className="flex items-center justify-center gap-2 text-[11px] text-white/35 uppercase tracking-widest mb-5 relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[30%] before:h-[1px] before:bg-white/5 after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:w-[30%] after:h-[1px] after:bg-white/5">
                    <QrCode size={14} className="text-[#6366f1]" /> Step 1 — Scan & Pay
                  </div>
                  
                  <div className="bg-white p-3 rounded-[16px] inline-block mb-4 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    <QRCode
                       value={`upi://pay?pa=bitcoin94v234@okaxis&pn=Store&am=${getFinalPrice().toFixed(2)}&cu=INR`}
                       size={140}
                       level="H"
                    />
                  </div>
                  <div className="flex justify-center gap-2">
                    <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[12px] font-medium text-white/70">UPI</div>
                    <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[12px] font-medium text-white/70">Card</div>
                    <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[12px] font-medium text-white/70">Wallet</div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 text-[11px] text-white/35 uppercase tracking-widest mb-4">
                    <Keyboard size={14} className="text-[#6366f1]" /> Step 2 — Enter Transaction ID
                  </div>
                  
                  <div className="mb-4">
                    <label className="text-[11px] text-white/40 uppercase tracking-widest block mb-2">Transaction / Order ID (UTR)</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={utrCode}
                        onChange={(e) => setUtrCode(e.target.value)}
                        placeholder="e.g. 512345678901" 
                        className="w-full bg-white/[0.04] border border-white/10 rounded-[12px] py-[14px] pl-[14px] pr-[42px] text-white font-mono text-[14px] tracking-wide outline-none focus:border-[#6366f1]/50 focus:bg-[#6366f1]/5 focus:ring-4 focus:ring-[#6366f1]/10 transition-all"
                      />
                      <Keyboard size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" />
                    </div>
                  </div>

                  <button 
                    onClick={handleGetProduct}
                    className="w-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] hover:opacity-90 text-white py-[16px] rounded-[12px] font-semibold text-[15px] transition-all active:scale-[0.98] shadow-lg shadow-[#6366f1]/25 flex justify-center items-center gap-2"
                  >
                    <ShieldCheck size={18} /> Verify & Confirm Payment
                  </button>
                </div>
              </div>
            )}

            {/* PROCESSING STEP */}
            {checkoutStep === 'processing' && (
              <div className="p-10 text-center flex flex-col items-center">
                <div className="relative w-[72px] h-[72px] mb-6">
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#6366f1] animate-[spin_1s_linear_infinite]" />
                  <div className="absolute inset-[10px] rounded-full border-2 border-transparent border-t-[#8b5cf6] animate-[spin_0.7s_linear_infinite_reverse]" />
                  <div className="absolute inset-0 flex items-center justify-center text-[#6366f1]">
                    <ShieldCheck size={20} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Verifying Payment</h3>
                <p className="text-[13px] text-white/40 mb-6 leading-relaxed">Securing connection to banking gateway.<br/>Do not go back or refresh the page.</p>
                <div className="bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-[12px] py-3 px-6 mb-4">
                  <span className="font-mono text-[28px] font-bold text-[#6366f1] tracking-wider">
                    {Math.floor(timeRemaining / 60).toString().padStart(2, '0')}:{(timeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <p className="text-[11px] text-white/20">Auto-verification in progress...</p>
              </div>
            )}

            {/* SUCCESS STEP */}
            {checkoutStep === 'success' && (
              <div className="p-10 text-center flex flex-col items-center">
                <div className="w-[72px] h-[72px] bg-[#10b981]/10 border-[2px] border-[#10b981]/30 rounded-full flex items-center justify-center mb-6 text-[#10b981] shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <Check size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Payment Verified!</h3>
                <p className="text-[14px] text-white/50 mb-8">₹{getFinalPrice().toFixed(2)} successfully received.<br/>Your product is ready.</p>
                
                <button 
                  onClick={() => setShowCheckout(false)}
                  className="w-full bg-[#10b981]/10 border border-[#10b981]/30 hover:bg-[#10b981]/20 text-[#10b981] py-[16px] rounded-[12px] font-bold text-[15px] transition-all active:scale-[0.98] flex justify-center items-center gap-2"
                >
                  <Download size={18} /> Access Product
                </button>
              </div>
            )}

            {/* FAILED STEP */}
            {checkoutStep === 'failed' && (
              <div className="p-10 text-center flex flex-col items-center">
                <div className="w-[72px] h-[72px] bg-[#ef4444]/10 border-[2px] border-[#ef4444]/30 rounded-full flex items-center justify-center mb-6 text-[#ef4444] shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                  <ShieldAlert size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Verification Failed</h3>
                <p className="text-[13px] text-white/50 mb-8 leading-relaxed">
                  Either a timeout occurred, an invalid Transaction ID was entered, or a wrong amount was detected. If deducted, money will be refunded in 3-5 days.
                </p>
                <button 
                  onClick={() => { setCheckoutStep('review'); setUtrCode(''); setPurchaseDocId(null); }}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-[16px] rounded-[12px] font-bold text-[15px] transition-all active:scale-[0.98] flex justify-center items-center gap-2"
                >
                  Try Again
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            onClick={() => setShowAuthModal(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-[#1c1c1e] rounded-[32px] p-8 md:p-10 max-w-[400px] w-full shadow-2xl border border-white/10 text-center overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#0A84FF] to-[#5E5CE6]" />
            <div className="w-20 h-20 bg-gradient-to-br from-[#0A84FF]/20 to-[#5E5CE6]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck size={36} className="text-[#0A84FF]" />
            </div>
            <h3 className="text-[24px] font-extrabold mb-3 tracking-tight">Authentication Required</h3>
            <p className="text-[#8E8E93] text-[15px] mb-8 leading-relaxed max-w-[280px] mx-auto">
              {authModalMessage}
            </p>
            
            <button 
              onClick={async () => {
                hapticFeedback('medium');
                try {
                  await loginWithGoogle();
                  setShowAuthModal(false);
                } catch(e) {
                  console.error(e);
                }
              }}
              className="w-full bg-white hover:bg-gray-200 text-black py-[16px] rounded-[16px] font-bold text-[16px] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.2)] mb-4"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                </g>
              </svg>
              Continue with Google
            </button>

            <button 
              onClick={() => setShowAuthModal(false)}
              className="w-full text-[#8E8E93] hover:text-white py-3 font-semibold text-[14px] transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

    </motion.div>
  );
}
