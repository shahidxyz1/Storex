import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { Download, Menu } from 'lucide-react';
import { hapticFeedback } from '../lib/haptics';
import LazyImage from '../components/LazyImage';

export default function Library() {
  const { user, setSidebarOpen } = useStore();
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLibrary = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const snap = await getDocs(collection(db, `users/${user.uid}/downloads`));
        const items: any[] = [];
        for (const d of snap.docs) {
          const productRef = doc(db, 'products', d.id);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            items.push({ id: d.id, obtainedAt: d.data().obtainedAt, ...productSnap.data() });
          }
        }
        setDownloads(items);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLibrary();
  }, [user]);

  if (!user) {
    return (
      <div className="p-6 pt-12 text-center h-full flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold">Your Library</h2>
        <p className="text-gray-500 mt-2">Sign in to view your acquired products.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 pt-12 pb-32"
    >
      <header className="mb-8 flex justify-between items-start">
        <div>
          <div className="badge-ios mb-2">MY STUFF</div>
          <h1 className="text-[28px] font-bold tracking-[-0.5px]">Library</h1>
          <p className="text-[#8E8E93] text-[13px] font-semibold mt-1 uppercase tracking-[1px]">{downloads.length} Items</p>
        </div>
        <button 
          onClick={() => { hapticFeedback('light'); setSidebarOpen(true); }}
          className="w-10 h-10 mt-1 rounded-full glass flex items-center justify-center border border-[#ffffff1f] active:scale-95 transition-transform"
        >
          <Menu size={20} />
        </button>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[15px]">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass rounded-[18px] overflow-hidden flex flex-col animate-pulse">
              <div className="aspect-square bg-white/10" />
              <div className="p-[12px] flex-1 flex flex-col justify-between">
                <div>
                  <div className="h-4 bg-white/10 rounded w-3/4 mb-1" />
                  <div className="h-4 bg-white/10 rounded w-1/2" />
                </div>
                <div className="mt-3 w-full h-[32px] bg-white/5 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : downloads.length === 0 ? (
        <div className="text-center py-20 text-[#8E8E93] text-[15px] glass rounded-[18px]">No products yet.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[15px]">
          {downloads.map((item) => (
            <div key={item.id} className="glass rounded-[18px] overflow-hidden flex flex-col">
              <div className="aspect-square bg-[#333] relative">
                <LazyImage 
                  src={item.imageUrl || `https://picsum.photos/seed/${item.id}/200/200`} 
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-[12px] flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold text-[14px] leading-tight line-clamp-2">{item.title}</h4>
                </div>
                <button 
                  onClick={() => window.open(item.downloadUrl || '#', '_blank')}
                  className="mt-3 w-full py-2 bg-white/10 text-[#0A84FF] rounded-xl text-[12px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
                >
                  <Download size={14} /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
