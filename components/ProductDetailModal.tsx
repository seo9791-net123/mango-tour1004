
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
    : [product.image]; // Fallback to main product image

  return (
    <div className="fixed inset-0 z-[10000] flex items-start md:items-center justify-center p-0 bg-black/80 backdrop-blur-md animate-fade-in pt-20 md:pt-0">
      <div className="bg-white overflow-hidden shadow-2xl max-w-4xl w-full h-full md:h-[95vh] md:max-h-[95vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="px-4 md:px-10 py-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-black text-deepgreen">{product.title}</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-4 md:px-10 py-6 space-y-8">
          {/* Image Slider / Gallery */}
          <div className="space-y-4">
            <div className="aspect-video rounded-3xl overflow-hidden bg-gray-100 shadow-inner relative">
              <img 
                src={images[activeImageIdx]} 
                alt={`Detail ${activeImageIdx}`} 
                className="w-full h-full object-cover animate-fade-in"
              />
              {images.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between px-4">
                  <button 
                    onClick={() => setActiveImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                    className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition"
                  >
                    ←
                  </button>
                  <button 
                    onClick={() => setActiveImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                    className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
            
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition ${activeImageIdx === idx ? 'border-gold-500 scale-105' : 'border-transparent opacity-60'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className="space-y-4">
            <div className="bg-gold-50 p-6 rounded-3xl border border-gold-100">
              <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-line font-medium">
                {product.detailContent || product.description}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 md:px-10 py-6 pb-20 md:pb-6 border-t bg-gray-50 flex gap-3">
          <button 
            onClick={() => window.open('https://open.kakao.com/o/gSfNsh3h', '_blank')}
            className="flex-1 py-4 bg-deepgreen text-white rounded-2xl font-bold shadow-lg hover:bg-gold-600 transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="text-lg">💬</span> 카톡으로 문의하기
          </button>
          <button 
            onClick={onClose}
            className="px-8 py-4 bg-white text-gray-500 rounded-2xl font-bold border border-gray-200 hover:bg-gray-100 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
