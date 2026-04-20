import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LibrarySquare, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';
import { hapticFeedback } from '../lib/haptics';

export default function Navigation() {
  const { userData } = useStore();

  const handlePress = () => hapticFeedback('light');

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full md:bottom-8 md:w-auto md:left-1/2 md:-translate-x-1/2 z-[60]">
      <div className="nav-bar h-[80px] md:h-[70px] w-full md:rounded-[35px] border-t md:border border-[#ffffff1f] shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-[#1c1c1e]/40 backdrop-blur-[30px] -z-10" />
        <div className="flex justify-around items-center h-full pb-[15px] md:pb-0 max-w-lg mx-auto md:px-8 md:gap-8">
        <NavLink 
          to="/" 
          onClick={handlePress}
          className={({isActive}) => `flex flex-col items-center gap-1 transition-all duration-200 ${isActive ? 'text-[#0A84FF] opacity-100 scale-105' : 'text-[#8E8E93] opacity-50'}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide">Home</span>
        </NavLink>
        
        <NavLink 
          to="/library" 
          onClick={handlePress}
          className={({isActive}) => `flex flex-col items-center gap-1 transition-all duration-200 ${isActive ? 'text-[#0A84FF] opacity-100 scale-105' : 'text-[#8E8E93] opacity-50'}`}
        >
          <LibrarySquare className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide">Library</span>
        </NavLink>

        <NavLink 
          to="/admin" 
          onClick={handlePress}
          className={({isActive}) => `flex flex-col items-center gap-1 transition-all duration-200 ${isActive ? 'text-[#0A84FF] opacity-100 scale-105' : 'text-[#8E8E93] opacity-50'}`}
        >
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide">Admin</span>
        </NavLink>
        </div>
      </div>
    </div>
  );
}
