import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Library, Heart, History } from 'lucide-react';
import { useStore } from '../store/useStore';
import { hapticFeedback } from '../lib/haptics';

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/library', icon: Library, label: 'Library' },
  { path: '/wishlist', icon: Heart, label: 'Wishlist' },
  { path: '/history', icon: History, label: 'History' },
];

export default function Navigation() {
  const { pathname } = useLocation();
  const { user, openAuthModal } = useStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 nav-bar">
      <div className="flex justify-around items-center h-16 max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto px-2">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive = pathname === path;
          const isProtected = path !== '/';
          return (
            <Link
              key={path}
              to={isProtected && !user ? '#' : path}
              onClick={(e) => {
                hapticFeedback('light');
                if (isProtected && !user) {
                  e.preventDefault();
                  openAuthModal(`Sign in to access ${label}.`);
                }
              }}
              className="flex flex-col items-center gap-1 px-5 py-1 group"
            >
              <div className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300 ${
                isActive ? 'bg-[#6C5CE7]/20' : 'group-hover:bg-white/5'
              }`}>
                {isActive && (
                  <span className="absolute inset-0 rounded-xl bg-[#6C5CE7]/15 blur-sm" />
                )}
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={`relative z-10 transition-colors duration-200 ${
                    isActive ? 'text-[#a78bfa]' : 'text-[#64748B] group-hover:text-[#94A3B8]'
                  }`}
                />
              </div>
              <span className={`text-[10px] font-semibold transition-colors duration-200 ${
                isActive ? 'text-[#a78bfa]' : 'text-[#64748B]'
              }`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
