import React from 'react';
import { Users, Calendar, HeartHandshake, BookOpen, Award, ArrowRight, Activity, TrendingUp, CheckCircle, Shield, FileText } from 'lucide-react';
import { Siswa, Absensi, Konseling, JurnalHarian, PenilaianHarian, ActiveTab } from '../types';

interface DashboardViewProps {
  siswa: Siswa[];
  absensi: Absensi[];
  konseling: Konseling[];
  jurnal: JurnalHarian[];
  penilaian: PenilaianHarian[];
  onNavigate: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  siswa,
  absensi,
  konseling,
  jurnal,
  penilaian,
  onNavigate
}) => {
  // Stats Calculations
  const totalSiswa = siswa.length;
  const totalAbsensi = absensi.length;
  const totalKonseling = konseling.length;
  const totalJurnal = jurnal.length;
  const totalPenilaian = penilaian.length;

  const hadirCount = absensi.filter(a => a.status === 'Hadir').length;
  const attendanceRate = totalAbsensi > 0 ? Math.round((hadirCount / totalAbsensi) * 100) : 100;

  const konselingSelesai = konseling.filter(k => k.statusPenyelesaian === 'Selesai').length;
  const konselingProses = konseling.filter(k => k.statusPenyelesaian === 'Proses').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B1B47] via-[#102A6B] to-[#17388C] p-6 sm:p-8 text-white border border-amber-400/30 shadow-xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 p-2.5 border border-amber-400/40 shadow-inner flex items-center justify-center shrink-0">
              <img src="/logo-konselor.svg" alt="Logo Konselor" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 inline-block mb-1.5">
                SMK NEGERI 1 BUNYU
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Sistem Informasi BK Terpadu
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Selamat datang di Dashboard Layanan Bimbingan & Konseling SMK Negeri 1 Bunyu. Pengelolaan data terintegrasi & offline-ready.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-stretch sm:self-auto shrink-0">
            <button
              onClick={() => onNavigate('konseling')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Input Konseling</span>
            </button>
            <button
              onClick={() => onNavigate('absensi')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-slate-600 transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Rekap Absensi</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 Main Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Siswa */}
        <div
          onClick={() => onNavigate('siswa')}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-400/40 transition-all cursor-pointer group shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{totalSiswa}</p>
          <p className="text-xs font-semibold text-slate-400 mt-1">Total Siswa Terdaftar</p>
        </div>

        {/* Total Absensi */}
        <div
          onClick={() => onNavigate('absensi')}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-400/40 transition-all cursor-pointer group shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{totalAbsensi}</p>
          <p className="text-xs font-semibold text-slate-400 mt-1">Total Catatan Absensi</p>
        </div>

        {/* Total Konseling */}
        <div
          onClick={() => onNavigate('konseling')}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-400/40 transition-all cursor-pointer group shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{totalKonseling}</p>
          <p className="text-xs font-semibold text-slate-400 mt-1">Total Sesi Konseling</p>
        </div>

        {/* Total Jurnal */}
        <div
          onClick={() => onNavigate('jurnal')}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-400/40 transition-all cursor-pointer group shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{totalJurnal}</p>
          <p className="text-xs font-semibold text-slate-400 mt-1">Total Jurnal Harian BK</p>
        </div>

        {/* Total Penilaian */}
        <div
          onClick={() => onNavigate('penilaian')}
          className="col-span-2 lg:col-span-1 p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-400/40 transition-all cursor-pointer group shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{totalPenilaian}</p>
          <p className="text-xs font-semibold text-slate-400 mt-1">Total Penilaian Sikap</p>
        </div>
      </div>

      {/* Grid Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Konseling Active Status Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-amber-400" />
                Status Konseling Siswa
              </h3>
              <span className="text-[11px] text-slate-400">Kasus Terdaftar</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-emerald-300 font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Selesai / Tuntas
                </span>
                <span className="font-extrabold text-white text-sm">{konselingSelesai}</span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-amber-300 font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400 animate-spin" /> Dalam Proses / Pemantauan
                </span>
                <span className="font-extrabold text-white text-sm">{konselingProses}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('konseling')}
            className="mt-6 w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Kelola Konseling</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Kehadiran Summary */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Tingkat Kehadiran Siswa
              </h3>
              <span className="text-xs font-bold text-emerald-400">{attendanceRate}%</span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-3 mb-4 p-0.5 border border-slate-700">
              <div
                className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${attendanceRate}%` }}
              ></div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Persentase siswa hadir berdasarkan {totalAbsensi} rekap absensi yang tercatat pada sistem.
            </p>
          </div>

          <button
            onClick={() => onNavigate('absensi')}
            className="mt-6 w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-300 border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Buka Rekap Absensi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Recent Jurnal Activity */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Jurnal Terbaru
              </h3>
              <span className="text-[11px] text-slate-400">{jurnal.length} Catatan</span>
            </div>

            {jurnal.length > 0 ? (
              <div className="space-y-2">
                {jurnal.slice(0, 2).map((j) => (
                  <div key={j.id} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                    <p className="text-xs font-bold text-amber-300 line-clamp-1">{j.aktivitas}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{j.catatan}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">{j.tanggal} • {j.guruBK}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">Belum ada jurnal harian recorded.</p>
            )}
          </div>

          <button
            onClick={() => onNavigate('jurnal')}
            className="mt-4 w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-indigo-300 border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Buka Jurnal Harian</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
