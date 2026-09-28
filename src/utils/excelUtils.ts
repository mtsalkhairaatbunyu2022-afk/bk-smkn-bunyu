import * as XLSX from 'xlsx';
import { Siswa, Absensi, Konseling, JurnalHarian, PenilaianHarian } from '../types';

/**
 * Creates an XLSX Worksheet with a 2-row merged header structure.
 * 
 * Example Layout matching user's image:
 * Row 0: Title Header
 * Row 1: Main Header Row (e.g. NOMOR [rowSpan=2] | NAMA [rowSpan=2] | KETERANGAN [colSpan=5])
 * Row 2: Sub Header Row (e.g.        |      | HADIR | SAKIT | IZIN | TERLAMBAT | ALPHA)
 * Row 3+: Data Rows (e.g.            1 | ALIF | 10    | 2     | 6    | 7         | 5)
 */
export function createFormattedSheet(
  title: string,
  mainHeaders: { title: string; colSpan?: number; rowSpan?: number }[],
  subHeaders: string[],
  rows: (string | number)[][],
  columnWidths?: number[]
): XLSX.WorkSheet {
  const aoa: any[][] = [];

  // Row 0: Title Header
  aoa.push([title]);

  // Row 1: Main Header Row
  const mainHeaderRow: string[] = [];
  mainHeaders.forEach(h => {
    mainHeaderRow.push(h.title);
    const span = h.colSpan || 1;
    for (let i = 1; i < span; i++) {
      mainHeaderRow.push('');
    }
  });
  aoa.push(mainHeaderRow);

  // Row 2: Sub Header Row
  aoa.push(subHeaders);

  // Row 3+: Data Rows
  rows.forEach(r => aoa.push(r));

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);

  // Compute Merges
  const merges: XLSX.Range[] = [];
  const totalCols = subHeaders.length;

  // Title merge (Row 0 across all columns)
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(0, totalCols - 1) } });

  // Main Header Merges (Row 1 & Row 2)
  let colIdx = 0;
  mainHeaders.forEach(h => {
    const colSpan = h.colSpan || 1;
    const rowSpan = h.rowSpan || 1;

    if (colSpan > 1 || rowSpan > 1) {
      merges.push({
        s: { r: 1, c: colIdx },
        e: { r: 1 + (rowSpan - 1), c: colIdx + (colSpan - 1) }
      });
    }
    colIdx += colSpan;
  });

  worksheet['!merges'] = merges;

  // Set Column Widths
  if (columnWidths && columnWidths.length > 0) {
    worksheet['!cols'] = columnWidths.map(w => ({ wch: w }));
  } else {
    worksheet['!cols'] = Array(totalCols).fill({ wch: 18 });
  }

  return worksheet;
}

export function exportSingleSheetExcel(data: any[], fileName: string, sheetName = 'Data') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// 1. Export Data Siswa to Excel
export function exportSiswaExcel(siswaList: Siswa[]) {
  const mainHeaders = [
    { title: 'NOMOR', rowSpan: 2 },
    { title: 'NAMA', rowSpan: 2 },
    { title: 'INFORMASI AKADEMIK', colSpan: 2 },
    { title: 'INFORMASI WALI & KETERANGAN', colSpan: 3 }
  ];

  const subHeaders = ['', '', 'KELAS', 'JURUSAN', 'JENIS KELAMIN', 'NO HP WALI', 'NAMA WALI'];

  const rows = siswaList.map((s, idx) => [
    idx + 1,
    s.nama,
    s.kelas,
    s.jurusan || '-',
    s.jenisKelamin || '-',
    s.noHp || '-',
    s.namaWali || '-'
  ]);

  const worksheet = createFormattedSheet(
    'DATA SISWA SMKN 1 BUNYU',
    mainHeaders,
    subHeaders,
    rows,
    [8, 30, 15, 15, 15, 20, 25]
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');
  XLSX.writeFile(workbook, `Data_Siswa_SMKN1_Bunyu_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// 2. Export Absensi Siswa to Excel (with Summary matching user image + Detail Log)
export function exportAbsensiExcel(absensiList: Absensi[], siswaList: Siswa[] = []) {
  const workbook = XLSX.utils.book_new();

  // Compute student summary
  let targetStudents: { id: string; nama: string; kelas: string }[] = [];

  if (siswaList.length > 0) {
    targetStudents = siswaList.map(s => ({ id: s.id, nama: s.nama, kelas: s.kelas }));
  } else {
    // Unique students from absensiList
    const map = new Map<string, { id: string; nama: string; kelas: string }>();
    absensiList.forEach(a => {
      if (!map.has(a.namaSiswa)) {
        map.set(a.namaSiswa, { id: a.siswaId, nama: a.namaSiswa, kelas: a.kelas });
      }
    });
    targetStudents = Array.from(map.values());
  }

  // Build summary rows (NOMOR | NAMA | KETERANGAN: HADIR | SAKIT | IZIN | TERLAMBAT | ALPHA)
  const summaryRows = targetStudents.map((s, idx) => {
    const studentAbsensi = absensiList.filter(a => a.siswaId === s.id || a.namaSiswa === s.nama);
    const hadir = studentAbsensi.filter(a => a.status === 'Hadir').length;
    const sakit = studentAbsensi.filter(a => a.status === 'Sakit').length;
    const izin = studentAbsensi.filter(a => a.status === 'Izin').length;
    const terlambat = studentAbsensi.filter(a => a.status === 'Terlambat').length;
    const alpha = studentAbsensi.filter(a => a.status === 'Alpha').length;

    return [idx + 1, s.nama, hadir, sakit, izin, terlambat, alpha];
  });

  const summaryMainHeaders = [
    { title: 'NOMOR', rowSpan: 2 },
    { title: 'NAMA', rowSpan: 2 },
    { title: 'KETERANGAN', colSpan: 5 }
  ];

  const summarySubHeaders = ['', '', 'HADIR', 'SAKIT', 'IZIN', 'TERLAMBAT', 'ALPHA'];

  const summaryWorksheet = createFormattedSheet(
    'REKAPITULASI ABSENSI SISWA SMKN 1 BUNYU',
    summaryMainHeaders,
    summarySubHeaders,
    summaryRows,
    [8, 30, 12, 12, 12, 14, 12]
  );

  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Rekap Absensi Siswa');

  // Sheet 2: Log Detail Absensi Harian
  const logRows = absensiList.map((a, idx) => [
    idx + 1,
    a.namaSiswa,
    a.tanggal,
    a.kelas,
    a.status,
    a.catatan || '-'
  ]);

  const logMainHeaders = [
    { title: 'NOMOR', rowSpan: 2 },
    { title: 'NAMA', rowSpan: 2 },
    { title: 'DETAIL ABSENSI HARIAN', colSpan: 4 }
  ];

  const logSubHeaders = ['', '', 'TANGGAL', 'KELAS', 'STATUS', 'CATATAN'];

  const logWorksheet = createFormattedSheet(
    'LOG DETAIL ABSENSI HARIAN SMKN 1 BUNYU',
    logMainHeaders,
    logSubHeaders,
    logRows,
    [8, 30, 15, 15, 15, 30]
  );

  XLSX.utils.book_append_sheet(workbook, logWorksheet, 'Log Detail Absensi');

  XLSX.writeFile(workbook, `Laporan_Absensi_Siswa_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// 3. Export Bimbingan Konseling to Excel
export function exportKonselingExcel(konselingList: Konseling[]) {
  const mainHeaders = [
    { title: 'NOMOR', rowSpan: 2 },
    { title: 'NAMA', rowSpan: 2 },
    { title: 'DETAIL LAYANAN BIMBINGAN KONSELING', colSpan: 6 }
  ];

  const subHeaders = ['', '', 'TANGGAL', 'KELAS', 'PERMASALAHAN SISWA', 'TINDAK LANJUT & SOLUSI', 'STATUS PENYELESAIAN', 'GURU BK'];

  const rows = konselingList.map((k, idx) => [
    idx + 1,
    k.namaSiswa,
    k.tanggal,
    k.kelas,
    k.permasalahan,
    k.tindakLanjut,
    k.statusPenyelesaian || '-',
    k.guruBK
  ]);

  const worksheet = createFormattedSheet(
    'LAPORAN LAYANAN BIMBINGAN KONSELING SMKN 1 BUNYU',
    mainHeaders,
    subHeaders,
    rows,
    [8, 28, 14, 15, 35, 35, 20, 25]
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Layanan BK');
  XLSX.writeFile(workbook, `Laporan_Layanan_BK_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// 4. Export Jurnal Harian to Excel
export function exportJurnalExcel(jurnalList: JurnalHarian[]) {
  const mainHeaders = [
    { title: 'NOMOR', rowSpan: 2 },
    { title: 'GURU BK', rowSpan: 2 },
    { title: 'KETERANGAN JURNAL HARIAN', colSpan: 3 }
  ];

  const subHeaders = ['', '', 'TANGGAL', 'AKTIVITAS / KEGIATAN', 'CATATAN / HASIL'];

  const rows = jurnalList.map((j, idx) => [
    idx + 1,
    j.guruBK,
    j.tanggal,
    j.aktivitas,
    j.catatan || '-'
  ]);

  const worksheet = createFormattedSheet(
    'LAPORAN JURNAL HARIAN GURU BK SMKN 1 BUNYU',
    mainHeaders,
    subHeaders,
    rows,
    [8, 25, 14, 35, 40]
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Jurnal Harian');
  XLSX.writeFile(workbook, `Laporan_Jurnal_Harian_BK_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// 5. Export Penilaian Harian to Excel
export function exportPenilaianExcel(penilaianList: PenilaianHarian[]) {
  const mainHeaders = [
    { title: 'NOMOR', rowSpan: 2 },
    { title: 'NAMA', rowSpan: 2 },
    { title: 'KETERANGAN PENILAIAN HARIAN', colSpan: 5 }
  ];

  const subHeaders = ['', '', 'TANGGAL', 'KELAS', 'MATA PELAJARAN / ASPEK', 'NILAI', 'CATATAN'];

  const rows = penilaianList.map((p, idx) => [
    idx + 1,
    p.namaSiswa,
    p.tanggal,
    p.kelas,
    p.mataPelajaran,
    p.nilai,
    p.keterangan || '-'
  ]);

  const worksheet = createFormattedSheet(
    'LAPORAN PENILAIAN HARIAN SISWA SMKN 1 BUNYU',
    mainHeaders,
    subHeaders,
    rows,
    [8, 28, 14, 15, 25, 12, 30]
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Penilaian Harian');
  XLSX.writeFile(workbook, `Laporan_Penilaian_Harian_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// 6. Export Full Database Multi-Sheet
export function exportMultiSheetDatabaseExcel(dbData: {
  siswa: Siswa[];
  absensi: Absensi[];
  konseling: Konseling[];
  jurnal: JurnalHarian[];
  penilaian: PenilaianHarian[];
}) {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Data Siswa
  const siswaRows = dbData.siswa.map((s, idx) => [
    idx + 1,
    s.nama,
    s.kelas,
    s.jurusan || '-',
    s.jenisKelamin || '-',
    s.noHp || '-',
    s.namaWali || '-'
  ]);
  const siswaSheet = createFormattedSheet(
    'DATA SISWA SMKN 1 BUNYU',
    [
      { title: 'NOMOR', rowSpan: 2 },
      { title: 'NAMA', rowSpan: 2 },
      { title: 'INFORMASI AKADEMIK', colSpan: 2 },
      { title: 'INFORMASI WALI & KETERANGAN', colSpan: 3 }
    ],
    ['', '', 'KELAS', 'JURUSAN', 'JENIS KELAMIN', 'NO HP WALI', 'NAMA WALI'],
    siswaRows,
    [8, 30, 15, 15, 15, 20, 25]
  );
  XLSX.utils.book_append_sheet(workbook, siswaSheet, 'Data Siswa');

  // Sheet 2: Absensi Siswa Summary
  const targetStudents = dbData.siswa.length > 0
    ? dbData.siswa.map(s => ({ id: s.id, nama: s.nama }))
    : Array.from(new Set(dbData.absensi.map(a => a.namaSiswa))).map(nama => ({ id: nama, nama }));

  const absensiSummaryRows = targetStudents.map((s, idx) => {
    const studentAbsensi = dbData.absensi.filter(a => a.siswaId === s.id || a.namaSiswa === s.nama);
    return [
      idx + 1,
      s.nama,
      studentAbsensi.filter(a => a.status === 'Hadir').length,
      studentAbsensi.filter(a => a.status === 'Sakit').length,
      studentAbsensi.filter(a => a.status === 'Izin').length,
      studentAbsensi.filter(a => a.status === 'Terlambat').length,
      studentAbsensi.filter(a => a.status === 'Alpha').length
    ];
  });
  const absensiSheet = createFormattedSheet(
    'REKAPITULASI ABSENSI SISWA SMKN 1 BUNYU',
    [
      { title: 'NOMOR', rowSpan: 2 },
      { title: 'NAMA', rowSpan: 2 },
      { title: 'KETERANGAN', colSpan: 5 }
    ],
    ['', '', 'HADIR', 'SAKIT', 'IZIN', 'TERLAMBAT', 'ALPHA'],
    absensiSummaryRows,
    [8, 30, 12, 12, 12, 14, 12]
  );
  XLSX.utils.book_append_sheet(workbook, absensiSheet, 'Absensi Siswa');

  // Sheet 3: Bimbingan Konseling
  const konselingRows = dbData.konseling.map((k, idx) => [
    idx + 1,
    k.namaSiswa,
    k.tanggal,
    k.kelas,
    k.permasalahan,
    k.tindakLanjut,
    k.statusPenyelesaian || '-',
    k.guruBK
  ]);
  const konselingSheet = createFormattedSheet(
    'LAPORAN LAYANAN BIMBINGAN KONSELING SMKN 1 BUNYU',
    [
      { title: 'NOMOR', rowSpan: 2 },
      { title: 'NAMA', rowSpan: 2 },
      { title: 'DETAIL LAYANAN BIMBINGAN KONSELING', colSpan: 6 }
    ],
    ['', '', 'TANGGAL', 'KELAS', 'PERMASALAHAN SISWA', 'TINDAK LANJUT & SOLUSI', 'STATUS PENYELESAIAN', 'GURU BK'],
    konselingRows,
    [8, 28, 14, 15, 35, 35, 20, 25]
  );
  XLSX.utils.book_append_sheet(workbook, konselingSheet, 'Bimbingan Konseling');

  // Sheet 4: Jurnal Harian
  const jurnalRows = dbData.jurnal.map((j, idx) => [
    idx + 1,
    j.guruBK,
    j.tanggal,
    j.aktivitas,
    j.catatan || '-'
  ]);
  const jurnalSheet = createFormattedSheet(
    'LAPORAN JURNAL HARIAN GURU BK SMKN 1 BUNYU',
    [
      { title: 'NOMOR', rowSpan: 2 },
      { title: 'GURU BK', rowSpan: 2 },
      { title: 'KETERANGAN JURNAL HARIAN', colSpan: 3 }
    ],
    ['', '', 'TANGGAL', 'AKTIVITAS / KEGIATAN', 'CATATAN / HASIL'],
    jurnalRows,
    [8, 25, 14, 35, 40]
  );
  XLSX.utils.book_append_sheet(workbook, jurnalSheet, 'Jurnal Harian');

  // Sheet 5: Penilaian Harian
  const penilaianRows = dbData.penilaian.map((p, idx) => [
    idx + 1,
    p.namaSiswa,
    p.tanggal,
    p.kelas,
    p.mataPelajaran,
    p.nilai,
    p.keterangan || '-'
  ]);
  const penilaianSheet = createFormattedSheet(
    'LAPORAN PENILAIAN HARIAN SISWA SMKN 1 BUNYU',
    [
      { title: 'NOMOR', rowSpan: 2 },
      { title: 'NAMA', rowSpan: 2 },
      { title: 'KETERANGAN PENILAIAN HARIAN', colSpan: 5 }
    ],
    ['', '', 'TANGGAL', 'KELAS', 'MATA PELAJARAN / ASPEK', 'NILAI', 'CATATAN'],
    penilaianRows,
    [8, 28, 14, 15, 25, 12, 30]
  );
  XLSX.utils.book_append_sheet(workbook, penilaianSheet, 'Penilaian Harian');

  XLSX.writeFile(workbook, `BK_SMKN1_BUNYU_REKAP_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// 7. Download Template Excel Data Siswa
export function downloadTemplateExcelSiswa() {
  const sampleRowsFormat1 = [
    [1, 'Ahmad Najib', 'X TO 1'],
    [2, 'Ahmad Zulkifli Resi', 'X TO 1'],
    [3, 'Muhammad Nizar Patahillah', 'X TO 1'],
    [4, 'Alif Purnama', 'X TO 1'],
    [5, 'Aulia Fitriani', 'X TO 1'],
    [6, 'Devghan Langit Almansyah', 'X TO 1'],
    [7, 'Dhanil Daeng Tata', 'X TO 1']
  ];

  const headers = ['NOMOR', 'NAMA', 'KELAS+JURUSAN'];

  const aoa = [headers, ...sampleRowsFormat1];
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  worksheet['!cols'] = [{ wch: 10 }, { wch: 32 }, { wch: 20 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');
  XLSX.writeFile(workbook, 'Template_Format_Data_Siswa_SMKN1_Bunyu.xlsx');
}

// 8. Excel Import Parser
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
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) {
          reject(new Error('File tidak dapat dibaca'));
          return;
        }

        const workbook = XLSX.read(buffer, { type: 'array' });

        const result = {
          siswa: [] as Siswa[],
          absensi: [] as Absensi[],
          konseling: [] as Konseling[],
          jurnal: [] as JurnalHarian[],
          penilaian: [] as PenilaianHarian[],
        };

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) continue;

          const sheetRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          if (!sheetRows || sheetRows.length === 0) continue;

          // Search header row and column indexes
          let headerRowIndex = -1;
          let nameColIdx = -1;
          let nisColIdx = -1;
          let kelasColIdx = -1;

          for (let r = 0; r < Math.min(sheetRows.length, 25); r++) {
            const rowCells = sheetRows[r];
            if (!Array.isArray(rowCells)) continue;

            for (let c = 0; c < rowCells.length; c++) {
              const val = String(rowCells[c] || '').toLowerCase().trim();
              if (val.includes('nama') || val.includes('siswa') || val.includes('peserta')) {
                if (nameColIdx === -1 && val !== 'nama wali') nameColIdx = c;
              }
              if (val.includes('nomor') || val.includes('nis') || val.includes('no') || val === 'no' || val === 'nrp') {
                if (nisColIdx === -1 && !val.includes('nama')) nisColIdx = c;
              }
              if (val.includes('kelas') || val.includes('jurusan') || val.includes('rombel') || val.includes('proli')) {
                if (kelasColIdx === -1) kelasColIdx = c;
              }
            }

            if (nameColIdx !== -1) {
              headerRowIndex = r;
              break;
            }
          }

          // Positional fallback if header keywords weren't detected
          if (headerRowIndex === -1) {
            for (let r = 0; r < Math.min(sheetRows.length, 5); r++) {
              const row = sheetRows[r];
              if (Array.isArray(row) && row.length >= 2) {
                const c1 = String(row[1] || '').trim();
                if (c1 && c1.length > 2 && !c1.toLowerCase().includes('nama')) {
                  headerRowIndex = r - 1;
                  nisColIdx = 0;
                  nameColIdx = 1;
                  kelasColIdx = row.length >= 3 ? 2 : -1;
                  break;
                }
              }
            }
          }

          let parsedInThisSheet = false;

          const startR = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;
          const actualNisIdx = nisColIdx !== -1 ? nisColIdx : 0;
          const actualNameIdx = nameColIdx !== -1 ? nameColIdx : 1;
          const actualKelasIdx = kelasColIdx !== -1 ? kelasColIdx : 2;

          for (let r = startR; r < sheetRows.length; r++) {
            const row = sheetRows[r];
            if (!Array.isArray(row)) continue;

            const rawNama = String(row[actualNameIdx] || '').trim();
            if (!rawNama) continue;

            const lowerNama = rawNama.toLowerCase();
            if (
              lowerNama === 'nama' ||
              lowerNama === 'nama siswa' ||
              lowerNama === 'namasiswa' ||
              lowerNama === 'keterangan' ||
              lowerNama === 'informasi akademik' ||
              lowerNama === 'informasi wali & keterangan' ||
              lowerNama.startsWith('jumlah') ||
              lowerNama.startsWith('total') ||
              lowerNama.startsWith('rekap') ||
              lowerNama.startsWith('template') ||
              lowerNama.startsWith('data siswa')
            ) {
              continue;
            }

            const rawNomor = String(row[actualNisIdx] || '').trim();
            const rawKelasJurusan = String(row[actualKelasIdx] || '').trim();

            const nomor = rawNomor || String(result.siswa.length + 1);
            const kelas = rawKelasJurusan || 'X-TGP';

            result.siswa.push({
              id: `imp-sw-${Date.now()}-${result.siswa.length + 1}`,
              nomor,
              nama: rawNama,
              kelas,
              jurusan: kelas,
              createdAt: new Date().toISOString()
            });
            parsedInThisSheet = true;
          }

          if (!parsedInThisSheet) {
            const rawObjects: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
            rawObjects.forEach((rowObj, idx) => {
              if (typeof rowObj !== 'object' || !rowObj) return;

              let namaVal = '';
              let nisVal = '';
              let kelasVal = '';

              for (const [key, val] of Object.entries(rowObj)) {
                const kLower = key.toLowerCase().trim();
                const strVal = String(val || '').trim();

                if (!namaVal && (kLower.includes('nama') || kLower.includes('siswa')) && !kLower.includes('wali')) {
                  namaVal = strVal;
                } else if (!nisVal && (kLower.includes('nomor') || kLower.includes('nis') || kLower === 'no')) {
                  nisVal = strVal;
                } else if (!kelasVal && (kLower.includes('kelas') || kLower.includes('jurusan') || kLower.includes('rombel'))) {
                  kelasVal = strVal;
                }
              }

              if (namaVal && !namaVal.toLowerCase().startsWith('jumlah') && namaVal.toLowerCase() !== 'nama' && namaVal.toLowerCase() !== 'keterangan') {
                const nomor = nisVal || String(result.siswa.length + 1);
                const kelas = kelasVal || 'X-TGP';

                result.siswa.push({
                  id: `imp-sw-obj-${Date.now()}-${idx}`,
                  nomor,
                  nama: namaVal,
                  kelas,
                  jurusan: kelas,
                  createdAt: new Date().toISOString()
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
    reader.readAsArrayBuffer(file);
  });
}

