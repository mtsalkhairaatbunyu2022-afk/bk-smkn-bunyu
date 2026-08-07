import React, { useState, useMemo } from 'react';
import { Users, Plus, Edit2, Trash2, Search, Upload, Download, X, Check, FileSpreadsheet, CheckCircle2, FileText } from 'lucide-react';
import { Siswa } from '../types';
import { parseExcelFile, downloadTemplateExcelSiswa, exportSiswaExcel } from '../utils/excelUtils';
import { exportSiswaWord } from '../utils/wordUtils';

interface DataSiswaViewProps {
  siswaList: Siswa[];
  onAddSiswa: (item: Siswa) => void;
  onAddSiswaBatch?: (items: Siswa[]) => Promise<void> | void;
  onUpdateSiswa: (item: Siswa) => void;
  onDeleteSiswa: (id: string) => void;
  onImportExcel?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportExcel: () => void;
}

export const DataSiswaView: React.FC<DataSiswaViewProps> = ({
  siswaList,
  onAddSiswa,
  onAddSiswaBatch,
  onUpdateSiswa,
  onDeleteSiswa,
  onImportExcel,
  onExportExcel
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');

  // Modal Form State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);

  const [formNomor, setFormNomor] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formKelas, setFormKelas] = useState('');

  const availableClassOptions = useMemo(() => {
    const classSet = new Set<string>();
    siswaList.forEach(s => {
      const val = (s.kelas || '').trim();
      if (val) classSet.add(val);
    });
    return Array.from(classSet).sort();
  }, [siswaList]);

  // Uploaded File Confirmation Modal State
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [pendingImportSiswa, setPendingImportSiswa] = useState<Siswa[]>([]);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Filtered Siswa List based on search term & class filter
  const filteredSiswa = useMemo(() => {
    return siswaList.filter(s => {
      const term = (searchTerm || '').toLowerCase();
      const matchSearch =
        (s.nama || '').toLowerCase().includes(term) ||
        (s.nomor || '').toLowerCase().includes(term) ||
        (s.kelas || '').toLowerCase().includes(term) ||
        ((s.jurusan || '').toLowerCase().includes(term));
      const matchKelas = !kelasFilter || (s.kelas || '').trim().toLowerCase() === (kelasFilter || '').trim().toLowerCase();
      return matchSearch && matchKelas;
    });
  }, [siswaList, searchTerm, kelasFilter]);

  // Group filtered siswa by kelas for class-based numbering
  const groupedSiswa = useMemo<Record<string, Siswa[]>>(() => {
    const groups: Record<string, Siswa[]> = {};
    filteredSiswa.forEach(s => {
      const k = (s.kelas || '').trim() || 'Tanpa Kelas';
      if (!groups[k]) groups[k] = [];
      groups[k].push(s);
    });
    return groups;
  }, [filteredSiswa]);

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingFile(true);
      const parsedData = await parseExcelFile(file);
      
      if (parsedData.siswa && parsedData.siswa.length > 0) {
        setUploadedFileName(file.name);
        setPendingImportSiswa(parsedData.siswa);
        setIsImportConfirmOpen(true);
      } else {
        alert('File Excel yang diunggah tidak berisi data siswa yang valid.');
      }
    } catch (err) {
      alert('Gagal membaca data file Excel. Pastikan format tabel sesuai.');
    } finally {
      setIsProcessingFile(false);
      e.target.value = '';
    }
  };

  // Confirm Save Uploaded Data
  const handleConfirmSaveImport = async () => {
    if (pendingImportSiswa.length === 0) return;

    try {
      if (onAddSiswaBatch) {
        await onAddSiswaBatch(pendingImportSiswa);
      } else if (onImportExcel) {
        // Fallback if needed
        for (const item of pendingImportSiswa) {
          onAddSiswa(item);
        }
      }
      alert(`Berhasil menyimpan ${pendingImportSiswa.length} data siswa ke database!`);
      setIsImportConfirmOpen(false);
      setPendingImportSiswa([]);
      setUploadedFileName('');
    } catch (error) {
      alert('Terjadi kesalahan saat menyimpan data siswa.');
    }
  };

  const handleOpenAddModal = () => {
    setEditingSiswa(null);
    setFormNomor('');
    setFormNama('');
    setFormKelas('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Siswa) => {
    setEditingSiswa(item);
    setFormNomor(item.nomor);
    setFormNama(item.nama);
    setFormKelas(item.kelas);
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) return;

    if (editingSiswa) {
      onUpdateSiswa({
        ...editingSiswa,
        nomor: formNomor,
        nama: formNama,
        kelas: formKelas,
        jurusan: formKelas,
      });
    } else {
      onAddSiswa({
        id: `sw-${Date.now()}`,
        nomor: formNomor,
        nama: formNama,
        kelas: formKelas,
        jurusan: formKelas,
        createdAt: new Date().toISOString()
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-amber-400" />
            Data Siswa SMKN 1 Bunyu
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Total {siswaList.length} siswa terdaftar pada database lokal sekolah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Template Excel Download Button */}
          <button
            onClick={downloadTemplateExcelSiswa}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow"
            title="Unduh contoh format file Excel untuk import data siswa"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>Format Excel</span>
          </button>

          {/* Import Excel File Upload */}
          <label className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow shadow-emerald-600/20">
            <Upload className="w-4 h-4 text-white" />
            <span>{isProcessingFile ? 'Membaca File...' : 'Unggah File'}</span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileUpload}
              disabled={isProcessingFile}
              className="hidden"
            />
          </label>

          {/* Export Excel */}
          <button
            onClick={() => exportSiswaExcel(siswaList)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow"
            title="Unduh Data Siswa Format Excel"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Excel</span>
          </button>

          {/* Export Word */}
          <button
            onClick={() => exportSiswaWord(siswaList)}
            className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow"
            title="Unduh Data Siswa Format Word"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Export Word</span>
          </button>

          {/* Tambah Siswa */}
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition-all flex items-center gap-2 shadow-lg shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, kelas, atau jurusan siswa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
          />
        </div>

        <select
          value={kelasFilter}
          onChange={(e) => setKelasFilter(e.target.value)}
          className="w-full sm:w-56 px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400/60 cursor-pointer font-bold"
        >
          <option value="">PILIH KELAS (SEMUA)</option>
          {availableClassOptions.map((k) => (
            <option key={k} value={k}>
              KELAS: {k}
            </option>
          ))}
        </select>
      </div>

      {/* Table Section grouped by class */}
      <div className="space-y-6">
        {(Object.keys(groupedSiswa).length > 0) ? (
          (Object.entries(groupedSiswa) as [string, Siswa[]][]).map(([kelasName, classSiswaList]) => (
            <div key={kelasName} className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <h3 className="font-black text-amber-300 text-xs sm:text-sm tracking-wide uppercase">
                    KELAS: {kelasName}
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-slate-300 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
                  {classSiswaList.length} Siswa
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 w-14 text-center">NO</th>
                      <th className="py-3 px-4">NAMA SISWA</th>
                      <th className="py-3 px-4">KELAS & JURUSAN</th>
                      <th className="py-3 px-4 text-center w-28">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {classSiswaList.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">{index + 1}</td>
                        <td className="py-3 px-4 font-bold text-white">{item.nama}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 font-semibold border border-blue-500/20">
                            {item.kelas}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteSiswa(item.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
            Belum ada data siswa.
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0B1B47] border border-slate-700 text-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
              <h3 className="text-sm font-bold text-white">
                {editingSiswa ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nomor (NIS / NISN)</label>
                <input
                  type="text"
                  required
                  value={formNomor}
                  onChange={(e) => setFormNomor(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                  placeholder="Contoh: 1001"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                  placeholder="Nama lengkap..."
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Kelas & Jurusan</label>
                <select
                  required
                  value={formKelas}
                  onChange={(e) => setFormKelas(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60 cursor-pointer"
                >
                  <option value="">PILIH KELAS</option>
                  {availableClassOptions.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-800 gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <X className="w-4 h-4 text-slate-400" />
                  <span>Batal</span>
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black hover:bg-amber-300 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/10"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>SIMPAN DATA SISWA</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Upload Confirmation Modal */}
      {isImportConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0B1B47] border border-slate-700 text-slate-100 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  File Data Siswa Berhasil Diunggah
                </h3>
              </div>
              <button onClick={() => setIsImportConfirmOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-4 flex items-start gap-3">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-emerald-300">File Unggahan: <span className="font-mono text-white">{uploadedFileName}</span></p>
                <p className="text-slate-300 mt-0.5">
                  Terdeteksi <strong className="text-emerald-400 font-extrabold">{pendingImportSiswa.length} data siswa</strong> yang siap disimpan ke dalam database. Silakan periksa pratinjau data di bawah dan klik tombol konfirmasi.
                </p>
              </div>
            </div>

            {/* Preview List */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950 mb-4">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">NO</th>
                    <th className="py-2.5 px-3">NAMA SISWA</th>
                    <th className="py-2.5 px-3">KELAS</th>
                    <th className="py-2.5 px-3">JURUSAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {pendingImportSiswa.slice(0, 50).map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3 text-white font-sans font-semibold">{s.nama}</td>
                      <td className="py-2 px-3 text-blue-300">{s.kelas}</td>
                      <td className="py-2 px-3 text-slate-400 font-sans">{s.jurusan}</td>
                    </tr>
                  ))}
                  {pendingImportSiswa.length > 50 && (
                    <tr>
                      <td colSpan={4} className="py-2 px-3 text-center text-slate-500 italic text-[11px]">
                        ...dan {pendingImportSiswa.length - 50} data siswa lainnya.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsImportConfirmOpen(false);
                  setPendingImportSiswa([]);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-slate-300 transition-colors"
              >
                Batal Unggah
              </button>
              
              <button
                type="button"
                onClick={handleConfirmSaveImport}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>KONFIRMASI SIMPAN DATA SISWA</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
