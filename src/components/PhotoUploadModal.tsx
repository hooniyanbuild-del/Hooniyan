import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Milestone, SitePhoto } from '../types/project';
import {
  compressImageFile,
  compressVideoFrame,
  estimateDataUrlKb,
} from '../utils/imageCompression';
import {
  calculateMilestoneContribution,
  calculateTotalProgress,
} from '../utils/progressSync';

export interface PhotoMilestoneUpdate {
  milestoneId: string;
  milestoneName: string;
  progressPercent: number;
}

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestones: Milestone[];
  supervisorName: string;
  onSavePhoto: (
    photo: SitePhoto,
    milestoneUpdate?: PhotoMilestoneUpdate
  ) => Promise<void> | void;
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  milestones,
  supervisorName,
  onSavePhoto,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(milestones[0]?.id || '');
  const [milestonePercent, setMilestonePercent] = useState<number>(
    milestones[0]?.progressPercent ?? 0
  );
  const [imagePreview, setImagePreview] = useState<string>('');
  const [beforePreview, setBeforePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live camera capture state
  const [cameraTarget, setCameraTarget] = useState<'after' | 'before' | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string>('');
  const [isCameraReady, setIsCameraReady] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCamInputRef = useRef<HTMLInputElement>(null);
  const beforeFileInputRef = useRef<HTMLInputElement>(null);
  const beforeNativeCamInputRef = useRef<HTMLInputElement>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
  };

  useEffect(() => {
    if (isOpen && milestones.length > 0) {
      const current =
        milestones.find((m) => m.id === selectedMilestoneId) ||
        milestones.find((m) => m.progressPercent < 100) ||
        milestones[0];
      setSelectedMilestoneId(current.id);
      setMilestonePercent(current.progressPercent);
    }
    if (!isOpen) {
      stopCameraStream();
      setCameraTarget(null);
      setCameraError('');
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, milestones]);

  useEffect(() => {
    if (!cameraTarget || !isOpen) {
      stopCameraStream();
      return;
    }

    let cancelled = false;
    const startCamera = async () => {
      stopCameraStream();
      setCameraError('');
      setIsCameraReady(false);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Kamera langsung tidak didukung browser ini. Gunakan tombol Kamera Perangkat atau Upload File.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsCameraReady(true);
        }
      } catch {
        if (!cancelled) {
          setCameraError('Izin kamera ditolak atau kamera tidak ditemukan. Anda dapat menggunakan Kamera Bawaan HP atau Upload dari Perangkat.');
        }
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      stopCameraStream();
    };
  }, [cameraTarget, facingMode, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'after' | 'before'
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      if (target === 'after') {
        setImagePreview(compressed);
      } else {
        setBeforePreview(compressed);
      }
    } catch (error) {
      console.error('Failed to process image:', error);
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current || !cameraTarget) return;
    const captured = compressVideoFrame(videoRef.current);
    if (captured) {
      if (cameraTarget === 'after') {
        setImagePreview(captured);
      } else {
        setBeforePreview(captured);
      }
    }
    stopCameraStream();
    setCameraTarget(null);
  };

  const selectedMilestone = milestones.find((m) => m.id === selectedMilestoneId) || milestones[0];
  const currentTotalProgress = calculateTotalProgress(milestones);
  const projectedTotalProgress = selectedMilestone
    ? calculateTotalProgress(
        milestones.map((m) =>
          m.id === selectedMilestone.id ? { ...m, progressPercent: milestonePercent } : m
        )
      )
    : currentTotalProgress;

  const handleSelectMilestone = (id: string) => {
    setSelectedMilestoneId(id);
    const found = milestones.find((m) => m.id === id);
    if (found) {
      setMilestonePercent(found.progressPercent);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    const nextDefault = milestones.find((m) => m.progressPercent < 100) || milestones[0];
    setSelectedMilestoneId(nextDefault?.id || '');
    setMilestonePercent(nextDefault?.progressPercent ?? 0);
    setImagePreview('');
    setBeforePreview('');
    setCameraTarget(null);
    setCameraError('');
  };

  const handleClose = () => {
    stopCameraStream();
    setCameraTarget(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview || isSubmitting) return;

    setIsSubmitting(true);
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
    const activePhaseName = selectedMilestone?.name || '[belum diisi]';

    const newPhoto: SitePhoto = {
      id: `p-${Date.now()}`,
      title: title || '[belum diisi]',
      description: description || '[belum diisi]',
      imageUrl: imagePreview,
      beforeImageUrl: beforePreview || undefined,
      date: dateStr,
      time: timeStr,
      phaseName: activePhaseName,
      category: activePhaseName,
      supervisorName: supervisorName || '[belum diisi]',
      weather: '[belum diisi]',
      isMilestoneProof: true,
    };

    const milestoneUpdate: PhotoMilestoneUpdate | undefined =
      selectedMilestone && milestonePercent !== selectedMilestone.progressPercent
        ? {
            milestoneId: selectedMilestone.id,
            milestoneName: selectedMilestone.name,
            progressPercent: milestonePercent,
          }
        : undefined;

    try {
      await onSavePhoto(newPhoto, milestoneUpdate);
      resetForm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className="w-full max-w-lg bg-[#282929] border border-[#444545] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-[#202121] border-b border-[#3d3e3e] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-[#f95700]" />
            <h3 className="text-sm font-bold text-white">Unggah Foto Berkala Lapangan</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Camera Viewfinder Overlay */}
        {cameraTarget ? (
          <div className="p-4 space-y-3 text-xs overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">
                {cameraTarget === 'after' ? 'Ambil Foto Lapangan Terkini' : 'Ambil Foto Kondisi Sebelum'}
              </span>
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  setCameraTarget(null);
                }}
                className="text-gray-400 hover:text-white font-semibold"
              >
                Kembali
              </button>
            </div>

            {cameraError ? (
              <div className="bg-[#202121] border border-[#3d3e3e] rounded-2xl p-5 text-center space-y-3">
                <p className="text-amber-300 leading-relaxed">{cameraError}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const targetRef =
                        cameraTarget === 'after' ? nativeCamInputRef : beforeNativeCamInputRef;
                      stopCameraStream();
                      setCameraTarget(null);
                      targetRef.current?.click();
                    }}
                    className="bg-[#f95700] hover:bg-[#e04e00] text-white font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Kamera Bawaan HP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const targetRef =
                        cameraTarget === 'after' ? fileInputRef : beforeFileInputRef;
                      stopCameraStream();
                      setCameraTarget(null);
                      targetRef.current?.click();
                    }}
                    className="bg-[#333434] hover:bg-[#3d3e3e] border border-[#484949] text-white font-semibold px-3.5 py-2 rounded-xl flex items-center space-x-1.5"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Pilih dari Perangkat</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-black border border-[#3d3e3e] aspect-4/3 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!isCameraReady && (
                    <span className="absolute text-gray-300 text-xs">Membuka kamera...</span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                    }
                    className="flex items-center space-x-1.5 bg-[#202121] hover:bg-[#333434] border border-[#3d3e3e] text-gray-200 px-3 py-2.5 rounded-xl font-semibold"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Putar Kamera</span>
                  </button>

                  <button
                    type="button"
                    disabled={!isCameraReady}
                    onClick={handleCapturePhoto}
                    className="flex-1 bg-[#f95700] hover:bg-[#e04e00] disabled:opacity-40 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-1.5 shadow-lg shadow-[#f95700]/25"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Ambil Foto</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-3.5 text-xs">
            {/* Hidden file inputs: gallery/device upload & native camera fallback */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileChange(e, 'after')}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={nativeCamInputRef}
              onChange={(e) => handleFileChange(e, 'after')}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
            <input
              type="file"
              ref={beforeFileInputRef}
              onChange={(e) => handleFileChange(e, 'before')}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={beforeNativeCamInputRef}
              onChange={(e) => handleFileChange(e, 'before')}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            <div>
              <label className="block text-gray-300 font-semibold mb-1">
                Tahapan Pekerjaan *
              </label>
              <select
                value={selectedMilestone?.id || ''}
                onChange={(e) => handleSelectMilestone(e.target.value)}
                className="w-full bg-[#202121] border border-[#3d3e3e] rounded-xl px-3 py-2 text-white outline-none focus:border-[#f95700]"
              >
                {milestones.length > 0 ? (
                  milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Bobot {m.weight}% • {m.progressPercent}%)
                    </option>
                  ))
                ) : (
                  <option value="">[belum diisi]</option>
                )}
              </select>

              {selectedMilestone && (
                <div className="mt-2.5 bg-[#202121] border border-[#3d3e3e] rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-300">
                      Progres Tahap Ini (Bobot {selectedMilestone.weight}%)
                    </span>
                    <span className="text-xs font-black text-[#f95700]">
                      {milestonePercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={milestonePercent}
                    onChange={(e) => setMilestonePercent(Number(e.target.value))}
                    className="w-full accent-[#f95700]"
                  />
                  <div className="flex items-center justify-between gap-1.5">
                    {[0, 25, 50, 75, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setMilestonePercent(val)}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                          milestonePercent === val
                            ? 'bg-[#f95700] border-[#f95700] text-white'
                            : 'bg-[#282929] border-[#3d3e3e] text-gray-300 hover:text-white'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-[#2d2e2e]">
                    <span>
                      Kontribusi tahap: <strong className="text-gray-200">{calculateMilestoneContribution(selectedMilestone.weight, milestonePercent)}%</strong> / {selectedMilestone.weight}%
                    </span>
                    <span>
                      Total Proyek: <strong className={projectedTotalProgress !== currentTotalProgress ? 'text-emerald-400' : 'text-gray-200'}>
                        {projectedTotalProgress}%
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1.5">
                Foto Lapangan Terkini *
              </label>

              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-[#3d3e3e] h-44 bg-black">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 bg-black/75 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-lg">
                    Terkompresi ~{estimateDataUrlKb(imagePreview)} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => setImagePreview('')}
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCameraTarget('after')}
                    className="border-2 border-dashed border-[#3d3e3e] hover:border-[#f95700] rounded-2xl p-4 text-center cursor-pointer bg-[#202121]/60 transition-colors"
                  >
                    <Camera className="w-6 h-6 mx-auto text-[#f95700] mb-1.5" />
                    <p className="text-gray-200 font-semibold">Ambil via Kamera</p>
                    <p className="text-gray-400 text-[10px] mt-0.5">Foto langsung di lokasi</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#3d3e3e] hover:border-[#f95700] rounded-2xl p-4 text-center cursor-pointer bg-[#202121]/60 transition-colors"
                  >
                    <Upload className="w-6 h-6 mx-auto text-[#f95700] mb-1.5" />
                    <p className="text-gray-200 font-semibold">Upload dari Perangkat</p>
                    <p className="text-gray-400 text-[10px] mt-0.5">JPG, PNG, WEBP</p>
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1.5">
                Foto Kondisi Sebelum (Opsional — untuk pembanding)
              </label>

              {beforePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-[#3d3e3e] h-32 bg-black">
                  <img src={beforePreview} alt="Preview Sebelum" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 bg-black/75 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-lg">
                    Terkompresi ~{estimateDataUrlKb(beforePreview)} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => setBeforePreview('')}
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCameraTarget('before')}
                    className="border border-dashed border-[#3d3e3e] hover:border-[#f95700] rounded-xl p-2.5 text-center cursor-pointer bg-[#202121]/40 text-gray-300 hover:text-white flex items-center justify-center space-x-1.5"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#f95700]" />
                    <span>Kamera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => beforeFileInputRef.current?.click()}
                    className="border border-dashed border-[#3d3e3e] hover:border-[#f95700] rounded-xl p-2.5 text-center cursor-pointer bg-[#202121]/40 text-gray-300 hover:text-white flex items-center justify-center space-x-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#f95700]" />
                    <span>Dari Perangkat</span>
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Judul / Keterangan Foto *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul foto..."
                className="w-full bg-[#202121] border border-[#3d3e3e] rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Catatan / Deskripsi</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsi pengerjaan..."
                className="w-full bg-[#202121] border border-[#3d3e3e] rounded-xl p-2.5 text-white resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2 border-t border-[#3d3e3e]">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!imagePreview || isSubmitting}
                className="bg-[#f95700] hover:bg-[#e04e00] disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl flex items-center space-x-1"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Foto'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
