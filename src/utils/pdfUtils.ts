import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Siswa, Absensi, Konseling, JurnalHarian, PenilaianHarian } from '../types';

function drawKopSurat(doc: jsPDF, orientation: 'p' | 'l', title: string, subtitle?: string) {
  const pageWidth = orientation === 'p' ? 210 : 297;

  // Navy banner
  doc.setFillColor(11, 27, 71); // #0B1B47
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Gold text
  doc.setTextColor(255, 215, 0); // Gold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PEMERINTAH PROVINSI KALIMANTAN UTARA - DINAS PENDIDIKAN DAN KEBUDAYAAN', pageWidth / 2, 9, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text('SMK NEGERI 1 BUNYU', pageWidth / 2, 17, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Alamat: Jl. Pendidikan No. 1, Pulau Bunyu, Kab. Bulungan, Kalimantan Utara | Email: smkn1bunyu@gmail.com', pageWidth / 2, 23, { align: 'center' });

  // Border line
  doc.setLineWidth(0.6);
  doc.setDrawColor(11, 27, 71);
  doc.line(10, 31, pageWidth - 10, 31);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(11, 27, 71);
  doc.text(title, pageWidth / 2, 38, { align: 'center' });

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(subtitle, pageWidth / 2, 43, { align: 'center' });
  }
}

// 1. Print Single Konseling Card PDF (with High-Res Photo Attachment)
export function printKonselingPDF(data: Konseling) {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  drawKopSurat(doc, 'p', 'KARTU LAYANAN BIMBINGAN DAN KONSELING', `Tanggal Layanan: ${data.tanggal} | Kelas: ${data.kelas}`);

  // Detail Info Box
  autoTable(doc, {
    startY: 48,
    margin: { left: 15, right: 15 },
    theme: 'grid',
    styles: { fontSize: 9.5, cellPadding: 2.5 },
    headStyles: { fillColor: [11, 27, 71], textColor: [255, 215, 0], fontStyle: 'bold' },
    head: [['PARAMETER', 'INFORMASI LAYANAN KONSELING']],
    body: [
      ['Tanggal Layanan', data.tanggal],
      ['Nama Siswa', data.namaSiswa],
      ['Kelas / Jurusan', data.kelas],
      ['Status Penyelesaian', data.statusPenyelesaian],
      ['Guru Konselor', data.guruBK]
    ]
  });

  let currentY = (doc as any).lastAutoTable.finalY + 6;

  // Permasalahan Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(11, 27, 71);
  doc.text('A. PERMASALAHAN / KELUHAN SISWA:', 15, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  const splitPermasalahan = doc.splitTextToSize(data.permasalahan || '-', 180);
  doc.text(splitPermasalahan, 15, currentY + 5);

  currentY = currentY + 7 + splitPermasalahan.length * 4.5;

  // Tindak Lanjut Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(11, 27, 71);
  doc.text('B. TINDAK LANJUT & REKOMENDASI KONSELOR:', 15, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  const splitTindakLanjut = doc.splitTextToSize(data.tindakLanjut || '-', 180);
  doc.text(splitTindakLanjut, 15, currentY + 5);

  currentY = currentY + 8 + splitTindakLanjut.length * 4.5;

  // Foto Dokumentasi
  if (data.fotoDokumentasi) {
    if (currentY + 65 > 280) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(11, 27, 71);
    doc.text('C. BUKTI FOTO DOKUMENTASI LAYANAN:', 15, currentY);

    try {
      const format = data.fotoDokumentasi.includes('png') ? 'PNG' : 'JPEG';
      doc.setDrawColor(203, 213, 225);
      doc.rect(14.5, currentY + 3.5, 61, 46);
      doc.addImage(data.fotoDokumentasi, format, 15, currentY + 4, 60, 45);
      currentY += 54;
    } catch (e) {
      console.warn('Could not add image to PDF:', e);
      currentY += 8;
    }
  }

  // Tanda Tangan Section
  if (currentY + 40 > 285) {
    doc.addPage();
    currentY = 30;
  } else {
    currentY = Math.max(currentY + 8, 225);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Mengetahui,', 25, currentY);
  doc.text('Siswa / Konseli', 25, currentY + 5);
  doc.text(`( ${data.namaSiswa} )`, 25, currentY + 28);

  doc.text(`Bunyu, ${data.tanggal}`, 135, currentY);
  doc.text('Guru Bimbingan Konseling', 135, currentY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${data.guruBK} )`, 135, currentY + 28);

  doc.save(`KARTU_KONSELING_${data.namaSiswa.replace(/\s+/g, '_')}_${data.tanggal}.pdf`);
}

// 2. Export Filtered Konseling List to PDF (with Photo Thumbnails in Table & High-Res Appendix)
export function exportKonselingListPDF(konselingList: Konseling[], filterInfo?: string) {
  const doc = new jsPDF({
    orientation: 'l',
    unit: 'mm',
    format: 'a4'
  });

  const subtitle = `REKAPITULASI SESI KONSELING ${filterInfo ? `(${filterInfo})` : ''} - TOTAL: ${konselingList.length} DATA`;
  drawKopSurat(doc, 'l', 'LAPORAN LAYANAN BIMBINGAN DAN KONSELING', subtitle);

  const tableBody = konselingList.map((item, idx) => [
    idx + 1,
    item.tanggal,
    `${item.namaSiswa}\n(${item.kelas})`,
    item.permasalahan,
    item.tindakLanjut,
    item.statusPenyelesaian || '-',
    item.guruBK,
    item.fotoDokumentasi ? '' : '-'
  ]);

  autoTable(doc, {
    startY: 47,
    margin: { left: 10, right: 10 },
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2, minCellHeight: 18, valign: 'middle' },
    headStyles: { fillColor: [11, 27, 71], textColor: [255, 215, 0], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 38 },
      3: { cellWidth: 60 },
      4: { cellWidth: 60 },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 35 },
      7: { cellWidth: 30, halign: 'center' }
    },
    head: [['NO', 'TANGGAL', 'NAMA & KELAS', 'PERMASALAHAN SISWA', 'TINDAK LANJUT / SOLUSI', 'STATUS', 'GURU BK', 'FOTO BUKTI']],
    body: tableBody,
    didDrawCell: (data) => {
      // Draw image in the Photo column (index 7)
      if (data.column.index === 7 && data.cell.section === 'body') {
        const item = konselingList[data.row.index];
        if (item && item.fotoDokumentasi) {
          try {
            const format = item.fotoDokumentasi.includes('png') ? 'PNG' : 'JPEG';
            doc.addImage(
              item.fotoDokumentasi,
              format,
              data.cell.x + (data.cell.width - 24) / 2,
              data.cell.y + 1.5,
              24,
              15
            );
          } catch (err) {
            console.warn('Could not draw cell image in PDF:', err);
          }
        }
      }
    }
  });

  // Appendix Section for Full-Sized Photos if any exist
  const itemsWithPhoto = konselingList.filter(k => !!k.fotoDokumentasi);
  if (itemsWithPhoto.length > 0) {
    doc.addPage();
    drawKopSurat(doc, 'l', 'LAMPIRAN BUKTI DOKUMENTASI FOTO LAYANAN BK', `Terlampir ${itemsWithPhoto.length} Bukti Foto Sesi Konseling`);

    let startX = 15;
    let startY = 48;
    const cardWidth = 85;
    const cardHeight = 65;
    const gapX = 8;
    const gapY = 8;

    itemsWithPhoto.forEach((item, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3) % 2;

      // New page after every 6 photos
      if (index > 0 && index % 6 === 0) {
        doc.addPage();
        drawKopSurat(doc, 'l', 'LAMPIRAN BUKTI DOKUMENTASI FOTO LAYANAN BK (LANJUTAN)', '');
        startY = 48;
      }

      const x = startX + col * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);

      // Card border
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');

      // Image
      try {
        const format = item.fotoDokumentasi!.includes('png') ? 'PNG' : 'JPEG';
        doc.addImage(item.fotoDokumentasi!, format, x + 2.5, y + 2.5, cardWidth - 5, 42);
      } catch (err) {
        console.warn('Failed to embed appendix image in PDF:', err);
      }

      // Caption
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(11, 27, 71);
      doc.text(`${item.namaSiswa} (${item.kelas})`, x + 3, y + 49);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(`Tgl: ${item.tanggal} | Status: ${item.statusPenyelesaian || '-'}`, x + 3, y + 53);

      const shortProblem = item.permasalahan.length > 55 ? `${item.permasalahan.substring(0, 52)}...` : item.permasalahan;
      doc.text(`Ket: ${shortProblem}`, x + 3, y + 57);
    });
  }

  doc.save(`Laporan_Layanan_BK_${filterInfo ? filterInfo.replace(/[^a-zA-Z0-9]/g, '_') : 'Semua'}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// 3. Export Filtered Absensi to PDF
export function exportAbsensiPDF(absensiList: Absensi[], siswaList: Siswa[], kelasInfo?: string, periodeInfo?: string) {
  const doc = new jsPDF({
    orientation: 'l',
    unit: 'mm',
    format: 'a4'
  });

  const subtitle = `REKAPITULASI KEHADIRAN ${kelasInfo ? `KELAS: ${kelasInfo}` : 'SEMUA KELAS'} ${periodeInfo ? `| PERIODE: ${periodeInfo}` : ''}`;
  drawKopSurat(doc, 'l', 'REKAPITULASI ABSENSI SISWA SMKN 1 BUNYU', subtitle);

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

  const tableBody = targetStudents.map((s, idx) => {
    const studentAbs = absensiList.filter(a => a.siswaId === s.id || a.namaSiswa === s.nama);
    const hadir = studentAbs.filter(a => a.status === 'Hadir').length;
    const sakit = studentAbs.filter(a => a.status === 'Sakit').length;
    const izin = studentAbs.filter(a => a.status === 'Izin').length;
    const terlambat = studentAbs.filter(a => a.status === 'Terlambat').length;
    const alpha = studentAbs.filter(a => a.status === 'Alpha').length;

    return [idx + 1, s.nama, s.kelas, hadir, sakit, izin, terlambat, alpha];
  });

  autoTable(doc, {
    startY: 47,
    margin: { left: 15, right: 15 },
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [11, 27, 71], textColor: [255, 215, 0], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 65 },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 25, halign: 'center' },
      6: { cellWidth: 30, halign: 'center' },
      7: { cellWidth: 25, halign: 'center' }
    },
    head: [['NO', 'NAMA SISWA', 'KELAS', 'HADIR', 'SAKIT', 'IZIN', 'TERLAMBAT', 'ALPHA']],
    body: tableBody.length > 0 ? tableBody : [['-', 'Tidak ada data absensi sesuai filter.', '-', '-', '-', '-', '-', '-']]
  });

  doc.save(`Rekap_Absensi_${kelasInfo || 'Semua'}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// 4. Export Filtered Data Siswa to PDF
export function exportSiswaPDF(siswaList: Siswa[], kelasInfo?: string) {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const subtitle = `DATA INDUK SISWA ${kelasInfo ? `KELAS: ${kelasInfo}` : 'SEMUA KELAS'} - TOTAL: ${siswaList.length} SISWA`;
  drawKopSurat(doc, 'p', 'DATA SISWA SMK NEGERI 1 BUNYU', subtitle);

  const tableBody = siswaList.map((s, idx) => [
    idx + 1,
    s.nama,
    s.kelas,
    s.jurusan || '-',
    s.jenisKelamin || '-',
    s.noHp || '-',
    s.namaWali || '-'
  ]);

  autoTable(doc, {
    startY: 48,
    margin: { left: 10, right: 10 },
    theme: 'striped',
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [11, 27, 71], textColor: [255, 215, 0], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 45 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 30 },
      6: { cellWidth: 40 }
    },
    head: [['NO', 'NAMA SISWA', 'KELAS', 'JURUSAN', 'JK', 'NO HP WALI', 'NAMA WALI']],
    body: tableBody.length > 0 ? tableBody : [['-', 'Tidak ada data siswa sesuai filter.', '-', '-', '-', '-', '-']]
  });

  doc.save(`Data_Siswa_${kelasInfo || 'Semua'}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// 5. Export Filtered Jurnal Harian to PDF
export function printJurnalPDF(jurnalList: JurnalHarian[], filterInfo?: string) {
  const doc = new jsPDF({
    orientation: 'l',
    unit: 'mm',
    format: 'a4'
  });

  const subtitle = `REKAPITULASI AKTIVITAS DAN LAYANAN BK ${filterInfo ? `(${filterInfo})` : ''} - TOTAL: ${jurnalList.length} KEGIATAN`;
  drawKopSurat(doc, 'l', 'JURNAL HARIAN GURU BIMBINGAN KONSELING', subtitle);

  const tableBody = jurnalList.map((j, idx) => [
    idx + 1,
    j.tanggal,
    j.aktivitas,
    j.catatan || '-',
    j.guruBK
  ]);

  autoTable(doc, {
    startY: 47,
    margin: { left: 12, right: 12 },
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [11, 27, 71], textColor: [255, 215, 0], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 28, halign: 'center' },
      2: { cellWidth: 95 },
      3: { cellWidth: 85 },
      4: { cellWidth: 50 }
    },
    head: [['NO', 'TANGGAL', 'AKTIVITAS / LAYANAN', 'CATATAN & EVALUASI', 'GURU BK']],
    body: tableBody.length > 0 ? tableBody : [['-', '-', 'Tidak ada data jurnal.', '-', '-']]
  });

  doc.save(`Jurnal_Harian_BK_${filterInfo ? filterInfo.replace(/[^a-zA-Z0-9]/g, '_') : 'Semua'}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// 6. Export Filtered Penilaian Harian to PDF
export function exportPenilaianPDF(penilaianList: PenilaianHarian[], filterInfo?: string) {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const subtitle = `LAPORAN PENILAIAN INDIKATOR SIKAP & KEDISIPLINAN ${filterInfo ? `(${filterInfo})` : ''}`;
  drawKopSurat(doc, 'p', 'LAPORAN PENILAIAN HARIAN SISWA', subtitle);

  const tableBody = penilaianList.map((p, idx) => [
    idx + 1,
    p.namaSiswa,
    p.tanggal,
    p.kelas,
    p.mataPelajaran,
    p.nilai,
    p.keterangan || '-'
  ]);

  autoTable(doc, {
    startY: 48,
    margin: { left: 10, right: 10 },
    theme: 'striped',
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [11, 27, 71], textColor: [255, 215, 0], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 45 },
      2: { cellWidth: 24, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 40 },
      5: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 35 }
    },
    head: [['NO', 'NAMA SISWA', 'TANGGAL', 'KELAS', 'ASPEK / MAPEL', 'NILAI', 'CATATAN']],
    body: tableBody.length > 0 ? tableBody : [['-', 'Tidak ada data penilaian.', '-', '-', '-', '-', '-']]
  });

  doc.save(`Penilaian_Harian_${filterInfo ? filterInfo.replace(/[^a-zA-Z0-9]/g, '_') : 'Semua'}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// 7. Export Filtered Kolaborasi BK & Guru to PDF
export function exportKolaborasiPDF(kolaborasiList: any[], filterInfo?: string) {
  const doc = new jsPDF({
    orientation: 'l',
    unit: 'mm',
    format: 'a4'
  });

  const subtitle = `REKAPITULASI KOLABORASI PENYELESAIAN MASALAH SISWA ${filterInfo ? `(${filterInfo})` : ''}`;
  drawKopSurat(doc, 'l', 'LAPORAN KOLABORASI BK & REKAN GURU', subtitle);

  const tableBody = kolaborasiList.map((item, idx) => [
    idx + 1,
    item.namaSiswa,
    item.kelas,
    item.tanggal,
    `${item.namaRekanGuru}\n(${item.mitraKolaborasi})`,
    `[${item.bentukKolaborasi}]\n${item.permasalahan}`,
    item.rencanaSolusi,
    item.statusPenyelesaian
  ]);

  autoTable(doc, {
    startY: 48,
    margin: { left: 10, right: 10 },
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [11, 27, 71], textColor: [255, 215, 0], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 35 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 42 },
      5: { cellWidth: 65 },
      6: { cellWidth: 60 },
      7: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }
    },
    head: [['NO', 'NAMA SISWA', 'KELAS', 'TANGGAL', 'REKAN GURU & MITRA', 'BENTUK & PERMASALAHAN', 'KESEPAKATAN SOLUSI', 'STATUS']],
    body: tableBody.length > 0 ? tableBody : [['-', '-', '-', '-', '-', 'Tidak ada data kolaborasi.', '-', '-']]
  });

  doc.save(`Kolaborasi_BK_Guru_${filterInfo ? filterInfo.replace(/[^a-zA-Z0-9]/g, '_') : 'Semua'}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// 8. Export Absensi Ibadah to PDF
export function exportIbadahPDF(ibadahList: any[], filterInfo?: string) {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const subtitle = `LAPORAN ABSENSI IBADAH & KEGIATAN IMTAQ ${filterInfo ? `(${filterInfo})` : ''}`;
  drawKopSurat(doc, 'p', 'LAPORAN KEGIATAN IBADAH SISWA', subtitle);

  const tableBody = ibadahList.map((item, idx) => [
    idx + 1,
    item.namaSiswa,
    item.kelas,
    item.tanggal,
    item.jenisIbadah,
    item.status,
    item.catatan || '-'
  ]);

  autoTable(doc, {
    startY: 48,
    margin: { left: 10, right: 10 },
    theme: 'striped',
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [11, 27, 71], textColor: [255, 215, 0], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 45 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 40 },
      5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 31 }
    },
    head: [['NO', 'NAMA SISWA', 'KELAS', 'TANGGAL', 'KEGIATAN IBADAH', 'STATUS', 'CATATAN']],
    body: tableBody.length > 0 ? tableBody : [['-', '-', '-', '-', 'Tidak ada data ibadah.', '-', '-']]
  });

  doc.save(`Absensi_Ibadah_${filterInfo ? filterInfo.replace(/[^a-zA-Z0-9]/g, '_') : 'Semua'}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// 9. Export Agenda BK to PDF
export function exportAgendaPDF(agendaList: any[], filterInfo?: string) {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const subtitle = `REKAPITULASI AGENDA & SESI BIMBINGAN KONSELING ${filterInfo ? `(${filterInfo})` : ''}`;
  drawKopSurat(doc, 'p', 'LAPORAN AGENDA & SESI BK', subtitle);

  const tableBody = agendaList.map((item, idx) => [
    idx + 1,
    `${item.tanggal}\n${item.jam || '-'}`,
    item.kategori,
    item.namaSiswa ? `${item.namaSiswa} (${item.kelas})` : '-',
    item.lokasi || '-',
    item.keterangan,
    item.status
  ]);

  autoTable(doc, {
    startY: 48,
    margin: { left: 10, right: 10 },
    theme: 'striped',
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [11, 27, 71], textColor: [255, 215, 0], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 35 },
      3: { cellWidth: 35 },
      4: { cellWidth: 28 },
      5: { cellWidth: 36 },
      6: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
    },
    head: [['NO', 'WAKTU', 'KATEGORI', 'SISWA', 'LOKASI', 'KETERANGAN', 'STATUS']],
    body: tableBody.length > 0 ? tableBody : [['-', '-', '-', 'Tidak ada agenda.', '-', '-', '-']]
  });

  doc.save(`Agenda_BK_${filterInfo ? filterInfo.replace(/[^a-zA-Z0-9]/g, '_') : 'Semua'}_${new Date().toISOString().split('T')[0]}.pdf`);
}
