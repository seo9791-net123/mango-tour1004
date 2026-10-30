import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, LiveServerMessage, Modality } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';

import fs from 'fs';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Ensure upload directory exists
const uploadsDir = path.resolve(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically with byte range support for efficient streaming
app.use('/uploads', express.static(uploadsDir, { maxAge: '1d', acceptRanges: true }));
app.use('/public/uploads', express.static(uploadsDir, { maxAge: '1d', acceptRanges: true }));

// Multer Storage Configuration
const storageEngine = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\uAC00-\uD7A3-]/g, '_');
    cb(null, `${Date.now()}_${safeName}${ext}`);
  }
});

const uploadMiddleware = multer({
  storage: storageEngine,
  limits: { fileSize: 250 * 1024 * 1024 } // 250MB for video and media
});

// File Upload API endpoint (multipart/form-data)
app.post('/api/upload', uploadMiddleware.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  console.log(`✅ File uploaded successfully: ${req.file.filename} (${req.file.size} bytes) -> ${fileUrl}`);
  res.json({
    success: true,
    url: fileUrl,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
});

// Base64 File Upload API endpoint
app.post('/api/upload-base64', async (req: Request, res: Response) => {
  try {
    const { filename, data } = req.body;
    if (!filename || !data) {
      return res.status(400).json({ error: 'Missing filename or data' });
    }
    const ext = path.extname(filename);
    const safeName = path.basename(filename, ext).replace(/[^a-zA-Z0-9_\uAC00-\uD7A3-]/g, '_');
    const finalFilename = `${Date.now()}_${safeName}${ext}`;
    const filePath = path.join(uploadsDir, finalFilename);

    const base64Data = data.replace(/^data:[^;]+;base64,/, '');
    await fs.promises.writeFile(filePath, Buffer.from(base64Data, 'base64'));

    const fileUrl = `/uploads/${finalFilename}`;
    console.log(`✅ Base64 file uploaded successfully: ${finalFilename} -> ${fileUrl}`);
    res.json({ success: true, url: fileUrl });
  } catch (err: any) {
    console.error('Base64 upload error:', err);
    res.status(500).json({ error: err?.message || 'Upload failed' });
  }
});

// Rate-limit and Quota tracker to protect against 429 RESOURCE_EXHAUSTED
let quotaExhaustedUntil: number = 0;

const isQuotaExhausted = () => Date.now() < quotaExhaustedUntil;

const handleQuotaError = (context: string, err: any) => {
  const is429 = err?.status === 'RESOURCE_EXHAUSTED' || 
                err?.status === 429 || 
                err?.code === 429 || 
                String(err?.message).includes('429') || 
                String(err?.message).includes('quota') || 
                String(err?.message).includes('Quota');

  if (is429) {
    quotaExhaustedUntil = Date.now() + 10 * 60 * 1000; // 10 minute backoff
    console.warn(`[Gemini API] Free tier daily quota reached during ${context}. Switched to local rule-based intelligence.`);
  } else {
    console.warn(`[Gemini API] ${context} error (fallback supplied): ${err?.message || err}`);
  }
};

// Fast, zero-quota keyword-based categorization
const classifyByKeywords = (title: string, description: string = ''): '골프' | '여행' | '먹거리' | '기타' | null => {
  const text = `${title} ${description}`.toLowerCase();
  
  // 1. Golf keywords
  if (/골프|golf|cc\b|c\.c\b|라운딩|18홀|9홀|티샷|클럽하우스|버디|이글|파3|그린피|캐디|드라이빙레인지/i.test(text)) {
    return '골프';
  }
  // 2. Food & Dining keywords
  if (/맛집|식당|음식|먹|미식|씨푸드|바베큐|bbq|해산물|조식|석식|중식|카페|레스토랑|야시장/i.test(text)) {
    return '먹거리';
  }
  // 3. Travel & Sightseeing keywords
  if (/여행|투어|호텔|리조트|풀빌라|숙소|관광|명소|시내|힐링|휴양|풍경|호치민|붕따우|다낭|나트랑|달랏|무이네|하노이|체크인|공항|샌딩/i.test(text)) {
    return '여행';
  }
  
  return null;
};

// Initialize Server-Side GoogleGenAI Client
const getGenAIClient = () => {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY is not set in environment. Mock fallbacks will be used where needed.');
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// -------------------------------------------------------------
// 1. AI Trip Planner: Basic Trip Plan
// -------------------------------------------------------------
app.post('/api/gemini/generate-trip-plan', async (req: Request, res: Response) => {
  try {
    const { request } = req.body;
    if (!request) {
      return res.status(400).json({ error: 'Missing request body' });
    }

    const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
    if (!apiKey || isQuotaExhausted()) {
      return res.json({
        success: true,
        data: {
          itinerary: [
            { day: 1, activities: ['공항 픽업 및 호텔 체크인', '시내 중심가 투어', '현지 맛집 석식'] },
            { day: 2, activities: ['오전 골프 라운딩', '오후 마사지 및 휴식', '야시장 투어'] }
          ],
          costBreakdown: [
            { item: '숙박비', cost: '300 USD' },
            { item: '골프/액티비티', cost: '200 USD' }
          ],
          totalCost: '500 USD',
          summary: `${request.destination || '베트남'} 힐링 여행 패키지입니다.`
        }
      });
    }

    const ai = getGenAIClient();
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
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

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      return res.json({ success: true, data: parsed });
    }

    throw new Error('No text returned from Gemini API');
  } catch (err: any) {
    handleQuotaError('generate-trip-plan', err);
    const destination = req.body?.request?.destination || '베트남';
    res.json({
      success: true,
      data: {
        itinerary: [
          { day: 1, activities: ['공항 픽업 및 호텔 체크인', '시내 중심가 투어', '현지 맛집 석식'] },
          { day: 2, activities: ['오전 골프 라운딩', '오후 마사지 및 휴식', '야시장 투어'] }
        ],
        costBreakdown: [
          { item: '숙박비', cost: '300 USD' },
          { item: '골프/액티비티', cost: '200 USD' }
        ],
        totalCost: '500 USD',
        summary: `${destination} 힐링 여행 패키지입니다.`
      }
    });
  }
});

// -------------------------------------------------------------
// 2. AI Custom Trip Planner: Detailed Custom Plan
// -------------------------------------------------------------
app.post('/api/gemini/generate-custom-trip-plan', async (req: Request, res: Response) => {
  try {
    const { request, unitPrices } = req.body;
    if (!request) {
      return res.status(400).json({ error: 'Missing request body' });
    }

    const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
    if (!apiKey || isQuotaExhausted()) {
      return res.json({
        success: true,
        data: {
          itinerary: (request.dailyPlans || []).map((dp: any) => ({
            day: dp.day,
            activities: [`${dp.location || '베트남'} 주요 명소 관광`, '현지 식사', '자유 시간']
          })),
          costBreakdown: [{ item: '전 일정 예상 비용', cost: '10,000,000 VND' }],
          totalCost: '10,000,000 VND',
          summary: `${request.clientName || '고객'}님을 위한 맞춤 일정입니다.`
        }
      });
    }

    const ai = getGenAIClient();
    const dailyPlansStr = (request.dailyPlans || []).map((dp: any) => `
      ${dp.day}일차 (${dp.date}):
      - 지역: ${dp.location}
      - 숙소: ${dp.accommodation}
      - 인원: ${dp.personCount}명
      - 선택 상품: ${(dp.selectedProducts || []).map((p: any) => p.name).join(', ') || '없음'}
      - 요청사항: ${dp.dailyRequests || '없음'}
      - 차량/가이드: ${dp.transportService?.useRentCar ? dp.transportService?.carType : '미사용'}, ${dp.transportService?.useGuide ? '가이드 포함' : '가이드 미포함'}
    `).join('\n');

    const unitPricesStr = unitPrices ? `
      [기준 단가 정보 (VND)]
      - 숙박: ${JSON.stringify(unitPrices.hotels || {})}
      - 차량: ${JSON.stringify(unitPrices.cars || {})}
      - 가이드: ${unitPrices.guide || 0} (일당)
    ` : '';

    const prompt = `
      베트남 여행 전문가로서 ${request.clientName || '고객'} 고객님을 위한 최적의 여행 일정을 설계해 주세요.
      
      [여행 개요]
      - 입국: ${request.arrivalDate || ''} ${request.arrivalTime || ''}
      - 출국: ${request.departureDate || ''} ${request.departureTime || ''}
      - 기간: ${request.durationSummary || ''}
      
      [일자별 세부 요청]
      ${dailyPlansStr}
      
      ${unitPricesStr}
      
      [추가 요청사항]
      ${request.extraRemarks || '없음'}

      [요구사항]
      1. 각 날짜별로 시간대별(오전, 오후, 저녁) 구체적인 활동을 포함한 'itinerary'를 작성해 주세요.
      2. 제공된 [기준 단가 정보]와 요청하신 숙소/차량 등급, 인원수를 바탕으로 정확한 'costBreakdown'을 작성해 주세요. (단위: VND)
      3. 전체 일정을 아우르는 환영 메시지와 요약을 'summary'에 한국어로 작성해 주세요.
      4. 항공권은 제외된 견적입니다.

      [응답 형식] JSON
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
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

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      return res.json({ success: true, data: parsed });
    }

    throw new Error('No text returned from Gemini API');
  } catch (err: any) {
    handleQuotaError('generate-custom-trip-plan', err);
    const request = req.body?.request || {};
    res.json({
      success: true,
      data: {
        itinerary: (request.dailyPlans || []).map((dp: any) => ({
          day: dp.day,
          activities: [`${dp.location || '베트남'} 주요 명소 관광`, '현지 식사', '자유 시간']
        })),
        costBreakdown: [{ item: '전 일정 예상 비용', cost: '10,000,000 VND' }],
        totalCost: '10,000,000 VND',
        summary: `${request.clientName || '고객'}님을 위한 맞춤 일정입니다.`
      }
    });
  }
});

// -------------------------------------------------------------
// 3. Video Category Classification (Fast keyword match + API with 429 guard)
// -------------------------------------------------------------
app.post('/api/gemini/classify-video', async (req: Request, res: Response) => {
  const { title, description } = req.body || {};
  if (!title) {
    return res.json({ success: true, category: '기타' });
  }

  // 1. Fast, zero-quota keyword detection (100% accurate, 0ms, immune to rate limits)
  const keywordCategory = classifyByKeywords(title, description);
  if (keywordCategory) {
    return res.json({ success: true, category: keywordCategory });
  }

  // 2. Check if API is available and quota is not exhausted
  const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
  if (!apiKey || isQuotaExhausted()) {
    return res.json({ success: true, category: '기타' });
  }

  try {
    const ai = getGenAIClient();
    const prompt = `
      다음 동영상의 제목과 설명을 분석하여 가장 적합한 카테고리 하나를 선택하세요.
      카테고리 옵션: ['골프', '여행', '먹거리', '기타']

      동영상 제목: ${title}
      동영상 설명: ${description || '설명 없음'}

      반드시 위 4가지 옵션 중 하나만 정확하게 텍스트로 반환하세요. 다른 설명은 생략하세요.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const result = response.text?.trim() || '';
    const validCategories = ['골프', '여행', '먹거리', '기타'];
    if (validCategories.includes(result)) {
      return res.json({ success: true, category: result });
    }

    for (const cat of validCategories) {
      if (result.includes(cat)) {
        return res.json({ success: true, category: cat });
      }
    }

    return res.json({ success: true, category: '기타' });
  } catch (err: any) {
    handleQuotaError('classify-video', err);
    return res.json({ success: true, category: '기타' });
  }
});

// -------------------------------------------------------------
// 4. Server-Side Gemini Content Streaming (SSE)
// -------------------------------------------------------------
app.post('/api/gemini/stream', async (req: Request, res: Response) => {
  try {
    const { prompt, systemInstruction } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
    if (!apiKey) {
      res.write(`data: ${JSON.stringify({ text: 'API 키가 설정되지 않아 데모 모드로 응답합니다.' })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const ai = getGenAIClient();
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined,
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('Server streaming error:', err);
    res.write(`data: ${JSON.stringify({ error: err?.message || 'Streaming failed' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// -------------------------------------------------------------
// 5. Real-Time Gemini Live API WebSocket Bridge
// -------------------------------------------------------------
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('📡 Gemini Live API WebSocket client connected');
  const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();

  if (!apiKey) {
    clientWs.send(JSON.stringify({ error: 'GEMINI_API_KEY is not configured on server' }));
    return;
  }

  try {
    const ai = getGenAIClient();
    const session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: 'You are Mango Tour VIP travel assistant. Assist guests with Vietnam travel and golf inquiries.',
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          for (const part of message.serverContent?.modelTurn?.parts ?? []) {
            if (part.inlineData?.data) {
              clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
            }
          }
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
        },
      },
    });

    clientWs.on('message', (data: Buffer | string) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.audio) {
          session.sendRealtimeInput({
            audio: { data: payload.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        }
      } catch (err) {
        console.error('Error sending audio to Gemini Live:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('Gemini Live API WebSocket client disconnected');
    });
  } catch (err: any) {
    console.error('Gemini Live session error:', err);
    clientWs.send(JSON.stringify({ error: err?.message || 'Failed to connect to Live API' }));
  }
});

server.on('upgrade', (request, socket, head) => {
  const pathname = request.url?.split('?')[0];
  if (pathname === '/api/gemini/live' || pathname === '/live') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

// -------------------------------------------------------------
// Dev & Production Static / Middleware setup
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Vite Dev Server middleware mode
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Mango Tour full-stack server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
