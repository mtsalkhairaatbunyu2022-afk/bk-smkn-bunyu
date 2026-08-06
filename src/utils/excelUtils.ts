import * as XLSX from 'xlsx';
import { Siswa, Absensi, Konseling, JurnalHarian, PenilaianHarian } from '../types';

export function exportSingleSheetExcel(data: any[], fileName: string, sheetName = 'Data') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportMultiSheetDatabaseExcel(dbData: {
  siswa: Siswa[];
  absensi: Absensi[];
  konseling: Konseling[];
  jurnal: JurnalHarian[];
  penilaian: PenilaianHarian[];
}) {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Siswa
  const siswaSheetData = dbData.siswa.map((s, idx) => ({
    'No': idx + 1,
    'NIS / Nomor': s.nomor,
    'Nama Siswa': s.nama,
    'Kelas': s.kelas,
    'Jurusan': s.jurusan,
    'Jenis Kelamin': s.jenisKelamin || '-',
    'No HP Wali': s.noHp || '-',
    'Nama Wali': s.namaWali || '-'
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(siswaSheetData), 'Data Siswa');

  // Sheet 2: Absensi
  const absensiSheetData = dbData.absensi.map((a, idx) => ({
    'No': idx + 1,
    'Tanggal': a.tanggal,
    'Nama Siswa': a.namaSiswa,
    'Kelas': a.kelas,
    'Status Absensi': a.status,
    'Catatan': a.catatan || '-'
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(absensiSheetData), 'Absensi Siswa');

  // Sheet 3: Bimbingan Konseling
  const konselingSheetData = dbData.konseling.map((k, idx) => ({
    'No': idx + 1,
    'Tanggal': k.tanggal,
    'Nama Siswa': k.namaSiswa,
    'Kelas': k.kelas,
    'Permasalahan': k.permasalahan,
    'Tindak Lanjut': k.tindakLanjut,
    'Status Penyelesaian': k.statusPenyelesaian,
    'Guru BK': k.guruBK
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(konselingSheetData), 'Bimbingan Konseling');

  // Sheet 4: Jurnal Harian
  const jurnalSheetData = dbData.jurnal.map((j, idx) => ({
    'No': idx + 1,
    'Tanggal': j.tanggal,
    'Aktivitas': j.aktivitas,
    'Catatan / Hasil': j.catatan,
    'Guru BK': j.guruBK
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(jurnalSheetData), 'Jurnal Harian');

  // Sheet 5: Penilaian Harian
  const penilaianSheetData = dbData.penilaian.map((p, idx) => ({
    'No': idx + 1,
    'Tanggal': p.tanggal,
    'Nama Siswa': p.namaSiswa,
    'Kelas': p.kelas,
    'Aspek / Mata Pelajaran': p.mataPelajaran,
    'Nilai': p.nilai,
    'Keterangan': p.keterangan
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(penilaianSheetData), 'Penilaian Harian');

  XLSX.writeFile(workbook, `BK_SMKN1_BUNYU_REKAP_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export async function parseExcelFile(file: File): Promise<{
  siswa: Siswa[];
  absensi: Absensi[];
  konseling: Konseling[];
  jurnal: JurnalHarian[];
  penilaian: PenilaianHarian[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });

        const result = {
          siswa: [] as Siswa[],
          absensi: [] as Absensi[],
          konseling: [] as Konseling[],
          jurnal: [] as JurnalHarian[],
          penilaian: [] as PenilaianHarian[],
        };

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const rawData: any[] = XLSX.utils.sheet_to_json(sheet);

          const nameLower = sheetName.toLowerCase();

          if (nameLower.includes('siswa') || sheetName === workbook.SheetNames[0]) {
            rawData.forEach((row, idx) => {
              const nomor = String(row['NIS / Nomor'] || row['NIS'] || row['Nomor'] || row['No'] || `SW-${Date.now()}-${idx}`);
              const nama = row['Nama Siswa'] || row['Nama'] || row['Nama Lengkap'] || '';
              const kelas = row['Kelas'] || row['Kelas/Rombel'] || 'X TKJ 1';
              const jurusan = row['Jurusan'] || 'Teknik Komputer & Jaringan';
              if (nama) {
                result.siswa.push({
                  id: `imp-sw-${Date.now()}-${idx}`,
                  nomor,
                  nama,
                  kelas,
                  jurusan,
                  jenisKelamin: row['Jenis Kelamin'] || row['JK'] || 'L',
                  noHp: String(row['No HP Wali'] || row['No HP'] || ''),
                  namaWali: row['Nama Wali'] || row['Wali'] || ''
                });
              }
            });
          } else if (nameLower.includes('absen')) {
            rawData.forEach((row, idx) => {
              if (row['Nama Siswa'] || row['Nama']) {
                result.absensi.push({
                  id: `imp-ab-${Date.now()}-${idx}`,
                  tanggal: row['Tanggal'] || new Date().toISOString().split('T')[0],
                  siswaId: `sw-${idx}`,
                  namaSiswa: row['Nama Siswa'] || row['Nama'],
                  kelas: row['Kelas'] || 'X TKJ 1',
                  status: (['Hadir', 'Sakit', 'Izin', 'Alpha'].includes(row['Status Absensi'] || row['Status']) ? row['Status Absensi'] || row['Status'] : 'Hadir'),
                  catatan: row['Catatan'] || ''
                });
              }
            });
          } else if (nameLower.includes('konseling')) {
            rawData.forEach((row, idx) => {
              if (row['Nama Siswa'] || row['Nama']) {
                result.konseling.push({
                  id: `imp-ks-${Date.now()}-${idx}`,
                  tanggal: row['Tanggal'] || new Date().toISOString().split('T')[0],
                  siswaId: `sw-${idx}`,
                  namaSiswa: row['Nama Siswa'] || row['Nama'],
                  kelas: row['Kelas'] || 'X TKJ 1',
                  permasalahan: row['Permasalahan'] || row['Masalah'] || '-',
                  tindakLanjut: row['Tindak Lanjut'] || '-',
                  statusPenyelesaian: (['Proses', 'Selesai', 'Rujukan', 'Pemantauan'].includes(row['Status Penyelesaian'] || row['Status']) ? row['Status Penyelesaian'] || row['Status'] : 'Proses'),
                  guruBK: row['Guru BK'] || 'Drs. H. M. Syarif, M.Pd'
                });
              }
            });
          }
        }

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}
