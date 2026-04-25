import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User as FirebaseUser } from 'firebase/auth';

interface UserData {
  uid: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: number;
  wishlist?: string[];
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  user: FirebaseUser | null;
  userData: UserData | null;
  isLoading: boolean;
  isSidebarOpen: boolean;
  theme: 'dark' | 'light';
  showAuthModal: boolean;
  authMessage: string;
  toasts: Toast[];
  setUser: (user: FirebaseUser | null) => void;
  setUserData: (userData: UserData | null) => void;
  setLoading: (isLoading: boolean) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  openAuthModal: (message?: string) => void;
  closeAuthModal: () => void;
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      userData: null,
      isLoading: true,
      isSidebarOpen: false,
      theme: 'dark',
      showAuthModal: false,
      authMessage: 'Sign in to your account',
      toasts: [],
      setUser: (user) => set({ user }),
      setUserData: (userData) => set({ userData }),
      setLoading: (isLoading) => set({ isLoading }),
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      setTheme: (theme) => {
        set({ theme });
        if (theme === 'light') {
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
        }
      },
      openAuthModal: (message = 'Sign in to your account') =>
        set({ showAuthModal: true, authMessage: message, isSidebarOpen: false }),
      closeAuthModal: () => set({ showAuthModal: false }),
      addToast: (message, type = 'success') => {
        const id = Math.random().toString(36).slice(2);
        set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
        setTimeout(() => get().removeToast(id), 3500);
      },
      removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
    }),
    {
      name: 'dps-store',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
