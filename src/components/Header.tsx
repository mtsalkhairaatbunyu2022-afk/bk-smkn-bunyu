import React from 'react';
import { Download, Database, Moon, Sun, Wifi, WifiOff, Menu, Home, ShieldCheck } from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onOpenInstall: () => void;
  onOpenBackupModal: () => void;
  onGoHome: () => void;
  isOnline: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNavigate,
  onOpenInstall,
  onOpenBackupModal,
  onGoHome,
  isOnline,
  darkMode,
  onToggleDarkMode,
  onToggleMobileMenu
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#071533]/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3.5 transition-colors">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 md:hidden"
            title="Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={onGoHome}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 p-1 border border-amber-400/40 shadow-md flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <img src="/logo-konselor.svg" alt="Logo Konselor BK" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-tight leading-none group-hover:text-amber-300 transition-colors">
                BK SMKN 1 BUNYU
              </h1>
              <span className="text-[10px] text-amber-300/80 font-medium hidden sm:block">
                Bimbingan Konseling SMK Negeri 1 Bunyu
              </span>
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Status Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300">
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400">Offline Mode</span>
              </>
            )}
          </div>

          {/* Backup Restore Button */}
          <button
            onClick={onOpenBackupModal}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-slate-700/60 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Backup & Restore Database JSON"
          >
            <Database className="w-4 h-4" />
            <span className="hidden md:inline">Backup DB</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-all"
            title="Toggle Dark/Light Mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-blue-300" />}
          </button>

          {/* Install App Button */}
          <button
            onClick={onOpenInstall}
            className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install App</span>
          </button>

          {/* Landing Page Home Link */}
          <button
            onClick={onGoHome}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-all hidden sm:flex items-center gap-1"
            title="Halaman Depan (Landing)"
          >
            <Home className="w-4 h-4 text-amber-300" />
          </button>
        </div>
      </div>
    </header>
  );
};
