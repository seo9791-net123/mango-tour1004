import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PageSection } from '../types';
import AdaptiveImageViewer from './AdaptiveImageViewer';
import { useBodyScrollLock } from '../utils/useBodyScrollLock';
import InterpreterPortfolioModal from './InterpreterPortfolioModal';
import {
  loadInterpreterPortfolioLocal,
  syncInterpreterPortfolioFromCloud,
  sanitizeSafeUrl,
  INTERPRETER_PORTFOLIO_UPDATED_EVENT,
  KAKAO_OPEN_CHAT_URL,
  InterpreterPortfolioStore,
} from '../services/interpreterPortfolioService';

interface Props {
  section: PageSection;
  onClose: () => void;
}

const BUSINESS_PROTOCOL_ITEMS = [
  {
    title: '공항 패스트트랙 & 의전',
    description:
      '입국 시 VIP 패스트트랙 라인을 통한 신속한 수속 지원과 전용 차량 픽업·의전 케어를 제공합니다.',
  },
  {
    title: '프라이빗 비즈니스 룸',
    description:
      '현지 기업 미팅·투자 협약에 최적화된 프라이빗 비즈니스 룸 섭외 및 한·영·베 3개국어 전문 통역을 지원합니다.',
  },
  {
    title: '비즈니스 저녁 식사',
    description:
      '파트너십 만찬 및 VIP 접대 자리에 품격 있는 다이닝 예약과 자연스러운 비즈니스 만찬 통역을 함께합니다.',
  },
];

const SectionDetailModal: React.FC<Props> = ({ section, onClose }) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [portraitError, setPortraitError] = useState(false);
  const [portfolioStore, setPortfolioStore] = useState<InterpreterPortfolioStore>(() =>
    loadInterpreterPortfolioLocal()
  );

  const isBusinessInterpreter =
    section.title.includes('기업 미팅') && section.title.includes('통역');

  useBodyScrollLock(Boolean(section));

  useEffect(() => {
    if (!isBusinessInterpreter) return;

    let mounted = true;
    void syncInterpreterPortfolioFromCloud().then((cloudStore) => {
      if (mounted && cloudStore) {
        setPortfolioStore(cloudStore);
        setPortraitError(false);
      }
    });

    const handlePortfolioUpdated = (e: Event) => {
      const detail = (e as CustomEvent<InterpreterPortfolioStore>)?.detail;
      if (detail) {
        setPortfolioStore(detail);
        setPortraitError(false);
      } else {
        setPortfolioStore(loadInterpreterPortfolioLocal());
      }
    };

    window.addEventListener(INTERPRETER_PORTFOLIO_UPDATED_EVENT, handlePortfolioUpdated);
    return () => {
      mounted = false;
      window.removeEventListener(INTERPRETER_PORTFOLIO_UPDATED_EVENT, handlePortfolioUpdated);
    };
  }, [isBusinessInterpreter]);

  useEffect(() => {
    const handleSubViewBack = (e: Event) => {
      if (showPortfolio) {
        e.stopImmediatePropagation();
        setShowPortfolio(false);
        (e as CustomEvent)?.detail?.handled?.();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showPortfolio) {
        onClose();
      }
    };
    window.addEventListener('mango_subview_back', handleSubViewBack, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mango_subview_back', handleSubViewBack, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPortfolio, onClose]);

  const images =
    section.detailImages && section.detailImages.length > 0
      ? section.detailImages
      : [];

  const customDetailText = (section.detailContent || section.content || '').trim();
  const hasExtraAdminNotes =
    Boolean(customDetailText) &&
    !customDetailText.includes('공항 패스트트랙 & 의전') &&
    !customDetailText.includes('프라이빗 비즈니스 룸') &&
    !customDetailText.includes('비즈니스 저녁 식사');

  const profile = portfolioStore.profile;
  const kakaoUrl = sanitizeSafeUrl(profile.kakaoUrl) || KAKAO_OPEN_CHAT_URL;

  const modalContent = (
    <>
      <div
        className="fixed inset-0 z-[10000] w-full max-w-full flex items-end md:items-center justify-center p-0 md:p-4 bg-black/45 backdrop-blur-xs animate-fade-in overscroll-contain"
        onClick={onClose}
      >
        <div
          className="bg-white overflow-hidden shadow-2xl w-full max-w-full md:max-w-3xl max-h-[92dvh] md:h-[85vh] rounded-t-3xl md:rounded-[20px] flex flex-col animate-ios-sheet-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 md:hidden shrink-0" />
          {/* Header */}
          <div className="px-4 sm:px-5 md:px-6 py-3 md:py-4 border-b border-black/[0.06] flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
            <h2 className="text-base sm:text-xl font-bold tracking-tight text-gray-900 line-clamp-1">
              {section.title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#8E8E93] hover:text-gray-900 active:scale-90 transition font-bold text-sm shrink-0 ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          {isBusinessInterpreter ? (
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 pb-24 md:p-6 md:pb-6 space-y-5">
              {/* Top Interpreter Profile Card */}
              <div className="rounded-2xl border border-[#1E6B4B]/15 bg-[#F8FBF9] p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[#ECFDF5] border border-[#1E6B4B]/20 shrink-0">
                    {!portraitError && profile.portraitUrl ? (
                      <img
                        key={profile.portraitUrl}
                        src={profile.portraitUrl}
                        alt={`${profile.name} (${profile.nickname}) 전담 통역사 겸 MC`}
                        referrerPolicy="no-referrer"
                        onError={() => setPortraitError(true)}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#1E6B4B] text-white font-bold text-lg">
                        MT
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <p className="text-[11px] sm:text-xs font-bold text-[#1E6B4B] tracking-wide">
                      MANGO TOUR 전담 통역사 겸 MC
                    </p>
                    <h3 className="text-base sm:text-xl font-extrabold tracking-tight text-gray-900 leading-snug">
                      {profile.name}
                      {profile.nickname && (
                        <span className="text-[#1E6B4B] font-bold ml-1.5 whitespace-nowrap">
                          / {profile.nickname}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-[#3A3A3C] leading-snug">
                      {profile.title}
                    </p>
                  </div>
                </div>

                {/* 3 Horizontal Credential Badges */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 pt-3 border-t border-[#1E6B4B]/10">
                  {profile.badges.map((badge, idx) => (
                    <div
                      key={`${badge}-${idx}`}
                      className="rounded-xl bg-white border border-[#1E6B4B]/20 px-2 sm:px-3 py-2 text-center flex items-center justify-center"
                    >
                      <span className="text-[11px] sm:text-xs font-bold text-[#1E6B4B] leading-tight">
                        {badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clean Service Description List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-[#1E6B4B] tracking-wide px-0.5">
                  비즈니스 의전 &amp; 통역 지원 서비스
                </h4>
                <ul className="rounded-2xl border border-black/[0.07] bg-white divide-y divide-black/[0.06]">
                  {BUSINESS_PROTOCOL_ITEMS.map((item, idx) => (
                    <li
                      key={item.title}
                      className="p-4 flex items-start gap-3.5"
                    >
                      <span className="w-6 h-6 rounded-lg bg-[#ECFDF5] text-[#1E6B4B] text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm sm:text-[15px] font-bold text-gray-900">
                          {item.title}
                        </p>
                        <p className="text-xs sm:text-sm text-[#4A4A4F] leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Preserve admin-configured section content if customized */}
              {hasExtraAdminNotes && (
                <div className="bg-[#F2F2F7] p-4 rounded-2xl">
                  <p className="text-xs sm:text-sm text-[#3A3A3C] leading-relaxed whitespace-pre-line font-medium">
                    {customDetailText}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 pb-24 md:p-6 md:pb-6 space-y-4 md:space-y-6">
              {images.length > 0 && (
                <AdaptiveImageViewer
                  images={images}
                  activeIdx={activeImageIdx}
                  onIdxChange={setActiveImageIdx}
                  altPrefix={section.title}
                />
              )}

              {/* Text Content */}
              <div className="space-y-3">
                <div className="bg-[#ECFDF5] p-4 md:p-5 rounded-[20px]">
                  <p className="text-[#3A3A3C] text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium">
                    {section.detailContent || section.content}
                  </p>
                </div>

                <div className="bg-[#F2F2F7] p-4 rounded-[20px]">
                  <h4 className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">
                    안내 사항
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[#8E8E93] leading-relaxed">
                    * 현지 사정 및 기상 상황에 따라 일정이 변동될 수 있습니다.
                    <br />* 1:1 맞춤 일정 및 추가 예약 상담은 카카오톡 채널을 통해 언제든 문의 가능합니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          {isBusinessInterpreter ? (
            <div
              className="px-4 py-3 md:p-4 border-t border-black/[0.06] bg-white grid grid-cols-2 gap-2.5 shrink-0"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.875rem)' }}
            >
              <button
                type="button"
                onClick={() => setShowPortfolio(true)}
                className="py-3 px-2 sm:px-4 rounded-2xl border border-[#1E6B4B] bg-[#ECFDF5]/60 text-[#1E6B4B] hover:bg-[#ECFDF5] active:scale-[0.98] transition-all duration-200 font-bold text-[11px] min-[390px]:text-xs sm:text-sm tracking-tight flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <span className="truncate">통역 경력 &amp; 영상 자세히 보기</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  window.open(kakaoUrl, '_blank', 'noopener,noreferrer')
                }
                className="py-3 px-2 sm:px-4 bg-[#1E6B4B] text-white rounded-2xl font-bold shadow-sm hover:bg-[#16533A] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-1.5 text-[11.5px] min-[390px]:text-xs sm:text-sm whitespace-nowrap cursor-pointer"
              >
                <span>💬</span>
                <span>카톡으로 문의하기</span>
              </button>
            </div>
          ) : (
            <div
              className="px-4 py-3 md:p-4 border-t border-black/[0.06] bg-white flex gap-2.5 shrink-0"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.875rem)' }}
            >
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 bg-[#F2F2F7] text-[#3A3A3C] rounded-2xl font-semibold hover:bg-gray-200 active:scale-95 transition-all duration-200 text-xs sm:text-sm cursor-pointer"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() =>
                  window.open(kakaoUrl, '_blank', 'noopener,noreferrer')
                }
                className="flex-1 py-3 bg-[#0A7E54] text-white rounded-2xl font-bold shadow-sm hover:bg-[#086945] active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer"
              >
                <span>💬</span> 카톡으로 문의하기
              </button>
            </div>
          )}
        </div>
      </div>

      <InterpreterPortfolioModal
        isOpen={showPortfolio}
        onClose={() => setShowPortfolio(false)}
      />
    </>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};

export default SectionDetailModal;
