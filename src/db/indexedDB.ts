import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Siswa, Absensi, Konseling, JurnalHarian, PenilaianHarian, TataTertibDocument, AppDatabase } from '../types';

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
  tataTertib: {
    key: string;
    value: TataTertibDocument;
  };
}

const DB_NAME = 'bk_smkn1_bunyu_db';
const DB_VERSION = 2; // Incremented for tataTertib

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
        // TataTertib Store
        if (!db.objectStoreNames.contains('tataTertib')) {
          db.createObjectStore('tataTertib', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// Initial Sample Data Generator for SMKN 1 Bunyu
export const initialSiswaData: Siswa[] = [
  { id: 'sw-xi-1', nomor: '001101', nama: 'Andi Saputra', kelas: 'XI TPMG', jurusan: 'TPMG', jenisKelamin: 'L', noHp: '081399887766', namaWali: 'Syamsul' },
  { id: 'sw-xi-2', nomor: '001102', nama: 'Dewi Lestari', kelas: 'XI TPMG', jurusan: 'TPMG', jenisKelamin: 'P', noHp: '081399887767', namaWali: 'Bambang' },
  { id: 'sw-xi-3', nomor: '001103', nama: 'Ahmad Rizky Pratama', kelas: 'XI TPMG', jurusan: 'TPMG', jenisKelamin: 'L', noHp: '081234567890', namaWali: 'Budi Pratama' },
  { id: 'sw-xi-4', nomor: '001104', nama: 'Siti Rahmawati', kelas: 'XI TPMG', jurusan: 'TPMG', jenisKelamin: 'P', noHp: '081234567891', namaWali: 'Hasanuddin' },
  { id: 'sw-xi-5', nomor: '001105', nama: 'Muhammad Dimas', kelas: 'XI TPMG', jurusan: 'TPMG', jenisKelamin: 'L', noHp: '081234567892', namaWali: 'Supriadi' },
  { id: 'sw-xii-1', nomor: '001201', nama: 'Budi Santoso', kelas: 'XII TPMG', jurusan: 'TPMG', jenisKelamin: 'L', noHp: '081234567801', namaWali: 'Heri Santoso' },
  { id: 'sw-xii-2', nomor: '001202', nama: 'Rina Indah', kelas: 'XII TPMG', jurusan: 'TPMG', jenisKelamin: 'P', noHp: '081234567802', namaWali: 'Kurniawan' },
  { id: 'sw-x-1', nomor: '001001', nama: 'Doni Kurnia', kelas: 'X TKJ 1', jurusan: 'TKJ', jenisKelamin: 'L', noHp: '081234567803', namaWali: 'Eko Kurnia' }
];
export const initialAbsensiData: Absensi[] = [];
export const initialKonselingData: Konseling[] = [];

export const initialJurnalData: JurnalHarian[] = [];

export const initialPenilaianData: PenilaianHarian[] = [];

// Seed DB if empty (runs only on first app launch)
export async function initDatabase() {
  const isInitialized = localStorage.getItem('bk_db_initialized');
  if (isInitialized) return;

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
    }
  } catch (err) {
    console.warn('IndexedDB seed failed, falling back to LocalStorage:', err);
  } finally {
    if (!localStorage.getItem('bk_siswa')) localStorage.setItem('bk_siswa', JSON.stringify(initialSiswaData));
    if (!localStorage.getItem('bk_absensi')) localStorage.setItem('bk_absensi', JSON.stringify(initialAbsensiData));
    if (!localStorage.getItem('bk_konseling')) localStorage.setItem('bk_konseling', JSON.stringify(initialKonselingData));
    if (!localStorage.getItem('bk_jurnal')) localStorage.setItem('bk_jurnal', JSON.stringify(initialJurnalData));
    if (!localStorage.getItem('bk_penilaian')) localStorage.setItem('bk_penilaian', JSON.stringify(initialPenilaianData));
    localStorage.setItem('bk_db_initialized', 'true');
  }
}

// Data Access Functions
export async function getAllSiswa(): Promise<Siswa[]> {
  try {
    const db = await getDB();
    const res = await db.getAll('siswa');
    if (res && res.length > 0) return res;
  } catch {
    // fallback
  }
  return JSON.parse(localStorage.getItem('bk_siswa') || '[]');
}

export async function saveSiswa(item: Siswa): Promise<void> {
  try {
    const db = await getDB();
    await db.put('siswa', item);
  } catch (err) {
    console.warn('IndexedDB saveSiswa error:', err);
  }
  try {
    const list = JSON.parse(localStorage.getItem('bk_siswa') || '[]');
    const idx = list.findIndex((x: Siswa) => x.id === item.id);
    if (idx >= 0) list[idx] = item; else list.push(item);
    localStorage.setItem('bk_siswa', JSON.stringify(list));
  } catch {
    // ignore
  }
}

export async function deleteSiswa(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('siswa', id);
  } catch (err) {
    console.warn('IndexedDB deleteSiswa error:', err);
  }
  try {
    const list = JSON.parse(localStorage.getItem('bk_siswa') || '[]');
    const filtered = list.filter((x: Siswa) => x.id !== id);
    localStorage.setItem('bk_siswa', JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

export async function saveSiswaBatch(items: Siswa[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('siswa', 'readwrite');
    for (const item of items) await tx.store.put(item);
    await tx.done;
  } catch (err) {
    console.warn('IndexedDB saveSiswaBatch error:', err);
  }
  try {
    const list = JSON.parse(localStorage.getItem('bk_siswa') || '[]');
    for (const item of items) {
      const idx = list.findIndex((x: Siswa) => x.id === item.id);
      if (idx >= 0) list[idx] = item; else list.push(item);
    }
    localStorage.setItem('bk_siswa', JSON.stringify(list));
  } catch {
    // ignore
  }
}

// Absensi
export async function getAllAbsensi(): Promise<Absensi[]> {
  try {
    const db = await getDB();
    const res = await db.getAll('absensi');
    if (res) return res;
  } catch {
    // fallback
  }
  return JSON.parse(localStorage.getItem('bk_absensi') || '[]');
}

export async function saveAbsensiBatch(items: Absensi[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('absensi', 'readwrite');
    for (const item of items) await tx.store.put(item);
    await tx.done;
  } catch (err) {
    console.warn('IndexedDB saveAbsensiBatch error:', err);
  }
  try {
    const list = JSON.parse(localStorage.getItem('bk_absensi') || '[]');
    for (const item of items) {
      const idx = list.findIndex((x: Absensi) => x.id === item.id);
      if (idx >= 0) list[idx] = item; else list.push(item);
    }
    localStorage.setItem('bk_absensi', JSON.stringify(list));
  } catch {
    // ignore
  }
}

export async function deleteAbsensi(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('absensi', id);
  } catch (err) {
    console.warn('IndexedDB deleteAbsensi error:', err);
  }
  try {
    const list = JSON.parse(localStorage.getItem('bk_absensi') || '[]');
    localStorage.setItem('bk_absensi', JSON.stringify(list.filter((x: Absensi) => x.id !== id)));
  } catch {
    // ignore
  }
}

// Konseling
export async function getAllKonseling(): Promise<Konseling[]> {
  try {
    const db = await getDB();
    const res = await db.getAll('konseling');
    if (res) return res;
  } catch {
    // fallback
  }
  return JSON.parse(localStorage.getItem('bk_konseling') || '[]');
}

export async function saveKonseling(item: Konseling): Promise<void> {
  try {
    const db = await getDB();
    await db.put('konseling', item);
  } catch (err) {
    console.warn('IndexedDB saveKonseling error:', err);
  }
  try {
    const list = JSON.parse(localStorage.getItem('bk_konseling') || '[]');
    const idx = list.findIndex((x: Konseling) => x.id === item.id);
    if (idx >= 0) list[idx] = item; else list.push(item);
    localStorage.setItem('bk_konseling', JSON.stringify(list));
  } catch {
    // ignore
  }
}

export async function deleteKonseling(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('konseling', id);
  } catch (err) {
    console.warn('IndexedDB deleteKonseling error:', err);
  }
  try {
    const list = JSON.parse(localStorage.getItem('bk_konseling') || '[]');
    localStorage.setItem('bk_konseling', JSON.stringify(list.filter((x: Konseling) => x.id !== id)));
  } catch {
    // ignore
  }
}

// Jurnal Harian
export async function getAllJurnal(): Promise<JurnalHarian[]> {
  try {
    const db = await getDB();
    const res = await db.getAll('jurnal');
    if (res) return res;
  } catch {
    // fallback
  }
  return JSON.parse(localStorage.getItem('bk_jurnal') || '[]');
}

export async function saveJurnal(item: JurnalHarian): Promise<void> {
  try {
    const db = await getDB();
    await db.put('jurnal', item);
  } catch (err) {
    console.warn('IndexedDB saveJurnal error:', err);
  }
  try {
    const list = JSON.parse(localStorage.getItem('bk_jurnal') || '[]');
    const idx = list.findIndex((x: JurnalHarian) => x.id === item.id);
    if (idx >= 0) list[idx] = item; else list.push(item);
    localStorage.setItem('bk_jurnal', JSON.stringify(list));
  } catch {
    // ignore
  }
}

export async function deleteJurnal(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('jurnal', id);
  } catch (err) {
    console.warn('IndexedDB deleteJurnal error:', err);
  }
  try {
    const list = JSON.parse(localStorage.getItem('bk_jurnal') || '[]');
    localStorage.setItem('bk_jurnal', JSON.stringify(list.filter((x: JurnalHarian) => x.id !== id)));
  } catch {
    // ignore
  }
}

// Penilaian Harian
export async function getAllPenilaian(): Promise<PenilaianHarian[]> {
  try {
    const db = await getDB();
    const res = await db.getAll('penilaian');
    if (res) return res;
  } catch {
    // fallback
  }
  return JSON.parse(localStorage.getItem('bk_penilaian') || '[]');
}

export async function savePenilaian(item: PenilaianHarian): Promise<void> {
  try {
    const db = await getDB();
    await db.put('penilaian', item);
  } catch (err) {
    console.warn('IndexedDB savePenilaian error:', err);
  }
  try {
    const list = JSON.parse(localStorage.getItem('bk_penilaian') || '[]');
    const idx = list.findIndex((x: PenilaianHarian) => x.id === item.id);
    if (idx >= 0) list[idx] = item; else list.push(item);
    localStorage.setItem('bk_penilaian', JSON.stringify(list));
  } catch {
    // ignore
  }
}

export async function deletePenilaian(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('penilaian', id);
  } catch (err) {
    console.warn('IndexedDB deletePenilaian error:', err);
  }
  try {
    const list = JSON.parse(localStorage.getItem('bk_penilaian') || '[]');
    localStorage.setItem('bk_penilaian', JSON.stringify(list.filter((x: PenilaianHarian) => x.id !== id)));
  } catch {
    // ignore
  }
}

// Tata Tertib Document
export async function getAllTataTertib(): Promise<TataTertibDocument[]> {
  try {
    const db = await getDB();
    return await db.getAll('tataTertib');
  } catch {
    return JSON.parse(localStorage.getItem('bk_tata_tertib') || '[]');
  }
}

export async function saveTataTertib(item: TataTertibDocument): Promise<void> {
  try {
    const db = await getDB();
    await db.put('tataTertib', item);
  } catch {
    const list = await getAllTataTertib();
    const idx = list.findIndex(x => x.id === item.id);
    if (idx >= 0) list[idx] = item; else list.push(item);
    localStorage.setItem('bk_tata_tertib', JSON.stringify(list));
  }
}

export async function deleteTataTertib(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('tataTertib', id);
  } catch (err) {
    console.warn('IndexedDB delete error:', err);
  }
  try {
    const raw = localStorage.getItem('bk_tata_tertib');
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        localStorage.setItem('bk_tata_tertib', JSON.stringify(list.filter((x: { id: string }) => x.id !== id)));
      }
    }
  } catch {
    // ignore
  }
}

// Full Database Export & Import (JSON Backup)
export async function exportDatabaseJSON(): Promise<AppDatabase> {
  const siswa = await getAllSiswa();
  const absensi = await getAllAbsensi();
  const konseling = await getAllKonseling();
  const jurnal = await getAllJurnal();
  const penilaian = await getAllPenilaian();
  const tataTertib = await getAllTataTertib();

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    siswa,
    absensi,
    konseling,
    jurnal,
    penilaian,
    tataTertib,
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
    if (data.tataTertib && Array.isArray(data.tataTertib)) {
      for (const t of data.tataTertib) await saveTataTertib(t);
    }
    return true;
  } catch (err) {
    console.error('Import database failed:', err);
    return false;
  }
}
