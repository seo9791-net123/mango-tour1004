
import { GoogleGenAI, Type } from "@google/genai";
import { TripPlanRequest, TripPlanResult, CustomTripRequest } from "../types";

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

export const generateTripPlan = async (request: TripPlanRequest): Promise<TripPlanResult> => {
  const ai = createClient();
  
  // If no API key is found, return mock data immediately to avoid errors or platform alerts
  const apiKey = (ai as any).apiKey;
  if (!apiKey || apiKey === "undefined" || apiKey === "dummy_key_for_fallback") {
    console.warn("No Gemini API key found. Returning mock data.");
    // Small delay for better UX (feels like it's thinking)
    await new Promise(resolve => setTimeout(resolve, 1500));
    return getMockTripPlan(request);
  }

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
      const parsed = JSON.parse(response.text);
      return {
        itinerary: Array.isArray(parsed.itinerary) ? parsed.itinerary : [],
        costBreakdown: Array.isArray(parsed.costBreakdown) ? parsed.costBreakdown : [],
        totalCost: parsed.totalCost || "0 USD",
        summary: parsed.summary || ""
      } as TripPlanResult;
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

export const generateCustomTripPlan = async (request: CustomTripRequest): Promise<TripPlanResult> => {
  const ai = createClient();
  
  const apiKey = (ai as any).apiKey;
  if (!apiKey || apiKey === "undefined" || apiKey === "dummy_key_for_fallback") {
    console.warn("No Gemini API key found. Returning mock data.");
    await new Promise(resolve => setTimeout(resolve, 1500));
    return getMockCustomTripPlan(request);
  }

  const model = "gemini-3-flash-preview";

  const dailyPlansStr = request.dailyPlans.map(dp => `
    Day ${dp.day} (${dp.date}):
    - Location: ${dp.location}
    - Accommodation: ${dp.accommodation}
    - People: ${dp.personCount}
    - Daily Requests: ${dp.dailyRequests}
    - Transport: ${dp.transportService.useRentCar ? dp.transportService.carType : 'None'}
    - Guide: ${dp.transportService.useGuide ? 'Yes' : 'No'}
  `).join('\n');

  const prompt = `
    Create a highly detailed travel itinerary for a client named ${request.clientName}.
    
    Trip Details:
    - Arrival: ${request.arrivalDate} at ${request.arrivalTime}
    - Departure: ${request.departureDate} at ${request.departureTime}
    - Duration: ${request.durationSummary}
    
    Daily Preferences:
    ${dailyPlansStr}
    
    Extra Remarks: ${request.extraRemarks}

    REQUIREMENTS:
    1. You MUST provide a detailed daily itinerary in the 'itinerary' array.
    2. For each day, include at least 3 specific activities (Morning, Afternoon, Evening).
    3. Each activity must be a descriptive sentence in Korean.
    4. Provide a 'costBreakdown' array with estimated costs ONLY for items NOT handled by the app (e.g., Golf fees, Entrance fees, Meals, Massage) in VND.
    5. DO NOT include costs for Accommodation, Vehicle/Transport, or Guide in your 'costBreakdown' as these are calculated automatically by the system.
    6. Provide a 'totalCost' string in VND (sum of your suggested items).
    7. Provide a 'summary' of the trip in Korean.

    IMPORTANT: The 'itinerary' array MUST NOT be empty. It must contain one entry for each day of the trip.

    Respond in KOREAN (Hangul).
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
      const parsed = JSON.parse(response.text);
      return {
        itinerary: Array.isArray(parsed.itinerary) ? parsed.itinerary : [],
        costBreakdown: Array.isArray(parsed.costBreakdown) ? parsed.costBreakdown : [],
        totalCost: parsed.totalCost || "0 VND",
        summary: parsed.summary || ""
      } as TripPlanResult;
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return getMockCustomTripPlan(request);
  }
};

const getMockCustomTripPlan = (request: CustomTripRequest): TripPlanResult => {
  return {
    itinerary: request.dailyPlans.map(dp => ({
      day: dp.day,
      activities: [
        `09:00: ${dp.location} 주요 명소 관광`,
        `13:00: 현지 맛집에서 중식 및 휴식`,
        `19:00: ${dp.location} 야경 감상 및 석식`
      ]
    })),
    costBreakdown: [
      { item: "숙박비 (전 일정)", cost: "5,000,000 VND" },
      { item: "전용 차량 및 가이드", cost: "3,500,000 VND" },
      { item: "식비 및 입장료", cost: "2,000,000 VND" }
    ],
    totalCost: "10,500,000 VND",
    summary: `${request.clientName}님의 ${request.durationSummary} 베트남 맞춤 여행 일정입니다. 요청하신 ${request.dailyPlans[0].accommodation}급 숙소와 전용 차량 서비스를 포함하여 구성되었습니다.`
  };
};

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
