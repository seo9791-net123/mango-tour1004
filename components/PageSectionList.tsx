import React, { useState, useEffect } from 'react';
import { PageSection } from '../types';
import SectionDetailModal from './SectionDetailModal';

interface Props {
  sections: PageSection[];
}

const getBusinessCardBadge = (title: string): string | null => {
  if (title.includes('카지노') && title.includes('의전')) return 'VIP 의전';
  if (title.includes('기업 미팅') && title.includes('통역')) return '전담 통역사';
  if (title.includes('리무진')) return '전담 리무진';
  return null;
};

const PageSectionList: React.FC<Props> = ({ sections }) => {
  const [selectedSection, setSelectedSection] = useState<PageSection | null>(null);

  // Listen for mobile bottom nav "뒤로가기" event
  useEffect(() => {
    const handleSubViewBack = (e: any) => {
      if (selectedSection) {
        setSelectedSection(null);
        e?.detail?.handled?.();
        return;
      }
    };

    window.addEventListener('mango_subview_back', handleSubViewBack as EventListener);
    return () => {
      window.removeEventListener('mango_subview_back', handleSubViewBack as EventListener);
    };
  }, [selectedSection]);

  if (!sections || sections.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-5">
      {sections.map((section, idx) => {
        const badgeLabel = getBusinessCardBadge(section.title);
        const isHighlightedBusinessCard = Boolean(badgeLabel);

        return (
          <div
            key={idx}
            className={`rounded-none md:rounded-[20px] p-5 sm:p-6 flex flex-col h-full transition-all duration-200 group cursor-pointer relative active:scale-[0.98] ${
              isHighlightedBusinessCard
                ? 'bg-gradient-to-b from-[#1E6B4B]/[0.03] to-white border border-[#1E6B4B]/40 shadow-[0_6px_22px_-10px_rgba(30,107,75,0.18)] hover:shadow-[0_10px_28px_-10px_rgba(30,107,75,0.24)]'
                : 'bg-white shadow-none md:shadow-sm border border-transparent hover:shadow-md'
            }`}
            onClick={() => setSelectedSection(section)}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-base xs:text-lg sm:text-xl font-bold tracking-tight text-gray-900 leading-snug">
                {section.title}
              </h3>
              {badgeLabel && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#1E6B4B]/10 text-[#1E6B4B] text-[11px] font-bold whitespace-nowrap shrink-0 mt-0.5">
                  {badgeLabel}
                </span>
              )}
            </div>
            <p className="text-[#3A3A3C] text-xs xs:text-sm sm:text-[15px] font-normal leading-relaxed mb-4 flex-grow line-clamp-3">
              {section.content}
            </p>
            <div className="flex justify-end mt-auto pt-2.5 border-t border-black/[0.05]">
              <button
                type="button"
                className={`font-semibold text-xs xs:text-sm flex items-center gap-1 group-hover:gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isHighlightedBusinessCard ? 'text-[#1E6B4B]' : 'text-[#0A7E54]'
                }`}
              >
                상세보기 <span className="text-xs">→</span>
              </button>
            </div>
          </div>
        );
      })}

      {selectedSection && (
        <SectionDetailModal 
          section={selectedSection} 
          onClose={() => setSelectedSection(null)} 
        />
      )}
    </div>
  );
};

export default PageSectionList;
