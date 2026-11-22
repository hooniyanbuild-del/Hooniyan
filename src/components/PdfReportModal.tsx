import React from 'react';
import { X, FileDown, Printer, ShieldCheck } from 'lucide-react';
import { Project } from '../types/project';
import { generateProjectPdfReport } from '../utils/pdfGenerator';

interface PdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const PdfReportModal: React.FC<PdfReportModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    generateProjectPdfReport(project);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="w-full max-w-3xl bg-[#282929] border border-[#444545] rounded-3xl shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-[#202121] border-b border-[#3d3e3e] flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <FileDown className="w-5 h-5 text-[#f95700]" />
            <h3 className="text-sm font-bold text-white">Laporan Progres Resmi (PDF)</h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="bg-[#333434] hover:bg-[#3d3e3e] text-gray-200 border border-[#444545] px-3 py-1.5 rounded-xl text-xs font-semibold"
            >
              Cetak
            </button>
            <button
              onClick={handleDownload}
              className="bg-[#f95700] hover:bg-[#e04e00] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold"
            >
              Unduh PDF
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Document Preview */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-[#202121] flex justify-center">
          <div className="w-full bg-white text-gray-900 rounded-lg p-6 sm:p-8 border border-gray-200 text-xs">
            {/* Header Letterhead */}
            <div className="border-b-2 border-[#f95700] pb-4 mb-5 flex justify-between items-center">
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xl font-extrabold text-[#191f27]">HOONIYAN</span>
                  <span className="text-xl font-black text-[#f95700]">BUILD</span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">
                  General Contractor & Architecture
                </p>
              </div>

              <div className="text-right text-[11px]">
                <span className="font-bold block">No: {project.contractNumber || '[belum diisi]'}</span>
                <span className="text-gray-500">
                  {project.currentWeek > 0 ? `Minggu Ke-${project.currentWeek}` : '[belum diisi]'}
                </span>
              </div>
            </div>

            <div className="text-center mb-5">
              <h2 className="text-sm font-bold text-gray-900 uppercase">
                Laporan Kemajuan Pekerjaan Konstruksi
              </h2>
            </div>

            {/* Metadata */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 mb-5 grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-gray-400 font-bold block">NAMA PROYEK:</span>
                <p className="font-bold text-gray-900">{project.title || '[belum diisi]'}</p>
                <span className="text-gray-400 font-bold block mt-2">LOKASI:</span>
                <p className="text-gray-700">{project.location || '[belum diisi]'}</p>
              </div>
              <div>
                <span className="text-gray-400 font-bold block">KLIEN:</span>
                <p className="font-bold text-gray-900">{project.clientName || '[belum diisi]'}</p>
                <span className="text-gray-400 font-bold block mt-2">PENGAWAS LAPANGAN:</span>
                <p className="text-gray-700">{project.supervisorName || '[belum diisi]'}</p>
              </div>
            </div>

            {/* Summary KPI */}
            <div className="grid grid-cols-2 gap-3 mb-5 text-center">
              <div className="bg-orange-50 border border-[#f95700]/30 rounded-xl p-3">
                <span className="text-[10px] font-bold text-[#b44100] block uppercase">Realisasi</span>
                <span className="text-xl font-black text-[#d34e00] block mt-0.5">{project.currentProgress}%</span>
              </div>
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-3">
                <span className="text-[10px] font-bold text-gray-600 block uppercase">Target Rencana</span>
                <span className="text-xl font-black text-slate-800 block mt-0.5">{project.plannedProgress}%</span>
              </div>
            </div>

            {/* Weekly Records Table */}
            <div className="mb-5">
              <h3 className="text-[11px] font-bold uppercase text-gray-800 mb-2">
                Rekap Progres Mingguan
              </h3>
              {project.weeklyRecords.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden text-[10px]">
                  <table className="w-full text-left">
                    <thead className="bg-[#191f27] text-white">
                      <tr>
                        <th className="py-1.5 px-2.5">Minggu</th>
                        <th className="py-1.5 px-2.5">Periode</th>
                        <th className="py-1.5 px-2.5 text-center">Realisasi (%)</th>
                        <th className="py-1.5 px-2.5">Uraian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {project.weeklyRecords.map((w, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="py-1.5 px-2.5 font-bold">W-{w.week}</td>
                          <td className="py-1.5 px-2.5">{w.periodLabel}</td>
                          <td className="py-1.5 px-2.5 text-center font-bold text-[#d34e00]">{w.actualCumulative}%</td>
                          <td className="py-1.5 px-2.5 text-gray-600">{w.highlight}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[10px] text-gray-500 italic">[belum ada rekap mingguan]</p>
              )}
            </div>

            {/* Milestones */}
            <div className="mb-5">
              <h3 className="text-[11px] font-bold uppercase text-gray-800 mb-2">
                Tahapan Pekerjaan
              </h3>
              {project.milestones.length > 0 ? (
                <div className="space-y-1.5 text-[10px]">
                  {project.milestones.map((m) => (
                    <div key={m.id} className="border border-gray-200 rounded-lg p-2 flex justify-between bg-gray-50">
                      <span className="font-semibold text-gray-800">{m.name}</span>
                      <span className="font-bold text-[#f95700]">{m.progressPercent}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-gray-500 italic">[belum ada tahapan]</p>
              )}
            </div>

            {/* Signatures */}
            <div className="pt-5 border-t border-gray-300 grid grid-cols-2 gap-4 text-center text-[10px]">
              <div>
                <p className="text-gray-500">Pengawas Lapangan:</p>
                <div className="h-12 flex items-center justify-center">
                  <span className="italic text-gray-400">Ttd Lapangan</span>
                </div>
                <p className="font-bold text-gray-900">{project.supervisorName || '[belum diisi]'}</p>
              </div>

              <div>
                <p className="text-gray-500">Klien / Pemilik Proyek:</p>
                <div className="h-12 flex items-center justify-center">
                  <span className="italic text-gray-400">Ttd Pemilik</span>
                </div>
                <p className="font-bold text-gray-900">{project.clientName || '[belum diisi]'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
