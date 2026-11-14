
import React, { useState, useEffect, useMemo } from 'react';
import { Product, PageSection } from '../types';
import SectionDetailModal from './SectionDetailModal';
import BackButton from './BackButton';
import { getFreshImageUrl } from '../utils/imageUtils';

interface Props {
  category: string;
  products: Product[];
  onProductClick: (id: string) => void;
  onBack: () => void;
  isLoggedIn?: boolean;
  onReqLogin?: () => void;
}

type DurationFilterKey = '3박5일' | '4박6일' | '5박7일';

const normalizeDuration = (duration?: string): string =>
  (duration || '').replace(/\s+/g, '');

const DURATION_OPTIONS: Array<{
  key: DurationFilterKey;
  label: string;
}> = [
  { key: '3박5일', label: '3박5일' },
  { key: '4박6일', label: '4박6일' },
  { key: '5박7일', label: '5박7일' },
];

const DurationIcon: React.FC<{ optionKey: DurationFilterKey; active: boolean }> = ({ optionKey, active }) => {
  const accent = active ? 'text-gold-300' : 'text-gold-600';
  if (optionKey === '3박5일') {
    return (
      <svg className={`w-4 h-4 shrink-0 ${accent}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="17" rx="2.5" />
        <path d="M16 2v4M8 2v4M3 9.5h18" />
        <path d="M13.5 13a3 3 0 1 0 3 3 2.3 2.3 0 0 1-3-3z" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (optionKey === '4박6일') {
    return (
      <svg className={`w-4 h-4 shrink-0 ${accent}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="17" rx="2.5" />
        <path d="M16 2v4M8 2v4M3 9.5h18" />
        <circle cx="12" cy="15" r="2.2" />
        <path d="M12 11.6v.8M12 17.6v.8M8.6 15h.8M14.6 15h.8" />
      </svg>
    );
  }
  return (
    <svg className={`w-4 h-4 shrink-0 ${accent}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 17.5h17l-1.5-8.5-4.2 3.5L12 7l-2.8 5.5L5 9l-1.5 8.5z" />
      <path d="M4.5 20.5h15" />
    </svg>
  );
};

const CategoryPage: React.FC<Props> = ({ category, products, onProductClick, onBack, isLoggedIn, onReqLogin }) => {
  const [selectedDetail, setSelectedDetail] = useState<PageSection | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<DurationFilterKey>('3박5일');

  const isRecommendedCategory = category === '추천 상품';

  // Reset duration filter when entering or changing category
  useEffect(() => {
    setSelectedDuration('3박5일');
  }, [category]);

  // Listen for mobile bottom nav "뒤로가기" event
  useEffect(() => {
    const handleSubViewBack = (e: any) => {
      if (selectedDetail) {
        setSelectedDetail(null);
        e?.detail?.handled?.();
        return;
      }
    };

    window.addEventListener('mango_subview_back', handleSubViewBack as EventListener);
    return () => {
      window.removeEventListener('mango_subview_back', handleSubViewBack as EventListener);
    };
  }, [selectedDetail]);

  const filteredProducts = useMemo(() => {
    if (!isRecommendedCategory) {
      return products;
    }
    return products.filter((p) => normalizeDuration(p.duration) === selectedDuration);
  }, [products, isRecommendedCategory, selectedDuration]);

  const handlePreviewClick = (product: Product) => {
    if (!isLoggedIn) {
      if (confirm('상세 정보 보기 및 상담 문의는 로그인 후 이용 가능합니다. 로그인하시겠습니까?')) {
        onReqLogin?.();
      }
      return;
    }
    // Convert Product to PageSection for SectionDetailModal
    const section: PageSection = {
      title: product.title,
      content: product.description,
      detailContent: product.detailContent || product.description,
      detailImages: product.detailImages || [product.image]
    };
    setSelectedDetail(section);
  };

  return (
    <div className="py-3 sm:py-6 bg-gray-50 min-h-[600px] animate-fade-in pb-safe md:pb-0">
      <div className="max-w-7xl mx-auto px-0 sm:px-4">
        {/* Header: BackButton + Duration Icon Boxes (3박5일, 4박6일, 5박7일) + Title */}
        <div className="flex flex-col gap-3 mb-4 sm:mb-5 px-2.5 sm:px-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <BackButton
              onClick={selectedDetail ? () => setSelectedDetail(null) : onBack}
              variant="light"
              label={selectedDetail ? '목록으로' : '뒤로가기'}
              className="shrink-0"
            />

            {isRecommendedCategory ? (
              <div
                role="tablist"
                aria-label="여행 일정별 상품 필터"
                className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial min-w-0"
              >
                {DURATION_OPTIONS.map((opt) => {
                  const isActive = selectedDuration === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setSelectedDuration(opt.key)}
                      className={`group relative flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 xs:px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border transition-all duration-200 whitespace-nowrap shrink-0 active:scale-95 ${
                        isActive
                          ? 'bg-gradient-to-br from-deepgreen via-emerald-900 to-deepgreen text-white border-gold-400 shadow-md ring-2 ring-gold-400/35'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gold-400 hover:bg-amber-50/40 shadow-xs'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-white/15 border border-gold-400/40'
                            : 'bg-emerald-50 border border-emerald-100 group-hover:bg-amber-50'
                        }`}
                      >
                        <DurationIcon optionKey={opt.key} active={isActive} />
                      </span>
                      <span className={`text-xs sm:text-sm font-extrabold tracking-tight leading-none ${isActive ? 'text-white' : 'text-gray-900'}`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <h2 className="text-lg xs:text-xl font-bold text-deepgreen">
                {category}
                <span className="text-xs font-normal text-gray-500 ml-1.5 xs:ml-2 tabular-nums">
                  ({filteredProducts.length}개의 상품)
                </span>
              </h2>
            )}
          </div>

          {isRecommendedCategory && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <h2 className="text-base xs:text-lg sm:text-xl font-extrabold text-deepgreen flex items-center gap-2">
                <span>{category}</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-500">
                  ({selectedDuration} 일정)
                </span>
              </h2>
              <span className="text-[11px] xs:text-xs font-medium text-gray-500 tabular-nums">
                골프 {filteredProducts.filter((p) => p.type === 'golf').length} · 관광 {filteredProducts.filter((p) => p.type === 'tour').length}
                {filteredProducts.some((p) => p.type === 'hotel')
                  ? ` · 호텔/빌라 ${filteredProducts.filter((p) => p.type === 'hotel').length}`
                  : ''}
              </span>
            </div>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 xs:py-16 text-gray-400 bg-white rounded-none sm:rounded-2xl border-y sm:border border-gray-200 shadow-sm px-4 text-center">
            <span className="text-3xl mb-3">⛳️</span>
            <p className="text-sm font-bold text-gray-600">해당 조건에 등록된 상품이 없습니다.</p>
            <p className="text-xs text-gray-400 mt-1">다른 일정을 선택하시거나 카카오톡 채널로 맞춤 견적을 문의해 주세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-none sm:rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition duration-300 border-y sm:border border-gray-100 flex flex-col">
                <div className="relative h-44 xs:h-48 overflow-hidden bg-gray-100">
                  <img 
                    src={getFreshImageUrl(product.image)} 
                    alt={product.title} 
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (!img.dataset.fallbackApplied) {
                        img.dataset.fallbackApplied = '1';
                        img.src = getFreshImageUrl('/images/products/hcm-golf-day.jpg');
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                  />
                  <div className="absolute top-2.5 right-2.5 bg-black/65 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    {product.duration}
                  </div>
                </div>
                <div className="p-3.5 sm:p-4 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] xs:text-[12px] text-gold-600 font-extrabold uppercase tracking-wide whitespace-nowrap">{product.location}</span>
                    <span className={`text-[11px] font-bold whitespace-nowrap ${product.type === 'golf' ? 'text-emerald-700' : product.type === 'tour' ? 'text-sky-700' : 'text-amber-700'}`}>
                      {product.type === 'golf' ? '골프' : product.type === 'tour' ? '관광' : '호텔&빌라'}
                    </span>
                  </div>
                  <h3 className="font-bold text-base xs:text-lg mb-1.5 text-gray-900 line-clamp-2 leading-snug">{product.title}</h3>
                  <p className="text-gray-600 text-xs xs:text-sm font-medium mb-3 line-clamp-2 leading-relaxed flex-1">{product.description}</p>
                  
                  <div className="flex flex-col gap-2 mt-auto border-t border-gray-100 pt-3">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-black text-base xs:text-lg text-red-600 tabular-nums whitespace-nowrap">${product.price.toLocaleString()} <span className="text-xs font-bold text-gray-500">USD~</span></span>
                      <button 
                        onClick={() => handlePreviewClick(product)}
                        className="text-gold-600 font-bold text-xs xs:text-sm hover:underline py-1 whitespace-nowrap shrink-0"
                      >
                        상세보기 +
                      </button>
                    </div>
                    <button 
                      onClick={() => onProductClick(product.id)}
                      className="w-full bg-deepgreen text-white py-2.5 xs:py-3 rounded-xl text-xs xs:text-sm font-bold hover:bg-opacity-90 active:scale-95 transition flex items-center justify-center gap-1 shadow-sm whitespace-nowrap"
                    >
                      견적보기 <span>↗</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {selectedDetail && (
        <SectionDetailModal section={selectedDetail} onClose={() => setSelectedDetail(null)} />
      )}
    </div>
  );
};

export default CategoryPage;

