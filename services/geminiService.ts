
import { GoogleGenAI, Type } from "@google/genai";
import { TripPlanRequest, TripPlanResult } from "../types";

const createClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
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
    2. A cost breakdown table (estimated) for accommodation, golf/activities, food, and transport in VND.
    3. A total estimated cost in VND.
    4. A brief summary of the trip concept.

    IMPORTANT PRICING RULES (CALCULATE STRICTLY in VND):
    1. Vehicle Cost (Calculate based on itinerary days):
       - If Vehicle is '7인승': Add 2,500,000 VND per day.
       - If Vehicle is '16인승': Add 3,000,000 VND per day.
       - If Vehicle is '26인승': Add 4,500,000 VND per day (Estimate).
       - If '선택안함': 0 VND.
    2. Guide Cost:
       - If Guide Included is '예': Add 2,000,000 VND per day.
       - If Guide Included is '아니오': 0 VND.
    3. Meal Policy: Include Hotel Breakfast & Golf Course Lunch costs. EXCLUDE Dinner cost.
    4. Airfare: EXCLUDE completely.
    5. Output: 
       - Explicitly mention in the summary or cost breakdown that "항공권 제외" (Airfare Excluded).
       - In 'costBreakdown', list the vehicle and guide costs separately if applicable.
       - Format numbers with commas (e.g. 10,000,000 VND).

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
    throw new Error("여행 계획 생성에 실패했습니다. 다시 시도해주세요.");
  }
};
