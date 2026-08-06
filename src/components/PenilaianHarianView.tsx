import React, { useState, useMemo } from 'react';
import { Award, Plus, Edit2, Trash2, Download, Search, X } from 'lucide-react';
import { Siswa, PenilaianHarian } from '../types';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PenilaianHarian | null>(null);

  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [formSiswaId, setFormSiswaId] = useState('');
  const [formNamaSiswa, setFormNamaSiswa] = useState('');
  const [formKelas, setFormKelas] = useState('');
  const [formMataPelajaran, setFormMataPelajaran] = useState('Sikap & Kedisiplinan');
  const [formNilai, setFormNilai] = useState<number>(85);
  const [formKeterangan, setFormKeterangan] = useState('Baik');

  const availableClasses = useMemo(() => Array.from(new Set(siswaList.map(s => s.kelas))).sort(), [siswaList]);

  const filteredList = useMemo(() => {
    return penilaianList.filter(p => {
      const matchSearch = p.namaSiswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.mataPelajaran.toLowerCase().includes(searchTerm.toLowerCase());
      const matchKelas = !kelasFilter || p.kelas === kelasFilter;
      return matchSearch && matchKelas;
    });
  }, [penilaianList, searchTerm, kelasFilter]);

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
    if (siswaList.length > 0) {
      setFormSiswaId(siswaList[0].id);
      setFormNamaSiswa(siswaList[0].nama);
      setFormKelas(siswaList[0].kelas);
    }
    setFormMataPelajaran('Sikap & Kedisiplinan');
    setFormNilai(85);
    setFormKeterangan('Baik');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PenilaianHarian) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaSiswa.trim()) return;

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

        <div className="flex items-center gap-2">
          <button
            onClick={onExportExcel}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export Excel
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

      {/* Rata-Rata Otomatis Card & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-purple-300 uppercase block">RATA-RATA OTOMATIS</span>
            <span className="text-2xl font-black text-white">{averageGrade} / 100</span>
          </div>
          <Award className="w-8 h-8 text-purple-400 opacity-60" />
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama siswa atau aspek..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
          />
        </div>

        <div>
          <select
            value={kelasFilter}
            onChange={(e) => setKelasFilter(e.target.value)}
            className="w-full h-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400/60"
          >
            <option value="">PILIH SALAH SATU</option>
            {availableClasses.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
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
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus data nilai ini?`)) onDeletePenilaian(item.id);
                          }}
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
              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-slate-300 font-semibold mb-1">Pilih Siswa</label>
                  <select
                    value={formSiswaId}
                    onChange={(e) => handleSelectSiswa(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                  >
                    <option value="">PILIH SALAH SATU</option>
                    {siswaList.map(s => (
                      <option key={s.id} value={s.id}>{s.nama} ({s.kelas})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mata Pelajaran / Aspek Penilaian</label>
                <input
                  type="text"
                  required
                  value={formMataPelajaran}
                  onChange={(e) => setFormMataPelajaran(e.target.value)}
                  placeholder="Contoh: Sikap & Kedisiplinan..."
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
                  <input
                    type="text"
                    required
                    value={formKeterangan}
                    onChange={(e) => setFormKeterangan(e.target.value)}
                    placeholder="Contoh: Sangat Baik / Cukup"
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
