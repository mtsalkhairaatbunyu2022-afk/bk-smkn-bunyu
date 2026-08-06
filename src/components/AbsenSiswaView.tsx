import React, { useState, useMemo } from 'react';
import { Calendar, CheckCircle2, AlertCircle, Clock, XCircle, Download, Save, Filter, Trash2 } from 'lucide-react';
import { Siswa, Absensi, StatusAbsensi } from '../types';

interface AbsenSiswaViewProps {
  siswaList: Siswa[];
  absensiList: Absensi[];
  onSaveAbsensiBatch: (items: Absensi[]) => void;
  onDeleteAbsensi?: (id: string) => void;
  onExportExcel: () => void;
}

export const AbsenSiswaView: React.FC<AbsenSiswaViewProps> = ({
  siswaList,
  absensiList,
  onSaveAbsensiBatch,
  onDeleteAbsensi,
  onExportExcel
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedKelas, setSelectedKelas] = useState<string>('X TKJ 1');
  const [activeViewMode, setActiveViewMode] = useState<'input' | 'rekap-harian' | 'rekap-bulanan'>('input');

  // Available classes
  const availableClasses = useMemo(() => Array.from(new Set(siswaList.map(s => s.kelas))).sort(), [siswaList]);

  // Students in selected class
  const classStudents = useMemo(() => {
    return siswaList.filter(s => s.kelas === selectedKelas);
  }, [siswaList, selectedKelas]);

  // Local Attendance State for Batch Input
  const [currentAttendance, setCurrentAttendance] = useState<Record<string, { status: StatusAbsensi; catatan: string }>>({});

  // Sync attendance state when date or class changes
  React.useEffect(() => {
    const existingMap: Record<string, { status: StatusAbsensi; catatan: string }> = {};
    classStudents.forEach(s => {
      const match = absensiList.find(a => a.siswaId === s.id && a.tanggal === selectedDate);
      existingMap[s.id] = {
        status: match ? match.status : 'Hadir',
        catatan: match?.catatan || ''
      };
    });
    setCurrentAttendance(existingMap);
  }, [selectedDate, selectedKelas, classStudents, absensiList]);

  const handleStatusChange = (siswaId: string, status: StatusAbsensi) => {
    setCurrentAttendance(prev => ({
      ...prev,
      [siswaId]: { ...prev[siswaId], status }
    }));
  };

  const handleCatatanChange = (siswaId: string, catatan: string) => {
    setCurrentAttendance(prev => ({
      ...prev,
      [siswaId]: { ...prev[siswaId], catatan }
    }));
  };

  const handleSaveBatch = () => {
    const itemsToSave: Absensi[] = classStudents.map(s => {
      const state = currentAttendance[s.id] || { status: 'Hadir', catatan: '' };
      return {
        id: `ab-${selectedDate}-${s.id}`,
        tanggal: selectedDate,
        siswaId: s.id,
        namaSiswa: s.nama,
        kelas: s.kelas,
        status: state.status,
        catatan: state.catatan
      };
    });

    onSaveAbsensiBatch(itemsToSave);
    alert(`Absensi kelas ${selectedKelas} tanggal ${selectedDate} berhasil disimpan!`);
  };

  // Stats for current class & date
  const stats = useMemo(() => {
    const vals = Object.values(currentAttendance) as { status: StatusAbsensi; catatan: string }[];
    return {
      hadir: vals.filter(v => v?.status === 'Hadir').length,
      sakit: vals.filter(v => v?.status === 'Sakit').length,
      izin: vals.filter(v => v?.status === 'Izin').length,
      alpha: vals.filter(v => v?.status === 'Alpha').length,
    };
  }, [currentAttendance]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-emerald-400" />
            Absensi Siswa SMKN 1 Bunyu
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Sistem rekapitulasi harian & bulanan tingkat kehadiran siswa.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveViewMode('input')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeViewMode === 'input' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Input Absensi
          </button>
          <button
            onClick={() => setActiveViewMode('rekap-harian')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeViewMode === 'rekap-harian' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Rekap Harian
          </button>
          <button
            onClick={onExportExcel}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Pilih Tanggal</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400/60"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Filter Kelas</label>
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400/60"
          >
            <option value="">PILIH SALAH SATU</option>
            {availableClasses.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        {/* Status Counts */}
        <div className="flex items-center justify-around bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
          <div>
            <span className="text-[10px] text-emerald-400 font-bold block">HADIR</span>
            <span className="text-base font-extrabold text-white">{stats.hadir}</span>
          </div>
          <div>
            <span className="text-[10px] text-blue-400 font-bold block">SAKIT</span>
            <span className="text-base font-extrabold text-white">{stats.sakit}</span>
          </div>
          <div>
            <span className="text-[10px] text-amber-400 font-bold block">IZIN</span>
            <span className="text-base font-extrabold text-white">{stats.izin}</span>
          </div>
          <div>
            <span className="text-[10px] text-rose-400 font-bold block">ALPHA</span>
            <span className="text-base font-extrabold text-white">{stats.alpha}</span>
          </div>
        </div>
      </div>

      {/* Mode Input Absensi */}
      {activeViewMode === 'input' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white">
              Daftar Siswa Kelas <span className="text-amber-300">{selectedKelas}</span> ({classStudents.length} Siswa)
            </span>
            <button
              onClick={handleSaveBatch}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Absensi</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">NO</th>
                  <th className="py-3 px-4">NAMA SISWA</th>
                  <th className="py-3 px-4 text-center">STATUS KEHADIRAN</th>
                  <th className="py-3 px-4">CATATAN KHUSUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {classStudents.length > 0 ? (
                  classStudents.map((siswa, idx) => {
                    const st = currentAttendance[siswa.id] || { status: 'Hadir', catatan: '' };
                    return (
                      <tr key={siswa.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-white">
                          {siswa.nama}
                          <span className="block text-[10px] text-slate-500 font-mono">NIS: {siswa.nomor}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 gap-1">
                            {(['Hadir', 'Sakit', 'Izin', 'Alpha'] as StatusAbsensi[]).map((status) => {
                              const isActive = st.status === status;
                              let activeClass = 'bg-slate-800 text-slate-400';
                              if (isActive) {
                                if (status === 'Hadir') activeClass = 'bg-emerald-500 text-slate-950 font-extrabold';
                                if (status === 'Sakit') activeClass = 'bg-blue-500 text-white font-extrabold';
                                if (status === 'Izin') activeClass = 'bg-amber-400 text-slate-950 font-extrabold';
                                if (status === 'Alpha') activeClass = 'bg-rose-500 text-white font-extrabold';
                              }

                              return (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => handleStatusChange(siswa.id, status)}
                                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${activeClass}`}
                                >
                                  {status}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="Keterangan / Catatan..."
                            value={st.catatan}
                            onChange={(e) => handleCatatanChange(siswa.id, e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/60"
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-500">
                      Tidak ada siswa terdaftar pada kelas {selectedKelas}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rekap Harian */}
      {activeViewMode === 'rekap-harian' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">
            Rekap Absensi Semua Kelas — Tanggal {selectedDate}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">NO</th>
                  <th className="py-3 px-4">NAMA SISWA</th>
                  <th className="py-3 px-4">KELAS</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">CATATAN</th>
                  <th className="py-3 px-4 text-center w-20">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {absensiList.filter(a => a.tanggal === selectedDate).length > 0 ? (
                  absensiList.filter(a => a.tanggal === selectedDate).map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-white">{item.namaSiswa}</td>
                      <td className="py-3 px-4 text-amber-300 font-semibold">{item.kelas}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          item.status === 'Hadir' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          item.status === 'Sakit' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          item.status === 'Izin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{item.catatan || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`Hapus data absensi ${item.namaSiswa}?`)) {
                              onDeleteAbsensi?.(item.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Hapus Absensi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      Belum ada data absensi tercatat pada tanggal {selectedDate}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
