import React from 'react';
import { getFreshImageUrl } from '../utils/imageUtils';

interface MenuItem {
  label: string;
  icon: string;
}

interface Props {
  items: MenuItem[];
  onItemClick?: (label: string) => void;
}

const IconMenu: React.FC<Props> = ({ items, onItemClick }) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-4">
      <div className="bg-white rounded-[20px] shadow-sm p-3.5 sm:p-5 md:p-6">
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3.5 items-stretch">
          {items.map((item, index) => (
            <button
              type="button"
              key={index}
              onClick={() => onItemClick && onItemClick(item.label)}
              className="group flex flex-col items-center justify-start gap-1.5 cursor-pointer transition-all duration-200 active:scale-95 p-1 rounded-2xl hover:bg-[#ECFDF5]/60"
            >
              {/* iOS Squircle Tile */}
              <div className="relative w-full aspect-square max-w-[78px] sm:max-w-[88px] md:max-w-[96px] mx-auto rounded-[18px] sm:rounded-[20px] bg-[#F2F2F7]/80 group-hover:bg-[#ECFDF5] flex items-center justify-center transition-all duration-200 overflow-hidden">
                <div className="w-full h-full p-2.5 sm:p-3 flex items-center justify-center">
                  <img 
                    src={getFreshImageUrl(item.icon)} 
                    alt={item.label}
                    className="w-full h-full object-contain drop-shadow-xs transform group-hover:scale-105 transition-transform duration-200 ease-out"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = getFreshImageUrl('https://cdn-icons-png.flaticon.com/512/8212/8212613.png');
                    }}
                  />
                </div>
              </div>
              
              {/* Label */}
              <span className="text-[11px] xs:text-[12px] sm:text-[13px] font-semibold text-[#3A3A3C] group-hover:text-[#0A7E54] tracking-tight transition-colors duration-200 text-center leading-tight break-keep px-0.5 whitespace-nowrap">
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
