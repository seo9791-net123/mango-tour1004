import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

export interface QuotationEmailItem {
  category: string;
  detail: string;
  quantity: string;
  amountUSD?: number;
  amountKRW?: number;
}

export interface SubmitQuotationInput {
  customerName: string;
  customerContact: string;
  personCount: number;
  departureDate: string;
  customerNotes?: string;
  productTitle: string;
  region: string;
  duration: string;
  totalPriceUSD: number;
  totalPriceKRW: number;
  perPersonUSD: number;
  summaryText: string;
  costItems?: QuotationEmailItem[];
  pdfFileName: string;
  pdfBase64: string;
  publicBaseUrl?: string;
}

export interface QuotationStorageResult {
  provider: 'supabase_storage' | 'server_local';
  pdfDownloadUrl: string;
  storagePath: string;
}

export interface QuotationEmailResult {
  sent: boolean;
  provider: 'smtp' | 'unconfigured';
  recipient?: string;
  reason?: string;
}

const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15 MB

const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const sanitizePdfFileName = (rawName?: string, customerName?: string): string => {
  const safeCustomer = (customerName || '고객')
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

export const decodeAndValidatePdfBase64 = (pdfBase64: string): Buffer => {
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

  // Verify %PDF- file signature
  const header = buffer.subarray(0, 5).toString('ascii');
  if (header !== '%PDF-') {
    throw new Error('올바른 PDF 형식의 파일이 아닙니다.');
  }

  return buffer;
};

/**
 * 1. 생성된 A4 견적서 PDF를 Supabase Storage(우선) 또는 서버 저장소에 업로드하고 고유 다운로드 URL 생성
 */
export async function uploadQuotationPdfToStorage(params: {
  pdfBuffer: Buffer;
  pdfFileName: string;
  quotationsDir: string;
  publicBaseUrl?: string;
}): Promise<QuotationStorageResult> {
  const { pdfBuffer, pdfFileName, quotationsDir, publicBaseUrl } = params;
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const bucketName = (process.env.SUPABASE_QUOTATION_BUCKET || 'quotations').trim() || 'quotations';

  const dateFolder = new Date().toISOString().split('T')[0];
  const uniqueId = crypto.randomBytes(6).toString('hex');
  const asciiSafeSlug = pdfFileName.replace(/[^a-zA-Z0-9._\-]/g, '_') || 'mango_quotation.pdf';
  const objectPath = `${dateFolder}/${Date.now()}_${uniqueId}_${asciiSafeSlug}`;

  const uploadKey = supabaseServiceKey || supabaseAnonKey;
  if (supabaseUrl && uploadKey && supabaseUrl.startsWith('https://')) {
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

      // If bucket doesn't exist yet and service role key is present, auto-provision bucket once
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

      if (!uploadRes.error) {
        // Generate signed URL first (works even for private buckets) or public URL
        const { data: signedData } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(objectPath, 60 * 60 * 24 * 14, { download: pdfFileName });

        if (signedData?.signedUrl) {
          return {
            provider: 'supabase_storage',
            pdfDownloadUrl: signedData.signedUrl,
            storagePath: `${bucketName}/${objectPath}`,
          };
        }

        const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(objectPath);
        if (publicData?.publicUrl) {
          return {
            provider: 'supabase_storage',
            pdfDownloadUrl: publicData.publicUrl,
            storagePath: `${bucketName}/${objectPath}`,
          };
        }
      } else {
        console.warn('[Quotation Storage] Supabase Storage upload fallback to server disk:', uploadRes.error.message);
      }
    } catch (err: any) {
      console.warn('[Quotation Storage] Supabase Storage exception fallback:', err?.message || err);
    }
  }

  // Fallback: save to confined server directory under public/uploads/quotations
  if (!fs.existsSync(quotationsDir)) {
    fs.mkdirSync(quotationsDir, { recursive: true });
  }

  const storedFileName = `${Date.now()}_${uniqueId}.pdf`;
  const resolvedBase = path.resolve(quotationsDir);
  const resolvedTarget = path.resolve(resolvedBase, storedFileName);
  if (!resolvedTarget.startsWith(resolvedBase + path.sep)) {
    throw new Error('허용되지 않은 파일 저장 경로입니다.');
  }

  await fs.promises.writeFile(resolvedTarget, pdfBuffer);

  const relativePath = `/uploads/quotations/${storedFileName}`;
  const cleanOrigin = (process.env.PUBLIC_BASE_URL || publicBaseUrl || '').trim().replace(/\/+$/, '');
  const fullUrl = cleanOrigin ? `${cleanOrigin}${relativePath}` : relativePath;

  return {
    provider: 'server_local',
    pdfDownloadUrl: fullUrl,
    storagePath: relativePath,
  };
}

const resolveSmtpHost = (rawHost?: string): string => {
  const trimmed = (rawHost || '').trim();
  if (!trimmed) return 'smtp.gmail.com';

  // If an email address was mistakenly placed in SMTP_HOST (e.g. seo9791@gmail.com), use Gmail SMTP host
  if (trimmed.includes('@')) {
    console.warn(`[Quotation Email] SMTP_HOST("${trimmed}")에 이메일 형식이 입력되어 smtp.gmail.com으로 자동 보정합니다.`);
    return 'smtp.gmail.com';
  }

  // Strip accidental URL schemes or stray "://" prefixes (e.g. "smtp://gmail.com", "://gmail.com") and trailing paths/ports
  const stripped = trimmed
    .replace(/^[a-z0-9+.-]*:\/\//i, '')
    .replace(/^\/+/, '')
    .split('/')[0]
    .split(':')[0]
    .trim()
    .toLowerCase();

  if (!stripped || /\s/.test(stripped) || !stripped.includes('.')) {
    console.warn(`[Quotation Email] 유효하지 않은 SMTP_HOST("${trimmed}")가 입력되어 smtp.gmail.com으로 자동 보정합니다.`);
    return 'smtp.gmail.com';
  }

  if (stripped === 'gmail.com' || stripped === 'www.gmail.com' || stripped === 'mail.google.com') {
    console.warn(`[Quotation Email] SMTP_HOST("${trimmed}")를 Gmail SMTP 서버(smtp.gmail.com)로 자동 보정합니다.`);
    return 'smtp.gmail.com';
  }

  return stripped;
};

/**
 * 2. 생성된 A4 견적서 PDF를 관리자 이메일로 자동 첨부 발송
 */
export async function sendAdminQuotationEmail(params: {
  input: SubmitQuotationInput;
  pdfBuffer: Buffer;
  pdfFileName: string;
  pdfDownloadUrl: string;
  submittedAt: string;
}): Promise<QuotationEmailResult> {
  const { input, pdfBuffer, pdfFileName, pdfDownloadUrl, submittedAt } = params;

  const smtpUser = (process.env.SMTP_USER || '').trim();
  // Strip accidental spaces from Google 16-char App Password (e.g. "abcd efgh ijkl mnop")
  const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const smtpHost = resolveSmtpHost(process.env.SMTP_HOST);
  const parsedPort = Number((process.env.SMTP_PORT || '').trim());
  const smtpPort = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 465;
  const smtpSecure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE.trim().toLowerCase() === 'true'
    : smtpPort === 465;

  const adminEmail = (process.env.ADMIN_EMAIL || smtpUser || '').trim();

  const subject = `[MANGO TOUR 견적신청] ${input.customerName}님의 정식 A4 견적서 (${input.region} · ${input.duration})`;

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: #111827; max-width: 640px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: #0A7E54; color: #ffffff; padding: 20px 24px;">
        <div style="font-size: 12px; font-weight: 700; opacity: 0.9;">MANGO TOUR 1:1 온라인 견적 접수</div>
        <h2 style="margin: 6px 0 0; font-size: 20px;">${escapeHtml(input.customerName)}님의 맞춤 견적서 PDF가 도착했습니다</h2>
      </div>
      <div style="padding: 20px 24px; font-size: 14px; line-height: 1.6;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <tr><td style="padding: 6px 0; color: #6b7280; width: 130px;">예약자 성함</td><td style="padding: 6px 0; font-weight: 700;">${escapeHtml(input.customerName)}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">연락처 / 카톡 ID</td><td style="padding: 6px 0; font-weight: 700;">${escapeHtml(input.customerContact)}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">상품명</td><td style="padding: 6px 0; font-weight: 700;">${escapeHtml(input.productTitle)}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">지역 / 일정</td><td style="padding: 6px 0;">${escapeHtml(input.region)} · ${escapeHtml(input.duration)} (출발일: ${escapeHtml(input.departureDate || '미정')})</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">인원 / 총 견적</td><td style="padding: 6px 0; font-weight: 700; color: #0A7E54;">${Number(input.personCount)}명 · $${Number(input.totalPriceUSD).toLocaleString()} USD (약 ${Number(input.totalPriceKRW).toLocaleString()}원)</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">추가 요청사항</td><td style="padding: 6px 0;">${escapeHtml(input.customerNotes || '없음')}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b7280;">접수 일시</td><td style="padding: 6px 0;">${escapeHtml(submittedAt)}</td></tr>
        </table>
        <div style="padding: 12px 14px; background: #ECFDF5; border-radius: 8px; margin-bottom: 16px;">
          <div style="font-size: 12px; color: #065f46; font-weight: 700; margin-bottom: 4px;">첨부 파일: ${escapeHtml(pdfFileName)}</div>
          ${pdfDownloadUrl.startsWith('http') ? `<a href="${escapeHtml(pdfDownloadUrl)}" style="color: #0A7E54; font-weight: 700; font-size: 13px;">견적서 PDF 다운로드 링크 열기 →</a>` : ''}
        </div>
        <pre style="white-space: pre-wrap; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; font-size: 12px; color: #374151;">${escapeHtml(input.summaryText)}</pre>
      </div>
    </div>
  `;

  // Gmail SMTP with PDF attachment
  if (smtpHost && smtpUser && smtpPass && adminEmail) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const fromHeader = (process.env.SMTP_FROM || `MANGO TOUR <${smtpUser}>`).trim();

    try {
      await transporter.sendMail({
        from: fromHeader,
        to: adminEmail,
        subject,
        text: `${input.summaryText}\n\n[PDF 다운로드 링크]\n${pdfDownloadUrl}`,
        html: htmlBody,
        attachments: [
          {
            filename: pdfFileName,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
    } catch (mailErr: any) {
      const code = String(mailErr?.code || '');
      const msg = String(mailErr?.message || mailErr || '');
      if (code === 'EAUTH' || /535|Invalid login|Username and Password not accepted/i.test(msg)) {
        throw new Error('Gmail SMTP 인증에 실패했습니다. SMTP_USER(Gmail 주소)와 SMTP_PASS(구글 앱 비밀번호 16자리)를 확인해주세요.');
      }
      throw mailErr;
    }

    return {
      sent: true,
      provider: 'smtp',
      recipient: adminEmail,
    };
  }

  console.warn(
    '⚠️ [Quotation Email] Gmail SMTP(SMTP_USER/SMTP_PASS)가 .env에 설정되지 않아 관리자 메일 첨부 발송이 대기 상태입니다.'
  );
  return {
    sent: false,
    provider: 'unconfigured',
    reason: 'SMTP_USER 또는 SMTP_PASS 환경변수가 설정되지 않았습니다.',
  };
}

/**
 * 견적 신청 통합 처리: PDF 검증 -> Storage 업로드 -> Gmail SMTP 관리자 이메일 첨부 발송
 */
export async function handleQuotationSubmission(
  input: SubmitQuotationInput,
  quotationsDir: string
) {
  const customerName = (input.customerName || '').trim();
  const customerContact = (input.customerContact || '').trim();
  if (!customerName || !customerContact) {
    throw new Error('예약자 성함과 연락처(또는 카카오톡 ID)를 입력해주세요.');
  }

  const pdfFileName = sanitizePdfFileName(input.pdfFileName, customerName);
  const pdfBuffer = decodeAndValidatePdfBase64(input.pdfBase64);
  const submittedAt = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  // 1. Storage 업로드 및 다운로드 URL 생성
  const storage = await uploadQuotationPdfToStorage({
    pdfBuffer,
    pdfFileName,
    quotationsDir,
    publicBaseUrl: input.publicBaseUrl,
  });

  // 2. Gmail SMTP 관리자 이메일 PDF 첨부 발송
  const email = await sendAdminQuotationEmail({
    input: {
      ...input,
      customerName,
      customerContact,
    },
    pdfBuffer,
    pdfFileName,
    pdfDownloadUrl: storage.pdfDownloadUrl,
    submittedAt,
  });

  return {
    success: true,
    submittedAt,
    pdfFileName,
    pdfDownloadUrl: storage.pdfDownloadUrl,
    storageProvider: storage.provider,
    email,
  };
}
