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
export const initialSiswaData: Siswa[] = [];
export const initialAbsensiData: Absensi[] = [];
export const initialKonselingData: Konseling[] = [];

export const initialJurnalData: JurnalHarian[] = [];

export const initialPenilaianData: PenilaianHarian[] = [];

// Seed DB if empty
export async function initDatabase() {
  try {
    const db = await getDB();

    // Clean up residual default sample data across all stores from previous app versions
    const sampleSiswaIds = ['sw-1', 'sw-2', 'sw-3', 'sw-4', 'sw-5', 'sw-6', 'sw-7', 'sw-8', 'sw-9', 'sw-10'];
    const sampleAbsensiIds = ['ab-1', 'ab-2', 'ab-3', 'ab-4', 'ab-5'];
    const sampleKonselingIds = ['ks-1', 'ks-2'];
    const sampleJurnalIds = ['jr-1', 'jr-2'];
    const samplePenilaianIds = ['pn-1', 'pn-2', 'pn-3', 'pn-4'];

    const txClean = db.transaction(['siswa', 'absensi', 'konseling', 'jurnal', 'penilaian'], 'readwrite');
    for (const id of sampleSiswaIds) await txClean.objectStore('siswa').delete(id);
    for (const id of sampleAbsensiIds) await txClean.objectStore('absensi').delete(id);
    for (const id of sampleKonselingIds) await txClean.objectStore('konseling').delete(id);
    for (const id of sampleJurnalIds) await txClean.objectStore('jurnal').delete(id);
    for (const id of samplePenilaianIds) await txClean.objectStore('penilaian').delete(id);
    await txClean.done;

    // Also clear residual sample items from LocalStorage fallback
    const purgeLS = (key: string, sampleIds: string[]) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            const clean = arr.filter((x: { id: string }) => !sampleIds.includes(x.id));
            localStorage.setItem(key, JSON.stringify(clean));
          }
        } catch {
          // ignore
        }
      }
    };
    purgeLS('bk_siswa', sampleSiswaIds);
    purgeLS('bk_absensi', sampleAbsensiIds);
    purgeLS('bk_konseling', sampleKonselingIds);
    purgeLS('bk_jurnal', sampleJurnalIds);
    purgeLS('bk_penilaian', samplePenilaianIds);

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
