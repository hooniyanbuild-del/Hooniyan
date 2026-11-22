import React from 'react';
import {
  Bell,
  Eye,
  HardHat,
  Share2,
  LogIn,
  LogOut,
} from 'lucide-react';
import { Project, UserRole, ProjectNotification } from '../types/project';

import hooniyanLogo from '../assets/Hooniyan_logo.png';

interface HeaderProps {
  currentProject: Project;
  activeRole: UserRole;
  signedInEmail: string | null;
  showLoginButton: boolean;
  notifications: ProjectNotification[];
  onOpenNotifications: () => void;
  onOpenLogin: () => void;
  onOpenShare: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeRole,
  signedInEmail,
  showLoginButton,
  notifications,
  onOpenNotifications,
  onOpenLogin,
  onOpenShare,
  onSignOut,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-[#282929]/95 backdrop-blur-md border-b border-[#444545] px-4 py-3">
      <div className="max-w-2xl lg:max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div className="flex items-center shrink-0">
          <img
            src={hooniyanLogo}
            alt="Hooniyan Build"
            className="h-8 w-auto max-w-[130px] sm:max-w-[170px] object-contain"
          />
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2">
          {/* Mode Indicator */}
          <div
            className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#202121] border border-[#3d3e3e] rounded-xl text-xs font-medium text-gray-200"
            title={signedInEmail ? `Masuk sebagai ${signedInEmail}` : 'Mode Lihat Saja'}
          >
            {activeRole === 'klien' ? (
              <>
                <Eye className="w-3.5 h-3.5 text-[#f95700]" />
                <span className="hidden sm:inline">Lihat Saja</span>
              </>
            ) : (
              <>
                <HardHat className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Pengawas</span>
              </>
            )}
          </div>

          {/* Bagikan (Pengawas only) */}
          {activeRole === 'pengawas' && (
            <button
              type="button"
              onClick={onOpenShare}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#f95700] hover:bg-[#e04e00] border border-[#f95700] text-white rounded-xl text-xs font-bold transition-colors active:scale-95"
              title="Bagikan link ke konsumen"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan</span>
            </button>
          )}

          {/* Notifications Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative p-2 bg-[#2e2f2f] hover:bg-[#383939] border border-[#484949] text-gray-200 rounded-xl transition-colors"
            title="Pemberitahuan Proyek"
          >
            <Bell className="w-4 h-4 text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#f95700] text-[9px] font-black text-white ring-2 ring-[#282929]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Login / Logout (Masuk only visible on supervisor URL) */}
          {activeRole === 'pengawas' ? (
            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#2e2f2f] hover:bg-[#383939] border border-[#484949] text-gray-300 hover:text-white rounded-xl text-xs font-semibold transition-colors active:scale-95"
              title="Keluar dari akun Pengawas"
            >
              <LogOut className="w-3.5 h-3.5 text-gray-400" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          ) : showLoginButton ? (
            <button
              type="button"
              onClick={onOpenLogin}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#f95700] hover:bg-[#e04e00] text-white rounded-xl text-xs font-bold transition-colors active:scale-95"
              title="Masuk dengan akun Google Pengawas"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
};
