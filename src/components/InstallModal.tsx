import React from 'react';
import { X, Smartphone, Monitor, Download, CheckCircle, HelpCircle } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onTriggerInstall: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onTriggerInstall
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0B1B47] border border-slate-700 text-slate-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/80 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Instal BK SMKN 1 Bunyu</h2>
              <p className="text-xs text-slate-300">Aplikasi PWA Standalone & Offline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Direct PWA Trigger Button if prompt exists */}
        {deferredPrompt ? (
          <div className="mb-6 p-4 rounded-xl bg-amber-400/10 border border-amber-400/30 text-center">
            <p className="text-sm text-amber-200 font-medium mb-3">
              Browser Anda siap menginstal aplikasi ini secara langsung.
            </p>
            <button
              onClick={() => {
                onTriggerInstall();
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl font-extrabold bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span>KLIK DISINI UNTUK INSTAL SEKARANG</span>
            </button>
          </div>
        ) : (
          <div className="mb-6 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-2.5">
            <HelpCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-200 leading-relaxed">
              Jika tombol otomatis tidak muncul, Anda dapat menginstal aplikasi ini secara manual dari menu browser Anda berikut:
            </p>
          </div>
        )}

        {/* Instructions Tabs / Lists */}
        <div className="space-y-4 text-xs text-slate-300">
          {/* Windows / Laptop */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2 font-bold text-white mb-2 text-sm">
              <Monitor className="w-4 h-4 text-amber-400" />
              <span>Windows / Mac / Laptop (Google Chrome & Edge)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
              <li>Lihat ke bilah alamat (Address Bar) di kanan atas browser.</li>
              <li>Klik ikon <strong className="text-amber-300">Instal (Komputer & Panah)</strong> atau ikon <strong className="text-amber-300">Plus (+)</strong>.</li>
              <li>Atau klik titik Tiga menu (⋮) → <strong className="text-white">Simpan dan Bagikan</strong> → <strong className="text-amber-300">Instal BK SMKN 1 Bunyu</strong>.</li>
            </ol>
          </div>

          {/* Android */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2 font-bold text-white mb-2 text-sm">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Android (Chrome / Browser Native)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
              <li>Ketuk menu titik tiga (⋮) di pojok kanan atas browser.</li>
              <li>Pilih menu <strong className="text-amber-300">Tambahkan ke Layar Utama</strong> atau <strong className="text-amber-300">Instal Aplikasi</strong>.</li>
              <li>Konfirmasi instalasi. Ikon logo Konselor akan muncul di Home Screen Android Anda.</li>
            </ol>
          </div>
        </div>

        {/* Benefits Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" /> Berjalan Standalone & Offline
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
