import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  HardHat, 
  Clock, 
  MessageSquare
} from 'lucide-react';
import { ChatMessage, UserRole } from '../types/project';

interface LiveChatTabProps {
  messages: ChatMessage[];
  currentRole: UserRole;
  supervisorName: string;
  supervisorPhone: string;
  clientName: string;
  onSendMessage: (msg: { text: string; role: UserRole; attachmentUrl?: string; isVoice?: boolean }) => void;
}

export const LiveChatTab: React.FC<LiveChatTabProps> = ({
  messages,
  currentRole,
  supervisorName,
  clientName,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    onSendMessage({
      text: inputText,
      role: currentRole,
    });
    setInputText('');
  };

  return (
    <div className="bg-[#282929] border border-[#444545] rounded-3xl overflow-hidden flex flex-col h-[580px] shadow-xl max-w-2xl lg:max-w-4xl mx-auto pb-16 sm:pb-0">
      {/* Top Bar */}
      <div className="p-3.5 bg-[#202121] border-b border-[#3d3e3e] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#f95700]/20 border border-[#f95700]/50 flex items-center justify-center text-[#f95700] font-bold">
            {currentRole === 'klien' ? (
              <HardHat className="w-5 h-5" />
            ) : (
              <span className="text-sm font-bold">KL</span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {currentRole === 'klien' 
                ? (supervisorName || '[belum diisi]') 
                : (clientName || '[belum diisi]')}
            </h3>
            <p className="text-[11px] text-gray-400">
              {currentRole === 'klien' ? 'Pengawas Lapangan' : 'Klien Konsumen'}
            </p>
          </div>
        </div>

        <div className="px-2.5 py-1 rounded-xl bg-[#1a1b1b] border border-[#3d3e3e] text-[11px] font-semibold text-gray-300">
          Mode: <strong className="text-white">{currentRole === 'klien' ? 'Klien' : 'Pengawas'}</strong>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-xs text-gray-400 py-12">
            <MessageSquare className="w-8 h-8 text-gray-500 mb-2" />
            <p>[belum ada pesan]</p>
            <p className="text-[11px] text-gray-400 mt-1">Ketik pesan di bawah untuk mulai komunikasi.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderRole === currentRole;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center space-x-1.5 mb-1 px-1">
                  <span className="text-[10px] text-gray-400 font-semibold">{msg.senderName}</span>
                  <span className="text-[9px] text-gray-500">{msg.timeString}</span>
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl p-3 shadow-md text-xs sm:text-sm ${
                    isMine
                      ? 'bg-[#f95700] text-white rounded-br-xs'
                      : 'bg-[#202121] text-gray-100 border border-[#3d3e3e] rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <div className="flex items-center justify-end space-x-1 mt-1 text-[9px] opacity-75">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{msg.timeString}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-[#202121] border-t border-[#3d3e3e]">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              currentRole === 'klien'
                ? 'Tulis pesan untuk pengawas lapangan...'
                : 'Tulis pesan sebagai pengawas lapangan...'
            }
            className="flex-1 bg-[#282929] border border-[#444545] focus:border-[#f95700] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-400 outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="bg-[#f95700] hover:bg-[#e04e00] disabled:opacity-40 text-white p-2.5 rounded-xl font-bold shadow-md shadow-[#f95700]/25 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
