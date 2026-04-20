import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { ArrowLeft, Clock, Tags, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { hapticFeedback } from '../lib/haptics';

interface PurchaseHistoryItem {
  id: string;
  productId: string;
  title: string;
  obtainedAt: any;
  amountPaid?: number;
  couponUsed?: string;
  category?: string;
}

export default function PurchaseHistory() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [history, setHistory] = useState<PurchaseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const snap = await getDocs(collection(db, `users/${user.uid}/downloads`));
        const items: PurchaseHistoryItem[] = [];
        
        for (const d of snap.docs) {
          const data = d.data();
          let productTitle = 'Unknown Product';
          let productCategory = 'Unknown';
          
          const productRef = doc(db, 'products', d.id);
          const productSnap = await getDoc(productRef);
          
          if (productSnap.exists()) {
            productTitle = productSnap.data().title;
            productCategory = productSnap.data().category;
          }
          
          items.push({
            id: d.id,
            productId: d.id,
            title: productTitle,
            category: productCategory,
            obtainedAt: data.obtainedAt,
            amountPaid: data.amountPaid,
            couponUsed: data.couponUsed
          });
        }
        
        // Sort by newest first
        items.sort((a, b) => {
          const timeA = a.obtainedAt?.toMillis ? a.obtainedAt.toMillis() : 0;
          const timeB = b.obtainedAt?.toMillis ? b.obtainedAt.toMillis() : 0;
          return timeB - timeA;
        });

        setHistory(items);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  if (!user) {
    return (
      <div className="p-6 pt-12 text-center h-full flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold">Purchase History</h2>
        <p className="text-[#8E8E93] mt-2">Sign in to view your past transactions.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -50, opacity: 0 }}
      className="p-6 pt-12 pb-32"
    >
      <header className="mb-8 flex items-center gap-4">
        <button 
          onClick={() => { hapticFeedback('light'); navigate(-1); }}
          className="w-10 h-10 rounded-full glass flex items-center justify-center border border-[#ffffff1f] active:scale-95 transition-transform shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Purchase History</h1>
          <p className="text-[#8E8E93] text-[13px] font-semibold mt-1 uppercase tracking-[1px]">{history.length} Transactions</p>
        </div>
      </header>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass rounded-[20px] p-5 border border-white/[0.08] animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="w-32 h-5 bg-white/10 rounded mb-2" />
                  <div className="w-20 h-4 bg-white/10 rounded" />
                </div>
                <div className="w-16 h-6 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-20 text-[#8E8E93] text-[15px] glass rounded-[18px]">No transactions found in your history.</div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="glass rounded-[20px] p-5 border border-white/[0.08] hover:bg-white/[0.05] transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="pr-4">
                  <h3 className="font-bold text-[18px] text-white leading-tight group-hover:text-[#0A84FF] transition-colors cursor-pointer" onClick={() => navigate(`/product/${item.productId}`)}>
                    {item.title}
                  </h3>
                  <p className="text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider mt-1">{item.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-bold text-[18px] ${item.amountPaid === 0 || !item.amountPaid ? 'text-[#32D74B]' : 'text-white'}`}>
                    {item.amountPaid === 0 || item.amountPaid === undefined ? 'FREE' : `₹${item.amountPaid.toFixed(2)}`}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-[13px] font-medium pt-3 border-t border-white/[0.05]">
                <div className="flex items-center gap-1.5 text-[#8E8E93]">
                  <Clock size={16} />
                  {item.obtainedAt?.toDate ? item.obtainedAt.toDate().toLocaleDateString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric'
                  }) : 'Unknown Date'}
                </div>
                
                {item.couponUsed && (
                  <div className="flex items-center gap-1.5 text-[#32D74B] bg-[#32D74B]/10 px-2 py-0.5 rounded-md border border-[#32D74B]/20">
                    <Tags size={14} />
                    Coupon: {item.couponUsed}
                  </div>
                )}
                
                {(item.amountPaid ?? 0) > 0 && !item.couponUsed && (
                  <div className="flex items-center gap-1.5 text-[#8E8E93]">
                    <Banknote size={16} />
                    Standard Purchase
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
