import type { IncomingMessage, ServerResponse } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { handleQuotationSubmission } from '../../server/quotationNotificationService';

interface VercelLikeRequest extends IncomingMessage {
  body?: unknown;
  query?: Record<string, string | string[]>;
}

interface VercelLikeResponse extends ServerResponse {
  status?: (statusCode: number) => VercelLikeResponse;
  json?: (body: unknown) => VercelLikeResponse | void;
}

const sendJson = (res: VercelLikeResponse, statusCode: number, payload: unknown) => {
  if (typeof res.status === 'function') {
    const withStatus = res.status(statusCode);
    if (typeof withStatus?.json === 'function') {
      withStatus.json(payload);
      return;
    }
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const readJsonBody = async (req: VercelLikeRequest): Promise<Record<string, unknown>> => {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      return req.body.trim() ? (JSON.parse(req.body) as Record<string, unknown>) : {};
    }
    if (Buffer.isBuffer(req.body)) {
      const text = req.body.toString('utf8').trim();
      return text ? (JSON.parse(text) as Record<string, unknown>) : {};
    }
    if (typeof req.body === 'object') {
      return req.body as Record<string, unknown>;
    }
  }

  const chunks: Buffer[] = [];
  let totalBytes = 0;
  const maxBytes = 10 * 1024 * 1024;

  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buf.length;
    if (totalBytes > maxBytes) {
      throw new Error('요청 파일 크기가 허용 한도를 초과했습니다.');
    }
    chunks.push(buf);
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, unknown>;
};

export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, {
      success: false,
      error: 'Method Not Allowed. POST 요청만 지원합니다.',
    });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const forwardedProto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
    const hostHeader = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
    const publicBaseUrl = hostHeader ? `${forwardedProto}://${hostHeader}` : '';

    // Vercel serverless filesystem is read-only outside /tmp
    const quotationsDir = path.join(os.tmpdir(), 'mango-quotations');

    const result = await handleQuotationSubmission(
      {
        customerName: String(body.customerName || ''),
        customerContact: String(body.customerContact || ''),
        personCount: Number(body.personCount) || 1,
        departureDate: String(body.departureDate || ''),
        customerNotes: String(body.customerNotes || ''),
        productTitle: String(body.productTitle || ''),
        region: String(body.region || ''),
        duration: String(body.duration || ''),
        totalPriceUSD: Number(body.totalPriceUSD) || 0,
        totalPriceKRW: Number(body.totalPriceKRW) || 0,
        perPersonUSD: Number(body.perPersonUSD) || 0,
        summaryText: String(body.summaryText || ''),
        costItems: Array.isArray(body.costItems) ? (body.costItems as any[]) : [],
        pdfFileName: String(body.pdfFileName || ''),
        pdfBase64: String(body.pdfBase64 || ''),
        publicBaseUrl,
      },
      quotationsDir
    );

    sendJson(res, 200, result);
  } catch (err: unknown) {
    console.error('Vercel quotation submit error:', err);
    const message = err instanceof Error ? err.message : '견적서 PDF 전송 중 오류가 발생했습니다.';
    const status = /누락|입력해주세요|형식|크기|초과/.test(message) ? 400 : 500;
    sendJson(res, status, {
      success: false,
      error: message,
    });
  }
}
