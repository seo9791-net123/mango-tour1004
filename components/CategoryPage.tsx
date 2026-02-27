
import React, { useState } from 'react';
import { Product, PageSection } from '../types';
import SectionDetailModal from './SectionDetailModal';

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
    <div className="py-6 bg-gray-50 min-h-[600px] animate-fade-in pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition shadow-sm text-gray-600"
          >
            ←
          </button>
          <h2 className="text-xl font-bold text-deepgreen">
            {category}
            <span className="text-xs font-normal text-gray-500 ml-2">
               ({products.length}개의 상품)
            </span>
          </h2>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">
            <span className="text-2xl mb-3">⛳️</span>
            <p className="text-sm">해당 카테고리에 등록된 상품이 없습니다.</p>
            <p className="text-xs">관리자에게 문의해주세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden group hover:-translate-y-1 transition duration-300 border border-gray-100">
                <div className="relative h-40 overflow-hidden">
                  <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                  <div className="absolute top-2 right-2 bg-gold-500 text-white text-[10px] px-2 py-0.5 rounded">
                    {product.duration}
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[12px] text-gold-600 font-bold mb-1">{product.location}</div>
                  <h3 className="font-black text-xl mb-2 text-gray-800 line-clamp-2 leading-tight">{product.title}</h3>
                  <p className="text-gray-600 text-base font-bold mb-4 line-clamp-3 h-auto leading-relaxed">{product.description}</p>
                  <div className="flex flex-col gap-2 mt-auto border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-lg text-red-600">${product.price.toLocaleString()} USD~</span>
                      <button 
                        onClick={() => handlePreviewClick(product)}
                        className="text-gold-600 font-bold text-lg hover:underline"
                      >
                        미리보기 +
                      </button>
                    </div>
                    <button 
                      onClick={() => onProductClick(product.id)}
                      className="w-full bg-deepgreen text-white py-3 rounded-lg text-lg font-bold hover:bg-opacity-90 transition flex items-center justify-center gap-1 shadow-md"
                    >
                      견적보기 <span className="text-lg">↗</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Planner CTA */}
        <div className="mt-12 bg-white rounded-2xl p-8 border border-gray-100 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gold-100 flex items-center justify-center text-3xl shadow-inner">✨</div>
              <div>
                 <h3 className="text-xl font-black text-deepgreen">원하는 상품이 없으신가요?</h3>
                 <p className="text-gray-500 text-sm">AI가 고객님의 취향에 딱 맞는 여행을 즉시 설계해 드립니다.</p>
              </div>
           </div>
           <button 
             onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-planner'))}
             className="px-8 py-4 bg-gold-500 text-white font-bold rounded-2xl hover:bg-gold-600 transition shadow-lg transform hover:-translate-y-1 active:scale-95 flex items-center gap-2"
           >
              나만의 여행 만들기 (AI) ✈️
           </button>
        </div>
      </div>

      {selectedDetail && (
        <SectionDetailModal section={selectedDetail} onClose={() => setSelectedDetail(null)} />
      )}
    </div>
  );
};

export default CategoryPage;
