
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

/**
 * 이미지 URL을 안전하게 정리해 반환합니다.
 * 브라우저 정적 캐시 효율을 위해 매 접속 시 강제로 ?t=타임스탬프를 붙이지 않고 저장된 URL(교체 시 ?v=버전 포함)을 그대로 사용합니다.
 */
export const getFreshImageUrl = (url: string | undefined | null): string => {
  if (!url || typeof url !== 'string') return '';
  return url.trim();
};

/**
 * 관리자가 이미지를 새로 업로드하거나 URL을 교체했을 때만 1회성 버전 쿼리(?v=timestamp)를 부여해
 * 기존 방문자의 브라우저 캐시를 즉시 갱신합니다. (data:, blob: URL 제외)
 */
export const withImageVersion = (url: string | undefined | null, version?: number): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('#')
  ) {
    return trimmed;
  }

  const ver = version ?? Date.now();
  if (/[?&]v=\d+/.test(trimmed)) {
    return trimmed.replace(/([?&]v=)\d+/, `$1${ver}`);
  }
  if (/[?&]t=\d+/.test(trimmed)) {
    return trimmed.replace(/([?&])t=\d+/, `$1v=${ver}`);
  }

  const separator = trimmed.includes('?') ? '&' : '?';
  return `${trimmed}${separator}v=${ver}`;
};

/**
 * 아이콘 문자열이 이미지 URL(http, https, /, data:image, blob:)인지 판별합니다.
 */
export const isImageIconUrl = (icon?: string | null): boolean => {
  if (!icon || typeof icon !== 'string') return false;
  const trimmed = icon.trim();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:image') ||
    trimmed.startsWith('blob:')
  );
};

