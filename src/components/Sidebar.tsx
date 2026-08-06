import React from 'react';
import { LayoutDashboard, Users, Calendar, HeartHandshake, BookOpen, Award, X, ChevronRight } from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onNavigate,
  isMobileOpen,
  onCloseMobile
}) => {
  const menuItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'siswa', label: 'Data Siswa', icon: Users },
    { id: 'absensi', label: 'Absen Siswa', icon: Calendar },
    { id: 'konseling', label: 'Bimbingan Konseling', icon: HeartHandshake },
    { id: 'jurnal', label: 'Jurnal Harian', icon: BookOpen },
    { id: 'penilaian', label: 'Penilaian Harian', icon: Award },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#071533]/80 border-r border-slate-800 p-4 min-h-[calc(100vh-61px)] sticky top-[61px] self-start">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 px-3 mb-3">
          MENU UTAMA
        </div>

        <nav className="space-y-1.5 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/10'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-slate-950" />}
              </button>
            );
          })}
        </nav>

        {/* Offline & App Info Box */}
        <div className="mt-auto p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
          <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 mx-auto flex items-center justify-center mb-2">
            <img src="/logo-konselor.svg" alt="Konselor Logo" className="w-5 h-5 object-contain" />
          </div>
          <p className="text-[11px] font-extrabold text-white">BK SMKN 1 Bunyu</p>
          <p className="text-[10px] text-amber-300 font-mono mt-0.5">Standalone PWA v1.0</p>
        </div>
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          ></div>

          <div className="relative z-10 w-72 max-w-[80vw] bg-[#071533] border-r border-slate-800 p-5 flex flex-col h-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2.5">
                <img src="/logo-konselor.svg" alt="Logo BK" className="w-8 h-8 object-contain" />
                <span className="text-sm font-black text-white">BK SMKN 1 BUNYU</span>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1.5 flex-1">
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
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-xs transition-all ${
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
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#071533]/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                isActive ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-amber-400 scale-110' : 'text-slate-400'}`} />
              <span className="truncate max-w-[60px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
