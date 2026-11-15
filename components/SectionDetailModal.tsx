import React, { useState } from 'react';
import { PageSection } from '../types';
import AdaptiveImageViewer from './AdaptiveImageViewer';

interface Props {
  section: PageSection;
  onClose: () => void;
}

const SectionDetailModal: React.FC<Props> = ({ section, onClose }) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const images = section.detailImages && section.detailImages.length > 0 
    ? section.detailImages 
    : [];

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white overflow-hidden shadow-2xl max-w-none md:max-w-3xl w-full max-h-[90vh] md:h-[85vh] rounded-t-3xl md:rounded-[20px] flex flex-col animate-ios-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 md:hidden shrink-0" />
        {/* Header */}
        <div className="px-5 md:px-6 py-3 md:py-4 border-b border-black/[0.06] flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
          <h2 className="text-base sm:text-xl font-bold tracking-tight text-gray-900 line-clamp-1">{section.title}</h2>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#8E8E93] hover:text-gray-900 active:scale-90 transition font-bold text-sm shrink-0 ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 md:p-6 space-y-4 md:space-y-6">
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
              <h4 className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">안내 사항</h4>
              <p className="text-[11px] sm:text-xs text-[#8E8E93] leading-relaxed">
                * 현지 사정 및 기상 상황에 따라 일정이 변동될 수 있습니다.<br/>
                * 1:1 맞춤 일정 및 추가 예약 상담은 카카오톡 채널을 통해 언제든 문의 가능합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="px-5 py-3 md:p-4 border-t border-black/[0.06] bg-white flex gap-2.5 shrink-0"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}
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
            onClick={() => window.open('https://open.kakao.com/o/gprQnKSi', '_blank')}
            className="flex-1 py-3 bg-[#0A7E54] text-white rounded-2xl font-bold shadow-sm hover:bg-[#086945] active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer"
          >
            <span>💬</span> 카톡으로 문의하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionDetailModal;
