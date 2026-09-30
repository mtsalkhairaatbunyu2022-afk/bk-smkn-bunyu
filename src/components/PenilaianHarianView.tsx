import React, { useState, useMemo } from 'react';
import { Award, Plus, Edit2, Trash2, Download, Search, X, FileText, Printer } from 'lucide-react';
import { Siswa, PenilaianHarian } from '../types';
import { exportPenilaianExcel } from '../utils/excelUtils';
import { exportPenilaianWord } from '../utils/wordUtils';
import { exportPenilaianPDF } from '../utils/pdfUtils';
import { useConfirm } from '../context/ConfirmContext';
import { MultiSelectDropdown } from './MultiSelectDropdown';

interface PenilaianHarianViewProps {
  siswaList: Siswa[];
  penilaianList: PenilaianHarian[];
  onAddPenilaian: (item: PenilaianHarian) => void;
  onUpdatePenilaian: (item: PenilaianHarian) => void;
  onDeletePenilaian: (id: string) => void;
  onExportExcel: () => void;
}

export const PenilaianHarianView: React.FC<PenilaianHarianViewProps> = ({
  siswaList,
  penilaianList,
  onAddPenilaian,
  onUpdatePenilaian,
  onDeletePenilaian,
  onExportExcel
}) => {
  const { confirmAction } = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKelasList, setSelectedKelasList] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PenilaianHarian | null>(null);

  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [formSiswaId, setFormSiswaId] = useState('');
  const [formNamaSiswa, setFormNamaSiswa] = useState('');
  const [formKelas, setFormKelas] = useState('');
  const [formMataPelajaran, setFormMataPelajaran] = useState('Sikap & Kedisiplinan');
  const [formNilai, setFormNilai] = useState<number>(85);
  const [formKeterangan, setFormKeterangan] = useState('Baik');

  const availableClasses = useMemo(() => Array.from(new Set(siswaList.map(s => (s.kelas || '').trim()).filter(Boolean))).sort(), [siswaList]);

  const modalFilteredSiswa = useMemo(() => {
    const activeK = (formKelas || (selectedKelasList.length > 0 ? selectedKelasList[0] : '')).trim().toLowerCase();
    if (activeK) {
      return siswaList.filter(s => (s.kelas || '').trim().toLowerCase() === activeK);
    }
    return [];
  }, [siswaList, formKelas, selectedKelasList]);

  const filteredList = useMemo(() => {
    return penilaianList.filter(p => {
      const search = (searchTerm || '').toLowerCase();
      const matchSearch = (p.namaSiswa || '').toLowerCase().includes(search) ||
        (p.mataPelajaran || '').toLowerCase().includes(search);
      const matchKelas =
        selectedKelasList.length === 0 ||
        selectedKelasList.some(k => (p.kelas || '').trim().toLowerCase() === k.trim().toLowerCase());
      const matchMonth = !monthFilter || (p.tanggal || '').startsWith(monthFilter);
      return matchSearch && matchKelas && matchMonth;
    });
  }, [penilaianList, searchTerm, selectedKelasList, monthFilter]);

  // Rata-rata otomatis calculation
  const averageGrade = useMemo(() => {
    if (filteredList.length === 0) return 0;
    const total = filteredList.reduce((sum, item) => sum + item.nilai, 0);
    return Math.round((total / filteredList.length) * 10) / 10;
  }, [filteredList]);

  const handleSelectSiswa = (siswaId: string) => {
    setFormSiswaId(siswaId);
    const s = siswaList.find(x => x.id === siswaId);
    if (s) {
      setFormNamaSiswa(s.nama);
      setFormKelas(s.kelas);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormTanggal(new Date().toISOString().split('T')[0]);
    const initK = (selectedKelasList.length > 0 ? selectedKelasList[0] : '') || (availableClasses.length > 0 ? availableClasses[0] : '');
    setFormKelas(initK);
    const initialList = initK ? siswaList.filter(s => (s.kelas || '').trim().toLowerCase() === initK.trim().toLowerCase()) : siswaList;
    if (initialList.length > 0) {
      setFormSiswaId(initialList[0].id);
      setFormNamaSiswa(initialList[0].nama);
    } else {
      setFormSiswaId('');
      setFormNamaSiswa('');
    }
    setFormMataPelajaran('Sikap & Kedisiplinan');
    setFormNilai(85);
    setFormKeterangan('Baik');
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (item: PenilaianHarian) => {
    const confirmed = await confirmAction({
      title: 'Konfirmasi Edit Penilaian',
      message: `Apakah Anda yakin ingin mengedit penilaian harian ${item.namaSiswa}?`,
      type: 'edit',
      confirmText: 'Ya, Edit'
    });
    if (!confirmed) return;

    setEditingItem(item);
    setFormTanggal(item.tanggal);
    setFormSiswaId(item.siswaId);
    setFormNamaSiswa(item.namaSiswa);
    setFormKelas(item.kelas);
    setFormMataPelajaran(item.mataPelajaran);
    setFormNilai(item.nilai);
    setFormKeterangan(item.keterangan);
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (item: PenilaianHarian) => {
    const confirmed = await confirmAction({
      title: 'Konfirmasi Hapus Penilaian',
      message: `Apakah Anda yakin ingin menghapus data penilaian ${item.namaSiswa} (${item.mataPelajaran})?`,
      type: 'delete',
      confirmText: 'Ya, Hapus'
    });
    if (confirmed) {
      onDeletePenilaian(item.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaSiswa.trim()) return;

    const isEditing = !!editingItem;
    const confirmed = await confirmAction({
      title: isEditing ? 'Konfirmasi Simpan Edit Penilaian' : 'Konfirmasi Simpan Penilaian Harian',
      message: isEditing
        ? `Apakah Anda yakin ingin menyimpan perubahan penilaian harian ${formNamaSiswa}?`
        : `Apakah Anda yakin ingin menyimpan penilaian harian baru untuk ${formNamaSiswa}?`,
      type: isEditing ? 'edit' : 'save',
      confirmText: isEditing ? 'Ya, Simpan Edit' : 'Ya, Simpan'
    });
    if (!confirmed) return;

    if (editingItem) {
      onUpdatePenilaian({
        ...editingItem,
        tanggal: formTanggal,
        siswaId: formSiswaId,
        namaSiswa: formNamaSiswa,
        kelas: formKelas,
        mataPelajaran: formMataPelajaran,
        nilai: Number(formNilai),
        keterangan: formKeterangan
      });
    } else {
      onAddPenilaian({
        id: `pn-${Date.now()}`,
        tanggal: formTanggal,
        siswaId: formSiswaId,
        namaSiswa: formNamaSiswa,
        kelas: formKelas,
        mataPelajaran: formMataPelajaran,
        nilai: Number(formNilai),
        keterangan: formKeterangan
      });
    }

    setIsModalOpen(false);
  };

  const handleDownloadExcelClick = async () => {
    const confirmed = await confirmAction({
      title: 'Konfirmasi Unduh Excel',
      message: 'Apakah Anda yakin ingin mengunduh data penilaian harian (Format Excel)?',
      type: 'download',
      confirmText: 'Ya, Unduh Excel'
    });
    if (!confirmed) return;

    const filterDesc = [
      selectedKelasList.length > 0 ? `Kelas ${selectedKelasList.join(', ')}` : '',
      monthFilter ? `Bulan ${monthFilter}` : '',
      searchTerm ? `Cari "${searchTerm}"` : ''
    ].filter(Boolean).join(' | ');
    exportPenilaianExcel(filteredList, filterDesc || 'Semua');
  };

  const handleDownloadWordClick = async () => {
    const confirmed = await confirmAction({
      title: 'Konfirmasi Unduh Word',
      message: 'Apakah Anda yakin ingin mengunduh data penilaian harian (Format Word)?',
      type: 'download',
      confirmText: 'Ya, Unduh Word'
    });
    if (!confirmed) return;

    const filterDesc = [
      selectedKelasList.length > 0 ? `Kelas ${selectedKelasList.join(', ')}` : '',
      monthFilter ? `Bulan ${monthFilter}` : '',
      searchTerm ? `Cari "${searchTerm}"` : ''
    ].filter(Boolean).join(' | ');
    exportPenilaianWord(filteredList, filterDesc || 'Semua');
  };

  const handleDownloadPDFClick = async () => {
    const confirmed = await confirmAction({
      title: 'Konfirmasi Unduh PDF',
      message: 'Apakah Anda yakin ingin mengunduh data penilaian harian (Format PDF)?',
      type: 'download',
      confirmText: 'Ya, Unduh PDF'
    });
    if (!confirmed) return;

    const filterDesc = [
      selectedKelasList.length > 0 ? `Kelas ${selectedKelasList.join(', ')}` : '',
      monthFilter ? `Bulan ${monthFilter}` : '',
      searchTerm ? `Cari "${searchTerm}"` : ''
    ].filter(Boolean).join(' | ');
    exportPenilaianPDF(filteredList, filterDesc || 'Semua');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Award className="w-6 h-6 text-purple-400" />
            Penilaian Harian & Sikap Siswa
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Penilaian indikator kepribadian, kedisiplinan, dan keaktifan siswa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Excel (Strictly Filtered) */}
          <button
            onClick={handleDownloadExcelClick}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Unduh Data Penilaian Terpilih (Excel)"
          >
            <Download className="w-4 h-4" /> Unduh Excel
          </button>
          
          {/* Export Word (Strictly Filtered) */}
          <button
            onClick={handleDownloadWordClick}
            className="px-3.5 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Unduh Data Penilaian Terpilih (Word)"
          >
            <FileText className="w-4 h-4 text-blue-400" /> Unduh Word
          </button>

          {/* Export PDF (Strictly Filtered) */}
          <button
            onClick={handleDownloadPDFClick}
            className="px-3.5 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow"
            title="Unduh Data Penilaian Terpilih (PDF)"
          >
            <Printer className="w-4 h-4 text-purple-400" /> Unduh PDF
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition-all flex items-center gap-2 shadow-lg shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Input Nilai</span>
          </button>
        </div>
      </div>

      {/* Rata-Rata Otomatis Card & Search & Month Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-purple-300 uppercase block">RATA-RATA OTOMATIS</span>
            <span className="text-xl font-black text-white">{averageGrade} / 100</span>
          </div>
          <Award className="w-7 h-7 text-purple-400 opacity-60" />
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama siswa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
          />
        </div>

        <div>
          <MultiSelectDropdown
            options={availableClasses}
            selectedValues={selectedKelasList}
            onChange={setSelectedKelasList}
            placeholder="PILIH KELAS (Multi-Select)..."
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5">
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400/60"
          />
          {monthFilter && (
            <button
              onClick={() => setMonthFilter('')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold shrink-0"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">NO</th>
                <th className="py-3.5 px-4">TANGGAL</th>
                <th className="py-3.5 px-4">NAMA SISWA / KELAS</th>
                <th className="py-3.5 px-4">MATA PELAJARAN / ASPEK</th>
                <th className="py-3.5 px-4 text-center">NILAI</th>
                <th className="py-3.5 px-4">KETERANGAN</th>
                <th className="py-3.5 px-4 text-center w-24">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredList.length > 0 ? (
                filteredList.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-slate-500">{index + 1}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{item.tanggal}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">{item.namaSiswa}</p>
                      <span className="text-[10px] text-amber-300 font-semibold">{item.kelas}</span>
                    </td>
                    <td className="py-3 px-4 text-purple-300 font-semibold">{item.mataPelajaran}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black ${
                        item.nilai >= 85 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        item.nilai >= 75 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {item.nilai}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{item.keterangan}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Belum ada data penilaian recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0B1B47] border border-slate-700 text-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
              <h3 className="text-sm font-bold text-white">
                {editingItem ? 'Edit Penilaian' : 'Tambah Penilaian Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kelas & Jurusan</label>
                  <select
                    value={formKelas}
                    onChange={(e) => {
                      const newK = e.target.value;
                      setFormKelas(newK);
                      const matching = newK ? siswaList.filter(s => (s.kelas || '').trim().toLowerCase() === newK.trim().toLowerCase()) : siswaList;
                      if (matching.length > 0) {
                        setFormSiswaId(matching[0].id);
                        setFormNamaSiswa(matching[0].nama);
                      } else {
                        setFormSiswaId('');
                        setFormNamaSiswa('');
                      }
                    }}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60 cursor-pointer mb-1.5"
                  >
                    <option value="">PILIH KELAS</option>
                    {availableClasses.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Atau ketik kelas secara manual..."
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-amber-400/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nama Siswa {formKelas ? `(Kelas ${formKelas})` : ''}
                </label>
                <select
                  value={formSiswaId}
                  onChange={(e) => handleSelectSiswa(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60 cursor-pointer mb-1.5"
                >
                  <option value="">
                    {modalFilteredSiswa.length > 0 ? '-- Pilih Siswa dari Database --' : '-- Tidak ada siswa pada kelas ini --'}
                  </option>
                  {modalFilteredSiswa.map(s => (
                    <option key={s.id} value={s.id}>{s.nama} ({s.kelas})</option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  placeholder="Atau ketik nama siswa secara manual..."
                  value={formNamaSiswa}
                  onChange={(e) => setFormNamaSiswa(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-400/60"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mata Pelajaran / Aspek Penilaian</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) setFormMataPelajaran(e.target.value);
                  }}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-amber-400/60 mb-1.5 cursor-pointer"
                >
                  <option value="">-- Pilih Aspek Penilaian Preset (Opsional) --</option>
                  <option value="Kedisiplinan & Tata Tertib Sekolah">Kedisiplinan & Tata Tertib Sekolah</option>
                  <option value="Sikap & Perilaku Santun (Akhlak)">Sikap & Perilaku Santun (Akhlak)</option>
                  <option value="Kerajinan & Kehadiran Kelas">Kerajinan & Kehadiran Kelas</option>
                  <option value="Kerapihan Pakaian & Seragam">Kerapihan Pakaian & Seragam</option>
                  <option value="Kerjasama & Kepedulian Sosial">Kerjasama & Kepedulian Sosial</option>
                  <option value="Keaktifan & Keterampilan Diri">Keaktifan & Keterampilan Diri</option>
                </select>
                <input
                  type="text"
                  required
                  value={formMataPelajaran}
                  onChange={(e) => setFormMataPelajaran(e.target.value)}
                  placeholder="Atau ketik aspek penilaian secara manual..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nilai (0 - 100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={formNilai}
                    onChange={(e) => setFormNilai(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-extrabold focus:outline-none focus:border-amber-400/60"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Keterangan</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) setFormKeterangan(e.target.value);
                    }}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-amber-400/60 mb-1.5 cursor-pointer"
                  >
                    <option value="">-- Pilih Preset Keterangan --</option>
                    <option value="Sangat Baik (A)">Sangat Baik (A)</option>
                    <option value="Baik (B)">Baik (B)</option>
                    <option value="Cukup (C)">Cukup (C)</option>
                    <option value="Perlu Pembinaan (D)">Perlu Pembinaan (D)</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={formKeterangan}
                    onChange={(e) => setFormKeterangan(e.target.value)}
                    placeholder="Atau ketik keterangan secara manual..."
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-extrabold hover:bg-amber-300"
                >
                  Simpan Nilai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
