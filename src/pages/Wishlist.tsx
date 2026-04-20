import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { Link, useNavigate } from 'react-router-dom';
import LazyImage from '../components/LazyImage';
import { ChevronLeft, ArrowRight, Heart } from 'lucide-react';
import { hapticFeedback } from '../lib/haptics';

export default function Wishlist() {
  const { userData } = useStore();
  const navigate = useNavigate();
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!userData?.wishlist || userData.wishlist.length === 0) {
        setWishlistProducts([]);
        setLoading(false);
        return;
      }

      try {
        // Firestore 'in' query works up to 10 items. For more, chunking is required, but this suffices for alpha.
        const chunk = userData.wishlist.slice(0, 10);
        const q = query(
          collection(db, "products"), 
          where(documentId(), "in", chunk)
        );
        const querySnapshot = await getDocs(q);
        const items: any[] = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        setWishlistProducts(items);
      } catch (e) {
        console.error("Error loading wishlist products", e);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [userData?.wishlist]);

  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="bg-transparent z-40 pb-32 px-6 pt-12 md:px-12 md:pt-16"
    >
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => { hapticFeedback('light'); navigate(-1); }}
          className="w-10 h-10 rounded-full glass flex items-center justify-center text-[#8E8E93] hover:text-white active:scale-95 transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-[32px] md:text-[40px] font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">Wishlist</h1>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
           {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-[14px] glass p-3 rounded-[20px] border border-white/[0.08] animate-pulse">
              <div className="w-[60px] h-[60px] rounded-[14px] bg-white/10 shrink-0" />
              <div className="flex-1">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : wishlistProducts.length === 0 ? (
        <div className="h-[50vh] flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full glass flex items-center justify-center text-[#FF453A]/50 mb-6 border border-[#FF453A]/20">
            <Heart size={32} />
          </div>
          <h2 className="text-[20px] font-bold tracking-tight mb-2">No active desires</h2>
          <p className="text-[#8E8E93] text-[15px] max-w-[260px] mb-8">Tap the heart icon on any product to save it here for later.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-white text-black rounded-full font-bold text-[14px] active:scale-95 transition-transform"
          >
            Explore Store
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
          {wishlistProducts.map((product) => (
            <Link 
              key={product.id} 
              to={`/product/${product.id}`}
              onClick={() => hapticFeedback('light')}
              className="group flex items-center gap-[14px] glass hover:bg-white/[0.12] active:scale-[0.98] transition-all p-3 rounded-[20px] shadow-sm hover:shadow-xl border border-[#FF453A]/20"
            >
              <div className="w-[60px] h-[60px] rounded-[14px] overflow-hidden bg-[#222] shrink-0 border border-white/5">
                 <LazyImage 
                  src={product.imageUrl || `https://picsum.photos/seed/${product.id}/200/200`} 
                  referrerPolicy="no-referrer"
                  alt={product.title}
                  className="w-full h-full object-cover opacity-90 group-hover:scale-110"
                />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <h4 className="text-[15px] font-semibold truncate leading-tight text-white group-hover:text-[#0A84FF] transition-colors">{product.title}</h4>
                <p className="text-[13px] text-[#8E8E93] truncate mt-1">{product.category}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[#FF453A]">
                 <Heart size={14} className="fill-[#FF453A]" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  );
}
