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

export type StatusAbsensi = 'Hadir' | 'Sakit' | 'Izin' | 'Alpha';

export interface Absensi {
  id: string;
  tanggal: string; // YYYY-MM-DD
  siswaId: string;
  namaSiswa: string;
  kelas: string;
  status: StatusAbsensi;
  catatan?: string;
}

export type StatusKonseling = 'Proses' | 'Selesai' | 'Rujukan' | 'Pemantauan';

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

export interface AppDatabase {
  siswa: Siswa[];
  absensi: Absensi[];
  konseling: Konseling[];
  jurnal: JurnalHarian[];
  penilaian: PenilaianHarian[];
  version: string;
  exportedAt?: string;
}

export type ActiveTab = 'dashboard' | 'siswa' | 'absensi' | 'konseling' | 'jurnal' | 'penilaian';
