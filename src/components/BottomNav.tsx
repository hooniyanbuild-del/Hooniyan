import React from 'react';
import { 
  Home, 
  TrendingUp, 
  Camera, 
  MessageSquare 
} from 'lucide-react';
import { UserRole } from '../types/project';

export type MainTab = 'beranda' | 'progres' | 'galeri' | 'chat';

interface BottomNavProps {
  activeTab: MainTab;
  onChangeTab: (tab: MainTab) => void;
  unreadChatCount: number;
  currentRole: UserRole;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  unreadChatCount,
}) => {
  const tabs = [
    { id: 'beranda' as const, label: 'Beranda', icon: Home },
    { id: 'progres' as const, label: 'Progres', icon: TrendingUp },
    { id: 'galeri' as const, label: 'Foto', icon: Camera },
    { id: 'chat' as const, label: 'Chat', icon: MessageSquare, badge: unreadChatCount },
  ];

  return (
    <>
      {/* 1. Mobile Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#282929]/95 backdrop-blur-lg border-t border-[#444545] px-2 py-1.5 sm:hidden no-print">
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl relative transition-all active:scale-95 ${
                  isActive
                    ? 'text-[#f95700] font-bold'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -top-1 -right-2 bg-[#f95700] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#282929]">
                      {tab.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f95700] mt-0.5"></span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 2. Desktop & Tablet Clean Segmented Top Pills */}
      <div className="hidden sm:flex justify-center mb-6 no-print max-w-2xl lg:max-w-4xl mx-auto">
        <div className="bg-[#282929] border border-[#444545] p-1.5 rounded-2xl flex items-center space-x-1 shadow-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#f95700] text-white shadow-md shadow-[#f95700]/25'
                    : 'text-gray-400 hover:text-white hover:bg-[#383939]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="bg-white text-[#f95700] text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
