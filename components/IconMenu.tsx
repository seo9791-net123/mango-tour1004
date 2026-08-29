
import React from 'react';

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
    <div className="py-4 sm:py-6 bg-white max-w-7xl mx-auto px-3 sm:px-4">
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4 md:gap-6">
        {items.map((item, index) => (
          <div
            key={index}
            onClick={() => onItemClick && onItemClick(item.label)}
            className="group flex flex-col items-center gap-1.5 sm:gap-2 cursor-pointer transition-all duration-300 active:scale-95"
          >
            {/* Premium Icon Container */}
            <div className="relative w-full aspect-square rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white to-gray-50/80 shadow-[0_3px_12px_rgba(0,0,0,0.06)] flex items-center justify-center border border-gray-100 group-hover:shadow-[0_10px_20px_rgba(197,160,40,0.18)] group-hover:border-gold-300 transition-all duration-300 overflow-hidden">
               
               {/* Background Layer for Shine */}
               <div className="absolute inset-0 bg-gradient-to-tr from-gold-50/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
               
               {/* Icon Image */}
               <div className="w-full h-full p-2.5 sm:p-4 flex items-center justify-center z-10">
                  <img 
                    src={item.icon} 
                    alt={item.label}
                    className="w-full h-full object-contain drop-shadow-sm transform group-hover:scale-105 group-hover:-rotate-2 transition-all duration-300 ease-out"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://cdn-icons-png.flaticon.com/512/8212/8212613.png'; // Fallback
                    }}
                  />
               </div>
               
               {/* High-end Flash/Shine effect */}
               <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-25deg] group-hover:animate-[shine_0.7s_ease-in-out]"></div>
            </div>
            
            {/* Label */}
            <span className="text-[12px] sm:text-[14px] md:text-[15px] font-bold text-gray-700 group-hover:text-deepgreen tracking-tight transition-colors duration-300 text-center leading-tight break-keep px-0.5 whitespace-nowrap">
              {item.label}
            </span>
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 200%; }
        }
      `}</style>
    </div>
  );
};

export default IconMenu;
