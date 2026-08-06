import React, { useState } from 'react';
import { X, Database, Download, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { exportDatabaseJSON, importDatabaseJSON } from '../db/indexedDB';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  onRefreshData
}) => {
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleExportBackup = async () => {
    try {
      const data = await exportDatabaseJSON();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BACKUP_DATABASE_BK_SMKN1_BUNYU_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMsg({ type: 'success', text: 'Database JSON berhasil diunduh!' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Gagal mengeksport database.' });
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsedData = JSON.parse(content);
        const success = await importDatabaseJSON(parsedData);
        if (success) {
          setStatusMsg({ type: 'success', text: 'Data berhasil dipulihkan (restore)!' });
          onRefreshData();
        } else {
          setStatusMsg({ type: 'error', text: 'Format file JSON tidak valid.' });
        }
      } catch {
        setStatusMsg({ type: 'error', text: 'Gagal membaca file backup JSON.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0B1B47] border border-slate-700 text-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-700 mb-4">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-amber-400" />
            <h2 className="text-base font-bold text-white">Backup & Restore Database</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMsg && (
          <div className={`p-3 rounded-lg text-xs font-medium mb-4 flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Export JSON */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-xs font-bold text-amber-300 mb-1 flex items-center gap-2">
              <Download className="w-4 h-4" /> Unduh Backup JSON
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">
              Simpan seluruh data siswa, absensi, konseling, jurnal, dan penilaian dalam bentuk file JSON aman ke penyimpanan lokal Anda.
            </p>
            <button
              onClick={handleExportBackup}
              className="w-full py-2.5 px-3 rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 font-extrabold text-xs shadow transition-all"
            >
              UNDUH BACKUP DATABASE JSON
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-xs font-bold text-blue-300 mb-1 flex items-center gap-2">
              <Upload className="w-4 h-4" /> Pulihkan (Restore) Database
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">
              Unggah file JSON backup yang pernah Anda unduh sebelumnya untuk mengembalikan data secara otomatis.
            </p>
            <label className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition-all flex items-center justify-center cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              <span>PILIH FILE JSON BACKUP</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="mt-5 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
