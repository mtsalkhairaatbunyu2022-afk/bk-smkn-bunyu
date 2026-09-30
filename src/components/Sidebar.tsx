import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  HeartHandshake,
  BookOpen,
  FileText,
  Award,
  X,
  Database,
  Download,
  Sun,
  Moon,
  Home,
  Wifi,
  WifiOff,
  UserCheck,
  Sparkles,
  CalendarDays
} from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenInstall?: () => void;
  onOpenBackupModal?: () => void;
  onGoHome?: () => void;
  isOnline?: boolean;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onNavigate,
  isMobileOpen,
  onCloseMobile,
  onOpenInstall,
  onOpenBackupModal,
  onGoHome,
  isOnline = true,
  darkMode = true,
  onToggleDarkMode
}) => {
  const menuItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tatatertib', label: 'Tata Tertib', icon: FileText },
    { id: 'siswa', label: 'Data Siswa', icon: Users },
    { id: 'absensi', label: 'Absen Siswa', icon: Calendar },
    { id: 'absensi_ibadah', label: 'Absensi Ibadah', icon: Sparkles },
    { id: 'agenda_bk', label: 'Agenda & Kalender BK', icon: CalendarDays },
    { id: 'konseling', label: 'Bimbingan Konseling', icon: HeartHandshake },
    { id: 'jurnal', label: 'Jurnal Harian', icon: BookOpen },
    { id: 'kolaborasi', label: 'Kolaborasi Guru', icon: UserCheck },
    { id: 'penilaian', label: 'Penilaian Harian', icon: Award },
  ];

  return (
    <>
      {/* Horizontal Main Navigation Bar */}
      <aside className="w-full bg-[#071533]/80 border border-slate-800 p-3.5 sm:p-4 rounded-2xl mb-4 shadow-md">
        {/* 1. Main Navigation Menu (Horizontal Format) */}
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-1 mb-2">
          MENU UTAMA
        </div>

        <nav className="flex flex-row overflow-x-auto gap-2 pb-3.5 pt-1 items-center [scrollbar-width:thin] [scrollbar-color:#fbbf24_#020617] [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-slate-950 [&::-webkit-scrollbar-track]:border [&::-webkit-scrollbar-track]:border-slate-800/80 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-amber-400 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-amber-300 transition-all">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white bg-slate-900/60 border border-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          ></div>

          <div className="relative z-10 w-80 max-w-[85vw] bg-[#071533] border-r border-slate-800 p-5 flex flex-col h-full shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <img src="/logo-konselor.svg" alt="Logo BK" className="w-8 h-8 object-contain" />
                <span className="text-sm font-black text-white">BK SMKN 1 BUNYU</span>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1 mb-2">
              MENU UTAMA
            </div>

            <nav className="flex flex-col space-y-1.5 mb-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-slate-800 my-2"></div>

            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1 my-2">
              PANEL AKSI & SISTEM
            </div>

            <div className="flex flex-col space-y-2 mb-4">
              {onOpenBackupModal && (
                <button
                  onClick={() => {
                    onOpenBackupModal();
                    onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs bg-slate-900 text-amber-300 border border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-amber-400" />
                    <span>Backup DB</span>
                  </div>
                </button>
              )}

              {onOpenInstall && (
                <button
                  onClick={() => {
                    onOpenInstall();
                    onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs bg-amber-400/10 text-amber-300 border border-amber-400/30"
                >
                  <div className="flex items-center gap-3">
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Install App</span>
                  </div>
                </button>
              )}

              {onToggleDarkMode && (
                <button
                  onClick={() => {
                    onToggleDarkMode();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs bg-slate-900 text-emerald-300 border border-emerald-500/40"
                >
                  <div className="flex items-center gap-3">
                    {darkMode ? <Sun className="w-4 h-4 text-emerald-400" /> : <Moon className="w-4 h-4 text-amber-300" />}
                    <span>Tema (<span className="text-emerald-300 font-black">{darkMode ? 'Smooth Hijau Putih' : 'Navy Gelap'}</span>)</span>
                  </div>
                </button>
              )}

              {onGoHome && (
                <button
                  onClick={() => {
                    onGoHome();
                    onCloseMobile();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs bg-slate-900 text-slate-300 border border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <Home className="w-4 h-4 text-blue-400" />
                    <span>Halaman Depan</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
