import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { db, loginWithGoogle } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { hapticFeedback } from '../lib/haptics';
import LazyImage from '../components/LazyImage';

interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
}

export default function Home() {
  const { user, setSidebarOpen } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Optimize payload length and sort by newest
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(20));
        const querySnapshot = await getDocs(q);
        const items: Product[] = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as Product);
        });
        setProducts(items);
      } catch (e) {
        console.error("Error loading products", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 pt-12 pb-32"
    >
      <header className="flex justify-between items-start mb-10 relative px-2 md:px-0 mt-2 md:mt-8">
        <div>
          <div className="badge-ios mb-3 tracking-widest text-[#0A84FF] bg-[#0A84FF]/10 border border-[#0A84FF]/20 px-3 py-1 text-[11px] font-bold inline-block rounded-full">PREMIUM ACCESS</div>
          <h1 className="text-[34px] md:text-[46px] font-extrabold tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/50">
            Discover
          </h1>
        </div>
        <button 
          onClick={() => { hapticFeedback('light'); setSidebarOpen(true); }}
          className="w-12 h-12 rounded-full glass hover:bg-white/10 flex items-center justify-center border border-[#ffffff1f] active:scale-95 transition-all shadow-xl"
        >
          <Menu size={22} className="text-white" />
        </button>
      </header>

      {/* Featured Carousel */}
      <section className="mb-12">
        <h3 className="text-[13px] uppercase tracking-[1.5px] text-[#8E8E93] font-semibold mb-4 px-[24px] md:px-0">Featured Collections</h3>
        <div className="flex gap-4 overflow-x-auto pb-8 -mx-6 px-6 md:mx-0 md:px-0 snap-x snap-mandatory hide-scrollbar">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="snap-center shrink-0 w-[85%] sm:w-[50%] md:w-[45%] lg:w-[32%] aspect-[16/10] relative rounded-[24px] border border-white/5 bg-[#111] animate-pulse overflow-hidden">
                 <div className="absolute inset-0 bg-white/5" />
                 <div className="absolute bottom-5 left-5 right-5 h-6 bg-white/10 rounded-md w-1/2" />
              </div>
            ))
          ) : products.slice(0, 3).map((product, idx) => (
            <Link 
              key={product.id} 
              to={`/product/${product.id}`}
              onClick={() => hapticFeedback('light')}
              className="snap-center shrink-0 w-[85%] sm:w-[50%] md:w-[45%] lg:w-[32%] relative overflow-hidden rounded-[24px] shadow-2xl group block border border-white/5 bg-[#111]"
            >
              <div className="aspect-[16/10] w-full relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0A84FF]/20 to-[#5E5CE6]/20 group-hover:opacity-0 transition-opacity duration-500 z-10 mix-blend-overlay" />
                <LazyImage 
                  src={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/400`} 
                  referrerPolicy="no-referrer"
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-5 z-20">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider">{product.category}</p>
                  <div className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider">
                    {product.price > 0 ? `₹${product.price.toFixed(2)}` : 'FREE'}
                  </div>
                </div>
                <h4 className="text-white text-2xl font-bold leading-tight drop-shadow-md">{product.title}</h4>
              </div>
            </Link>
          ))}
          {products.length === 0 && (
             <div className="w-full text-center py-10 text-gray-400 glass squircle">No products available yet.</div>
          )}
        </div>
      </section>

      {/* Categories / All Products */}
      <section className="px-1 md:px-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 px-[4px] md:px-0 gap-3">
          <h3 className="text-[13px] uppercase tracking-[1.5px] text-[#8E8E93] font-semibold">All Digital Goods</h3>
          
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 md:pb-0 p-1">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    hapticFeedback('light');
                    setSelectedCategory(cat);
                  }}
                  className={`relative whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors duration-300 ${
                    isActive 
                      ? 'text-black' 
                      : 'text-[#8E8E93] hover:text-[#000] dark:hover:text-white'
                  }`}
                  style={{ outline: 'none', WebkitTapHighlightColor: 'transparent' }}
                >
                  {isActive ? (
                    <motion.div
                      layoutId="activeCategory"
                      className="absolute inset-0 bg-white rounded-full shadow-md z-0"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                    />
                  ) : (
                    <div className="absolute inset-0 rounded-full border border-[var(--color-glass-border)] z-0 transition-colors bg-[var(--color-glass)]" />
                  )}
                  <span className="relative z-10 truncate">{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
          {loading ? (
             [1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex items-center gap-[14px] glass p-3 rounded-[20px] border border-white/[0.08] animate-pulse">
                <div className="w-[60px] h-[60px] rounded-[14px] bg-white/10 shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                </div>
              </div>
            ))
          ) : filteredProducts.map((product) => (
            <Link 
              key={product.id} 
              to={`/product/${product.id}`}
              onClick={() => hapticFeedback('light')}
              className="group flex items-center gap-[14px] glass hover:bg-white/[0.12] active:scale-[0.98] transition-all p-3 rounded-[20px] shadow-sm hover:shadow-xl border border-white/[0.08]"
            >
              <div className="w-[60px] h-[60px] rounded-[14px] overflow-hidden bg-[#222] shrink-0 border border-white/5 relative">
                 <LazyImage 
                  src={product.imageUrl || `https://picsum.photos/seed/${product.id}/200/200`} 
                  referrerPolicy="no-referrer"
                  alt={product.title}
                  className="w-full h-full object-cover opacity-90 group-hover:scale-110"
                />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <h4 className="text-[15px] font-semibold truncate leading-tight text-white group-hover:text-[#0A84FF] transition-colors">{product.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[13px] text-[#8E8E93] truncate">{product.category}</p>
                  <div className="w-[3px] h-[3px] rounded-full bg-[#8E8E93]/50"></div>
                  <p className="text-[12px] font-bold text-[#0A84FF]">{product.price > 0 ? `₹${product.price.toFixed(2)}` : 'FREE'}</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[#0A84FF]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </div>
            </Link>
          ))}
        </div>
      </section>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </motion.div>
  );
}
