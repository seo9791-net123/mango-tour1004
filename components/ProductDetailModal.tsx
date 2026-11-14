import React, { useState } from 'react';
import { Product } from '../types';
import AdaptiveImageViewer from './AdaptiveImageViewer';

interface Props {
  product: Product;
  onClose: () => void;
}

const ProductDetailModal: React.FC<Props> = ({ product, onClose }) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const images = product.detailImages && product.detailImages.length > 0 
    ? product.detailImages 
    : [product.image];

  return (
    <div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/70 backdrop-blur-sm animate-fade-in pt-safe">
      <div className="bg-white overflow-hidden shadow-2xl max-w-none md:max-w-3xl w-full h-full md:h-[85vh] rounded-none md:rounded-2xl flex flex-col animate-scale-in">
        {/* Header */}
        <div className="px-3 md:px-6 py-3 md:py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
          <h2 className="text-base sm:text-xl font-bold text-deepgreen line-clamp-1">{product.title}</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 active:scale-95 transition font-bold text-sm shrink-0 ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-3 py-3 md:p-6 space-y-4 md:space-y-6">
          {/* Image Slider / Gallery with Adaptive Sizing */}
          {images.length > 0 && (
            <AdaptiveImageViewer
              images={images}
              activeIdx={activeImageIdx}
              onIdxChange={setActiveImageIdx}
              altPrefix={product.title}
            />
          )}

          {/* Text Content */}
          <div className="space-y-3">
            <div className="bg-gold-50/60 p-3.5 md:p-5 rounded-2xl border border-gold-100/80">
              <p className="text-gray-800 text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium">
                {product.detailContent || product.description}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-2.5 md:p-4 border-t border-gray-100 bg-white flex gap-2.5 shrink-0 pb-safe">
          <button 
            onClick={onClose}
            className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition text-xs sm:text-sm"
          >
            닫기
          </button>
          <button 
            onClick={() => window.open('https://open.kakao.com/o/gprQnKSi', '_blank')}
            className="flex-1 py-3 bg-deepgreen text-white rounded-xl font-bold shadow-md hover:bg-gold-600 active:scale-95 transition flex items-center justify-center gap-1.5 text-xs sm:text-sm"
          >
            <span>💬</span> 카톡으로 문의하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
