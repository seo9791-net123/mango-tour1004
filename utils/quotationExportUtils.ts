import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface CapturedQuotationResult {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const nextFrame = (win: Window = window) =>
  new Promise<void>((resolve) => {
    if (typeof win.requestAnimationFrame === 'function') {
      win.requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 16);
    }
  });

const waitForFontsWithTimeout = async (doc: Document, timeoutMs = 1200) => {
  try {
    const fonts = (doc as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts && typeof fonts.ready?.then === 'function') {
      await Promise.race([fonts.ready, delay(timeoutMs)]);
    }
  } catch {
    // Ignore font readiness failures
  }
};

const dataUrlToBlob = (dataUrl: string): Blob => {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(parts[1] || '');
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
};

const canvasToPngResult = async (canvas: HTMLCanvasElement): Promise<CapturedQuotationResult> => {
  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    throw new Error('견적서 영역의 크기가 0으로 계산되어 캡처할 수 없습니다.');
  }

  let dataUrl = '';
  try {
    dataUrl = canvas.toDataURL('image/png');
  } catch (err) {
    throw new Error(
      `이미지 데이터 변환에 실패했습니다 (보안/CORS 제한): ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!dataUrl || dataUrl === 'data:,') {
    throw new Error('빈 이미지가 생성되었습니다.');
  }

  const blob = await new Promise<Blob>((resolve) => {
    try {
      canvas.toBlob(
        (b) => {
          if (b && b.size > 0) {
            resolve(b);
          } else {
            resolve(dataUrlToBlob(dataUrl));
          }
        },
        'image/png'
      );
    } catch {
      resolve(dataUrlToBlob(dataUrl));
    }
  });

  return {
    dataUrl,
    blob,
    width: canvas.width,
    height: canvas.height,
  };
};

const sanitizeUnsupportedCssColors = (cssText: string): string => {
  if (!cssText) return cssText;
  return cssText
    .replace(/oklch\([^)]*\)/gi, '#374151')
    .replace(/oklab\([^)]*\)/gi, '#374151')
    .replace(/color-mix\([^;{}]*\)/gi, '#e5e7eb')
    .replace(/light-dark\([^)]*\)/gi, '#374151');
};

const captureSheetInIsolatedIframe = async (sheet: HTMLElement): Promise<CapturedQuotationResult> => {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.left = '0';
  iframe.style.top = '0';
  iframe.style.width = '794px';
  iframe.style.height = '1400px';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-9999';
  iframe.style.border = '0';
  iframe.style.visibility = 'visible';

  document.body.appendChild(iframe);

  try {
    const iframeWin = iframe.contentWindow;
    const iframeDoc = iframe.contentDocument || iframeWin?.document;
    if (!iframeDoc || !iframeWin) {
      throw new Error('캡처용 샌드박스 문서를 초기화할 수 없습니다.');
    }

    // Collect only safe external font stylesheets (e.g. Pretendard), never app Tailwind CSS with oklch()
    const fontLinks: string[] = [];
    document.querySelectorAll('link[rel="stylesheet"]').forEach((linkEl) => {
      const href = linkEl.getAttribute('href') || '';
      if (href.includes('pretendard') || href.includes('fonts.googleapis.com')) {
        fontLinks.push(`<link rel="stylesheet" crossorigin="anonymous" href="${href.replace(/"/g, '&quot;')}" />`);
      }
    });

    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  ${fontLinks.join('\n  ')}
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      font-family: "Pretendard", "Pretendard Variable", -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 794px !important;
      background-color: #ffffff !important;
      color: #111827 !important;
      line-height: 1.5;
      overflow: visible !important;
      -webkit-font-smoothing: antialiased;
    }
    h1, h2, h3, p {
      margin: 0;
    }
    table {
      border-collapse: collapse;
    }
  </style>
</head>
<body></body>
</html>`);
    iframeDoc.close();

    // Clone the pure inline-HEX A4 sheet into the clean iframe body
    const clonedSheet = iframeDoc.importNode(sheet, true) as HTMLElement;
    clonedSheet.removeAttribute('class');
    clonedSheet.style.position = 'static';
    clonedSheet.style.left = '0';
    clonedSheet.style.top = '0';
    clonedSheet.style.right = 'auto';
    clonedSheet.style.bottom = 'auto';
    clonedSheet.style.width = '794px';
    clonedSheet.style.minWidth = '794px';
    clonedSheet.style.maxWidth = '794px';
    clonedSheet.style.margin = '0';
    clonedSheet.style.boxSizing = 'border-box';
    clonedSheet.style.backgroundColor = '#ffffff';
    clonedSheet.style.color = '#111827';
    clonedSheet.style.visibility = 'visible';
    clonedSheet.style.opacity = '1';
    clonedSheet.style.display = 'block';
    clonedSheet.style.transform = 'none';
    clonedSheet.style.zIndex = '1';
    clonedSheet.style.pointerEvents = 'auto';

    // Guard any images inside cloned sheet against CORS taint or broken src
    clonedSheet.querySelectorAll('img').forEach((img) => {
      img.setAttribute('crossorigin', 'anonymous');
      if (!img.getAttribute('src')) {
        img.style.display = 'none';
      }
    });

    iframeDoc.body.appendChild(clonedSheet);

    await waitForFontsWithTimeout(iframeDoc, 1200);
    await nextFrame(iframeWin);
    await delay(40);

    const sheetHeight = Math.max(clonedSheet.scrollHeight, clonedSheet.offsetHeight, 100);
    iframe.style.height = `${sheetHeight + 40}px`;
    await nextFrame(iframeWin);

    // Prevent giant canvas OOM on mobile devices while preserving sharp 2x scale for normal lengths
    const scale = sheetHeight * 2 > 14000 ? Math.max(1, Math.floor((14000 / sheetHeight) * 10) / 10) : 2;

    const canvas = await html2canvas(clonedSheet, {
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width: 794,
      height: sheetHeight,
      windowWidth: 794,
      windowHeight: sheetHeight + 40,
      imageTimeout: 5000,
    });

    return await canvasToPngResult(canvas);
  } finally {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }
};

const captureFallbackElement = async (targetElement: HTMLElement): Promise<CapturedQuotationResult> => {
  await waitForFontsWithTimeout(document, 1200);
  await nextFrame(window);
  await delay(80);

  const canvas = await html2canvas(targetElement, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
    scrollX: 0,
    scrollY: 0,
    imageTimeout: 5000,
    onclone: (clonedDoc, clonedEl) => {
      // Strip oklch/oklab/color-mix from inline styles and <style> elements
      clonedDoc.querySelectorAll('style').forEach((styleEl) => {
        if (styleEl.textContent && /oklch|oklab|color-mix|light-dark/i.test(styleEl.textContent)) {
          styleEl.textContent = sanitizeUnsupportedCssColors(styleEl.textContent);
        }
      });

      clonedEl.style.position = 'relative';
      clonedEl.style.left = '0';
      clonedEl.style.top = '0';
      clonedEl.style.visibility = 'visible';
      clonedEl.style.opacity = '1';
      clonedEl.style.zIndex = '1';
      clonedEl.style.backgroundColor = '#ffffff';

      clonedEl.querySelectorAll('img').forEach((img) => {
        if (!img.complete || img.naturalWidth === 0) {
          img.style.display = 'none';
        }
      });
    },
  });

  return await canvasToPngResult(canvas);
};

export const captureQuotationDocument = async (
  containerOrElement: HTMLElement | null
): Promise<CapturedQuotationResult> => {
  if (!containerOrElement) {
    throw new Error('견적서 캡처 대상 영역을 찾을 수 없습니다. 화면을 새로고침한 후 다시 시도해주세요.');
  }

  // Prefer the dedicated inline-HEX A4 exact sheet (#a4-exact-print-sheet)
  const exactSheet =
    containerOrElement.id === 'a4-exact-print-sheet'
      ? containerOrElement
      : (containerOrElement.querySelector('#a4-exact-print-sheet') as HTMLElement | null);

  if (exactSheet) {
    return await captureSheetInIsolatedIframe(exactSheet);
  }

  return await captureFallbackElement(containerOrElement);
};

export const buildQuotationPdfBlob = async (
  captured: Pick<CapturedQuotationResult, 'dataUrl' | 'width' | 'height'>
): Promise<Blob> => {
  let imgWidthPx = captured.width;
  let imgHeightPx = captured.height;

  if (!imgWidthPx || !imgHeightPx) {
    const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
      const img = new Image();
      const timer = setTimeout(() => reject(new Error('견적서 이미지 로딩 시간이 초과되었습니다.')), 8000);
      img.onload = () => {
        clearTimeout(timer);
        resolve({ w: img.naturalWidth || img.width, h: img.naturalHeight || img.height });
      };
      img.onerror = () => {
        clearTimeout(timer);
        reject(new Error('견적서 이미지 디코딩에 실패했습니다.'));
      };
      img.src = captured.dataUrl;
    });
    imgWidthPx = dims.w;
    imgHeightPx = dims.h;
  }

  if (!imgWidthPx || !imgHeightPx) {
    throw new Error('유효한 견적서 이미지 크기를 읽을 수 없습니다.');
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidthMm = 210;
  const pageHeightMm = 297;
  const imgHeightMm = (imgHeightPx * pageWidthMm) / imgWidthPx;

  let heightLeftMm = imgHeightMm;
  let positionMm = 0;

  pdf.addImage(captured.dataUrl, 'PNG', 0, positionMm, pageWidthMm, imgHeightMm, undefined, 'FAST');
  heightLeftMm -= pageHeightMm;

  // 1mm tolerance prevents emitting an unnecessary blank trailing page from rounding
  while (heightLeftMm > 1) {
    positionMm = heightLeftMm - imgHeightMm;
    pdf.addPage();
    pdf.addImage(captured.dataUrl, 'PNG', 0, positionMm, pageWidthMm, imgHeightMm, undefined, 'FAST');
    heightLeftMm -= pageHeightMm;
  }

  return pdf.output('blob');
};

export const triggerBlobDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    // Keep object URL alive long enough for mobile browsers to initiate file write
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 15000);
  }
};
