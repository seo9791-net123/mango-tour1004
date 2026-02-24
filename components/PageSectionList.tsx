
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sections.map((section, idx) => (
        <div 
          key={idx} 
          className="bg-[#fcfcfc] rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow duration-300 group cursor-pointer relative"
          onClick={() => setSelectedSection(section)}
        >
          <h3 className="text-[22px] font-bold text-[#004d40] mb-4 leading-tight">
            {section.title}
          </h3>
          <p className="text-[#4a4a4a] text-[17px] font-medium leading-relaxed mb-12 flex-grow">
            {section.content}
          </p>
          <div className="flex justify-end mt-auto">
            <button 
              className="text-[#c5a028] font-bold text-[13px] flex items-center gap-1 hover:gap-2 transition-all"
            >
              상세보기 <span className="text-sm">→</span>
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
