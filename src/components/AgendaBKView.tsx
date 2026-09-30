import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  User,
  Home,
  HeartHandshake,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  X,
  Search,
  Filter,
  FileText,
  Download,
  AlertCircle
} from 'lucide-react';
import { Siswa, AgendaBK, KategoriAgendaBK } from '../types';
import { MiniCalendar, CalendarEventMarker } from './MiniCalendar';
import { exportAgendaPDF } from '../utils/pdfUtils';
import { useConfirm } from '../context/ConfirmContext';
import { MultiSelectDropdown } from './MultiSelectDropdown';

interface AgendaBKViewProps {
  siswaList: Siswa[];
  agendaList: AgendaBK[];
  onSaveAgenda: (item: AgendaBK) => void;
  onDeleteAgenda: (id: string) => void;
}

export function AgendaBKView({
  siswaList,
  agendaList,
  onSaveAgenda,
  onDeleteAgenda
}: AgendaBKViewProps) {
  const { confirmAction } = useConfirm();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategoriList, setSelectedKategoriList] = useState<string[]>([]);
  const [selectedStatusList, setSelectedStatusList] = useState<string[]>([]);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AgendaBK | null>(null);

  const [formTanggal, setFormTanggal] = useState(selectedDate);
  const [formJam, setFormJam] = useState('09:00');
  const [formKategori, setFormKategori] = useState<KategoriAgendaBK>('Sesi Konseling Individu');
  const [formKelas, setFormKelas] = useState('');
  const [formSiswaId, setFormSiswaId] = useState('');
  const [formNamaSiswa, setFormNamaSiswa] = useState('');
  const [formKeterangan, setFormKeterangan] = useState('');
  const [formLokasi, setFormLokasi] = useState('Ruang BK SMKN 1 Bunyu');
  const [formStatus, setFormStatus] = useState<'Rencana' | 'Terlaksana' | 'Dibatalkan' | 'Dijadwalkan Ulang'>('Rencana');
  const [formGuruBK, setFormGuruBK] = useState('Tim Bimbingan Konseling SMKN 1 Bunyu');

  // Available Classes
  const availableClasses = useMemo(() => {
    return Array.from(new Set(siswaList.map(s => (s.kelas || '').trim()).filter(Boolean))).sort();
  }, [siswaList]);

  // Modal Filtered Students (Strictly by Selected Class in Modal)
  const modalStudentList = useMemo(() => {
    if (!formKelas) return [];
    return siswaList.filter(s => (s.kelas || '').trim().toLowerCase() === formKelas.trim().toLowerCase());
  }, [siswaList, formKelas]);

  // Event Markers for Calendar
  const calendarEventMarkers = useMemo(() => {
    const map: Record<string, { count: number; homeVisit: boolean; konseling: boolean }> = {};

    agendaList.forEach(a => {
      if (!map[a.tanggal]) {
        map[a.tanggal] = { count: 0, homeVisit: false, konseling: false };
      }
      map[a.tanggal].count += 1;
      if (a.kategori === 'Kunjungan Rumah (Home Visit)') map[a.tanggal].homeVisit = true;
      if (a.kategori.includes('Konseling')) map[a.tanggal].konseling = true;
    });

    return Object.entries(map).map(([date, info]) => ({
      date,
      count: info.count,
      type: info.homeVisit ? ('homevisit' as const) : info.konseling ? ('konseling' as const) : ('agenda' as const),
      label: `${info.count} Agenda BK`
    }));
  }, [agendaList]);

  // Filtered List for Selected Date & Filters
  const filteredAgendaList = useMemo(() => {
    return agendaList.filter(item => {
      const matchDate = !selectedDate || item.tanggal === selectedDate;
      const matchKategori =
        selectedKategoriList.length === 0 ||
        selectedKategoriList.some(k => (item.kategori || '').toLowerCase().includes(k.toLowerCase()));
      const matchStatus =
        selectedStatusList.length === 0 ||
        selectedStatusList.includes(item.status);
      const matchSearch =
        (item.namaSiswa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.keterangan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.lokasi || '').toLowerCase().includes(searchTerm.toLowerCase());

      return matchDate && matchKategori && matchStatus && matchSearch;
    });
  }, [agendaList, selectedDate, selectedKategoriList, selectedStatusList, searchTerm]);

  // Handle Class Change in Modal
  const handleClassChangeInForm = (k: string) => {
    setFormKelas(k);
    if (formSiswaId) {
      const matched = siswaList.find(s => s.id === formSiswaId);
      if (matched && (matched.kelas || '').trim().toLowerCase() !== k.trim().toLowerCase()) {
        setFormSiswaId('');
        setFormNamaSiswa('');
      }
    }
  };

  // Select Student Handler
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

  // Open Form Add
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormTanggal(selectedDate || new Date().toISOString().split('T')[0]);
    setFormJam('09:00');
    setFormKategori('Sesi Konseling Individu');
    const defaultK = availableClasses.length > 0 ? availableClasses[0] : '';
    setFormKelas(defaultK);
    setFormSiswaId('');
    setFormNamaSiswa('');
    setFormKeterangan('');
    setFormLokasi('Ruang BK SMKN 1 Bunyu');
    setFormStatus('Rencana');
    setFormGuruBK('Tim Bimbingan Konseling SMKN 1 Bunyu');
    setIsModalOpen(true);
  };

  // Open Form Edit
  const handleOpenEdit = async (item: AgendaBK) => {
    const confirmed = await confirmAction({
      title: 'Konfirmasi Edit Agenda',
      message: `Apakah Anda yakin ingin mengedit agenda BK "${item.kategori}" (${item.tanggal})?`,
      type: 'edit',
      confirmText: 'Ya, Edit'
    });
    if (!confirmed) return;

    setEditingItem(item);
    setFormTanggal(item.tanggal);
    setFormJam(item.jam || '09:00');
    setFormKategori(item.kategori);
    setFormKelas(item.kelas || '');
    setFormSiswaId(item.siswaId || '');
    setFormNamaSiswa(item.namaSiswa || '');
    setFormKeterangan(item.keterangan);
    setFormLokasi(item.lokasi || 'Ruang BK SMKN 1 Bunyu');
    setFormStatus(item.status);
    setFormGuruBK(item.guruBK || 'Tim Bimbingan Konseling SMKN 1 Bunyu');
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (item: AgendaBK) => {
    const confirmed = await confirmAction({
      title: 'Konfirmasi Hapus Agenda',
      message: `Apakah Anda yakin ingin menghapus agenda BK "${item.kategori}" (${item.tanggal})?`,
      type: 'delete',
      confirmText: 'Ya, Hapus'
    });
    if (confirmed) {
      onDeleteAgenda(item.id);
    }
  };

  // Save Agenda
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKeterangan.trim()) {
      alert('Mohon isi keterangan agenda.');
      return;
    }

    const isEditing = !!editingItem;
    const confirmed = await confirmAction({
      title: isEditing ? 'Konfirmasi Simpan Edit Agenda' : 'Konfirmasi Simpan Agenda Baru',
      message: isEditing
        ? `Apakah Anda yakin ingin menyimpan perubahan agenda BK "${formKategori}"?`
        : `Apakah Anda yakin ingin menyimpan agenda BK baru "${formKategori}"?`,
      type: isEditing ? 'edit' : 'save',
      confirmText: isEditing ? 'Ya, Simpan Edit' : 'Ya, Simpan'
    });
    if (!confirmed) return;

    const newItem: AgendaBK = {
      id: editingItem ? editingItem.id : `ag-${Date.now()}`,
      tanggal: formTanggal,
      jam: formJam,
      kategori: formKategori,
      siswaId: formSiswaId,
      namaSiswa: formNamaSiswa,
      kelas: formKelas,
      keterangan: formKeterangan,
      lokasi: formLokasi,
      status: formStatus,
      guruBK: formGuruBK
    };

    onSaveAgenda(newItem);
    setIsModalOpen(false);
  };

  // Export Handlers
  const handleExportPDF = async () => {
    const confirmed = await confirmAction({
      title: 'Konfirmasi Unduh PDF Agenda BK',
      message: 'Apakah Anda yakin ingin mengunduh laporan PDF agenda bimbingan konseling?',
      type: 'download',
      confirmText: 'Ya, Unduh PDF'
    });
    if (confirmed) {
      exportAgendaPDF(filteredAgendaList, selectedDate ? `Tanggal ${selectedDate}` : 'Semua Agenda');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-[#0B1B47] border border-amber-800/40 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs tracking-wider uppercase mb-1">
              <CalendarIcon className="w-4 h-4" />
              <span>Manajemen Jadwal & Agenda Layanan BK</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Agenda & Mini Kalender Bimbingan Konseling
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Kalender jadwal sesi konseling individu/kelompok, kunjungan rumah (Home Visit), konferensi kasus, serta bimbingan klasikal siswa.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs shadow-lg flex items-center gap-2 transition-transform active:scale-95 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Agenda / Sesi BK</span>
          </button>
        </div>
      </div>

      {/* Grid Layout: Mini Calendar Left & Agenda Table Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Mini Calendar Column */}
        <div className="space-y-4">
          <MiniCalendar
            title="Mini Kalender Agenda BK"
            selectedDate={selectedDate}
            onSelectDate={(d) => setSelectedDate(d)}
            events={calendarEventMarkers}
          />

          {/* Legend */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-xs space-y-2.5 shadow-lg">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1.5">
              LEGENDA INDIKATOR KALENDER
            </span>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span className="text-slate-300">Sesi Konseling Individu / Kelompok</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-slate-300">Kunjungan Rumah (Home Visit)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="text-slate-300">Konferensi Kasus / Agenda Lainnya</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Agenda List & Filters */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari agenda / siswa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Kategori Filter */}
              <div>
                <MultiSelectDropdown
                  options={[
                    'Sesi Konseling Individu',
                    'Konseling Kelompok',
                    'Kunjungan Rumah (Home Visit)',
                    'Konferensi Kasus',
                    'Bimbingan Karir & Klasikal'
                  ]}
                  selectedValues={selectedKategoriList}
                  onChange={setSelectedKategoriList}
                  placeholder="Kategori (Multi-Select)..."
                />
              </div>

              {/* Status Filter */}
              <div>
                <MultiSelectDropdown
                  options={['Rencana', 'Terlaksana', 'Dijadwalkan Ulang', 'Dibatalkan']}
                  selectedValues={selectedStatusList}
                  onChange={setSelectedStatusList}
                  placeholder="Status (Multi-Select)..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                Menampilkan <span className="text-amber-300 font-bold">{filteredAgendaList.length}</span> agenda pada <span className="text-white font-mono">{selectedDate}</span>
              </span>

              <button
                type="button"
                onClick={handleExportPDF}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Agenda Cards / Table */}
          <div className="space-y-3">
            {filteredAgendaList.length > 0 ? (
              filteredAgendaList.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        item.kategori.includes('Home Visit') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        item.kategori.includes('Konseling') ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}>
                        {item.kategori}
                      </span>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'Terlaksana' ? 'bg-emerald-500/20 text-emerald-300' :
                        item.status === 'Rencana' ? 'bg-indigo-500/20 text-indigo-300' :
                        'bg-rose-500/20 text-rose-300'
                      }`}>
                        {item.status}
                      </span>

                      <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {item.jam || '09:00'} WITA
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">
                      {item.namaSiswa ? `${item.namaSiswa} (${item.kelas})` : 'Agenda Umum BK'}
                    </h4>

                    <p className="text-xs text-slate-300 leading-relaxed">{item.keterangan}</p>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-400" />
                      <span>{item.lokasi || 'Ruang BK'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400"
                      title="Edit Agenda"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400"
                      title="Hapus Agenda"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                Tidak ada agenda BK pada tanggal {selectedDate}.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Add / Edit Agenda */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0B1B47] border border-slate-700 text-slate-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-amber-400" />
                <span>{editingItem ? 'Edit Agenda BK' : 'Tambah Agenda / Sesi BK & Home Visit'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-300 font-bold mb-1 uppercase text-[11px]">TANGGAL AGENDA</label>
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-amber-300 font-bold mb-1 uppercase text-[11px]">JAM KEGIATAN</label>
                  <input
                    type="time"
                    value={formJam}
                    onChange={(e) => setFormJam(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-amber-300 font-bold mb-1 uppercase text-[11px]">KATEGORI AGENDA</label>
                <select
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value as KategoriAgendaBK)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold cursor-pointer mb-1.5"
                >
                  <option value="Sesi Konseling Individu">Sesi Konseling Individu</option>
                  <option value="Konseling Kelompok">Konseling Kelompok</option>
                  <option value="Kunjungan Rumah (Home Visit)">Kunjungan Rumah (Home Visit)</option>
                  <option value="Konferensi Kasus">Konferensi Kasus</option>
                  <option value="Bimbingan Karir & Klasikal">Bimbingan Karir & Klasikal</option>
                </select>
                <input
                  type="text"
                  placeholder="Atau ketik kategori agenda secara manual..."
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value as KategoriAgendaBK)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-amber-400/60"
                />
              </div>

              {/* Class & Student Selection (Strictly Filtered) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-300 font-bold mb-1 uppercase text-[11px]">KELAS SISWA</label>
                  <select
                    value={formKelas}
                    onChange={(e) => handleClassChangeInForm(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white cursor-pointer mb-1.5"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {availableClasses.map(k => (
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

                <div>
                  <label className="block text-amber-300 font-bold mb-1 uppercase text-[11px]">NAMA SISWA</label>
                  <select
                    value={formSiswaId}
                    onChange={(e) => handleSelectSiswa(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white cursor-pointer mb-1.5"
                  >
                    <option value="">
                      {modalStudentList.length > 0 ? `-- Pilih Siswa (${modalStudentList.length}) --` : '-- Pilih Kelas Dulu --'}
                    </option>
                    {modalStudentList.map(s => (
                      <option key={s.id} value={s.id}>{s.nama}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Atau ketik nama siswa secara manual..."
                    value={formNamaSiswa}
                    onChange={(e) => setFormNamaSiswa(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-400/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-amber-300 font-bold mb-1 uppercase text-[11px]">LOKASI / TEMPAT</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) setFormLokasi(e.target.value);
                  }}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white mb-1.5 cursor-pointer font-bold"
                >
                  <option value="">-- Pilih Lokasi Preset (Opsional) --</option>
                  <option value="Ruang Bimbingan Konseling (BK)">Ruang Bimbingan Konseling (BK)</option>
                  <option value="Rumah Kediaman Orang Tua Siswa (Home Visit)">Rumah Kediaman Orang Tua Siswa (Home Visit)</option>
                  <option value="Ruang Kelas Siswa">Ruang Kelas Siswa</option>
                  <option value="Ruang Kepala Sekolah / Guru">Ruang Kepala Sekolah / Guru</option>
                  <option value="Musholla / Masjid Sekolah">Musholla / Masjid Sekolah</option>
                  <option value="Lapangan / Halaman Sekolah">Lapangan / Halaman Sekolah</option>
                </select>
                <input
                  type="text"
                  value={formLokasi}
                  onChange={(e) => setFormLokasi(e.target.value)}
                  placeholder="Atau ketik lokasi/tempat secara manual..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-amber-300 font-bold mb-1 uppercase text-[11px]">KETERANGAN / TUJUAN SESI</label>
                <textarea
                  rows={2}
                  required
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="Rincian tujuan agenda BK atau kunjungan..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-300 font-bold mb-1 uppercase text-[11px]">STATUS AGENDA</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold cursor-pointer mb-1.5"
                  >
                    <option value="Rencana">Rencana</option>
                    <option value="Terlaksana">Terlaksana</option>
                    <option value="Dijadwalkan Ulang">Dijadwalkan Ulang</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Atau ketik status agenda secara manual..."
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-amber-400/60"
                  />
                </div>

                <div>
                  <label className="block text-amber-300 font-bold mb-1 uppercase text-[11px]">GURU BK / KONSELOR</label>
                  <input
                    type="text"
                    value={formGuruBK}
                    onChange={(e) => setFormGuruBK(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

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
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
