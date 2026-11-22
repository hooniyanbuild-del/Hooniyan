import React, { useState } from 'react';
import { X, Link2, Check, Share2, UserCheck, HardHat } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  signedInEmail: string | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  signedInEmail,
}) => {
  const [copiedTarget, setCopiedTarget] = useState<'consumer' | 'supervisor' | null>(null);

  if (!isOpen) return null;

  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const supervisorUrl = `${baseUrl}?mode=pengawas`;

  const handleCopy = async (url: string, target: 'consumer' | 'supervisor') => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedTarget(target);
      setTimeout(() => setCopiedTarget(null), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedTarget(target);
        setTimeout(() => setCopiedTarget(null), 2000);
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#282929] border border-[#444545] rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-[#202121] border-b border-[#3d3e3e] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-[#f95700]" />
            <h3 className="text-sm font-bold text-white">Bagikan ke Konsumen</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {signedInEmail && (
            <div className="flex items-center space-x-2 bg-[#202121] border border-[#3d3e3e] rounded-xl px-3 py-2.5">
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-gray-400 block">Masuk sebagai pengawas:</span>
                <span className="text-gray-200 font-semibold truncate block">{signedInEmail}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-gray-200 font-bold">
              Link Konsumen (Tanpa Login & Tanpa Tombol Masuk)
            </label>
            <p className="text-[11px] text-gray-400">
              Bagikan link ini ke konsumen. Tampilan bersih khusus melihat progres tanpa tombol login.
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={baseUrl}
                className="flex-1 bg-[#202121] border border-[#3d3e3e] rounded-xl px-3 py-2 text-gray-300 text-[11px] outline-none select-all"
              />
              <button
                type="button"
                onClick={() => handleCopy(baseUrl, 'consumer')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl font-bold border transition-colors shrink-0 ${
                  copiedTarget === 'consumer'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#f95700] hover:bg-[#e04e00] border-[#f95700] text-white'
                }`}
              >
                {copiedTarget === 'consumer' ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                <span>{copiedTarget === 'consumer' ? 'Tersalin!' : 'Salin Link'}</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-[#3d3e3e] space-y-2">
            <label className="flex items-center space-x-1.5 text-gray-300 font-semibold text-[11px]">
              <HardHat className="w-3.5 h-3.5 text-amber-400" />
              <span>Link Khusus Pengawas (Simpan untuk Masuk / Edit)</span>
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={supervisorUrl}
                className="flex-1 bg-[#202121] border border-[#3d3e3e] rounded-xl px-3 py-1.5 text-gray-400 text-[10px] outline-none select-all"
              />
              <button
                type="button"
                onClick={() => handleCopy(supervisorUrl, 'supervisor')}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl font-semibold border border-[#444545] bg-[#202121] hover:bg-[#333434] text-gray-200 text-[10px] shrink-0"
              >
                {copiedTarget === 'supervisor' ? <Check className="w-3 h-3 text-emerald-400" /> : <Link2 className="w-3 h-3" />}
                <span>{copiedTarget === 'supervisor' ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
