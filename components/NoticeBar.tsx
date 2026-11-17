import React, { useState, useEffect } from 'react';
import { NoticeItem } from '../types';

interface Props {
  notices: NoticeItem[];
}

const NoticeBar: React.FC<Props> = ({ notices }) => {
  const activeNotices = notices.filter(n => n.isActive !== false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);

  const safeIndex = activeNotices.length > 0 ? currentIndex % activeNotices.length : 0;
  const currentNotice = activeNotices[safeIndex] || null;

  useEffect(() => {
    if (activeNotices.length <= 1 || isPaused || selectedNotice) return;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeNotices.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [activeNotices.length, isPaused, selectedNotice]);

  useEffect(() => {
    if (!selectedNotice) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNotice(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNotice]);

  if (!currentNotice) return null;

  const selectedIdx = selectedNotice
    ? activeNotices.findIndex(n => n.id === selectedNotice.id)
    : -1;

  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 shrink-0">
        <button
          type="button"
          onClick={() => setSelectedNotice(currentNotice)}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
          aria-label={`공지사항 보기: ${currentNotice.title}`}
          className="w-full rounded-2xl bg-[#E5E7EB]/85 hover:bg-[#DFE3E8] border border-gray-300/80 shadow-2xs px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 flex items-center justify-between gap-3 text-left transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepgreen/50"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <span className="text-[13px] sm:text-sm md:text-[15px] font-black text-gray-900 shrink-0 whitespace-nowrap tracking-tight">
              공지
            </span>
            <span className="w-px h-4 bg-gray-400/70 shrink-0" aria-hidden="true" />
            <div key={currentNotice.id} className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 animate-fade-in">
              {currentNotice.isImportant && (
                <span className="text-[13px] sm:text-sm md:text-[15px] font-extrabold text-[#065f46] shrink-0 whitespace-nowrap">
                  [중요]
                </span>
              )}
              <span className="text-[13px] sm:text-sm md:text-[15px] font-semibold text-gray-800 truncate">
                {currentNotice.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeNotices.length > 1 && (
              <span className="text-xs font-semibold text-gray-500 tabular-nums hidden xs:inline">
                {safeIndex + 1}/{activeNotices.length}
              </span>
            )}
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
        </button>
      </div>

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedNotice(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="notice-modal-title"
        >
          <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[82vh] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-extrabold text-[#065f46] whitespace-nowrap">
                  공지사항
                </span>
                {activeNotices.length > 1 && (
                  <span className="text-xs font-medium text-gray-500 tabular-nums">
                    ({selectedIdx + 1} / {activeNotices.length})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                aria-label="공지사항 닫기"
                className="w-8 h-8 rounded-full bg-gray-200/80 hover:bg-gray-300 text-gray-700 flex items-center justify-center text-sm font-bold transition cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Multiple notices selector */}
            {activeNotices.length > 1 && (
              <div className="px-5 py-2.5 bg-white border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
                {activeNotices.map((item, idx) => {
                  const isCurrent = item.id === selectedNotice.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedNotice(item)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                        isCurrent
                          ? 'bg-[#065f46] text-white border-[#065f46]'
                          : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {item.isImportant ? `[중요] ` : ''}공지 {idx + 1}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Content Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {selectedNotice.isImportant && (
                    <>
                      <span className="font-extrabold text-[#065f46]">중요 안내</span>
                      <span aria-hidden="true">·</span>
                    </>
                  )}
                  <span className="tabular-nums">{selectedNotice.createdAt}</span>
                </div>
                <h3
                  id="notice-modal-title"
                  className="text-base sm:text-lg font-extrabold text-gray-900 leading-snug break-keep"
                >
                  {selectedNotice.title}
                </h3>
              </div>

              <div className="pt-3 border-t border-gray-100 text-sm text-gray-700 leading-relaxed whitespace-pre-line break-keep">
                {selectedNotice.content}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2 shrink-0">
              {activeNotices.length > 1 ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const prevIdx = (selectedIdx - 1 + activeNotices.length) % activeNotices.length;
                      setSelectedNotice(activeNotices[prevIdx]);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer whitespace-nowrap"
                  >
                    ← 이전
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = (selectedIdx + 1) % activeNotices.length;
                      setSelectedNotice(activeNotices[nextIdx]);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer whitespace-nowrap"
                  >
                    다음 →
                  </button>
                </div>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                className="px-5 py-2 rounded-xl bg-[#065f46] hover:bg-[#054e3a] text-white text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NoticeBar;
