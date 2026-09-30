import React from 'react';
import { Users, Calendar, HeartHandshake, BookOpen, Award, ArrowRight, Activity, TrendingUp, CheckCircle, Shield, FileText, UserCheck, CalendarDays, Sparkles } from 'lucide-react';
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

          <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto shrink-0">
            <button
              onClick={() => onNavigate('agenda_bk')}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl font-bold text-xs bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Agenda BK & Kalender</span>
            </button>
            <button
              onClick={() => onNavigate('absensi_ibadah')}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500/80 hover:bg-emerald-500 text-white border border-emerald-400/40 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Absensi Ibadah</span>
            </button>
            <button
              onClick={() => onNavigate('kolaborasi')}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl font-bold text-xs bg-indigo-500/80 hover:bg-indigo-500 text-white border border-indigo-400/40 transition-all flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-indigo-300" />
              <span>Kolaborasi Guru</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
