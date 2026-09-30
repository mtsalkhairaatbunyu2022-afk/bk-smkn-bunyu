import React, { createContext, useContext, useState, ReactNode } from 'react';
import { HelpCircle, Save, Trash2, Download, Edit3, Upload } from 'lucide-react';

export type ConfirmType = 'save' | 'delete' | 'download' | 'edit' | 'upload' | 'general';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
}

interface ConfirmContextType {
  confirmAction: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalOptions, setModalOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirmAction = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalOptions(options);
      setResolver(() => resolve);
    });
  };

  const handleConfirm = () => {
    if (resolver) resolver(true);
    setModalOptions(null);
    setResolver(null);
  };

  const handleCancel = () => {
    if (resolver) resolver(false);
    setModalOptions(null);
    setResolver(null);
  };

  const getIconAndColor = (type?: ConfirmType) => {
    switch (type) {
      case 'save':
        return {
          icon: <Save className="w-8 h-8 text-emerald-400" />,
          bgIcon: 'bg-emerald-500/20 border-emerald-500/30',
          btnConfirm: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
          defaultTitle: 'Konfirmasi Simpan Data',
          defaultConfirm: 'Ya, Simpan'
        };
      case 'delete':
        return {
          icon: <Trash2 className="w-8 h-8 text-rose-400" />,
          bgIcon: 'bg-rose-500/20 border-rose-500/30',
          btnConfirm: 'bg-rose-600 hover:bg-rose-500 text-white',
          defaultTitle: 'Konfirmasi Hapus Data',
          defaultConfirm: 'Ya, Hapus'
        };
      case 'download':
        return {
          icon: <Download className="w-8 h-8 text-amber-400" />,
          bgIcon: 'bg-amber-500/20 border-amber-500/30',
          btnConfirm: 'bg-amber-400 hover:bg-amber-300 text-slate-950',
          defaultTitle: 'Konfirmasi Unduh Dokumen',
          defaultConfirm: 'Ya, Unduh'
        };
      case 'edit':
        return {
          icon: <Edit3 className="w-8 h-8 text-blue-400" />,
          bgIcon: 'bg-blue-500/20 border-blue-500/30',
          btnConfirm: 'bg-blue-600 hover:bg-blue-500 text-white',
          defaultTitle: 'Konfirmasi Edit Data',
          defaultConfirm: 'Ya, Edit'
        };
      case 'upload':
        return {
          icon: <Upload className="w-8 h-8 text-indigo-400" />,
          bgIcon: 'bg-indigo-500/20 border-indigo-500/30',
          btnConfirm: 'bg-indigo-600 hover:bg-indigo-500 text-white',
          defaultTitle: 'Konfirmasi Unggah Dokumen',
          defaultConfirm: 'Ya, Unggah'
        };
      default:
        return {
          icon: <HelpCircle className="w-8 h-8 text-amber-400" />,
          bgIcon: 'bg-amber-500/20 border-amber-500/30',
          btnConfirm: 'bg-amber-400 hover:bg-amber-300 text-slate-950',
          defaultTitle: 'Konfirmasi Tindakan',
          defaultConfirm: 'Ya, Lanjutkan'
        };
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirmAction }}>
      {children}
      {modalOptions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0b1638] border border-slate-700/80 text-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative transform transition-all scale-100">
            <div className="flex flex-col items-center text-center">
              <div className={`p-3 rounded-full border mb-3 ${getIconAndColor(modalOptions.type).bgIcon}`}>
                {getIconAndColor(modalOptions.type).icon}
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                {modalOptions.title || getIconAndColor(modalOptions.type).defaultTitle}
              </h3>
              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                {modalOptions.message}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
              >
                {modalOptions.cancelText || 'Tidak'}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs shadow-lg transition-all ${getIconAndColor(modalOptions.type).btnConfirm}`}
              >
                {modalOptions.confirmText || getIconAndColor(modalOptions.type).defaultConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};
