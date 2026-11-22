import jsPDF from 'jspdf';
import { Project } from '../types/project';

export function generateProjectPdfReport(project: Project) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header background (Charcoal)
  doc.setFillColor(25, 30, 37);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent Orange Line
  doc.setFillColor(249, 87, 0); // #f95700
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Logo / Brand Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('HOONIYAN', margin, 15);
  
  doc.setFontSize(16);
  doc.setTextColor(249, 87, 0); // Orange
  doc.text('BUILD', margin + 35, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(190, 198, 209);
  doc.text('PT Hooniyan Kreasi Bangun | General Contractor & Architecture', margin, 21);

  // Document Badge on Right
  doc.setFillColor(40, 48, 60);
  doc.roundedRect(pageWidth - margin - 58, 6, 58, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(249, 87, 0);
  doc.text('OFFICIAL PROGRESS REPORT', pageWidth - margin - 54, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(220, 225, 230);
  doc.text(`Doc Ref: ${project.contractNumber}`, pageWidth - margin - 54, 18);

  // Document Title
  let currentY = 38;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 25, 30);
  doc.text('LAPORAN KEMAJUAN PROYEK BERKALA (PROGRESS REPORT)', margin, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 110, 120);
  const nowStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Tanggal Cetak Dokumen: ${nowStr} | Status: Resmi / Verified Site Inspection`, margin, currentY);

  // Project Info Card
  currentY += 6;
  doc.setFillColor(248, 249, 251);
  doc.setDrawColor(220, 225, 230);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 34, 2, 2, 'FD');

  const col1X = margin + 4;
  const col2X = margin + 68;
  const col3X = margin + 130;

  // Row 1
  let infoY = currentY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 125);
  doc.text('NAMA PROYEK', col1X, infoY);
  doc.text('PEMILIK (KLIEN)', col2X, infoY);
  doc.text('PENGAWAS LAPANGAN', col3X, infoY);

  infoY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 25, 30);
  doc.text(project.title, col1X, infoY);
  doc.text(project.clientName, col2X, infoY);
  doc.text(project.supervisorName, col3X, infoY);

  // Row 2
  infoY += 6.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 125);
  doc.text('LOKASI PROYEK', col1X, infoY);
  doc.text('PERIODE EVALUASI', col2X, infoY);
  doc.text('PROJECT MANAGER', col3X, infoY);

  infoY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 25, 30);
  doc.text(`${project.location}, ${project.city}`, col1X, infoY, { maxWidth: 60 });
  doc.text(`Minggu ke-${project.currentWeek} dari ${project.totalWeeks} Minggu`, col2X, infoY);
  doc.text(project.projectManager, col3X, infoY);

  // Progress KPI Box
  currentY += 40;
  const kpiWidth = (pageWidth - margin * 2 - 8) / 3;

  // KPI 1: Realisasi
  doc.setFillColor(254, 243, 237); // soft orange bg
  doc.setDrawColor(249, 87, 0);
  doc.roundedRect(margin, currentY, kpiWidth, 20, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 60, 0);
  doc.text('REALISASI PROGRES AKTUAL', margin + 4, currentY + 6);
  doc.setFontSize(15);
  doc.setTextColor(215, 65, 0);
  doc.text(`${project.currentProgress.toFixed(1)}%`, margin + 4, currentY + 15);

  // KPI 2: Target Rencana
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(200, 210, 220);
  doc.roundedRect(margin + kpiWidth + 4, currentY, kpiWidth, 20, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(90, 100, 115);
  doc.text('TARGET RENCANA KUMULATIF', margin + kpiWidth + 8, currentY + 6);
  doc.setFontSize(15);
  doc.setTextColor(40, 50, 65);
  doc.text(`${project.plannedProgress.toFixed(1)}%`, margin + kpiWidth + 8, currentY + 15);

  // KPI 3: Deviasi
  const diff = project.currentProgress - project.plannedProgress;
  const isAhead = diff >= 0;
  if (isAhead) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(16, 185, 129);
  } else {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(239, 68, 68);
  }
  doc.roundedRect(margin + (kpiWidth + 4) * 2, currentY, kpiWidth, 20, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  if (isAhead) {
    doc.setTextColor(4, 120, 87);
  } else {
    doc.setTextColor(185, 28, 28);
  }
  doc.text('DEVIASI KEMAJUAN (STATUS)', margin + (kpiWidth + 4) * 2 + 4, currentY + 6);
  doc.setFontSize(14);
  if (isAhead) {
    doc.setTextColor(5, 150, 105);
  } else {
    doc.setTextColor(220, 38, 38);
  }
  doc.text(`${isAhead ? '+' : ''}${diff.toFixed(1)}% (${isAhead ? 'LEBIH CEPAT' : 'TERLAMBAT'})`, margin + (kpiWidth + 4) * 2 + 4, currentY + 15);

  // Table Rekapitulasi Progres Mingguan
  currentY += 26;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(20, 25, 30);
  doc.text('1. REKAPITULASI KEMAJUAN PEKERJAAN MINGGUAN', margin, currentY);

  currentY += 4;
  // Table Header
  doc.setFillColor(30, 38, 48);
  doc.rect(margin, currentY, pageWidth - margin * 2, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Minggu', margin + 3, currentY + 4.8);
  doc.text('Periode Tanggal', margin + 20, currentY + 4.8);
  doc.text('Rencana (%)', margin + 64, currentY + 4.8);
  doc.text('Realisasi (%)', margin + 88, currentY + 4.8);
  doc.text('Deviasi (%)', margin + 114, currentY + 4.8);
  doc.text('Evaluasi / Catatan Capaian', margin + 138, currentY + 4.8);

  currentY += 7;
  const weekly = project.weeklyRecords.slice(0, 8); // show up to 8 records cleanly on page 1
  if (weekly.length === 0) {
    doc.setFillColor(250, 250, 252);
    doc.rect(margin, currentY, pageWidth - margin * 2, 7, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 130, 140);
    doc.text('[belum ada data rekap mingguan]', margin + 4, currentY + 4.8);
    currentY += 7;
  } else {
    weekly.forEach((rec, idx) => {
      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(246, 248, 250);
      }
      doc.rect(margin, currentY, pageWidth - margin * 2, 6.2, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 35, 45);
      doc.text(`W-${rec.week}`, margin + 3, currentY + 4.2);
      doc.text(rec.periodLabel.replace(' (Minggu Ini)', ''), margin + 20, currentY + 4.2);
      doc.text(`${rec.planCumulative.toFixed(1)}%`, margin + 66, currentY + 4.2);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 25, 35);
      doc.text(`${rec.actualCumulative.toFixed(1)}%`, margin + 90, currentY + 4.2);

      const devColor = rec.deviation >= 0 ? [5, 150, 105] : [220, 38, 38];
      doc.setTextColor(devColor[0], devColor[1], devColor[2]);
      doc.text(`${rec.deviation >= 0 ? '+' : ''}${rec.deviation.toFixed(1)}%`, margin + 116, currentY + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 90, 100);
      const noteText = rec.highlight.length > 36 ? rec.highlight.slice(0, 36) + '...' : rec.highlight;
      doc.text(noteText, margin + 138, currentY + 4.2);

      currentY += 6.2;
    });
  }

  // Table Milestones
  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(20, 25, 30);
  doc.text('2. STATUS CAPAIAN MILESTONE PEKERJAAN UTAMA', margin, currentY);

  currentY += 4;
  doc.setFillColor(30, 38, 48);
  doc.rect(margin, currentY, pageWidth - margin * 2, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Item Pekerjaan / Sub-Struktur', margin + 3, currentY + 4.8);
  doc.text('Bobot (%)', margin + 90, currentY + 4.8);
  doc.text('Target Selesai', margin + 115, currentY + 4.8);
  doc.text('Status & Progres', margin + 148, currentY + 4.8);

  currentY += 7;
  const milestones = project.milestones.slice(0, 9);
  if (milestones.length === 0) {
    doc.setFillColor(250, 250, 252);
    doc.rect(margin, currentY, pageWidth - margin * 2, 7, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 130, 140);
    doc.text('[belum ada data tahapan]', margin + 4, currentY + 4.8);
    currentY += 7;
  } else {
    milestones.forEach((m, idx) => {
      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(246, 248, 250);
      }
      doc.rect(margin, currentY, pageWidth - margin * 2, 6, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 35, 45);
      doc.text(m.name.length > 50 ? m.name.substring(0, 50) + '...' : m.name, margin + 3, currentY + 4.2);
      doc.text(`${m.weight.toFixed(1)}%`, margin + 92, currentY + 4.2);
      doc.text(m.targetEndDate, margin + 115, currentY + 4.2);

      const statusLabel = m.status === 'selesai' ? 'SELESAI (100%)' : m.status === 'dalam_pengerjaan' ? `PROSES (${m.progressPercent}%)` : 'MENUNGGU';
      doc.setFont('helvetica', 'bold');
      if (m.status === 'selesai') {
        doc.setTextColor(5, 150, 105);
      } else if (m.status === 'dalam_pengerjaan') {
        doc.setTextColor(215, 80, 0);
      } else {
        doc.setTextColor(130, 140, 150);
      }
      doc.text(statusLabel, margin + 148, currentY + 4.2);

      currentY += 6;
    });
  }

  // Catatan Pengawas & Rekomendasi
  currentY += 6;
  doc.setFillColor(248, 249, 251);
  doc.setDrawColor(220, 225, 230);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 17, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(249, 87, 0);
  doc.text('CATATAN LAPANGAN & KESIMPULAN PENGAWAS:', margin + 4, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(50, 60, 70);
  doc.text(
    '[belum diisi]',
    margin + 4,
    currentY + 10,
    { maxWidth: pageWidth - margin * 2 - 8 }
  );

  // Lembar Pengesahan Tanda Tangan
  currentY += 22;
  const sigBoxW = (pageWidth - margin * 2 - 8) / 3;

  const signatures = [
    { title: 'Pengawas Lapangan', name: project.supervisorName, role: 'Site Supervisor' },
    { title: 'Project Manager', name: project.projectManager, role: 'Lead Architect' },
    { title: 'Disetujui Pemilik (Klien)', name: project.clientName, role: 'Owner / Client' },
  ];

  signatures.forEach((sig, idx) => {
    const x = margin + idx * (sigBoxW + 4);
    doc.setFillColor(252, 252, 254);
    doc.setDrawColor(215, 220, 228);
    doc.roundedRect(x, currentY, sigBoxW, 25, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(110, 120, 130);
    doc.text(sig.title, x + 4, currentY + 5);

    // Signature line placeholder
    doc.setDrawColor(200, 205, 215);
    doc.line(x + 4, currentY + 18, x + sigBoxW - 4, currentY + 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(20, 25, 30);
    doc.text(sig.name, x + 4, currentY + 22);
  });

  // Footer page 1
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(140, 150, 160);
  doc.text('Hooniyan Build System | Dokumen sah laporan kemajuan proyek konstruksi perumahan | Halaman 1 dari 1', margin, pageHeight - 6);

  // Save PDF to browser download
  const safeFilename = `Laporan_Progres_${project.contractNumber.replace(/[^a-zA-Z0-9]/g, '_')}_W${project.currentWeek}.pdf`;
  doc.save(safeFilename);
}
