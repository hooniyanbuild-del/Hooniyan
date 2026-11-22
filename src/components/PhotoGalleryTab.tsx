import React, { useState } from 'react';
import {
  Camera,
  Upload,
  SplitSquareVertical,
  ImageIcon,
  X,
  Trash2,
} from 'lucide-react';
import { SitePhoto, UserRole } from '../types/project';
import { BeforeAfterSlider } from './BeforeAfterSlider';

interface PhotoGalleryTabProps {
  photos: SitePhoto[];
  currentRole: UserRole;
  onOpenUploadModal: () => void;
  onDeletePhoto?: (photoId: string) => Promise<void> | void;
}

export const PhotoGalleryTab: React.FC<PhotoGalleryTabProps> = ({
  photos,
  currentRole,
  onOpenUploadModal,
  onDeletePhoto,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<SitePhoto | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'comparison'>('grid');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
                        className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10"
                        title="Hapus foto"
                      >
                        <Trash2 className="w-4 h-4" />
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
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="bg-[#282929] border border-[#444545] rounded-2xl overflow-hidden shadow-lg cursor-pointer group"
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
                  {currentRole === 'pengawas' && onDeletePhoto && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(confirmDeleteId === photo.id ? null : photo.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/75 hover:bg-red-600 text-gray-200 hover:text-white rounded-lg transition-colors"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="p-3.5">
                  <h4 className="text-xs font-bold text-white">{photo.title}</h4>
                  <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{photo.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-500">{photo.date}</span>
                    {currentRole === 'pengawas' && confirmDeleteId === photo.id && (
                      <div
                        className="flex items-center space-x-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                    )}
                  </div>
                </div>
              </div>
            ))}
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
                      className="flex items-center space-x-1 text-[11px] font-semibold text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
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
