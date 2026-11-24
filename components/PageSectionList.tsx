import React, { useState, useEffect } from 'react';
import { PageSection } from '../types';
import SectionDetailModal from './SectionDetailModal';

interface Props {
  sections: PageSection[];
}

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
      {sections.map((section, idx) => (
        <div 
          key={idx} 
          className="bg-white rounded-none md:rounded-[20px] p-5 sm:p-6 shadow-none md:shadow-sm border-0 flex flex-col h-full hover:shadow-md transition-all duration-200 group cursor-pointer relative active:scale-[0.98]"
          onClick={() => setSelectedSection(section)}
        >
          <h3 className="text-base xs:text-lg sm:text-xl font-bold tracking-tight text-gray-900 mb-2 leading-snug">
            {section.title}
          </h3>
          <p className="text-[#3A3A3C] text-xs xs:text-sm sm:text-[15px] font-normal leading-relaxed mb-4 flex-grow line-clamp-3">
            {section.content}
          </p>
          <div className="flex justify-end mt-auto pt-2.5 border-t border-black/[0.05]">
            <button 
              type="button"
              className="text-[#0A7E54] font-semibold text-xs xs:text-sm flex items-center gap-1 group-hover:gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              상세보기 <span className="text-xs">→</span>
            </button>
          </div>
        </div>
      ))}

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
