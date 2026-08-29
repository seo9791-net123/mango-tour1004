import React, { useState } from 'react';
import { Product } from '../types';

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
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in pt-safe">
      <div className="bg-white overflow-hidden shadow-2xl max-w-3xl w-full h-[90vh] sm:h-[85vh] rounded-t-3xl sm:rounded-2xl flex flex-col animate-scale-in">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
          <h2 className="text-base sm:text-xl font-bold text-deepgreen line-clamp-1">{product.title}</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 active:scale-95 transition font-bold text-sm shrink-0 ml-2"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Image Slider / Gallery */}
          <div className="space-y-3">
            <div className="aspect-[16/10] sm:aspect-video rounded-2xl overflow-hidden bg-gray-100 shadow-inner relative">
              <img 
                src={images[activeImageIdx]} 
                alt={`Detail ${activeImageIdx}`} 
                className="w-full h-full object-cover animate-fade-in"
              />
              {images.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between px-3">
                  <button 
                    onClick={() => setActiveImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                    className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 active:scale-95 transition text-sm"
                  >
                    ←
                  </button>
                  <button 
                    onClick={() => setActiveImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                    className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 active:scale-95 transition text-sm"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
            
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition ${activeImageIdx === idx ? 'border-gold-500 scale-105 shadow-sm' : 'border-transparent opacity-60'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className="space-y-3">
            <div className="bg-gold-50/60 p-4 sm:p-5 rounded-2xl border border-gold-100/80">
              <p className="text-gray-800 text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium">
                {product.detailContent || product.description}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-gray-100 bg-white flex gap-2.5 shrink-0 pb-safe">
          <button 
            onClick={onClose}
            className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition text-xs sm:text-sm"
          >
            닫기
          </button>
          <button 
            onClick={() => window.open('https://open.kakao.com/o/gSfNsh3h', '_blank')}
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
