import type { IncomingMessage, ServerResponse } from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

interface VercelLikeRequest extends IncomingMessage {
  body?: unknown;
  query?: Record<string, string | string[]>;
}

interface VercelLikeResponse extends ServerResponse {
  status?: (statusCode: number) => VercelLikeResponse;
  json?: (body: unknown) => VercelLikeResponse | void;
}

interface QuotationCostItem {
  category: string;
  detail: string;
  quantity: string;
  amountUSD?: number;
  amountKRW?: number;
}

const MAX_PDF_BYTES = 15 * 1024 * 1024;

const formatErrorToString = (err: unknown, fallback = '알 수 없는 서버 오류가 발생했습니다.'): string => {
  if (typeof err === 'string') {
    const trimmed = err.trim();
    return trimmed && trimmed !== '[object Object]' ? trimmed : fallback;
  }
  if (err instanceof Error) {
    const msg = (err.message || '').trim();
    if (msg && msg !== '[object Object]') {
      return msg;
    }
  }
  if (err && typeof err === 'object') {
    const rec = err as Record<string, unknown>;
    const candidate =
      (typeof rec.message === 'string' && rec.message.trim()) ||
      (typeof rec.error === 'string' && rec.error.trim()) ||
      (typeof rec.reason === 'string' && rec.reason.trim()) ||
      (typeof rec.details === 'string' && rec.details.trim());
    if (candidate && candidate !== '[object Object]') {
      const code = typeof rec.code === 'string' && rec.code.trim() ? `[${rec.code.trim()}] ` : '';
      return `${code}${candidate}`;
    }
    try {
      const serialized = JSON.stringify(rec);
      if (serialized && serialized !== '{}') return serialized;
    } catch {
      // ignore circular JSON errors
    }
  }
  return fallback;
};

const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sanitizePdfFileName = (rawName?: string, customerName?: string): string => {
  const safeCustomer =
    (customerName || '고객')
      .trim()
      .replace(/[^a-zA-Z0-9가-힣_\-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '') || '고객';

  const fallback = `망고투어_견적서_${safeCustomer}.pdf`;
  if (!rawName) return fallback;

  const base = path.basename(String(rawName).trim()).replace(/[^a-zA-Z0-9가-힣._\-]/g, '_');
  if (!base) return fallback;
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
};

const decodeAndValidatePdfBase64 = (pdfBase64: string): Buffer => {
  if (!pdfBase64 || typeof pdfBase64 !== 'string') {
    throw new Error('PDF 파일 데이터가 누락되었습니다.');
  }

  const normalized = pdfBase64.replace(/^data:application\/pdf(?:;[^;,]+)*;base64,/i, '').trim();
  if (!normalized) {
    throw new Error('유효한 PDF Base64 데이터가 아닙니다.');
  }

  const buffer = Buffer.from(normalized, 'base64');
  if (!buffer.length) {
    throw new Error('디코딩된 PDF 파일 크기가 0입니다.');
  }
  if (buffer.length > MAX_PDF_BYTES) {
    throw new Error('PDF 파일 크기가 제한(15MB)을 초과했습니다.');
  }

  const header = buffer.subarray(0, 5).toString('ascii');
  if (header !== '%PDF-') {
    throw new Error('올바른 PDF 형식의 파일이 아닙니다.');
  }

  return buffer;
};

const resolveSmtpHost = (rawHost?: string): string => {
  const trimmed = (rawHost || '').trim();
  if (!trimmed) return 'smtp.gmail.com';
  if (trimmed.includes('@')) return 'smtp.gmail.com';

  const stripped = trimmed
    .replace(/^[a-z0-9+.-]*:\/\//i, '')
    .replace(/^\/+/, '')
    .split('/')[0]
    .split(':')[0]
    .trim()
    .toLowerCase();

  if (!stripped || /\s/.test(stripped) || !stripped.includes('.')) {
    return 'smtp.gmail.com';
  }
  if (stripped === 'gmail.com' || stripped === 'www.gmail.com' || stripped === 'mail.google.com') {
    return 'smtp.gmail.com';
  }
  return stripped;
};

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
      throw new Error('요청 데이터 크기가 허용 한도를 초과했습니다.');
    }
    chunks.push(buf);
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error('요청 JSON 본문 형식이 올바르지 않습니다.');
  }
};

async function uploadToSupabaseStorage(params: {
  pdfBuffer: Buffer;
  pdfFileName: string;
}): Promise<{
  provider: 'supabase_storage' | 'server_local';
  pdfDownloadUrl: string;
  storageError?: string;
}> {
  const { pdfBuffer, pdfFileName } = params;
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const bucketName = (process.env.SUPABASE_QUOTATION_BUCKET || 'quotations').trim() || 'quotations';
  const uploadKey = supabaseServiceKey || supabaseAnonKey;

  if (!supabaseUrl || !uploadKey || !supabaseUrl.startsWith('https://')) {
    return {
      provider: 'server_local',
      pdfDownloadUrl: '',
      storageError: 'Supabase Storage 환경변수(SUPABASE_URL / KEY) 미설정으로 이메일 첨부만 진행됨',
    };
  }

  const dateFolder = new Date().toISOString().split('T')[0];
  const uniqueId = crypto.randomBytes(6).toString('hex');
  const asciiSafeSlug = pdfFileName.replace(/[^a-zA-Z0-9._\-]/g, '_') || 'mango_quotation.pdf';
  const objectPath = `${dateFolder}/${Date.now()}_${uniqueId}_${asciiSafeSlug}`;

  try {
    const supabase = createClient(supabaseUrl, uploadKey, {
      auth: { persistSession: false },
    });

    let uploadRes = await supabase.storage
      .from(bucketName)
      .upload(objectPath, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadRes.error && supabaseServiceKey && /bucket.*not found/i.test(uploadRes.error.message || '')) {
      await supabase.storage.createBucket(bucketName, { public: true }).catch(() => null);
      uploadRes = await supabase.storage
        .from(bucketName)
        .upload(objectPath, pdfBuffer, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false,
        });
    }

    if (uploadRes.error) {
      const errMsg = formatErrorToString(uploadRes.error, 'Supabase Storage 업로드 오류');
      console.warn('[Vercel Quotation Storage] Supabase upload error:', errMsg);
      return {
        provider: 'server_local',
        pdfDownloadUrl: '',
        storageError: `Supabase Storage 업로드 오류: ${errMsg}`,
      };
    }

    const { data: signedData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(objectPath, 60 * 60 * 24 * 14, { download: pdfFileName });

    if (signedData?.signedUrl) {
      return {
        provider: 'supabase_storage',
        pdfDownloadUrl: signedData.signedUrl,
      };
    }

    const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(objectPath);
    return {
      provider: 'supabase_storage',
      pdfDownloadUrl: publicData?.publicUrl || '',
    };
  } catch (err: unknown) {
    const errMsg = formatErrorToString(err, 'Supabase Storage 예외 발생');
    console.warn('[Vercel Quotation Storage] Exception:', errMsg);
    return {
      provider: 'server_local',
      pdfDownloadUrl: '',
      storageError: `Supabase Storage 오류: ${errMsg}`,
    };
  }
}

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
      error: '허용되지 않은 HTTP 메서드입니다. (POST 요청만 지원)',
    });
    return;
  }

  try {
    const body = await readJsonBody(req);

    const customerName = String(body.customerName || '').trim();
    const customerContact = String(body.customerContact || '').trim();
    if (!customerName || !customerContact) {
      sendJson(res, 400, {
        success: false,
        error: '예약자 성함과 연락처(또는 카카오톡 ID)를 입력해주세요.',
      });
      return;
    }

    const smtpUser = (process.env.SMTP_USER || '').trim();
    const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
    const smtpHost = resolveSmtpHost(process.env.SMTP_HOST);
    const parsedPort = Number((process.env.SMTP_PORT || '').trim());
    const smtpPort = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 465;
    const smtpSecure = process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE.trim().toLowerCase() === 'true'
      : smtpPort === 465;
    const adminEmail = (process.env.ADMIN_EMAIL || smtpUser || '').trim();

    const missingEnvVars: string[] = [];
    if (!smtpUser) missingEnvVars.push('SMTP_USER');
    if (!smtpPass) missingEnvVars.push('SMTP_PASS');
    if (!adminEmail) missingEnvVars.push('ADMIN_EMAIL');

    if (missingEnvVars.length > 0) {
      sendJson(res, 500, {
        success: false,
        error: `서버 환경변수가 누락되었습니다: ${missingEnvVars.join(', ')} (Vercel Environment Variables 설정을 확인해주세요.)`,
      });
      return;
    }

    const pdfFileName = sanitizePdfFileName(String(body.pdfFileName || ''), customerName);
    const pdfBuffer = decodeAndValidatePdfBase64(String(body.pdfBase64 || ''));
    const submittedAt = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    const personCount = Number(body.personCount) || 1;
    const departureDate = String(body.departureDate || '');
    const customerNotes = String(body.customerNotes || '');
    const productTitle = String(body.productTitle || '');
    const region = String(body.region || '');
    const duration = String(body.duration || '');
    const totalPriceUSD = Number(body.totalPriceUSD) || 0;
    const totalPriceKRW = Number(body.totalPriceKRW) || 0;
    const summaryText = String(body.summaryText || '');
    const _costItems = Array.isArray(body.costItems) ? (body.costItems as QuotationCostItem[]) : [];
    void _costItems;

    // 1. Supabase Storage PDF 업로드 (실패 시에도 이메일 PDF 첨부는 계속 진행)
    const storage = await uploadToSupabaseStorage({
      pdfBuffer,
      pdfFileName,
    });

    // 2. Gmail SMTP 관리자 이메일 PDF 첨부 발송
    const createTransportFn =
      (nodemailer as unknown as { default?: typeof nodemailer }).default?.createTransport ||
      nodemailer.createTransport;

    const transporter = createTransportFn({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 9000,
      greetingTimeout: 9000,
      socketTimeout: 12000,
    });

    const fromHeader = (process.env.SMTP_FROM || `MANGO TOUR <${smtpUser}>`).trim();
    const subject = `[MANGO TOUR 견적신청] ${customerName}님의 정식 A4 견적서 (${region} · ${duration})`;
    const pdfDownloadUrl = storage.pdfDownloadUrl;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: #111827; max-width: 640px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: #0A7E54; color: #ffffff; padding: 20px 24px;">
          <div style="font-size: 12px; font-weight: 700; opacity: 0.9;">MANGO TOUR 1:1 온라인 견적 접수</div>
          <h2 style="margin: 6px 0 0; font-size: 20px;">${escapeHtml(customerName)}님의 맞춤 견적서 PDF가 도착했습니다</h2>
        </div>
        <div style="padding: 20px 24px; font-size: 14px; line-height: 1.6;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <tr><td style="padding: 6px 0; color: #6b7280; width: 130px;">예약자 성함</td><td style="padding: 6px 0; font-weight: 700;">${escapeHtml(customerName)}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">연락처 / 카톡 ID</td><td style="padding: 6px 0; font-weight: 700;">${escapeHtml(customerContact)}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">상품명</td><td style="padding: 6px 0; font-weight: 700;">${escapeHtml(productTitle)}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">지역 / 일정</td><td style="padding: 6px 0;">${escapeHtml(region)} · ${escapeHtml(duration)} (출발일: ${escapeHtml(departureDate || '미정')})</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">인원 / 총 견적</td><td style="padding: 6px 0; font-weight: 700; color: #0A7E54;">${Number(personCount)}명 · $${Number(totalPriceUSD).toLocaleString()} USD (약 ${Number(totalPriceKRW).toLocaleString()}원)</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">추가 요청사항</td><td style="padding: 6px 0;">${escapeHtml(customerNotes || '없음')}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">접수 일시</td><td style="padding: 6px 0;">${escapeHtml(submittedAt)}</td></tr>
          </table>
          <div style="padding: 12px 14px; background: #ECFDF5; border-radius: 8px; margin-bottom: 16px;">
            <div style="font-size: 12px; color: #065f46; font-weight: 700; margin-bottom: 4px;">첨부 파일: ${escapeHtml(pdfFileName)}</div>
            ${pdfDownloadUrl.startsWith('http') ? `<a href="${escapeHtml(pdfDownloadUrl)}" style="color: #0A7E54; font-weight: 700; font-size: 13px;">견적서 PDF 다운로드 링크 열기 →</a>` : ''}
          </div>
          <pre style="white-space: pre-wrap; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; font-size: 12px; color: #374151;">${escapeHtml(summaryText)}</pre>
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: fromHeader,
        to: adminEmail,
        subject,
        text: pdfDownloadUrl
          ? `${summaryText}\n\n[PDF 다운로드 링크]\n${pdfDownloadUrl}`
          : summaryText,
        html: htmlBody,
        attachments: [
          {
            filename: pdfFileName,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
    } catch (mailErr: unknown) {
      const errObj = mailErr as { code?: unknown; responseCode?: unknown; command?: unknown } | null;
      const code = String(errObj?.code || errObj?.responseCode || '');
      const rawMailMsg = formatErrorToString(mailErr, 'SMTP 이메일 전송 오류');

      if (code === 'EAUTH' || /535|Invalid login|Username and Password not accepted/i.test(rawMailMsg)) {
        throw new Error(
          `Gmail SMTP 인증 실패(${code || 'EAUTH'}): SMTP_USER(${smtpUser})와 SMTP_PASS(구글 앱 비밀번호 16자리)를 확인해주세요. (${rawMailMsg})`
        );
      }
      if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND|ESOCKET/i.test(code) || /timeout|ENOTFOUND|ECONNREFUSED/i.test(rawMailMsg)) {
        throw new Error(
          `Gmail SMTP 서버 연결 실패(${smtpHost}:${smtpPort}): ${rawMailMsg}`
        );
      }
      throw new Error(`Gmail SMTP 발송 실패${code ? `(${code})` : ''}: ${rawMailMsg}`);
    }

    sendJson(res, 200, {
      success: true,
      submittedAt,
      pdfFileName,
      pdfDownloadUrl,
      storageProvider: storage.provider,
      storageWarning: storage.storageError,
      email: {
        sent: true,
        provider: 'smtp',
        recipient: adminEmail,
      },
    });
  } catch (err: unknown) {
    console.error('Vercel quotation submit error:', err);
    const message = formatErrorToString(err, '견적서 PDF 전송 중 서버 오류가 발생했습니다.');
    const status = /누락|입력해주세요|형식|크기|초과/.test(message) && !/환경변수/.test(message) ? 400 : 500;
    sendJson(res, status, {
      success: false,
      error: message,
    });
  }
}
