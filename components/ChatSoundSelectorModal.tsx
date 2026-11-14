import React, { useState } from 'react';
import { 
  ChatSoundTheme, 
  CHAT_SOUND_THEMES, 
  getChatSoundTheme, 
  setChatSoundTheme, 
  isChatSoundEnabled, 
  setChatSoundEnabled, 
  getChatSoundVolume, 
  setChatSoundVolume, 
  playChatNotificationSound 
} from '../utils/chatNotificationUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onThemeChanged?: (theme: ChatSoundTheme) => void;
}

const ChatSoundSelectorModal: React.FC<Props> = ({ isOpen, onClose, onThemeChanged }) => {
  const [currentTheme, setCurrentTheme] = useState<ChatSoundTheme>(getChatSoundTheme);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(isChatSoundEnabled);
  const [volume, setVolume] = useState<number>(() => Math.round(getChatSoundVolume() * 100));
  const [playingId, setPlayingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectTheme = (theme: ChatSoundTheme) => {
    setCurrentTheme(theme);
    setChatSoundTheme(theme);
    if (onThemeChanged) onThemeChanged(theme);
    handlePlayPreview(theme);
  };

  const handlePlayPreview = (theme: ChatSoundTheme) => {
    setPlayingId(theme);
    playChatNotificationSound(volume / 100, theme);
    setTimeout(() => {
      setPlayingId(null);
    }, 600);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setChatSoundEnabled(next);
    if (next) {
      playChatNotificationSound(volume / 100, currentTheme);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setChatSoundVolume(newVol / 100);
  };

  return (
    <div className="fixed inset-0 z-[10015] flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-xs animate-fade-in no-print">
      <div 
        className="bg-white rounded-none md:rounded-3xl shadow-2xl border-0 md:border border-gray-200 max-w-none md:max-w-md w-full overflow-hidden animate-scale-in flex flex-col h-full md:h-auto max-h-none md:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-deepgreen to-teal-800 text-white px-3 py-3.5 md:p-5 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-xl shadow-inner">
              🎵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight">채팅 알림음 설정</h3>
                <span className="text-[10px] bg-gold-400 text-gray-950 px-2 py-0.5 rounded-full font-black">
                  10가지 사운드
                </span>
              </div>
              <p className="text-[11px] text-teal-100 font-medium">원하는 알림음을 미리 들어보고 선택하세요</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center font-bold text-sm transition cursor-pointer"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* Global Controls: Sound On/Off & Volume Slider */}
        <div className="p-3.5 bg-gray-50 border-b border-gray-200/80 space-y-2.5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-800">알림음 재생</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                soundEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {soundEnabled ? '켜짐' : '무음'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleSound}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                soundEnabled ? 'bg-deepgreen' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {soundEnabled && (
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs font-bold text-gray-500 shrink-0">🔊 볼륨</span>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                onMouseUp={() => playChatNotificationSound(volume / 100, currentTheme)}
                onTouchEnd={() => playChatNotificationSound(volume / 100, currentTheme)}
                className="w-full accent-deepgreen h-1.5 bg-gray-200 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-gray-700 w-10 text-right shrink-0">
                {volume}%
              </span>
            </div>
          )}
        </div>

        {/* 10 Sound Themes List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 divide-y divide-gray-100">
          {CHAT_SOUND_THEMES.map((theme, index) => {
            const isSelected = currentTheme === theme.id;
            const isPlaying = playingId === theme.id;

            return (
              <div
                key={theme.id}
                onClick={() => handleSelectTheme(theme.id)}
                className={`flex items-center justify-between p-3 rounded-2xl transition cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-50/70 border-gold-400 shadow-xs'
                    : 'bg-white hover:bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  {/* Radio Indicator */}
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 shrink-0 transition ${
                    isSelected ? 'border-gold-500 bg-gold-500 text-white' : 'border-gray-300 bg-white'
                  }`}>
                    {isSelected && <span className="text-[10px] font-bold">✓</span>}
                  </div>

                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                    isSelected ? 'bg-amber-100 shadow-2xs' : 'bg-gray-100'
                  }`}>
                    {theme.icon}
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-gray-900 tracking-tight">
                        {index + 1}. {theme.name}
                      </span>
                      {theme.badge && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                          theme.badge.includes('추천') 
                            ? 'bg-blue-100 text-blue-700' 
                            : theme.badge.includes('골프') 
                              ? 'bg-emerald-100 text-emerald-700 font-extrabold'
                              : theme.badge.includes('시그니처')
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-700'
                        }`}>
                          {theme.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">{theme.description}</p>
                  </div>
                </div>

                {/* Preview Sound Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayPreview(theme.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-2xs ${
                    isPlaying
                      ? 'bg-gold-500 text-white ring-2 ring-gold-300 animate-pulse'
                      : isSelected
                        ? 'bg-deepgreen text-white hover:bg-teal-900'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title={`${theme.name} 사운드 미리듣기`}
                >
                  <span>{isPlaying ? '🔊' : '▶'}</span>
                  <span>{isPlaying ? '재생 중' : '미리듣기'}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-gray-600 font-medium">
            현재 선택: <strong className="text-deepgreen font-bold">
              {CHAT_SOUND_THEMES.find(t => t.id === currentTheme)?.name}
            </strong>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-deepgreen hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
          >
            설정 완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSoundSelectorModal;
