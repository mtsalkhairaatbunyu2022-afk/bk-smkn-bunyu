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

export interface AppDatabase {
  siswa: Siswa[];
  absensi: Absensi[];
  konseling: Konseling[];
  jurnal: JurnalHarian[];
  penilaian: PenilaianHarian[];
  tataTertib: TataTertibDocument[];
  version: string;
  exportedAt?: string;
}

export type ActiveTab = 'dashboard' | 'tatatertib' | 'siswa' | 'absensi' | 'konseling' | 'jurnal' | 'konseling_xi_tpmg' | 'penilaian';
