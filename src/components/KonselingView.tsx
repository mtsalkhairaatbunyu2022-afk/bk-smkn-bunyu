import React, { useState, useMemo, useRef } from 'react';
import { HeartHandshake, Plus, Edit2, Trash2, Printer, Search, X, Check, Camera, Image as ImageIcon, Eye, Download, FileText, FileSpreadsheet, Upload } from 'lucide-react';
import { Siswa, Konseling, StatusKonseling } from '../types';
import { printKonselingPDF, exportKonselingListPDF } from '../utils/pdfUtils';
import { exportKonselingExcel, downloadTemplateExcelSiswa, parseExcelFile } from '../utils/excelUtils';
import { exportKonselingWord } from '../utils/wordUtils';
import { saveSiswaBatch } from '../db/indexedDB';
import { useConfirm } from '../context/ConfirmContext';
import { MultiSelectDropdown } from './MultiSelectDropdown';

interface KonselingViewProps {
  siswaList: Siswa[];
  konselingList: Konseling[];
  onAddKonseling: (item: Konseling) => void;
  onUpdateKonseling: (item: Konseling) => void;
  onDeleteKonseling: (id: string) => void;
  onAddSiswaBatch?: (items: Siswa[]) => Promise<void> | void;
  filterKelas?: string;
  allowClasses?: string[];
  viewTitle?: string;
}

export const KonselingView: React.FC<KonselingViewProps> = ({
  siswaList,
  konselingList,
  onAddKonseling,
  onUpdateKonseling,
  onDeleteKonseling,
  onAddSiswaBatch,
  filterKelas,
  allowClasses,
  viewTitle
}) => {
  const { confirmAction } = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusList, setSelectedStatusList] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState('');

  // Upload Data Siswa State
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [pendingImportSiswa, setPendingImportSiswa] = useState<Siswa[]>([]);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Konseling | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [formSiswaId, setFormSiswaId] = useState('');
  const [formNamaSiswa, setFormNamaSiswa] = useState('');
  const [formKelas, setFormKelas] = useState('');
  const [formPermasalahan, setFormPermasalahan] = useState('');
  const [formTindakLanjut, setFormTindakLanjut] = useState('');
  const [formStatusPenyelesaian, setFormStatusPenyelesaian] = useState('');
  const [formGuruBK, setFormGuruBK] = useState('Drs. H. M. Syarif, M.Pd');
  const [formFotoDokumentasi, setFormFotoDokumentasi] = useState<string>('');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);

  const stopLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsLiveCameraOpen(false);
  };

  const startLiveCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      mediaStreamRef.current = stream;
      setIsLiveCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      // Fallback to file camera input
      cameraInputRef.current?.click();
    }
  };

  const capturePhotoFromStream = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setFormFotoDokumentasi(dataUrl);
    }
    stopLiveCamera();
  };

  const availableClassOptions = useMemo(() => {
    const classSet = new Set<string>();
    siswaList.forEach(s => {
      const val = (s.kelas || '').trim();
      if (val) classSet.add(val);
    });
    konselingList.forEach(k => {
      const val = (k.kelas || '').trim();
      if (val) classSet.add(val);
    });
    return Array.from(classSet).sort();
  }, [siswaList, konselingList]);

  const filteredList = useMemo(() => {
    return konselingList.filter(k => {
      let matchKelasFilter = true;
      const kKelas = (k.kelas || '').toLowerCase();
      if (allowClasses && allowClasses.length > 0) {
        matchKelasFilter = allowClasses.some(c => kKelas.includes((c || '').toLowerCase()));
      } else if (filterKelas) {
        matchKelasFilter = kKelas.includes(filterKelas.toLowerCase());
      }
      const search = (searchTerm || '').toLowerCase();
      const matchSearch = (k.namaSiswa || '').toLowerCase().includes(search) ||
        (k.permasalahan || '').toLowerCase().includes(search) ||
        kKelas.includes(search);
      const matchStatus =
        selectedStatusList.length === 0 ||
        selectedStatusList.some(s => (k.statusPenyelesaian || '').toLowerCase().includes(s.toLowerCase()));
      const matchMonth = !monthFilter || (k.tanggal || '').startsWith(monthFilter);
      return matchKelasFilter && matchSearch && matchStatus && matchMonth;
    });
  }, [konselingList, filterKelas, allowClasses, searchTerm, selectedStatusList, monthFilter]);

  const filteredSiswaList = useMemo(() => {
    const trimmedForm = (formKelas || '').trim().toLowerCase();
    if (trimmedForm) {
      return siswaList.filter(s => (s.kelas || '').trim().toLowerCase() === trimmedForm);
    }
    const trimmedFilter = (filterKelas || '').trim().toLowerCase();
    if (trimmedFilter) {
      return siswaList.filter(s => (s.kelas || '').trim().toLowerCase() === trimmedFilter);
    }
    if (allowClasses && allowClasses.length > 0) {
      return siswaList.filter(s => allowClasses.some(c => (s.kelas || '').toLowerCase().includes((c || '').toLowerCase())));
    }
    return [];
  }, [siswaList, formKelas, filterKelas, allowClasses]);

  const handleSelectSiswa = (siswaId: string) => {
    setFormSiswaId(siswaId);
    if (!siswaId) {
      setFormNamaSiswa('');
      setFormKelas('');
      return;
    }
    const s = siswaList.find(x => x.id === siswaId);
    if (s) {
      setFormNamaSiswa(s.nama);
      setFormKelas(s.kelas);
    }
  };

  const handleClassSelectInForm = (selectedK: string) => {
    setFormKelas(selectedK);
    if (formSiswaId) {
      const selectedStudent = siswaList.find(s => s.id === formSiswaId);
      if (selectedStudent && (selectedStudent.kelas || '').trim().toLowerCase() !== selectedK.trim().toLowerCase()) {
        setFormSiswaId('');
        setFormNamaSiswa('');
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar (JPG/PNG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormFotoDokumentasi(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // File Upload Handler for Student Data
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

  // Confirm Save Uploaded Student Data
  const handleConfirmSaveImport = async () => {
    if (pendingImportSiswa.length === 0) return;

    const confirmed = await confirmAction({
      title: 'Konfirmasi Unggah Data Siswa',
      message: `Apakah Anda yakin ingin mengimpor ${pendingImportSiswa.length} data siswa ini ke database?`,
      type: 'upload',
      confirmText: 'Ya, Impor'
    });
    if (!confirmed) return;

    try {
      if (onAddSiswaBatch) {
        await onAddSiswaBatch(pendingImportSiswa);
      } else {
        await saveSiswaBatch(pendingImportSiswa);
      }
      setIsImportConfirmOpen(false);
      setPendingImportSiswa([]);
      setUploadedFileName('');
    } catch (error) {
      alert('Terjadi kesalahan saat menyimpan data siswa.');
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormTanggal(new Date().toISOString().split('T')[0]);
    setFormSiswaId('');
    setFormNamaSiswa('');
    setFormKelas(filterKelas || '');
    setFormPermasalahan('');
    setFormTindakLanjut('');
    setFormStatusPenyelesaian('');
    setFormGuruBK('Drs. H. M. Syarif, M.Pd');
    setFormFotoDokumentasi('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (item: Konseling) => {
    const confirmed = await confirmAction({
      title: 'Konfirmasi Edit Konseling',
      message: `Apakah Anda yakin ingin mengedit catatan konseling ${item.namaSiswa}?`,
      type: 'edit',
      confirmText: 'Ya, Edit'
    });
    if (!confirmed) return;

    setEditingItem(item);
    setFormTanggal(item.tanggal);
    setFormSiswaId(item.siswaId);
    setFormNamaSiswa(item.namaSiswa);
    setFormKelas(item.kelas);
    setFormPermasalahan(item.permasalahan);
    setFormTindakLanjut(item.tindakLanjut);
    setFormStatusPenyelesaian(item.statusPenyelesaian);
    setFormGuruBK(item.guruBK);
    setFormFotoDokumentasi(item.fotoDokumentasi || '');
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (item: Konseling) => {
    const confirmed = await confirmAction({
      title: 'Konfirmasi Hapus Data Konseling',
      message: `Apakah Anda yakin ingin menghapus data konseling ${item.namaSiswa} (${item.tanggal})?`,
      type: 'delete',
      confirmText: 'Ya, Hapus'
    });
    if (confirmed) {
      onDeleteKonseling(item.id);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaSiswa.trim() || !formPermasalahan.trim()) return;

    const isEditing = !!editingItem;
    const confirmed = await confirmAction({
      title: isEditing ? 'Konfirmasi Simpan Edit Konseling' : 'Konfirmasi Simpan Sesi Konseling',
      message: isEditing
        ? `Apakah Anda yakin ingin menyimpan perubahan sesi konseling ${formNamaSiswa}?`
        : `Apakah Anda yakin ingin menyimpan sesi konseling baru untuk ${formNamaSiswa}?`,
      type: isEditing ? 'edit' : 'save',
      confirmText: isEditing ? 'Ya, Simpan Edit' : 'Ya, Simpan'
    });
    if (!confirmed) return;

    if (editingItem) {
      onUpdateKonseling({
        ...editingItem,
        tanggal: formTanggal,
        siswaId: formSiswaId,
        namaSiswa: formNamaSiswa,
        kelas: formKelas,
        permasalahan: formPermasalahan,
        tindakLanjut: formTindakLanjut,
        statusPenyelesaian: formStatusPenyelesaian,
        guruBK: formGuruBK,
        fotoDokumentasi: formFotoDokumentasi
      });
    } else {
      onAddKonseling({
        id: `ks-${Date.now()}`,
        tanggal: formTanggal,
        siswaId: formSiswaId,
        namaSiswa: formNamaSiswa,
        kelas: formKelas,
        permasalahan: formPermasalahan,
        tindakLanjut: formTindakLanjut,
        statusPenyelesaian: formStatusPenyelesaian,
        guruBK: formGuruBK,
        fotoDokumentasi: formFotoDokumentasi
      });
    }

    setIsModalOpen(false);
  };

  const handleDownloadExcelClick = async () => {
    const confirmed = await confirmAction({
      title: 'Konfirmasi Unduh Excel',
      message: 'Apakah Anda yakin ingin mengunduh laporan layanan bimbingan konseling (Format Excel)?',
      type: 'download',
      confirmText: 'Ya, Unduh Excel'
    });
    if (!confirmed) return;

    const filterDesc = [
      filterKelas ? `Kelas ${filterKelas}` : '',
      monthFilter ? `Bulan ${monthFilter}` : '',
      selectedStatusList.length > 0 ? `Status ${selectedStatusList.join(', ')}` : '',
      searchTerm ? `Cari "${searchTerm}"` : ''
    ].filter(Boolean).join(' | ');
    exportKonselingExcel(filteredList, filterDesc || 'Semua');
  };

  const handleDownloadWordClick = async () => {
    const confirmed = await confirmAction({
      title: 'Konfirmasi Unduh Word',
      message: 'Apakah Anda yakin ingin mengunduh laporan layanan bimbingan konseling (Format Word)?',
      type: 'download',
      confirmText: 'Ya, Unduh Word'
    });
    if (!confirmed) return;

    const filterDesc = [
      filterKelas ? `Kelas ${filterKelas}` : '',
      monthFilter ? `Bulan ${monthFilter}` : '',
      selectedStatusList.length > 0 ? `Status ${selectedStatusList.join(', ')}` : '',
      searchTerm ? `Cari "${searchTerm}"` : ''
    ].filter(Boolean).join(' | ');
    exportKonselingWord(filteredList, filterDesc || 'Semua');
  };

  const handleDownloadPDFClick = async () => {
    const confirmed = await confirmAction({
      title: 'Konfirmasi Unduh PDF',
      message: 'Apakah Anda yakin ingin mengunduh laporan layanan bimbingan konseling (Format PDF)?',
      type: 'download',
      confirmText: 'Ya, Unduh PDF'
    });
    if (!confirmed) return;

    const filterDesc = [
      filterKelas ? `Kelas ${filterKelas}` : '',
      monthFilter ? `Bulan ${monthFilter}` : '',
      selectedStatusList.length > 0 ? `Status ${selectedStatusList.join(', ')}` : '',
      searchTerm ? `Cari "${searchTerm}"` : ''
    ].filter(Boolean).join(' | ');
    exportKonselingListPDF(filteredList, filterDesc || 'Semua');
  };

  const handlePrintCardPDF = async (item: Konseling) => {
    const confirmed = await confirmAction({
      title: 'Konfirmasi Cetak Kartu PDF',
      message: `Apakah Anda yakin ingin mengunduh kartu sesi konseling ${item.namaSiswa}?`,
      type: 'download',
      confirmText: 'Ya, Unduh Kartu PDF'
    });
    if (confirmed) {
      printKonselingPDF(item);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-black text-white flex items-center gap-2.5">
              <HeartHandshake className="w-6 h-6 text-amber-400" />
              {viewTitle || 'Layanan Bimbingan Konseling'}
            </h2>
            {filterKelas && (
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/40">
                Khusus Kelas {filterKelas}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {filterKelas 
              ? `Catatan sesi konseling khusus kelas ${filterKelas} SMKN 1 Bunyu.` 
              : 'Catatan sesi konseling individual & kelompok siswa SMKN 1 Bunyu.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Template Excel Download Button */}
          <button
            onClick={downloadTemplateExcelSiswa}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow"
            title="Unduh contoh format file Excel untuk import data siswa"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>Format Excel Siswa</span>
          </button>

          {/* Import Excel Student Data File Upload */}
          <label className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow shadow-emerald-600/20">
            <Upload className="w-4 h-4 text-white" />
            <span>{isProcessingFile ? 'Membaca File...' : 'Unggah Data Siswa'}</span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileUpload}
              disabled={isProcessingFile}
              className="hidden"
            />
          </label>

          {/* Export Excel (Filtered with Photos) */}
          <button
            onClick={handleDownloadExcelClick}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Unduh Data Layanan BK Terpilih beserta Foto (Excel)"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Excel</span>
          </button>
          
          {/* Export Word (Filtered with Photos) */}
          <button
            onClick={handleDownloadWordClick}
            className="px-3.5 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Unduh Data Layanan BK Terpilih beserta Foto (Word)"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Unduh Word</span>
          </button>

          {/* Export PDF (Filtered with Photos) */}
          <button
            onClick={handleDownloadPDFClick}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow"
            title="Unduh Laporan Layanan BK Terpilih beserta Foto (PDF)"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>Unduh PDF</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition-all flex items-center gap-2 shadow-lg shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Layanan BK</span>
          </button>
        </div>
      </div>

      {/* Search and Month Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama siswa, kelas, masalah..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
          />
        </div>

        <div>
          <MultiSelectDropdown
            options={[
              'Proses Bimbingan',
              'Selesai / Tuntas',
              'Kunjungan Rumah (Home Visit)',
              'Pemantauan Berkala',
              'Konferensi Kasus',
              'Rujukan Pihak Luar'
            ]}
            selectedValues={selectedStatusList}
            onChange={setSelectedStatusList}
            placeholder="PILIH STATUS (Bisa Lebih Dari 1)..."
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-400 shrink-0">Bulan:</label>
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400/60"
          />
          {monthFilter && (
            <button
              onClick={() => setMonthFilter('')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              title="Reset Bulan"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">NO</th>
                <th className="py-3.5 px-4">TGL</th>
                <th className="py-3.5 px-4">KELAS+JURUSAN</th>
                <th className="py-3.5 px-4">NAMA & PERMASALAHAN SISWA</th>
                <th className="py-3.5 px-4">TINDAK LANJUT & SOLUSI BK</th>
                <th className="py-3.5 px-4 text-center">STATUS PENYELESAIAN</th>
                <th className="py-3.5 px-4 text-center">FOTO</th>
                <th className="py-3.5 px-4 text-center w-28">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredList.length > 0 ? (
                filteredList.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-slate-500">{index + 1}</td>
                    <td className="py-3 px-4 font-mono text-amber-300 whitespace-nowrap">{item.tanggal}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 font-semibold border border-blue-500/20 whitespace-nowrap">
                        {item.kelas}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-bold text-white text-xs">{item.namaSiswa}</p>
                      <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">{item.permasalahan}</p>
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-300 line-clamp-2">{item.tindakLanjut}</td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                        item.statusPenyelesaian === 'Selesai' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        item.statusPenyelesaian === 'Proses' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        item.statusPenyelesaian === 'Rujukan' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {item.statusPenyelesaian}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.fotoDokumentasi ? (
                        <button
                          onClick={() => setPreviewPhotoUrl(item.fotoDokumentasi || null)}
                          className="relative group inline-block"
                          title="Lihat Foto Dokumentasi"
                        >
                          <img
                            src={item.fotoDokumentasi}
                            alt="Bukti Foto"
                            className="w-10 h-10 object-cover rounded-lg border border-amber-400/40 group-hover:scale-105 transition-transform"
                          />
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[10px] italic">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handlePrintCardPDF(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400"
                          title="Cetak Kartu PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400"
                          title="Hapus"
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
                    Belum ada data bimbingan konseling recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0B1B47] border border-slate-700 text-slate-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-amber-400" />
                <span>{editingItem ? 'Edit Data Konseling' : 'Entri Data Layanan BK'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                title="Tutup (X)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* TGL & KELAS+JURUSAN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-300 font-bold mb-1 uppercase tracking-wider text-[11px]">TGL (TANGGAL)</label>
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-amber-300 font-bold mb-1 uppercase tracking-wider text-[11px]">KELAS+JURUSAN</label>
                  <select
                    value={formKelas}
                    onChange={(e) => handleClassSelectInForm(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60 cursor-pointer mb-1.5"
                  >
                    <option value="">PILIH DARI DAFTAR KELAS</option>
                    {availableClassOptions.map((k) => (
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

              {/* Optional Student Auto-fill */}
              {siswaList.length > 0 && (
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <label className="block text-slate-300 text-[11px] font-bold">
                    * Pilih Siswa dari Database {formKelas ? `(Kelas ${formKelas})` : filterKelas ? `(Kelas ${filterKelas})` : ''}:
                  </label>

                  <select
                    value={formSiswaId}
                    onChange={(e) => handleSelectSiswa(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400 text-xs cursor-pointer"
                  >
                    <option value="">
                      {filteredSiswaList.length > 0
                        ? `-- Pilih Nama Siswa (${filteredSiswaList.length} siswa) --`
                        : `-- Tidak ada siswa pada kelas ${formKelas || filterKelas || ''} --`}
                    </option>
                    {filteredSiswaList.map(s => (
                      <option key={s.id} value={s.id}>{s.nama} - Kelas {s.kelas}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* NAMA SISWA & NAMAPERMASALAHAN SISWA */}
              <div className="space-y-3">
                <div>
                  <label className="block text-amber-300 font-bold mb-1 uppercase tracking-wider text-[11px]">NAMA SISWA</label>
                  <input
                    type="text"
                    required
                    value={formNamaSiswa}
                    onChange={(e) => setFormNamaSiswa(e.target.value)}
                    placeholder="Nama lengkap siswa..."
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                  />
                </div>

                <div>
                  <label className="block text-amber-300 font-bold mb-1 uppercase tracking-wider text-[11px]">NAMAPERMASALAHAN SISWA</label>
                  <textarea
                    required
                    rows={3}
                    value={formPermasalahan}
                    onChange={(e) => setFormPermasalahan(e.target.value)}
                    placeholder="Uraian permasalahan siswa..."
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                  ></textarea>
                </div>
              </div>

              {/* TINDAK LANJUT & SOLUSI BK */}
              <div>
                <label className="block text-amber-300 font-bold mb-1 uppercase tracking-wider text-[11px]">TINDAK LANJUT & SOLUSI BK</label>
                <textarea
                  required
                  rows={3}
                  value={formTindakLanjut}
                  onChange={(e) => setFormTindakLanjut(e.target.value)}
                  placeholder="Catatan tindak lanjut dan rekomendasi solusi BK..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                ></textarea>
              </div>

              {/* STATUS PENYELESAIAN */}
              <div>
                <label className="block text-amber-300 font-bold mb-1 uppercase tracking-wider text-[11px]">STATUS PENYELESAIAN</label>
                <select
                  value={formStatusPenyelesaian}
                  onChange={(e) => setFormStatusPenyelesaian(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60 font-semibold mb-1.5 cursor-pointer"
                >
                  <option value="">-- Pilih Status Preset --</option>
                  <option value="Proses">Proses Bimbingan</option>
                  <option value="Selesai">Selesai / Tuntas</option>
                  <option value="Kunjungan Rumah (Home Visit)">Kunjungan Rumah (Home Visit)</option>
                  <option value="Pemantauan Berkala">Pemantauan Berkala</option>
                  <option value="Konferensi Kasus">Konferensi Kasus</option>
                  <option value="Rujukan Pihak Luar">Rujukan Pihak Luar</option>
                </select>
                <input
                  type="text"
                  value={formStatusPenyelesaian}
                  onChange={(e) => setFormStatusPenyelesaian(e.target.value)}
                  placeholder="Atau ketik status penyelesaian secara manual..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60 font-semibold"
                />
              </div>

              {/* UNGGAH DOKUMENTASI FOTO (KAMERA / GALERI) */}
              <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <label className="block text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                  UNGGAH DOKUMENTASI / FOTO BUKTI (OPSIONAL)
                </label>
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* Direct Camera Trigger */}
                  <button
                    type="button"
                    onClick={startLiveCamera}
                    className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow"
                  >
                    <Camera className="w-4 h-4 text-amber-300" />
                    <span>Ambil Foto (Kamera)</span>
                  </button>

                  {/* Gallery Input Trigger */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span>Pilih dari Galeri</span>
                  </button>

                  {/* Hidden inputs */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                {/* Photo Preview if attached */}
                {formFotoDokumentasi && (
                  <div className="relative mt-2 p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
                    <img
                      src={formFotoDokumentasi}
                      alt="Pratinjau Bukti Foto"
                      className="w-16 h-16 object-cover rounded-lg border border-amber-400/40"
                    />
                    <div className="flex-1 text-[11px]">
                      <p className="font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Foto Berhasil Diunggah
                      </p>
                      <p className="text-slate-400 text-[10px]">Tersimpan bersama catatan layanan BK</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormFotoDokumentasi('')}
                      className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition-colors"
                      title="Hapus Foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
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
                  <span>SIMPAN DATA BK</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Viewing Modal */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-sm font-bold text-amber-300 mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4" /> Foto Dokumentasi Layanan BK
            </h4>
            <div className="w-full bg-slate-950 p-2 rounded-xl flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={previewPhotoUrl}
                alt="Foto Dokumentasi Sesi BK"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Uploaded Student Data File */}
      {isImportConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" />
                Konfirmasi Unggah File Data Siswa
              </h3>
              <button onClick={() => setIsImportConfirmOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-4 flex items-start gap-3">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-emerald-300">File Unggahan: <span className="font-mono text-white">{uploadedFileName}</span></p>
                <p className="text-slate-300 mt-0.5">
                  Terdeteksi <strong className="text-emerald-400 font-extrabold">{pendingImportSiswa.length} data siswa</strong> yang siap disimpan ke dalam database.
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
      {/* Live Camera Stream Modal */}
      {isLiveCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col items-center">
            <button
              onClick={stopLiveCamera}
              className="absolute top-3 right-3 p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h4 className="text-sm font-bold text-amber-300 mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-400" /> Pengambilan Foto Bukti (Kamera Live)
            </h4>

            <div className="w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>

            <div className="mt-4 flex items-center justify-between w-full gap-3">
              <button
                type="button"
                onClick={stopLiveCamera}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={capturePhotoFromStream}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Camera className="w-4 h-4" />
                <span>JEPRET / AMBIL FOTO</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
