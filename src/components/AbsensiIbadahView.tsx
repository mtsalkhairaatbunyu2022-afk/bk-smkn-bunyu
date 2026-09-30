import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  Search,
  BookOpen,
  Heart
} from 'lucide-react';
import { Siswa, AbsensiIbadah, StatusAbsensi, JenisIbadah } from '../types';
import { MiniCalendar, CalendarEventMarker } from './MiniCalendar';
import { exportIbadahPDF } from '../utils/pdfUtils';
import { useConfirm } from '../context/ConfirmContext';

interface AbsensiIbadahViewProps {
  siswaList: Siswa[];
  ibadahList: AbsensiIbadah[];
  onSaveIbadahBatch: (items: AbsensiIbadah[]) => void;
  onDeleteIbadah?: (id: string) => void;
}

export function AbsensiIbadahView({
  siswaList,
  ibadahList,
  onSaveIbadahBatch
}: AbsensiIbadahViewProps) {
  const { confirmAction } = useConfirm();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedIbadah, setSelectedIbadah] = useState<JenisIbadah>('Jumat IMTAQ & Doa');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Available Classes
  const availableClasses = useMemo(() => {
    return Array.from(new Set(siswaList.map(s => (s.kelas || '').trim()).filter(Boolean))).sort();
  }, [siswaList]);

  // Set default class if not set
  React.useEffect(() => {
    if (!selectedKelas && availableClasses.length > 0) {
      setSelectedKelas(availableClasses[0]);
    }
  }, [availableClasses, selectedKelas]);

  // Students in selected class
  const classStudents = useMemo(() => {
    if (!selectedKelas) return [];
    return siswaList.filter(s => (s.kelas || '').trim().toLowerCase() === selectedKelas.trim().toLowerCase());
  }, [siswaList, selectedKelas]);

  // Local State for Attendance Entry
  const [attendanceState, setAttendanceState] = useState<Record<string, { status: StatusAbsensi; catatan: string }>>({});

  // Sync attendance state when date, class, or ibadah type changes
  React.useEffect(() => {
    const map: Record<string, { status: StatusAbsensi; catatan: string }> = {};
    classStudents.forEach(s => {
      const match = ibadahList.find(
        a => a.siswaId === s.id && a.tanggal === selectedDate && a.jenisIbadah === selectedIbadah
      );
      map[s.id] = {
        status: match ? match.status : 'Hadir',
        catatan: match?.catatan || ''
      };
    });
    setAttendanceState(map);
  }, [selectedDate, selectedIbadah, selectedKelas, classStudents, ibadahList]);

  // Calendar Event Markers for Days with Worship Records
  const calendarEventMarkers = useMemo(() => {
    const dateMap: Record<string, number> = {};
    ibadahList.forEach(item => {
      dateMap[item.tanggal] = (dateMap[item.tanggal] || 0) + 1;
    });

    return Object.entries(dateMap).map(([date, count]) => ({
      date,
      count,
      type: 'ibadah' as const,
      label: `${count} Catatan Absensi Ibadah`
    }));
  }, [ibadahList]);

  // Filtered Students for Table Search
  const filteredStudents = useMemo(() => {
    return classStudents.filter(s =>
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nomor.includes(searchTerm)
    );
  }, [classStudents, searchTerm]);

  // Quick Set All Status
  const handleMarkAll = (status: StatusAbsensi) => {
    const updated: Record<string, { status: StatusAbsensi; catatan: string }> = {};
    classStudents.forEach(s => {
      updated[s.id] = {
        status,
        catatan: attendanceState[s.id]?.catatan || ''
      };
    });
    setAttendanceState(updated);
  };

  // Save Batch Attendance
  const handleSaveAttendance = async () => {
    if (!selectedKelas) {
      alert('Pilih kelas terlebih dahulu.');
      return;
    }

    const confirmed = await confirmAction({
      title: 'Konfirmasi Simpan Absensi Ibadah',
      message: `Apakah Anda yakin ingin menyimpan absensi ibadah ${selectedIbadah} untuk Kelas ${selectedKelas} tanggal ${selectedDate}?`,
      type: 'save',
      confirmText: 'Ya, Simpan'
    });
    if (!confirmed) return;

    const itemsToSave: AbsensiIbadah[] = classStudents.map(s => {
      const record = attendanceState[s.id] || { status: 'Hadir', catatan: '' };
      return {
        id: `ibd-${selectedDate}-${selectedIbadah.replace(/[^a-zA-Z0-9]/g, '_')}-${s.id}`,
        tanggal: selectedDate,
        jenisIbadah: selectedIbadah,
        siswaId: s.id,
        namaSiswa: s.nama,
        kelas: s.kelas,
        status: record.status,
        catatan: record.catatan
      };
    });

    onSaveIbadahBatch(itemsToSave);
  };

  // Export PDF Handler
  const handleExportPDF = async () => {
    const confirmed = await confirmAction({
      title: 'Konfirmasi Unduh PDF Absensi Ibadah',
      message: `Apakah Anda yakin ingin mengunduh laporan PDF absensi ibadah ${selectedIbadah} Kelas ${selectedKelas}?`,
      type: 'download',
      confirmText: 'Ya, Unduh PDF'
    });
    if (!confirmed) return;

    const records = classStudents.map((s) => {
      const rec = attendanceState[s.id] || { status: 'Hadir', catatan: '' };
      return {
        namaSiswa: s.nama,
        kelas: s.kelas,
        tanggal: selectedDate,
        jenisIbadah: selectedIbadah,
        status: rec.status,
        catatan: rec.catatan
      };
    });

    exportIbadahPDF(records, `Kelas ${selectedKelas} - ${selectedDate}`);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-[#0B1B47] border border-emerald-800/40 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs tracking-wider uppercase mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Pembinaan Karakter & Relijius SMKN 1 Bunyu</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Absensi Ibadah & Kegiatan IMTAQ Siswa
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Pencatatan kehadiran siswa dalam Sholat Dzuhur berjamaah, IMTAQ Jumat pagi, Doa bersama, serta kegiatan keagamaan sekolah.
            </p>
          </div>
        </div>
      </div>

      {/* Grid Layout: Left Mini Calendar & Right Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Mini Calendar Widget */}
        <div className="space-y-4">
          <MiniCalendar
            title="Mini Kalender Ibadah"
            selectedDate={selectedDate}
            onSelectDate={(d) => setSelectedDate(d)}
            events={calendarEventMarkers}
          />

          {/* Quick Date & Info Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-xs space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 font-bold border-b border-slate-800 pb-2">
              <span>TANGGAL TERPILIH</span>
              <span className="text-amber-300 font-mono text-sm">{selectedDate}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Klik tanggal mana saja pada mini kalender di atas untuk melihat atau mencatat absensi ibadah pada hari tersebut.
            </p>
          </div>
        </div>

        {/* Right Column: Attendance Form & Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controls Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Jenis Ibadah */}
              <div>
                <label className="block text-emerald-400 font-bold mb-1 uppercase text-[11px]">KEGIATAN IBADAH / IMTAQ</label>
                <select
                  value={selectedIbadah}
                  onChange={(e) => setSelectedIbadah(e.target.value as JenisIbadah)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-400 cursor-pointer mb-1.5"
                >
                  <option value="Jumat IMTAQ & Doa">Jumat IMTAQ & Doa (Yasinan)</option>
                  <option value="Sholat Dzuhur Berjamaah">Sholat Dzuhur Berjamaah</option>
                  <option value="Sholat Ashar Berjamaah">Sholat Ashar Berjamaah</option>
                  <option value="Kultum / Siraman Rohani">Kultum / Siraman Rohani</option>
                  <option value="Kegiatan Keagamaan">Kegiatan Keagamaan Lainnya</option>
                </select>
                <input
                  type="text"
                  placeholder="Atau ketik nama kegiatan ibadah secara manual..."
                  value={selectedIbadah}
                  onChange={(e) => setSelectedIbadah(e.target.value as JenisIbadah)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-emerald-400/60"
                />
              </div>

              {/* Kelas */}
              <div>
                <label className="block text-emerald-400 font-bold mb-1 uppercase text-[11px]">KELAS SISWA</label>
                <select
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-400 cursor-pointer mb-1.5"
                >
                  {availableClasses.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Atau ketik kelas secara manual..."
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-emerald-400/60"
                />
              </div>
            </div>

            {/* Quick Actions & Search */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 mr-1">Tandai Semua:</span>
                <button
                  type="button"
                  onClick={() => handleMarkAll('Hadir')}
                  className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold"
                >
                  Hadir
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('Sakit')}
                  className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-bold"
                >
                  Sakit
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('Izin')}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold"
                >
                  Izin
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('Alpha')}
                  className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-bold"
                >
                  Alpha
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Absensi Ibadah</span>
                </button>
              </div>
            </div>
          </div>

          {/* Student Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-extrabold text-white">
                Daftar Siswa Kelas <span className="text-emerald-400">{selectedKelas}</span> ({filteredStudents.length} Siswa)
              </span>

              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari siswa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[480px]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4 text-center w-10">NO</th>
                    <th className="py-3 px-4">NAMA SISWA</th>
                    <th className="py-3 px-4 text-center">STATUS KEHADIRAN IBADAH</th>
                    <th className="py-3 px-4">CATATAN KHUSUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((siswa, idx) => {
                      const current = attendanceState[siswa.id] || { status: 'Hadir', catatan: '' };

                      return (
                        <tr key={siswa.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-4 font-bold text-white">{siswa.nama}</td>
                          <td className="py-2.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                              {(['Hadir', 'Sakit', 'Izin', 'Alpha'] as StatusAbsensi[]).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => {
                                    setAttendanceState(prev => ({
                                      ...prev,
                                      [siswa.id]: {
                                        status: st,
                                        catatan: prev[siswa.id]?.catatan || ''
                                      }
                                    }));
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                    current.status === st
                                      ? st === 'Hadir'
                                        ? 'bg-emerald-500 text-slate-950 shadow'
                                        : st === 'Sakit'
                                        ? 'bg-blue-500 text-white shadow'
                                        : st === 'Izin'
                                        ? 'bg-amber-400 text-slate-950 shadow'
                                        : 'bg-rose-500 text-white shadow'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 px-4">
                            <input
                              type="text"
                              placeholder="Catatan keikutsertaan..."
                              value={current.catatan}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAttendanceState(prev => ({
                                  ...prev,
                                  [siswa.id]: {
                                    status: prev[siswa.id]?.status || 'Hadir',
                                    catatan: val
                                  }
                                }));
                              }}
                              className="w-full p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-400/60"
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-500">
                        Tidak ada siswa pada kelas {selectedKelas}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
