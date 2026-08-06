import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Konseling, JurnalHarian } from '../types';

export function printKonselingPDF(data: Konseling) {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  // Header Kop Surat
  doc.setFillColor(11, 27, 71); // Navy #0B1B47
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 215, 0); // Gold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PEMERINTAH PROVINSI KALIMANTAN UTARA', 105, 10, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('DINAS PENDIDIKAN DAN KEBUDAYAAN', 105, 17, { align: 'center' });

  doc.setFontSize(18);
  doc.text('SMK NEGERI 1 BUNYU', 105, 25, { align: 'center' });

  // Subhead
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Alamat: Jl. Pendidikan No. 1, Pulau Bunyu, Kab. Bulungan, Kalimantan Utara | Email: smkn1bunyu@gmail.com', 105, 38, { align: 'center' });

  doc.setLineWidth(0.8);
  doc.setDrawColor(11, 27, 71);
  doc.line(15, 42, 195, 42);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(11, 27, 71);
  doc.text('KARTU LAYANAN BIMBINGAN DAN KONSELING', 105, 52, { align: 'center' });

  // Detail Info Box
  autoTable(doc, {
    startY: 58,
    margin: { left: 15, right: 15 },
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [11, 27, 71], textColor: [255, 215, 0], fontStyle: 'bold' },
    head: [['PARAMETER', 'INFORMASI KELAYANAN KONSELING']],
    body: [
      ['Tanggal Layanan', data.tanggal],
      ['Nama Siswa', data.namaSiswa],
      ['Kelas / Jurusan', data.kelas],
      ['Status Penyelesaian', data.statusPenyelesaian],
      ['Guru Konselor', data.guruBK]
    ]
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Permasalahan Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(11, 27, 71);
  doc.text('A. PERMASALAHAN / KELUHAN SISWA:', 15, finalY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  const splitPermasalahan = doc.splitTextToSize(data.permasalahan, 180);
  doc.text(splitPermasalahan, 15, finalY + 6);

  const nextY1 = finalY + 8 + (splitPermasalahan.length * 5);

  // Tindak Lanjut Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(11, 27, 71);
  doc.text('B. TINDAK LANJUT & REKOMENDASI KONSELOR:', 15, nextY1);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  const splitTindakLanjut = doc.splitTextToSize(data.tindakLanjut, 180);
  doc.text(splitTindakLanjut, 15, nextY1 + 6);

  const nextY2 = nextY1 + 10 + (splitTindakLanjut.length * 5);

  // Tanda Tangan Section
  const signY = Math.max(nextY2 + 15, 210);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Mengetahui,', 25, signY);
  doc.text('Siswa / Konseli', 25, signY + 5);
  doc.text(`( ${data.namaSiswa} )`, 25, signY + 30);

  doc.text(`Bunyu, ${data.tanggal}`, 140, signY);
  doc.text('Guru Bimbingan Konseling', 140, signY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${data.guruBK} )`, 140, signY + 30);

  // Open / Save
  doc.save(`KARTU_KONSELING_${data.namaSiswa.replace(/\s+/g, '_')}_${data.tanggal}.pdf`);
}

export function printJurnalPDF(jurnalList: JurnalHarian[]) {
  const doc = new jsPDF({
    orientation: 'l',
    unit: 'mm',
    format: 'a4'
  });

  // Header Kop Surat
  doc.setFillColor(11, 27, 71);
  doc.rect(0, 0, 297, 28, 'F');

  doc.setTextColor(255, 215, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SMK NEGERI 1 BUNYU - JURNAL HARIAN GURU BIMBINGAN KONSELING', 148, 12, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('REKAPITULASI AKTIVITAS DAN LAYANAN BK TAHUN AJARAN BERJALAN', 148, 20, { align: 'center' });

  const tableBody = jurnalList.map((j, idx) => [
    idx + 1,
    j.tanggal,
    j.aktivitas,
    j.catatan,
    j.guruBK
  ]);

  autoTable(doc, {
    startY: 34,
    margin: { left: 12, right: 12 },
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [11, 27, 71], textColor: [255, 215, 0], fontStyle: 'bold' },
    head: [['NO', 'TANGGAL', 'AKTIVITAS / LAYANAN', 'CATATAN & EVALUASI', 'GURU BK']],
    body: tableBody
  });

  doc.save(`JURNAL_HARIAN_BK_SMKN1_BUNYU_${new Date().toISOString().split('T')[0]}.pdf`);
}
