import React from 'react';
import { RecommendedDiscountPopup } from '../types';

export const RECOMMENDED_DISCOUNT_HIDE_DATE_KEY = 'mango_rec_discount_popup_hide_date';

export const getTodayDateKey = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const isDiscountPopupHiddenToday = (): boolean => {
  try {
    return localStorage.getItem(RECOMMENDED_DISCOUNT_HIDE_DATE_KEY) === getTodayDateKey();
  } catch {
    return false;
  }
};

export const hideDiscountPopupToday = (): void => {
  try {
    localStorage.setItem(RECOMMENDED_DISCOUNT_HIDE_DATE_KEY, getTodayDateKey());
  } catch {
    // ignore storage errors
  }
};

interface CardProps {
  data: RecommendedDiscountPopup;
  onClose: () => void;
  onHideToday: () => void;
  onSelectProduct?: (productId: string) => void;
  isPreview?: boolean;
}

export const RecommendedDiscountCard: React.FC<CardProps> = ({
  data,
  onClose,
  onHideToday,
  onSelectProduct,
  isPreview = false
}) => {
  const trimmedLink = (data.link || '').trim();
  const isInternalProductLink = trimmedLink.startsWith('product:');
  const productId = isInternalProductLink ? trimmedLink.slice('product:'.length).trim() : '';
  const externalHref = !isInternalProductLink
    ? (trimmedLink || 'https://open.kakao.com/o/gprQnKSi')
    : '';

  const handleDetailAction = (e?: React.MouseEvent) => {
    if (isPreview) {
      e?.preventDefault();
      return;
    }
    if (isInternalProductLink && productId && onSelectProduct) {
      e?.preventDefault();
      onClose();
      onSelectProduct(productId);
      return;
    }
    onClose();
  };

  return (
    <div
      className="w-full bg-white rounded-[16px] shadow-[0_24px_60px_rgba(0,0,0,0.45)] border border-gold-300/40 overflow-hidden flex flex-col text-left"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Hero Header Band (Badge + Discount Rate + Product Title) */}
      <div className="bg-gradient-to-br from-deepgreen via-[#044a34] to-[#01291c] px-5 pt-5 pb-4 text-white relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="팝업 닫기"
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 text-white/90 flex items-center justify-center text-xs font-bold transition cursor-pointer"
        >
          ✕
        </button>

        {data.badgeText?.trim() && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-gold-400 to-amber-300 text-deepgreen font-black text-xs sm:text-[13px] tracking-wide shadow-md">
            <span>🔥</span>
            <span>{data.badgeText}</span>
          </div>
        )}

        {data.discountRate?.trim() && (
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl sm:text-[34px] font-black tracking-tight text-amber-300 drop-shadow-sm leading-none">
              {data.discountRate}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-200/90">
              SPECIAL OFFER
            </span>
          </div>
        )}

        <h3 className="mt-2 text-lg sm:text-[19px] font-extrabold text-white leading-snug break-keep pr-4">
          {data.productTitle || '추천 특가 할인 상품'}
        </h3>
      </div>

      {/* Body: Pricing + Benefits + Deadline */}
      <div className="p-4 sm:p-5 space-y-3 bg-white">
        {/* Price Comparison Card */}
        {(data.originalPrice?.trim() || data.discountPrice?.trim()) && (
          <div className="bg-amber-50/75 border border-amber-200/80 rounded-xl px-4 py-3 text-center">
            {data.originalPrice?.trim() && (
              <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-gray-500 font-semibold">
                <span>정상가</span>
                <span className="line-through text-gray-400 tabular-nums">{data.originalPrice}</span>
                <span className="text-amber-600 font-bold">→</span>
              </div>
            )}
            {data.discountPrice?.trim() && (
              <div className="mt-0.5 flex items-baseline justify-center gap-1.5">
                <span className="text-xs font-extrabold text-red-600 uppercase tracking-wide">할인가</span>
                <span className="text-2xl sm:text-[28px] font-black text-red-600 tracking-tight tabular-nums leading-tight">
                  {data.discountPrice}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Benefit / Option Summary */}
        {data.benefitSummary?.trim() && (
          <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3.5">
            <div className="text-[11px] font-extrabold text-deepgreen uppercase tracking-wider mb-1 flex items-center gap-1">
              <span>✨</span>
              <span>포함 혜택 및 옵션</span>
            </div>
            <p className="text-xs sm:text-[13px] font-semibold text-gray-800 leading-relaxed whitespace-pre-line break-keep">
              {data.benefitSummary}
            </p>
          </div>
        )}

        {/* Deadline */}
        {data.deadline?.trim() && (
          <div className="flex items-center justify-center gap-1.5 text-xs sm:text-[13px] font-bold text-deepgreen bg-emerald-50 border border-emerald-200/70 rounded-lg py-2 px-3 text-center">
            <span>⏰</span>
            <span className="break-keep">{data.deadline}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-1 space-y-2">
          {isInternalProductLink || isPreview ? (
            <button
              type="button"
              onClick={handleDetailAction}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-deepgreen to-emerald-800 hover:from-emerald-900 hover:to-deepgreen text-white font-black text-sm sm:text-[15px] rounded-xl shadow-lg shadow-deepgreen/25 transition transform active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>특가 상품 자세히 보기</span>
              <span>→</span>
            </button>
          ) : (
            <a
              href={externalHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDetailAction}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-deepgreen to-emerald-800 hover:from-emerald-900 hover:to-deepgreen text-white font-black text-sm sm:text-[15px] rounded-xl shadow-lg shadow-deepgreen/25 transition transform active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>특가 상품 자세히 보기</span>
              <span>→</span>
            </a>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onHideToday}
              className="py-2.5 px-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              오늘 하루 보지 않기
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-2 text-xs font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ModalProps {
  isOpen: boolean;
  data: RecommendedDiscountPopup;
  onClose: () => void;
  onHideToday: () => void;
  onSelectProduct?: (productId: string) => void;
  isPreview?: boolean;
}

const RecommendedDiscountModal: React.FC<ModalProps> = ({
  isOpen,
  data,
  onClose,
  onHideToday,
  onSelectProduct,
  isPreview = false
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="추천상품 할인 특가 안내"
    >
      <div className="w-[89%] max-w-[400px] max-h-[90vh] overflow-y-auto rounded-[16px] animate-scale-in">
        <RecommendedDiscountCard
          data={data}
          onClose={onClose}
          onHideToday={onHideToday}
          onSelectProduct={onSelectProduct}
          isPreview={isPreview}
        />
      </div>
    </div>
  );
};

export default RecommendedDiscountModal;
