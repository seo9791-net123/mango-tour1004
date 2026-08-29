
import React, { useState } from 'react';
import { Product, PageSection } from '../types';
import SectionDetailModal from './SectionDetailModal';
import BackButton from './BackButton';

interface Props {
  category: string;
  products: Product[];
  onProductClick: (id: string) => void;
  onBack: () => void;
  isLoggedIn?: boolean;
  onReqLogin?: () => void;
}

const CategoryPage: React.FC<Props> = ({ category, products, onProductClick, onBack, isLoggedIn, onReqLogin }) => {
  const [selectedDetail, setSelectedDetail] = useState<PageSection | null>(null);

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
    <div className="py-4 xs:py-6 bg-gray-50 min-h-[600px] animate-fade-in pb-safe md:pb-0">
      <div className="max-w-7xl mx-auto px-3 xs:px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <BackButton onClick={onBack} variant="light" label="메인으로" />
          <h2 className="text-lg xs:text-xl font-bold text-deepgreen">
            {category}
            <span className="text-xs font-normal text-gray-500 ml-1.5 xs:ml-2">
               ({products.length}개의 상품)
            </span>
          </h2>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 xs:py-16 text-gray-400 bg-white rounded-2xl border border-gray-200 shadow-sm px-4 text-center">
            <span className="text-3xl mb-3">⛳️</span>
            <p className="text-sm font-bold text-gray-600">해당 카테고리에 등록된 상품이 없습니다.</p>
            <p className="text-xs text-gray-400 mt-1">카카오톡 채널을 통해 맞춤 일정을 문의하실 수 있습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 xs:gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition duration-300 border border-gray-100 flex flex-col">
                <div className="relative h-44 xs:h-48 overflow-hidden bg-gray-100">
                  <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    {product.duration}
                  </div>
                </div>
                <div className="p-3.5 xs:p-4 flex flex-col flex-1">
                  <div className="text-[11px] xs:text-[12px] text-gold-600 font-extrabold uppercase tracking-wide mb-1">{product.location}</div>
                  <h3 className="font-bold text-base xs:text-lg mb-1.5 text-gray-900 line-clamp-2 leading-snug">{product.title}</h3>
                  <p className="text-gray-600 text-xs xs:text-sm font-medium mb-3 line-clamp-2 leading-relaxed flex-1">{product.description}</p>
                  
                  <div className="flex flex-col gap-2 mt-auto border-t border-gray-100 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-base xs:text-lg text-red-600">${product.price.toLocaleString()} <span className="text-xs font-bold text-gray-500">USD~</span></span>
                      <button 
                        onClick={() => handlePreviewClick(product)}
                        className="text-gold-600 font-bold text-xs xs:text-sm hover:underline py-1"
                      >
                        상세보기 +
                      </button>
                    </div>
                    <button 
                      onClick={() => onProductClick(product.id)}
                      className="w-full bg-deepgreen text-white py-2.5 xs:py-3 rounded-xl text-xs xs:text-sm font-bold hover:bg-opacity-90 active:scale-95 transition flex items-center justify-center gap-1 shadow-sm"
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
