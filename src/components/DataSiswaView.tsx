import React, { useState, useMemo } from 'react';
import { Users, Plus, Edit2, Trash2, Search, FileSpreadsheet, Upload, Download, X, Check, Filter } from 'lucide-react';
import { Siswa } from '../types';

interface DataSiswaViewProps {
  siswaList: Siswa[];
  onAddSiswa: (item: Siswa) => void;
  onUpdateSiswa: (item: Siswa) => void;
  onDeleteSiswa: (id: string) => void;
  onImportExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportExcel: () => void;
}

export const DataSiswaView: React.FC<DataSiswaViewProps> = ({
  siswaList,
  onAddSiswa,
  onUpdateSiswa,
  onDeleteSiswa,
  onImportExcel,
  onExportExcel
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');
  const [jurusanFilter, setJurusanFilter] = useState('');

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);

  const [formNomor, setFormNomor] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formKelas, setFormKelas] = useState('X TKJ 1');
  const [formJurusan, setFormJurusan] = useState('Teknik Komputer & Jaringan');
  const [formJenisKelamin, setFormJenisKelamin] = useState<'L' | 'P'>('L');
  const [formNoHp, setFormNoHp] = useState('');
  const [formNamaWali, setFormNamaWali] = useState('');

  // Extract unique classes and jurusans for filter select
  const availableClasses = useMemo(() => Array.from(new Set(siswaList.map(s => s.kelas))).sort(), [siswaList]);
  const availableJurusans = useMemo(() => Array.from(new Set(siswaList.map(s => s.jurusan))).sort(), [siswaList]);

  // Filtered Siswa List
  const filteredSiswa = useMemo(() => {
    return siswaList.filter(s => {
      const matchSearch = (s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nomor.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchKelas = !kelasFilter || s.kelas === kelasFilter;
      const matchJurusan = !jurusanFilter || s.jurusan === jurusanFilter;
      return matchSearch && matchKelas && matchJurusan;
    });
  }, [siswaList, searchTerm, kelasFilter, jurusanFilter]);

  const handleOpenAddModal = () => {
    setEditingSiswa(null);
    setFormNomor(`10${siswaList.length + 1}`);
    setFormNama('');
    setFormKelas('X TKJ 1');
    setFormJurusan('Teknik Komputer & Jaringan');
    setFormJenisKelamin('L');
    setFormNoHp('');
    setFormNamaWali('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Siswa) => {
    setEditingSiswa(item);
    setFormNomor(item.nomor);
    setFormNama(item.nama);
    setFormKelas(item.kelas);
    setFormJurusan(item.jurusan);
    setFormJenisKelamin(item.jenisKelamin || 'L');
    setFormNoHp(item.noHp || '');
    setFormNamaWali(item.namaWali || '');
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
        jurusan: formJurusan,
        jenisKelamin: formJenisKelamin,
        noHp: formNoHp,
        namaWali: formNamaWali
      });
    } else {
      onAddSiswa({
        id: `sw-${Date.now()}`,
        nomor: formNomor,
        nama: formNama,
        kelas: formKelas,
        jurusan: formJurusan,
        jenisKelamin: formJenisKelamin,
        noHp: formNoHp,
        namaWali: formNamaWali,
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
          {/* Import Excel */}
          <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Import Excel</span>
            <input type="file" accept=".xlsx, .xls" onChange={onImportExcel} className="hidden" />
          </label>

          {/* Export Excel */}
          <button
            onClick={onExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
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

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative col-span-1 sm:col-span-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama atau NIS siswa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
          />
        </div>

        {/* Filter Kelas */}
        <div>
          <select
            value={kelasFilter}
            onChange={(e) => setKelasFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400/60"
          >
            <option value="">Semua Kelas</option>
            {availableClasses.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        {/* Filter Jurusan */}
        <div>
          <select
            value={jurusanFilter}
            onChange={(e) => setJurusanFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400/60"
          >
            <option value="">Semua Jurusan</option>
            {availableJurusans.map(j => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">NO</th>
                <th className="py-3.5 px-4">NIS / NOMOR</th>
                <th className="py-3.5 px-4">NAMA SISWA</th>
                <th className="py-3.5 px-4">KELAS</th>
                <th className="py-3.5 px-4">JURUSAN</th>
                <th className="py-3.5 px-4">WALI / NO HP</th>
                <th className="py-3.5 px-4 text-center w-28">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSiswa.length > 0 ? (
                filteredSiswa.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-slate-500">{index + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-300">{item.nomor}</td>
                    <td className="py-3 px-4 font-bold text-white">
                      {item.nama}
                      <span className="ml-2 text-[10px] text-slate-500 font-normal">({item.jenisKelamin || 'L'})</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 font-semibold border border-blue-500/20">
                        {item.kelas}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{item.jurusan}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {item.namaWali ? `${item.namaWali} (${item.noHp || '-'})` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus data siswa ${item.nama}?`)) onDeleteSiswa(item.id);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition-colors"
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
                  <td colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                    Tidak ada data siswa ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kelas</label>
                  <input
                    type="text"
                    required
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                    placeholder="Contoh: X TKJ 1"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Jenis Kelamin</label>
                  <select
                    value={formJenisKelamin}
                    onChange={(e) => setFormJenisKelamin(e.target.value as 'L' | 'P')}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Jurusan</label>
                <input
                  type="text"
                  required
                  value={formJurusan}
                  onChange={(e) => setFormJurusan(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                  placeholder="Contoh: Teknik Komputer & Jaringan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nama Wali</label>
                  <input
                    type="text"
                    value={formNamaWali}
                    onChange={(e) => setFormNamaWali(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                    placeholder="Nama wali..."
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">No HP Wali</label>
                  <input
                    type="text"
                    value={formNoHp}
                    onChange={(e) => setFormNoHp(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                    placeholder="0812..."
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
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
