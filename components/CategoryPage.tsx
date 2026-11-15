
import React, { useState, useEffect, useMemo } from 'react';
import { Product, PageSection, RecommendedDiscountPopup } from '../types';
import SectionDetailModal from './SectionDetailModal';
import BackButton from './BackButton';
import { getFreshImageUrl } from '../utils/imageUtils';
import RecommendedDiscountModal, {
  isDiscountPopupHiddenToday,
  hideDiscountPopupToday
} from './RecommendedDiscountModal';

interface Props {
  category: string;
  products: Product[];
  onProductClick: (id: string) => void;
  onBack: () => void;
  isLoggedIn?: boolean;
  onReqLogin?: () => void;
  recommendedDiscountPopup?: RecommendedDiscountPopup;
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

const CategoryPage: React.FC<Props> = ({
  category,
  products,
  onProductClick,
  onBack,
  isLoggedIn,
  onReqLogin,
  recommendedDiscountPopup
}) => {
  const [selectedDetail, setSelectedDetail] = useState<PageSection | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<DurationFilterKey>('3박5일');
  const [showDiscountPopup, setShowDiscountPopup] = useState(false);

  const isRecommendedCategory = category === '추천 상품';

  // Reset duration filter when entering or changing category & check discount popup
  useEffect(() => {
    setSelectedDuration('3박5일');
    if (
      category === '추천 상품' &&
      recommendedDiscountPopup?.isActive &&
      !isDiscountPopupHiddenToday()
    ) {
      setShowDiscountPopup(true);
    } else {
      setShowDiscountPopup(false);
    }
  }, [category, recommendedDiscountPopup?.isActive]);

  // Listen for mobile bottom nav "뒤로가기" event
  useEffect(() => {
    const handleSubViewBack = (e: any) => {
      if (showDiscountPopup) {
        setShowDiscountPopup(false);
        e?.detail?.handled?.();
        return;
      }
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
  }, [selectedDetail, showDiscountPopup]);

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
    <div className="py-4 sm:py-6 bg-[#F2F2F7] min-h-[600px] animate-fade-in pb-safe md:pb-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        {/* Header: BackButton + Duration Segmented Tabs + Title */}
        <div className="flex flex-col gap-3 mb-4 sm:mb-5">
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
                      className={`group relative flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl transition-all duration-200 whitespace-nowrap shrink-0 active:scale-95 cursor-pointer shadow-sm ${
                        isActive
                          ? 'bg-[#0A7E54] text-white'
                          : 'bg-white text-[#3A3A3C] hover:bg-[#ECFDF5]'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-white/15 text-white'
                            : 'bg-[#ECFDF5] text-[#0A7E54]'
                        }`}
                      >
                        <DurationIcon optionKey={opt.key} active={isActive} />
                      </span>
                      <span className={`text-xs sm:text-sm font-bold tracking-tight leading-none ${isActive ? 'text-white' : 'text-gray-900'}`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <h2 className="text-lg xs:text-xl font-extrabold tracking-tight text-gray-900">
                {category}
                <span className="text-xs font-medium text-[#8E8E93] ml-1.5 xs:ml-2 tabular-nums">
                  ({filteredProducts.length}개)
                </span>
              </h2>
            )}
          </div>

          {isRecommendedCategory && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <h2 className="text-base xs:text-lg sm:text-xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
                <span>{category}</span>
                <span className="text-xs sm:text-sm font-semibold text-[#0A7E54] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full">
                  {selectedDuration} 일정
                </span>
              </h2>
            </div>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 xs:py-16 text-[#8E8E93] bg-white rounded-[20px] shadow-sm px-5 text-center">
            <span className="text-3xl mb-3">⛳️</span>
            <p className="text-sm font-bold text-gray-900">해당 조건에 등록된 상품이 없습니다.</p>
            <p className="text-xs text-[#8E8E93] mt-1">다른 일정을 선택하시거나 카카오톡 채널로 맞춤 견적을 문의해 주세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-[20px] shadow-sm overflow-hidden group hover:shadow-md transition-all duration-200 flex flex-col">
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
                  <div className="absolute top-3 right-3 bg-black/55 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                    {product.duration}
                  </div>
                </div>
                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs text-[#0A7E54] font-bold tracking-tight whitespace-nowrap">{product.location}</span>
                    <span className="text-[11px] font-semibold text-[#8E8E93] whitespace-nowrap">
                      {product.type === 'golf' ? '골프' : product.type === 'tour' ? '관광' : '호텔&빌라'}
                    </span>
                  </div>
                  <h3 className="font-bold tracking-tight text-base xs:text-lg mb-1.5 text-gray-900 line-clamp-2 leading-snug">{product.title}</h3>
                  <p className="text-[#3A3A3C] text-xs xs:text-sm font-normal mb-3.5 line-clamp-2 leading-relaxed flex-1">{product.description}</p>
                  
                  <div className="flex flex-col gap-2.5 mt-auto border-t border-black/[0.06] pt-3.5">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-extrabold text-base xs:text-lg text-[#0A7E54] tabular-nums whitespace-nowrap">
                        ${product.price.toLocaleString()} <span className="text-xs font-semibold text-[#8E8E93]">USD~</span>
                      </span>
                      <button 
                        type="button"
                        onClick={() => handlePreviewClick(product)}
                        className="text-[#3A3A3C] hover:text-[#0A7E54] font-semibold text-xs xs:text-sm hover:underline py-1 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        상세보기
                      </button>
                    </div>
                    <button 
                      type="button"
                      onClick={() => onProductClick(product.id)}
                      className="w-full bg-[#0A7E54] text-white py-3 rounded-2xl text-xs xs:text-sm font-bold hover:bg-[#086945] active:scale-95 transition-all duration-200 flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer"
                    >
                      견적보기 <span>→</span>
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

      {recommendedDiscountPopup && (
        <RecommendedDiscountModal
          isOpen={showDiscountPopup && recommendedDiscountPopup.isActive}
          data={recommendedDiscountPopup}
          onClose={() => setShowDiscountPopup(false)}
          onHideToday={() => {
            hideDiscountPopupToday();
            setShowDiscountPopup(false);
          }}
          onSelectProduct={(productId) => onProductClick(productId)}
        />
      )}
    </div>
  );
};

export default CategoryPage;

