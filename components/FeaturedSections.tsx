
import React, { useState } from 'react';
import { PageContent, PageSection } from '../types';
import SectionDetailModal from './SectionDetailModal';

interface Props {
  pageContents: Record<string, PageContent>;
}

const FeaturedSections: React.FC<Props> = ({ pageContents }) => {
  const [selectedSection, setSelectedSection] = useState<PageSection | null>(null);

  // Collect sections from specific pages to feature on home
  const featuredPages = ['business', 'golf', 'hotel', 'tour', 'culture', 'men', 'food', 'event'];
  const allSections = featuredPages.flatMap(pageId => {
    const page = pageContents[pageId];
    if (!page || !page.sections) return [];
    return page.sections.map(section => ({
      ...section,
      pageId,
      pageTitle: page.heroTitle || page.title
    }));
  });

  if (allSections.length === 0) return null;

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-deepgreen tracking-tight font-serif">추천 정보 & 서비스</h2>
            <p className="text-gray-500 text-sm mt-1">망고투어에서 제공하는 특별한 서비스를 확인해보세요.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allSections.slice(0, 6).map((section, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-[2rem] overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 group cursor-pointer"
              onClick={() => setSelectedSection(section)}
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={section.detailImages && section.detailImages.length > 0 ? section.detailImages[0] : 'https://picsum.photos/seed/' + idx + '/800/600'} 
                  alt={section.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                <div className="absolute top-4 left-4">
                  <span className="bg-gold-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
                    {section.pageTitle}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-lg font-black text-gray-800 mb-2 group-hover:text-deepgreen transition-colors line-clamp-1">
                  {section.title}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed mb-4">
                  {section.content}
                </p>
                <div className="flex items-center text-gold-600 font-bold text-xs group-hover:translate-x-1 transition-transform">
                  자세히 보기 <span className="ml-1">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedSection && (
        <SectionDetailModal 
          section={selectedSection} 
          onClose={() => setSelectedSection(null)} 
        />
      )}
    </div>
  );
};

export default FeaturedSections;
