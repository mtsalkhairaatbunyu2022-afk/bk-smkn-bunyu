import React, { useState } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Printer, Search, X, Download, FileText } from 'lucide-react';
import { JurnalHarian } from '../types';
import { printJurnalPDF } from '../utils/pdfUtils';
import { exportJurnalExcel } from '../utils/excelUtils';
import { exportJurnalWord } from '../utils/wordUtils';

interface JurnalHarianViewProps {
  jurnalList: JurnalHarian[];
  onAddJurnal: (item: JurnalHarian) => void;
  onUpdateJurnal: (item: JurnalHarian) => void;
  onDeleteJurnal: (id: string) => void;
}

export const JurnalHarianView: React.FC<JurnalHarianViewProps> = ({
  jurnalList,
  onAddJurnal,
  onUpdateJurnal,
  onDeleteJurnal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JurnalHarian | null>(null);

  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [formAktivitas, setFormAktivitas] = useState('');
  const [formCatatan, setFormCatatan] = useState('');
  const [formGuruBK, setFormGuruBK] = useState('Drs. H. M. Syarif, M.Pd');

  const filteredList = jurnalList.filter(j => {
    const search = (searchTerm || '').toLowerCase();
    const matchSearch = (j.aktivitas || '').toLowerCase().includes(search) ||
      (j.catatan || '').toLowerCase().includes(search) ||
      (j.guruBK || '').toLowerCase().includes(search);
    const matchMonth = !monthFilter || (j.tanggal || '').startsWith(monthFilter);
    return matchSearch && matchMonth;
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormTanggal(new Date().toISOString().split('T')[0]);
    setFormAktivitas('');
    setFormCatatan('');
    setFormGuruBK('Drs. H. M. Syarif, M.Pd');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: JurnalHarian) => {
    setEditingItem(item);
    setFormTanggal(item.tanggal);
    setFormAktivitas(item.aktivitas);
    setFormCatatan(item.catatan);
    setFormGuruBK(item.guruBK);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAktivitas.trim()) return;

    if (editingItem) {
      onUpdateJurnal({
        ...editingItem,
        tanggal: formTanggal,
        aktivitas: formAktivitas,
        catatan: formCatatan,
        guruBK: formGuruBK
      });
    } else {
      onAddJurnal({
        id: `jr-${Date.now()}`,
        tanggal: formTanggal,
        aktivitas: formAktivitas,
        catatan: formCatatan,
        guruBK: formGuruBK
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            Jurnal Harian Guru BK
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pencatatan kegiatan harian layanan bimbingan & konseling sekolah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportJurnalExcel(filteredList)}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Unduh Jurnal Harian (Excel)"
          >
            <Download className="w-4 h-4" /> Unduh Excel
          </button>
          
          <button
            onClick={() => exportJurnalWord(filteredList)}
            className="px-3.5 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Unduh Jurnal Harian (Word)"
          >
            <FileText className="w-4 h-4 text-blue-400" /> Unduh Word
          </button>

          <button
            onClick={() => printJurnalPDF(jurnalList)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Cetak PDF
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition-all flex items-center gap-2 shadow-lg shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jurnal</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari aktivitas atau catatan jurnal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1">
          <label className="text-xs font-bold text-slate-400 shrink-0">Rekap Bulan:</label>
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400/60"
          />
          {monthFilter && (
            <button
              onClick={() => setMonthFilter('')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
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
                <th className="py-3.5 px-4">AKTIVITAS LAYANAN</th>
                <th className="py-3.5 px-4">CATATAN & EVALUASI</th>
                <th className="py-3.5 px-4">GURU BK</th>
                <th className="py-3.5 px-4 text-center w-24">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredList.length > 0 ? (
                filteredList.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-slate-500">{index + 1}</td>
                    <td className="py-3 px-4 font-mono text-amber-300">{item.tanggal}</td>
                    <td className="py-3 px-4 font-bold text-white max-w-xs">{item.aktivitas}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-sm">{item.catatan}</td>
                    <td className="py-3 px-4 text-slate-400 font-medium">{item.guruBK}</td>
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
                          onClick={() => onDeleteJurnal(item.id)}
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
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Belum ada jurnal harian recorded.
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
                {editingItem ? 'Edit Jurnal Harian' : 'Tambah Jurnal Harian'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
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
                <label className="block text-slate-300 font-semibold mb-1">Aktivitas / Kegiatan Layanan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bimbingan Klasikal Kelas X TKJ 1..."
                  value={formAktivitas}
                  onChange={(e) => setFormAktivitas(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Catatan & Hasil Evaluasi</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Uraian kegiatan..."
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                ></textarea>
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
                  Simpan Jurnal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
