import React, { useState, useEffect } from 'react';
import { X, HardHat, Eye } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleLogin: () => Promise<void>;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onGoogleLogin,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      await onGoogleLogin();
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code || '')
          : '';
      const msg = err instanceof Error ? err.message : '';
      const combined = `${code} ${msg}`;

      if (combined.includes('popup-closed-by-user') || combined.includes('cancelled-popup-request')) {
        return;
      }

      if (combined.includes('unauthorized-domain')) {
        setErrorMsg(
          `Domain "${window.location.hostname}" belum ditambahkan di Firebase Authentication → Settings → Authorized domains.`
        );
      } else if (combined.includes('popup-blocked')) {
        setErrorMsg(
          'Popup login diblokir oleh browser. Izinkan pop-up di Safari/Chrome atau buka link langsung di Safari (bukan browser dalam WhatsApp).'
        );
      } else if (combined.includes('email-not-verified')) {
        setErrorMsg('Akun Google ini belum memiliki email terverifikasi.');
      } else if (combined.includes('network-request-failed')) {
        setErrorMsg('Koneksi internet bermasalah. Periksa jaringan lalu coba lagi.');
      } else {
        setErrorMsg(`Gagal masuk dengan Google${code ? ` (${code})` : ''}. Silakan coba lagi.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#282929] border border-[#444545] rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-[#202121] border-b border-[#3d3e3e] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HardHat className="w-5 h-5 text-[#f95700]" />
            <h3 className="text-sm font-bold text-white">Masuk Pengawas</h3>
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
          <p className="text-gray-300 leading-relaxed">
            Masuk menggunakan akun Google pribadi Anda sebagai pengawas untuk mengisi progres tahapan, rekap mingguan, dan foto lapangan secara terus-menerus.
          </p>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-2.5 text-[11px]">
              {errorMsg}
            </div>
          )}

          <button
            type="button"
            disabled={isLoading}
            onClick={handleLogin}
            className="w-full flex items-center justify-center space-x-2.5 bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-900 font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-98"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>{isLoading ? 'Menghubungkan...' : 'Masuk dengan Google'}</span>
          </button>

          <div className="pt-2 border-t border-[#3d3e3e] flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center space-x-1">
              <Eye className="w-3.5 h-3.5 text-[#f95700]" />
              <span>Konsumen tidak perlu login</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-300 hover:text-white font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
