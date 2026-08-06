import React, { useState, useMemo } from 'react';
import { HeartHandshake, Plus, Edit2, Trash2, Printer, Search, X, Check, FileText } from 'lucide-react';
import { Siswa, Konseling, StatusKonseling } from '../types';
import { printKonselingPDF } from '../utils/pdfUtils';

interface KonselingViewProps {
  siswaList: Siswa[];
  konselingList: Konseling[];
  onAddKonseling: (item: Konseling) => void;
  onUpdateKonseling: (item: Konseling) => void;
  onDeleteKonseling: (id: string) => void;
}

export const KonselingView: React.FC<KonselingViewProps> = ({
  siswaList,
  konselingList,
  onAddKonseling,
  onUpdateKonseling,
  onDeleteKonseling
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Konseling | null>(null);

  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [formSiswaId, setFormSiswaId] = useState('');
  const [formNamaSiswa, setFormNamaSiswa] = useState('');
  const [formKelas, setFormKelas] = useState('');
  const [formPermasalahan, setFormPermasalahan] = useState('');
  const [formTindakLanjut, setFormTindakLanjut] = useState('');
  const [formStatusPenyelesaian, setFormStatusPenyelesaian] = useState<StatusKonseling>('Proses');
  const [formGuruBK, setFormGuruBK] = useState('Drs. H. M. Syarif, M.Pd');

  const filteredList = useMemo(() => {
    return konselingList.filter(k => {
      const matchSearch = k.namaSiswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.permasalahan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.kelas.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = !statusFilter || k.statusPenyelesaian === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [konselingList, searchTerm, statusFilter]);

  const handleSelectSiswa = (siswaId: string) => {
    setFormSiswaId(siswaId);
    const s = siswaList.find(x => x.id === siswaId);
    if (s) {
      setFormNamaSiswa(s.nama);
      setFormKelas(s.kelas);
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormTanggal(new Date().toISOString().split('T')[0]);
    if (siswaList.length > 0) {
      setFormSiswaId(siswaList[0].id);
      setFormNamaSiswa(siswaList[0].nama);
      setFormKelas(siswaList[0].kelas);
    } else {
      setFormSiswaId('');
      setFormNamaSiswa('');
      setFormKelas('');
    }
    setFormPermasalahan('');
    setFormTindakLanjut('');
    setFormStatusPenyelesaian('Proses');
    setFormGuruBK('Drs. H. M. Syarif, M.Pd');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Konseling) => {
    setEditingItem(item);
    setFormTanggal(item.tanggal);
    setFormSiswaId(item.siswaId);
    setFormNamaSiswa(item.namaSiswa);
    setFormKelas(item.kelas);
    setFormPermasalahan(item.permasalahan);
    setFormTindakLanjut(item.tindakLanjut);
    setFormStatusPenyelesaian(item.statusPenyelesaian);
    setFormGuruBK(item.guruBK);
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaSiswa.trim() || !formPermasalahan.trim()) return;

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
        guruBK: formGuruBK
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
        guruBK: formGuruBK
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
            <HeartHandshake className="w-6 h-6 text-amber-400" />
            Layanan Bimbingan Konseling
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Catatan sesi konseling individual & kelompok siswa SMKN 1 Bunyu.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition-all flex items-center gap-2 shadow-lg shadow-amber-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Layanan BK</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama siswa atau permasalahan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400/60"
          >
            <option value="">PILIH SALAH SATU</option>
            <option value="Proses">Proses</option>
            <option value="Selesai">Selesai</option>
            <option value="Rujukan">Rujukan</option>
            <option value="Pemantauan">Pemantauan</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">NO</th>
                <th className="py-3.5 px-4">TANGGAL</th>
                <th className="py-3.5 px-4">NAMA SISWA / KELAS</th>
                <th className="py-3.5 px-4">PERMASALAHAN</th>
                <th className="py-3.5 px-4">TINDAK LANJUT</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
                <th className="py-3.5 px-4 text-center w-28">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredList.length > 0 ? (
                filteredList.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-slate-500">{index + 1}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{item.tanggal}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">{item.namaSiswa}</p>
                      <span className="text-[10px] text-amber-300 font-semibold">{item.kelas}</span>
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-200">{item.permasalahan}</td>
                    <td className="py-3 px-4 max-w-xs text-slate-400">{item.tindakLanjut}</td>
                    <td className="py-3 px-4 text-center">
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
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => printKonselingPDF(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400"
                          title="Cetak Kartu PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus layanan konseling untuk ${item.namaSiswa}?`)) onDeleteKonseling(item.id);
                          }}
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
          <div className="bg-[#0B1B47] border border-slate-700 text-slate-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
              <h3 className="text-sm font-bold text-white">
                {editingItem ? 'Edit Sesi Konseling' : 'Tambah Layanan Konseling Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tanggal Konseling</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nama Siswa</label>
                  <input
                    type="text"
                    required
                    value={formNamaSiswa}
                    onChange={(e) => setFormNamaSiswa(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kelas</label>
                  <input
                    type="text"
                    required
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Permasalahan Siswa</label>
                <textarea
                  required
                  rows={3}
                  value={formPermasalahan}
                  onChange={(e) => setFormPermasalahan(e.target.value)}
                  placeholder="Uraikan keluhan / permasalahan..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tindak Lanjut & Solusi BK</label>
                <textarea
                  required
                  rows={3}
                  value={formTindakLanjut}
                  onChange={(e) => setFormTindakLanjut(e.target.value)}
                  placeholder="Rekomendasi / tindakan..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status Penyelesaian</label>
                  <select
                    value={formStatusPenyelesaian}
                    onChange={(e) => setFormStatusPenyelesaian(e.target.value as StatusKonseling)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                  >
                    <option value="" disabled hidden>PILIH SALAH SATU</option>
                    <option value="Proses">Proses</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Pemantauan">Pemantauan</option>
                    <option value="Rujukan">Rujukan / Alih Tangan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Guru Konselor BK</label>
                  <input
                    type="text"
                    required
                    value={formGuruBK}
                    onChange={(e) => setFormGuruBK(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white"
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
                  Simpan Layanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
