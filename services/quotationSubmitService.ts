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

  const result = (await response.json().catch(() => null)) as
    | (SubmitQuotationWithPdfResult & { error?: string })
    | null;

  if (!response.ok || !result?.success) {
    throw new Error(
      result?.error || `견적서 PDF 전송에 실패했습니다. (HTTP ${response.status})`
    );
  }

  // Non-blocking backup save to Supabase Database including PDF download URL
  try {
    await supabaseService.saveInquiry({
      ...(input.inquiryBackupData || {}),
      PDF_파일명: result.pdfFileName,
      PDF_다운로드_URL: result.pdfDownloadUrl,
      스토리지: result.storageProvider,
      메일발송상태: result.email?.sent ? `발송완료(${result.email.provider})` : `대기(${result.email?.provider || 'unconfigured'})`,
      접수일시: result.submittedAt,
    });
  } catch (dbErr) {
    console.warn('Supabase inquiry backup skipped:', dbErr);
  }

  return result;
}
