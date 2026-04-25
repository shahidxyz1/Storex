import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { useStore } from './store/useStore';

import Navigation from './components/Navigation';
import Sidebar from './components/Sidebar';
import Loader from './components/Loader';
import AuthModal from './components/AuthModal';
import Toast from './components/Toast';

const Home = React.lazy(() => import('./pages/Home'));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail'));
const Library = React.lazy(() => import('./pages/Library'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminLogin = React.lazy(() => import('./pages/AdminLogin'));
const Wishlist = React.lazy(() => import('./pages/Wishlist'));
const PurchaseHistory = React.lazy(() => import('./pages/PurchaseHistory'));

export default function App() {
  const { user, setUser, setUserData, setLoading, isLoading, userData, theme, setTheme } = useStore();

  useEffect(() => {
    // Apply saved theme on mount
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            setUserData(snap.data() as any);
          } else {
            const newUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'user',
              createdAt: serverTimestamp(),
            };
            await setDoc(userRef, newUser);
            setUserData(newUser as any);
          }
        } catch (e) {
          console.error('Error fetching user data', e);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) return <Loader />;

  return (
    <BrowserRouter>
      <div className="h-[100dvh] w-full overflow-y-auto overflow-x-hidden relative bg-transparent text-[#F1F5F9]">
        <div className="pb-24 pt-6 md:pt-14 w-full md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto min-h-full relative md:border-x border-[#ffffff08]">
          <Sidebar />
          <AuthModal />
          <Toast />
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/library" element={user ? <Library /> : <Navigate to="/" />} />
              <Route path="/wishlist" element={user ? <Wishlist /> : <Navigate to="/" />} />
              <Route path="/history" element={user ? <PurchaseHistory /> : <Navigate to="/" />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={userData?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/admin-login" />}
              />
            </Routes>
          </Suspense>
          <Navigation />
        </div>
      </div>
    </BrowserRouter>
  );
}
