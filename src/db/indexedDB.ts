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
  { id: 'sw-xto1-1', nomor: '1', nama: 'Ahmad Najib', kelas: 'X TO 1', jurusan: 'TO', jenisKelamin: 'L', noHp: '-', namaWali: '-' },
  { id: 'sw-xto1-2', nomor: '2', nama: 'Ahmad Zulkifli Resi', kelas: 'X TO 1', jurusan: 'TO', jenisKelamin: 'L', noHp: '-', namaWali: '-' },
  { id: 'sw-xto1-3', nomor: '3', nama: 'Muhammad Nizar Patahillah', kelas: 'X TO 1', jurusan: 'TO', jenisKelamin: 'L', noHp: '-', namaWali: '-' },
  { id: 'sw-xto1-4', nomor: '4', nama: 'Alif Purnama', kelas: 'X TO 1', jurusan: 'TO', jenisKelamin: 'L', noHp: '-', namaWali: '-' },
  { id: 'sw-xto1-5', nomor: '5', nama: 'Aulia Fitriani', kelas: 'X TO 1', jurusan: 'TO', jenisKelamin: 'P', noHp: '-', namaWali: '-' },
  { id: 'sw-xto1-6', nomor: '6', nama: 'Devghan Langit Almansyah', kelas: 'X TO 1', jurusan: 'TO', jenisKelamin: 'L', noHp: '-', namaWali: '-' },
  { id: 'sw-xto1-7', nomor: '7', nama: 'Dhanil Daeng Tata', kelas: 'X TO 1', jurusan: 'TO', jenisKelamin: 'L', noHp: '-', namaWali: '-' },
  { id: 'sw-xi-1', nomor: '8', nama: 'Andi Saputra', kelas: 'XI TPMG', jurusan: 'TPMG', jenisKelamin: 'L', noHp: '081399887766', namaWali: 'Syamsul' },
  { id: 'sw-xi-2', nomor: '9', nama: 'Dewi Lestari', kelas: 'XI TPMG', jurusan: 'TPMG', jenisKelamin: 'P', noHp: '081399887767', namaWali: 'Bambang' },
  { id: 'sw-xi-3', nomor: '10', nama: 'Ahmad Rizky Pratama', kelas: 'XI TPMG', jurusan: 'TPMG', jenisKelamin: 'L', noHp: '081234567890', namaWali: 'Budi Pratama' },
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
      const tx = db.transaction(['siswa', 'absensi', 'konseling', 'jurnal', 'penilaian', 'tataTertib'], 'readwrite');
      for (const item of initialSiswaData) await tx.objectStore('siswa').put(item);
      for (const item of initialAbsensiData) await tx.objectStore('absensi').put(item);
      for (const item of initialKonselingData) await tx.objectStore('konseling').put(item);
      for (const item of initialJurnalData) await tx.objectStore('jurnal').put(item);
      for (const item of initialPenilaianData) await tx.objectStore('penilaian').put(item);
      for (const item of initialTataTertibData) await tx.objectStore('tataTertib').put(item);
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
    if (!localStorage.getItem('bk_tata_tertib')) localStorage.setItem('bk_tata_tertib', JSON.stringify(initialTataTertibData));
    localStorage.setItem('bk_tt_initialized', 'true');
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

export const initialTataTertibData: TataTertibDocument[] = [
  {
    id: 'tt-smkn1-bunyu-official',
    fileName: 'PEDOMAN TATA TERTIB MURID SMK NEGERI 1 BUNYU.pdf',
    fileData: 'data:application/pdf;base64,',
    uploadedAt: '2026-07-13',
    fileSizeFormatted: '1.2 MB',
    extractedText: `
PEDOMAN TATA TERTIB MURID SMK NEGERI 1 BUNYU
DINAS PENDIDIKAN DAN KEBUDAYAAN PROVINSI KALIMANTAN UTARA
SMK NEGERI 1 BUNYU
Alamat Kampus: Jl. Dewa Ruci Desa Bunyu Selatan Kecamatan Bunyu (e-mail: smkn1bunyu@gmail.com)

BAB I PENGERTIAN
Pasal 1
Semua peraturan dan ketentuan yang dibuat dalam menjaga ketertiban sekolah. Ketertiban berarti kondisi dinamis yang menimbulkan keserasian, keselarasan dan keseimbangan dalam tata hidup bersama sebagai makhluk Tuhan.

BAB II KETENTUAN UMUM
Pasal 2
1. Setiap Murid adalah keluarga besar SMK Negeri 1 Bunyu yang harus menjaga nama baik almamater sekolah.
2. Untuk menciptakan suasana proses belajar mengajar yang baik, tertib, lancar, dan terkendali.
3. Tata tertib Murid dibuat untuk mengatur segala proses pendidikan di sekolah.
4. Setiap Murid wajib mentaati dan mematuhi ketentuan yang ada dalam tata tertib.
5. Setiap Murid yang tidak mematuhi aturan akan diberikan sanksi sesuai ketentuan.

BAB III DASAR, FUNGSI DAN TUJUAN
Pasal 3 (Dasar): Pancasila, UUD 1945, UU No. 20 Tahun 2003, PP No. 19/2005, PP No. 39/2008.
Pasal 4 (Fungsi): Mengarahkan Murid, menjaga nama baik sekolah, membentuk karakter.
Pasal 5 (Tujuan): Membentuk Murid yang handal secara iptek & imtak, menciptakan suasana belajar kondusif.

BAB IV HAK DAN KEWAJIBAN MURID
Pasal 6 (Hak Murid):
- Mendapatkan pendidikan & pengajaran.
- Mengikuti kegiatan OSIS & Ekstrakurikuler.
- Memilih program keahlian/jurusan.
- Mendapatkan layanan Bimbingan Konseling.
Pasal 7 (Kewajiban Murid):
- Mentaati tata tertib sekolah.
- Hormat dan sopan kepada warga sekolah.
- Mengikuti kegiatan belajar mengajar dengan sungguh-sungguh.
- Berpakaian seragam sesuai ketentuan.

BAB V KEGIATAN BELAJAR MENGAJAR
Pasal 8 (Kehadiran Murid): Wajib hadir paling lambat pukul 07:15 WITA.
Pasal 9 (Ketidakhadiran):
- 4 hari alpa: Teguran lisan wali kelas.
- 6 hari alpa: Pemanggilan orang tua.
- 10 hari alpa: Surat Peringatan 1 (SP 1).
- 20 hari alpa: SP 2.
- 30 hari alpa: SP 3 / Dikembalikan ke orang tua.
Pasal 10 (Murid Terlambat): Sanksi pembersihan lingkungan & akumulasi alpa.
Pasal 11 (Perizinan): Izin harus melalui prosedur guru piket & wali kelas.

BAB VI PAKAIAN DAN TATA RIAS
Pasal 12 (Seragam):
- Senin: Putih Abu-abu (OSIS)
- Selasa: Putih Abu-abu
- Rabu: Seragam Khusus Kejuruan/Kompetensi
- Kamis: Batik
- Jumat: Baju Olahraga & Pramuka
Pasal 13 (Tata Rias):
- Putra: Rambut pendek rapi (maksimal 4cm atas, 3cm belakang, 2cm samping). Tidak disemir, tidak bertato, tidak ditindik.
- Putri: Rapi, tidak dandan berlebihan, jilbab putih polos.

BAB X PELANGGARAN DAN SANKSI (Pasal 23)
- Pelanggaran Ringan: Teguran lisan, pembinaan, pembersihan lingkungan.
- Pelanggaran Sedang: Pemanggilan orang tua, SP 1 (durasi 3 bulan).
- Pelanggaran Berat: Pemanggilan orang tua, SP 2 / SP 3, mutasi/dikembalikan ke orang tua (skorsing/tindak tegas untuk narkoba, kejahatan, dan amoral).

Ditetapkan di Bunyu, 13 Juli 2026
Kepala Sekolah SMK Negeri 1 Bunyu
Kokom Komariyah, S.Pd., Gr.
NIP. 198702072011012002
    `
  }
];

// Tata Tertib Document
export async function getAllTataTertib(): Promise<TataTertibDocument[]> {
  const isTtInit = localStorage.getItem('bk_tt_initialized');
  try {
    const db = await getDB();
    const list = await db.getAll('tataTertib');
    if (list && list.length > 0) return list;
    if (isTtInit === 'true') return list || [];

    // First time seed into IndexedDB & LocalStorage
    for (const doc of initialTataTertibData) {
      await db.put('tataTertib', doc);
    }
    localStorage.setItem('bk_tt_initialized', 'true');
    localStorage.setItem('bk_tata_tertib', JSON.stringify(initialTataTertibData));
    return initialTataTertibData;
  } catch {
    const local = JSON.parse(localStorage.getItem('bk_tata_tertib') || '[]');
    if (local.length > 0 || isTtInit === 'true') return local;
    localStorage.setItem('bk_tt_initialized', 'true');
    localStorage.setItem('bk_tata_tertib', JSON.stringify(initialTataTertibData));
    return initialTataTertibData;
  }
}

export async function saveTataTertib(item: TataTertibDocument): Promise<void> {
  localStorage.setItem('bk_tt_initialized', 'true');
  try {
    const db = await getDB();
    await db.put('tataTertib', item);
  } catch (err) {
    console.warn('IndexedDB saveTataTertib error:', err);
  }
  try {
    const raw = localStorage.getItem('bk_tata_tertib');
    const list = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((x: TataTertibDocument) => x.id === item.id);
    if (idx >= 0) list[idx] = item; else list.unshift(item);
    localStorage.setItem('bk_tata_tertib', JSON.stringify(list));
  } catch {
    // ignore
  }
}

export async function deleteTataTertib(id: string): Promise<void> {
  localStorage.setItem('bk_tt_initialized', 'true');
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
        const updated = list.filter((x: { id: string }) => x.id !== id);
        localStorage.setItem('bk_tata_tertib', JSON.stringify(updated));
      }
    } else {
      localStorage.setItem('bk_tata_tertib', JSON.stringify([]));
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
