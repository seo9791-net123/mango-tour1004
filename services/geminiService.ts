
import { GoogleGenAI, Type } from "@google/genai";
import { TripPlanRequest, TripPlanResult, CustomTripRequest, DailyPlan, UnitPrices } from "../types";

const createClient = () => {
  let apiKey = "";
  
  try {
    // 1. Try standard process.env (Vite handles this during build if configured)
    apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || "").trim();
    
    // 2. Try Vite-specific import.meta.env
    if (!apiKey || apiKey === "undefined" || apiKey === "") {
      apiKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY || "").trim();
    }

    // 3. Try window globals
    if (!apiKey || apiKey === "undefined" || apiKey === "") {
      apiKey = ((window as any).GEMINI_API_KEY || (window as any).API_KEY || "").trim();
    }
  } catch (e) {
    // Silent fail
  }

  // Ensure we don't pass "undefined" string
  if (apiKey === "undefined") apiKey = "";
  
  return new GoogleGenAI({ apiKey: apiKey });
};

/**
 * AI 여행 플래너: 기본 견적 및 일정 생성
 */
export const generateTripPlan = async (request: TripPlanRequest): Promise<TripPlanResult> => {
  const ai = createClient();
  const model = "gemini-3.1-flash-lite-preview";

  const prompt = `
    베트남 여행 전문가로서 다음 요청에 대한 상세 일정과 예상 견적을 작성해 주세요.
    
    목적지: ${request.destination}
    테마: ${request.theme}
    숙소 등급: ${request.accommodation}
    기간: ${request.duration}
    인원: ${request.pax}인
    가이드 포함: ${request.guide}
    차량: ${request.vehicle}

    [요구사항]
    1. 일자별 상세 일정을 'itinerary' 배열에 담아주세요. (오전, 오후, 저녁 활동 포함)
    2. 예상 비용 내역을 'costBreakdown' 배열에 담아주세요. (숙박, 골프/액티비티, 식비, 차량/가이드 등)
    3. 총 예상 비용을 'totalCost'에 적어주세요. (단위: USD)
    4. 전체적인 여행 컨셉 요약을 'summary'에 적어주세요.
    5. 모든 답변은 한국어로 작성해 주세요.
    6. 항공권은 제외된 견적임을 명시해 주세요.

    [응답 형식] JSON
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itinerary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.NUMBER },
                  activities: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            costBreakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING },
                  cost: { type: Type.STRING }
                }
              }
            },
            totalCost: { type: Type.STRING },
            summary: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as TripPlanResult;
    }
    throw new Error("응답 결과가 없습니다.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return getMockTripPlan(request);
  }
};

/**
 * AI 여행 플래너: 맞춤형 상세 일정 생성
 */
export const generateCustomTripPlan = async (request: CustomTripRequest, unitPrices: UnitPrices): Promise<TripPlanResult> => {
  const ai = createClient();
  const model = "gemini-3.1-flash-lite-preview";

  const dailyPlansStr = request.dailyPlans.map((dp: DailyPlan) => `
    ${dp.day}일차 (${dp.date}):
    - 지역: ${dp.location}
    - 숙소: ${dp.accommodation}
    - 인원: ${dp.personCount}명
    - 선택 상품: ${dp.selectedProducts.map(p => p.name).join(', ') || '없음'}
    - 요청사항: ${dp.dailyRequests}
    - 차량/가이드: ${dp.transportService.useRentCar ? dp.transportService.carType : '미사용'}, ${dp.transportService.useGuide ? '가이드 포함' : '가이드 미포함'}
  `).join('\n');

  const unitPricesStr = `
    [기준 단가 정보 (VND)]
    - 숙박: ${JSON.stringify(unitPrices.hotels)}
    - 차량: ${JSON.stringify(unitPrices.cars)}
    - 가이드: ${unitPrices.guide} (일당)
  `;

  const prompt = `
    베트남 여행 전문가로서 ${request.clientName} 고객님을 위한 최적의 여행 일정을 설계해 주세요.
    
    [여행 개요]
    - 입국: ${request.arrivalDate} ${request.arrivalTime}
    - 출국: ${request.departureDate} ${request.departureTime}
    - 기간: ${request.durationSummary}
    
    [일자별 세부 요청]
    ${dailyPlansStr}
    
    ${unitPricesStr}
    
    [추가 요청사항]
    ${request.extraRemarks}

    [요구사항]
    1. 각 날짜별로 시간대별(오전, 오후, 저녁) 구체적인 활동을 포함한 'itinerary'를 작성해 주세요.
    2. 제공된 [기준 단가 정보]와 요청하신 숙소/차량 등급, 인원수를 바탕으로 정확한 'costBreakdown'을 작성해 주세요. (단위: VND)
    3. 전체 일정을 아우르는 환영 메시지와 요약을 'summary'에 한국어로 작성해 주세요.
    4. 항공권은 제외된 견적입니다.

    [응답 형식] JSON
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itinerary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.NUMBER },
                  activities: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            costBreakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING },
                  cost: { type: Type.STRING }
                }
              }
            },
            totalCost: { type: Type.STRING },
            summary: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as TripPlanResult;
    }
    throw new Error("응답 결과가 없습니다.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return getMockCustomTripPlan(request);
  }
};

const getMockTripPlan = (request: TripPlanRequest): TripPlanResult => ({
  itinerary: [
    { day: 1, activities: ["공항 픽업 및 호텔 체크인", "시내 중심가 투어", "현지 맛집 석식"] },
    { day: 2, activities: ["오전 골프 라운딩", "오후 마사지 및 휴식", "야시장 투어"] }
  ],
  costBreakdown: [
    { item: "숙박비", cost: "300 USD" },
    { item: "골프/액티비티", cost: "200 USD" }
  ],
  totalCost: "500 USD",
  summary: `${request.destination} 힐링 여행 패키지입니다.`
});

const getMockCustomTripPlan = (request: CustomTripRequest): TripPlanResult => ({
  itinerary: request.dailyPlans.map((dp: DailyPlan) => ({
    day: dp.day,
    activities: [`${dp.location} 주요 명소 관광`, "현지 식사", "자유 시간"]
  })),
  costBreakdown: [{ item: "전 일정 예상 비용", cost: "10,000,000 VND" }],
  totalCost: "10,000,000 VND",
  summary: `${request.clientName}님을 위한 맞춤 일정입니다.`
});

/**
 * 동영상 제목과 설명을 분석하여 카테고리를 추천합니다.
 */
export const classifyVideoCategory = async (title: string, description?: string): Promise<'골프' | '여행' | '먹거리' | '기타'> => {
  try {
    const ai = createClient();
    
    // If no API key is found, return '기타' immediately
    const apiKey = (ai as any).apiKey;
    if (!apiKey || apiKey === "undefined" || apiKey === "dummy_key_for_fallback") {
      return '기타';
    }

    const model = "gemini-3.1-flash-lite-preview";

    const prompt = `
      다음 동영상의 제목과 설명을 분석하여 가장 적합한 카테고리 하나를 선택하세요.
      카테고리 옵션: ['골프', '여행', '먹거리', '기타']

      동영상 제목: ${title}
      동영상 설명: ${description || '설명 없음'}

      반드시 위 4가지 옵션 중 하나만 정확하게 텍스트로 반환하세요. 다른 설명은 생략하세요.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        maxOutputTokens: 20,
        temperature: 0.1,
      }
    });

    const result = response.text?.trim();
    const validCategories = ['골프', '여행', '먹거리', '기타'];
    
    if (result && validCategories.includes(result)) {
      return result as '골프' | '여행' | '먹거리' | '기타';
    }
    
    // 유효하지 않은 응답일 경우 텍스트 포함 여부로 재검사
    for (const cat of validCategories) {
      if (result?.includes(cat)) return cat as any;
    }

    return '기타';
  } catch (error) {
    console.error("Gemini Classification Error:", error);
    return '기타';
  }
};
