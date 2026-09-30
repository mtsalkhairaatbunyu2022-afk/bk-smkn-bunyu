import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  Trash2,
  Edit2,
  X,
  Camera,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  UserCheck,
  Calendar,
  Layers,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { Siswa, KolaborasiGuru, StatusKolaborasi } from '../types';
import { exportKolaborasiExcel } from '../utils/excelUtils';
import { exportKolaborasiPDF } from '../utils/pdfUtils';
import { exportKolaborasiWord } from '../utils/wordUtils';
import { useConfirm } from '../context/ConfirmContext';
import { MultiSelectDropdown } from './MultiSelectDropdown';

interface KolaborasiViewProps {
  kolaborasiList: KolaborasiGuru[];
  siswaList: Siswa[];
  onSaveKolaborasi: (item: KolaborasiGuru) => void;
  onDeleteKolaborasi: (id: string) => void;
}

export function KolaborasiView({
  kolaborasiList,
  siswaList,
  onSaveKolaborasi,
  onDeleteKolaborasi
}: KolaborasiViewProps) {
  const { confirmAction } = useConfirm();
  // Filter States
  const [selectedKelasList, setSelectedKelasList] = useState<string[]>([]);
  const [selectedStatusList, setSelectedStatusList] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KolaborasiGuru | null>(null);

  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [formKelas, setFormKelas] = useState('');
  const [formSiswaId, setFormSiswaId] = useState('');
  const [formNamaSiswa, setFormNamaSiswa] = useState('');
  const [formMitra, setFormMitra] = useState('Wali Kelas');
  const [formNamaRekan, setFormNamaRekan] = useState('');
  const [formBentuk, setFormBentuk] = useState('Konferensi Kasus (Case Conference)');
  const [formPermasalahan, setFormPermasalahan] = useState('');
  const [formRencanaSolusi, setFormRencanaSolusi] = useState('');
  const [formStatus, setFormStatus] = useState<StatusKolaborasi>('Solusi Disepakati');
  const [formGuruBK, setFormGuruBK] = useState('Tim Bimbingan Konseling SMKN 1 Bunyu');
  const [formFoto, setFormFoto] = useState<string | undefined>(undefined);

  // Available Classes from Siswa List
  const availableClasses = useMemo(() => {
    return Array.from(new Set(siswaList.map(s => (s.kelas || '').trim()).filter(Boolean))).sort();
  }, [siswaList]);

  // Modal Student List (STRICTLY FILTERED BY SELECTED CLASS)
  const modalStudentList = useMemo(() => {
    const targetK = (formKelas || (selectedKelasList.length > 0 ? selectedKelasList[0] : '')).trim().toLowerCase();
    if (targetK) {
      return siswaList.filter(s => (s.kelas || '').trim().toLowerCase() === targetK);
    }
    return [];
  }, [siswaList, formKelas, selectedKelasList]);

  // Filtered List for Table View
  const filteredList = useMemo(() => {
    return kolaborasiList.filter(k => {
      const matchSearch =
        (k.namaSiswa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (k.namaRekanGuru || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (k.permasalahan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (k.mitraKolaborasi || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchKelas =
        selectedKelasList.length === 0 ||
        selectedKelasList.some(c => (k.kelas || '').trim().toLowerCase() === c.trim().toLowerCase());
      const matchStatus =
        selectedStatusList.length === 0 ||
        selectedStatusList.includes(k.statusPenyelesaian);
      const matchMonth = !monthFilter || (k.tanggal || '').startsWith(monthFilter);

      return matchSearch && matchKelas && matchStatus && matchMonth;
    });
  }, [kolaborasiList, searchTerm, selectedKelasList, selectedStatusList, monthFilter]);

  // Handle Class Change in Modal Form
  const handleClassSelectInForm = (selectedK: string) => {
    setFormKelas(selectedK);
    // If student was selected from another class, reset
    if (formSiswaId) {
      const matched = siswaList.find(s => s.id === formSiswaId);
      if (matched && (matched.kelas || '').trim().toLowerCase() !== selectedK.trim().toLowerCase()) {
        setFormSiswaId('');
        setFormNamaSiswa('');
      }
    }
  };

  // Handle Select Student
  const handleSelectSiswa = (siswaId: string) => {
    setFormSiswaId(siswaId);
    if (!siswaId) {
      setFormNamaSiswa('');
      return;
    }
    const s = siswaList.find(x => x.id === siswaId);
    if (s) {
      setFormNamaSiswa(s.nama);
      setFormKelas(s.kelas);
    }
  };

  // Photo Upload Handler (with compressed base64)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFormFoto(dataUrl);
      };
    };
    reader.readAsDataURL(file);
  };

  // Open Form Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormTanggal(new Date().toISOString().split('T')[0]);
    const defaultK = (selectedKelasList.length > 0 ? selectedKelasList[0] : '') || (availableClasses.length > 0 ? availableClasses[0] : '');
    setFormKelas(defaultK);
    setFormSiswaId('');
    setFormNamaSiswa('');
    setFormMitra('Wali Kelas');
    setFormNamaRekan('');
    setFormBentuk('Konferensi Kasus (Case Conference)');
    setFormPermasalahan('');
    setFormRencanaSolusi('');
    setFormStatus('Solusi Disepakati');
    setFormGuruBK('Tim Bimbingan Konseling SMKN 1 Bunyu');
    setFormFoto(undefined);
    setIsModalOpen(true);
  };

  // Open Form Edit Modal
  const handleOpenEdit = async (item: KolaborasiGuru) => {
    const confirmed = await confirmAction({
      title: 'Konfirmasi Edit Kolaborasi',
      message: `Apakah Anda yakin ingin mengedit rekam kolaborasi untuk siswa ${item.namaSiswa}?`,
      type: 'edit',
      confirmText: 'Ya, Edit'
    });
    if (!confirmed) return;

    setEditingItem(item);
    setFormTanggal(item.tanggal);
    setFormKelas(item.kelas);
    setFormSiswaId(item.siswaId);
    setFormNamaSiswa(item.namaSiswa);
    setFormMitra(item.mitraKolaborasi);
    setFormNamaRekan(item.namaRekanGuru);
    setFormBentuk(item.bentukKolaborasi);
    setFormPermasalahan(item.permasalahan);
    setFormRencanaSolusi(item.rencanaSolusi);
    setFormStatus(item.statusPenyelesaian);
    setFormGuruBK(item.guruBK || 'Tim Bimbingan Konseling SMKN 1 Bunyu');
    setFormFoto(item.fotoDokumentasi);
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (item: KolaborasiGuru) => {
    const confirmed = await confirmAction({
      title: 'Konfirmasi Hapus Kolaborasi',
      message: `Apakah Anda yakin ingin menghapus data kolaborasi untuk siswa ${item.namaSiswa}?`,
      type: 'delete',
      confirmText: 'Ya, Hapus'
    });
    if (confirmed) {
      onDeleteKolaborasi(item.id);
    }
  };

  // Save Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaSiswa.trim() || !formKelas.trim() || !formPermasalahan.trim()) {
      alert('Mohon lengkapi data Nama Siswa, Kelas, dan Permasalahan Siswa.');
      return;
    }

    const isEditing = !!editingItem;
    const confirmed = await confirmAction({
      title: isEditing ? 'Konfirmasi Simpan Edit Kolaborasi' : 'Konfirmasi Simpan Kolaborasi Baru',
      message: isEditing
        ? `Apakah Anda yakin ingin menyimpan perubahan kolaborasi ${formNamaSiswa}?`
        : `Apakah Anda yakin ingin menyimpan data kolaborasi baru untuk ${formNamaSiswa}?`,
      type: isEditing ? 'edit' : 'save',
      confirmText: isEditing ? 'Ya, Simpan Edit' : 'Ya, Simpan'
    });
    if (!confirmed) return;

    const newItem: KolaborasiGuru = {
      id: editingItem ? editingItem.id : `klb-${Date.now()}`,
      tanggal: formTanggal,
      siswaId: formSiswaId || `sw-custom-${Date.now()}`,
      namaSiswa: formNamaSiswa,
      kelas: formKelas,
      mitraKolaborasi: formMitra,
      namaRekanGuru: formNamaRekan || 'Rekan Guru',
      bentukKolaborasi: formBentuk,
      permasalahan: formPermasalahan,
      rencanaSolusi: formRencanaSolusi,
      statusPenyelesaian: formStatus,
      guruBK: formGuruBK,
      fotoDokumentasi: formFoto,
      createdAt: editingItem?.createdAt || new Date().toISOString()
    };

    onSaveKolaborasi(newItem);
    setIsModalOpen(false);
  };

  // Export Handlers
  const handleExportExcelClick = async () => {
    const confirmed = await confirmAction({
      title: 'Konfirmasi Unduh Excel',
      message: 'Apakah Anda yakin ingin mengunduh data kolaborasi (Format Excel)?',
      type: 'download',
      confirmText: 'Ya, Unduh Excel'
    });
    if (confirmed) {
      exportKolaborasiExcel(filteredList, selectedKelasList.join(', ') || 'Semua Kelas');
    }
  };

  const handleExportPDF = async () => {
    const confirmed = await confirmAction({
      title: 'Konfirmasi Unduh PDF',
      message: 'Apakah Anda yakin ingin mengunduh data kolaborasi (Format PDF)?',
      type: 'download',
      confirmText: 'Ya, Unduh PDF'
    });
    if (confirmed) {
      exportKolaborasiPDF(filteredList, selectedKelasList.join(', ') || 'Semua Kelas');
    }
  };

  const handleExportWord = async () => {
    const confirmed = await confirmAction({
      title: 'Konfirmasi Unduh Word',
      message: 'Apakah Anda yakin ingin mengunduh data kolaborasi (Format Word)?',
      type: 'download',
      confirmText: 'Ya, Unduh Word'
    });
    if (confirmed) {
      exportKolaborasiWord(filteredList, selectedKelasList.join(', ') || 'Semua Kelas');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#0B1B47] via-slate-900 to-indigo-950 border border-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs tracking-wider uppercase mb-1">
              <Users className="w-4 h-4" />
              <span>Sinergi Pendidik SMKN 1 Bunyu</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Kolaborasi Penyelesaian Masalah Siswa
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Pencatatan rekam kolaborasi Guru BK bersama Wali Kelas, Guru Mata Pelajaran, Kajur, Guru Piket, dan Orang Tua dalam menangani masalah siswa secara holistik.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs shadow-lg flex items-center gap-2 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kolaborasi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Export Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Cari siswa / guru / masalah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
            />
          </div>

          {/* Filter Kelas */}
          <div>
            <MultiSelectDropdown
              options={availableClasses}
              selectedValues={selectedKelasList}
              onChange={setSelectedKelasList}
              placeholder="Kelas (Multi-Select)..."
            />
          </div>

          {/* Filter Status */}
          <div>
            <MultiSelectDropdown
              options={['Solusi Disepakati', 'Dalam Proses', 'Tindak Lanjut', 'Selesai']}
              selectedValues={selectedStatusList}
              onChange={setSelectedStatusList}
              placeholder="Status (Multi-Select)..."
            />
          </div>

          {/* Filter Bulan */}
          <div>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
            />
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="text-xs text-slate-400 font-medium">
            Menampilkan <span className="text-amber-300 font-bold">{filteredList.length}</span> data kolaborasi
          </div>

          <div className="flex items-center gap-2">
            {(searchTerm || selectedKelasList.length > 0 || selectedStatusList.length > 0 || monthFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedKelasList([]);
                  setSelectedStatusList([]);
                  setMonthFilter('');
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}

            <button
              onClick={handleExportExcelClick}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={handleExportWord}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Word</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 text-center w-10">NO</th>
                <th className="py-3.5 px-4">SISWA & KELAS</th>
                <th className="py-3.5 px-4">REKAN GURU & MITRA</th>
                <th className="py-3.5 px-4">BENTUK & PERMASALAHAN</th>
                <th className="py-3.5 px-4">KESEPAKATAN SOLUSI</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
                <th className="py-3.5 px-4 text-center w-20">FOTO BUKTI</th>
                <th className="py-3.5 px-4 text-center w-24">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredList.length > 0 ? (
                filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-xs">{item.namaSiswa}</div>
                      <div className="text-[11px] text-amber-300 font-semibold">{item.kelas}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.tanggal}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{item.namaRekanGuru}</div>
                      <span className="inline-block px-2 py-0.5 mt-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-bold">
                        {item.mitraKolaborasi}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-amber-400 font-bold text-[11px] mb-0.5">{item.bentukKolaborasi}</div>
                      <p className="text-slate-300 text-xs line-clamp-2">{item.permasalahan}</p>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-emerald-300 text-xs line-clamp-2">{item.rencanaSolusi || '-'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1 ${
                        item.statusPenyelesaian === 'Selesai' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        item.statusPenyelesaian === 'Solusi Disepakati' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        item.statusPenyelesaian === 'Dalam Proses' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {item.statusPenyelesaian}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {item.fotoDokumentasi ? (
                        <img
                          src={item.fotoDokumentasi}
                          alt="Bukti Dokumentasi"
                          className="w-12 h-12 object-cover rounded-lg border border-slate-700 shadow mx-auto hover:scale-150 transition-transform cursor-pointer"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-600 font-italic">Tidak Ada</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
                          title="Edit Kolaborasi"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Hapus Kolaborasi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    Belum ada data kolaborasi penyelesaian masalah siswaRecorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0B1B47] border border-slate-700 text-slate-100 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>{editingItem ? 'Edit Data Kolaborasi' : 'Entri Kolaborasi BK & Rekan Guru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Tgl & Kelas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-300 font-bold mb-1 uppercase text-[11px]">TANGGAL KEGIATAN</label>
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-amber-300 font-bold mb-1 uppercase text-[11px]">KELAS SISWA</label>
                  <select
                    value={formKelas}
                    onChange={(e) => handleClassSelectInForm(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60 cursor-pointer mb-1.5"
                  >
                    <option value="">PILIH DARI DAFTAR KELAS</option>
                    {availableClasses.map((k) => (
                      <option key={k} value={k}>{k}</option>
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

              {/* Student Dropdown (STRICTLY FILTERED BY CLASS) */}
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <label className="block text-slate-200 text-[11px] font-bold">
                  * Pilih Nama Siswa {formKelas ? `(Khusus Kelas ${formKelas})` : '(Pilih Kelas Terlebih Dahulu)'}:
                </label>
                <select
                  value={formSiswaId}
                  onChange={(e) => handleSelectSiswa(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400 text-xs cursor-pointer"
                >
                  <option value="">
                    {modalStudentList.length > 0
                      ? `-- Pilih Nama Siswa (${modalStudentList.length} siswa) --`
                      : `-- Pilih Kelas Terlebih Dahulu --`}
                  </option>
                  {modalStudentList.map(s => (
                    <option key={s.id} value={s.id}>{s.nama} - {s.kelas}</option>
                  ))}
                </select>
              </div>

              {/* Nama Siswa Input Fallback */}
              <div>
                <label className="block text-amber-300 font-bold mb-1 uppercase text-[11px]">NAMA SISWA</label>
                <input
                  type="text"
                  required
                  value={formNamaSiswa}
                  onChange={(e) => setFormNamaSiswa(e.target.value)}
                  placeholder="Nama lengkap siswa..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                />
              </div>

              {/* Rekan Guru & Mitra */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-300 font-bold mb-1 uppercase text-[11px]">PERAN / MITRA KOLABORASI</label>
                  <select
                    value={formMitra}
                    onChange={(e) => setFormMitra(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60 cursor-pointer font-bold mb-1.5"
                  >
                    <option value="Wali Kelas">Wali Kelas</option>
                    <option value="Guru Mata Pelajaran">Guru Mata Pelajaran</option>
                    <option value="Guru Piket">Guru Piket</option>
                    <option value="Kajur / Kepala Program">Kajur / Kepala Program</option>
                    <option value="Wakasek Kesiswaan">Wakasek Kesiswaan</option>
                    <option value="Orang Tua & Guru">Orang Tua & Guru</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Atau ketik mitra secara manual..."
                    value={formMitra}
                    onChange={(e) => setFormMitra(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-amber-400/60"
                  />
                </div>

                <div>
                  <label className="block text-amber-300 font-bold mb-1 uppercase text-[11px]">NAMA REKAN GURU / PENDIDIK</label>
                  <input
                    type="text"
                    required
                    value={formNamaRekan}
                    onChange={(e) => setFormNamaRekan(e.target.value)}
                    placeholder="Contoh: Bpk. Ruslan, S.Pd. (Wali Kelas)"
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                  />
                </div>
              </div>

              {/* Bentuk Kolaborasi */}
              <div>
                <label className="block text-amber-300 font-bold mb-1 uppercase text-[11px]">BENTUK KEGIATAN KOLABORASI</label>
                <select
                  value={formBentuk}
                  onChange={(e) => setFormBentuk(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60 cursor-pointer font-bold mb-1.5"
                >
                  <option value="Konferensi Kasus (Case Conference)">Konferensi Kasus (Case Conference)</option>
                  <option value="Home Visit Bersama">Home Visit Bersama (Kunjungan Rumah)</option>
                  <option value="Pendampingan Belajar Khusus">Pendampingan Belajar Khusus</option>
                  <option value="Observasi Perilaku Kelas">Observasi Perilaku Kelas</option>
                  <option value="Diskusi & Penanganan Khusus">Diskusi & Penanganan Khusus</option>
                </select>
                <input
                  type="text"
                  placeholder="Atau ketik bentuk kegiatan secara manual..."
                  value={formBentuk}
                  onChange={(e) => setFormBentuk(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-amber-400/60"
                />
              </div>

              {/* Permasalahan */}
              <div>
                <label className="block text-amber-300 font-bold mb-1 uppercase text-[11px]">DESKRIPSI PERMASALAHAN SISWA</label>
                <textarea
                  rows={2}
                  required
                  value={formPermasalahan}
                  onChange={(e) => setFormPermasalahan(e.target.value)}
                  placeholder="Rincian masalah siswa yang dibahas bersama..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                />
              </div>

              {/* Rencana Solusi */}
              <div>
                <label className="block text-amber-300 font-bold mb-1 uppercase text-[11px]">KESEPAKATAN SOLUSI & TINDAK LANJUT BERSAMA</label>
                <textarea
                  rows={2}
                  value={formRencanaSolusi}
                  onChange={(e) => setFormRencanaSolusi(e.target.value)}
                  placeholder="Hasil diskusi dan kesepakatan penanganan bersama..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                />
              </div>

              {/* Status & Guru BK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-300 font-bold mb-1 uppercase text-[11px]">STATUS PENYELESAIAN</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as StatusKolaborasi)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60 font-bold cursor-pointer mb-1.5"
                  >
                    <option value="Solusi Disepakati">Solusi Disepakati</option>
                    <option value="Dalam Proses">Dalam Proses</option>
                    <option value="Tindak Lanjut">Tindak Lanjut</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Atau ketik status penyelesaian secara manual..."
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-amber-400/60"
                  />
                </div>

                <div>
                  <label className="block text-amber-300 font-bold mb-1 uppercase text-[11px]">GURU BK / PEMBIMBING</label>
                  <input
                    type="text"
                    value={formGuruBK}
                    onChange={(e) => setFormGuruBK(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                  />
                </div>
              </div>

              {/* Foto Upload */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-amber-300 font-bold uppercase text-[11px]">
                  FOTO DOKUMENTASI KEGIATAN KOLABORASI
                </label>
                <div className="flex items-center gap-3">
                  <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    <span>Upload / Ambil Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  {formFoto && (
                    <div className="flex items-center gap-2">
                      <img src={formFoto} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-amber-400" />
                      <button
                        type="button"
                        onClick={() => setFormFoto(undefined)}
                        className="text-xs text-rose-400 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg"
                >
                  Simpan Kolaborasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
