
/**
 * 이미지 파일을 압축합니다.
 * @param file 압축할 파일 객체
 * @param maxWidth 최대 가로 너비
 * @param maxHeight 최대 세로 높이
 * @param quality 품질 (0.0 ~ 1.0)
 * @returns 압축된 Blob 객체
 */
export const compressImage = (
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.7
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context is null'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
};

// 페이지 접속 시점의 고유 타임스탬프 (밀리초)
export const PAGE_LOAD_TIMESTAMP = typeof window !== 'undefined' && (window as any).__PAGE_LOAD_TIMESTAMP__ 
  ? (window as any).__PAGE_LOAD_TIMESTAMP__ 
  : Date.now();

/**
 * 이미지 URL 뒤에 캐시 방지용 타임스탬프(?t=현재시간)를 자동으로 덧붙여 항상 최신 이미지를 불러오도록 합니다.
 * data:, blob: URL 및 이미 타임스탬프가 붙은 URL은 보존합니다.
 * @param url 원본 이미지 URL
 * @param timestamp 부여할 타임스탬프 (기본값: 페이지 접속 시각)
 */
export const getFreshImageUrl = (
  url: string | undefined | null, 
  timestamp: number = PAGE_LOAD_TIMESTAMP
): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // base64 data URI, blob URL, SVG 인라인, 앵커 링크 등은 캐시 방지 불필요 및 제외
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('#')
  ) {
    return trimmed;
  }

  // 이미 ?t= 또는 &t= 타임스탬프가 있다면 유지 (중복 방지)
  if (/[?&]t=\d+/.test(trimmed)) {
    return trimmed;
  }

  const separator = trimmed.includes('?') ? '&' : '?';
  return `${trimmed}${separator}t=${timestamp}`;
};
