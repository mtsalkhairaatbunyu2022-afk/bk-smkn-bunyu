import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { Siswa, Absensi, Konseling, JurnalHarian, PenilaianHarian, KolaborasiGuru } from '../types';

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

// 1. Export Data Siswa to Excel (Filtered)
export function exportSiswaExcel(siswaList: Siswa[], kelasInfo?: string) {
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
    `DATA SISWA SMKN 1 BUNYU ${kelasInfo ? `(KELAS ${kelasInfo})` : ''}`,
    mainHeaders,
    subHeaders,
    rows,
    [8, 30, 15, 15, 15, 20, 25]
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');
  XLSX.writeFile(workbook, `Data_Siswa_${kelasInfo ? kelasInfo.replace(/[^a-zA-Z0-9]/g, '_') : 'Semua'}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// 2. Export Absensi Siswa to Excel (Filtered by Selected Class & Date/Month)
export function exportAbsensiExcel(
  absensiList: Absensi[],
  siswaList: Siswa[] = [],
  kelasInfo?: string,
  periodeInfo?: string
) {
  const workbook = XLSX.utils.book_new();

  // Compute student summary from filtered target students
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

  // Build summary rows (NOMOR | NAMA | KELAS | HADIR | SAKIT | IZIN | TERLAMBAT | ALPHA)
  const summaryRows = targetStudents.map((s, idx) => {
    const studentAbsensi = absensiList.filter(a => a.siswaId === s.id || a.namaSiswa === s.nama);
    const hadir = studentAbsensi.filter(a => a.status === 'Hadir').length;
    const sakit = studentAbsensi.filter(a => a.status === 'Sakit').length;
    const izin = studentAbsensi.filter(a => a.status === 'Izin').length;
    const terlambat = studentAbsensi.filter(a => a.status === 'Terlambat').length;
    const alpha = studentAbsensi.filter(a => a.status === 'Alpha').length;

    return [idx + 1, s.nama, s.kelas, hadir, sakit, izin, terlambat, alpha];
  });

  const summaryMainHeaders = [
    { title: 'NOMOR', rowSpan: 2 },
    { title: 'NAMA', rowSpan: 2 },
    { title: 'KELAS', rowSpan: 2 },
    { title: 'KETERANGAN REKAPITULASI KEHADIRAN', colSpan: 5 }
  ];

  const summarySubHeaders = ['', '', '', 'HADIR', 'SAKIT', 'IZIN', 'TERLAMBAT', 'ALPHA'];

  const summaryWorksheet = createFormattedSheet(
    `REKAPITULASI ABSENSI SISWA SMKN 1 BUNYU ${kelasInfo ? `(KELAS ${kelasInfo})` : ''} ${periodeInfo ? `(${periodeInfo})` : ''}`,
    summaryMainHeaders,
    summarySubHeaders,
    summaryRows,
    [8, 30, 15, 12, 12, 12, 14, 12]
  );

  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Rekap Absensi Siswa');

  // Sheet 2: Log Detail Absensi Harian (Filtered)
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
    `LOG DETAIL ABSENSI HARIAN SMKN 1 BUNYU ${kelasInfo ? `(KELAS ${kelasInfo})` : ''}`,
    logMainHeaders,
    logSubHeaders,
    logRows,
    [8, 30, 15, 15, 15, 30]
  );

  XLSX.utils.book_append_sheet(workbook, logWorksheet, 'Log Detail Absensi');

  XLSX.writeFile(workbook, `Laporan_Absensi_${kelasInfo ? kelasInfo.replace(/[^a-zA-Z0-9]/g, '_') : 'Semua'}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// 3. Export Filtered Bimbingan Konseling to Excel (Native .xlsx Binary with Embedded Images)
export async function exportKonselingExcel(konselingList: Konseling[], filterInfo?: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Layanan BK');

  worksheet.views = [{ showGridLines: true }];

  // Title Headers
  worksheet.mergeCells('A1:I1');
  const title1 = worksheet.getCell('A1');
  title1.value = 'PEMERINTAH PROVINSI KALIMANTAN UTARA - DINAS PENDIDIKAN DAN KEBUDAYAAN';
  title1.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFD700' } };
  title1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1B47' } };
  title1.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A2:I2');
  const title2 = worksheet.getCell('A2');
  title2.value = 'SMK NEGERI 1 BUNYU';
  title2.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  title2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1B47' } };
  title2.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A3:I3');
  const title3 = worksheet.getCell('A3');
  title3.value = 'Alamat: Jl. Pendidikan No. 1, Pulau Bunyu, Kab. Bulungan, Kalimantan Utara | Email: smkn1bunyu@gmail.com';
  title3.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF334155' } };
  title3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  title3.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A5:I5');
  const title4 = worksheet.getCell('A5');
  title4.value = 'LAPORAN LAYANAN BIMBINGAN DAN KONSELING';
  title4.font = { name: 'Calibri', size: 13, bold: true, underline: true, color: { argb: 'FF0B1B47' } };
  title4.alignment = { horizontal: 'center', vertical: 'middle' };

  if (filterInfo) {
    worksheet.mergeCells('A6:I6');
    const title5 = worksheet.getCell('A6');
    title5.value = `Filter Data: ${filterInfo} | Total: ${konselingList.length} Layanan`;
    title5.font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FF475569' } };
    title5.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  // Header Row 8
  const headerRow = worksheet.getRow(8);
  headerRow.values = [
    'NO',
    'NAMA SISWA',
    'TANGGAL',
    'KELAS',
    'PERMASALAHAN SISWA',
    'TINDAK LANJUT & SOLUSI',
    'STATUS',
    'GURU BK',
    'FOTO BUKTI'
  ];
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFD700' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1B47' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });

  // Set Column Widths
  worksheet.columns = [
    { key: 'no', width: 6 },
    { key: 'nama', width: 25 },
    { key: 'tanggal', width: 14 },
    { key: 'kelas', width: 12 },
    { key: 'permasalahan', width: 35 },
    { key: 'tindakLanjut', width: 35 },
    { key: 'status', width: 14 },
    { key: 'guruBK', width: 22 },
    { key: 'foto', width: 22 }
  ];

  let startRow = 9;

  for (let idx = 0; idx < konselingList.length; idx++) {
    const k = konselingList[idx];
    const currentRowIdx = startRow + idx;
    const row = worksheet.getRow(currentRowIdx);

    row.values = [
      idx + 1,
      k.namaSiswa,
      k.tanggal,
      k.kelas,
      k.permasalahan,
      k.tindakLanjut,
      k.statusPenyelesaian || '-',
      k.guruBK,
      k.fotoDokumentasi ? '' : '(Tidak Ada Foto)'
    ];

    row.height = k.fotoDokumentasi ? 65 : 28;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 9.5 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };

      if (colNumber === 1 || colNumber === 3 || colNumber === 4 || colNumber === 7 || colNumber === 9) {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      }
    });

    // Embed Native Image via ExcelJS if fotoDokumentasi exists
    if (k.fotoDokumentasi) {
      try {
        const isPng = k.fotoDokumentasi.includes('png');
        const imageId = workbook.addImage({
          base64: k.fotoDokumentasi,
          extension: isPng ? 'png' : 'jpeg'
        });

        worksheet.addImage(imageId, {
          tl: { col: 8.1, row: currentRowIdx - 1 + 0.1 },
          ext: { width: 110, height: 75 },
          editAs: 'oneCell'
        });
      } catch (err) {
        console.warn('Failed to embed native excel image:', err);
      }
    }
  }

  // Full Photo Gallery Appendix at the bottom
  const itemsWithPhoto = konselingList.filter(item => !!item.fotoDokumentasi);
  if (itemsWithPhoto.length > 0) {
    let appendixRowIdx = startRow + konselingList.length + 2;

    worksheet.mergeCells(`A${appendixRowIdx}:I${appendixRowIdx}`);
    const appHeader = worksheet.getCell(`A${appendixRowIdx}`);
    appHeader.value = `LAMPIRAN BUKTI DOKUMENTASI FOTO LAYANAN BK (${itemsWithPhoto.length} FOTO TERLAMPIR)`;
    appHeader.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFD700' } };
    appHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1B47' } };
    appHeader.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(appendixRowIdx).height = 30;

    appendixRowIdx += 1;

    for (const item of itemsWithPhoto) {
      const cardStartRow = appendixRowIdx;
      worksheet.mergeCells(`A${cardStartRow}:C${cardStartRow + 4}`);
      worksheet.mergeCells(`D${cardStartRow}:I${cardStartRow + 4}`);

      worksheet.getRow(cardStartRow).height = 24;
      worksheet.getRow(cardStartRow + 1).height = 24;
      worksheet.getRow(cardStartRow + 2).height = 24;
      worksheet.getRow(cardStartRow + 3).height = 24;
      worksheet.getRow(cardStartRow + 4).height = 24;

      const descCell = worksheet.getCell(`D${cardStartRow}`);
      descCell.value = `NAMA: ${item.namaSiswa} (${item.kelas})\nTANGGAL: ${item.tanggal} | STATUS: ${item.statusPenyelesaian || '-'}\nGURU BK: ${item.guruBK}\nPERMASALAHAN: ${item.permasalahan}\nTINDAK LANJUT: ${item.tindakLanjut}`;
      descCell.font = { name: 'Calibri', size: 10 };
      descCell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

      if (item.fotoDokumentasi) {
        try {
          const isPng = item.fotoDokumentasi.includes('png');
          const imageId = workbook.addImage({
            base64: item.fotoDokumentasi,
            extension: isPng ? 'png' : 'jpeg'
          });

          worksheet.addImage(imageId, {
            tl: { col: 0.1, row: cardStartRow - 1 + 0.1 },
            ext: { width: 180, height: 115 },
            editAs: 'oneCell'
          });
        } catch (err) {
          console.warn('Failed to embed appendix image into Excel:', err);
        }
      }

      appendixRowIdx += 6;
    }
  }

  // Export buffer & download .xlsx
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan_Layanan_BK_${filterInfo ? filterInfo.replace(/[^a-zA-Z0-9]/g, '_') : 'Semua'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 4. Export Filtered Jurnal Harian to Excel
export function exportJurnalExcel(jurnalList: JurnalHarian[], filterInfo?: string) {
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
    `LAPORAN JURNAL HARIAN GURU BK SMKN 1 BUNYU ${filterInfo ? `(${filterInfo})` : ''}`,
    mainHeaders,
    subHeaders,
    rows,
    [8, 25, 14, 35, 40]
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Jurnal Harian');
  XLSX.writeFile(workbook, `Laporan_Jurnal_Harian_BK_${filterInfo ? filterInfo.replace(/[^a-zA-Z0-9]/g, '_') : 'Semua'}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// 5. Export Filtered Penilaian Harian to Excel
export function exportPenilaianExcel(penilaianList: PenilaianHarian[], filterInfo?: string) {
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
    `LAPORAN PENILAIAN HARIAN SISWA SMKN 1 BUNYU ${filterInfo ? `(${filterInfo})` : ''}`,
    mainHeaders,
    subHeaders,
    rows,
    [8, 28, 14, 15, 25, 12, 30]
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Penilaian Harian');
  XLSX.writeFile(workbook, `Laporan_Penilaian_Harian_${filterInfo ? filterInfo.replace(/[^a-zA-Z0-9]/g, '_') : 'Semua'}_${new Date().toISOString().split('T')[0]}.xlsx`);
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

// 7. Export Kolaborasi BK & Rekan Guru to Excel (Native .xlsx with Embedded Images)
export async function exportKolaborasiExcel(kolaborasiList: KolaborasiGuru[], filterInfo?: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Kolaborasi BK & Guru');

  worksheet.views = [{ showGridLines: true }];

  // Title Headers
  worksheet.mergeCells('A1:J1');
  const title1 = worksheet.getCell('A1');
  title1.value = 'PEMERINTAH PROVINSI KALIMANTAN UTARA - DINAS PENDIDIKAN DAN KEBUDAYAAN';
  title1.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFD700' } };
  title1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1B47' } };
  title1.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A2:J2');
  const title2 = worksheet.getCell('A2');
  title2.value = 'SMK NEGERI 1 BUNYU';
  title2.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  title2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1B47' } };
  title2.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A3:J3');
  const title3 = worksheet.getCell('A3');
  title3.value = 'Alamat: Jl. Pendidikan No. 1, Pulau Bunyu, Kab. Bulungan, Kalimantan Utara | Email: smkn1bunyu@gmail.com';
  title3.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF334155' } };
  title3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  title3.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A5:J5');
  const title4 = worksheet.getCell('A5');
  title4.value = 'LAPORAN KOLABORASI PENYELESAIAN MASALAH SISWA (BK & REKAN GURU)';
  title4.font = { name: 'Calibri', size: 13, bold: true, underline: true, color: { argb: 'FF0B1B47' } };
  title4.alignment = { horizontal: 'center', vertical: 'middle' };

  if (filterInfo) {
    worksheet.mergeCells('A6:J6');
    const title5 = worksheet.getCell('A6');
    title5.value = `Filter Data: ${filterInfo} | Total: ${kolaborasiList.length} Kegiatan Kolaborasi`;
    title5.font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FF475569' } };
    title5.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  // Header Row 8
  const headerRow = worksheet.getRow(8);
  headerRow.values = [
    'NO',
    'NAMA SISWA',
    'KELAS',
    'TANGGAL',
    'MITRA KOLABORASI',
    'NAMA REKAN GURU',
    'BENTUK KOLABORASI & PERMASALAHAN',
    'KESEPAKATAN SOLUSI',
    'STATUS',
    'FOTO BUKTI'
  ];
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFD700' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1B47' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });

  worksheet.columns = [
    { key: 'no', width: 6 },
    { key: 'nama', width: 25 },
    { key: 'kelas', width: 12 },
    { key: 'tanggal', width: 14 },
    { key: 'mitra', width: 22 },
    { key: 'rekan', width: 24 },
    { key: 'masalah', width: 32 },
    { key: 'solusi', width: 35 },
    { key: 'status', width: 18 },
    { key: 'foto', width: 22 }
  ];

  let startRow = 9;

  for (let idx = 0; idx < kolaborasiList.length; idx++) {
    const k = kolaborasiList[idx];
    const currentRowIdx = startRow + idx;
    const row = worksheet.getRow(currentRowIdx);

    row.values = [
      idx + 1,
      k.namaSiswa,
      k.kelas,
      k.tanggal,
      k.mitraKolaborasi,
      k.namaRekanGuru,
      `[${k.bentukKolaborasi}] ${k.permasalahan}`,
      k.rencanaSolusi,
      k.statusPenyelesaian || '-',
      k.fotoDokumentasi ? '' : '(Tidak Ada Foto)'
    ];

    row.height = k.fotoDokumentasi ? 65 : 28;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 9.5 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };

      if (colNumber === 1 || colNumber === 3 || colNumber === 4 || colNumber === 9 || colNumber === 10) {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      }
    });

    if (k.fotoDokumentasi) {
      try {
        const isPng = k.fotoDokumentasi.includes('png');
        const imageId = workbook.addImage({
          base64: k.fotoDokumentasi,
          extension: isPng ? 'png' : 'jpeg'
        });

        worksheet.addImage(imageId, {
          tl: { col: 9.1, row: currentRowIdx - 1 + 0.1 },
          ext: { width: 110, height: 75 },
          editAs: 'oneCell'
        });
      } catch (err) {
        console.warn('Failed to embed native excel image in kolaborasi:', err);
      }
    }
  }

  // Full Photo Gallery Appendix
  const itemsWithPhoto = kolaborasiList.filter(item => !!item.fotoDokumentasi);
  if (itemsWithPhoto.length > 0) {
    let appendixRowIdx = startRow + kolaborasiList.length + 2;

    worksheet.mergeCells(`A${appendixRowIdx}:J${appendixRowIdx}`);
    const appHeader = worksheet.getCell(`A${appendixRowIdx}`);
    appHeader.value = `LAMPIRAN BUKTI DOKUMENTASI FOTO KOLABORASI GURU (${itemsWithPhoto.length} FOTO TERLAMPIR)`;
    appHeader.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFD700' } };
    appHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1B47' } };
    appHeader.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(appendixRowIdx).height = 30;

    appendixRowIdx += 1;

    for (const item of itemsWithPhoto) {
      const cardStartRow = appendixRowIdx;
      worksheet.mergeCells(`A${cardStartRow}:C${cardStartRow + 4}`);
      worksheet.mergeCells(`D${cardStartRow}:J${cardStartRow + 4}`);

      worksheet.getRow(cardStartRow).height = 24;
      worksheet.getRow(cardStartRow + 1).height = 24;
      worksheet.getRow(cardStartRow + 2).height = 24;
      worksheet.getRow(cardStartRow + 3).height = 24;
      worksheet.getRow(cardStartRow + 4).height = 24;

      const descCell = worksheet.getCell(`D${cardStartRow}`);
      descCell.value = `NAMA SISWA: ${item.namaSiswa} (${item.kelas})\nTANGGAL: ${item.tanggal} | STATUS: ${item.statusPenyelesaian || '-'}\nREKAN KOLABORASI: ${item.namaRekanGuru} (${item.mitraKolaborasi})\nBENTUK & MASALAH: [${item.bentukKolaborasi}] ${item.permasalahan}\nKESEPAKATAN SOLUSI: ${item.rencanaSolusi}`;
      descCell.font = { name: 'Calibri', size: 10 };
      descCell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

      if (item.fotoDokumentasi) {
        try {
          const isPng = item.fotoDokumentasi.includes('png');
          const imageId = workbook.addImage({
            base64: item.fotoDokumentasi,
            extension: isPng ? 'png' : 'jpeg'
          });

          worksheet.addImage(imageId, {
            tl: { col: 0.1, row: cardStartRow - 1 + 0.1 },
            ext: { width: 180, height: 115 },
            editAs: 'oneCell'
          });
        } catch (err) {
          console.warn('Failed to embed appendix image into Excel:', err);
        }
      }

      appendixRowIdx += 6;
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan_Kolaborasi_Guru_BK_${filterInfo ? filterInfo.replace(/[^a-zA-Z0-9]/g, '_') : 'Semua'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

