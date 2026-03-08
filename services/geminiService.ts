
import { GoogleGenAI } from "@google/genai";

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
