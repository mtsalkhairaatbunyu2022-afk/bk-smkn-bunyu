import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onFinish, 200);
          return 100;
        }
        return prev + 10;
      });
    }, 120);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#071533] via-[#0B1B47] to-[#102A6B] text-white p-6 select-none overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative flex flex-col items-center text-center max-w-sm w-full animate-fade-in">
        {/* Animated Glow Halo */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-amber-400 via-blue-500 to-amber-300 opacity-30 blur-xl animate-pulse"></div>
          <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-3xl bg-white/10 backdrop-blur-md p-4 border border-amber-400/30 shadow-2xl flex items-center justify-center">
            <img
              src="/logo-konselor.svg"
              alt="Logo Konselor"
              className="w-full h-full object-contain drop-shadow-xl animate-scale-up"
            />
          </div>
        </div>

        {/* Text Details */}
        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/30 mb-3 tracking-wide">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          SMK NEGERI 1 BUNYU
        </span>

        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-amber-400 mb-2">
          BK SMK NEGERI 1 BUNYU
        </h1>

        <p className="text-sm text-slate-300 mb-8 font-medium">
          Sistem Informasi Bimbingan dan Konseling Terpadu
        </p>

        {/* Progress Bar Container */}
        <div className="w-full bg-slate-800/80 rounded-full h-2.5 p-0.5 border border-slate-700 shadow-inner mb-3">
          <div
            className="bg-gradient-to-r from-amber-400 to-amber-500 h-1.5 rounded-full transition-all duration-150 ease-out shadow-lg"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <p className="text-xs text-amber-300/80 font-mono font-medium">
          Memuat Sistem Local PWA... {progress}%
        </p>
      </div>
    </div>
  );
};
