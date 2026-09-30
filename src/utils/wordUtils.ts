import { Siswa, Absensi, Konseling, JurnalHarian, PenilaianHarian } from '../types';

function createWordDocumentHtml(title: string, tableHtml: string, subtitle?: string): string {
  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 1.2cm;
        }
        body {
          font-family: 'Calibri', 'Arial', sans-serif;
          font-size: 10pt;
          line-height: 1.4;
          color: #000000;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          border-bottom: 3px double #000000;
          margin-bottom: 12px;
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
          font-size: 10pt;
          font-weight: bold;
        }
        .school-address {
          font-size: 8.5pt;
          font-style: italic;
        }
        .doc-title {
          text-align: center;
          font-size: 13pt;
          font-weight: bold;
          text-decoration: underline;
          margin-top: 10px;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        .doc-subtitle {
          text-align: center;
          font-size: 9.5pt;
          color: #475569;
          margin-bottom: 12px;
          font-style: italic;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .data-table th, .data-table td {
          border: 1px solid #000000;
          padding: 5px 7px;
          font-size: 9.5pt;
          vertical-align: middle;
        }
        .data-table th {
          background-color: #f1f5f9;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .signature-section {
          margin-top: 30px;
          width: 100%;
          page-break-inside: avoid;
        }
        .signature-table {
          width: 100%;
          border-collapse: collapse;
        }
        .signature-table td {
          text-align: center;
          vertical-align: top;
          width: 50%;
          font-size: 9.5pt;
        }
        .photo-gallery {
          margin-top: 25px;
          page-break-before: always;
        }
        .photo-card {
          display: inline-block;
          width: 46%;
          margin: 1.5%;
          padding: 8px;
          border: 1px solid #cbd5e1;
          vertical-align: top;
          background: #ffffff;
          box-sizing: border-box;
          page-break-inside: avoid;
        }
        .photo-card img {
          width: 100%;
          height: 180px;
          object-fit: cover;
          display: block;
          margin-bottom: 6px;
        }
        .photo-card b {
          font-size: 9.5pt;
          color: #0f172a;
        }
        .photo-card p {
          margin: 2px 0;
          font-size: 8.5pt;
          color: #475569;
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
            <div class="school-address">Jl. Pendidikan No. 1, Pulau Bunyu, Kab. Bulungan, Kalimantan Utara | Email: smkn1bunyu@gmail.com</div>
          </td>
        </tr>
      </table>

      <div class="doc-title">${title}</div>
      ${subtitle ? `<div class="doc-subtitle">${subtitle}</div>` : ''}

      ${tableHtml}

      <div class="signature-section">
        <table class="signature-table">
          <tr>
            <td>
              Mengetahui,<br>Kepala SMKN 1 Bunyu<br><br><br><br><br>
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

// 1. Export Filtered Absensi Siswa to Word
export function exportAbsensiWord(
  absensiList: Absensi[],
  kelasInfo?: string,
  tanggalInfo?: string,
  siswaList: Siswa[] = []
) {
  // Compute student summary from filtered lists
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
        <td class="text-center">${student.kelas}</td>
        <td class="text-center">${hadir}</td>
        <td class="text-center">${sakit}</td>
        <td class="text-center">${izin}</td>
        <td class="text-center">${terlambat}</td>
        <td class="text-center"><b>${alpha}</b></td>
      </tr>
    `;
  });

  const tableHtml = `
    <table class="data-table">
      <thead>
        <tr>
          <th rowspan="2" style="width: 35px;">NO</th>
          <th rowspan="2">NAMA SISWA</th>
          <th rowspan="2" style="width: 80px;">KELAS</th>
          <th colspan="5">KETERANGAN REKAPITULASI KEHADIRAN</th>
        </tr>
        <tr>
          <th style="width: 55px;">HADIR</th>
          <th style="width: 55px;">SAKIT</th>
          <th style="width: 55px;">IZIN</th>
          <th style="width: 75px;">TERLAMBAT</th>
          <th style="width: 55px;">ALPHA</th>
        </tr>
      </thead>
      <tbody>
        ${rekapRowsHtml || '<tr><td colspan="8" class="text-center">Tidak ada data rekapitulasi absensi sesuai filter.</td></tr>'}
      </tbody>
    </table>
  `;

  const subtitle = `Filter: ${kelasInfo ? `Kelas ${kelasInfo}` : 'Semua Kelas'} | Periode: ${tanggalInfo || 'Semua Tanggal'}`;
  const docHtml = createWordDocumentHtml('REKAPITULASI ABSENSI SISWA', tableHtml, subtitle);
  triggerWordDownload(docHtml, `Laporan_Absensi_${kelasInfo || 'Semua'}`);
}

// 2. Export Filtered Bimbingan Konseling to Word (with Embedded Photos in Table & Photo Appendix)
export function exportKonselingWord(konselingList: Konseling[], filterInfo?: string) {
  let rowsHtml = '';
  konselingList.forEach((item, index) => {
    const photoCell = item.fotoDokumentasi
      ? `<img src="${item.fotoDokumentasi}" width="80" height="60" style="object-fit:cover; border:1px solid #94a3b8; display:block; margin:auto; border-radius:2px;" />`
      : '<span style="color:#94a3b8; font-size:8pt;">-</span>';

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
        <td class="text-center" style="width:90px;">${photoCell}</td>
      </tr>
    `;
  });

  const tableHtml = `
    <table class="data-table">
      <thead>
        <tr>
          <th rowspan="2" style="width: 35px;">NO</th>
          <th rowspan="2" style="width: 130px;">NAMA SISWA</th>
          <th colspan="7">DETAIL LAYANAN BIMBINGAN KONSELING</th>
        </tr>
        <tr>
          <th style="width: 75px;">TANGGAL</th>
          <th style="width: 75px;">KELAS</th>
          <th>PERMASALAHAN SISWA</th>
          <th>TINDAK LANJUT & SOLUSI</th>
          <th style="width: 80px;">STATUS</th>
          <th style="width: 110px;">GURU BK</th>
          <th style="width: 90px;">FOTO BUKTI</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="9" class="text-center">Tidak ada data layanan BK sesuai filter.</td></tr>'}
      </tbody>
    </table>
  `;

  // Appendix Section for High-Resolution Photos
  const itemsWithPhoto = konselingList.filter(k => !!k.fotoDokumentasi);
  let appendixHtml = '';
  if (itemsWithPhoto.length > 0) {
    let cardsHtml = '';
    itemsWithPhoto.forEach(item => {
      cardsHtml += `
        <div class="photo-card">
          <img src="${item.fotoDokumentasi}" />
          <b>${item.namaSiswa} (${item.kelas})</b>
          <p>Tanggal: ${item.tanggal} | Status: <b>${item.statusPenyelesaian || '-'}</b></p>
          <p>Guru BK: ${item.guruBK}</p>
          <p>Masalah: ${item.permasalahan}</p>
          <p>Tindak Lanjut: ${item.tindakLanjut}</p>
        </div>
      `;
    });

    appendixHtml = `
      <div class="photo-gallery">
        <div class="doc-title">LAMPIRAN BUKTI DOKUMENTASI FOTO LAYANAN BK</div>
        <div class="doc-subtitle">Terlampir ${itemsWithPhoto.length} dokumentasi foto layanan bimbingan konseling</div>
        ${cardsHtml}
      </div>
    `;
  }

  const combinedHtml = `${tableHtml}${appendixHtml}`;
  const subtitle = `Filter Data: ${filterInfo || 'Semua Data Terpilih'} | Total: ${konselingList.length} Layanan`;
  const docHtml = createWordDocumentHtml('LAPORAN LAYANAN BIMBINGAN KONSELING', combinedHtml, subtitle);
  triggerWordDownload(docHtml, `Laporan_Layanan_BK_${filterInfo ? filterInfo.replace(/[^a-zA-Z0-9]/g, '_') : 'Semua'}`);
}

// 3. Export Filtered Jurnal Harian to Word
export function exportJurnalWord(jurnalList: JurnalHarian[], filterInfo?: string) {
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
          <th rowspan="2" style="width: 35px;">NO</th>
          <th rowspan="2" style="width: 140px;">GURU BK</th>
          <th colspan="3">KETERANGAN JURNAL HARIAN</th>
        </tr>
        <tr>
          <th style="width: 85px;">TANGGAL</th>
          <th>AKTIVITAS / KEGIATAN</th>
          <th>CATATAN / HASIL</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="5" class="text-center">Tidak ada data jurnal harian sesuai filter.</td></tr>'}
      </tbody>
    </table>
  `;

  const subtitle = `Filter: ${filterInfo || 'Semua Jurnal'} | Total: ${jurnalList.length} Aktivitas`;
  const docHtml = createWordDocumentHtml('JURNAL HARIAN GURU BK', tableHtml, subtitle);
  triggerWordDownload(docHtml, `Laporan_Jurnal_Harian_${filterInfo ? filterInfo.replace(/[^a-zA-Z0-9]/g, '_') : 'Semua'}`);
}

// 4. Export Filtered Penilaian Harian to Word
export function exportPenilaianWord(penilaianList: PenilaianHarian[], filterInfo?: string) {
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
          <th rowspan="2" style="width: 35px;">NO</th>
          <th rowspan="2" style="width: 140px;">NAMA SISWA</th>
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
        ${rowsHtml || '<tr><td colspan="7" class="text-center">Tidak ada data penilaian sesuai filter.</td></tr>'}
      </tbody>
    </table>
  `;

  const subtitle = `Filter: ${filterInfo || 'Semua Data Penilaian'} | Total: ${penilaianList.length} Penilaian`;
  const docHtml = createWordDocumentHtml('LAPORAN PENILAIAN HARIAN SISWA', tableHtml, subtitle);
  triggerWordDownload(docHtml, `Laporan_Penilaian_${filterInfo ? filterInfo.replace(/[^a-zA-Z0-9]/g, '_') : 'Semua'}`);
}

// 5. Export Filtered Data Siswa to Word
export function exportSiswaWord(siswaList: Siswa[], kelasInfo?: string) {
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
          <th rowspan="2" style="width: 35px;">NO</th>
          <th rowspan="2">NAMA SISWA</th>
          <th colspan="2">INFORMASI AKADEMIK</th>
          <th colspan="3">INFORMASI WALI & KETERANGAN</th>
        </tr>
        <tr>
          <th style="width: 80px;">KELAS</th>
          <th style="width: 80px;">JURUSAN</th>
          <th style="width: 60px;">JK</th>
          <th style="width: 110px;">NO HP WALI</th>
          <th>NAMA WALI</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="7" class="text-center">Tidak ada data siswa sesuai filter.</td></tr>'}
      </tbody>
    </table>
  `;

  const subtitle = `Filter: ${kelasInfo ? `Kelas ${kelasInfo}` : 'Semua Kelas'} | Total: ${siswaList.length} Siswa`;
  const docHtml = createWordDocumentHtml('DATA SISWA SMKN 1 BUNYU', tableHtml, subtitle);
  triggerWordDownload(docHtml, `Data_Siswa_${kelasInfo || 'Semua'}`);
}

// 6. Export Filtered Kolaborasi to Word
export function exportKolaborasiWord(kolaborasiList: any[], filterInfo?: string) {
  let rowsHtml = '';
  kolaborasiList.forEach((item, index) => {
    rowsHtml += `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td><b>${item.namaSiswa}</b></td>
        <td class="text-center">${item.kelas}</td>
        <td class="text-center">${item.tanggal}</td>
        <td><b>${item.namaRekanGuru}</b><br><span style="color:#475569; font-size:8.5pt;">(${item.mitraKolaborasi})</span></td>
        <td><b style="color:#0b1b47;">[${item.bentukKolaborasi}]</b><br>${item.permasalahan}</td>
        <td>${item.rencanaSolusi}</td>
        <td class="text-center"><b>${item.statusPenyelesaian}</b></td>
      </tr>
    `;
  });

  const tableHtml = `
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 35px;">NO</th>
          <th style="width: 140px;">NAMA SISWA</th>
          <th style="width: 60px;">KELAS</th>
          <th style="width: 80px;">TANGGAL</th>
          <th style="width: 140px;">REKAN GURU & MITRA</th>
          <th>BENTUK & PERMASALAHAN</th>
          <th>KESEPAKATAN SOLUSI</th>
          <th style="width: 80px;">STATUS</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="8" class="text-center">Tidak ada data kolaborasi sesuai filter.</td></tr>'}
      </tbody>
    </table>
  `;

  const subtitle = `Filter: ${filterInfo || 'Semua Data Kolaborasi'} | Total: ${kolaborasiList.length} Kegiatan`;
  const docHtml = createWordDocumentHtml('LAPORAN KOLABORASI PENYELESAIAN MASALAH SISWA', tableHtml, subtitle);
  triggerWordDownload(docHtml, `Laporan_Kolaborasi_Guru_${filterInfo ? filterInfo.replace(/[^a-zA-Z0-9]/g, '_') : 'Semua'}`);
}
