import { supabaseService } from './supabaseService';

export interface QuotationCostItemPayload {
  category: string;
  detail: string;
  quantity: string;
  amountUSD?: number;
  amountKRW?: number;
}

export interface SubmitQuotationWithPdfInput {
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
  costItems?: QuotationCostItemPayload[];
  pdfFileName: string;
  pdfBase64: string;
  inquiryBackupData?: Record<string, unknown>;
}

export interface SubmitQuotationWithPdfResult {
  success: boolean;
  submittedAt: string;
  pdfFileName: string;
  pdfDownloadUrl: string;
  storageProvider: 'supabase_storage' | 'server_local';
  email: {
    sent: boolean;
    provider: 'smtp' | 'unconfigured';
    recipient?: string;
    reason?: string;
  };
}

export function extractReadableErrorMessage(
  source: unknown,
  fallback = '견적서 PDF 전송 중 오류가 발생했습니다.'
): string {
  if (typeof source === 'string') {
    const trimmed = source.trim();
    if (!trimmed || trimmed === '[object Object]') return fallback;
    // Strip HTML tags if a proxy/gateway returned an HTML error page
    if (/^\s*</.test(trimmed)) {
      const stripped = trimmed.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return stripped ? stripped.slice(0, 260) : fallback;
    }
    return trimmed;
  }

  if (source instanceof Error) {
    const msg = (source.message || '').trim();
    if (msg && msg !== '[object Object]') {
      return msg;
    }
  }

  if (source && typeof source === 'object') {
    const obj = source as Record<string, unknown>;

    // Handle nested Vercel/API error shapes such as { error: { code, message } } or { error: "..." }
    if (obj.error !== undefined && obj.error !== null && obj.error !== source) {
      const nested = extractReadableErrorMessage(obj.error, '');
      if (nested) return nested;
    }

    const directMessage =
      (typeof obj.message === 'string' && obj.message.trim()) ||
      (typeof obj.msg === 'string' && obj.msg.trim()) ||
      (typeof obj.reason === 'string' && obj.reason.trim()) ||
      (typeof obj.details === 'string' && obj.details.trim()) ||
      (typeof obj.statusMessage === 'string' && obj.statusMessage.trim());

    if (directMessage && directMessage !== '[object Object]') {
      const code =
        typeof obj.code === 'string' && obj.code.trim()
          ? `[${obj.code.trim()}] `
          : typeof obj.code === 'number'
          ? `[${obj.code}] `
          : '';
      return `${code}${directMessage}`;
    }

    try {
      const serialized = JSON.stringify(obj);
      if (serialized && serialized !== '{}') {
        return serialized;
      }
    } catch {
      // ignore circular JSON
    }
  }

  return fallback;
}

export async function submitQuotationWithPdf(
  input: SubmitQuotationWithPdfInput
): Promise<SubmitQuotationWithPdfResult> {
  const response = await fetch('/api/quotations/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      customerName: input.customerName,
      customerContact: input.customerContact,
      personCount: input.personCount,
      departureDate: input.departureDate,
      customerNotes: input.customerNotes || '',
      productTitle: input.productTitle,
      region: input.region,
      duration: input.duration,
      totalPriceUSD: input.totalPriceUSD,
      totalPriceKRW: input.totalPriceKRW,
      perPersonUSD: input.perPersonUSD,
      summaryText: input.summaryText,
      costItems: input.costItems || [],
      pdfFileName: input.pdfFileName,
      pdfBase64: input.pdfBase64,
    }),
  });

  const rawText = await response.text().catch(() => '');
  let parsed: unknown = null;
  if (rawText.trim()) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = rawText;
    }
  }

  const result =
    parsed && typeof parsed === 'object'
      ? (parsed as SubmitQuotationWithPdfResult & { error?: unknown; message?: unknown })
      : null;

  if (!response.ok || !result?.success) {
    const fallbackMsg = `견적서 PDF 전송에 실패했습니다. (HTTP ${response.status})`;
    const detailedError = extractReadableErrorMessage(parsed ?? rawText, fallbackMsg);
    throw new Error(detailedError || fallbackMsg);
  }

  // Non-blocking backup save to Supabase Database including PDF download URL
  try {
    await supabaseService.saveInquiry({
      ...(input.inquiryBackupData || {}),
      PDF_파일명: result.pdfFileName,
      PDF_다운로드_URL: result.pdfDownloadUrl,
      스토리지: result.storageProvider,
      메일발송상태: result.email?.sent
        ? `발송완료(${result.email.provider})`
        : `대기(${result.email?.provider || 'unconfigured'})`,
      접수일시: result.submittedAt,
    });
  } catch (dbErr) {
    console.warn('Supabase inquiry backup skipped:', dbErr);
  }

  return result;
}
