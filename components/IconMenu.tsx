import React from 'react';
import { getFreshImageUrl } from '../utils/imageUtils';
import { MenuItem } from '../types';

interface Props {
  items: MenuItem[];
  onItemClick?: (label: string) => void;
}

const IconMenu: React.FC<Props> = ({ items, onItemClick }) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4">
      <div className="bg-white rounded-[20px] shadow-sm px-2 sm:px-4 pt-3.5 pb-4 sm:pt-4 sm:pb-5">
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-x-1.5 gap-y-2.5 sm:gap-x-3 sm:gap-y-3.5 md:gap-x-3.5 items-stretch">
        {items.map((item, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onItemClick && onItemClick(item.label)}
            className="group flex flex-col items-center justify-start gap-2 cursor-pointer transition-transform duration-200 active:scale-95 p-1 rounded-2xl bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepgreen/40"
          >
            {/* Clean Floating Icon Container */}
            <div className="relative w-full aspect-square max-w-[74px] sm:max-w-[82px] md:max-w-[88px] mx-auto rounded-2xl sm:rounded-3xl bg-white flex items-center justify-center overflow-hidden">
               {/* Icon Image */}
               <div className="w-full h-full p-1 flex items-center justify-center">
                  <img 
                    src={getFreshImageUrl(item.icon)} 
                    alt={item.label}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain mix-blend-multiply brightness-[1.04] contrast-[1.05] transform group-hover:scale-105 transition-transform duration-200 ease-out"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.dataset.fallbackApplied) {
                        target.dataset.fallbackApplied = '1';
                        target.src = '/icon-192.png';
                      }
                    }}
                  />
               </div>
            </div>
            
            {/* Label */}
            <span className="text-[11px] xs:text-[12px] sm:text-[13px] md:text-[14px] font-bold text-gray-700 group-hover:text-deepgreen tracking-tight transition-colors duration-200 text-center leading-none break-keep px-0.5 whitespace-nowrap">
              {item.label}
            </span>
          </button>
        ))}
        </div>
      </div>
    </div>
  );
};

export default IconMenu;
