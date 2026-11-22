import React from 'react';
import { 
  X, 
  Bell, 
  CheckCheck, 
  Image as ImageIcon, 
  TrendingUp, 
  Flag, 
  MessageSquare, 
  AlertTriangle 
} from 'lucide-react';
import { ProjectNotification } from '../types/project';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: ProjectNotification[];
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
  onSelectNotification: (notif: ProjectNotification) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
  onSelectNotification,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: ProjectNotification['type']) => {
    switch (type) {
      case 'foto':
        return <ImageIcon className="w-4 h-4 text-cyan-400" />;
      case 'progres':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'milestone':
        return <Flag className="w-4 h-4 text-[#f95700]" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      case 'peringatan':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-[#282929] border border-[#444545] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] mt-12"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-[#202121] border-b border-[#3d3e3e] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#f95700]/15 rounded-xl text-[#f95700]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Notifikasi Proyek
                {unreadCount > 0 && (
                  <span className="bg-[#f95700] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-400">Pemberitahuan otomatis proyek</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {notifications.length > 0 && (
          <div className="px-4 py-2 bg-[#1e1f1f] border-b border-[#3d3e3e] flex justify-end text-xs">
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center space-x-1 text-gray-400 hover:text-[#f95700]"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Tandai Semua Dibaca</span>
            </button>
          </div>
        )}

        <div className="overflow-y-auto flex-1 divide-y divide-[#3d3e3e]">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              [belum ada notifikasi]
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onMarkAsRead(item.id);
                  onSelectNotification(item);
                }}
                className={`p-4 transition-colors cursor-pointer hover:bg-[#323333] flex items-start space-x-3.5 ${
                  !item.read ? 'bg-[#222323] border-l-2 border-[#f95700]' : 'opacity-85'
                }`}
              >
                <div className="p-2 bg-[#1a1b1b] rounded-xl shrink-0 mt-0.5 border border-[#3d3e3e]">
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-white truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                      {item.relativeTime}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
