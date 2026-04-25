import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';
import { Menu, Search, Sparkles, TrendingUp, Star, Clock } from 'lucide-react';
import { hapticFeedback } from '../lib/haptics';
import LazyImage from '../components/LazyImage';

interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  price: number;
  createdAt?: any;
}

export default function Home() {
  const { user, setSidebarOpen } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(30));
        const snapshot = await getDocs(q);
        const items: Product[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(items);
      } catch (e) {
        console.error('Error loading products', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const featuredProducts = products.slice(0, 5);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-5 pt-10 pb-32"
    >
      {/* ── Header ── */}
      <header className="flex justify-between items-start mb-8 px-1 mt-2 md:mt-6">
        <div>
          <div className="badge-ios mb-3 tracking-widest inline-flex items-center gap-1.5">
            <Sparkles size={10} /> PREMIUM ACCESS
          </div>
          <h1 className="text-[36px] md:text-[48px] font-extrabold leading-none gradient-text">
            Discover
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1 font-medium">
            {products.length > 0 ? `${products.length} digital products` : 'Loading store…'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { hapticFeedback('light'); setShowSearch(v => !v); }}
            className="w-11 h-11 rounded-full glass hover:bg-white/10 flex items-center justify-center border border-white/10 active:scale-95 transition-all"
          >
            <Search size={18} className={showSearch ? 'text-[#6C5CE7]' : 'text-white/80'} />
          </button>
          <button
            onClick={() => { hapticFeedback('light'); setSidebarOpen(true); }}
            className="w-11 h-11 rounded-full glass hover:bg-white/10 flex items-center justify-center border border-white/10 active:scale-95 transition-all"
          >
            <Menu size={20} className="text-white/80" />
          </button>
        </div>
      </header>

      {/* ── Search Bar ── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search products…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full glass pl-11 pr-4 py-3.5 rounded-[16px] text-[15px] text-white placeholder:text-[#94A3B8]/60 outline-none focus:border-[#6C5CE7]/40 border border-white/10 transition-all font-[inherit]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Featured Carousel ── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-[11px] uppercase tracking-[2px] text-[#94A3B8] font-bold flex items-center gap-1.5">
            <Star size={11} className="text-[#6C5CE7]" /> Featured
          </h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 snap-x snap-mandatory hide-scrollbar">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="snap-center shrink-0 w-[82%] sm:w-[48%] md:w-[44%] lg:w-[31%] aspect-[16/10] rounded-[22px] skeleton border border-white/5 overflow-hidden" />
            ))
          ) : featuredProducts.map((product, idx) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              onClick={() => hapticFeedback('light')}
              className="snap-center shrink-0 w-[82%] sm:w-[48%] md:w-[44%] lg:w-[31%] relative overflow-hidden rounded-[22px] shadow-2xl group block border border-white/5 bg-[#111] shine-effect"
            >
              <div className="aspect-[16/10] w-full relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#6C5CE7]/20 to-[#00CEC9]/15 group-hover:opacity-0 transition-opacity duration-500 z-10 mix-blend-overlay" />
                <LazyImage
                  src={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/375`}
                  referrerPolicy="no-referrer"
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-5 z-20">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">{product.category}</p>
                  <span className="price-badge">{product.price > 0 ? `₹${product.price.toFixed(0)}` : 'FREE'}</span>
                </div>
                <h4 className="text-white text-[20px] font-bold leading-tight drop-shadow-md">{product.title}</h4>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Category Filter ── */}
      <section className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
          {categories.map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => { hapticFeedback('light'); setSelectedCategory(cat); }}
                className={`relative whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-300 border ${
                  isActive
                    ? 'cat-pill-active border-transparent text-white'
                    : 'border-white/10 text-[#94A3B8] hover:text-white hover:border-white/20 glass'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeCat"
                    className="absolute inset-0 rounded-full z-0"
                    transition={{ type: 'spring', bounce: 0.25, duration: 0.45 }}
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Product Grid ── */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-[11px] uppercase tracking-[2px] text-[#94A3B8] font-bold flex items-center gap-1.5">
            <TrendingUp size={11} className="text-[#00CEC9]" /> All Digital Goods
            {filteredProducts.length > 0 && (
              <span className="ml-1 text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/50">
                {filteredProducts.length}
              </span>
            )}
          </h3>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory + searchQuery}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
          >
            {loading
              ? [1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex items-center gap-3.5 glass p-3.5 rounded-[18px] border border-white/[0.07]">
                  <div className="w-[58px] h-[58px] rounded-[14px] skeleton shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 skeleton rounded-md w-3/4" />
                    <div className="h-3 skeleton rounded-md w-1/2" />
                  </div>
                </div>
              ))
              : filteredProducts.length === 0
              ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full text-center py-16 text-[#94A3B8]"
                >
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="font-semibold">No products found</p>
                  <p className="text-sm mt-1 text-[#94A3B8]/60">Try a different search or category</p>
                </motion.div>
              )
              : filteredProducts.map((product, idx) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <Link
                    to={`/product/${product.id}`}
                    onClick={() => hapticFeedback('light')}
                    className="group product-card flex items-center gap-3.5 glass hover:bg-white/[0.1] active:scale-[0.98] p-3.5 rounded-[18px] border border-white/[0.07] w-full block"
                  >
                    <div className="w-[58px] h-[58px] rounded-[14px] overflow-hidden bg-[#1c1c26] shrink-0 border border-white/5 relative">
                      <LazyImage
                        src={product.imageUrl || `https://picsum.photos/seed/${product.id}/200/200`}
                        referrerPolicy="no-referrer"
                        alt={product.title}
                        className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-400"
                      />
                    </div>
                    <div className="flex-1 min-w-0 pr-1">
                      <h4 className="text-[14px] font-semibold truncate leading-tight text-white group-hover:text-[#a78bfa] transition-colors">
                        {product.title}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[11px] text-[#94A3B8] truncate">{product.category}</span>
                        <span className="w-[3px] h-[3px] rounded-full bg-[#94A3B8]/40 shrink-0" />
                        <span className="text-[11px] font-bold text-[#6C5CE7] font-mono-num shrink-0">
                          {product.price > 0 ? `₹${product.price.toFixed(0)}` : 'FREE'}
                        </span>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-[#6C5CE7]/15 flex items-center justify-center shrink-0 group-hover:bg-[#6C5CE7]/30 transition-colors">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                      </svg>
                    </div>
                  </Link>
                </motion.div>
              ))
            }
          </motion.div>
        </AnimatePresence>
      </section>
    </motion.div>
  );
}
