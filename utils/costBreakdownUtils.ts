import { ProductCostBreakdownItem } from '../types';

/**
 * 여행 기간(일자) 산출 헬퍼
 * 예: 3박 5일 -> 4일 활동 (또는 일정표 일수), 4박 6일 -> 5일 활동, 4박 5일 -> 5일 활동
 */
export const getTravelDays = (duration?: string, itinerary?: Array<{ day: number } | any>): number => {
  if (itinerary && itinerary.length > 0) {
    return itinerary.length;
  }
  if (!duration) return 4;
  const nightMatch = duration.match(/(\d+)\s*박/);
  if (nightMatch) {
    const nights = parseInt(nightMatch[1], 10);
    return Math.max(1, nights + 1);
  }
  const dayMatch = duration.match(/(\d+)\s*일/);
  if (dayMatch) {
    return Math.max(1, parseInt(dayMatch[1], 10));
  }
  return 4;
};

/**
 * 항목명 기반 요금 산정 방식 자동 분류
 * - vehicle: 차량 (리무진 밴 등 - 4인당 1대 기준)
 * - guide: 가이드 (한국어 가이드 등 - 16인당 1명 기준)
 * - person: 개인별 (항공권, 골프, 호텔 등 - 1인당 기준)
 */
export const getItemPricingType = (
  category: string,
  explicitType?: 'person' | 'vehicle' | 'guide'
): 'person' | 'vehicle' | 'guide' => {
  if (explicitType) return explicitType;
  const lower = (category || '').toLowerCase();
  if (lower.includes('차량') || lower.includes('리무진') || lower.includes('밴') || lower.includes('렌트') || lower.includes('기사')) {
    return 'vehicle';
  }
  if (lower.includes('가이드') || lower.includes('통역') || lower.includes('인솔자')) {
    return 'guide';
  }
  return 'person';
};

/**
 * 단일 경비 항목에 대한 총 금액 및 수량 계산
 * - 차량: 리무진 밴 기준 4인까지 1대 (5~8인 2대, 9~12인 3대...), 여행 기간(일수) 적용
 * - 가이드: 16인까지 1명 기준 (17~32인 2명...), 여행 기간(일수) 적용
 * - 개인 항목: 1인당 단가 * 인원수
 */
export const calculateCostItemTotal = (
  item: ProductCostBreakdownItem,
  personCount: number,
  travelDays: number
): { amountUSD: number; quantity: string } => {
  const pType = getItemPricingType(item.category, item.pricingType);
  const days = item.days && item.days > 0 ? item.days : travelDays;
  const baseRate = item.amountUSD || 0;

  if (pType === 'vehicle') {
    // 4인당 리무진 밴 1대
    const vehicleCount = Math.max(1, Math.ceil(personCount / 4));
    const isPerDay = item.perDay !== undefined ? item.perDay : false;
    const totalUSD = isPerDay ? Math.round(baseRate * days * vehicleCount) : Math.round(baseRate * vehicleCount);

    let qty = `${vehicleCount}대 (전일정 ${days}일)`;
    if (item.quantity && !item.quantity.includes('{personCount}')) {
      qty = item.quantity
        .replace('{vehicleCount}', String(vehicleCount))
        .replace('{days}', String(days));
    }
    return { amountUSD: totalUSD, quantity: qty };
  }

  if (pType === 'guide') {
    // 16인당 가이드 1명
    const guideCount = Math.max(1, Math.ceil(personCount / 16));
    const isPerDay = item.perDay !== undefined ? item.perDay : true;
    const totalUSD = isPerDay ? Math.round(baseRate * days * guideCount) : Math.round(baseRate * guideCount);

    let qty = `${guideCount}명 (전일정 ${days}일)`;
    if (item.quantity && !item.quantity.includes('{personCount}')) {
      qty = item.quantity
        .replace('{guideCount}', String(guideCount))
        .replace('{days}', String(days));
    }
    return { amountUSD: totalUSD, quantity: qty };
  }

  // 기본: 1인당 (항공권, 골프 그린피, 숙박 등)
  const totalUSD = Math.round(baseRate * personCount);
  let qty = `${personCount}인`;
  if (item.quantity) {
    qty = item.quantity.replace(/\{personCount\}/g, String(personCount));
  }
  return { amountUSD: totalUSD, quantity: qty };
};
