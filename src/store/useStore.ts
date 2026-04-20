import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';

interface UserData {
  uid: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: number;
  wishlist?: string[];
}

interface AppState {
  user: FirebaseUser | null;
  userData: UserData | null;
  isLoading: boolean;
  isSidebarOpen: boolean;
  theme: 'dark' | 'light';
  showAuthModal: boolean;
  authMessage: string;
  setUser: (user: FirebaseUser | null) => void;
  setUserData: (userData: UserData | null) => void;
  setLoading: (isLoading: boolean) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  openAuthModal: (message?: string) => void;
  closeAuthModal: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  userData: null,
  isLoading: true,
  isSidebarOpen: false,
  theme: 'dark',
  showAuthModal: false,
  authMessage: 'Sign in to your account',
  setUser: (user) => set({ user }),
  setUserData: (userData) => set({ userData }),
  setLoading: (isLoading) => set({ isLoading }),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setTheme: (theme) => set({ theme }),
  openAuthModal: (message = 'Sign in to your account') => set({ showAuthModal: true, authMessage: message, isSidebarOpen: false }),
  closeAuthModal: () => set({ showAuthModal: false }),
}));
