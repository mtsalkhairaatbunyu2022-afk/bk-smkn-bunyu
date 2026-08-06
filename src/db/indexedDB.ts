import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Siswa, Absensi, Konseling, JurnalHarian, PenilaianHarian, AppDatabase } from '../types';

interface BKSchema extends DBSchema {
  siswa: {
    key: string;
    value: Siswa;
    indexes: { 'by-kelas': string; 'by-nama': string };
  };
  absensi: {
    key: string;
    value: Absensi;
    indexes: { 'by-tanggal': string; 'by-kelas': string };
  };
  konseling: {
    key: string;
    value: Konseling;
    indexes: { 'by-tanggal': string; 'by-kelas': string; 'by-status': string };
  };
  jurnal: {
    key: string;
    value: JurnalHarian;
    indexes: { 'by-tanggal': string };
  };
  penilaian: {
    key: string;
    value: PenilaianHarian;
    indexes: { 'by-kelas': string; 'by-mapel': string };
  };
}

const DB_NAME = 'bk_smkn1_bunyu_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<BKSchema>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<BKSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Siswa Store
        if (!db.objectStoreNames.contains('siswa')) {
          const siswaStore = db.createObjectStore('siswa', { keyPath: 'id' });
          siswaStore.createIndex('by-kelas', 'kelas');
          siswaStore.createIndex('by-nama', 'nama');
        }
        // Absensi Store
        if (!db.objectStoreNames.contains('absensi')) {
          const absensiStore = db.createObjectStore('absensi', { keyPath: 'id' });
          absensiStore.createIndex('by-tanggal', 'tanggal');
          absensiStore.createIndex('by-kelas', 'kelas');
        }
        // Konseling Store
        if (!db.objectStoreNames.contains('konseling')) {
          const konselingStore = db.createObjectStore('konseling', { keyPath: 'id' });
          konselingStore.createIndex('by-tanggal', 'tanggal');
          konselingStore.createIndex('by-kelas', 'kelas');
          konselingStore.createIndex('by-status', 'statusPenyelesaian');
        }
        // Jurnal Store
        if (!db.objectStoreNames.contains('jurnal')) {
          const jurnalStore = db.createObjectStore('jurnal', { keyPath: 'id' });
          jurnalStore.createIndex('by-tanggal', 'tanggal');
        }
        // Penilaian Store
        if (!db.objectStoreNames.contains('penilaian')) {
          const penilaianStore = db.createObjectStore('penilaian', { keyPath: 'id' });
          penilaianStore.createIndex('by-kelas', 'kelas');
          penilaianStore.createIndex('by-mapel', 'mataPelajaran');
        }
      },
    });
  }
  return dbPromise;
}

// Initial Sample Data Generator for SMKN 1 Bunyu
export const initialSiswaData: Siswa[] = [
  { id: 'sw-1', nomor: '1001', nama: 'Ahmad Fauzi', kelas: 'X TKJ 1', jurusan: 'Teknik Komputer & Jaringan', jenisKelamin: 'L', noHp: '081234567801', namaWali: 'Budi Santoso' },
  { id: 'sw-2', nomor: '1002', nama: 'Anisa Rahmawati', kelas: 'X TKJ 1', jurusan: 'Teknik Komputer & Jaringan', jenisKelamin: 'P', noHp: '081234567802', namaWali: 'Siti Aminah' },
  { id: 'sw-3', nomor: '1003', nama: 'Bayu Saputra', kelas: 'X TKR 1', jurusan: 'Teknik Kendaraan Ringan', jenisKelamin: 'L', noHp: '081234567803', namaWali: 'Eko Prasetyo' },
  { id: 'sw-4', nomor: '1004', nama: 'Citra Dewi', kelas: 'X AKL 1', jurusan: 'Akuntansi & Keuangan Lembaga', jenisKelamin: 'P', noHp: '081234567804', namaWali: 'Dewi Lestari' },
  { id: 'sw-5', nomor: '1005', nama: 'Dimas Anggara', kelas: 'XI TKJ 1', jurusan: 'Teknik Komputer & Jaringan', jenisKelamin: 'L', noHp: '081234567805', namaWali: 'Agus Setiawan' },
  { id: 'sw-6', nomor: '1006', nama: 'Eka Putri Subakti', kelas: 'XI AKL 1', jurusan: 'Akuntansi & Keuangan Lembaga', jenisKelamin: 'P', noHp: '081234567806', namaWali: 'Bambang Subakti' },
  { id: 'sw-7', nomor: '1007', nama: 'Fajar Hidayat', kelas: 'XI TKR 1', jurusan: 'Teknik Kendaraan Ringan', jenisKelamin: 'L', noHp: '081234567807', namaWali: 'Hidayatullah' },
  { id: 'sw-8', nomor: '1008', nama: 'Gita Gutawa', kelas: 'XII TKJ 1', jurusan: 'Teknik Komputer & Jaringan', jenisKelamin: 'P', noHp: '081234567808', namaWali: 'Erwin Gutawa' },
  { id: 'sw-9', nomor: '1009', nama: 'Heri Kuswanto', kelas: 'XII TKR 1', jurusan: 'Teknik Kendaraan Ringan', jenisKelamin: 'L', noHp: '081234567809', namaWali: 'Supriadi' },
  { id: 'sw-10', nomor: '1010', nama: 'Intan Nuraini', kelas: 'XII AKL 1', jurusan: 'Akuntansi & Keuangan Lembaga', jenisKelamin: 'P', noHp: '081234567810', namaWali: 'Nurhayati' }
];

export const initialAbsensiData: Absensi[] = [
  { id: 'ab-1', tanggal: new Date().toISOString().split('T')[0], siswaId: 'sw-1', namaSiswa: 'Ahmad Fauzi', kelas: 'X TKJ 1', status: 'Hadir', catatan: 'Tepat waktu' },
  { id: 'ab-2', tanggal: new Date().toISOString().split('T')[0], siswaId: 'sw-2', namaSiswa: 'Anisa Rahmawati', kelas: 'X TKJ 1', status: 'Hadir', catatan: 'Tepat waktu' },
  { id: 'ab-3', tanggal: new Date().toISOString().split('T')[0], siswaId: 'sw-3', namaSiswa: 'Bayu Saputra', kelas: 'X TKR 1', status: 'Sakit', catatan: 'Surat dokter ada' },
  { id: 'ab-4', tanggal: new Date().toISOString().split('T')[0], siswaId: 'sw-4', namaSiswa: 'Citra Dewi', kelas: 'X AKL 1', status: 'Izin', catatan: 'Acara keluarga' },
  { id: 'ab-5', tanggal: new Date().toISOString().split('T')[0], siswaId: 'sw-5', namaSiswa: 'Dimas Anggara', kelas: 'XI TKJ 1', status: 'Alpha', catatan: 'Tanpa keterangan' }
];

export const initialKonselingData: Konseling[] = [
  {
    id: 'ks-1',
    tanggal: new Date().toISOString().split('T')[0],
    siswaId: 'sw-5',
    namaSiswa: 'Dimas Anggara',
    kelas: 'XI TKJ 1',
    permasalahan: 'Sering terlambat masuk sekolah dan tidak konsentrasi saat jam pelajaran.',
    tindakLanjut: 'Memberikan motivasi belajar, jadwal disiplin harian, dan koordinasi dengan wali murid.',
    statusPenyelesaian: 'Proses',
    guruBK: 'Drs. H. M. Syarif, M.Pd'
  },
  {
    id: 'ks-2',
    tanggal: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    siswaId: 'sw-3',
    namaSiswa: 'Bayu Saputra',
    kelas: 'X TKR 1',
    permasalahan: 'Konsultasi pemilihan minat magang/PRAKERIN dan bimbingan karir industri otomotif.',
    tindakLanjut: 'Bimbingan kelompok dan pemetaan potensi kerja di bengkel mitra SMKN 1 Bunyu.',
    statusPenyelesaian: 'Selesai',
    guruBK: 'Siti Rahmah, S.Pd., Kons.'
  }
];

export const initialJurnalData: JurnalHarian[] = [
  {
    id: 'jr-1',
    tanggal: new Date().toISOString().split('T')[0],
    aktivitas: 'Layanan Bimbingan Klasikal Kelas X TKJ 1',
    catatan: 'Materi: Strategi Belajar Efektif di SMK & Manajemen Waktu.',
    guruBK: 'Drs. H. M. Syarif, M.Pd'
  },
  {
    id: 'jr-2',
    tanggal: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    aktivitas: 'Konseling Individual & Pemanggilan Wali Siswa',
    catatan: 'Pertemuan dengan orang tua siswa bermasalah absensi untuk komitmen kedisiplinan.',
    guruBK: 'Siti Rahmah, S.Pd., Kons.'
  }
];

export const initialPenilaianData: PenilaianHarian[] = [
  { id: 'pn-1', tanggal: new Date().toISOString().split('T')[0], siswaId: 'sw-1', namaSiswa: 'Ahmad Fauzi', kelas: 'X TKJ 1', mataPelajaran: 'Sikap & Kedisiplinan', nilai: 88, keterangan: 'Sangat Baik' },
  { id: 'pn-2', tanggal: new Date().toISOString().split('T')[0], siswaId: 'sw-2', namaSiswa: 'Anisa Rahmawati', kelas: 'X TKJ 1', mataPelajaran: 'Sikap & Kedisiplinan', nilai: 92, keterangan: 'Amat Baik' },
  { id: 'pn-3', tanggal: new Date().toISOString().split('T')[0], siswaId: 'sw-3', namaSiswa: 'Bayu Saputra', kelas: 'X TKR 1', mataPelajaran: 'Pengembangan Diri', nilai: 80, keterangan: 'Baik' },
  { id: 'pn-4', tanggal: new Date().toISOString().split('T')[0], siswaId: 'sw-4', namaSiswa: 'Citra Dewi', kelas: 'X AKL 1', mataPelajaran: 'Keaktifan & Sosial', nilai: 85, keterangan: 'Baik' }
];

// Seed DB if empty
export async function initDatabase() {
  try {
    const db = await getDB();
    const countSiswa = await db.count('siswa');
    if (countSiswa === 0) {
      const tx = db.transaction(['siswa', 'absensi', 'konseling', 'jurnal', 'penilaian'], 'readwrite');
      for (const item of initialSiswaData) await tx.objectStore('siswa').put(item);
      for (const item of initialAbsensiData) await tx.objectStore('absensi').put(item);
      for (const item of initialKonselingData) await tx.objectStore('konseling').put(item);
      for (const item of initialJurnalData) await tx.objectStore('jurnal').put(item);
      for (const item of initialPenilaianData) await tx.objectStore('penilaian').put(item);
      await tx.done;
      console.log('Database initialized with default seed data.');
    }
  } catch (err) {
    console.warn('IndexedDB failed, falling back to LocalStorage:', err);
    if (!localStorage.getItem('bk_siswa')) localStorage.setItem('bk_siswa', JSON.stringify(initialSiswaData));
    if (!localStorage.getItem('bk_absensi')) localStorage.setItem('bk_absensi', JSON.stringify(initialAbsensiData));
    if (!localStorage.getItem('bk_konseling')) localStorage.setItem('bk_konseling', JSON.stringify(initialKonselingData));
    if (!localStorage.getItem('bk_jurnal')) localStorage.setItem('bk_jurnal', JSON.stringify(initialJurnalData));
    if (!localStorage.getItem('bk_penilaian')) localStorage.setItem('bk_penilaian', JSON.stringify(initialPenilaianData));
  }
}

// Data Access Functions
export async function getAllSiswa(): Promise<Siswa[]> {
  try {
    const db = await getDB();
    return await db.getAll('siswa');
  } catch {
    return JSON.parse(localStorage.getItem('bk_siswa') || '[]');
  }
}

export async function saveSiswa(item: Siswa): Promise<void> {
  try {
    const db = await getDB();
    await db.put('siswa', item);
  } catch {
    const list = await getAllSiswa();
    const idx = list.findIndex(x => x.id === item.id);
    if (idx >= 0) list[idx] = item; else list.push(item);
    localStorage.setItem('bk_siswa', JSON.stringify(list));
  }
}

export async function deleteSiswa(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('siswa', id);
  } catch {
    const list = await getAllSiswa();
    const filtered = list.filter(x => x.id !== id);
    localStorage.setItem('bk_siswa', JSON.stringify(filtered));
  }
}

export async function saveSiswaBatch(items: Siswa[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('siswa', 'readwrite');
    for (const item of items) await tx.store.put(item);
    await tx.done;
  } catch {
    const list = await getAllSiswa();
    for (const item of items) {
      const idx = list.findIndex(x => x.id === item.id);
      if (idx >= 0) list[idx] = item; else list.push(item);
    }
    localStorage.setItem('bk_siswa', JSON.stringify(list));
  }
}

// Absensi
export async function getAllAbsensi(): Promise<Absensi[]> {
  try {
    const db = await getDB();
    return await db.getAll('absensi');
  } catch {
    return JSON.parse(localStorage.getItem('bk_absensi') || '[]');
  }
}

export async function saveAbsensiBatch(items: Absensi[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('absensi', 'readwrite');
    for (const item of items) await tx.store.put(item);
    await tx.done;
  } catch {
    const list = await getAllAbsensi();
    for (const item of items) {
      const idx = list.findIndex(x => x.id === item.id);
      if (idx >= 0) list[idx] = item; else list.push(item);
    }
    localStorage.setItem('bk_absensi', JSON.stringify(list));
  }
}

export async function deleteAbsensi(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('absensi', id);
  } catch {
    const list = await getAllAbsensi();
    localStorage.setItem('bk_absensi', JSON.stringify(list.filter(x => x.id !== id)));
  }
}

// Konseling
export async function getAllKonseling(): Promise<Konseling[]> {
  try {
    const db = await getDB();
    return await db.getAll('konseling');
  } catch {
    return JSON.parse(localStorage.getItem('bk_konseling') || '[]');
  }
}

export async function saveKonseling(item: Konseling): Promise<void> {
  try {
    const db = await getDB();
    await db.put('konseling', item);
  } catch {
    const list = await getAllKonseling();
    const idx = list.findIndex(x => x.id === item.id);
    if (idx >= 0) list[idx] = item; else list.push(item);
    localStorage.setItem('bk_konseling', JSON.stringify(list));
  }
}

export async function deleteKonseling(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('konseling', id);
  } catch {
    const list = await getAllKonseling();
    localStorage.setItem('bk_konseling', JSON.stringify(list.filter(x => x.id !== id)));
  }
}

// Jurnal Harian
export async function getAllJurnal(): Promise<JurnalHarian[]> {
  try {
    const db = await getDB();
    return await db.getAll('jurnal');
  } catch {
    return JSON.parse(localStorage.getItem('bk_jurnal') || '[]');
  }
}

export async function saveJurnal(item: JurnalHarian): Promise<void> {
  try {
    const db = await getDB();
    await db.put('jurnal', item);
  } catch {
    const list = await getAllJurnal();
    const idx = list.findIndex(x => x.id === item.id);
    if (idx >= 0) list[idx] = item; else list.push(item);
    localStorage.setItem('bk_jurnal', JSON.stringify(list));
  }
}

export async function deleteJurnal(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('jurnal', id);
  } catch {
    const list = await getAllJurnal();
    localStorage.setItem('bk_jurnal', JSON.stringify(list.filter(x => x.id !== id)));
  }
}

// Penilaian Harian
export async function getAllPenilaian(): Promise<PenilaianHarian[]> {
  try {
    const db = await getDB();
    return await db.getAll('penilaian');
  } catch {
    return JSON.parse(localStorage.getItem('bk_penilaian') || '[]');
  }
}

export async function savePenilaian(item: PenilaianHarian): Promise<void> {
  try {
    const db = await getDB();
    await db.put('penilaian', item);
  } catch {
    const list = await getAllPenilaian();
    const idx = list.findIndex(x => x.id === item.id);
    if (idx >= 0) list[idx] = item; else list.push(item);
    localStorage.setItem('bk_penilaian', JSON.stringify(list));
  }
}

export async function deletePenilaian(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('penilaian', id);
  } catch {
    const list = await getAllPenilaian();
    localStorage.setItem('bk_penilaian', JSON.stringify(list.filter(x => x.id !== id)));
  }
}

// Full Database Export & Import (JSON Backup)
export async function exportDatabaseJSON(): Promise<AppDatabase> {
  const siswa = await getAllSiswa();
  const absensi = await getAllAbsensi();
  const konseling = await getAllKonseling();
  const jurnal = await getAllJurnal();
  const penilaian = await getAllPenilaian();

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    siswa,
    absensi,
    konseling,
    jurnal,
    penilaian,
  };
}

export async function importDatabaseJSON(data: Partial<AppDatabase>): Promise<boolean> {
  try {
    if (data.siswa && Array.isArray(data.siswa)) await saveSiswaBatch(data.siswa);
    if (data.absensi && Array.isArray(data.absensi)) await saveAbsensiBatch(data.absensi);
    if (data.konseling && Array.isArray(data.konseling)) {
      for (const k of data.konseling) await saveKonseling(k);
    }
    if (data.jurnal && Array.isArray(data.jurnal)) {
      for (const j of data.jurnal) await saveJurnal(j);
    }
    if (data.penilaian && Array.isArray(data.penilaian)) {
      for (const p of data.penilaian) await savePenilaian(p);
    }
    return true;
  } catch (err) {
    console.error('Import database failed:', err);
    return false;
  }
}
