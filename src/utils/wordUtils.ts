import { Siswa, Absensi, Konseling, JurnalHarian, PenilaianHarian } from '../types';

function createWordDocumentHtml(title: string, tableHtml: string): string {
  return `
    <html xmlns:o="urn:schemas-microsoft-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 1.5cm;
        }
        body {
          font-family: 'Calibri', 'Arial', sans-serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #000000;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          border-bottom: 3px double #000000;
          margin-bottom: 15px;
        }
        .header-table td {
          text-align: center;
          padding: 4px;
        }
        .school-title {
          font-size: 14pt;
          font-weight: bold;
          text-transform: uppercase;
        }
        .school-sub {
          font-size: 11pt;
          font-weight: bold;
        }
        .school-address {
          font-size: 9pt;
          font-style: italic;
        }
        .doc-title {
          text-align: center;
          font-size: 13pt;
          font-weight: bold;
          text-decoration: underline;
          margin-top: 15px;
          margin-bottom: 15px;
          text-transform: uppercase;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .data-table th, .data-table td {
          border: 1px solid #000000;
          padding: 6px 8px;
          font-size: 10pt;
          vertical-align: middle;
        }
        .data-table th {
          background-color: #f3f4f6;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .signature-section {
          margin-top: 40px;
          width: 100%;
        }
        .signature-table {
          width: 100%;
          border-collapse: collapse;
        }
        .signature-table td {
          text-align: center;
          vertical-align: top;
          width: 50%;
          font-size: 10pt;
        }
      </style>
    </head>
    <body>
      <table class="header-table">
        <tr>
          <td>
            <div class="school-sub">PEMERINTAH PROVINSI KALIMANTAN UTARA</div>
            <div class="school-sub">DINAS PENDIDIKAN DAN KEBUDAYAAN</div>
            <div class="school-title">SMK NEGERI 1 BUNYU</div>
            <div class="school-address">Jl. Poros Bunyu, Kec. Bunyu, Kab. Bulungan, Kalimantan Utara</div>
          </td>
        </tr>
      </table>

      <div class="doc-title">${title}</div>

      ${tableHtml}

      <div class="signature-section">
        <table class="signature-table">
          <tr>
            <td>
              <br>Mengetahui,<br>Kepala SMKN 1 Bunyu<br><br><br><br><br>
              <b>________________________</b><br>NIP. -
            </td>
            <td>
              Bunyu, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br>Guru Bimbingan Konseling<br><br><br><br><br>
              <b>Drs. H. M. Syarif, M.Pd</b><br>NIP. 19680512 199403 1 008
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;
}

function triggerWordDownload(htmlContent: string, filename: string) {
  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 1. Export Absensi Siswa to Word (matching user's 2-row merged header image)
export function exportAbsensiWord(absensiList: Absensi[], kelasInfo?: string, tanggalInfo?: string, siswaList: Siswa[] = []) {
  // Compute student summary
  let targetStudents: { id: string; nama: string; kelas: string }[] = [];

  if (siswaList.length > 0) {
    targetStudents = siswaList.map(s => ({ id: s.id, nama: s.nama, kelas: s.kelas }));
  } else {
    const map = new Map<string, { id: string; nama: string; kelas: string }>();
    absensiList.forEach(a => {
      if (!map.has(a.namaSiswa)) {
        map.set(a.namaSiswa, { id: a.siswaId, nama: a.namaSiswa, kelas: a.kelas });
      }
    });
    targetStudents = Array.from(map.values());
  }

  let rekapRowsHtml = '';
  targetStudents.forEach((student, index) => {
    const studentAbsensi = absensiList.filter(a => a.siswaId === student.id || a.namaSiswa === student.nama);
    const hadir = studentAbsensi.filter(a => a.status === 'Hadir').length;
    const sakit = studentAbsensi.filter(a => a.status === 'Sakit').length;
    const izin = studentAbsensi.filter(a => a.status === 'Izin').length;
    const terlambat = studentAbsensi.filter(a => a.status === 'Terlambat').length;
    const alpha = studentAbsensi.filter(a => a.status === 'Alpha').length;

    rekapRowsHtml += `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td><b>${student.nama}</b></td>
        <td class="text-center">${hadir}</td>
        <td class="text-center">${sakit}</td>
        <td class="text-center">${izin}</td>
        <td class="text-center">${terlambat}</td>
        <td class="text-center">${alpha}</td>
      </tr>
    `;
  });

  const tableHtml = `
    <p style="font-size: 10pt; margin-bottom: 8px;">
      <b>Filter / Keterangan:</b> ${kelasInfo ? `Kelas: ${kelasInfo} | ` : ''} ${tanggalInfo ? `Tanggal: ${tanggalInfo}` : 'Semua Rekap'}
    </p>
    <table class="data-table">
      <thead>
        <tr>
          <th rowspan="2" style="width: 50px;">NOMOR</th>
          <th rowspan="2">NAMA</th>
          <th colspan="5">KETERANGAN</th>
        </tr>
        <tr>
          <th style="width: 60px;">HADIR</th>
          <th style="width: 60px;">SAKIT</th>
          <th style="width: 60px;">IZIN</th>
          <th style="width: 80px;">TERLAMBAT</th>
          <th style="width: 60px;">ALPHA</th>
        </tr>
      </thead>
      <tbody>
        ${rekapRowsHtml || '<tr><td colspan="7" class="text-center">Tidak ada data rekapitulasi absensi.</td></tr>'}
      </tbody>
    </table>
  `;

  const docHtml = createWordDocumentHtml('REKAPITULASI ABSENSI SISWA', tableHtml);
  triggerWordDownload(docHtml, 'Laporan_Absensi_Siswa');
}

// 2. Export Bimbingan Konseling to Word
export function exportKonselingWord(konselingList: Konseling[]) {
  let rowsHtml = '';
  konselingList.forEach((item, index) => {
    rowsHtml += `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td><b>${item.namaSiswa}</b></td>
        <td class="text-center">${item.tanggal}</td>
        <td class="text-center">${item.kelas}</td>
        <td>${item.permasalahan}</td>
        <td>${item.tindakLanjut}</td>
        <td class="text-center"><b>${item.statusPenyelesaian || '-'}</b></td>
        <td class="text-center">${item.guruBK}</td>
      </tr>
    `;
  });

  const tableHtml = `
    <table class="data-table">
      <thead>
        <tr>
          <th rowspan="2" style="width: 40px;">NOMOR</th>
          <th rowspan="2" style="width: 140px;">NAMA</th>
          <th colspan="6">DETAIL LAYANAN BIMBINGAN KONSELING</th>
        </tr>
        <tr>
          <th style="width: 80px;">TANGGAL</th>
          <th style="width: 80px;">KELAS</th>
          <th>PERMASALAHAN SISWA</th>
          <th>TINDAK LANJUT & SOLUSI</th>
          <th style="width: 90px;">STATUS</th>
          <th style="width: 120px;">GURU BK</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="8" class="text-center">Tidak ada data layanan BK.</td></tr>'}
      </tbody>
    </table>
  `;

  const docHtml = createWordDocumentHtml('LAPORAN LAYANAN BIMBINGAN KONSELING', tableHtml);
  triggerWordDownload(docHtml, 'Laporan_Layanan_BK');
}

// 3. Export Jurnal Harian to Word
export function exportJurnalWord(jurnalList: JurnalHarian[]) {
  let rowsHtml = '';
  jurnalList.forEach((item, index) => {
    rowsHtml += `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td><b>${item.guruBK}</b></td>
        <td class="text-center">${item.tanggal}</td>
        <td>${item.aktivitas}</td>
        <td>${item.catatan || '-'}</td>
      </tr>
    `;
  });

  const tableHtml = `
    <table class="data-table">
      <thead>
        <tr>
          <th rowspan="2" style="width: 40px;">NOMOR</th>
          <th rowspan="2" style="width: 140px;">GURU BK</th>
          <th colspan="3">KETERANGAN JURNAL HARIAN</th>
        </tr>
        <tr>
          <th style="width: 90px;">TANGGAL</th>
          <th>AKTIVITAS / KEGIATAN</th>
          <th>CATATAN / HASIL</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="5" class="text-center">Tidak ada data jurnal harian.</td></tr>'}
      </tbody>
    </table>
  `;

  const docHtml = createWordDocumentHtml('JURNAL HARIAN GURU BK', tableHtml);
  triggerWordDownload(docHtml, 'Laporan_Jurnal_Harian_BK');
}

// 4. Export Penilaian Harian to Word
export function exportPenilaianWord(penilaianList: PenilaianHarian[]) {
  let rowsHtml = '';
  penilaianList.forEach((item, index) => {
    rowsHtml += `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td><b>${item.namaSiswa}</b></td>
        <td class="text-center">${item.tanggal}</td>
        <td class="text-center">${item.kelas}</td>
        <td>${item.mataPelajaran}</td>
        <td class="text-center"><b>${item.nilai}</b></td>
        <td>${item.keterangan || '-'}</td>
      </tr>
    `;
  });

  const tableHtml = `
    <table class="data-table">
      <thead>
        <tr>
          <th rowspan="2" style="width: 40px;">NOMOR</th>
          <th rowspan="2" style="width: 140px;">NAMA</th>
          <th colspan="5">KETERANGAN PENILAIAN HARIAN</th>
        </tr>
        <tr>
          <th style="width: 80px;">TANGGAL</th>
          <th style="width: 80px;">KELAS</th>
          <th>ASPEK / MATA PELAJARAN</th>
          <th style="width: 50px;">NILAI</th>
          <th>CATATAN</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="7" class="text-center">Tidak ada data penilaian.</td></tr>'}
      </tbody>
    </table>
  `;

  const docHtml = createWordDocumentHtml('LAPORAN PENILAIAN HARIAN SISWA', tableHtml);
  triggerWordDownload(docHtml, 'Laporan_Penilaian_Harian');
}

// 5. Export Data Siswa to Word
export function exportSiswaWord(siswaList: Siswa[]) {
  let rowsHtml = '';
  siswaList.forEach((item, index) => {
    rowsHtml += `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td><b>${item.nama}</b></td>
        <td class="text-center">${item.kelas}</td>
        <td class="text-center">${item.jurusan || '-'}</td>
        <td class="text-center">${item.jenisKelamin || '-'}</td>
        <td class="text-center">${item.noHp || '-'}</td>
        <td>${item.namaWali || '-'}</td>
      </tr>
    `;
  });

  const tableHtml = `
    <table class="data-table">
      <thead>
        <tr>
          <th rowspan="2" style="width: 40px;">NOMOR</th>
          <th rowspan="2">NAMA</th>
          <th colspan="2">INFORMASI AKADEMIK</th>
          <th colspan="3">INFORMASI WALI & KETERANGAN</th>
        </tr>
        <tr>
          <th style="width: 80px;">KELAS</th>
          <th style="width: 80px;">JURUSAN</th>
          <th style="width: 70px;">JK</th>
          <th style="width: 100px;">NO HP WALI</th>
          <th>NAMA WALI</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="7" class="text-center">Tidak ada data siswa.</td></tr>'}
      </tbody>
    </table>
  `;

  const docHtml = createWordDocumentHtml('DATA SISWA SMKN 1 BUNYU', tableHtml);
  triggerWordDownload(docHtml, 'Data_Siswa_SMKN1_Bunyu');
}

