import React from 'react';
import { 
  MessageSquare, 
  FileDown, 
  Camera, 
  HardHat, 
  ChevronRight, 
  ImageIcon 
} from 'lucide-react';
import { Project, UserRole, SitePhoto } from '../types/project';
import { calculateTotalProgress } from '../utils/progressSync';

interface ConsumerHomeProps {
  project: Project;
  onNavigateTab: (tab: 'rekap' | 'timeline' | 'galeri' | 'chat') => void;
  onOpenPdf: () => void;
  onOpenUpload: () => void;
  currentRole: UserRole;
}

export const ConsumerHome: React.FC<ConsumerHomeProps> = ({
  project,
  onNavigateTab,
  onOpenPdf,
  onOpenUpload,
  currentRole,
}) => {
  const latestPhoto: SitePhoto | undefined = project.photos[0];
  const latestWeek = project.weeklyRecords[project.weeklyRecords.length - 1];
  const effectiveProgress =
    project.milestones.length > 0
      ? calculateTotalProgress(project.milestones)
      : project.currentProgress;
  const liveStatus =
    project.weeklyRecords.length > 0
      ? effectiveProgress > project.plannedProgress
        ? 'Ahead'
        : effectiveProgress < project.plannedProgress
        ? 'Delayed'
        : 'On Track'
      : project.status;

  return (
    <div className="space-y-4 pb-20 sm:pb-8 max-w-2xl lg:max-w-4xl mx-auto">
      {/* 1. Header Konsumen */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-xs text-gray-400 block font-medium">
            {currentRole === 'pengawas' ? 'Mode Pengawas Lapangan:' : 'Selamat datang,'}
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            {currentRole === 'pengawas' 
              ? (project.supervisorName || '[belum diisi]') 
              : (project.clientName || '[belum diisi]')}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {project.title || '[belum diisi]'} • {project.city || '[belum diisi]'}
          </p>
        </div>

        {currentRole === 'pengawas' && (
          <button
            onClick={onOpenUpload}
            className="flex items-center space-x-1.5 bg-[#f95700] hover:bg-[#e04e00] text-white px-3 py-2 rounded-xl text-xs font-bold shadow-md shadow-[#f95700]/25 transition-all"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>+ Foto Baru</span>
          </button>
        )}
      </div>

      {/* 2. Kartu Progres Utama */}
      <div className="bg-[#282929] border border-[#444545] rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#f95700] bg-[#f95700]/10 px-2.5 py-1 rounded-full border border-[#f95700]/20">
            Kemajuan Pembangunan
          </span>
          <span className="text-xs text-gray-400">
            {project.weeklyRecords.length > 0 
              ? `Minggu ${project.currentWeek} dari ${project.totalWeeks}` 
              : '[belum ada rekap]'}
          </span>
        </div>

        {/* Angka Progres */}
        <div className="flex items-baseline space-x-3 my-2">
          <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            {effectiveProgress}%
          </span>
          <span className="text-sm font-bold text-gray-300">
            Selesai
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#202121] h-3.5 rounded-full overflow-hidden border border-[#3d3e3e] my-3">
          <div
            className="h-full bg-linear-to-r from-amber-500 to-[#f95700] rounded-full transition-all duration-700"
            style={{ width: `${effectiveProgress}%` }}
          />
        </div>

        {/* Status & Estimasi */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 pb-4 border-b border-[#3d3e3e]">
          <div className="flex items-center space-x-1.5 text-gray-300 bg-[#202121] px-2.5 py-1 rounded-lg border border-[#3d3e3e]">
            <span>Status:</span>
            <strong className="text-white">{liveStatus || '[belum diisi]'}</strong>
          </div>
          <span className="text-gray-400 text-xs">
            Target Selesai: <strong className="text-gray-200">{project.targetCompletionDate || '[belum diisi]'}</strong>
          </span>
        </div>

        {/* Tombol Aksi */}
        <div className="grid grid-cols-2 gap-2.5 pt-4">
          <button
            onClick={() => onNavigateTab('chat')}
            className="flex items-center justify-center space-x-2 bg-[#333434] hover:bg-[#3d3e3e] text-white py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold border border-[#484949] transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-[#f95700]" />
            <span>{currentRole === 'pengawas' ? 'Chat Klien' : 'Chat Pengawas'}</span>
          </button>

          <button
            onClick={onOpenPdf}
            className="flex items-center justify-center space-x-2 bg-[#f95700] hover:bg-[#e04e00] text-white py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-[#f95700]/25 transition-all"
          >
            <FileDown className="w-4 h-4" />
            <span>Unduh Laporan PDF</span>
          </button>
        </div>
      </div>

      {/* 3. Foto Lapangan Terkini */}
      <div className="bg-[#282929] border border-[#444545] rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 flex items-center justify-between border-b border-[#3d3e3e]">
          <div className="flex items-center space-x-2">
            <Camera className="w-4 h-4 text-[#f95700]" />
            <h3 className="text-sm font-bold text-white">Foto Lapangan Terkini</h3>
          </div>
          <button
            onClick={() => onNavigateTab('galeri')}
            className="text-xs font-semibold text-[#f95700] hover:underline flex items-center gap-1"
          >
            <span>Lihat Galeri ({project.photos.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {latestPhoto ? (
          <div 
            onClick={() => onNavigateTab('galeri')}
            className="relative h-60 sm:h-72 bg-black cursor-pointer group"
          >
            <img
              src={latestPhoto.imageUrl}
              alt={latestPhoto.title}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
            <div className="absolute top-3 left-3 bg-[#202121]/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-white border border-white/10">
              {latestPhoto.phaseName}
            </div>
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-200">
              {latestPhoto.date} • {latestPhoto.time}
            </div>

            <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/90 via-black/50 to-transparent p-4">
              <h4 className="text-sm font-bold text-white line-clamp-1">
                {latestPhoto.title}
              </h4>
              <p className="text-xs text-gray-300 line-clamp-1 mt-0.5">
                {latestPhoto.description}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-12 px-4 text-center">
            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-300 font-medium">[belum ada foto]</p>
            {currentRole === 'pengawas' && (
              <button
                onClick={onOpenUpload}
                className="mt-3 text-xs text-[#f95700] font-bold hover:underline"
              >
                + Unggah Foto Lapangan Pertama
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Rekap Minggu Ini & Tahapan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Rekap Minggu Ini */}
        <div 
          onClick={() => onNavigateTab('rekap')}
          className="bg-[#282929] border border-[#444545] hover:border-[#f95700]/50 rounded-3xl p-5 shadow-lg transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Rekap Mingguan
            </span>
            <span className="text-xs text-[#f95700] font-bold">
              {project.weeklyRecords.length > 0 ? `W-${project.currentWeek}` : '[belum diisi]'}
            </span>
          </div>

          {latestWeek ? (
            <>
              <div className="flex items-baseline space-x-2 my-1">
                <span className="text-2xl font-black text-amber-400">+{latestWeek.actualWeekly}%</span>
                <span className="text-xs text-gray-400">kemajuan</span>
              </div>
              <p className="text-xs text-gray-300 mt-2 line-clamp-2 leading-relaxed">
                {latestWeek.highlight}
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-400 my-4">[belum ada rekap mingguan]</p>
          )}

          <div className="mt-3 pt-3 border-t border-[#3d3e3e] flex items-center justify-between text-xs text-[#f95700] font-bold">
            <span>Buka Rekap Progres</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Tahapan Pekerjaan */}
        <div 
          onClick={() => onNavigateTab('timeline')}
          className="bg-[#282929] border border-[#444545] hover:border-[#f95700]/50 rounded-3xl p-5 shadow-lg transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Tahapan Pekerjaan
            </span>
            <span className="text-[10px] font-bold bg-[#f95700]/20 text-[#f95700] px-2 py-0.5 rounded">
              {project.milestones.length} Tahap
            </span>
          </div>

          {project.milestones.length > 0 ? (
            <div className="mt-2 space-y-1.5 text-xs text-gray-300">
              {project.milestones.slice(0, 2).map((m) => (
                <div key={m.id} className="flex items-center justify-between">
                  <span className="truncate pr-2">{m.name}</span>
                  <span className="font-bold text-white shrink-0">{m.progressPercent}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 my-4">[belum ada tahapan]</p>
          )}

          <div className="mt-3 pt-3 border-t border-[#3d3e3e] flex items-center justify-between text-xs text-[#f95700] font-bold">
            <span>Lihat Semua Tahapan</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 5. Termin Pembayaran SPK (Pasal 6) */}
      {project.paymentTerms && project.paymentTerms.length > 0 && (
        <div className="bg-[#282929] border border-[#444545] rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3 border-b border-[#3d3e3e] pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#f95700]">
                Surat Perjanjian Kerja (Pasal 6)
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">
                Jadwal Termin Pembayaran
              </h3>
            </div>
            <span className="text-xs font-black text-white bg-[#202121] px-2.5 py-1 rounded-xl border border-[#3d3e3e]">
              Total: {project.totalBudgetFormatted}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {project.paymentTerms.map((term, idx) => (
              <div 
                key={idx}
                className="bg-[#202121] border border-[#3d3e3e] rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{term.termin}</span>
                    <span className="text-[10px] text-gray-400 font-semibold bg-[#282929] px-1.5 py-0.5 rounded">
                      Bobot: {term.targetBobot}%
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">{term.scope}</p>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0">
                  <span className="font-bold text-[#f95700] text-xs">{term.nominalFormatted}</span>
                  {term.status !== 'Lunas' && term.targetBobot > 0 && effectiveProgress >= term.targetBobot ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Target Bobot Tercapai
                    </span>
                  ) : (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      term.status === 'Lunas'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : term.status === 'Menunggu Progres'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-gray-800 text-gray-400'
                    }`}>
                      {term.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Info Kontraktor (untuk Klien) atau Panel Kerja Cepat (untuk Pengawas) */}
      {currentRole === 'klien' ? (
        <div className="bg-[#282929] border border-[#444545] rounded-3xl p-4.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#333434] border border-[#444545] flex items-center justify-center text-amber-400">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white">{project.supervisorName || '[belum diisi]'}</h4>
              <p className="text-gray-400 text-[11px]">{project.supervisorTitle || 'Penanggung Jawab Kontraktor'}</p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('chat')}
            className="bg-[#f95700]/15 hover:bg-[#f95700]/25 text-[#f95700] border border-[#f95700]/30 font-bold px-3 py-1.5 rounded-xl"
          >
            Hubungi
          </button>
        </div>
      ) : (
        <div className="bg-[#282929] border border-[#444545] rounded-3xl p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-[#3d3e3e] pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#f95700]">
                Aksi Pengawas
              </span>
              <h4 className="font-bold text-white text-sm mt-0.5">
                Klien: {project.clientName || '[belum diisi]'}
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                {project.location || '[belum diisi]'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onNavigateTab('timeline')}
              className="bg-[#202121] hover:bg-[#333434] border border-[#3d3e3e] text-white font-semibold py-2.5 px-2 rounded-xl text-center transition-colors"
            >
              Update Tahapan
            </button>
            <button
              onClick={() => onNavigateTab('rekap')}
              className="bg-[#202121] hover:bg-[#333434] border border-[#3d3e3e] text-white font-semibold py-2.5 px-2 rounded-xl text-center transition-colors"
            >
              Input Rekap
            </button>
            <button
              onClick={onOpenUpload}
              className="bg-[#f95700]/15 hover:bg-[#f95700]/25 border border-[#f95700]/30 text-[#f95700] font-bold py-2.5 px-2 rounded-xl text-center transition-colors"
            >
              Unggah Foto
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
