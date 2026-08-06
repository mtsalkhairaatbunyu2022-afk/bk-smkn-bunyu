import React from 'react';
import { Download, ArrowRight, ShieldCheck, Wifi, WifiOff, Laptop, Smartphone, Database, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  onInstallClick: () => void;
  canInstallPWA: boolean;
  isOnline: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onInstallClick,
  canInstallPWA,
  isOnline
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071533] via-[#0B1B47] to-[#102A6B] text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-slate-900 relative overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/2 -right-40 w-[35rem] h-[35rem] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-40 left-1/3 w-[30rem] h-[30rem] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* HEADER */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 border-b border-slate-700/50 backdrop-blur-md bg-[#071533]/40">
        <div className="flex items-center justify-between">
          {/* Kiri Atas: Logo, Nama, Sub Judul */}
          <div className="flex items-center gap-3.5">
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/10 p-1.5 border border-amber-400/40 shadow-lg backdrop-blur-md flex items-center justify-center">
              <img
                src="/logo-konselor.svg"
                alt="Logo Konselor BK"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-tight">
                BK SMK NEGERI 1 BUNYU
              </h1>
              <p className="text-xs text-amber-300/90 font-medium hidden sm:block">
                Bimbingan Konseling SMK Negeri 1 Bunyu
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <div className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}>
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {isOnline ? 'Online Sync Active' : 'Offline Local Mode'}
            </div>

            <button
              onClick={onInstallClick}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-md transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          </div>
        </div>
      </header>

      {/* TENGAH HALAMAN (HERO) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-12 max-w-4xl mx-auto">
        {/* Badge status */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-white/10 border border-amber-400/40 text-amber-300 backdrop-blur-md shadow-lg mb-8 animate-bounce-slow">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          BK SMKN 1 Bunyu • Offline Ready
        </div>

        {/* Logo Konselor Ukuran Besar */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-6 rounded-3xl bg-gradient-to-r from-amber-400/30 via-blue-500/30 to-amber-300/30 blur-2xl opacity-70 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-3xl bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-xl p-5 border border-amber-400/40 shadow-2xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
            <img
              src="/logo-konselor.svg"
              alt="Logo Konselor BK SMKN 1 Bunyu"
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Judul */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white mb-4 leading-tight">
          BK SMK NEGERI 1 BUNYU
        </h1>

        <p className="mb-8"></p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
          {/* Tombol Utama */}
          <button
            onClick={onEnterApp}
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-extrabold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-xl shadow-amber-500/20 hover:shadow-amber-500/40 transition-all flex items-center justify-center gap-2 group active:scale-95"
          >
            <span>MASUK APLIKASI</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 border-t border-slate-800 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© {new Date().getFullYear()} BK SMK Negeri 1 Bunyu. Hak Cipta Dilindungi.</p>
        <p className="flex items-center gap-1.5 text-amber-300/80">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Sistem Resmi Bimbingan & Konseling SMKN 1 Bunyu
        </p>
      </footer>
    </div>
  );
};
