export type Gender = 'L' | 'P';

export interface Siswa {
  id: string;
  nomor: string; // NIS / NISN
  nama: string;
  kelas: string;
  jurusan: string;
  jenisKelamin?: Gender;
  noHp?: string;
  namaWali?: string;
  createdAt?: string;
}

export type StatusAbsensi = 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' | 'Terlambat';

export interface Absensi {
  id: string;
  tanggal: string; // YYYY-MM-DD
  siswaId: string;
  namaSiswa: string;
  kelas: string;
  status: StatusAbsensi;
  catatan?: string;
}

export type StatusKonseling = string;

export interface Konseling {
  id: string;
  tanggal: string; // YYYY-MM-DD
  siswaId: string;
  namaSiswa: string;
  kelas: string;
  permasalahan: string;
  tindakLanjut: string;
  statusPenyelesaian: StatusKonseling;
  guruBK: string;
  fotoDokumentasi?: string; // Base64 image URL (camera / gallery)
}

export interface JurnalHarian {
  id: string;
  tanggal: string; // YYYY-MM-DD
  aktivitas: string;
  catatan: string;
  guruBK: string;
}

export interface PenilaianHarian {
  id: string;
  tanggal: string; // YYYY-MM-DD
  siswaId: string;
  namaSiswa: string;
  kelas: string;
  mataPelajaran: string;
  nilai: number; // 0 - 100
  keterangan: string;
}

export interface TataTertibDocument {
  id: string;
  fileName: string;
  fileData: string; // Base64 data URI
  uploadedAt: string;
  fileSizeFormatted?: string;
  extractedText?: string;
}

export type JenisIbadah = 'Sholat Dzuhur Berjamaah' | 'Jumat IMTAQ & Doa' | 'Sholat Ashar Berjamaah' | 'Kultum / Siraman Rohani' | 'Kegiatan Keagamaan';

export interface AbsensiIbadah {
  id: string;
  tanggal: string; // YYYY-MM-DD
  jenisIbadah: JenisIbadah;
  siswaId: string;
  namaSiswa: string;
  kelas: string;
  status: StatusAbsensi;
  catatan?: string;
}

export type KategoriAgendaBK = 'Sesi Konseling Individu' | 'Konseling Kelompok' | 'Kunjungan Rumah (Home Visit)' | 'Konferensi Kasus' | 'Bimbingan Karir & Klasikal';

export interface AgendaBK {
  id: string;
  tanggal: string; // YYYY-MM-DD
  jam?: string; // HH:mm
  kategori: KategoriAgendaBK;
  siswaId?: string;
  namaSiswa?: string;
  kelas?: string;
  keterangan: string;
  lokasi?: string;
  status: 'Rencana' | 'Terlaksana' | 'Dibatalkan' | 'Dijadwalkan Ulang';
  guruBK: string;
}

export interface AppDatabase {
  siswa: Siswa[];
  absensi: Absensi[];
  konseling: Konseling[];
  jurnal: JurnalHarian[];
  penilaian: PenilaianHarian[];
  tataTertib: TataTertibDocument[];
  kolaborasi?: KolaborasiGuru[];
  absensiIbadah?: AbsensiIbadah[];
  agendaBK?: AgendaBK[];
  version: string;
  exportedAt?: string;
}

export type StatusKolaborasi = 'Dalam Proses' | 'Solusi Disepakati' | 'Selesai' | 'Tindak Lanjut';

export interface KolaborasiGuru {
  id: string;
  tanggal: string; // YYYY-MM-DD
  siswaId: string;
  namaSiswa: string;
  kelas: string;
  mitraKolaborasi: string; // Wali Kelas, Guru Mapel, Guru Piket, Wakasek Kesiswaan, Kaprog
  namaRekanGuru: string; // Nama Rekan Guru yang Berkolaborasi
  bentukKolaborasi: string; // Konferensi Kasus, Home Visit Bersama, Pendampingan Belajar, dll.
  permasalahan: string;
  rencanaSolusi: string;
  statusPenyelesaian: StatusKolaborasi;
  guruBK: string;
  fotoDokumentasi?: string;
  createdAt?: string;
}

export type ActiveTab = 'dashboard' | 'tatatertib' | 'siswa' | 'absensi' | 'absensi_ibadah' | 'agenda_bk' | 'konseling' | 'jurnal' | 'kolaborasi' | 'penilaian' | 'konseling_xi_tpmg';
