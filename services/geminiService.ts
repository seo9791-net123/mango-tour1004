import { TripPlanRequest, TripPlanResult, CustomTripRequest, DailyPlan, UnitPrices } from "../types";

/**
 * AI 여행 플래너: 기본 견적 및 일정 생성 (Server-Side Proxy)
 */
export const generateTripPlan = async (request: TripPlanRequest): Promise<TripPlanResult> => {
  try {
    const response = await fetch('/api/gemini/generate-trip-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request })
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success && data.data) {
      return data.data as TripPlanResult;
    }

    throw new Error('Invalid response structure from server');
  } catch (error) {
    console.warn('generateTripPlan server call failed, using client fallback:', error);
    return getMockTripPlan(request);
  }
};

/**
 * AI 여행 플래너: 맞춤형 상세 일정 생성 (Server-Side Proxy)
 */
export const generateCustomTripPlan = async (request: CustomTripRequest, unitPrices: UnitPrices): Promise<TripPlanResult> => {
  try {
    const response = await fetch('/api/gemini/generate-custom-trip-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request, unitPrices })
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success && data.data) {
      return data.data as TripPlanResult;
    }

    throw new Error('Invalid response structure from server');
  } catch (error) {
    console.warn('generateCustomTripPlan server call failed, using client fallback:', error);
    return getMockCustomTripPlan(request);
  }
};

/**
 * 동영상 제목과 설명을 분석하여 카테고리를 추천합니다 (Server-Side Proxy)
 */
export const classifyVideoCategory = async (title: string, description?: string): Promise<'골프' | '여행' | '먹거리' | '기타'> => {
  try {
    const response = await fetch('/api/gemini/classify-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    });

    if (!response.ok) {
      return fallbackCategoryClassification(title, description);
    }

    const data = await response.json();
    if (data.success && data.category) {
      return data.category as '골프' | '여행' | '먹거리' | '기타';
    }

    return fallbackCategoryClassification(title, description);
  } catch (error) {
    console.warn('classifyVideoCategory server call failed, using heuristic fallback:', error);
    return fallbackCategoryClassification(title, description);
  }
};

/**
 * Server-Side Gemini Content Streaming (SSE)
 */
export const streamGeminiContent = async (
  prompt: string,
  onChunk: (chunk: string) => void,
  systemInstruction?: string
): Promise<string> => {
  const response = await fetch('/api/gemini/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemInstruction })
  });

  if (!response.ok || !response.body) {
    throw new Error('Failed to start streaming from server');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunkStr = decoder.decode(value, { stream: true });
    const lines = chunkStr.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') break;
        try {
          const parsed = JSON.parse(payload);
          if (parsed.text) {
            fullText += parsed.text;
            onChunk(parsed.text);
          }
        } catch {
          // ignore non-json SSE lines
        }
      }
    }
  }

  return fullText;
};

/**
 * Gemini Live API WebSocket connection helper
 */
export const connectGeminiLive = (): WebSocket => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/api/gemini/live`;
  return new WebSocket(wsUrl);
};

// -------------------------------------------------------------
// Client Heuristic & Mock Fallbacks (for offline/no-network resilience)
// -------------------------------------------------------------
const fallbackCategoryClassification = (title: string, description?: string): '골프' | '여행' | '먹거리' | '기타' => {
  const text = `${title} ${description || ''}`.toLowerCase();
  if (text.includes('골프') || text.includes('cc') || text.includes('라운딩') || text.includes('홀')) return '골프';
  if (text.includes('식당') || text.includes('맛') || text.includes('음식') || text.includes('먹') || text.includes('씨푸드') || text.includes('바베큐')) return '먹거리';
  if (text.includes('여행') || text.includes('투어') || text.includes('호텔') || text.includes('풍경') || text.includes('호치민') || text.includes('붕따우')) return '여행';
  return '기타';
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
  itinerary: (request.dailyPlans || []).map((dp: DailyPlan) => ({
    day: dp.day,
    activities: [`${dp.location} 주요 명소 관광`, "현지 식사", "자유 시간"]
  })),
  costBreakdown: [{ item: "전 일정 예상 비용", cost: "10,000,000 VND" }],
  totalCost: "10,000,000 VND",
  summary: `${request.clientName}님을 위한 맞춤 일정입니다.`
});
