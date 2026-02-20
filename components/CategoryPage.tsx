
import React from 'react';
import { Product } from '../types';

interface Props {
  category: string;
  products: Product[];
  onProductClick: (id: string) => void;
  onBack: () => void;
}

const CategoryPage: React.FC<Props> = ({ category, products, onProductClick, onBack }) => {
  return (
    <div className="py-8 bg-gray-50 min-h-[600px] animate-fade-in">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
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
                  <div className="text-[10px] text-gold-600 font-bold mb-0.5">{product.location}</div>
                  <h3 className="font-bold text-sm mb-1 text-gray-800 line-clamp-1">{product.title}</h3>
                  <p className="text-gray-500 text-[11px] mb-3 line-clamp-2 h-8">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-red-600">{product.price.toLocaleString()} VND~</span>
                    <button 
                      onClick={() => onProductClick(product.id)}
                      className="bg-deepgreen text-white px-2.5 py-1 rounded text-[10px] hover:bg-opacity-90 transition flex items-center gap-1"
                    >
                      견적보기 <span className="text-[9px]">↗</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
