
import { GoogleGenAI, Type } from "@google/genai";
import { TripPlanRequest, TripPlanResult } from "../types";

const createClient = () => {
  let apiKey = "";
  
  try {
    // 1. Try standard process.env (Vite handles this during build if configured, 
    // or platform injects it)
    apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || "").trim();
    
    // 2. Try Vite-specific import.meta.env
    if (!apiKey || apiKey === "undefined") {
      apiKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY || "").trim();
    }

    // 3. Try window globals (some environments inject here)
    if (!apiKey || apiKey === "undefined") {
      apiKey = ((window as any).GEMINI_API_KEY || (window as any).API_KEY || "").trim();
    }
  } catch (e) {
    console.error("Error accessing API key:", e);
  }

  // If we still don't have a key, we'll try to proceed with an empty string 
  // rather than a dummy string, as a dummy string might trigger 
  // "invalid key" prompts from the platform.
  return new GoogleGenAI({ apiKey: apiKey });
};

export const generateTripPlan = async (request: TripPlanRequest): Promise<TripPlanResult> => {
  const ai = createClient();
  const model = "gemini-3-flash-preview";

  const prompt = `
    Create a detailed travel itinerary and cost breakdown for a trip to Vietnam.
    
    Destination: ${request.destination}
    Theme: ${request.theme}
    Accommodation Level: ${request.accommodation}
    Duration: ${request.duration}
    Number of People: ${request.pax}
    Guide Included: ${request.guide}
    Vehicle: ${request.vehicle}

    Please provide:
    1. A daily itinerary with exactly 3 activities per day:
       - 1st activity: Morning (오전)
       - 2nd activity: Afternoon (오후)
       - 3rd activity: Evening (저녁)
    2. A cost breakdown table (estimated) for accommodation, golf/activities, food, and transport in USD.
    3. A total estimated cost in USD.
    4. A brief summary of the trip concept.

    IMPORTANT PRICING RULES (CALCULATE STRICTLY in USD):
    1. Vehicle Cost (Calculate based on itinerary days):
       - If Vehicle is '7인승': Add 100 USD per day.
       - If Vehicle is '16인승': Add 120 USD per day.
       - If Vehicle is '26인승': Add 180 USD per day (Estimate).
       - If '선택안함': 0 USD.
    2. Guide Cost:
       - If Guide Included is '예': Add 80 USD per day.
       - If Guide Included is '아니오': 0 USD.
    3. Meal Policy: Include Hotel Breakfast & Golf Course Lunch costs. EXCLUDE Dinner cost.
    4. Airfare: EXCLUDE completely.
    5. Output: 
       - Explicitly mention in the summary or cost breakdown that "항공권 제외" (Airfare Excluded).
       - In 'costBreakdown', list the vehicle and guide costs separately if applicable.
       - Format numbers with commas (e.g. 1,000 USD).

    Respond in KOREAN (Hangul). Keep the itinerary descriptions concise.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        maxOutputTokens: 20000,
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
                  activities: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING } 
                  }
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
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Gemini API Error:", error);
    console.warn("Falling back to mock data due to API error.");
    
    // API 호출 실패 시 (결제 문제, 키 문제 등) 모의 데이터 반환
    return getMockTripPlan(request);
  }
};

// 모의 데이터 생성 함수
const getMockTripPlan = (request: TripPlanRequest): TripPlanResult => {
  return {
    itinerary: [
      {
        day: 1,
        activities: [
          "공항 픽업 및 호텔 체크인",
          "시내 중심가 산책 및 환전",
          "현지 맛집에서 쌀국수 저녁 식사"
        ]
      },
      {
        day: 2,
        activities: [
          "오전 골프 라운딩 (또는 시티 투어)",
          "유명 카페 방문 및 휴식",
          "야시장 투어 및 길거리 음식 체험"
        ]
      },
      {
        day: 3,
        activities: [
          "근교 명소 (바나힐 등) 관광",
          "전통 마사지 체험",
          "해산물 레스토랑 만찬"
        ]
      }
    ],
    costBreakdown: [
      { item: "숙박비 (3박, 4성급 기준)", cost: "180 USD" },
      { item: "차량 지원 (기사 포함)", cost: "120 USD" },
      { item: "식비 (조식 포함, 중/석식)", cost: "100 USD" },
      { item: "입장료 및 체험비", cost: "60 USD" },
      { item: "가이드 비용", cost: "80 USD" }
    ],
    totalCost: "540 USD",
    summary: `[예시 견적] ${request.destination} ${request.duration} 여행입니다. ${request.theme} 테마에 맞춰 구성되었으며, ${request.pax}인 기준 견적입니다. (항공권 제외)`
  };
};

/**
 * 동영상 제목과 설명을 분석하여 카테고리를 추천합니다.
 */
export const classifyVideoCategory = async (title: string, description?: string): Promise<'골프' | '여행' | '먹거리' | '기타'> => {
  try {
    const ai = createClient();
    const model = "gemini-3-flash-preview";

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
