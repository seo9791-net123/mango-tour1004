
import React, { useState } from 'react';
import { PageSection } from '../types';
import SectionDetailModal from './SectionDetailModal';

interface Props {
  sections: PageSection[];
}

const PageSectionList: React.FC<Props> = ({ sections }) => {
  const [selectedSection, setSelectedSection] = useState<PageSection | null>(null);

  if (!sections || sections.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 xs:gap-4 md:gap-6">
      {sections.map((section, idx) => (
        <div 
          key={idx} 
          className="bg-white rounded-2xl p-4 xs:p-5 sm:p-6 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow duration-300 group cursor-pointer relative active:scale-[0.99]"
          onClick={() => setSelectedSection(section)}
        >
          <h3 className="text-base xs:text-lg sm:text-xl font-bold text-deepgreen mb-2 leading-snug">
            {section.title}
          </h3>
          <p className="text-gray-600 text-xs xs:text-sm sm:text-[15px] font-normal leading-relaxed mb-4 flex-grow line-clamp-3">
            {section.content}
          </p>
          <div className="flex justify-end mt-auto pt-2 border-t border-gray-50">
            <button 
              className="text-gold-600 font-bold text-xs xs:text-sm flex items-center gap-1 group-hover:gap-1.5 transition-all"
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

