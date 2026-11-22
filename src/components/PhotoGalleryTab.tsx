import React, { useState } from 'react';
import {
  Camera,
  Upload,
  SplitSquareVertical,
  ImageIcon,
  X,
  Trash2,
  Pencil,
  Check,
} from 'lucide-react';
import { Milestone, SitePhoto, UserRole } from '../types/project';
import { BeforeAfterSlider } from './BeforeAfterSlider';

interface PhotoGalleryTabProps {
  photos: SitePhoto[];
  milestones?: Milestone[];
  currentRole: UserRole;
  onOpenUploadModal: () => void;
  onDeletePhoto?: (photoId: string) => Promise<void> | void;
  onUpdatePhoto?: (
    photoId: string,
    updates: { title: string; description: string; phaseName: string }
  ) => Promise<void> | void;
}

export const PhotoGalleryTab: React.FC<PhotoGalleryTabProps> = ({
  photos,
  milestones = [],
  currentRole,
  onOpenUploadModal,
  onDeletePhoto,
  onUpdatePhoto,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<SitePhoto | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'comparison'>('grid');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPhase, setEditPhase] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const beforeAfterPhotos = photos.filter((p) => p.beforeImageUrl);

  const handleConfirmDelete = async (photoId: string) => {
    if (!onDeletePhoto || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDeletePhoto(photoId);
      setConfirmDeleteId(null);
      if (selectedPhoto?.id === photoId) {
        setSelectedPhoto(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartEdit = (photo: SitePhoto) => {
    setConfirmDeleteId(null);
    setEditingPhotoId(photo.id);
    setEditTitle(photo.title);
    setEditDesc(photo.description);
    setEditPhase(photo.phaseName);
  };

  const handleSaveEdit = async (photoId: string) => {
    if (!onUpdatePhoto || isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      const updates = {
        title: editTitle.trim() || '[belum diisi]',
        description: editDesc.trim() || '[belum diisi]',
        phaseName: editPhase || '[belum diisi]',
      };
      await onUpdatePhoto(photoId, updates);
      if (selectedPhoto?.id === photoId) {
        setSelectedPhoto({
          ...selectedPhoto,
          ...updates,
          category: updates.phaseName,
        });
      }
      setEditingPhotoId(null);
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl lg:max-w-4xl mx-auto pb-20 sm:pb-8">
      {/* Header */}
      <div className="bg-[#282929] border border-[#444545] rounded-3xl p-5 shadow-lg flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#f95700]" />
            Dokumentasi Foto Berkala
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Total foto: {photos.length}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {beforeAfterPhotos.length > 0 && (
            <div className="flex items-center bg-[#202121] border border-[#3d3e3e] p-1 rounded-xl text-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  viewMode === 'grid' ? 'bg-[#f95700] text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setViewMode('comparison')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center space-x-1 ${
                  viewMode === 'comparison' ? 'bg-[#f95700] text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                <span>Sebelum-Sesudah</span>
              </button>
            </div>
          )}

          {currentRole === 'pengawas' && (
            <button
              onClick={onOpenUploadModal}
              className="flex items-center space-x-1.5 bg-[#f95700] hover:bg-[#e04e00] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-[#f95700]/20 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Unggah Foto</span>
            </button>
          )}
        </div>
      </div>

      {/* Comparison View */}
      {viewMode === 'comparison' && beforeAfterPhotos.length > 0 && (
        <div className="space-y-4">
          {beforeAfterPhotos.map((photo) => (
            <div key={photo.id} className="bg-[#282929] border border-[#444545] rounded-3xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-[#3d3e3e] pb-2 gap-2">
                <h4 className="text-sm font-bold text-white">{photo.title}</h4>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-xs text-gray-400">{photo.date}</span>
                  {currentRole === 'pengawas' && onDeletePhoto && (
                    confirmDeleteId === photo.id ? (
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleConfirmDelete(photo.id)}
                          className="text-[10px] font-bold bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded-lg"
                        >
                          {isDeleting ? '...' : 'Ya, Hapus'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[10px] text-gray-400 hover:text-white px-1.5 py-1"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(photo.id)}
                        className="flex items-center space-x-1 text-[11px] font-semibold text-red-400 hover:text-red-300 px-2 py-1 rounded-lg bg-red-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )
                  )}
                </div>
              </div>
              <BeforeAfterSlider
                beforeImage={photo.beforeImageUrl!}
                afterImage={photo.imageUrl}
              />
              <p className="text-xs text-gray-300">{photo.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        photos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {photos.map((photo) => {
              const isEditingThis = editingPhotoId === photo.id;
              return (
                <div
                  key={photo.id}
                  onClick={() => !isEditingThis && setSelectedPhoto(photo)}
                  className="bg-[#282929] border border-[#444545] rounded-2xl overflow-hidden shadow-lg cursor-pointer group flex flex-col"
                >
                  <div className="relative h-52 bg-black">
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-black/75 px-2 py-0.5 rounded text-[10px] text-gray-200">
                      {photo.phaseName || '[belum diisi]'}
                    </div>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    {isEditingThis ? (
                      <div
                        className="space-y-2 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Judul foto..."
                          className="w-full bg-[#202121] border border-[#3d3e3e] rounded-lg px-2.5 py-1.5 text-white"
                        />
                        {milestones.length > 0 && (
                          <select
                            value={editPhase}
                            onChange={(e) => setEditPhase(e.target.value)}
                            className="w-full bg-[#202121] border border-[#3d3e3e] rounded-lg px-2.5 py-1.5 text-white"
                          >
                            {milestones.map((m) => (
                              <option key={m.id} value={m.name}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        )}
                        <textarea
                          rows={2}
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Catatan / deskripsi..."
                          className="w-full bg-[#202121] border border-[#3d3e3e] rounded-lg p-2 text-white resize-none"
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setEditingPhotoId(null)}
                            className="px-2.5 py-1 text-gray-400 hover:text-white"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            disabled={isSavingEdit}
                            onClick={() => handleSaveEdit(photo.id)}
                            className="flex items-center space-x-1 bg-[#f95700] text-white px-3 py-1 rounded-lg font-bold"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isSavingEdit ? 'Menyimpan...' : 'Simpan'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <h4 className="text-xs font-bold text-white">{photo.title}</h4>
                          <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{photo.description}</p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-[#3d3e3e] flex items-center justify-between gap-2">
                          <span className="text-[10px] text-gray-500">{photo.date}</span>

                          {currentRole === 'pengawas' && (
                            <div
                              className="flex items-center space-x-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {confirmDeleteId === photo.id ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={() => handleConfirmDelete(photo.id)}
                                    className="text-[10px] font-bold bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded-lg"
                                  >
                                    {isDeleting ? '...' : 'Ya, Hapus'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="text-[10px] text-gray-400 hover:text-white px-1.5 py-1"
                                  >
                                    Batal
                                  </button>
                                </>
                              ) : (
                                <>
                                  {onUpdatePhoto && (
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(photo)}
                                      className="flex items-center space-x-1 text-[10px] font-semibold text-gray-200 hover:text-white bg-[#202121] border border-[#3d3e3e] px-2.5 py-1 rounded-lg"
                                    >
                                      <Pencil className="w-3 h-3 text-[#f95700]" />
                                      <span>Koreksi</span>
                                    </button>
                                  )}
                                  {onDeletePhoto && (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(photo.id)}
                                      className="flex items-center space-x-1 text-[10px] font-semibold text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Hapus</span>
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#282929] border border-[#444545] rounded-3xl p-12 text-center text-xs text-gray-400">
            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p>[belum ada foto]</p>
            {currentRole === 'pengawas' && (
              <button
                onClick={onOpenUploadModal}
                className="mt-3 text-xs text-[#f95700] font-bold hover:underline"
              >
                + Unggah Foto Pertama
              </button>
            )}
          </div>
        )
      )}

      {/* Modal Preview */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="w-full max-w-xl bg-[#282929] border border-[#444545] rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-[#202121] border-b border-[#3d3e3e] flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-white truncate">{selectedPhoto.title}</h4>
              <div className="flex items-center space-x-2 shrink-0">
                {currentRole === 'pengawas' && onDeletePhoto && (
                  confirmDeleteId === selectedPhoto.id ? (
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleConfirmDelete(selectedPhoto.id)}
                        className="text-[10px] font-bold bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded-lg"
                      >
                        {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-[10px] text-gray-400 hover:text-white px-1.5 py-1"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(selectedPhoto.id)}
                      className="flex items-center space-x-1 text-[11px] font-semibold text-red-400 hover:text-red-300 px-2.5 py-1 rounded-lg bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Foto</span>
                    </button>
                  )
                )}
                <button onClick={() => setSelectedPhoto(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-3">
              <img src={selectedPhoto.imageUrl} alt="" className="w-full max-h-[60vh] object-contain rounded-lg" />
              <p className="text-xs text-gray-300 mt-3">{selectedPhoto.description}</p>
              <p className="text-[10px] text-gray-500 mt-1">{selectedPhoto.date} • {selectedPhoto.time}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
