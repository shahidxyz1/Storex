import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { Plus, Edit2, Trash2, Tag, Box } from 'lucide-react';
import { hapticFeedback } from '../lib/haptics';

export default function AdminDashboard() {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<'products'|'coupons'>('products');
  const [products, setProducts] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    id: '', title: '', description: '', category: '', imageUrl: '', downloadUrl: '', price: 0
  });

  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '', discountPercent: 10, isActive: true
  });

  const fetchProducts = async () => {
    const snap = await getDocs(collection(db, 'products'));
    setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchCoupons = async () => {
    const snap = await getDocs(collection(db, 'coupons'));
    setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchProducts();
    fetchCoupons();
  }, []);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const productId = productForm.id || Math.random().toString(36).substr(2, 9);
    
    try {
      if (productForm.id) {
        const existing = products.find(p => p.id === productId);
        if (!existing) return;
        
        await setDoc(doc(db, 'products', productId), {
            title: productForm.title,
            description: productForm.description,
            category: productForm.category,
            imageUrl: productForm.imageUrl || `https://picsum.photos/seed/${productId}/800/800`,
            downloadUrl: productForm.downloadUrl || 'https://example.com/download.zip',
            price: Number(productForm.price) || 0,
            createdAt: existing.createdAt,
            createdBy: existing.createdBy
         });
      } else {
         await setDoc(doc(db, 'products', productId), {
            title: productForm.title,
            description: productForm.description,
            category: productForm.category,
            imageUrl: productForm.imageUrl || `https://picsum.photos/seed/${productId}/800/800`,
            downloadUrl: productForm.downloadUrl || 'https://example.com/download.zip',
            price: Number(productForm.price) || 0,
            createdAt: serverTimestamp(),
            createdBy: user.uid
         });
      }
      hapticFeedback('medium');
      setShowProductForm(false);
      setProductForm({ id: '', title: '', description: '', category: '', imageUrl: '', downloadUrl: '', price: 0 });
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to save product.");
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const code = couponForm.code.toUpperCase().trim();
      if (!code) return;

      const existing = coupons.find(c => c.id === code);

      if (existing) {
        await setDoc(doc(db, 'coupons', code), { 
          code: code,
          discountPercent: Number(couponForm.discountPercent) || 0,
          isActive: Boolean(couponForm.isActive),
          createdAt: existing.createdAt,
          createdBy: existing.createdBy
        });
      } else {
        await setDoc(doc(db, 'coupons', code), {
          code: code,
          discountPercent: Number(couponForm.discountPercent) || 0,
          isActive: Boolean(couponForm.isActive),
          createdAt: serverTimestamp(),
          createdBy: user.uid
        });
      }

      hapticFeedback('medium');
      setShowCouponForm(false);
      setCouponForm({ code: '', discountPercent: 10, isActive: true });
      fetchCoupons();
    } catch (err) {
      console.error(err);
      alert("Failed to save coupon. " + (err as Error).message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Delete product?")) {
      hapticFeedback('medium');
      await deleteDoc(doc(db, 'products', id));
      fetchProducts();
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (confirm("Delete coupon?")) {
      hapticFeedback('medium');
      await deleteDoc(doc(db, 'coupons', code));
      fetchCoupons();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 pb-32 w-full">
      <div className="admin-glass rounded-[32px] p-[24px] md:p-[40px] flex flex-col gap-[30px]">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[12px] text-[#8E8E93] uppercase tracking-[1px] font-semibold">Management Console</p>
            <h2 className="text-[32px] font-bold">Dashboard</h2>
          </div>
          <div className="badge-ios" style={{ padding: '8px 16px' }}>ADMIN: ACTIVE</div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-white/10 pb-4">
          <button 
            onClick={() => { hapticFeedback('light'); setActiveTab('products'); setShowProductForm(false); setShowCouponForm(false); }}
            className={`flex items-center gap-2 font-semibold transition-colors ${activeTab === 'products' ? 'text-white' : 'text-[#8E8E93] hover:text-white/80'}`}
          >
            <Box size={18} /> Products
          </button>
          <button 
            onClick={() => { hapticFeedback('light'); setActiveTab('coupons'); setShowProductForm(false); setShowCouponForm(false); }}
            className={`flex items-center gap-2 font-semibold transition-colors ${activeTab === 'coupons' ? 'text-white' : 'text-[#8E8E93] hover:text-white/80'}`}
          >
            <Tag size={18} /> Coupons
          </button>
        </div>

        {activeTab === 'products' && (
          !showProductForm ? (
            <>
              <button 
                onClick={() => { hapticFeedback('light'); setShowProductForm(true); }}
                className="btn-ios w-full py-[16px] text-[15px] flex items-center justify-center gap-2"
              >
                <Plus size={20} /> Add New Product
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[12px]">
                {products.map(p => (
                  <div key={p.id} className="glass p-[12px] rounded-[18px] flex items-center justify-between gap-[12px]">
                    <div className="flex-1 pl-2 min-w-0">
                      <h4 className="font-semibold text-[14px] truncate">{p.title}</h4>
                      <p className="text-[12px] text-[#8E8E93] truncate">{p.category} • ${p.price ?? 0}</p>
                    </div>
                    <div className="flex gap-2 text-[#8E8E93] shrink-0">
                      <button onClick={() => {
                        setProductForm(p);
                        setShowProductForm(true);
                      }} className="p-2 bg-white/10 rounded-full shadow-sm hover:text-[#0A84FF] transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-white/10 rounded-full shadow-sm hover:text-[#FF453A] transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <form onSubmit={handleSaveProduct} className="flex flex-col gap-[15px] glass p-6 md:p-8 rounded-[24px] border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0A84FF] to-[#32D74B]" />
              <h3 className="text-[20px] font-bold mb-[10px] flex items-center gap-2">
                <Box className="text-[#0A84FF]" size={22} /> {productForm.id ? 'Edit Product' : 'Add New Product'}
              </h3>
              <div className="flex flex-col gap-[8px]">
                <label className="text-[12px] font-bold text-[#8E8E93] tracking-wide uppercase">Product Title</label>
                <input required type="text" placeholder="Enter product name..." value={productForm.title} onChange={e => setProductForm({...productForm, title: e.target.value})} className="input-dark w-full text-[14px] p-[16px] rounded-[14px] outline-none focus:ring-1 focus:ring-[#0A84FF] border border-white/5 bg-black/40" />
              </div>
              <div className="flex flex-col gap-[8px]">
                <label className="text-[12px] font-bold text-[#8E8E93] tracking-wide uppercase">Description</label>
                <textarea required placeholder="Product Description..." value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="input-dark w-full text-[14px] p-[16px] rounded-[14px] outline-none focus:ring-1 focus:ring-[#0A84FF] h-32 resize-none border border-white/5 bg-black/40" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[15px]">
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[12px] font-bold text-[#8E8E93] tracking-wide uppercase">Category</label>
                  <input required type="text" placeholder="Select Category" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="input-dark w-full text-[14px] p-[16px] rounded-[14px] outline-none focus:ring-1 focus:ring-[#0A84FF] border border-white/5 bg-black/40" />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[12px] font-bold text-[#8E8E93] tracking-wide uppercase">Price ($)</label>
                  <input required type="number" min="0" step="1" placeholder="0.00" value={productForm.price === 0 ? '' : productForm.price} onChange={e => setProductForm({...productForm, price: parseFloat(e.target.value) || 0})} className="input-dark w-full text-[14px] p-[16px] rounded-[14px] outline-none focus:ring-1 focus:ring-[#0A84FF] border border-white/5 bg-black/40" />
                </div>
              </div>
              <div className="flex flex-col gap-[8px]">
                <label className="text-[12px] font-bold text-[#8E8E93] tracking-wide uppercase">Image URL</label>
                <input type="text" placeholder="https://..." value={productForm.imageUrl} onChange={e => setProductForm({...productForm, imageUrl: e.target.value})} className="input-dark w-full text-[14px] p-[16px] rounded-[14px] outline-none focus:ring-1 focus:ring-[#0A84FF] border border-white/5 bg-black/40" />
              </div>
              <div className="flex flex-col gap-[8px]">
                <label className="text-[12px] font-bold text-[#8E8E93] tracking-wide uppercase">File Upload URL</label>
                <input type="text" placeholder="Download File URL (optional)" value={productForm.downloadUrl} onChange={e => setProductForm({...productForm, downloadUrl: e.target.value})} className="input-dark w-full text-[14px] p-[16px] rounded-[14px] outline-none border border-white/10 hover:border-white/20 border-dashed bg-black/40 text-center transition-colors" />
              </div>
              
              <div className="flex gap-3 pt-6 mt-[10px] border-t border-white/10">
                <button type="button" onClick={() => { setShowProductForm(false); setProductForm({ id: '', title: '', description: '', category: '', imageUrl: '', downloadUrl: '', price: 0 }); }} className="flex-1 py-[16px] rounded-[14px] font-bold bg-white/5 hover:bg-white/10 text-white transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-[16px] rounded-[14px] font-bold bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white shadow-lg shadow-[#0A84FF]/20 transition-all">Save Product</button>
              </div>
            </form>
          )
        )}

        {activeTab === 'coupons' && (
          !showCouponForm ? (
            <>
              <button 
                onClick={() => { hapticFeedback('light'); setShowCouponForm(true); }}
                className="btn-ios w-full py-[16px] text-[15px] flex items-center justify-center gap-2"
              >
                <Plus size={20} /> Generate Coupon
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[12px]">
                {coupons.map(c => (
                  <div key={c.id} className="glass p-[12px] rounded-[18px] flex items-center justify-between gap-[12px]">
                    <div className="flex-1 pl-2 min-w-0">
                      <h4 className="font-semibold text-[14px] truncate text-[#0A84FF]">{c.code}</h4>
                      <p className="text-[12px] text-[#8E8E93] truncate">{c.discountPercent}% OFF • {c.isActive ? 'Active' : 'Disabled'}</p>
                    </div>
                    <div className="flex gap-2 text-[#8E8E93] shrink-0">
                      <button onClick={() => {
                        setCouponForm(c);
                        setShowCouponForm(true);
                      }} className="p-2 bg-white/10 rounded-full shadow-sm hover:text-[#0A84FF] transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteCoupon(c.id)} className="p-2 bg-white/10 rounded-full shadow-sm hover:text-[#FF453A] transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <form onSubmit={handleSaveCoupon} className="flex flex-col gap-[15px] glass p-6 md:p-8 rounded-[24px] border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#5E5CE6] to-[#0A84FF]" />
              <h3 className="text-[20px] font-bold mb-[10px] flex items-center gap-2">
                <Tag className="text-[#5E5CE6]" size={22} /> Configure Coupon
              </h3>
              <div className="flex flex-col gap-[8px]">
                <label className="text-[12px] font-bold text-[#8E8E93] tracking-wide uppercase">Coupon Code</label>
                <input required type="text" placeholder="e.g. SUMMER50" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} className="input-dark w-full text-[14px] p-[16px] rounded-[14px] outline-none focus:ring-1 focus:ring-[#5E5CE6] tracking-wider font-mono uppercase bg-black/40 border border-white/5" />
              </div>
              <div className="flex flex-col gap-[8px]">
                <label className="text-[12px] font-bold text-[#8E8E93] tracking-wide uppercase">Discount Percentage (%)</label>
                <input required type="number" min="1" max="100" placeholder="25" value={couponForm.discountPercent || ''} onChange={e => setCouponForm({...couponForm, discountPercent: parseInt(e.target.value)})} className="input-dark w-full text-[14px] p-[16px] rounded-[14px] outline-none focus:ring-1 focus:ring-[#5E5CE6] bg-black/40 border border-white/5" />
              </div>
              <div className="flex items-center gap-[12px] mt-2 p-4 rounded-[14px] bg-white/5 border border-white/5">
                <input type="checkbox" id="isActive" checked={couponForm.isActive} onChange={e => setCouponForm({...couponForm, isActive: e.target.checked})} className="w-5 h-5 accent-[#5E5CE6] rounded cursor-pointer" />
                <label htmlFor="isActive" className="text-[14px] font-semibold text-white/90 cursor-pointer select-none">Coupon is active and usable</label>
              </div>
              
              <div className="flex gap-3 pt-6 mt-[10px] border-t border-white/10">
                <button type="button" onClick={() => { setShowCouponForm(false); setCouponForm({ code: '', discountPercent: 10, isActive: true }); }} className="flex-1 py-[16px] rounded-[14px] font-bold bg-white/5 hover:bg-white/10 text-white transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-[16px] rounded-[14px] font-bold bg-[#5E5CE6] hover:bg-[#5E5CE6]/90 text-white shadow-lg shadow-[#5E5CE6]/20 transition-all">Save Coupon</button>
              </div>
            </form>
          )
        )}
      </div>
    </motion.div>
  );
}
